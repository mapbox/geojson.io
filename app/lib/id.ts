import { customAlphabet } from 'nanoid';
import { match } from 'ts-pattern';
import type { Feature, Geometry, Position } from 'types';
import { v1 as uuidv1 } from 'uuid';

export function newFeatureId(): string {
  return uuidv1();
}

/**
 * Nearly the default configuration - same length
 * as stock nanoid, but removes _ and - from the alphabet,
 * because we've been battling a case in which URLs are wrapped
 * in emails, resulting in invitations being impossible to accept.
 */
export const nanoid = customAlphabet(
  'useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict',
  21
);

const A = 1e9;

export function encodeFeature(featureId: number): RawId {
  return featureId as RawId;
}

export function encodeVertex(featureId: number, vertex: number): RawId {
  return ((featureId + 1) * A + vertex * 2) as RawId;
}

export function encodeMidpoint(featureId: number, vertex: number): RawId {
  return ((featureId + 1) * A + vertex * 2 + 1) as RawId;
}

class CFeatureId implements FeatureId {
  type = 'feature' as const;
  featureId: number;
  constructor(id: number) {
    this.featureId = id;
  }
  static from(id: Id) {
    return new CFeatureId(id.featureId);
  }
}

export class CVertexId implements VertexId {
  type = 'vertex' as const;
  featureId: number;
  vertex: number;
  constructor(featureId: number, vertex: number) {
    this.featureId = featureId;
    this.vertex = vertex;
  }
  static fromMidpoint(id: MidpointId) {
    return new CVertexId(id.featureId, id.vertex);
  }
}

class CMidpointId implements MidpointId {
  type = 'midpoint' as const;
  featureId: number;
  vertex: number;
  constructor(featureId: number, vertex: number) {
    this.featureId = featureId;
    this.vertex = vertex;
  }
}

export function encodeId(id: Id): RawId {
  switch (id.type) {
    case 'feature':
      return encodeFeature(id.featureId);
    case 'vertex':
      return encodeVertex(id.featureId, id.vertex);
    case 'midpoint':
      return encodeMidpoint(id.featureId, id.vertex);
  }
}

export function decodeId(id: RawId): Id {
  if (id < A) {
    return new CFeatureId(id);
  }

  const featureId = Math.floor(id / A) - 1;
  const vertex = id % A;

  if (vertex % 2 === 0) {
    return new CVertexId(featureId, vertex / 2);
  } else {
    return new CMidpointId(featureId, (vertex - 1) / 2);
  }
}

function patherPosition1(id: VertexId) {
  return `/${id.vertex}`;
}

function patherPosition2(
  id: VertexId,
  coordinates: Position[][],
  loop: boolean
): string[] {
  let start = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const ring = coordinates[i];
    const end = ring.length - (loop ? 1 : 0) + start;
    if (id.vertex >= start && id.vertex < end) {
      const relativeIndex = id.vertex - start;
      const firstPath = `/${i}/${relativeIndex}`;
      if (loop && relativeIndex === 0) {
        return [firstPath, `/${i}/${ring.length - 1}`];
      }
      return [firstPath];
    }
    start = end;
  }
  throw new Error('Bad index encountered');
}

function patherPosition3(id: VertexId, polygons: Position[][][]): string[] {
  let start = 0;
  for (let j = 0; j < polygons.length; j++) {
    const coordinates = polygons[j];
    for (let i = 0; i < coordinates.length; i++) {
      const ring = coordinates[i];
      const end = ring.length - 1 + start;
      if (id.vertex >= start && id.vertex < end) {
        const relativeIndex = id.vertex - start;
        const firstPath = `/${j}/${i}/${relativeIndex}`;
        if (relativeIndex === 0) {
          return [firstPath, `/${j}/${i}/${ring.length - 1}`];
        }
        return [firstPath];
      }
      start = end;
    }
  }
  throw new Error('Bad index encountered');
}

function patherCollection(id: VertexId, geometries: Geometry[]): string[] {
  let offset = 0;
  for (let i = 0; i < geometries.length; i++) {
    const geom = geometries[i];
    if (!geom) continue;
    const increment = countVertexes(geom);
    if (id.vertex >= offset && id.vertex < offset + increment) {
      const prefix = `/${i}/coordinates`;
      return getPath(new CVertexId(id.featureId, id.vertex - offset), geom).map(
        (path) => prefix + path
      );
    }
    offset += increment;
  }
  throw new Error('Bad index encountered');
}

export function countVertexes(geometry: Geometry) {
  return match(geometry)
    .with({ type: 'Point' }, () => 1)
    .with(
      { type: 'LineString' },
      { type: 'MultiPoint' },
      (geometry) => geometry.coordinates.length
    )
    .with({ type: 'Polygon' }, (geometry) => {
      let count = 0;
      for (const ring of geometry.coordinates) {
        count += ring.length - 1;
      }
      return count;
    })
    .with({ type: 'MultiLineString' }, (geometry) => {
      let count = 0;
      for (const ring of geometry.coordinates) {
        count += ring.length;
      }
      return count;
    })
    .with({ type: 'MultiPolygon' }, (geometry) => {
      let count = 0;
      for (const poly of geometry.coordinates) {
        for (const ring of poly) {
          count += ring.length - 1;
        }
      }
      return count;
    })
    .with({ type: 'GeometryCollection' }, (geometry) => {
      let sum = 0;
      for (const g of geometry.geometries) {
        if (g) {
          sum += countVertexes(g);
        }
      }
      return sum;
    })
    .exhaustive();
}

function getPath(id: VertexId, geometry: Geometry): string[] {
  return match(geometry)
    .with({ type: 'Point' }, () => [``])
    .with({ type: 'LineString' }, { type: 'MultiPoint' }, () => {
      return [patherPosition1(id)];
    })
    .with({ type: 'Polygon' }, (geometry) => {
      return patherPosition2(id, geometry.coordinates, true);
    })
    .with({ type: 'MultiLineString' }, (geometry) => {
      return patherPosition2(id, geometry.coordinates, false);
    })
    .with({ type: 'MultiPolygon' }, (geometry) => {
      return patherPosition3(id, geometry.coordinates);
    })
    .with({ type: 'GeometryCollection' }, (geometry) => {
      return patherCollection(id, geometry.geometries);
    })
    .exhaustive();
}

function getVertexPaths(id: VertexId, geometry: Geometry): string[] {
  const prefix =
    geometry.type === 'GeometryCollection'
      ? '/geometry/geometries'
      : '/geometry/coordinates';
  return getPath(id, geometry).map((path) => prefix + path);
}

/**
 * Given an ID, return a pointer that
 * can be used to index this point for _setting_
 *
 * Positions at the end of a ring will be
 * repeated.
 */
export function idToJSONPointers(id: VertexId | MidpointId, feature: Feature) {
  const geometry = feature.geometry;
  if (geometry === null) {
    throw new Error('An id of a null geometry was encountered.');
  }
  switch (id.type) {
    case 'vertex': {
      return getVertexPaths(id, geometry);
    }
    case 'midpoint': {
      const vertexEquivalent: VertexId = CVertexId.fromMidpoint(id);
      return [getVertexPaths(vertexEquivalent, geometry)[0]];
    }
  }
}
