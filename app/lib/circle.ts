import type { Polygon } from 'geojson';
import clamp from 'lodash/clamp';
import { CIRCLE_TYPE } from 'state/mode';
import type { Feature } from 'types';
import { z } from 'zod';

const D2R = Math.PI / 180;
const MAXEXTENT = 20037508.342789244;
const R2D = 180 / Math.PI;
const A = 6378137.0;

const CircleProp = z
  .object({
    '@circle': z.object({
      type: z.nativeEnum(CIRCLE_TYPE),
      center: z.tuple([z.number(), z.number()])
    })
  })
  .passthrough();

export type ICircleProp = z.infer<typeof CircleProp>;

function sign(x: number) {
  return x < 0 ? -1 : x > 0 ? 1 : 0;
}

/**
 * From TURF
 * Convert lon/lat values to 900913 x/y.
 * (from https://github.com/mapbox/sphericalmercator)
 */
function toMercator(position: Pos2): Pos2 {
  const [longitude, latitude] = position;

  // compensate longitudes passing the 180th meridian
  // from https://github.com/proj4js/proj4js/blob/master/lib/common/adjust_lon.js
  const adjusted =
    Math.abs(longitude) <= 180 ? longitude : longitude - sign(longitude) * 360;

  return [
    clamp(A * adjusted * D2R, -MAXEXTENT, MAXEXTENT),
    clamp(
      A * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * latitude * D2R)),
      -MAXEXTENT,
      MAXEXTENT
    )
  ];
}

/**
 * Convert 900913 x/y values to lon/lat.
 * (from https://github.com/mapbox/sphericalmercator)
 */
function toLonLat(xy: Pos2): Pos2 {
  return [
    (xy[0] * R2D) / A,
    (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D
  ];
}

/**
 * Same as Turf.
 */
function degreesToRadians(degrees: number): number {
  const radians = degrees % 360;
  return (radians * Math.PI) / 180;
}

/**
 * Also same as turf.
 */
function radiansToDegrees(radians: number): number {
  const degrees = radians % (2 * Math.PI);
  return (degrees * 180) / Math.PI;
}

function getVerticesDegrees(
  center: Pos2,
  degrees: number,
  angles: number[]
): Pos2[] {
  return angles.map((bearingRad): Pos2 => {
    return [
      center[0] + Math.cos(bearingRad) * degrees,
      center[1] + Math.sin(bearingRad) * degrees
    ];
  });
}

function getVerticesGeodesic(
  center: Pos2,
  radians: number,
  angles: number[]
): Pos2[] {
  const [longitude1, latitude1] = [
    degreesToRadians(center[0]),
    degreesToRadians(center[1])
  ];

  return angles.map((bearingRad): Pos2 => {
    const latitude2 = Math.asin(
      Math.sin(latitude1) * Math.cos(radians) +
        Math.cos(latitude1) * Math.sin(radians) * Math.cos(bearingRad)
    );
    const longitude2 =
      longitude1 +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(radians) * Math.cos(latitude1),
        Math.cos(radians) - Math.sin(latitude1) * Math.sin(latitude2)
      );
    return [radiansToDegrees(longitude2), radiansToDegrees(latitude2)];
  });
}

/**
 * Haversine distance. Adapted from Turf.
 */
function distanceInRadians(a: Pos2, b: Pos2) {
  const dLat = degreesToRadians(b[1] - a[1]);
  const dLon = degreesToRadians(b[0] - a[0]);
  const lat1 = degreesToRadians(a[1]);
  const lat2 = degreesToRadians(b[1]);

  const ax =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * Math.atan2(Math.sqrt(ax), Math.sqrt(1 - ax));
}

function getVerticesMercator(
  center: Pos2,
  meters: number,
  angles: number[]
): Pos2[] {
  const centerMercator = toMercator(center);

  return angles.map((bearingRad): Pos2 => {
    return toLonLat([
      centerMercator[0] + Math.cos(bearingRad) * meters,
      centerMercator[1] + Math.sin(bearingRad) * meters
    ]);
  });
}

/**
 * References
 * https://github.com/Turfjs/turf/blob/master/packages/turf-circle/index.ts
 * https://github.com/henrythasler/Leaflet.Geodesic/blob/master/src/geodesic-geom.ts#L240
 */
function makeCircleGeodesic(center: Pos2, radians: number): Polygon {
  // TODO: auto steps
  const steps = 100;

  const angles = Array.from({ length: steps - 1 }, (_, i) => {
    return (i / steps) * Math.PI * 2;
  }).concat([0]);

  const vertices = getVerticesGeodesic(center, radians, angles);

  return {
    type: 'Polygon',
    coordinates: [vertices]
  };
}

function makeCircleDegrees(center: Pos2, degrees: number): Polygon {
  // TODO: auto steps
  const steps = 100;

  const angles = Array.from({ length: steps - 1 }, (_, i) => {
    return (i / steps) * Math.PI * 2;
  }).concat([0]);

  const vertices = getVerticesDegrees(center, degrees, angles);

  return {
    type: 'Polygon',
    coordinates: [vertices]
  };
}

function makeCircleMercator(
  center: Pos2,
  distanceInMercatorMeters: number
): Polygon {
  // TODO: auto steps
  const steps = 100;

  const angles = Array.from({ length: steps - 1 }, (_, i) => {
    return (i / steps) * Math.PI * 2;
  }).concat([0]);

  const vertices = getVerticesMercator(
    center,
    distanceInMercatorMeters,
    angles
  );

  return {
    type: 'Polygon',
    coordinates: [vertices]
  };
}

function distanceInMercatorMeters(a: Pos2, b: Pos2) {
  const am = toMercator(a);
  const bm = toMercator(b);
  return Math.sqrt((am[0] - bm[0]) ** 2 + (am[1] - bm[1]) ** 2);
}

function distanceInDegrees(am: Pos2, bm: Pos2) {
  return Math.sqrt((am[0] - bm[0]) ** 2 + (am[1] - bm[1]) ** 2);
}

export function makeCircleNative({
  center,
  value,
  type
}: {
  center: Pos2;
  value: number;
  type: CIRCLE_TYPE;
}): Polygon {
  switch (type) {
    case CIRCLE_TYPE.MERCATOR: {
      return makeCircleMercator(center, value);
    }
    case CIRCLE_TYPE.GEODESIC: {
      return makeCircleGeodesic(center, value);
    }
    case CIRCLE_TYPE.DEGREES: {
      return makeCircleDegrees(center, value);
    }
  }
}

export function makeCircle({
  center,
  mouse,
  type
}: {
  center: Pos2;
  mouse: Pos2;
  type: CIRCLE_TYPE;
}): Polygon {
  switch (type) {
    case CIRCLE_TYPE.MERCATOR: {
      return makeCircleMercator(
        center,
        distanceInMercatorMeters(center, mouse)
      );
    }
    case CIRCLE_TYPE.GEODESIC: {
      return makeCircleGeodesic(center, distanceInRadians(center, mouse));
    }
    case CIRCLE_TYPE.DEGREES: {
      return makeCircleDegrees(center, distanceInDegrees(center, mouse));
    }
  }
}

export function getCircleRadius(feature: Feature) {
  if (feature.geometry?.type !== 'Polygon') return null;
  const prop = CircleProp.safeParse(feature.properties);
  if (!prop.success) return null;
  const vertex = feature.geometry.coordinates[0]?.[0] as Pos2 | undefined;
  if (vertex === undefined) return null;

  const { type, center } = prop.data['@circle'];

  switch (type) {
    case CIRCLE_TYPE.DEGREES: {
      return distanceInDegrees(center, vertex);
    }
    case CIRCLE_TYPE.MERCATOR: {
      return distanceInMercatorMeters(center, vertex);
    }
    case CIRCLE_TYPE.GEODESIC: {
      return distanceInRadians(center, vertex);
    }
  }
}

export function getCircleProp(feature: Feature) {
  if (feature.geometry?.type !== 'Polygon') return null;
  const prop = CircleProp.safeParse(feature.properties);
  if (!prop.success) return null;
  return prop.data['@circle'];
}
