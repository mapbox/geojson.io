import { fcLineString, pointFeature } from 'test/helpers';
import { describe, expect, it } from 'vitest';
import { COPIERS } from './copiers';

describe('COPIERS', () => {
  it(`COPIER.wkt`, async () => {
    await expect(COPIERS.wkt(pointFeature)).resolves.toEqualRight(
      'POINT (0 1)'
    );
  });
  it(`COPIER.geojson`, async () => {
    await expect(COPIERS.geojson(pointFeature)).resolves.toEqualRight(
      JSON.stringify(pointFeature)
    );
  });
  it(`COPIER.coordinates`, async () => {
    await expect(COPIERS.coordinates(pointFeature)).resolves.toEqualRight(
      '0,1'
    );
  });
  it(`COPIER.geohash`, async () => {
    await expect(COPIERS.geohash(fcLineString.features[0])).resolves.toBeLeft();
    await expect(COPIERS.geohash(pointFeature)).resolves.toEqualRight(
      'ebpvxypcr'
    );
  });
  it(`COPIER.bbox`, async () => {
    await expect(COPIERS.bbox(pointFeature)).resolves.toEqualRight('0,1,0,1');
  });
  it(`COPIER.polyline`, async () => {
    await expect(COPIERS.polyline(pointFeature)).resolves.toBeLeft();
    await expect(
      COPIERS.polyline(fcLineString.features[0])
    ).resolves.toEqualRight('??_ibE_ibE_ibE_ibE');
  });
});
