import { collapseGeoJSON } from 'app/lib/collapse_geojson';
import {
  fcLineString,
  fcMultiLineString,
  fcMultiPoint,
  fcMultiPoly,
  fcTwoPoly,
  twoPoints
} from 'test/helpers';
import { expect, test } from 'vitest';

test('collapseGeoJSON', () => {
  expect(collapseGeoJSON(twoPoints)).toEqual({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: null,
        geometry: {
          type: 'MultiPoint',
          coordinates: [
            [0, 1],
            [2, 3]
          ]
        }
      }
    ]
  });
  expect(collapseGeoJSON(fcTwoPoly)).toMatchInlineSnapshot(`
    {
      "features": [
        {
          "geometry": {
            "coordinates": [
              [
                [
                  [
                    0,
                    0,
                  ],
                  [
                    1,
                    2,
                  ],
                  [
                    2,
                    3,
                  ],
                  [
                    0,
                    0,
                  ],
                ],
              ],
              [
                [
                  [
                    0.1,
                    0.1,
                  ],
                  [
                    0.9,
                    1.9,
                  ],
                  [
                    1.9,
                    2.9,
                  ],
                  [
                    0.1,
                    0.1,
                  ],
                ],
              ],
            ],
            "type": "MultiPolygon",
          },
          "properties": null,
          "type": "Feature",
        },
      ],
      "type": "FeatureCollection",
    }
  `);
  expect(collapseGeoJSON(fcMultiPoly)).toMatchInlineSnapshot(`
    {
      "features": [
        {
          "geometry": {
            "coordinates": [
              [
                [
                  [
                    0,
                    0,
                  ],
                  [
                    1,
                    2,
                  ],
                  [
                    2,
                    3,
                  ],
                  [
                    0,
                    0,
                  ],
                ],
              ],
            ],
            "type": "MultiPolygon",
          },
          "properties": null,
          "type": "Feature",
        },
      ],
      "type": "FeatureCollection",
    }
  `);
  expect(collapseGeoJSON(fcLineString)).toMatchInlineSnapshot(`
    {
      "features": [
        {
          "geometry": {
            "coordinates": [
              [
                [
                  0,
                  0,
                ],
                [
                  1,
                  1,
                ],
                [
                  2,
                  2,
                ],
              ],
            ],
            "type": "MultiLineString",
          },
          "properties": null,
          "type": "Feature",
        },
      ],
      "type": "FeatureCollection",
    }
  `);
  expect(collapseGeoJSON(fcMultiPoint)).toMatchInlineSnapshot(`
    {
      "features": [
        {
          "geometry": {
            "coordinates": [
              [
                0,
                0,
              ],
              [
                1,
                1,
              ],
            ],
            "type": "MultiPoint",
          },
          "properties": null,
          "type": "Feature",
        },
      ],
      "type": "FeatureCollection",
    }
  `);
  expect(collapseGeoJSON(fcMultiLineString)).toMatchInlineSnapshot(`
    {
      "features": [
        {
          "geometry": {
            "coordinates": [
              [
                [
                  0,
                  0,
                ],
                [
                  1,
                  1,
                ],
                [
                  2,
                  2,
                ],
              ],
            ],
            "type": "MultiLineString",
          },
          "properties": null,
          "type": "Feature",
        },
      ],
      "type": "FeatureCollection",
    }
  `);
});
