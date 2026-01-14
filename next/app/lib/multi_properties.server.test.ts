import { fcLineString, wrap, wrapMap } from 'test/helpers';
import { describe, expect, it } from 'vitest';
import {
  extractMultiProperties,
  extractPropertyKeys
} from './multi_properties';

describe('extractMultiProperties', () => {
  it('base case', () => {
    expect(extractMultiProperties([])).toEqual(new Map([]));
  });
  it('single feature', () => {
    expect(extractMultiProperties(wrap(fcLineString))).toEqual(
      new Map([['x', new Map([[1, 1]])]])
    );
  });
  it('single feature', () => {
    const w1 = wrap(fcLineString).map((wrappedFeature) => {
      return {
        ...wrappedFeature,
        feature: {
          ...wrappedFeature.feature,
          properties: {
            x: [10]
          }
        }
      };
    })[0];
    const w2 = wrap(fcLineString).map((wrappedFeature) => {
      return {
        ...wrappedFeature,
        feature: {
          ...wrappedFeature.feature,
          properties: {
            x: [10]
          }
        }
      };
    })[0];
    expect(extractMultiProperties([w1])).toEqual(
      new Map([['x', new Map([[[10], 1]])]])
    );
    expect(extractMultiProperties([w1, w1])).toEqual(
      new Map([['x', new Map([[[10], 2]])]])
    );
    expect(extractMultiProperties([w1, w2])).toEqual(
      new Map([['x', new Map([[[10], 2]])]])
    );
  });
});

it('extractPropertyKeys', () => {
  expect(extractPropertyKeys(wrapMap(fcLineString))).toEqual(['x']);
});
