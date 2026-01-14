import replaceCoordinates from 'app/lib/replace_coordinates';
import type { IFeature, Polygon } from 'types';

/**
 * Used when someone hits "Enter" or "Escape" while drawing
 * a polygon. This closes the polygon by adding the last-equals-first
 * coordinate at the end.
 */
export function closePolygon(feature: IFeature<Polygon>) {
  const ring = feature.geometry.coordinates[0];
  const firstPoint = ring[0];
  let oldRing = feature.geometry.coordinates[0];
  if (oldRing.length > 4) {
    oldRing = oldRing.slice(0, -2);
  }
  const newRing = oldRing.concat([firstPoint]);
  return replaceCoordinates(feature, [newRing]);
}
