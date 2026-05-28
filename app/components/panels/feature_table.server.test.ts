import { multiLineString, point, wrapMap } from 'test/helpers';
import { describe, expect, it, test } from 'vitest';
import { filterFeatures, measureColumn } from './feature_table';

const columns = ['name', 'description'];

const featureMap = new Map(
  [
    ...wrapMap({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Buttermilk Bakeshop',
            description: 'Striped awning'
          },
          geometry: point
        },
        {
          type: 'Feature',
          properties: { name: 'LS Barbershop', description: 'Black sign' },
          geometry: point
        },
        {
          type: 'Feature',
          properties: { street: 'Garfield Pl.', description: 'Great street' },
          geometry: multiLineString
        }
      ]
    }).entries()
  ].map(([key, value], i) => {
    return [
      key,
      {
        ...value
      }
    ];
  })
);

const wrappedFeatures = Array.from(featureMap.values());

test('measureColumn', () => {
  expect(measureColumn('name', featureMap)).toEqual(140);
  expect(measureColumn('description', featureMap)).toEqual(140);
  expect(measureColumn('baz', featureMap)).toEqual(64);
  expect(measureColumn('baz', new Map())).toEqual(64);
});

describe('filterFeatures', () => {
  it('should return all features when no filter is provided', () => {
    expect(
      filterFeatures({
        filter: {
          search: '',
          isCaseSensitive: false,
          column: '',
          geometryType: null,
          exact: false
        },
        columns,
        featureMap
      })
    ).toEqual(wrappedFeatures);
  });

  it('should filter features by search text', () => {
    expect(
      filterFeatures({
        filter: {
          search: 'Ba',
          isCaseSensitive: false,
          column: '',
          geometryType: null,
          exact: false
        },
        columns,
        featureMap
      })
    ).toEqual([wrappedFeatures[1], wrappedFeatures[0]]);
  });

  it('should filter features by geometry type', () => {
    expect(
      filterFeatures({
        filter: {
          search: '',
          isCaseSensitive: false,
          column: '',
          geometryType: 'MultiLineString',
          exact: false
        },
        columns,
        featureMap
      })
    ).toEqual([wrappedFeatures[2]]);
  });
});
