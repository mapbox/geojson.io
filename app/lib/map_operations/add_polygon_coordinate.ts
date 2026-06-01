import type { Feature } from 'types';

export function addPolygonCoordinate(
  feature: Feature,
  coordinate: Pos2
): Feature {
  const { geometry } = feature;
  if (geometry?.type === 'Polygon') {
    const ring = geometry.coordinates[0].concat([coordinate]);
    return {
      ...feature,
      geometry: {
        type: 'Polygon',
        coordinates: [ring]
      }
    };
  }
  return feature;
}
