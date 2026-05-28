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
  excludeFeatureId?: string
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

  return calculateSnapPosition(feature, cursorCoordinates);
};
