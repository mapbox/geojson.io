import type { CBColors } from 'app/lib/colorbrewer';
import { purple900 } from 'app/lib/constants';
import type { FlatbushLike } from 'app/lib/generate_flatbush_instance';
import type { IDMap } from 'app/lib/id_mapper';
import type { IPersistence } from 'app/lib/persistence/ipersistence';
import type PMap from 'app/lib/pmap';
import { safeParseMaybe } from 'app/lib/utils';
import type {
  Geometry,
  Feature as IFeature,
  FeatureCollection as IFeatureCollection,
  LineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon
} from 'geojson';
import clamp from 'lodash/clamp';
import { Just, type Maybe, Nothing } from 'purify-ts/Maybe';
import type { Dispatch, SetStateAction } from 'react';
import type { Sel } from 'state/jotai';
import type { ModeWithOptions } from 'state/mode';
import type { JsonValue, SetOptional } from 'type-fest';
import { z } from 'zod';
import mapboxgl from 'mapbox-gl';

export interface CoordProps {
  x: number;
  y: number;
}

type StrictProperties = { [name: string]: JsonValue } | null;
export type { IFeature, IFeatureCollection };
export type Feature = IFeature<Geometry | null, StrictProperties>;
export type FeatureCollection = IFeatureCollection<Geometry | null>;
export type GeoJSON = Geometry | Feature | FeatureCollection;

export type {
  BBox,
  GeoJsonProperties,
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position
} from 'geojson';

// Variant with url
export const zStyleConfigUrl = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string().startsWith('pk.'),
  url: z.string().startsWith('mapbox://')
});

// Variant with json
export const zStyleConfigJson = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string().startsWith('pk.'),
  json: z.any() as unknown as z.ZodType<mapboxgl.Style>
});

// Union schema
export const zStyleConfig = zStyleConfigUrl.or(zStyleConfigJson);

export type IStyleConfigUrl = z.infer<typeof zStyleConfigUrl>;
export type IStyleConfigJson = z.infer<typeof zStyleConfigJson>;
export type IStyleConfig = IStyleConfigUrl | IStyleConfigJson;

export interface StyleOptions {
  labelVisibility: boolean;
}

export interface IWrappedFeature<T = Feature> {
  id: string;
  at: string;
  ephemeral?: boolean;
  feature: T;
}

export type FeatureMap = Map<string, IWrappedFeature> & { version?: number };

export type IWrappedFeatureInput = SetOptional<IWrappedFeature, 'at'>;

export const Presence = z.object({
  bearing: z.number(),
  pitch: z.number(),
  minx: z.number(),
  miny: z.number(),
  maxx: z.number(),
  maxy: z.number(),
  userName: z.string(),
  userId: z.number(),
  updatedAt: z.string(),
  cursorLatitude: z.number(),
  cursorLongitude: z.number(),
  wrappedFeatureCollectionId: z.string().length(21),
  replicacheClientId: z.string()
});

export type IPresence = z.infer<typeof Presence>;

/**
 * Helpers
 */
export const UWrappedFeature = {
  mapToFeatureCollection(featureMap: FeatureMap): FeatureCollection {
    const features: FeatureCollection['features'] = [];
    for (const wrappedFeature of featureMap.values()) {
      features.push(wrappedFeature.feature);
    }
    return {
      type: 'FeatureCollection',
      features
    };
  },
  toFeatureCollection(features: IWrappedFeature[]): FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: features.map((f) => f.feature)
    };
  }
};

/**
 * Symbolization --------------------------------------------------
 */

export const SymbolizationBaseInternal = z.object({
  simplestyle: z.boolean(),
  defaultColor: z.string().default(purple900),
  defaultOpacity: z
    .number()
    .default(0.3)
    .transform((num) => clamp(num, 0, 1))
});

const SymbolizationCategorical = SymbolizationBaseInternal.extend({
  type: z.literal('categorical'),
  stops: z
    .array(
      z.object({
        input: z.union([z.string(), z.number().int()]),
        output: z.string()
      })
    )
    .min(1)
    .transform((stops) => {
      return uniqueStops(stops);
    }),
  property: z.string()
});

/**
 * The previous version of symbolization ramp,
 * used for upgrading.
 */
const SymbolizationRamp_v0 = z.object({
  type: z.literal('ramp'),
  min: z.object({
    input: z.number(),
    output: z.string()
  }),
  max: z.object({
    input: z.number(),
    output: z.string()
  }),
  property: z.string()
});

const SymbolizationSimpleStyle_v0 = z.object({
  type: z.literal('simplestyle')
});

export function tryUpgrading(symbolization: any): Maybe<ISymbolization> {
  {
    const parsed = SymbolizationRamp_v0.safeParse(symbolization);
    if (parsed.success) {
      const p = parsed.data;
      return safeParseMaybe(
        Symbolization.safeParse({
          type: 'ramp',
          property: p.property,
          defaultColor: purple900,
          rampName: 'RdBl',
          interpolate: 'linear',
          simplestyle: false,
          defaultOpacity: 0.3,
          stops: [
            {
              input: p.min.input,
              output: p.min.output
            },
            {
              input: p.max.input,
              output: p.max.output
            }
          ]
        })
      );
    }
  }
  {
    const parsed = SymbolizationSimpleStyle_v0.safeParse(symbolization);
    if (parsed.success) {
      return Just({
        type: 'none',
        defaultColor: purple900,
        simplestyle: false,
        defaultOpacity: 0.3
      });
    }
  }
  return Nothing;
}

/**
 * Make stops unique based on their 'input' value.
 */
function uniqueStops<T extends { input: JsonValue }>(stops: T[]): T[] {
  const inputs = new Set();
  const transformedStops = [];

  for (const stop of stops) {
    if (!inputs.has(stop.input)) {
      inputs.add(stop.input);
      transformedStops.push(stop);
    }
  }
  return transformedStops;
}

const SymbolizationRamp = SymbolizationBaseInternal.extend({
  type: z.literal('ramp'),
  property: z.string(),
  rampName: z.string(),
  interpolate: z.enum(['step', 'linear']),
  stops: z
    .array(
      z.object({
        input: z.number(),
        output: z.string()
      })
    )
    .transform((stops) => {
      return uniqueStops(stops).sort((a, b) => {
        return a.input - b.input;
      });
    })
});

const SymbolizationNone = SymbolizationBaseInternal.extend({
  type: z.literal('none')
});

export const Symbolization = z.union([
  SymbolizationNone,
  SymbolizationCategorical,
  SymbolizationRamp
]);

export const SYMBOLIZATION_NONE: ISymbolizationNone = {
  type: 'none',
  simplestyle: true,
  defaultColor: purple900,
  defaultOpacity: 0.3
};

export type ISymbolizationNone = z.infer<typeof SymbolizationNone>;
export type ISymbolizationRamp = z.infer<typeof SymbolizationRamp>;
export type ISymbolizationCategorical = z.infer<
  typeof SymbolizationCategorical
>;
export type ISymbolization = z.infer<typeof Symbolization>;

export type DragTarget = RawId | IWrappedFeature['id'][];

export interface HandlerContext {
  setFlatbushInstance: Dispatch<SetStateAction<FlatbushLike>>;
  selection: Sel;
  flatbushInstance: FlatbushLike;
  dragTargetRef: React.MutableRefObject<DragTarget | null>;
  mode: ModeWithOptions;
  throttledMovePointer: (arg0: mapboxgl.Point) => void;
  featureMap: FeatureMap;
  idMap: IDMap;
  rep: IPersistence;
  pmap: PMap;
}

/**
 * GeometryCollection is basically the one kind of geometry
 * that breaks the norm. Everything but it.
 */
export type CoordinateHavers =
  | Polygon
  | LineString
  | MultiPoint
  | MultiPolygon
  | Point;

export type RampValues = Pick<ISymbolizationRamp, 'interpolate'> & {
  breaks: 'quantile' | 'linear';
  property: string;
  rampName: string;
  simplestyle: boolean;
  defaultColor: string;
  defaultOpacity: number;
  classes: keyof CBColors['colors'];
};

export type CategoricalValues = {
  property: string;
  rampName: string;
  defaultColor: string;
  defaultOpacity: number;
  simplestyle: boolean;
};

/**
 * Feature Editor Tab Configuration
 */
export const FEATURE_EDITOR_TAB_CONFIG = [
  { id: 'mercator-circle', label: 'Circle' },
  { id: 'vertex', label: 'Vertex' },
  { id: 'styles', label: 'Styles' },
  { id: 'export', label: 'Export' },
  { id: 'id', label: 'ID' },
  { id: 'geojson', label: 'GeoJSON' }
] as const;

export type FeatureEditorTabConfig = typeof FEATURE_EDITOR_TAB_CONFIG;
export type FeatureEditorTabId = FeatureEditorTabConfig[number]['id'];
export type FeatureEditorTab = FeatureEditorTabConfig[number];
