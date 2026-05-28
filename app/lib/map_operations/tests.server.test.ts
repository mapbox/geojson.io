import { getIssues } from '@placemarkio/check-geojson';
import { getExtent } from 'app/lib/geometry';
import { decodeId } from 'app/lib/id';
import {
  deleteFeatures,
  removeCoordinatesVertex
} from 'app/lib/map_operations/delete_features';
import { duplicateFeatures } from 'app/lib/map_operations/duplicate_features';
import { EMPTY_MOMENT } from 'app/lib/persistence/moment';
import { generateSyntheticPoints } from 'app/lib/pmap/generate_synthetic_points';
import { MersenneTwister19937, Random } from 'random-js';
import { USelection } from 'state';
import { SELECTION_NONE } from 'state/jotai';
import {
  fc,
  fcGeometryCollection,
  fcLineAndPoly,
  fcLineString,
  fcMultiLineString,
  fcMultiPoint,
  fcMultiPoly,
  fcPoly,
  fcPolyHoles,
  fcTwoPoly,
  fcTwoPolyContainable,
  features,
  geometryCollection2,
  multiPoly2,
  pointFeature,
  twoPoints,
  wrap
} from 'test/helpers';
import type {
  Feature,
  FeatureMap,
  IFeature,
  MultiPolygon,
  Polygon
} from 'types';
import { describe, expect, it } from 'vitest';
import {
  addInnerRing,
  CanInnerRingResult,
  canInnerRing
} from './add_inner_ring';
import { addLineStringCoordinate } from './add_line_string_coordinate';
import { addPolygonCoordinate } from './add_polygon_coordinate';
import { booleanFeatures } from './boolean_features';
import { closePolygon } from './close_polygon';
import { deletePropertyKey } from './delete_property_key';
import { divideFeature, divideFeatures } from './divide_feature';
import { getCoordinates, getCoordinatesMaybe } from './get_coordinates';
import { makeConvexHull } from './make_convex_hull';
import { mergeFeatures, mergeFeaturesMessage } from './merge_features';
import { polygonToLine } from './polygon_to_line';
import { popLineStringCoordinate } from './pop_line_string_coordinate';
import { rotateFeatures } from './rotate_features';
import { setCoordinates } from './set_coordinates';
import { spliceNewVertex } from './splice_new_vertex';
import { splitLine } from './split_line';
import { updatePropertyKey } from './update_property_key';
import { updatePropertyValue } from './update_property_value';

const engine = new Random(MersenneTwister19937.seed(1));

describe('map_operations', () => {
  describe('mergeFeaturesMessage', () => {
    it('Point', () => {
      expect(mergeFeaturesMessage(twoPoints.features)).toEqual(
        'Merge into MultiPoint'
      );
    });
    it('GeometryCollection', () => {
      expect(mergeFeaturesMessage(fcLineAndPoly.features)).toEqual(
        'Merge into GeometryCollection'
      );
    });
  });

  describe('mergeFeatures', () => {
    it('Point', () => {
      expect(mergeFeatures(fcMultiPoint.features)).toEqual(
        fcMultiPoint.features[0]
      );

      expect(mergeFeatures(twoPoints.features)).toEqual({
        type: 'Feature',
        properties: {
          a: 1,
          b: 1
        },
        geometry: {
          type: 'MultiPoint',
          coordinates: [
            [0, 1],
            [2, 3]
          ]
        }
      });
    });

    it('Polygon', () => {
      expect(mergeFeatures(fcMultiPoly.features)).toEqual(
        fcMultiPoly.features[0]
      );
      expect(mergeFeatures([...fcMultiPoly.features, ...fcPoly.features]))
        .toMatchInlineSnapshot(`
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
          "properties": {
            "x": 1,
          },
          "type": "Feature",
        }
      `);
      expect(mergeFeatures(fcPoly.features)).toMatchInlineSnapshot(`
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
        "properties": {
          "x": 1,
        },
        "type": "Feature",
      }
    `);
    });

    it('LineString', () => {
      expect(mergeFeatures(fcMultiLineString.features)).toEqual(
        fcMultiLineString.features[0]
      );

      expect(
        mergeFeatures([
          {
            type: 'Feature',
            properties: {
              x: 1
            },
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0]]
            }
          },
          {
            type: 'Feature',
            properties: null,
            geometry: {
              type: 'LineString',
              coordinates: [[1, 1]]
            }
          }
        ])
      ).toEqual({
        type: 'Feature',
        properties: {
          x: 1
        },
        geometry: {
          type: 'MultiLineString',
          coordinates: [[[0, 0]], [[1, 1]]]
        }
      });
    });

    it('merge into GeometryCollection', () => {
      expect(mergeFeatures(fcGeometryCollection.features)).toEqual(
        fcGeometryCollection.features[0]
      );
      expect(mergeFeatures(fcLineAndPoly.features)).toHaveProperty(
        ['geometry', 'type'],
        'GeometryCollection'
      );
    });
  });

  function randomVertexId(feature: Feature): VertexId | null {
    const vertexFeatures = generateSyntheticPoints(feature, 0).filter(
      (feature) => {
        return decodeId(feature.id as RawId).type === 'vertex';
      }
    );
    if (vertexFeatures.length === 0) return null;
    return decodeId(engine.pick(vertexFeatures).id as RawId) as VertexId;
  }

  function randomMidpointId(feature: Feature): MidpointId | null {
    const vertexFeatures = generateSyntheticPoints(feature, 0).filter(
      (feature) => {
        return decodeId(feature.id as RawId).type === 'midpoint';
      }
    );
    if (vertexFeatures.length === 0) return null;
    return decodeId(engine.pick(vertexFeatures).id as RawId) as MidpointId;
  }

  function randomFeature(): Feature {
    return engine.pick(features);
  }

  const ops = [
    function getRandomCoordinate(feature: Feature) {
      const id = randomVertexId(feature);
      if (!id) return feature;
      expect(getCoordinates(feature, id)).toBeTruthy();
      return feature;
    },
    function setRandomCoordinate(feature: Feature) {
      const vertexId = randomVertexId(feature);
      if (vertexId === null) return feature;
      const { feature: newFeature } = setCoordinates({
        feature: feature,
        vertexId,
        position: [engine.integer(-180, 180), engine.integer(-90, 90)]
      });
      expect(newFeature).toBeTruthy();
      return newFeature;
    },
    function doSpliceNewVertex(feature: Feature) {
      const id = randomMidpointId(feature);
      if (id === null) return feature;
      feature = spliceNewVertex({
        feature,
        id: id,
        position: [engine.integer(-180, 180), engine.integer(-90, 90)]
      });
      expect(feature).toBeTruthy();
      return feature;
    },
    function doMaybeUnwrap(feature: Feature) {
      if (feature.geometry?.type === 'GeometryCollection') {
        return {
          ...feature,
          geometry: engine.pick(feature.geometry.geometries)
        };
      }
      return feature;
    },
    function doMergeFeatures(feature: Feature) {
      feature = mergeFeatures([feature, randomFeature()]);
      expect(feature).toBeTruthy();
      return feature;
    },
    function doDivideFeature(feature: Feature) {
      divideFeature(feature);
      return feature;
    },
    function doGetExtent(feature: Feature) {
      getExtent(feature);
      return feature;
    }
  ];

  function randomOp(feature: Feature) {
    const op = engine.pick(ops);
    return op(feature);
  }

  describe('fuzz', () => {
    it('fuzz', () => {
      let feature = features[0];
      for (let i = 0; i < 1000; i++) {
        feature = randomOp(feature);
      }
      expect(feature).toBeTruthy();
    });
  });

  describe('splitLine', () => {
    it('split at start', () => {
      const res = splitLine({
        feature: fcLineString.features[0] as any,
        sel: {
          type: 'single',
          id: 'x',
          parts: [
            {
              type: 'vertex',
              featureId: 0,
              vertex: 0
            }
          ]
        }
      });
      expect(res).toHaveLength(1);
      expect(res).toHaveProperty(['0', 'geometry', 'coordinates', 'length'], 3);
    });

    it('no parts', () => {
      const res = splitLine({
        feature: fcLineString.features[0] as any,
        sel: {
          type: 'single',
          id: 'x',
          parts: []
        }
      });
      expect(res).toHaveLength(0);
    });

    it('split in middle', () => {
      const res = splitLine({
        feature: fcLineString.features[0] as any,
        sel: {
          type: 'single',
          id: 'x',
          parts: [
            {
              type: 'vertex',
              featureId: 0,
              vertex: 1
            }
          ]
        }
      });
      expect(res).toHaveLength(2);
      expect(res).toHaveProperty(['0', 'geometry', 'coordinates', 'length'], 2);
      expect(res).toHaveProperty(['1', 'geometry', 'coordinates', 'length'], 2);
    });
  });

  describe('spliceNewVertex', () => {
    it('splicing in a linestring vertex', () => {
      expect(
        spliceNewVertex({
          feature: fcLineString.features[0],
          id: {
            type: 'midpoint',
            featureId: 0,
            vertex: 0
          },
          position: [42, 20]
        })
      ).toHaveProperty(['geometry', 'coordinates', 'length'], 4);
    });

    it('splicing from predefs', () => {
      for (const feature of [
        fcLineString.features[0],
        fcMultiLineString.features[0],
        fcPoly.features[0],
        multiPoly2,
        geometryCollection2,
        fcMultiPoly.features[0],
        fcGeometryCollection.features[0]
      ]) {
        const midpoints = generateSyntheticPoints(feature, 0).filter(
          ({ id }) => decodeId(id as RawId).type === 'midpoint'
        );
        for (const mid of midpoints) {
          expect(
            spliceNewVertex({
              feature,
              id: decodeId(mid.id as RawId) as MidpointId,
              position: [42, 20]
            })
          ).toBeTruthy();
        }
      }
    });

    it('splicing in a polygon vertex', () => {
      expect(
        spliceNewVertex({
          feature: fcPoly.features[0],
          id: {
            type: 'midpoint',
            featureId: 0,
            vertex: 0
          },
          position: [42, 20]
        })
      ).toHaveProperty(['geometry', 'coordinates', '0', 'length'], 5);
    });

    it('splicing in a polygon vertex', () => {
      expect(
        spliceNewVertex({
          feature: fcPolyHoles.features[0] as any,
          id: {
            type: 'midpoint',
            featureId: 0,
            vertex: 16
          },
          position: [42, 20]
        })
      ).toHaveProperty(['geometry', 'coordinates', '1', 'length'], 9);
    });

    it('splicing in a multipolygon vertex', () => {
      expect(
        spliceNewVertex({
          feature: fcMultiPoly.features[0],
          id: {
            type: 'midpoint',
            featureId: 0,
            vertex: 0
          },
          position: [42, 20]
        })
      ).toHaveProperty(['geometry', 'coordinates', '0', '0', 'length'], 5);
    });
  });

  describe('makeConvexHull', () => {
    it('success', () => {
      expect(makeConvexHull([fcTwoPoly.features[0]])).toEqualRight({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [2, 3],
              [0, 0],
              [1, 2],
              [2, 3]
            ]
          ]
        },
        properties: {}
      });
      expect(
        makeConvexHull([fcMultiPoly.features[0]]).extract()
      ).toMatchSnapshot();
    });
    it('error', () => {
      expect(makeConvexHull([pointFeature])).toBeLeft();
      expect(makeConvexHull([pointFeature, pointFeature])).toBeLeft();
      expect(
        makeConvexHull([pointFeature, pointFeature, pointFeature])
      ).toBeLeft();
    });
  });

  describe('divideFeatures', () => {
    it('is identity for non-multi features', () => {
      expect(divideFeature(twoPoints.features[0])).toEqual(null);
      expect(divideFeatures(wrap(twoPoints))).toEqual({
        deleteFeatures: [],
        putFeatures: []
      });
      expect(divideFeature(fcLineString.features[0])).toEqual(null);
    });
    it('splits a multipoint into two points', () => {
      expect(divideFeature(fcMultiPoint.features[0])).toHaveLength(2);
      const div = divideFeatures(wrap(fcMultiPoint));
      expect(div.putFeatures).toHaveLength(2);
      expect(div.deleteFeatures).toHaveLength(1);
    });
    it('splits a multilinestring into two linestrings', () => {
      expect(divideFeature(fcMultiLineString.features[0])).toHaveLength(1);
    });
    it('splits a multipolygon into two polygons', () => {
      expect(divideFeature(fcMultiPoly.features[0])).toHaveLength(1);
    });
    it('splits a geometrycollection into two points', () => {
      expect(divideFeature(fcGeometryCollection.features[0])).toHaveLength(2);
    });
  });

  it('polygonToLine', () => {
    expect(polygonToLine(fcPoly.features[0] as IFeature<Polygon>))
      .toMatchInlineSnapshot(`
      {
        "geometry": {
          "coordinates": [
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
          "type": "LineString",
        },
        "properties": {
          "x": 1,
        },
        "type": "Feature",
      }
    `);
    expect(polygonToLine(fcMultiPoly.features[0] as IFeature<MultiPolygon>))
      .toMatchInlineSnapshot(`
      {
        "geometry": {
          "coordinates": [
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
          "type": "LineString",
        },
        "properties": {
          "x": 1,
        },
        "type": "Feature",
      }
    `);
  });

  it('updatePropertyValue', () => {
    expect(
      updatePropertyValue(
        {
          type: 'Feature',
          geometry: null,
          properties: {}
        },
        { key: 'x', value: '10' }
      )
    ).toHaveProperty('properties', { x: 10 });
    expect(
      updatePropertyValue(
        {
          type: 'Feature',
          geometry: null,
          properties: {}
        },
        { key: 'x', value: 'true' }
      )
    ).toHaveProperty('properties', { x: true });
    expect(
      updatePropertyValue(fc.features[0], { key: 'x', value: 'hello' })
    ).toHaveProperty('properties', { x: 'hello' });
    expect(
      updatePropertyValue(fc.features[0], { key: 'x', value: '2' })
    ).toHaveProperty('properties', { x: 2 });
    expect(
      updatePropertyValue(fc.features[0], { key: 'x', value: { yes: 2 } })
    ).toHaveProperty('properties', { x: { yes: 2 } });
    expect(
      updatePropertyValue(fc.features[0], {
        key: 'x',
        value: '42'
      })
    ).toHaveProperty('properties', { x: 42 });
  });

  describe('setCoordinates', () => {
    // it("set coordinates for a point", () => {
    //   expect(setCoordinates([1, 1], encodeVertex(0, 0))(mc(fc))).toHaveProperty(
    //     "geojson",
    //     f({
    //       type: "Feature",
    //       properties: {
    //         x: 1,
    //       },
    //       geometry: {
    //         type: "Point",
    //         coordinates: [1, 1],
    //       },
    //     })
    //   );
    // });
    it('setting a vertex in a linestring', () => {
      expect(
        setCoordinates({
          position: [42, 42],
          vertexId: { type: 'vertex', featureId: 0, vertex: 1 },
          feature: fcLineString.features[0]
        })
      ).toHaveProperty(
        ['feature', 'geometry', 'coordinates'],
        [
          [0, 0],
          [42, 42],
          [2, 2]
        ]
      );
    });

    it('splicing from predefs', () => {
      for (const feature of [
        fcLineString.features[0],
        fcMultiLineString.features[0],
        fcPoly.features[0],
        multiPoly2,
        geometryCollection2,
        fcMultiPoly.features[0],
        fcGeometryCollection.features[0]
      ]) {
        const vertexes = generateSyntheticPoints(feature, 0).filter(
          ({ id }) => decodeId(id as RawId).type === 'vertex'
        );
        for (const vert of vertexes) {
          expect(
            setCoordinates({
              feature,
              vertexId: decodeId(vert.id as RawId) as VertexId,
              position: [2, 2]
            })
          ).toBeTruthy();
        }
      }
    });

    it('setting a vertex in a MultiPoint', () => {
      expect(
        setCoordinates({
          position: [42, 42],
          vertexId: { type: 'vertex', featureId: 0, vertex: 1 },
          feature: fcMultiPoint.features[0]
        })
      ).toHaveProperty(
        ['feature', 'geometry', 'coordinates'],
        [
          [0, 0],
          [42, 42]
        ]
      );
    });

    it('setting a vertex in a rectangle but breaking it', () => {
      expect(
        setCoordinates({
          breakRectangle: true,
          position: [42, 24],
          vertexId: { type: 'vertex', featureId: 0, vertex: 1 },
          feature: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-44.232082538491966, 65.12972013072704],
                  [15.563140152432055, 65.12972013072704],
                  [15.563140152432055, 34.38375651659173],
                  [-44.232082538491966, 34.38375651659173],
                  [-44.232082538491966, 65.12972013072704]
                ]
              ]
            },
            properties: {}
          }
        })
      ).toMatchInlineSnapshot(`
        {
          "feature": {
            "geometry": {
              "coordinates": [
                [
                  [
                    -44.232082538491966,
                    65.12972013072704,
                  ],
                  [
                    42,
                    24,
                  ],
                  [
                    15.563140152432055,
                    34.38375651659173,
                  ],
                  [
                    -44.232082538491966,
                    34.38375651659173,
                  ],
                  [
                    -44.232082538491966,
                    65.12972013072704,
                  ],
                ],
              ],
              "type": "Polygon",
            },
            "properties": {},
            "type": "Feature",
          },
          "wasCircle": false,
          "wasRectangle": false,
        }
      `);
    });

    it('setting a vertex in a rectangle', () => {
      expect(
        setCoordinates({
          position: [42, 24],
          vertexId: { type: 'vertex', featureId: 0, vertex: 1 },
          feature: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-44.232082538491966, 65.12972013072704],
                  [15.563140152432055, 65.12972013072704],
                  [15.563140152432055, 34.38375651659173],
                  [-44.232082538491966, 34.38375651659173],
                  [-44.232082538491966, 65.12972013072704]
                ]
              ]
            },
            properties: {}
          }
        })
      ).toMatchInlineSnapshot(`
        {
          "feature": {
            "geometry": {
              "coordinates": [
                [
                  [
                    -44.232082538491966,
                    24,
                  ],
                  [
                    42,
                    24,
                  ],
                  [
                    42,
                    34.38375651659173,
                  ],
                  [
                    -44.232082538491966,
                    34.38375651659173,
                  ],
                  [
                    -44.232082538491966,
                    24,
                  ],
                ],
              ],
              "type": "Polygon",
            },
            "properties": {},
            "type": "Feature",
          },
          "wasCircle": false,
          "wasRectangle": true,
        }
      `);
    });

    it('setting a vertex in a polygon', () => {
      expect(
        setCoordinates({
          position: [42, 42],
          vertexId: { type: 'vertex', featureId: 0, vertex: 1 },
          feature: fcPoly.features[0]
        })
      ).toHaveProperty(
        ['feature', 'geometry', 'coordinates'],
        [
          [
            [0, 0],
            [42, 42],
            [2, 3],
            [0, 0]
          ]
        ]
      );
    });
  });

  it('deletePropertyKey', () => {
    expect(deletePropertyKey(fc.features[0], { key: 'x' })).toHaveProperty(
      'properties',
      {}
    );
  });

  const featureMap: FeatureMap = new Map(
    features.map((feature, i) => {
      const id = i.toString();
      return [
        id,
        {
          id: id,
          at: i.toString(),
          feature
        }
      ];
    })
  );

  describe('duplicateFeatures', () => {
    it('duplicating nothing', () => {
      expect(
        duplicateFeatures({
          featureMap,
          selection: SELECTION_NONE
        })
      ).toEqual({
        moment: EMPTY_MOMENT,
        newSelection: USelection.none()
      });
    });

    it('deleting multiple features', () => {
      const multiDuplicate = duplicateFeatures({
        featureMap,
        selection: {
          type: 'multi',
          ids: ['0', '1']
        }
      });
      expect(multiDuplicate.moment.putFeatures).toHaveLength(2);
    });
  });

  describe('popLineStringCoordinate', () => {
    it('Adding a coordinate', () => {
      expect(
        popLineStringCoordinate(fcLineString.features[0], { reverse: false })
      ).toHaveProperty(
        ['geometry', 'coordinates'],
        [
          [0, 0],
          [1, 1]
        ]
      );
    });
    it('reverse = true', () => {
      expect(
        popLineStringCoordinate(fcLineString.features[0], { reverse: true })
      ).toHaveProperty(
        ['geometry', 'coordinates'],
        [
          [1, 1],
          [2, 2]
        ]
      );
    });
  });

  function getVertexIds(f: Feature) {
    return generateSyntheticPoints(f, 0).flatMap((feature) => {
      const id = decodeId(feature.id as RawId);
      return id.type === 'vertex' ? [id] : [];
    });
  }

  describe('deleteFeatures', () => {
    it('deleting nothing', () => {
      expect(
        deleteFeatures({
          featureMap,
          selection: SELECTION_NONE
        })
      ).toEqual({
        moment: EMPTY_MOMENT,
        newSelection: USelection.none()
      });
    });

    it('target feature not found', () => {
      expect(
        deleteFeatures({
          featureMap,
          selection: {
            type: 'single',
            id: '300000',
            parts: [0 as unknown as VertexId]
          }
        })
      ).toEqual({
        moment: EMPTY_MOMENT,
        newSelection: USelection.none()
      });
    });

    it('deleting multiple features', () => {
      expect(
        deleteFeatures({
          featureMap,
          selection: {
            type: 'multi',
            ids: ['0', '1']
          }
        })
      ).toMatchInlineSnapshot(`
      {
        "moment": {
          "deleteFeatures": [
            "0",
            "1",
          ],
          "note": "Deleted features",
          "putFeatures": [],
        },
        "newSelection": {
          "type": "none",
        },
      }
    `);
    });

    it('deleting a linestring with no parts', () => {
      expect(
        deleteFeatures({
          featureMap,
          selection: {
            type: 'single',
            id: '0',
            parts: []
          }
        })
      ).toHaveProperty('newSelection', USelection.none());
    });

    it('deleting a few vertexes of a linestring', () => {
      const [f] = [...featureMap.values()];
      const vertexIds = getVertexIds(f.feature);
      expect(
        deleteFeatures({
          featureMap,
          selection: {
            type: 'single',
            id: '0',
            parts: [vertexIds[0]]
          }
        })
      ).toHaveProperty('newSelection', USelection.single('0'));
    });

    it('deleting enough vertexes to remove a feature entirely', () => {
      const [f] = [...featureMap.values()];
      const vertexIds = getVertexIds(f.feature);
      expect(
        deleteFeatures({
          featureMap,
          selection: {
            type: 'single',
            id: '0',
            parts: [vertexIds[0], vertexIds[1]]
          }
        })
      ).toHaveProperty('newSelection', USelection.none());
    });
  });

  it('removeCoordinatesVertex', () => {
    for (const f of featureMap.values()) {
      const vertexIds = getVertexIds(f.feature);
      for (const id of vertexIds) {
        const res = removeCoordinatesVertex(id, f.feature);
        if (res) {
          expect(getIssues(JSON.stringify(res))).toHaveLength(0);
        }
      }
    }
  });

  it('rotateFeatures', () => {
    expect(
      rotateFeatures(
        wrap(fcLineString),
        {
          lng: 10,
          lat: 10
        },
        {
          lng: 12,
          lat: 10
        }
      )
    ).toMatchSnapshot();

    expect(
      rotateFeatures(
        wrap(fcMultiPoint),
        {
          lng: 10,
          lat: 10
        },
        {
          lng: 12,
          lat: 10
        }
      )
    ).toMatchSnapshot();

    expect(
      rotateFeatures(
        wrap(fcMultiLineString),
        {
          lng: 10,
          lat: 10
        },
        {
          lng: 12,
          lat: 10
        }
      )
    ).toMatchSnapshot();
  });

  function vertex(n: number): VertexId {
    return { type: 'vertex', featureId: 0, vertex: n };
  }

  describe('getCoordinates', () => {
    it('setting a vertex in a linestring', () => {
      expect(getCoordinates(fcLineString.features[0], vertex(1))).toEqual([
        1, 1
      ]);
    });

    it('getting a vertex in a MultiPoint', () => {
      expect(getCoordinates(fcMultiPoint.features[0], vertex(1))).toEqual([
        1, 1
      ]);
    });

    it('getting a vertex in a polygon', () => {
      expect(getCoordinates(fcPoly.features[0], vertex(1))).toEqual([1, 2]);
    });

    it('invalid coordinate behavior', () => {
      expect(() => getCoordinates(fcPoly.features[0], vertex(100))).toThrow();
      expect(() =>
        getCoordinates(fcLineString.features[0], vertex(100))
      ).toThrow();
    });
  });

  describe('getCoordinatesMaybe', () => {
    it('getting a vertex in a polygon', () => {
      expect(getCoordinatesMaybe(fcPoly.features[0], vertex(10))).toBeNothing();
      expect(getCoordinatesMaybe(fcPoly.features[0], vertex(1))).toBeJust();
    });
  });

  describe('unionFeatures', () => {
    it('base case', () => {
      expect(
        booleanFeatures(fcTwoPoly.features, { op: 'union' }).extract()
      ).toBeTruthy();
      expect(
        booleanFeatures(fcTwoPoly.features, { op: 'union' }).extract()
      ).toHaveLength(1);
      expect(
        booleanFeatures(fcTwoPoly.features, { op: 'union' }).extract()
      ).toHaveProperty(['0', 'properties'], {
        hello: 'World',
        x: 1
      });
    });
    it('fuzz', () => {
      for (let i = 0; i < 100; i++) {
        const fs = engine.sample(features, engine.integer(2, 5));
        expect(() =>
          booleanFeatures(fs, {
            op: engine.pick(['union', 'intersection', 'difference'])
          })
        ).not.toThrow();
      }
    });
  });

  describe('updatePropertyKey', () => {
    it('updatePropertyKey', () => {
      expect(
        updatePropertyKey(fc.features[0], { key: 'x', newKey: 'y' })
      ).toHaveProperty(['properties'], { y: 1 });
    });
  });

  describe('closePolygon', () => {
    it('base case', () => {
      expect(
        closePolygon({
          type: 'Feature',
          properties: {
            x: 1
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 1],
                [2, 4]
              ]
            ]
          }
        })
      ).toEqual({
        type: 'Feature',
        properties: {
          x: 1
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 1],
              [2, 4],
              [0, 0]
            ]
          ]
        }
      });
    });
    it('closing > 4', () => {
      expect(
        closePolygon({
          type: 'Feature',
          properties: {
            x: 1
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 1],
                [1.5, 1.5],
                [2, 4],
                [2, 4]
              ]
            ]
          }
        })
      ).toMatchInlineSnapshot(`
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
                1.5,
                1.5,
              ],
              [
                0,
                0,
              ],
            ],
          ],
          "type": "Polygon",
        },
        "properties": {
          "x": 1,
        },
        "type": "Feature",
      }
    `);
    });
  });

  it('addPolygonCoordinate', () => {
    expect(
      addPolygonCoordinate(
        {
          type: 'Feature',
          properties: {
            x: 1
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0]]]
          }
        },
        [24, 24]
      )
    ).toEqual({
      type: 'Feature',
      properties: {
        x: 1
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [24, 24]
          ]
        ]
      }
    });
  });

  describe('addLineStringCoordinate', () => {
    it('Adding a coordinate', () => {
      expect(
        addLineStringCoordinate(fcLineString.features[0], {
          position: [1, 2],
          reverse: false
        })
      ).toHaveProperty(
        ['geometry', 'coordinates'],
        [
          [0, 0],
          [1, 1],
          [2, 2],
          [1, 2]
        ]
      );
    });
    it('unshift a coordinate to the front', () => {
      expect(
        addLineStringCoordinate(fcLineString.features[0], {
          position: [1, 2],
          reverse: true
        })
      ).toHaveProperty(
        ['geometry', 'coordinates'],
        [
          [1, 2],
          [0, 0],
          [1, 1],
          [2, 2]
        ]
      );
    });
  });

  describe('inner ring', () => {
    describe('canAddInnerRing', () => {
      it('throws if a polygon is not fully contained', () => {
        expect(canInnerRing(fcTwoPoly.features)).toEqual(
          CanInnerRingResult.Yes
        );
      });
    });
    describe('addInnerRing', () => {
      it('throws if a polygon is not fully contained', () => {
        expect(
          addInnerRing(fcTwoPoly.features[0], fcTwoPoly.features[1])
        ).toBeLeft();
      });
      it('combines polygons', () => {
        expect(
          addInnerRing(
            fcTwoPolyContainable.features[0],
            fcTwoPolyContainable.features[1]
          ).extract()
        ).toHaveProperty(['length'], 1);
      });
      it('combines polygons in reverse order', () => {
        expect(
          addInnerRing(
            fcTwoPolyContainable.features[1],
            fcTwoPolyContainable.features[0]
          ).extract()
        ).toHaveProperty(['length'], 1);
      });
    });
  });
});
