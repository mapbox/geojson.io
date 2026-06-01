import { getIssues } from '@placemarkio/check-geojson';
import { geometryTypes } from 'app/lib/constants';
import {
  getInitialCtx,
  removeCoincidents,
  rough
} from 'app/lib/roughly_geojson';
import { features } from 'test/helpers';
import { describe, expect, it } from 'vitest';

it('removeCoincidents', () => {
  const ctx = getInitialCtx({
    removeCoincidents: true
  });
  const ok = [
    [0, 0],
    [1, 2]
  ];
  expect(removeCoincidents(ctx, ok)).toEqual(ok);

  const bad = [
    [0, 0],
    [0, 0],
    [1, 2]
  ];
  expect(removeCoincidents(ctx, bad)).toEqual([
    [0, 0],
    [1, 2]
  ]);

  expect(
    removeCoincidents(ctx, [
      [0, 0],
      [0, 0],
      [1, 2],
      [1, 2]
    ])
  ).toEqual(ok);

  expect(
    removeCoincidents(ctx, [
      [0, 0],
      [0, 0],
      [0, 0],
      [1, 2],
      [1, 2]
    ])
  ).toEqual(ok);

  expect(
    removeCoincidents(ctx, [
      [0, 0],
      [0, 0],
      [0, 0],
      [1, 2],
      [1, 2],
      [1, 2],
      [1, 2]
    ])
  ).toEqual(ok);

  expect(removeCoincidents(ctx, [])).toEqual([]);
});

describe('roughly', () => {
  it('coincident point removal', () => {
    expect(
      rough({
        type: 'LineString',
        coordinates: [
          [0, 0],
          [0, 0],
          [1, 1]
        ]
      }).unsafeCoerce()
    ).toHaveProperty(
      ['geojson', 'features', '0', 'geometry', 'coordinates'],
      [
        [0, 0],
        [1, 1]
      ]
    );

    expect(
      rough({
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 0],
            [1, 1],
            [0, 0]
          ]
        ]
      }).unsafeCoerce()
    ).toHaveProperty(
      ['geojson', 'features', '0', 'geometry', 'coordinates'],
      [
        [
          [0, 0],
          [1, 1],
          [0, 0]
        ]
      ]
    );
  });
  it('pass-throughs valid geometries', () => {
    for (const feature of features) {
      expect(getIssues(JSON.stringify(feature))).toHaveLength(0);
      expect(rough(feature)).toEqualRight({
        geojson: {
          type: 'FeatureCollection',
          features: [feature]
        },
        type: 'geojson',
        notes: []
      });
      expect(rough(feature.geometry)).toEqualRight({
        geojson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: feature.geometry,
              properties: {}
            }
          ]
        },
        type: 'geojson',
        notes: []
      });

      expect(
        rough({
          type: 'FeatureCollection',
          features: [feature]
        })
      ).toEqualRight({
        geojson: {
          type: 'FeatureCollection',
          features: [feature]
        },
        type: 'geojson',
        notes: []
      });
    }

    expect(rough(features)).toEqualRight({
      geojson: {
        type: 'FeatureCollection',
        features
      },
      type: 'geojson',
      notes: []
    });

    expect(
      rough({
        type: 'FeatureCollection',
        features
      })
    ).toEqualRight({
      geojson: {
        type: 'FeatureCollection',
        features
      },
      type: 'geojson',
      notes: []
    });
  });

  it('rejected inputs', () => {
    for (const val of [null, false, true, 0, 'hi', undefined]) {
      expect(rough(val)).toBeLeft();
    }
  });

  it('partial correctness', () => {
    expect(
      rough({
        type: 'FeatureCollection',
        features: [false, features[0], null]
      })
    ).toEqualRight({
      geojson: {
        type: 'FeatureCollection',
        features: [features[0]]
      },
      type: 'geojson',
      notes: [
        'Rejected invalid feature #0: not an object',
        'Rejected invalid feature #2: not an object'
      ]
    });

    for (const features of [[2]]) {
      expect(
        rough({
          type: 'FeatureCollection',
          features
        })
      ).toBeLeft();
    }

    for (const features of [1, true, false, null]) {
      expect(
        rough({
          type: 'FeatureCollection',
          features
        })
      ).toBeLeft();
    }
  });

  it('properties correction', () => {
    expect(
      rough({
        ...features[0],
        properties: 42
      })
    ).toEqualRight({
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            ...features[0],
            properties: { value: 42 }
          }
        ]
      },
      type: 'geojson',
      notes: [
        "Feature #0's properties were not an object: transformed into one"
      ]
    });

    expect(
      rough({
        ...features[0],
        properties: [42]
      }).unsafeCoerce()
    ).toHaveProperty(['geojson', 'features', '0', 'properties'], {
      value: [42]
    });

    const { properties, ...restOfTheFeature } = features[0];

    expect(
      rough({
        type: 'GeometryCollection',
        geometries: [null, 2, features[0].geometry, 3, 4]
      })
    ).toEqualRight({
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'GeometryCollection',
              geometries: [features[0].geometry]
            }
          }
        ]
      },
      type: 'geojson',
      notes: []
    });

    expect(rough(restOfTheFeature)).toEqualRight({
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            ...features[0],
            properties: {}
          }
        ]
      },
      type: 'geojson',
      notes: []
    });
  });

  it('rejected geometries', () => {
    expect(
      rough({
        type: 'FeatureCollection',
        features: [
          {
            type: 'F',
            geometry: null
          }
        ]
      }).extract()
    ).toHaveProperty(
      'message',
      'No features were importable in this GeoJSON file'
    );
    expect(
      rough({
        type: 'FeatureCollection',
        features: [
          {
            type: 'F',
            geometry: null,
            properties: {}
          }
        ]
      }).extract()
    ).toHaveProperty('notes', ["Feature #0's invalid geometry removed"]);
    expect(
      rough({
        type: 'Poi',
        coordinates: [1, 2]
      }).extract()
    ).toHaveProperty(
      'message',
      'No features were importable in this GeoJSON file'
    );
    for (const type of geometryTypes) {
      for (const coordinates of [
        [],
        'hi',
        [0],
        [[0]],
        [[[0]]],
        [[]],
        [[[[[]]]]],
        [[[]]]
      ]) {
        expect(
          rough({
            type,
            coordinates
          }).extract()
        ).toHaveProperty(
          'message',
          'No features were importable in this GeoJSON file'
        );
      }
    }

    expect(
      rough({
        type: 'GeometryCollection',
        geometries: [null, 2, 3, 4]
      }).extract()
    ).toHaveProperty(
      'message',
      'No features were importable in this GeoJSON file'
    );

    expect(
      rough({
        type: 'GeometryCollection',
        geometries: [
          null,
          {
            type: 'Point',
            coordinates: [1, 2]
          }
        ]
      }).extract()
    ).toMatchInlineSnapshot(`
      {
        "geojson": {
          "features": [
            {
              "geometry": {
                "geometries": [
                  {
                    "coordinates": [
                      1,
                      2,
                    ],
                    "type": "Point",
                  },
                ],
                "type": "GeometryCollection",
              },
              "properties": {},
              "type": "Feature",
            },
          ],
          "type": "FeatureCollection",
        },
        "notes": [],
        "type": "geojson",
      }
    `);
  });
});
