import distance from '@turf/distance';
import type {
  Feature as TurfFeature,
  LineString as TurfLineString,
  MultiLineString as TurfMultiLineString
} from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import polygonToLine from '@turf/polygon-to-line';
import { e6position } from 'app/lib/geometry';
import { decodeId, newFeatureId } from 'app/lib/id';
import type { MomentInput } from 'app/lib/persistence/moment';
import type { MapMouseEvent, MapTouchEvent, PointLike } from 'mapbox-gl';
import { type ModeWithOptions } from 'state';
import type { Data, Sel } from 'state/jotai';
import type {
  Feature,
  FeatureMap,
  GeoJsonProperties,
  Geometry,
  MultiPoint,
  Position
} from 'types';
import { type IDMap, UIDMap } from '../id_mapper';
import { CLICKABLE_LAYERS } from '../load_and_augment_style';
import type PMap from '../pmap';

type PutFeature = MomentInput['putFeatures'][0];

export function getMapCoord(
  e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
) {
  return e6position(e.lngLat.toArray(), 7) as Pos2;
}

export function createOrUpdateFeature({
  mode,
  featureMap,
  geometry,
  selection,
  properties = {}
}: {
  selection: Sel;
  mode: ModeWithOptions;
  featureMap: Data['featureMap'];
  geometry: Geometry;
  properties?: GeoJsonProperties;
}): PutFeature {
  const id = newFeatureId();
  const replaceGeometryForId = mode.modeOptions?.replaceGeometryForId;
  const wrappedFeature =
    replaceGeometryForId && featureMap.get(replaceGeometryForId);

  if (wrappedFeature) {
    const p: PutFeature = {
      ...wrappedFeature,
      feature: {
        ...wrappedFeature.feature,
        geometry
      }
    };

    return p;
  }

  return {
    id,
    feature: {
      type: 'Feature',
      properties,
      geometry
    }
  };
}

const getNeighborCandidate = (
  point: mapboxgl.Point,
  pmap: PMap,
  idMap: IDMap,
  excludeFeatureId?: string
): string | null => {
  const { x, y } = point;
  const distance = 12;
  const searchBox = [
    [x - distance, y - distance] as PointLike,
    [x + distance, y + distance] as PointLike
  ] as [PointLike, PointLike];

  const pointFeatures = pmap.map.queryRenderedFeatures(searchBox, {
    layers: CLICKABLE_LAYERS
  });

  if (!pointFeatures.length) return null;

  for (const feature of pointFeatures) {
    const id = feature.id;
    const decodedId = decodeId(id as RawId);
    const uuid = UIDMap.getUUID(idMap, decodedId.featureId);

    if (uuid !== excludeFeatureId) {
      return uuid;
    }
  }

  return null;
};

const getNearestPointFromMultiPoint = (
  multiPoint: MultiPoint,
  targetCoordinates: Position
): Position => {
  let nearestPoint = targetCoordinates;
  let shortestDistance = Infinity;

  for (const coordinates of multiPoint.coordinates) {
    const currentDistance = distance(targetCoordinates, coordinates);
    if (currentDistance < shortestDistance) {
      nearestPoint = coordinates;
      shortestDistance = currentDistance;
    }
  }

  return nearestPoint;
};

/**
 * Returns every vertex coordinate in the feature's geometry.
 * Polygon ring-closing duplicates are included (harmless for snapping).
 */
export const getAllVerticesFromFeature = (feature: Feature): Position[] => {
  if (!feature.geometry) return [];
  const g = feature.geometry;
  switch (g.type) {
    case 'Point':
      return [g.coordinates];
    case 'MultiPoint':
      return g.coordinates;
    case 'LineString':
      return g.coordinates;
    case 'MultiLineString':
      return g.coordinates.flat();
    case 'Polygon':
      return g.coordinates.flat();
    case 'MultiPolygon':
      return g.coordinates.flat(2);
    default:
      return [];
  }
};

const getNearestVertexFromFeature = (
  feature: Feature,
  cursorCoords: Position
): Position => {
  const vertices = getAllVerticesFromFeature(feature);
  if (!vertices.length) return cursorCoords;

  let nearest = cursorCoords;
  let shortest = Infinity;
  for (const v of vertices) {
    const d = distance(cursorCoords, v);
    if (d < shortest) {
      shortest = d;
      nearest = v;
    }
  }
  return nearest;
};

const calculateSnapPosition = (
  feature: Feature,
  cursorCoordinates: Position
): Position => {
  if (!feature.geometry) return cursorCoordinates;

  switch (feature.geometry.type) {
    case 'Point':
      return feature.geometry.coordinates;

    case 'MultiPoint':
      return getNearestPointFromMultiPoint(feature.geometry, cursorCoordinates);

    case 'LineString':
    case 'MultiLineString': {
      const line = feature.geometry;
      const nearestPoint = nearestPointOnLine(line, cursorCoordinates);
      return nearestPoint.geometry.coordinates;
    }

    case 'Polygon':
    case 'MultiPolygon': {
      // Note: polygonToLine returns a FeatureCollection for MultiPolygons,
      // which is compatible with nearestPointOnLine, but TypeScript's types don't align here.
      // We cast it to TurfFeature<TurfLineString | TurfMultiLineString> to satisfy TypeScript.

      const polygonLine = polygonToLine(feature.geometry);
      const nearestPoint = nearestPointOnLine(
        polygonLine as unknown as TurfFeature<
          TurfLineString | TurfMultiLineString
        >,
        cursorCoordinates
      );

      return nearestPoint.geometry.coordinates;
    }

    default:
      return cursorCoordinates;
  }
};

export const getSnappingCoordinates = (
  e: MapMouseEvent | MapTouchEvent,
  featureMap: FeatureMap,
  pmap: PMap,
  idMap: IDMap,
  excludeFeatureId?: string,
  verticesOnly?: boolean
): Position => {
  const cursorCoordinates = getMapCoord(e);
  const featureId = getNeighborCandidate(
    e.point,
    pmap,
    idMap,
    excludeFeatureId
  );

  if (!featureId) return cursorCoordinates;

  const wrappedFeature = featureMap.get(featureId);
  if (!wrappedFeature) return cursorCoordinates;

  const { feature } = wrappedFeature;

  if (!feature.geometry) return cursorCoordinates;

  if (verticesOnly) {
    return getNearestVertexFromFeature(feature, cursorCoordinates);
  }
  return calculateSnapPosition(feature, cursorCoordinates);
};

/** Default feature stroke color — matches geojson.io's symbolization default. */
const DEFAULT_STROKE = '#312E81';

/**
 * Returns all vertices from features within a ~80px radius of the cursor,
 * each paired with that feature's stroke color for data-driven layer styling.
 */
export const getNearbyVertices = (
  e: MapMouseEvent | MapTouchEvent,
  featureMap: FeatureMap,
  pmap: PMap,
  idMap: IDMap,
  excludeFeatureId?: string
): { position: Pos2; stroke: string }[] => {
  const { x, y } = e.point;
  const radius = 80;
  const searchBox = [
    [x - radius, y - radius] as PointLike,
    [x + radius, y + radius] as PointLike
  ] as [PointLike, PointLike];

  const mapFeatures = pmap.map.queryRenderedFeatures(searchBox, {
    layers: CLICKABLE_LAYERS
  });

  const seen = new Set<string>();
  const vertices: { position: Pos2; stroke: string }[] = [];

  for (const f of mapFeatures) {
    const decodedId = decodeId(f.id as RawId);
    const uuid = UIDMap.getUUID(idMap, decodedId.featureId);
    if (!uuid || uuid === excludeFeatureId || seen.has(uuid)) continue;
    seen.add(uuid);
    const wrapped = featureMap.get(uuid);
    if (!wrapped?.feature.geometry) continue;
    const stroke =
      (wrapped.feature.properties?.stroke as string | undefined) ??
      DEFAULT_STROKE;
    for (const position of getAllVerticesFromFeature(wrapped.feature)) {
      vertices.push({ position: position as Pos2, stroke });
    }
  }

  return vertices;
};
