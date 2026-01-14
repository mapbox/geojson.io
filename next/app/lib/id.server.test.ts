import { generateSyntheticPoints } from 'app/lib/pmap/generate_synthetic_points';
import * as jsonpointer from 'app/lib/pointer';
import { MersenneTwister19937, Random } from 'random-js';
import { fcLineString, fcMultiPoint, fcMultiPoly, fcPoly } from 'test/helpers';
import type { GeometryCollection, IFeature } from 'types';
import { describe, expect, it, test } from 'vitest';
import {
  decodeId,
  encodeFeature,
  encodeId,
  encodeMidpoint,
  encodeVertex,
  idToJSONPointers,
  nanoid
} from './id';

test('nanoid', () => {
  expect(nanoid()).toHaveLength(21);
});

describe('encode/decode', () => {
  it('#encodeFeature', () => {
    expect(decodeId(encodeFeature(0))).toEqual({
      type: 'feature',
      featureId: 0
    });
  });
  it('#encodeVertex', () => {
    expect(decodeId(encodeVertex(0, 1))).toEqual({
      type: 'vertex',
      featureId: 0,
      vertex: 1
    });
  });
  it('#encodeMidpoint', () => {
    expect(decodeId(encodeMidpoint(0, 1))).toEqual({
      type: 'midpoint',
      featureId: 0,
      vertex: 1
    });
  });
  it('#fuzz', () => {
    const engine = new Random(MersenneTwister19937.seed(1));
    for (let i = 0; i < 100; i++) {
      const input: Id = engine.pick([
        {
          type: 'vertex',
          featureId: engine.integer(0, 1000),
          vertex: engine.integer(0, 1000)
        },
        {
          type: 'midpoint',
          featureId: engine.integer(0, 1000),
          vertex: engine.integer(0, 1000)
        },
        {
          type: 'feature',
          featureId: engine.integer(0, 1000)
        }
      ]);
      expect(decodeId(encodeId(input))).toEqual(input);
    }
  });
});

describe('syntheticIds', () => {
  it('GeometryCollection', () => {
    const gc: IFeature<GeometryCollection> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          fcLineString.features[0].geometry,
          fcMultiPoint.features[0].geometry
        ]
      }
    };
    const ids = generateSyntheticPoints(gc, 0).map((f) =>
      decodeId(f.id as RawId)
    ) as VertexId[];

    expect(ids.map((id) => idToJSONPointers(id, gc))).toMatchSnapshot();
  });
  it('LineString', () => {
    const ids = generateSyntheticPoints(fcLineString.features[0], 0).map((f) =>
      decodeId(f.id as RawId)
    ) as VertexId[];

    expect(idToJSONPointers(ids[0], fcLineString.features[0])).toEqual([
      '/geometry/coordinates/0'
    ]);
    expect(idToJSONPointers(ids[2], fcLineString.features[0])).toEqual([
      '/geometry/coordinates/1'
    ]);
  });
  it('Polygon', () => {
    const ids = generateSyntheticPoints(fcPoly.features[0], 0).map((f) =>
      decodeId(f.id as RawId)
    ) as VertexId[];

    expect(idToJSONPointers(ids[0], fcPoly.features[0])).toEqual([
      '/geometry/coordinates/0/0',
      '/geometry/coordinates/0/3'
    ]);
  });
  it('MultiPolygon', () => {
    const ids = generateSyntheticPoints(fcMultiPoly.features[0], 0).map((f) =>
      decodeId(f.id as RawId)
    ) as VertexId[];
    const [pointer] = idToJSONPointers(ids[4], fcMultiPoly.features[0]);
    expect(pointer).toEqual('/geometry/coordinates/0/0/2');
    const before = fcMultiPoly.features[0];
    const after = jsonpointer.clone(fcMultiPoly.features[0], pointer);
    expect(before).not.toBe(after);
    expect(before).toEqual(after);
    expect(before).not.toBe(after);
    jsonpointer.set(after, pointer, [90, 90]);
    expect(jsonpointer.get(after, pointer)).toEqual([90, 90]);
    expect(jsonpointer.get(before, pointer)).toEqual([2, 3]);
  });
});
