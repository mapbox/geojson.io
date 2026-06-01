import * as Comlink from 'comlink';
import { describe, expect, it } from 'vitest';
import { DEFAULT_IMPORT_OPTIONS } from '..';
import { autoType, csvToGeoJSON, detectColumns } from './csv_to_geojson';

const noop = Comlink.proxy(() => {});

const output = {
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
};

describe('csvToGeoJSON', () => {
  it('autoType', () => {
    expect(
      autoType(
        {
          n: '10',
          x: 'true',
          y: ''
        },
        DEFAULT_IMPORT_OPTIONS.csvOptions
      )
    ).toEqual({
      n: 10,
      x: true,
      y: null
    });
  });
  it('handles comma-separated values', () => {
    expect(
      csvToGeoJSON(
        `name,lat,lon
Null island,0,0`,
        {
          ...DEFAULT_IMPORT_OPTIONS.csvOptions,
          delimiter: ',',
          latitudeHeader: 'lat',
          longitudeHeader: 'lon',
          autoType: true,
          sheet: '',
          kind: 'lonlat'
        },
        noop
      )
    ).toEqual(output);
  });

  it('handles semicolon-separated values', () => {
    expect(
      csvToGeoJSON(
        `name;latitude;longitude
Null island;0;0`,
        {
          ...DEFAULT_IMPORT_OPTIONS.csvOptions,
          delimiter: ';',
          latitudeHeader: 'latitude',
          longitudeHeader: 'longitude',
          autoType: true,
          sheet: '',
          kind: 'lonlat'
        },
        noop
      )
    ).toEqual(output);
  });

  it('casts types', () => {
    const geojson = csvToGeoJSON(
      `name;count;n;latitude;longitude
Null island;10;true;0;0`,
      {
        ...DEFAULT_IMPORT_OPTIONS.csvOptions,
        delimiter: ';',
        latitudeHeader: 'latitude',
        longitudeHeader: 'longitude',
        autoType: true,
        sheet: '',
        kind: 'lonlat'
      },
      noop
    );
    expect(geojson).toHaveProperty('features.0.properties.count', 10);
    expect(geojson).toHaveProperty('features.0.properties.n', true);
  });
});

describe('detect columns', () => {
  it('lat lon', () => {
    expect(detectColumns(['name', 'lat', 'lon'])).toEqual({
      autoType: true,
      sheet: '',
      delimiter: ',',
      latitudeHeader: 'lat',
      longitudeHeader: 'lon',
      geometryHeader: '',
      kind: 'lonlat'
    });
  });
  it('distinct types', () => {
    expect(detectColumns(['name', 'wkt'])).toHaveProperty(['kind'], 'wkt');
    expect(detectColumns(['name', 'wkt'])).toHaveProperty(
      ['geometryHeader'],
      'wkt'
    );
    expect(detectColumns(['name', 'polyline'])).toHaveProperty(
      ['kind'],
      'polyline'
    );
    expect(detectColumns(['name', 'polyline'])).toHaveProperty(
      ['geometryHeader'],
      'polyline'
    );
  });
  it('typos', () => {
    expect(detectColumns(['name', 'elatation', 'latitude', 'lon'])).toEqual({
      autoType: true,
      sheet: '',
      delimiter: ',',
      latitudeHeader: 'latitude',
      longitudeHeader: 'lon',
      geometryHeader: '',
      kind: 'lonlat'
    });
  });
});
