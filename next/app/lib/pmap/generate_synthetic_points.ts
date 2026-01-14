import { midpoint } from 'app/lib/geometry';
import { encodeMidpoint, encodeVertex } from 'app/lib/id';
import memoize from 'memoize-one';
import { match } from 'ts-pattern';
import type {
  Feature,
  GeoJsonProperties,
  Geometry,
  GeometryCollection,
  IFeature,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position
} from 'types';

// fp = FromPoint
const propertiesFromPoint = { fp: true };

class Vertex implements IFeature<Point> {
  id: RawId;
  geometry: Point;
  constructor(id: RawId, coordinate: Position, fromPoint: boolean) {
    this.id = id;
    this.geometry = {
      type: 'Point',
      coordinates: coordinate
    };
    this.properties = fromPoint ? propertiesFromPoint : null;
  }
  properties: GeoJsonProperties;
  type = 'Feature' as IFeature<Point>['type'];
}

class Midpoint implements IFeature<Point> {
  id: RawId;
  geometry: Point;
  constructor(id: RawId, coordinate: Position) {
    this.id = id;
    this.geometry = {
      type: 'Point',
      coordinates: coordinate
    };
  }
  properties = null;
  type = 'Feature' as IFeature<Point>['type'];
}

enum RingType {
  Polygon,
  LineString,
  Point
}

/**
 * @param index - The feature part of the ID that will be generated for each
 * Vertex.
 * @param offset - In the case where there are multiple rings, this is the
 * offset of this ring - the number of vertexes already accounted for in previous
 * rings.
 * @param notLooped - Polygon rings repeat the last coordinate, but LineStrings
 * do not. We want one vertex for that last coordinate, not two.
 */
function syntheticPointsForRing({
  ring,
  syntheticPoints,
  index,
  offset,
  ringType
}: {
  ring: Position[];
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
  ringType: RingType;
}) {
  // The last point of a polygon is repeated, don’t create
  // a vertex for it because it would be overlapping.
  const end = ring.length - (ringType === RingType.Polygon ? 1 : 0);
  for (let i = 0; i < end; i++) {
    syntheticPoints.push(
      new Vertex(
        encodeVertex(index, offset),
        ring[i],
        ringType === RingType.Point
      )
    );
    if (ringType !== RingType.Point && i < ring.length - 1) {
      syntheticPoints.push(
        new Midpoint(
          encodeMidpoint(index, offset),
          midpoint(ring[i], ring[i + 1])
        )
      );
    }
    offset++;
  }
  return offset;
}

function syntheticPointsForPolygon({
  geometry,
  syntheticPoints,
  index,
  offset
}: {
  geometry: Polygon;
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
}) {
  for (const ring of geometry.coordinates) {
    offset = syntheticPointsForRing({
      ring,
      syntheticPoints,
      index,
      offset,
      ringType: RingType.Polygon
    });
  }
  return offset;
}

function syntheticPointsForMultiPolygon({
  geometry,
  syntheticPoints,
  index,
  offset
}: {
  geometry: MultiPolygon;
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
}) {
  for (const polygon of geometry.coordinates) {
    for (const ring of polygon) {
      offset = syntheticPointsForRing({
        ring,
        syntheticPoints,
        index,
        offset,
        ringType: RingType.Polygon
      });
    }
  }
  return offset;
}

function syntheticPointsForLineString({
  geometry,
  syntheticPoints,
  index,
  offset
}: {
  geometry: LineString;
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
}) {
  offset = syntheticPointsForRing({
    ring: geometry.coordinates,
    syntheticPoints,
    index,
    offset,
    ringType: RingType.LineString
  });
  return offset;
}

/**
 * INCREMENT: 1
 */
function syntheticPointsForPoint({
  geometry,
  syntheticPoints,
  index,
  offset
}: {
  geometry: Point;
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
}) {
  syntheticPoints.push(
    new Vertex(encodeVertex(index, offset), geometry.coordinates, true)
  );
  return offset + 1;
}

/**
 * INCREMENT: # of points
 */
function syntheticPointsForMultiPoint({
  geometry,
  syntheticPoints,
  index,
  offset
}: {
  geometry: MultiPoint;
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
}) {
  return syntheticPointsForRing({
    ring: geometry.coordinates,
    syntheticPoints,
    index,
    offset,
    ringType: RingType.Point
  });
}

/**
 * INCREMENT: # of vertexes
 */
function syntheticPointsForMultiLineString({
  geometry,
  syntheticPoints,
  index,
  offset
}: {
  geometry: MultiLineString;
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
}) {
  for (const line of geometry.coordinates) {
    offset = syntheticPointsForRing({
      ring: line,
      syntheticPoints,
      index,
      offset,
      ringType: RingType.LineString
    });
  }
  return offset;
}

function syntheticPointsForGeometryCollection({
  geometry,
  syntheticPoints,
  index,
  offset
}: {
  geometry: GeometryCollection;
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
}) {
  for (const geometryPart of geometry.geometries) {
    // This should never happen! But it also will
    // blow this up.
    if (!geometryPart) continue;
    offset = generateSyntheticPointsForGeometry({
      geometry: geometryPart,
      syntheticPoints,
      index,
      offset
    });
  }
  return offset;
}

function generateSyntheticPointsForGeometry(args: {
  geometry: Geometry | null;
  syntheticPoints: IFeature<Point>[];
  index: number;
  offset: number;
}) {
  return match(args)
    .with({ geometry: null }, () => 0)
    .with({ geometry: { type: 'LineString' } }, (args) =>
      syntheticPointsForLineString(args)
    )
    .with({ geometry: { type: 'MultiLineString' } }, (args) =>
      syntheticPointsForMultiLineString(args)
    )
    .with({ geometry: { type: 'MultiPoint' } }, (args) =>
      syntheticPointsForMultiPoint(args)
    )
    .with({ geometry: { type: 'Point' } }, (args) =>
      syntheticPointsForPoint(args)
    )
    .with({ geometry: { type: 'Polygon' } }, (args) =>
      syntheticPointsForPolygon(args)
    )
    .with({ geometry: { type: 'MultiPolygon' } }, (args) =>
      syntheticPointsForMultiPolygon(args)
    )
    .with({ geometry: { type: 'GeometryCollection' } }, (args) =>
      syntheticPointsForGeometryCollection(args)
    )
    .otherwise(() => 0);
}

/**
 * Synthetic points are vertexes and midpoints. They aren't
 * part of the GeoJSON root data: they're generated when
 * data is sent to the map.
 */
export const generateSyntheticPoints = memoize(function generateSyntheticPoints(
  feature: Feature,
  index: number
): IFeature<Point>[] {
  const syntheticPoints: IFeature<Point>[] = [];
  const { geometry } = feature;

  generateSyntheticPointsForGeometry({
    geometry,
    syntheticPoints,
    index,
    offset: 0
  });

  return syntheticPoints;
});
