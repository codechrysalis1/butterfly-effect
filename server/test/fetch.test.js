const AirspaceChecker = require('../lib/AirspaceChecker');
const FakeAirspaceChecker = require('../lib/FakeAirspaceChecker');
const assert = require('chai').assert;

describe('AirspaceChecker', () => {
  xit('should not fly in bad zones', async () => {
    const origin = [139.7690696, 35.5487166];
    const dest = [139.8700009, 35.4998496];
    const result = await AirspaceChecker.checkSpace(origin, dest);
    assert(result === false, 'drone should not be allowed to fly here');
  });

  xit('should fly in good zones', async () => {
    const origin = [139.7132626, 35.6668205];
    const dest = [139.7131468, 35.6668205];
    const result = await AirspaceChecker.checkSpace(origin, dest);
    assert(result === true, 'drone should be allow to fly here');
  });
});

describe('FakeAirspaceChecker', () => {
  it('should not fly in bad zones', async () => {
    const origin = [139.7690696, 35.5487166];
    const dest = [139.8700009, 35.4998496];
    const result = await FakeAirspaceChecker.checkSpace(origin, dest);
    assert(result === false, 'drone should not be allowed to fly here');
  });

  it('should fly in good zones', async () => {
    const origin = [139.7132626, 35.6668205];
    const dest = [139.7131468, 35.6668205];
    const result = await FakeAirspaceChecker.checkSpace(origin, dest);
    assert(result === true, 'drone should be allow to fly here');
  });
});
