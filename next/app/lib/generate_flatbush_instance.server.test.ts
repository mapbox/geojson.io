import { SELECTION_NONE } from 'state/jotai';
import { twoPoints, wrap } from 'test/helpers';
import type { IFeature, IWrappedFeature, MultiPolygon } from 'types';
import { describe, expect, it } from 'vitest';
import {
  generateFeaturesFlatbushInstance,
  generateVertexFlatbushInstance
} from './generate_flatbush_instance';

const multipoly: IFeature<MultiPolygon> = {
  properties: {},
  type: 'Feature',
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [1, 1],
          [1, 2],
          [0, 0]
        ]
      ],
      [
        [
          [20, 20],
          [21, 21],
          [21, 22],
          [20, 20]
        ]
      ]
    ]
  }
};

describe('generateVertexFlatbushInstance', () => {
  it('finding nothing', () => {
    const feature = wrap({
      type: 'FeatureCollection',
      features: [multipoly]
    })[0];
    const instance = generateVertexFlatbushInstance(feature, 0);
    expect(instance).toHaveProperty('type', 'vertex');
    expect(
      instance.search(
        [
          [0, 0],
          [0, 0]
        ],
        {
          type: 'single',
          id: '000000000000000000000',
          parts: []
        }
      )
    ).toEqual({
      type: 'single',
      id: '000000000000000000000',
      parts: [
        {
          featureId: 0,
          type: 'vertex',
          vertex: 0
        }
      ]
    });

    expect(
      instance.search(
        [
          [-30, -30],
          [30, 30]
        ],
        {
          type: 'single',
          id: '000000000000000000000',
          parts: []
        }
      )
    ).toHaveProperty('parts.length', 6);
  });
});

describe('generateFeaturesFlatbushInstance', () => {
  it('base case, empty index', () => {
    expect(generateFeaturesFlatbushInstance([])).toHaveProperty('type', 'none');
  });
  it('data case', () => {
    const features = twoPoints.features.map((feature, i) => {
      return {
        id: `x${i}`,
        feature
      };
    }) as IWrappedFeature[];
    const instance = generateFeaturesFlatbushInstance(features);
    expect(instance.type).toEqual('feature');
    expect(
      instance.search(
        [
          [-180, -180],
          [180, 180]
        ],
        SELECTION_NONE
      )
    ).toEqual({
      ids: ['x0', 'x1'],
      type: 'multi'
    });
  });
  it('multi polygon', () => {
    const features: IWrappedFeature[] = [
      {
        id: `x`,
        at: 'a0',
        feature: multipoly
      },
      {
        id: `x1`,
        at: 'a1',
        feature: {
          type: 'Feature',
          properties: {},
          geometry: null
        }
      }
    ];
    const instance = generateFeaturesFlatbushInstance(features);
    expect(instance.type).toEqual('feature');
    expect(
      instance.search(
        [
          [-180, -180],
          [180, 180]
        ],
        SELECTION_NONE
      )
    ).toEqual({
      id: 'x',
      type: 'single',
      parts: []
    });
    /**
     * Before refactoring flatbush search, this
     * would match this feature because its extent includes
     * this bbox. But since we split MultiPolygons into
     * multiple extents, it will not be matched.
     */
    expect(
      instance.search(
        [
          [10, 10],
          [11, 11]
        ],
        SELECTION_NONE
      )
    ).toEqual({
      type: 'none'
    });

    expect(
      instance.search(
        [
          [20, 20],
          [21, 21]
        ],
        SELECTION_NONE
      )
    ).toEqual({
      id: 'x',
      type: 'single',
      parts: []
    });
  });
});
