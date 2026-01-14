import { Just, Nothing } from 'purify-ts/Maybe';
import {
  fcGeometryCollection,
  fcLineString,
  fcMultiLineString,
  fcMultiPoint,
  fcMultiPoly,
  fcPoly,
  fcTwoPoly,
  point,
  realMultiLineString,
  twoPoints
} from 'test/helpers';
import type { Geometry, IFeatureCollection, LineString } from 'types';
import { describe, expect, it, test } from 'vitest';
import {
  addBbox,
  bboxToPolygon,
  bufferPoint,
  e6,
  e6bbox,
  e6geojson,
  e6position,
  extendExtent,
  formatCoordinates,
  getExtent,
  getExtents,
  isBBoxEmpty,
  isRectangleNonzero,
  midpoint,
  padBBox,
  parseBBOX,
  parseCoordinates,
  polygonFromPositions,
  removeDegenerates
} from './geometry';

test('bufferPoint', () => {
  expect(bufferPoint({ x: 0, y: 0 } as unknown as mapboxgl.Point)).toEqual([
    [-10, -10],
    [10, 10]
  ]);
});

test('formatCoordinates', () => {
  expect(formatCoordinates([0, 0])).toEqual('0S, 0W');
  expect(formatCoordinates([0, 1])).toEqual('1N, 0W');
  expect(formatCoordinates([12.2, 10 / 3])).toEqual('3.333N, 12.2E');
});

test('isBBoxEmpty', () => {
  expect(isBBoxEmpty([-1, 0, -1, 0])).toBeTruthy();
  expect(isBBoxEmpty([-2, 0, -1, 0])).toBeFalsy();
});

test('padBBox', () => {
  expect(padBBox([0, 1, 0, 1], 2)).toEqual([-2, -1, 2, 3]);
});

describe('parseCoordinates', () => {
  it('base case of nothing', () => {
    expect(parseCoordinates('')).toBeLeft();
    expect(parseCoordinates(' ')).toBeLeft();
  });

  it('invalid inputs', () => {
    expect(parseCoordinates('1 1 1')).toBeLeft();
    expect(parseCoordinates('1 1 1 foo')).toBeLeft();
  });

  it('comma-separated', () => {
    expect(parseCoordinates('-1,1')).toEqualRight([-1, 1]);
  });
});

describe('parseBBOX', () => {
  it('base case of nothing', () => {
    expect(parseBBOX('')).toBeLeft();
    expect(parseBBOX(' ')).toBeLeft();
  });

  it('invalid inputs', () => {
    expect(parseBBOX('1 1 1')).toBeLeft();
    expect(parseBBOX('1 1 1 foo')).toBeLeft();
  });

  it('comma-separated', () => {
    expect(parseBBOX('-1,-1,1,1')).toEqualRight([-1, -1, 1, 1]);
  });

  it('space-separated', () => {
    expect(parseBBOX('-1 -1 1 1')).toEqualRight([-1, -1, 1, 1]);
  });

  it('JSON encoded', () => {
    expect(parseBBOX(JSON.stringify([-1, -1, 1, 1]))).toEqualRight([
      -1, -1, 1, 1
    ]);
  });

  it('JSON encoded and stringy', () => {
    expect(parseBBOX(JSON.stringify(['-1', '-1', '1', '1.2']))).toEqualRight([
      -1, -1, 1, 1.2
    ]);
  });
});

test('polygonFromPositions', () => {
  expect(polygonFromPositions([0, 0], [10, 10])).toEqual({
    coordinates: [
      [
        [0, 0],
        [0, 10],
        [10, 10],
        [10, 0],
        [0, 0]
      ]
    ],
    type: 'Polygon'
  });
});

describe('isRectangleNonzero', () => {
  it('is false for non-polygons', () => {
    expect(
      isRectangleNonzero({
        type: 'Feature',
        properties: {},
        geometry: {
          coordinates: [
            [
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0]
            ]
          ],
          type: 'Polygon'
        }
      })
    ).toBeFalsy();
  });
  it('is true for a real rectangle', () => {
    expect(
      isRectangleNonzero({
        type: 'Feature',
        properties: {},
        geometry: {
          coordinates: [
            [
              [0, 0],
              [0, 10],
              [10, 10],
              [10, 0],
              [0, 0]
            ]
          ],
          type: 'Polygon'
        }
      })
    ).toBeTruthy();
    expect(
      isRectangleNonzero({
        type: 'Feature',
        properties: {},
        geometry: {
          coordinates: [
            [
              [0, 0],
              [0, 10],
              [10, 10],
              [10, 0],
              [0, 0]
            ]
          ],
          type: 'Polygon'
        }
      })
    ).toBeTruthy();
  });
});

test('midpoint', () => {
  expect(midpoint([0, 0], [10, 10])).toEqual([
    4.999999999999972, 5.019148099025145
  ]);
  expect(midpoint([0, 0], [0, 0])).toEqual([0, 0]);
  expect(midpoint([-200, -100], [-200, -100])).toEqual([-200, -90]);
});

describe('extent', () => {
  it('#addBbox', () => {
    expect(addBbox(fcLineString.features[0])).toHaveProperty(
      'bbox',
      [0, 0, 2, 2]
    );
  });

  it('#extendExtent', () => {
    expect(extendExtent(Nothing, getExtent(fcMultiPoint))).toEqual(
      Just([0, 0, 1, 1])
    );
    expect(extendExtent(Nothing, Nothing)).toEqual(Nothing);
    expect(
      extendExtent(getExtent(fcMultiPoint), getExtent(fcLineString))
    ).toEqual(Just([0, 0, 2, 2]));
  });

  it('#getExtent', () => {
    expect(getExtent(fcMultiPoint)).toEqual(Just([0, 0, 1, 1]));

    expect(
      getExtent({
        type: 'MultiLineString',
        coordinates: [
          [
            [0, 0],
            [1, 1]
          ]
        ]
      })
    ).toEqual(Just([0, 0, 1, 1]));

    expect(getExtent(fcLineString)).toEqual(Just([0, 0, 2, 2]));
    expect(getExtent(fcPoly)).toEqual(Just([0, 0, 2, 3]));
    expect(getExtent(fcMultiPoly)).toEqual(Just([0, 0, 2, 3]));

    expect(
      getExtent({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: null,
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      })
    ).toEqual(Just([0, 0, 0, 0]));

    expect(
      getExtent({
        type: 'Feature',
        properties: null,
        geometry: null
      })
    ).toEqual(Nothing);

    expect(
      getExtent({
        type: 'Feature',
        properties: null,
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      })
    ).toEqual(Just([0, 0, 0, 0]));

    expect(
      getExtent({
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Point',
            coordinates: [0, 0]
          }
        ]
      })
    ).toEqual(Just([0, 0, 0, 0]));

    expect(
      getExtent({
        type: 'Point',
        coordinates: [0, 0]
      })
    ).toEqual(Just([0, 0, 0, 0]));
  });
});

test('bboxToPolygon', () => {
  expect(getExtent(bboxToPolygon([-2, -4, 2, 4]))).toEqual(
    Just([-2, -4, 2, 4])
  );
});

describe('e6', () => {
  test('e6', () => {
    expect(e6(1)).toEqual(1);
    expect(e6(1.1)).toEqual(1.1);
    expect(e6(1 / 3)).toEqual(0.333333);
  });
  test('e6bbox', () => {
    expect(e6bbox([1, 2, 3, 4])).toEqual('1,2,3,4');
    expect(e6bbox([1 + 1 / 1e7, 2, 3, 4])).toEqual('1,2,3,4');
  });
  test('e6position', () => {
    expect(e6position([1, 2])).toEqual([1, 2]);
    expect(e6position([1 + 1 / 1e7, 2])).toEqual([1, 2]);
  });
  test('e6geojson', () => {
    expect(
      e6geojson({
        type: 'Point',
        coordinates: [1 / 3, 1 / 3]
      })
    ).toEqual({
      type: 'Point',
      coordinates: [0.333333, 0.333333]
    });

    expect(
      e6geojson({
        type: 'MultiPoint',
        coordinates: [[1 / 3, 1 / 3]]
      })
    ).toEqual({
      type: 'MultiPoint',
      coordinates: [[0.333333, 0.333333]]
    });

    const lsInput: LineString = {
      type: 'LineString',
      coordinates: [[1 / 3, 2 / 3]]
    };

    const lsOutput: LineString = {
      type: 'LineString',
      coordinates: [[0.333333, 0.666667]]
    };

    expect(e6geojson(lsInput)).toEqual(lsOutput);
    expect(
      e6geojson({
        type: 'GeometryCollection',
        geometries: [lsInput]
      })
    ).toEqual({
      type: 'GeometryCollection',
      geometries: [lsOutput]
    });

    const lsCoordsIn = [[1 / 3, 2 / 3]];
    const lsCoordsOut = [[0.333333, 0.666667]];

    expect(e6geojson(fcMultiPoly)).toEqual(fcMultiPoly);

    expect(
      e6geojson({
        type: 'Feature',
        properties: null,
        geometry: {
          type: 'LineString',
          coordinates: lsCoordsIn
        }
      })
    ).toEqual({
      type: 'Feature',
      properties: null,
      geometry: {
        type: 'LineString',
        coordinates: lsCoordsOut
      }
    });

    expect(
      e6geojson({
        type: 'Feature',
        properties: null,
        geometry: {
          type: 'MultiLineString',
          coordinates: [lsCoordsIn]
        }
      })
    ).toEqual({
      type: 'Feature',
      properties: null,
      geometry: {
        type: 'MultiLineString',
        coordinates: [lsCoordsOut]
      }
    });
  });
});

function g(fc: IFeatureCollection) {
  return fc.features[0].geometry;
}

describe('removeDegenerates', () => {
  it('valid', () => {
    expect(removeDegenerates(g(fcLineString))).toEqual(g(fcLineString));
    expect(removeDegenerates(g(fcMultiPoly))).toEqual(g(fcMultiPoly));
    expect(removeDegenerates(g(fcMultiPoint))).toEqual(g(fcMultiPoint));
    expect(removeDegenerates(g(fcMultiLineString))).toEqual(
      g(fcMultiLineString)
    );
    expect(removeDegenerates(g(fcGeometryCollection))).toEqual(
      g(fcGeometryCollection)
    );
    expect(removeDegenerates(g(fcPoly))).toEqual(g(fcPoly));
    expect(removeDegenerates(point)).toEqual(point);
  });
  it('invalid', () => {
    const coordHavers: Geometry['type'][] = [
      'LineString',
      'Polygon',
      'MultiPolygon',
      'MultiPoint'
    ];
    for (const type of coordHavers) {
      expect(
        removeDegenerates({
          type,
          coordinates: []
        } as Geometry)
      ).toBeNull();
    }

    expect(
      removeDegenerates({
        type: 'LineString',
        coordinates: [[0, 0]]
      })
    ).toBeNull();

    expect(
      removeDegenerates({
        type: 'MultiLineString',
        coordinates: []
      })
    ).toBeNull();

    expect(
      removeDegenerates({
        type: 'MultiLineString',
        coordinates: [[[0, 0]]]
      })
    ).toBeNull();

    expect(
      removeDegenerates({
        type: 'Polygon',
        coordinates: [[[0, 0]]]
      })
    ).toBeNull();

    expect(
      removeDegenerates({
        type: 'GeometryCollection',
        geometries: []
      })
    ).toBeNull();
  });
});

describe('getExtents', () => {
  it('Point', () => {
    expect(getExtents(twoPoints.features[0])).toMatchInlineSnapshot(`
      [
        [
          0,
          1,
          0,
          1,
        ],
      ]
    `);
  });
  it('MultiPolygon', () => {
    expect(getExtents(fcMultiPoly.features[0])).toMatchInlineSnapshot(`
      [
        [
          0,
          0,
          2,
          3,
        ],
      ]
    `);
  });
  it('MultiLineString', () => {
    expect(getExtents(realMultiLineString)).toMatchInlineSnapshot(`
      [
        [
          0,
          0,
          2,
          2,
        ],
        [
          10,
          10,
          12,
          12,
        ],
      ]
    `);
  });
  it('GeometryCollection', () => {
    expect(getExtents(fcGeometryCollection.features[0])).toMatchInlineSnapshot(`
      [
        [
          0,
          1,
          0,
          1,
        ],
        [
          2,
          3,
          2,
          3,
        ],
      ]
    `);
  });
  it('Polygon', () => {
    expect(getExtents(fcTwoPoly.features[0])).toMatchInlineSnapshot(`
      [
        [
          0,
          0,
          2,
          3,
        ],
      ]
    `);
  });
  it('MultiPoint', () => {
    expect(getExtents(fcMultiPoint.features[0])).toMatchInlineSnapshot(`
      [
        [
          0,
          0,
          0,
          0,
        ],
        [
          1,
          1,
          1,
          1,
        ],
      ]
    `);
  });
});
