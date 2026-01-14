import { type IDMap, UIDMap } from 'app/lib/id_mapper';
import deepFreeze from 'deep-freeze';
import Fs from 'fs';
import Path from 'path';
import type { PreviewProperty } from 'state/jotai';
import type {
  Feature,
  FeatureCollection,
  FeatureMap,
  GeometryCollection,
  IFeature,
  IFeatureCollection,
  IWrappedFeature,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon
} from 'types';

export const NIL_PREVIEW: PreviewProperty = null;

function loadFixture(path: string): FeatureCollection {
  return JSON.parse(
    Fs.readFileSync(Path.join(__dirname, path), 'utf8')
  ) as FeatureCollection;
}

export function wrap(fc: FeatureCollection): IWrappedFeature[] {
  return deepFreeze(
    fc.features.map((feature, i) => {
      return {
        wrappedFeatureCollectionId: '0'.repeat(21),
        at: i.toString(16),
        id: i.toString(16).padStart(21, '0'),
        feature: feature
      };
    })
  ) as unknown as IWrappedFeature[];
}

export function wrapMap(fc: FeatureCollection): FeatureMap {
  return new Map(
    fc.features.map((feature, i) => {
      return [
        i.toString(16).padStart(21, '0'),
        deepFreeze({
          wrappedFeatureCollectionId: '0'.repeat(21),
          at: i.toString(16),
          id: i.toString(16).padStart(21, '0'),
          feature: feature
        })
      ];
    })
  ) as FeatureMap;
}

export function wrapMapAndId(fc: FeatureCollection) {
  const idMap: IDMap = UIDMap.empty();
  const wrappedFeatures: IWrappedFeature[] = [];
  const featureMap: FeatureMap = new Map(
    fc.features.map((feature, i) => {
      const id = i.toString(16).padStart(21, '0');
      UIDMap.pushUUID(idMap, id);
      const wrappedFeature = Object.freeze({
        wrappedFeatureCollectionId: '0'.repeat(21),
        at: i.toString(16),
        id,
        feature: feature
      });
      wrappedFeatures.push(wrappedFeature);
      return [id, wrappedFeature];
    })
  );
  return { wrappedFeatures, idMap, featureMap };
}

function f(features: IFeature | IFeature[]): IFeatureCollection {
  return deepFreeze({
    type: 'FeatureCollection',
    features: (Array.isArray(features) ? features : [features]).map(
      (feature) => {
        return {
          ...feature,
          properties: Object.freeze(feature.properties)
        };
      }
    )
  }) as IFeatureCollection;
}

export const point: Point = deepFreeze({
  type: 'Point',
  coordinates: [0, 1]
}) as Point;

export const pointFeature: IFeature = deepFreeze({
  type: 'Feature',
  geometry: point,
  properties: {
    a: 1
  }
}) as unknown as IFeature;

export const twoPoints = f([
  pointFeature,
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [2, 3]
    },
    properties: {
      b: 1
    }
  }
]);

export const fc = f([
  {
    type: 'Feature',
    properties: {
      x: 1
    },
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  }
]);

const multiPoint: MultiPoint = deepFreeze({
  type: 'MultiPoint',
  coordinates: [
    [0, 0],
    [1, 1]
  ]
}) as MultiPoint;

export const fcMultiPoint = f([
  {
    type: 'Feature',
    properties: {
      x: 1
    },
    geometry: multiPoint
  }
]);

export const multiLineString: MultiLineString = deepFreeze({
  type: 'MultiLineString',
  coordinates: [
    [
      [0, 0],
      [1, 1],
      [2, 2]
    ]
  ]
}) as MultiLineString;

export const realMultiLineString: IFeature<MultiLineString> = deepFreeze({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 0],
        [1, 1],
        [2, 2]
      ],
      [
        [10, 10],
        [11, 11],
        [12, 12]
      ]
    ]
  }
}) as IFeature<MultiLineString>;

export const fcMultiLineString = f([
  {
    type: 'Feature',
    properties: {
      x: 1
    },
    geometry: multiLineString
  }
]);

export const fcLineString = f([
  {
    type: 'Feature',
    properties: {
      x: 1
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2]
      ]
    }
  }
]);

const poly: Polygon = deepFreeze({
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 2],
      [2, 3],
      [0, 0]
    ]
  ]
}) as Polygon;

export const fcPoly = f([
  {
    type: 'Feature',
    properties: {
      x: 1
    },
    geometry: poly
  }
]);

export const fcTwoPoly: IFeatureCollection<Polygon> = deepFreeze({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        x: 1
      },
      geometry: poly
    },
    {
      type: 'Feature',
      properties: {
        x: 1,
        hello: 'World'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0.1, 0.1],
            [0.9, 1.9],
            [1.9, 2.9],
            [0.1, 0.1]
          ]
        ]
      }
    }
  ]
}) as unknown as IFeatureCollection<Polygon>;

export const fcTwoPolyContainable: IFeatureCollection<Polygon> = deepFreeze({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        x: 1
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2, 2],
            [2, 8],
            [8, 8],
            [8, 2],
            [2, 2]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        x: 1,
        hello: 'World'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 10],
            [10, 10],
            [10, 0],
            [0, 0]
          ]
        ]
      }
    }
  ]
}) as unknown as IFeatureCollection<Polygon>;

export const fcGeometryCollection = f([
  {
    type: 'Feature',
    properties: {
      x: 1
    },
    geometry: {
      type: 'GeometryCollection',
      geometries: twoPoints.features.map((feature) => feature.geometry as Point)
    }
  }
]);

export const fcMultiPoly = f([
  {
    type: 'Feature',
    properties: {
      x: 1
    },
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0],
            [1, 2],
            [2, 3],
            [0, 0]
          ]
        ]
      ]
    }
  }
]);

export const multiPoly2: IFeature<MultiPolygon> = deepFreeze({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [1, 2],
          [2, 3],
          [0, 0]
        ],
        [
          [0.5, 0],
          [1.5, 2],
          [2.5, 3],
          [0.5, 0]
        ],
        [
          [0.5, 0.5],
          [1.5, 2.5],
          [2.5, 3.5],
          [0.5, 0.5]
        ]
      ],
      [
        [
          [0, 0],
          [1, 2],
          [2, 3],
          [0, 0]
        ],
        [
          [0, 0.55],
          [1, 2.55],
          [2, 3.55],
          [0, 0.55]
        ]
      ]
    ]
  }
}) as IFeature<MultiPolygon>;

export const fcPolyHoles = deepFreeze(loadFixture('./fixture_poly_holes.json'));

export const fcLineAndPoly = f([
  fcMultiLineString.features[0],
  fcTwoPoly.features[0]
]);

export const geometryCollection2: IFeature<GeometryCollection> = deepFreeze({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'GeometryCollection',
    geometries: [
      multiPoly2.geometry,
      pointFeature.geometry,
      multiLineString,
      multiPoint
    ]
  }
}) as IFeature<GeometryCollection>;

export const features = [
  fcLineString.features[0],
  fcMultiLineString.features[0],
  fcPoly.features[0],
  fcPolyHoles.features[0],
  multiPoly2,
  pointFeature,
  geometryCollection2,
  fcMultiPoly.features[0],
  fcGeometryCollection.features[0]
] as Feature[];
