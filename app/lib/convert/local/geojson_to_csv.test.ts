import { expect, test } from 'vitest';

import { DEFAULT_EXPORT_OPTIONS, DEFAULT_IMPORT_OPTIONS } from '..';
import { geojsonToCSV } from './geojson_to_csv';

test('geojsonToCSV', () => {
  expect(
    geojsonToCSV(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Null island' },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      },
      DEFAULT_EXPORT_OPTIONS
    )
  ).toEqual(`name,latitude,longitude
Null island,0,0`);

  expect(
    geojsonToCSV(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Null island' },
            geometry: {
              type: 'MultiPoint',
              coordinates: [[0, 0]]
            }
          }
        ]
      },
      DEFAULT_EXPORT_OPTIONS
    )
  ).toEqual(`name,latitude,longitude
Null island,0,0`);

  expect(
    geojsonToCSV(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Null island' },
            geometry: {
              type: 'MultiPoint',
              coordinates: [[0, 0]]
            }
          },
          {
            type: 'Feature',
            properties: { name: 'Two' },
            geometry: {
              type: 'LineString',
              coordinates: [
                [0, 0],
                [1, 2],
                [3, 4]
              ]
            }
          }
        ]
      },
      {
        ...DEFAULT_EXPORT_OPTIONS,
        csvOptions: {
          ...DEFAULT_IMPORT_OPTIONS.csvOptions,
          kind: 'polyline'
        }
      }
    )
  ).toEqual(`name,polyline
Null island,
Two,??_seK_ibE_seK_seK`);
});
