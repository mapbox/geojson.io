import { match } from 'ts-pattern';
import type {
  IFeature,
  IWrappedFeature,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
  Position
} from 'types';

export type SimplifySupportedGeometry =
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon;

/*
 (c) 2013, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js


 Changes (Placemark)

 - Port to TypeScript (let to let)
 - Use native GeoJSON points
*/

// to suit your point format, run search/replace for '[0]' and '[1]';
// for 3D version, see 3d branch (configurability would draw significant performance overhead)
//
export function isFeatureSimplifiable(
  wrappedFeature: IWrappedFeature
): wrappedFeature is IWrappedFeature<IFeature<SimplifySupportedGeometry>> {
  const {
    feature: { geometry }
  } = wrappedFeature;
  return (
    geometry?.type === 'Polygon' ||
    geometry?.type === 'MultiPolygon' ||
    geometry?.type === 'LineString' ||
    geometry?.type === 'MultiLineString'
  );
}

// square distance between 2 points
function getSqDist(p1: Position, p2: Position) {
  const dx = p1[0] - p2[0],
    dy = p1[1] - p2[1];

  return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(p: Position, p1: Position, p2: Position) {
  let x = p1[0];
  let y = p1[1];
  let dx = p2[0] - x;
  let dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;
}
// rest of the code doesn't care about point format

// basic distance-based simplification
function simplifyRadialDist(points: Position[], sqTolerance: number) {
  let prevPoint = points[0];
  const newPoints = [prevPoint];
  let point;

  for (let i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point && point) newPoints.push(point);

  return newPoints;
}

function simplifyDPStep(
  points: Position[],
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Position[]
) {
  let maxSqDist = sqTolerance;
  let index = 0;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1)
      simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1)
      simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
}

// simplification using Ramer-Douglas-Peucker algorithm
function simplifyDouglasPeucker(points: Position[], sqTolerance: number) {
  const last = points.length - 1;

  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
}

// both algorithms combined for awesome performance
function simplifyJS(
  points: Position[],
  { tolerance, highQuality }: SimplifyOptions
) {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

  points = highQuality ? points : simplifyRadialDist(points, sqTolerance);
  points = simplifyDouglasPeucker(points, sqTolerance);

  return points;
}

interface SimplifyOptions {
  tolerance: number;
  highQuality: boolean;
}

export function simplify(
  feature: IFeature<SimplifySupportedGeometry>,
  options: SimplifyOptions
) {
  return {
    ...feature,
    geometry: simplifyGeom(feature.geometry, options)
  };
}

/**
 * Simplifies a feature's coordinates
 */
function simplifyGeom(
  geometry: SimplifySupportedGeometry,
  options: SimplifyOptions
) {
  return match(geometry)
    .with({ type: 'LineString' }, (geometry) => ({
      ...geometry,
      coordinates: simplifyJS(geometry.coordinates, options)
    }))
    .with({ type: 'MultiLineString' }, (geometry) => ({
      ...geometry,
      coordinates: geometry.coordinates.map((line) => simplifyJS(line, options))
    }))
    .with({ type: 'Polygon' }, (geometry) => ({
      ...geometry,
      coordinates: simplifyPolygon(geometry.coordinates, options)
    }))
    .with({ type: 'MultiPolygon' }, (geometry) => ({
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) =>
        simplifyPolygon(polygon, options)
      )
    }))
    .exhaustive();
}

const MAX_ATTEMPTS = 10;

function simplifyPolygon(
  coordinates: Polygon['coordinates'],
  options: SimplifyOptions
) {
  let { tolerance } = options;
  return coordinates.map((ring) => {
    if (ring.length < 4) {
      throw new Error('invalid polygon');
    }
    let simpleRing = simplifyJS(ring, options);
    let attempts = 0;
    //remove 1 percent of tolerance until enough points to make a triangle
    while (!checkValidity(simpleRing)) {
      tolerance -= tolerance * 0.01;
      simpleRing = simplifyJS(ring, {
        ...options,
        tolerance
      });
      if (++attempts > MAX_ATTEMPTS) {
        simpleRing = ring;
        break;
      }
    }
    if (
      simpleRing[simpleRing.length - 1][0] !== simpleRing[0][0] ||
      simpleRing[simpleRing.length - 1][1] !== simpleRing[0][1]
    ) {
      simpleRing.push(simpleRing[0]);
    }
    return simpleRing;
  });
}

/**
 * Returns true if ring has at least 3 coordinates and its first
 * coordinate is the same as its last
 */
function checkValidity(ring: Position[]): boolean {
  if (ring.length < 3) return false;
  //if the last point is the same as the first, it's not a triangle
  return !(
    ring.length === 3 &&
    ring[2][0] === ring[0][0] &&
    ring[2][1] === ring[0][1]
  );
}
