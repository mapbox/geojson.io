import { getCircleProp, makeCircle } from 'app/lib/circle';
import { idToJSONPointers } from 'app/lib/id';
import { deletePropertyKey } from 'app/lib/map_operations/delete_property_key';
import * as jsonpointer from 'app/lib/pointer';
import cloneDeep from 'lodash/cloneDeep';
import type { Feature } from 'types';

export function setCoordinates({
  feature: featureInput,
  position,
  vertexId,
  breakRectangle = false
}: {
  feature: Feature;
  position: Pos2;
  vertexId: VertexId;
  breakRectangle?: boolean;
}): { feature: Feature; wasRectangle: boolean; wasCircle: boolean } {
  let feature = cloneDeep(featureInput);

  const movedRectangle =
    !breakRectangle && moveAsRectangle({ feature, position, vertexId });

  if (movedRectangle) {
    return { feature: movedRectangle, wasRectangle: true, wasCircle: false };
  }

  const wasCircle = getCircleProp(feature);
  const resizeCircle =
    !breakRectangle && moveAsCircle({ feature, position, vertexId });

  if (resizeCircle) {
    return { feature: resizeCircle, wasRectangle: false, wasCircle: true };
  }

  if (wasCircle && breakRectangle) {
    feature = deletePropertyKey(feature, { key: '@circle' });
  }

  // There may be multiple pointers because of Polygon
  // and MultiPolygon geometries, which have looped coordinates.
  const pointers = idToJSONPointers(vertexId, feature);

  for (const pointer of pointers) {
    feature = jsonpointer.clone(feature, pointer);
  }

  for (const pointer of pointers) {
    jsonpointer.set(feature, pointer, position);
  }

  return { feature, wasRectangle: false, wasCircle: false };
}

interface MoveArgs {
  feature: Feature;
  position: Pos2;
  vertexId: VertexId;
}

function moveAsCircle({ feature, position, vertexId: _v }: MoveArgs) {
  const prop = getCircleProp(feature);

  if (!prop) return null;

  return {
    ...feature,
    geometry: makeCircle({
      center: prop.center,
      type: prop.type,
      mouse: position
    })
  };
}

function moveAsRectangle({
  feature,
  position,
  vertexId
}: MoveArgs): Feature | null {
  const type = feature.geometry?.type;
  if (!(type === 'Polygon' || type === 'MultiPolygon')) return null;

  // There may be multiple pointers because of Polygon
  // and MultiPolygon geometries, which have looped coordinates.
  const pointers = idToJSONPointers(vertexId, feature);

  const ringPointer = pointers[0].split('/').slice(0, -1).join('/');
  const ring = jsonpointer.get(feature, ringPointer) as undefined | Pos2[];

  if (!ring || !isRect(ring)) return null;

  const target = jsonpointer.get(feature, pointers[0]) as Pos2;
  const newRing = cloneDeep(ring.slice()).slice(0, 4);

  const targetIndex = ring.indexOf(target);

  const beforeCoord = newRing.at(targetIndex - 1);
  const afterCoord = newRing.at((targetIndex + 1) % newRing.length);

  newRing[targetIndex] = position;
  lockDirection(beforeCoord, target, position);
  lockDirection(afterCoord, target, position);

  newRing.push(cloneDeep(newRing[0].slice()) as Pos2);

  jsonpointer.set(feature, ringPointer, newRing);

  return feature;
}

function lockDirection(
  targetCoord: Pos2 | undefined,
  reference: Pos2,
  position: Pos2
) {
  if (!targetCoord) {
    return;
  }

  if (targetCoord[0] === reference[0]) {
    targetCoord[0] = position[0];
  } else if (targetCoord[1] === reference[1]) {
    targetCoord[1] = position[1];
  }
}

function isRect(ring: Pos2[]) {
  if (ring.length !== 5) return false;
  const [tl, tr, br, bl] = ring;
  for (const axis of [true, false]) {
    const a = axis === true ? 1 : 0;
    const b = axis === true ? 0 : 1;
    if (
      tl[a] === tr[a] &&
      tr[b] === br[b] &&
      br[a] === bl[a] &&
      bl[b] === tl[b]
    ) {
      return true;
    }
  }
  return false;
}
