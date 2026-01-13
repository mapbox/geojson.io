import { hexToArray } from 'app/lib/color';
import type { GeoJSON, Geometry, IFeatureCollection } from 'types';
import { z } from 'zod';

type GeoJSONTypeList = GeoJSON['type'][];
type GeometryTypeList = Geometry['type'][];

/**
 * Size of a row in the left panel
 */
export const LEFT_PANEL_ROW_HEIGHT = 24;

/**
 * Layer names
 */

export const DECK_SYNTHETIC_ID = 'deckgl-synthetic';
export const DECK_LASSO_ID = 'deckgl-lasso';

/**
 * Colors
 */
export const purple900 = '#312E81';

export const LINE_COLORS_SELECTED = '#3195ff';
export const LINE_COLORS_SELECTED_RGB = hexToArray('#3195ff');

// Note, this is also in the database schema.
// If changing it here, it may need to be changed there too.

/**
 * Utilities ------------------------------------------------------------------
 */
export const targetSize = [80, 40] as const;

export const emptySelection = new Set<RawId>();
export const CURSOR_DEFAULT = '';

export const MAX_GEOCODER_ROWS = 100;

export const GEOJSONIO_ID_PROP = '@id';
const lengthFactors = {
  // Metric
  millimeters: 1000,
  centimeters: 100,
  meters: 1,
  kilometers: 1 / 1000,

  feet: 3.28084,
  inches: 39.37,
  miles: 1 / 1609.344,
  nauticalmiles: 1 / 1852,

  // Other
  degrees: 1 / 111325,
  radians: 1,
  yards: 1.0936133
} as const;

const areaFactors = {
  // metric
  millimeters: 1000000,
  centimeters: 10000,
  meters: 1,
  hectares: 0.0001,
  kilometers: 0.000001,

  // imperial
  inches: 1550.003100006,
  feet: 10.763910417,
  yards: 1.195990046,
  acres: 0.000247105,
  miles: 3.86e-7
} as const;

export const GROUPED_UNIT_OPTIONS = {
  length: [
    {
      name: 'Metric',
      items: [
        {
          key: 'millimeters',
          name: 'millimeters',
          value: lengthFactors.millimeters
        },
        {
          key: 'centimeters',
          name: 'centimeters',
          value: lengthFactors.centimeters
        },
        { key: 'meters', name: 'meters', value: lengthFactors.meters },
        {
          key: 'kilometers',
          name: 'kilometers',
          value: lengthFactors.kilometers
        }
      ]
    },
    {
      name: 'Imperial',
      items: [
        { key: 'feet', name: 'feet', value: lengthFactors.feet },
        { key: 'inches', name: 'inches', value: lengthFactors.inches },
        { key: 'miles', name: 'miles', value: lengthFactors.miles }
      ]
    },
    {
      name: 'Other',
      items: [
        {
          key: 'nauticalmiles',
          name: 'nautical miles',
          value: lengthFactors.nauticalmiles
        },
        { key: 'degrees', name: 'degrees', value: lengthFactors.degrees },
        { key: 'radians', name: 'radians', value: lengthFactors.radians }
      ]
    }
  ],
  area: [
    {
      name: 'Metric',
      items: [
        {
          key: 'millimeters',
          name: 'millimeters',
          value: areaFactors.millimeters
        },
        {
          key: 'centimeters',
          name: 'centimeters',
          value: areaFactors.centimeters
        },
        { key: 'meters', name: 'meters', value: areaFactors.meters },
        { key: 'hectares', name: 'hectares', value: areaFactors.hectares },
        {
          key: 'kilometers',
          name: 'kilometers',
          value: areaFactors.kilometers
        }
      ]
    },
    {
      name: 'Imperial',
      items: [
        { key: 'feet', name: 'feet', value: areaFactors.feet },
        { key: 'inches', name: 'inches', value: areaFactors.inches },
        { key: 'yards', name: 'yards', value: areaFactors.yards },
        { key: 'acres', name: 'acres', value: areaFactors.acres },
        { key: 'miles', name: 'miles', value: areaFactors.miles }
      ]
    }
  ]
};

export const MB_TO_BYTES = 1_000_000;

export const geometryTypes: GeometryTypeList = [
  'Point',
  'MultiPoint',
  'Polygon',
  'MultiPolygon',
  'LineString',
  'MultiLineString',
  'GeometryCollection'
];

export const SIMPLESTYLE_PROPERTIES = [
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'fill',
  'fill-opacity'
] as const;

const geojsonTypes: GeoJSONTypeList = [
  'FeatureCollection',
  'Feature',
  'Point',
  'MultiPoint',
  'Polygon',
  'MultiPolygon',
  'LineString',
  'MultiLineString',
  'GeometryCollection'
];

export const EMPTY_ARRAY: any[] = [];

export const DEFAULT_MAP_BOUNDS = [
  [-180, -90],
  [180, 90]
] as const;

const multiGeometryTypes: GeoJSONTypeList = [
  'MultiPoint',
  'MultiPolygon',
  'MultiLineString',
  'GeometryCollection'
];

type GeometryMap = Record<Geometry['type'], Geometry['type'] | null>;

export const MULTI_TO_SINGULAR: GeometryMap = {
  MultiPoint: 'Point',
  MultiPolygon: 'Polygon',
  MultiLineString: 'LineString',
  Point: null,
  Polygon: null,
  LineString: null,
  GeometryCollection: null
};

export const GEOJSON_TYPES: Set<string> = new Set(geojsonTypes);

export const GEOJSON_MULTI_GEOMETRY_TYPES: Set<string> = new Set(
  multiGeometryTypes
);

export const emptyFeatureCollection: IFeatureCollection = {
  type: 'FeatureCollection',
  features: []
};

export const FILE_WARN_MB = Infinity;
export const FILE_WARN_BYTES = FILE_WARN_MB * MB_TO_BYTES;

export const FILE_LIMIT_MB = Infinity;
export const FILE_LIMIT_BYTES = FILE_LIMIT_MB * MB_TO_BYTES;

export const SCALE_UNITS = ['imperial', 'metric', 'nautical'] as const;
export type ScaleUnit = typeof SCALE_UNITS[number];
export const zScaleUnit = z.enum(SCALE_UNITS);

export const WHITE: RGBA = [255, 255, 255, 255];

export const LASSO_YELLOW = hexToArray('#FDE68A55');
export const LASSO_DARK_YELLOW = hexToArray('#F59E0B');
