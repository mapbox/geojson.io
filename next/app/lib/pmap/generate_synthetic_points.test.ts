import { decodeId, idToJSONPointers } from 'app/lib/id';
import * as jsonpointer from 'app/lib/pointer';
import {
  fcGeometryCollection,
  fcLineString,
  fcMultiLineString,
  fcMultiPoint,
  fcMultiPoly,
  fcPoly
} from 'test/helpers';
import type {
  Feature,
  Geometry,
  GeometryCollection,
  IFeature,
  LineString,
  Polygon
} from 'types';
import { describe, expect, test } from 'vitest';
import { generateSyntheticPoints } from './generate_synthetic_points';

function checkReverse(f: Feature) {
  const ids = generateSyntheticPoints(f, 0).map(({ id }) =>
    idToJSONPointers(decodeId(id as RawId) as VertexId | MidpointId, f)
  );
  return {
    ids,
    coords: ids.map((subids) => {
      return subids.map((id) => {
        const coord = jsonpointer.get(f, id);
        expect(coord).toHaveLength(2);
        return coord;
      });
    })
  };
}

describe('generateSyntheticPoints', () => {
  test('MultiLineString', () => {
    const f = fcMultiLineString.features[0];
    expect(generateSyntheticPoints(f, 0)).toMatchSnapshot();
    expect(checkReverse(f)).toMatchSnapshot();
  });

  test('LineString', () => {
    const f = fcLineString.features[0] as IFeature<LineString>;

    const generated = generateSyntheticPoints(f, 0);
    expect(generated).toMatchSnapshot();

    expect(
      generated.filter((f) => decodeId(f.id as RawId).type === 'midpoint')
    ).toHaveLength(f.geometry.coordinates.length - 1);

    expect(checkReverse(f)).toMatchSnapshot();
  });

  test('Polygon', () => {
    const f = fcPoly.features[0] as IFeature<Polygon>;
    const generated = generateSyntheticPoints(f, 0);

    expect(
      generated.filter((f) => decodeId(f.id as RawId).type === 'midpoint')
    ).toHaveLength(f.geometry.coordinates[0].length - 1);

    expect(generated).toMatchSnapshot();
    expect(checkReverse(f)).toMatchSnapshot();
  });

  describe('GeometryCollection', () => {
    test('base', () => {
      const f = fcGeometryCollection.features[0];
      expect(generateSyntheticPoints(f, 0)).toMatchSnapshot();
      expect(checkReverse(f)).toMatchSnapshot();
    });

    test('with null member', () => {
      const f: Feature = {
        ...fcGeometryCollection.features[0],
        geometry: {
          type: 'GeometryCollection',
          geometries: [
            null as unknown as Geometry,
            ...(fcGeometryCollection.features[0].geometry as GeometryCollection)
              .geometries
          ]
        }
      };
      expect(generateSyntheticPoints(f, 0)).toMatchSnapshot();
      expect(checkReverse(f)).toMatchSnapshot();
    });
  });

  test('MultiPoint', () => {
    const f = fcMultiPoint.features[0];
    expect(generateSyntheticPoints(f, 0)).toEqual([
      {
        geometry: {
          coordinates: [0, 0],
          type: 'Point'
        },
        id: 1000000000,
        properties: {
          fp: true
        },
        type: 'Feature'
      },
      {
        geometry: {
          coordinates: [1, 1],
          type: 'Point'
        },
        id: 1000000002,
        properties: {
          fp: true
        },
        type: 'Feature'
      }
    ]);
    expect(checkReverse(f)).toMatchSnapshot();
  });

  test('MultiPolygon', () => {
    const f = fcMultiPoly.features[0];
    expect(generateSyntheticPoints(f, 0)).toMatchSnapshot();
    expect(checkReverse(f)).toMatchSnapshot();
  });
});
