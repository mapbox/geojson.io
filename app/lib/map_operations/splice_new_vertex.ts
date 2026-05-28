import { idToJSONPointers } from 'app/lib/id';
import * as jsonpointer from 'app/lib/pointer';
import type { Operation } from 'fast-json-patch';
import { applyPatch } from 'fast-json-patch';
import type { Feature } from 'types';

function offsetPointer(pointer: string) {
  return pointer.replace(/(\d+)$/, (index) => {
    return (parseInt(index, 10) + 1).toString();
  });
}

/**
 * Triggered when a user drags a midpoint, this basically instantiates
 * that vertex and adds it to the coordinates array of the linestring
 * or polygon.
 */
export function spliceNewVertex({
  feature,
  id,
  position
}: {
  feature: Feature;
  id: MidpointId;
  position: Pos2;
}): Feature {
  const [pointer] = idToJSONPointers(id, feature);

  // TODO: generate midpoint
  const patch: Operation = {
    op: 'add',
    path: offsetPointer(pointer),
    value: position
  };

  const copy = jsonpointer.clone(feature, pointer);
  applyPatch(copy, [patch]);

  return copy;
}
