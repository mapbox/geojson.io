import { GEOJSON_TYPES } from 'app/lib/constants';
import { ConvertError, GeojsonIOError, parseOrError } from 'app/lib/errors';
import type { ProxyMarked } from 'comlink';
import isPlainObject from 'lodash/isPlainObject';
import { Left } from 'purify-ts/Either';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { Data } from 'state/jotai';
import type { JsonObject, JsonValue, SetOptional } from 'type-fest';
import {
  type FeatureCollection,
  type FeatureMap,
  UWrappedFeature
} from 'types';
import { BBOX } from './bbox';
import { CoordinateString } from './coordinate_string';
import { CSV } from './csv';
import { EXIF } from './exif';
import { FlatGeobuf } from './flatgeobuf';
import { GeoJSON } from './geojson';
import { GeoJSONL } from './geojsonl';
import { GeoTIFF } from './geotiff';
import { GPX } from './gpx';
import { GTFS } from './gtfs';
import { KML } from './kml';
import { KMZ } from './kmz';
import { OSM } from './osm';
import { Polyline } from './polyline';
import { Shapefile } from './shapefile';
import { TCX } from './tcx';
import { TopoJSON } from './topojson';
import { type ConvertResult, getExtension } from './utils';
import { WKT } from './wkt';
import { XLS } from './xls';

export enum GeocodingBehavior {
  NULL_GEOMETRY
}

export interface ExportedData {
  extensions: FileType['extensions'];
  result: {
    blob: Blob;
    name: string;
  };
}

export const CSV_DELIMITERS = [
  { value: ',', label: ',' },
  { value: ';', label: ';' },
  { value: '\t', label: 'Tab' }
] as const;

export const CSV_KINDS = [
  {
    value: 'lonlat',
    label: 'Coordinates'
  },
  { value: 'wkt', label: 'WKT Column' },
  { value: 'geojson', label: 'GeoJSON Column' },
  { value: 'polyline', label: 'Encoded polylines' }
] as const;

export const DEFAULT_IMPORT_OPTIONS: Omit<ImportOptions, 'type'> = {
  coordinateStringOptions: {
    order: 'LONLAT'
  },
  removeCoincidents: true,
  csvOptions: {
    sheet: '',
    longitudeHeader: '',
    latitudeHeader: '',
    geometryHeader: '',
    kind: 'lonlat',
    autoType: true,
    delimiter: ','
  }
} as const;

/**
 * Import options with object type.
 */
export interface ImportOptions {
  type: FileType['id'];
  toast?: boolean;
  coordinateStringOptions: {
    order: 'LONLAT' | 'LATLON';
  };
  removeCoincidents?: boolean;
  csvOptions: {
    // For XLSX, technically. Shoving it in here.
    sheet: string;
    // Would be nice to keep that consistent.
    longitudeHeader: string | null;
    latitudeHeader: string | null;
    /** For WKT / GeoJSON kind */
    geometryHeader: string | null;
    kind: typeof CSV_KINDS[number]['value'];
    delimiter: typeof CSV_DELIMITERS[number]['value'];
    autoType: boolean;
  };
}

export const COORDINATE_STRING_ORDERS: Array<{
  value: ImportOptions['coordinateStringOptions']['order'];
  label: string;
}> = [
  {
    value: 'LONLAT',
    label: 'Longitude, Latitude'
  },
  {
    value: 'LATLON',
    label: 'Latitude, longitude'
  }
];

type Winding = 'RFC7946' | 'd3';

export interface ExportOptions {
  type: FileType['id'];
  geojsonOptions?: {
    winding: Winding;
    truncate: boolean;
    addBboxes: boolean;
    indent: boolean;
    includeId: boolean;
  };
  csvOptions?: ImportOptions['csvOptions'];
}

export const DEFAULT_EXPORT_GEOJSON_OPTIONS: ExportOptions['geojsonOptions'] = {
  winding: 'RFC7946',
  truncate: true,
  addBboxes: false,
  indent: false,
  includeId: false
};

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  geojsonOptions: DEFAULT_EXPORT_GEOJSON_OPTIONS,
  type: 'geojson'
};

export interface ExportResult {
  blob: Blob;
  name: string;
}

export interface Progress {
  total: number;
  done: number;
}

export type RawProgressCb = (progress: Progress) => void;
export type ProgressCb = RawProgressCb & ProxyMarked;

export interface FileType {
  readonly id:
    | 'geojson'
    | 'geojsonl'
    | 'kml'
    | 'kmz'
    | 'tcx'
    | 'gpx'
    | 'csv'
    | 'polyline'
    | 'geotiff'
    | 'wkt'
    | 'gtfs'
    | 'topojson'
    | 'exif'
    | 'bbox'
    | 'shapefile'
    | 'coordinate-string'
    | 'xls'
    | 'flatgeobuf'
    | 'osm';
  readonly label: string | string[];
  readonly extensions: string[];
  readonly mimes: string[];
  readonly filenames: string[];
  forwardBinary?: (
    file: ArrayBuffer,
    options: ImportOptions,
    callback: ProgressCb
  ) => EitherAsync<Error | GeojsonIOError, ConvertResult>;
  forwardString?: (
    file: string,
    options: ImportOptions,
    callback: ProgressCb
  ) => EitherAsync<Error | GeojsonIOError, ConvertResult>;
  back?: (
    inputs: {
      geojson: FeatureCollection;
      featureMap: FeatureMap;
    },
    options: ExportOptions
  ) => EitherAsync<GeojsonIOError, ExportResult>;
}

export const FILE_TYPES = [
  GeoJSON,
  KML,
  KMZ,
  TCX,
  GPX,
  CSV,
  XLS,
  Polyline,
  GeoTIFF,
  EXIF,
  WKT,
  GTFS,
  TopoJSON,
  GeoJSONL,
  BBOX,
  Shapefile,
  FlatGeobuf,
  CoordinateString,
  OSM
] as const;

function assertIsObject(obj: JsonValue): obj is JsonObject {
  return isPlainObject(obj);
}

async function detectJson(file: File) {
  // performance here is rough:
  // we're parsing the full json object.
  const res = await EitherAsync<GeojsonIOError, ImportOptions>(
    async function detectJsonInner({ liftEither, throwE }) {
      const text = await file.text();
      const obj = await liftEither(parseOrError(text));
      if (!assertIsObject(obj)) {
        return throwE(new GeojsonIOError('Could not determine JSON type'));
      }
      if (obj.type === 'Topology') {
        return { ...DEFAULT_IMPORT_OPTIONS, type: TopoJSON.id };
      } else if (typeof obj.type === 'string' && GEOJSON_TYPES.has(obj.type)) {
        return { ...DEFAULT_IMPORT_OPTIONS, type: GeoJSON.id };
      }
      return throwE(new GeojsonIOError('Could not determine JSON type'));
    }
  ).run();

  return res;
}

export function findType(typeStr: string) {
  const type = FILE_TYPES.find((fileType) => fileType.id === typeStr);
  if (!type) throw new Error('Type not found');
  return type;
}

export async function detectType(file: File) {
  return await EitherAsync<GeojsonIOError, ImportOptions>(
    async ({ throwE, fromPromise }) => {
      const { name } = file;
      const ext = getExtension(name);

      if (ext === '.json') {
        return await fromPromise(detectJson(file));
      }

      for (const type of FILE_TYPES) {
        if (
          (ext && type.extensions.includes(ext)) ||
          type.mimes.includes(file.type) ||
          type.filenames?.includes(name)
        ) {
          return {
            ...DEFAULT_IMPORT_OPTIONS,
            type: type.id
          };
        }
      }

      return throwE(new GeojsonIOError('Could not detect file type'));
    }
  ).run();
}

export async function stringToGeoJSON(
  ...args: Parameters<NonNullable<FileType['forwardString']>>
) {
  const driver = findType(args[1].type);
  if ('forwardString' in driver) {
    return await driver.forwardString(...args).run();
  }
  return Left(new ConvertError('Unsupported driver'));
}

export async function fileToGeoJSON(
  ...args: Parameters<NonNullable<FileType['forwardBinary']>>
) {
  const driver = findType(args[1].type);
  return await driver.forwardBinary(...args).run();
}

export function importToExportOptions(
  options: ImportOptions
): ExportOptions | null {
  const driver = findType(options.type);
  if (!('back' in driver)) return null;

  return {
    type: options.type
  };
}

/**
 * From a list of wrapped features,
 * produce an ExportedData object that can contain
 * the results of any format.
 */
export function fromGeoJSON(
  { featureMap }: SetOptional<Data, 'selection'>,
  exportOptions: ExportOptions
) {
  return EitherAsync<ConvertError, ExportedData>(
    async ({ throwE, fromPromise }) => {
      const type = findType(exportOptions.type);
      if (!('back' in type)) {
        return throwE(new ConvertError('Unexpected missing type'));
      }

      const geojson = UWrappedFeature.toFeatureCollection(
        Array.from(featureMap.values())
      );

      const result = await fromPromise(
        type.back({ geojson, featureMap }, exportOptions)
      );

      return {
        result,
        extensions: type.extensions
      };
    }
  );
}
