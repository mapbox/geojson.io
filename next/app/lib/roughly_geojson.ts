import isPlainObject from 'lodash/isPlainObject';
import type { Either } from 'purify-ts/Either';
import { Left, Right } from 'purify-ts/Either';
import type { JsonArray, JsonObject, JsonValue, SetOptional } from 'type-fest';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position
} from 'types';
import { geometryTypes } from './constants';
import type { GeoJSONResult } from './convert/utils';
import { ConvertError } from './errors';

type RoughResultTmp = SetOptional<GeoJSONResult, 'geojson'> & {
  _state: {
    featureIndex: number;
  };
  _options: RoughOptions;
};

interface RoughOptions {
  removeCoincidents: boolean;
}

function isObject(value: any): value is JsonObject {
  return isPlainObject(value);
}

function positionEqual(a: Position, b: Position) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function removeCoincidents(ctx: RoughResultTmp, ring: Position[]) {
  if (!ctx._options.removeCoincidents) return ring;
  let sliced = false;
  for (let i = ring.length - 1; i >= 1; i--) {
    if (positionEqual(ring[i], ring[i - 1])) {
      if (!sliced) {
        ring = ring.slice();
        sliced = true;
      }
      ring.splice(i, 1);
    }
  }
  return ring;
}

export function getInitialCtx(roughOptions: RoughOptions): RoughResultTmp {
  return {
    type: 'geojson',
    notes: [] as string[],
    _state: {
      featureIndex: 0
    },
    _options: roughOptions
  };
}

const DEFAULT_ROUGH_OPTIONS = {
  removeCoincidents: true
};

/**
 * Given a GeoJSON-like input, attempt to extract a valid
 * FeatureCollection from it.
 */
export function rough(
  root: any,
  roughOptions: RoughOptions = DEFAULT_ROUGH_OPTIONS
): Either<ConvertError, GeoJSONResult> {
  const ctx = getInitialCtx(roughOptions);

  if (isObject(root)) {
    roughObject(ctx, root);
  } else if (Array.isArray(root)) {
    const features = asFeatures(ctx, root);
    if (features.length) {
      ctx.geojson = {
        type: 'FeatureCollection',
        features
      };
    }
  } else {
    ctx.notes.push(`GeoJSON has neither an object or an array at its root`);
  }

  if (ctx.geojson?.features.length) {
    return Right({
      type: 'geojson',
      notes: ctx.notes,
      geojson: ctx.geojson
    });
  } else {
    return Left(
      new ConvertError('No features were importable in this GeoJSON file')
    );
  }
}

function roughObject(ctx: RoughResultTmp, root: JsonObject) {
  const type = root.type;

  if (type === 'Feature') {
    const feature = asFeature(ctx, root);
    if (feature) {
      ctx.geojson = {
        type: 'FeatureCollection',
        features: [feature]
      };
    }
  } else if (type === 'FeatureCollection') {
    const featureCollection = asFeatureCollection(ctx, root);
    if (featureCollection) {
      ctx.geojson = featureCollection;
    }
  } else {
    const geometry = asGeometry(ctx, root);
    if (geometry) {
      ctx.geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry
          }
        ]
      };
    }
  }
}

function asFeatureCollection(
  ctx: RoughResultTmp,
  root: JsonObject
): FeatureCollection | null {
  const { features, ...other } = root;

  return {
    type: 'FeatureCollection',
    features: asFeatures(ctx, features),
    ...other
  };
}

function asFeatures(
  ctx: RoughResultTmp,
  root: JsonValue | undefined
): Feature[] {
  if (!Array.isArray(root)) {
    ctx.notes.push(`Expected an array of features, another type was found`);
    return [];
  }

  return root.flatMap((item, i) => {
    ctx._state.featureIndex = i;
    if (!isObject(item)) {
      ctx.notes.push(
        `Rejected invalid feature #${ctx._state.featureIndex}: not an object`
      );
      return [];
    }
    const ret = asFeature(ctx, item);
    return ret ? [ret] : [];
  });
}

function asFeature(ctx: RoughResultTmp, root: JsonObject): Feature | null {
  if (!(root.type === 'Feature' || root.geometry || root.properties)) {
    ctx.notes.push(
      `Rejected invalid feature #${ctx._state.featureIndex}: does not appear to be a feature`
    );
    return null;
  }

  const { geometry, properties, type, ...other } = root;

  return {
    type: 'Feature',
    geometry: isObject(geometry)
      ? asGeometry(ctx, geometry)
      : rejectGeometryForCoordinates(ctx),
    properties: asProperties(ctx, properties),
    ...other
  };
}

function isGeometryType(type: any): type is Geometry['type'] {
  return (
    typeof type === 'string' && geometryTypes.includes(type as Geometry['type'])
  );
}

function asCoordinate(coord: JsonValue | undefined): Position | null {
  if (Array.isArray(coord)) {
    if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
      return coord as Position;
    }
  }

  return null;
}

function rejectGeometryForCoordinates(ctx: RoughResultTmp) {
  ctx.notes.push(
    `Feature #${ctx._state.featureIndex}'s invalid geometry removed`
  );
  return null;
}

/**
 * Geometry ===================================================================
 */
function asPoint(
  ctx: RoughResultTmp,
  inputCoordinates: JsonArray
): Point | null {
  const coordinates = asCoordinate(inputCoordinates);
  if (coordinates === null) return rejectGeometryForCoordinates(ctx);
  return {
    type: 'Point',
    coordinates
  };
}

function asMultiPoint(
  ctx: RoughResultTmp,
  inputCoordinates: JsonArray
): MultiPoint | null {
  const coordinates = inputCoordinates.flatMap((coord) => {
    const ret = asCoordinate(coord);
    return ret ? [ret] : [];
  });
  if (coordinates.length === 0) return rejectGeometryForCoordinates(ctx);
  return {
    type: 'MultiPoint',
    coordinates
  };
}

function asLineString(
  ctx: RoughResultTmp,
  inputCoordinates: JsonArray
): LineString | null {
  const coordinates = removeCoincidents(
    ctx,
    inputCoordinates.flatMap((coord) => {
      const ret = asCoordinate(coord);
      return ret ? [ret] : [];
    })
  );
  if (coordinates.length < 2) return rejectGeometryForCoordinates(ctx);
  return {
    type: 'LineString',
    coordinates
  };
}

function asMultiLineString(
  ctx: RoughResultTmp,
  inputCoordinates: JsonArray
): MultiLineString | null {
  const coordinates = inputCoordinates.flatMap((ring) => {
    if (!Array.isArray(ring)) return [];
    const ret = removeCoincidents(
      ctx,
      ring.flatMap((coord) => {
        const ret = asCoordinate(coord);
        return ret ? [ret] : [];
      })
    );
    return ret.length ? [ret] : [];
  });
  if (coordinates.length === 0) return rejectGeometryForCoordinates(ctx);
  return {
    type: 'MultiLineString',
    coordinates
  };
}

function asPolygon(
  ctx: RoughResultTmp,
  inputCoordinates: JsonArray
): Polygon | null {
  const coordinates = inputCoordinates.flatMap((ring) => {
    if (!Array.isArray(ring)) return [];
    const validRing = removeCoincidents(
      ctx,
      ring.flatMap((coord) => {
        const ret = asCoordinate(coord);
        return ret ? [ret] : [];
      })
    );
    return validRing.length > 2 ? [validRing] : [];
  });
  if (coordinates.length === 0) return rejectGeometryForCoordinates(ctx);
  return {
    type: 'Polygon',
    coordinates
  };
}

function asMultiPolygon(
  ctx: RoughResultTmp,
  inputCoordinates: JsonArray
): MultiPolygon | null {
  const coordinates = inputCoordinates.flatMap((polygon) => {
    if (!Array.isArray(polygon)) return [];
    const ret = polygon.flatMap((ring) => {
      if (!Array.isArray(ring)) return [];
      const validRing = removeCoincidents(
        ctx,
        ring.flatMap((coord) => {
          const ret = asCoordinate(coord);
          return ret ? [ret] : [];
        })
      );
      return validRing.length > 2 ? [validRing] : [];
    });
    return ret.length ? [ret] : [];
  });
  if (coordinates.length === 0) return rejectGeometryForCoordinates(ctx);
  return {
    type: 'MultiPolygon',
    coordinates
  };
}

function asGeometryCollection(
  ctx: RoughResultTmp,
  root: JsonObject
): GeometryCollection | null {
  if (!Array.isArray(root.geometries)) return rejectGeometryForCoordinates(ctx);

  const geometries = root.geometries.flatMap((geometry) => {
    const ret = isObject(geometry) && asGeometry(ctx, geometry);
    return ret ? [ret] : [];
  });

  if (geometries.length === 0) return rejectGeometryForCoordinates(ctx);
  return {
    type: 'GeometryCollection',
    geometries
  };
}

function asGeometry(ctx: RoughResultTmp, root: JsonObject): Geometry | null {
  const type = root.type;

  if (!isGeometryType(type)) {
    ctx.notes.push(
      `Feature #${ctx._state.featureIndex}'s geometry type was not valid`
    );
    return null;
  }

  if (type === 'GeometryCollection') {
    return asGeometryCollection(ctx, root);
  }

  const { coordinates } = root;

  if (!Array.isArray(coordinates)) {
    return rejectGeometryForCoordinates(ctx);
  }

  switch (type) {
    case 'Point':
      return asPoint(ctx, coordinates);
    case 'MultiPoint':
      return asMultiPoint(ctx, coordinates);
    case 'LineString':
      return asLineString(ctx, coordinates);
    case 'MultiLineString':
      return asMultiLineString(ctx, coordinates);
    case 'Polygon':
      return asPolygon(ctx, coordinates);
    case 'MultiPolygon':
      return asMultiPolygon(ctx, coordinates);
  }
}

/**
 * All kinds of properties are recoverable
 */
function asProperties(
  ctx: RoughResultTmp,
  root: JsonValue | undefined
): Feature['properties'] {
  if (root === undefined || root === null) return {};
  if (isObject(root)) return root;
  ctx.notes.push(
    `Feature #${ctx._state.featureIndex}'s properties were not an object: transformed into one`
  );
  return { value: root };
}
