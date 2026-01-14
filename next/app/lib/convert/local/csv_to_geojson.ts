import { type ImportOptions, type ProgressCb } from 'app/lib/convert';
import type { DSVRowString } from 'd3-dsv';
import { dsvFormat } from 'd3-dsv';
import type { JsonObject, JsonValue } from 'type-fest';
import type { Feature, FeatureCollection } from 'types';
import {
  castRowGeoJSON,
  castRowLonLat,
  castRowPolyline,
  castRowWKT,
  EnforcedLonLatOptions,
  EnforcedWKTOptions
} from './shared';

interface Scores {
  latitudeScore: number;
  longitudeScore: number;
}

type ColumnWithScore = {
  column: string;
} & Scores;

// https://github.com/d3/d3-dsv#autoType
export function autoType(
  input: DSVRowString,
  options: ImportOptions['csvOptions']
): JsonObject {
  const object = input as JsonObject;
  for (const key in object) {
    let value: JsonValue = (object[key] as string).trim();
    let number;
    if (!value) value = null;
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!Number.isNaN((number = +value))) value = number;
    else continue;
    object[key] = value;
  }
  return object;
}

function sortByScore(
  columnsWithScores: ColumnWithScore[],
  scoreKey: keyof Scores
) {
  const [winner] = columnsWithScores
    .filter((column) => column[scoreKey] > 0)
    .sort((b, a) => a[scoreKey] - b[scoreKey]);
  return winner;
}

export function detectColumns(columns: string[]): ImportOptions['csvOptions'] {
  const columnsWithScores: ColumnWithScore[] = columns.map((column) => {
    return {
      column,
      latitudeScore: scoreColumn(column, /(Lat)(itude)?/gi),
      longitudeScore: scoreColumn(column, /(L)(on|ng)(gitude)?/gi)
    };
  });

  /**
   * Lazy way to do this here, but if there's a polyline
   * header, it's probably a polyline, and there's no real alternative
   * name for that.
   */
  const hasPolylineColumn = columns.includes('polyline');
  const hasWktColumn = columns.includes('wkt');

  const latitudeHeader = sortByScore(columnsWithScores, 'latitudeScore');
  const longitudeHeader = sortByScore(columnsWithScores, 'longitudeScore');

  /**
   * This tries to work around a really tricky case in which
   * there's a single column, so it's not possible to really 'reset'
   * any fields.
   */
  const singleColumn = (columns.length === 1 && columns[0]) || '';

  return {
    kind: hasPolylineColumn ? 'polyline' : hasWktColumn ? 'wkt' : 'lonlat',
    delimiter: ',',
    latitudeHeader: latitudeHeader?.column || singleColumn,
    longitudeHeader: longitudeHeader?.column || singleColumn,
    geometryHeader: hasPolylineColumn
      ? 'polyline'
      : hasWktColumn
      ? 'wkt'
      : singleColumn,
    sheet: '',
    autoType: true
  };
}

function scoreColumn(column: string, regex: RegExp) {
  const match = regex.exec(column);
  return match ? match[0].length : 0;
}

export function csvToGeoJSON(
  csv: string,
  options: ImportOptions['csvOptions'],
  progress: ProgressCb
): Promise<FeatureCollection> {
  if (!options) throw new Error('Options should not be undefined');
  const { kind, delimiter } = options;

  let i = 0;
  const rows = dsvFormat(delimiter).parse(csv);
  const features: Feature[] = [];

  // Preflight checks
  switch (kind) {
    case 'geojson':
    case 'wkt':
    case 'polyline':
    case 'lonlat': {
      break;
    }
  }

  progress({ total: rows.length, done: 0 });

  for (const row of rows) {
    const castRow: JsonObject = options.autoType
      ? autoType(row, options)
      : (row as JsonObject);
    switch (kind) {
      case 'lonlat': {
        const feature = castRowLonLat(
          castRow,
          EnforcedLonLatOptions.parse(options)
        );
        if (feature) {
          features.push(feature);
        }
        break;
      }
      case 'wkt': {
        const feature = castRowWKT(castRow, EnforcedWKTOptions.parse(options));
        if (feature) {
          features.push(feature);
        }
        break;
      }
      case 'geojson': {
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
    progress({ total: rows.length, done: ++i });
  }

  return {
    type: 'FeatureCollection',
    features: features
  };
}
