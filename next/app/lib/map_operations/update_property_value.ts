import { cast, recast } from 'app/lib/cast';
import type { JsonObject, JsonValue } from 'type-fest';
import type { Feature } from 'types';

/**
 * Note: this tries to maintain object key order
 */
export function updatePropertyValue(
  feature: Feature,
  {
    key,
    value
  }: {
    key: string;
    value: JsonValue;
  }
) {
  const { properties: oldProperties } = feature;
  const properties = { ...oldProperties } as JsonObject;
  const oldValue = properties[key]!;
  if (oldValue === undefined) {
    // This is a new value and a string:
    // guess what type it is.
    if (typeof value === 'string') {
      properties[key] = cast(value);
      return {
        ...feature,
        properties
      };
    } else {
      properties[key] = value;
      return {
        ...feature,
        properties
      };
    }
  } else {
    properties[key] = recast(oldValue, value);
    return {
      ...feature,
      properties
    };
  }
}
