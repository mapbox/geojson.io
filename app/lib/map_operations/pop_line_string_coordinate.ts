import type { Feature } from 'types';

export function popLineStringCoordinate(
  feature: Feature,
  { reverse }: { reverse: boolean }
): Feature {
  const { geometry } = feature;
  if (geometry?.type !== 'LineString') return feature;
  const coordinates = geometry.coordinates.slice();
  if (reverse) {
    coordinates.shift();
  } else {
    coordinates.pop();
  }
  return {
    ...feature,
    geometry: {
      type: 'LineString',
      coordinates
    }
  };
}
