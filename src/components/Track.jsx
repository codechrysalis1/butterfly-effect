import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withGoogleMap, GoogleMap } from "react-google-maps";

import './styles/admin.css';

const TrackMap = withGoogleMap(props => {
  return (
    <GoogleMap 
      defaultZoom={10}
      center={ props.mapCenter }
    />
  );
});

class Track extends Component {
  render() {
    return (
      <div >
        <TrackMap
          containerElement={ <div style={{ height: `1000px`,width:"1000px" }} /> }
          mapElement={ <div style={{ height: `100%` }} /> }
          mapCenter={ this.props.mapCenter }
        />
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
    mapCenter: state.mapCenter
  };
}

const mapDispatchToProps = dispatch => {
  return {
    setMapCenter: center => {
      dispatch({ type: 'SET_MAP_CENTER', center });
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Track);
