import { twoPoints } from 'test/helpers';
import { describe, expect, it } from 'vitest';
import { GeoJSONLToGeoJSON, GeoJSONToGeoJSONL } from './geojsonl';

describe('GeoJSONLToGeoJSON', () => {
  it('is symmetric', () => {
    expect(GeoJSONLToGeoJSON(GeoJSONToGeoJSONL(twoPoints))).toEqualRight(
      twoPoints
    );
  });

  it('can handle mixed types', () => {
    expect(
      GeoJSONLToGeoJSON(
        [
          JSON.stringify(twoPoints),
          JSON.stringify(twoPoints.features[0]),
          JSON.stringify(twoPoints.features[0].geometry)
        ].join('\n')
      )
    ).toMatchInlineSnapshot(`
      {
        "features": [
          {
            "geometry": {
              "coordinates": [
                0,
                1,
              ],
              "type": "Point",
            },
            "properties": {
              "a": 1,
            },
            "type": "Feature",
          },
          {
            "geometry": {
              "coordinates": [
                2,
                3,
              ],
              "type": "Point",
            },
            "properties": {
              "b": 1,
            },
            "type": "Feature",
          },
          {
            "geometry": {
              "coordinates": [
                0,
                1,
              ],
              "type": "Point",
            },
            "properties": {
              "a": 1,
            },
            "type": "Feature",
          },
          {
            "geometry": {
              "coordinates": [
                0,
                1,
              ],
              "type": "Point",
            },
            "properties": {},
            "type": "Feature",
          },
        ],
        "type": "FeatureCollection",
      }
    `);
  });
});
