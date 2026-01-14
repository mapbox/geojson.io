import { fcLineString } from 'test/helpers';
import { describe, expect, it } from 'vitest';
import { flattenResult } from './import_utils';

describe('flattenResult', () => {
  it('#geojson', () => {
    expect(
      flattenResult({
        type: 'geojson',
        geojson: fcLineString,
        notes: []
      })
    ).toEqual(fcLineString);
  });
  it('#root', () => {
    expect(
      flattenResult({
        type: 'root',
        root: {
          type: 'root',
          children: fcLineString.features
        },
        notes: []
      })
    ).toEqual(fcLineString);
  });
});
