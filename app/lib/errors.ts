import { Either } from 'purify-ts/Either';
import type { JsonValue } from 'type-fest';

export class GeojsonIOError extends Error {
  name = 'GeojsonIOError';
}

export class ConvertError extends GeojsonIOError {
  name = 'ConvertError';
}

export class GeometryError extends GeojsonIOError {
  name = 'GeometryError';
}

export function parseOrError<T = JsonValue>(str: string) {
  return Either.encase(() => {
    return JSON.parse(str) as T;
  });
}
