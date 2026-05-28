import { idToJSONPointers } from 'app/lib/id';
import * as jsonpointer from 'app/lib/pointer';
import { Maybe } from 'purify-ts/Maybe';
import type { JsonValue } from 'type-fest';
import type { Feature, Position } from 'types';

function handleNumber(input: JsonValue): number {
  return typeof input === 'number' && !Number.isNaN(input) ? input : 0;
}

export function getCoordinates(feature: Feature, id: VertexId): Position {
  const [pointer] = idToJSONPointers(id, feature);
  const position = jsonpointer.get(feature, pointer);
  if (!position || !Array.isArray(position)) {
    throw new Error('Unexpected: bad ID, cannot get position');
  }
  const [x, y, z] = position;

  if (z === undefined) {
    return [handleNumber(x), handleNumber(y)];
  }
  return [handleNumber(x), handleNumber(y), handleNumber(z)];
}

export function getCoordinatesMaybe(
  feature: Feature,
  id: VertexId
): Maybe<Position> {
  return Maybe.encase(() => getCoordinates(feature, id));
}
