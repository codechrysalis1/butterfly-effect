// This is server-side code, rule is intended for client, console.error() is required.
/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

const express = require('express');

const router = express.Router();
const uuidv4 = require('uuid/v4');
const Dijkstra = require('../utils/droneController');
const helper = require('../utils/dbHelper');

const { getStations, storeTrip, storeSegments, storePlaces, getPlace, getTrip, getSegments, getTelemetry } = helper;

const distance = (a, b) => {
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(a.lat - b.lat);
  const dLng = deg2rad(a.lng - b.lng);
  const A = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(b.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * C; // Distance in km
};

module.exports = (services) => {
  const getStations = async () => {
    const stations = (await services.db.place.list()).map((station) => {
      return {
        id: station.id,
        lat: parseFloat(station.latitude),
        lng: parseFloat(station.longitude),
      };
    });
    console.log(`All stations: ${stations.length}`);
    const tokyo = { lat: 35.6895, lng: 139.6917 };
    return stations.filter(station =>
      distance(tokyo, station) < 2,
    );
  };

  router.get('/stations', async (req, res) => {
    try {
      const stations = await getStations();
      console.log(`Stations near Tokyo: ${stations.length}`);
      res.status(200).json(stations);
    } catch (err) {
      console.error('Error connecting db:', err);
      res.status(400).json({ status: 'error', message: 'Bad Request' });
    }
  });

  router.post('/calculate', async (req, res) => {
    try {
      const stations = await getStations();
      console.log(`Stations near Tokyo: ${stations.length}`);
      const dijkstra = new Dijkstra(req.body.from, req.body.dest, { MAX_DISTANCE: 2 }, stations);
      const result = await dijkstra.solve();
      console.log('result', result);
      res.json(result);
    } catch (err) {
      console.error('Error connecting db:', err);
      res.status(400).json({ status: 'error', message: 'Bad Request' });
    }
  });

  router.post('/routes', async (req, res) => {
    try {
      const routes = req.body.route;
      console.log('Routes:', routes);
      const trip = {
        tracknum: uuidv4(),
        status: 'inprogress',
      };
      const tripid = await storeTrip(trip);
      console.log('Trip stored at id:', tripid);

      let sourceId = 0;
      let desId = 0;
      for (let i = 0, length = routes.length; i < length; i += 1) {
        if (routes[i].name === 'source' || routes[i].name === 'destination') {
          const route = {
            type: routes[i].name,
            latitude: routes[i].lat,
            longitude: routes[i].lng,
          };
          if (routes[i].name === 'source') {
            sourceId = await storePlaces(route);
          } else {
            desId = await storePlaces(route);
          }
        }
      }

      for (let i = 0, length = routes.length; i < length; i += 1) {
        if (i !== length - 1) {
          const segment = {
            trip_id: tripid,
            drone_id: i + 1,
          };

          if (routes[i].name === 'source') {
            segment.source_id = sourceId;
          } else if (routes[i].name === 'destination') {
            segment.source_id = desId;
          } else {
            segment.source_id = parseInt(routes[i].name, 10);
          }
          if (routes[i + 1].name === 'source') {
            segment.des_id = sourceId;
          } else if (routes[i + 1].name === 'destination') {
            segment.des_id = desId;
          } else {
            segment.des_id = parseInt(routes[i + 1].name, 10);
          }
          segment.status = i === 0 ? 'inprogress' : 'waiting';
          await storeSegments(segment);
        }
      }

      const ret = {
        status: 'success',
        tracknum: trip.tracknum,
      };
      console.log(ret);
      res.status(200).json(ret);
    } catch (err) {
      console.error('Error connecting db:', err);
      res.status(400).json({ status: 'error', message: 'Bad Request' });
    }
  });

  router.post('/track', async (req, res) => {
    try {
      const tracknum = req.body.trackingNumber;
      console.log('Tracking number:', tracknum);
      const trip = await getTrip(tracknum);
      const segments = await getSegments(trip.id);

      let telemetry = {};
      for (let i = 0, length = segments.length; i < length; i += 1) {
        if (segments[i].status === 'inprogress') {
          const droneId = segments[i].drone_id;
          telemetry = await getTelemetry(droneId);
        }
      }

      const route = [];
      for (let i = 0, length = segments.length; i < length; i += 1) {
        const source = await getPlace(segments[i].source_id);
        const dest = await getPlace(segments[i].des_id);
        route.push({
          id: segments[i].id,
          sourceType: source.type,
          sourceLat: parseFloat(source.latitude),
          sourceLng: parseFloat(source.longitude),
          destType: dest.type,
          destLat: parseFloat(dest.latitude),
          destLng: parseFloat(dest.longitude),
        });
      }

      const ret = {
        route,
        telemetry,
      };
      console.log('ret', ret);
      res.status(200).json(ret);
    } catch (err) {
      console.error('Error connecting db:', err);
      res.status(400).json({ status: 'error', message: 'Bad Request' });
    }
  });

}