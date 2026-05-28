import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import type { JsonValue } from 'type-fest';
import type { FeatureMap, IWrappedFeature } from 'types';

/*
 * property -> { value: FeatureId[] }
 */
type PropertyKey = string;
type SubMap = Map<JsonValue | undefined, number>;
type MultiPropertyMap = Map<PropertyKey, SubMap>;
export type MultiPair = [string, SubMap];

/**
 * A much simpler, faster version of 'extract multiProperties'.
 * Just gives you keps.
 */
export function extractPropertyKeys(featureMap: FeatureMap): string[] {
  const keys = new Set<string>();

  for (const feature of featureMap.values()) {
    if (!feature.feature.properties) continue;
    // performance sensitive here.
    for (const key in feature.feature.properties) {
      keys.add(key);
    }
  }

  return Array.from(keys);
}

/**
 * A rather performance-critical method,
 * this is used for multi-selection states, looking
 * at all selected features and figuring all
 * values of their properties.
 */
export function extractMultiProperties(
  features: IWrappedFeature[]
): MultiPropertyMap {
  const map: MultiPropertyMap = new Map();

  for (const feature of features) {
    if (!feature.feature.properties) continue;
    for (const key in feature.feature.properties) {
      const value = feature.feature.properties[key];

      // { key -> {} }
      if (!map.has(key)) map.set(key, new Map());
      const submap = map.get(key)!;

      // Increment { key: count }
      if (isObject(value)) {
        let updated = false;
        for (const [oldKey, count] of submap.entries()) {
          if (isEqual(oldKey, value)) {
            submap.set(oldKey, count + 1);
            updated = true;
            break;
          }
        }
        if (!updated) {
          submap.set(value, 1);
        }
      } else {
        submap.set(value, (submap.get(value) || 0) + 1);
      }
    }
  }

  return map;
}
