import type { ImportOptions } from 'app/lib/convert';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JsonObject } from 'type-fest';
import type { Feature, FeatureCollection } from 'types';
import { read, utils } from 'xlsx';
import {
  castRowGeoJSON,
  castRowLonLat,
  castRowPolyline,
  castRowWKT,
  EnforcedLonLatOptions,
  EnforcedWKTOptions
} from './shared';

export function xlsxToGeoJSON(
  file: ArrayBuffer,
  options: ImportOptions['csvOptions']
): Promise<FeatureCollection> {
  if (!options) throw new Error('Options should not be undefined');
  const { kind, sheet } = options;

  const doc = read(file, { type: 'array' });
  const rows: JsonObject[] = utils.sheet_to_json(doc.Sheets[sheet]);
  const features: Feature[] = [];

  for (const row of rows) {
    switch (kind) {
      case 'lonlat': {
        const feature = castRowLonLat(
          row,
          EnforcedLonLatOptions.parse(options)
        );
        if (feature) {
          features.push(feature);
        }
        break;
      }
      case 'wkt': {
        const castRow = row;
        const feature = castRowWKT(castRow, EnforcedWKTOptions.parse(options));
        if (feature) {
          features.push(feature);
        }
        break;
      }
      case 'geojson': {
        const castRow = row;
        const feature = castRowGeoJSON(
          castRow,
          EnforcedWKTOptions.parse(options)
        );
        if (feature) {
          features.push(feature);
        }
        break;
      }
      case 'polyline': {
        const castRow = row;
        const feature = castRowPolyline(
          castRow,
          EnforcedWKTOptions.parse(options)
        );
        if (feature) {
          features.push(feature);
        }
        break;
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: features
  };
}
