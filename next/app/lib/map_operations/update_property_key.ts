import renameProperty from 'app/lib/rename_property';
import type { Feature } from 'types';

export function updatePropertyKey(
  feature: Feature,
  {
    key,
    newKey
  }: {
    key: string;
    newKey: string;
  }
): Feature {
  return {
    ...feature,
    properties: renameProperty(feature.properties, key, newKey)
  };
}
