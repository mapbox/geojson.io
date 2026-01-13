import type { GeoJsonProperties } from 'types';

// Rename a property in an object, but keep
// properties in the same order, by generating
// a new ordered object.
export default function renameProperty(
  obj: GeoJsonProperties,
  oldKey: string,
  newKey: string
) {
  const newObj: GeoJsonProperties = {};
  for (const key in obj) {
    if (key === oldKey) {
      newObj[newKey] = obj[oldKey];
    } else if (key !== newKey) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
