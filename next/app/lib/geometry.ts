import turfGetBbox from '@turf/bbox';
import type { BBox } from '@turf/helpers';
import clamp from 'lodash/clamp';
import isEqual from 'lodash/isEqual';
import last from 'lodash/last';
import remove from 'lodash/remove';
import uniq from 'lodash/uniq';
import type { Either } from 'purify-ts/Either';
import { Left, Right } from 'purify-ts/Either';
import { Just, Maybe, Nothing } from 'purify-ts/Maybe';
import type {
  Feature,
  FeatureCollection,
  GeoJSON,
  Geometry,
  GeometryCollection,
  IWrappedFeature,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position,
  BBox as TBBox
} from 'types';
import { EMPTY_ARRAY } from './constants';
import { ConvertError } from './errors';

export function formatCoordinates(pos: Pos2) {
  function n(dec: number) {
    return (+Math.abs(dec).toPrecision(4)).toString();
  }
  function d(dec: number, dims: string) {
    switch (Math.sign(dec)) {
      case -1:
        return dims[0];
      case 1:
        return dims[1];
      default:
        return dims[0];
    }
  }
  return `${n(pos[1])}${d(pos[1], 'SN')}, ${n(pos[0])}${d(pos[0], 'WE')}`;
}

function trimAndSplitIntoNumbers(
  str: string,
  len: number
): Either<ConvertError, number[]> {
  const trimmed = str.trim().replace(/[^\-\d,.\s]/g, '');
  if (!trimmed) return Left(new ConvertError('Empty input'));
  const parts = trimmed.split(/[\s|,]+/);
  const numbers = parts
    .map((str) => parseFloat(str))
    .filter((num) => !Number.isNaN(num));
  if (numbers.length !== len) {
    return Left(
      new ConvertError(
        `Failed to parse: need ${len} valid numbers, found ${numbers.length}`
      )
    );
  }
  return Right(numbers);
}

export function parseCoordinates(str: string) {
  return trimAndSplitIntoNumbers(str, 2) as Either<ConvertError, Pos2>;
}

export function parseBBOX(str: string) {
  return trimAndSplitIntoNumbers(str, 4) as Either<ConvertError, BBox4>;
}

function polygonCoordinatesFromPositions(
  a: Pos2,
  b: Pos2
): Polygon['coordinates'] {
  return [[a, [a[0], b[1]], b, [b[0], a[1]], a]];
}

/**
 * Given two corners, generate a polygon. The order of the
 * edges is not determined, here.
 */
export function polygonFromPositions(a: Pos2, b: Pos2): Polygon {
  return {
    type: 'Polygon',
    coordinates: polygonCoordinatesFromPositions(a, b)
  };
}

/*
 * Get the midpoint between two positions in mercator space.
 * The naive solution is just the point that's an average of
 * longitude and latitude between: but that will displace the point
 * off of the line on the map.
 */
export function midpoint(a: Position, b: Position): Position {
  const x0 = (180 + a[0]) / 360;
  const x1 = (180 + b[0]) / 360;

  const a_1 = a[1] < -90 ? -90 : a[1] > 90 ? 90 : a[1];
  const b_1 = b[1] < -90 ? -90 : b[1] > 90 ? 90 : b[1];

  const y0 =
    (180 -
      (180 / Math.PI) *
        Math.log(Math.tan(Math.PI / 4 + (a_1 * Math.PI) / 360))) /
    360;
  const y1 =
    (180 -
      (180 / Math.PI) *
        Math.log(Math.tan(Math.PI / 4 + (b_1 * Math.PI) / 360))) /
    360;
  const xm = (x0 + x1) / 2;
  const ym = (y0 + y1) / 2;
  const y2 = 180 - ym * 360;

  return [
    xm * 360 - 180,
    (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90
  ];
}

export function isRectangleNonzero(feature: Feature): boolean {
  if (feature.geometry?.type !== 'Polygon') return false;
  const [positions] = feature.geometry.coordinates;
  return !(
    uniq(positions.map((pos) => pos[0])).length === 1 &&
    uniq(positions.map((pos) => pos[1])).length === 1
  );
}

function getBbox(obj: GeoJSON): Maybe<BBox> {
  const box = turfGetBbox(obj);
  return Number.isFinite(box[0]) ? Just(box) : Nothing;
}

export function extendExtent(a: Maybe<BBox>, b: Maybe<BBox>) {
  const vals = Maybe.catMaybes([a, b]);
  switch (vals.length) {
    case 0:
      return Nothing;
    case 1:
      return a.alt(b);
    default: {
      const [x00, y00, x01, y01] = vals[0];
      const [x0, y0, x1, y1] = vals[1];
      return limitExtent(
        Just([
          Math.min(x0, x00),
          Math.min(y0, y00),
          Math.max(x1, x01),
          Math.max(y1, y01)
        ])
      );
    }
  }
}

/**
 * Check for zero-size bboxes. These can be generated
 * if you run getExtent for a point. Zero-extent bboxes
 * will cause failures in Mapbox when we use the static
 * maps API.
 */
export function isBBoxEmpty(box: BBox): boolean {
  return box[0] === box[2] && box[1] === box[3];
}

/**
 * Expand zero-size bboxes by a given pad, in degrees.
 */
export function padBBox(box: BBox, pad: number): BBox {
  return [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad] as BBox;
}

function limitExtent(box: Maybe<BBox>) {
  return box.map(
    ([x0, y0, x1, y1]) =>
      [
        clamp(x0, -180, 180),
        clamp(y0, -90, 90),
        clamp(x1, -180, 180),
        clamp(y1, -90, 90)
      ] as BBox
  );
}

function normalizeInput(
  input: GeoJSON | IWrappedFeature[] | Feature[]
): GeoJSON {
  if (Array.isArray(input)) {
    const wrapped = input.length !== 0 && 'at' in input[0];
    const fc: FeatureCollection = {
      type: 'FeatureCollection',
      features: wrapped
        ? (input as IWrappedFeature[]).map(
            (wrappedFeature) => wrappedFeature.feature
          )
        : (input as Feature[])
    };
    return fc;
  }
  return input;
}

export function getExtents(input: Feature): BBox[] {
  if (!input.geometry?.type) {
    return EMPTY_ARRAY as BBox[];
  }
  return getExtentsForGeometry(input.geometry);
}

function getExtentsForGeometry(geometry: Geometry): BBox[] {
  switch (geometry.type) {
    case 'Point': {
      const c = geometry.coordinates;
      return [[c[0], c[1], c[0], c[1]]];
    }
    case 'MultiPoint': {
      return geometry.coordinates.map((c) => [c[0], c[1], c[0], c[1]]);
    }
    case 'Polygon':
    case 'LineString': {
      return getBbox(geometry)
        .map((bbox) => [bbox])
        .orDefault([]);
    }
    case 'MultiPolygon': {
      return Maybe.catMaybes(
        geometry.coordinates.map((coordinates) =>
          getBbox({
            type: 'Polygon',
            coordinates
          })
        )
      );
    }
    case 'MultiLineString': {
      return Maybe.catMaybes(
        geometry.coordinates.map((coordinates) =>
          getBbox({
            type: 'LineString',
            coordinates
          })
        )
      );
    }
    case 'GeometryCollection': {
      return geometry.geometries.flatMap((sub) => getExtentsForGeometry(sub));
    }
  }
}

export function getExtent(
  input: GeoJSON | IWrappedFeature[] | Feature[],
  noLimit?: boolean
) {
  const geojson = normalizeInput(input);
  const box = getBbox(geojson);
  return noLimit ? box : limitExtent(box);
}

export function addBbox(feature: Feature): Feature {
  return getBbox(feature).mapOrDefault((bbox) => {
    return {
      ...feature,
      bbox
    };
  }, feature);
}

/**
 * Generate a single Polygon geometry from
 * a bbox.
 */
export function bboxToPolygon(bbox: TBBox): Polygon {
  const [minx, miny, maxx, maxy] = bbox;
  return {
    type: 'Polygon',
    bbox,
    coordinates: [
      [
        [minx, miny],
        [minx, maxy],
        [maxx, maxy],
        [maxx, miny],
        [minx, miny]
      ]
    ]
  };
}

/**
 * This is used for liberal clicking, so that
 * small features with small hitpoints can be clicked
 * without absolutely hitting them as features.
 */
export function bufferPoint(
  point: mapboxgl.Point
): [mapboxgl.PointLike, mapboxgl.PointLike] {
  const ry = 10;
  const rx = ry;
  return [
    [point.x - rx, point.y - ry],
    [point.x + rx, point.y + ry]
  ];
}

/**
 * Reduce a number to 6 decimal points
 * of precision.
 */
export function e6(input: number, e = 6) {
  return Math.round(input * 10 ** e) / 10 ** e;
}

export function e6bbox(bbox: BBox4 | BBox, e = 6) {
  return bbox.map((value) => e6(value, e)).join(',');
}

export function e6position(position: Position, e = 6): Position {
  return position.map((value) => e6(value, e));
}

function truncate3(geometry: MultiPolygon, e = 6): MultiPolygon {
  return {
    type: 'MultiPolygon',
    coordinates: geometry.coordinates.map((shape) =>
      shape.map((ring) => ring.map((position) => e6position(position, e)))
    )
  };
}

function truncate2<T extends Polygon | MultiLineString>(geometry: T, e = 6): T {
  return {
    ...geometry,
    coordinates: geometry.coordinates.map((ring) =>
      ring.map((position) => e6position(position, e))
    )
  };
}

function truncate1<T extends MultiPoint | LineString>(geometry: T, e = 6): T {
  return {
    ...geometry,
    coordinates: geometry.coordinates.map((position) => e6position(position, e))
  };
}

function truncateFC(geojson: FeatureCollection, e = 6): FeatureCollection {
  return {
    ...geojson,
    features: geojson.features.map((feature) =>
      e6geojson(feature, e)
    ) as Feature[]
  };
}

function truncateGC(geojson: GeometryCollection, e = 6): GeometryCollection {
  return {
    type: 'GeometryCollection',
    geometries: geojson.geometries.map(
      (geometry) => e6geojson(geometry, e) as Geometry
    )
  };
}

export function e6feature(geojson: Feature, e = 6): Feature {
  return {
    ...geojson,
    geometry:
      geojson.geometry == null
        ? null
        : (e6geojson(geojson.geometry, e) as Geometry)
  };
}

function truncatePoint(geojson: Point, e = 6): Point {
  return {
    type: 'Point',
    coordinates: e6position(geojson.coordinates, e)
  };
}

/**
 * Truncate the coordinate numbers of any GeoJSON
 * input to 6 decimals, or another value set by e
 */
export function e6geojson(geojson: GeoJSON, e = 6): GeoJSON {
  switch (geojson.type) {
    case 'MultiPolygon':
      return truncate3(geojson, e);
    case 'Polygon':
      return truncate2(geojson, e);
    case 'MultiLineString':
      return truncate2(geojson, e);
    case 'MultiPoint':
      return truncate1(geojson, e);
    case 'LineString':
      return truncate1(geojson, e);
    case 'Point':
      return truncatePoint(geojson, e);
    case 'Feature':
      return e6feature(geojson, e);
    case 'FeatureCollection':
      return truncateFC(geojson, e);
    case 'GeometryCollection':
      return truncateGC(geojson, e);
  }
}

function fixOuterRing(coordinates: Position[]) {
  if (!isEqual(coordinates[0], last(coordinates))) {
    return coordinates.slice().concat([coordinates[0]]);
  }
  return coordinates;
}

function degeneratePolygon(
  coordinates: Polygon['coordinates']
): Polygon | LineString | null {
  if (coordinates.length === 0) return null;
  const [outer, ...innerRings] = coordinates;
  if (outer.length < 3) {
    return null;
  } else if (outer.length === 3) {
    return {
      type: 'LineString',
      coordinates: outer.slice(0, 2)
    };
  }
  remove(innerRings, (line) => line.length > 2);
  return {
    type: 'Polygon',
    coordinates: [fixOuterRing(outer), ...innerRings]
  };
}

/**
 * Given any geometry, try to fix it if it's broken - for example,
 * if it's an unclosed Polygon. If it can't be fixed, return
 * null to tell the map not to render it.
 */
export function removeDegenerates(geometry: Geometry): Geometry | null {
  switch (geometry.type) {
    case 'LineString': {
      if (geometry.coordinates.length < 2) return null;
      break;
    }
    case 'MultiLineString': {
      const coordinates = geometry.coordinates.filter(
        (line) => line.length > 2
      );
      if (coordinates.length === 0) return null;
      return {
        type: 'MultiLineString',
        coordinates
      };
    }
    case 'Polygon': {
      return degeneratePolygon(geometry.coordinates);
    }
    case 'MultiPolygon': {
      const components = geometry.coordinates.flatMap((polygon) => {
        const res = degeneratePolygon(polygon);
        return res ? [res] : [];
      });

      if (components.length === 0) return null;

      if (components.every((c) => c.type === 'Polygon')) {
        return {
          type: 'MultiPolygon',
          coordinates: components.map((c) => c.coordinates)
        };
      } else {
        return {
          type: 'GeometryCollection',
          geometries: components
        };
      }
    }
    case 'MultiPoint': {
      if (geometry.coordinates.length === 0) return null;
      break;
    }
    case 'Point': {
      if (!geometry.coordinates) return null;
      return geometry;
    }
    case 'GeometryCollection': {
      const geometries = geometry.geometries
        .map((geometry) => removeDegenerates(geometry))
        .flatMap((geom) => {
          if (!geom) return [];
          if (geom.type === 'GeometryCollection') return geom.geometries;
          return [geom];
        });
      if (geometries.length === 0) return null;
      return {
        type: 'GeometryCollection',
        geometries
      };
    }
  }
  return geometry;
}
