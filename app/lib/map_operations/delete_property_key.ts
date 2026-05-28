import omit from 'lodash/omit';
import type { Feature } from 'types';

export function deletePropertyKey(
  feature: Feature,
  { key }: { key: string }
): Feature {
  return {
    ...feature,
    properties: omit(feature.properties, key)
  };
}
