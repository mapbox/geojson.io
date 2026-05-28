import type { Sel } from 'state/jotai';
import type { Feature, IFeature, LineString } from 'types';

/**
 * Triggered when a user drags a midpoint, this basically instantiates
 * that vertex and adds it to the coordinates array of the linestring
 * or polygon.
 */
export function splitLine({
  feature,
  sel
}: {
  feature: IFeature<LineString>;
  sel: Sel;
}): Feature[] {
  if (sel.type !== 'single' || sel.parts.length === 0) return [];

  const features: IFeature<LineString>[] = [];
  const coordinates = feature.geometry.coordinates;

  let last = 0;
  for (const { vertex } of sel.parts) {
    const sub = coordinates.slice(last, vertex + 1);
    last = vertex;
    if (sub.length > 1) {
      features.push({
        ...feature,
        geometry: {
          type: 'LineString',
          coordinates: sub
        }
      });
    }
  }

  if (last !== coordinates.length - 1) {
    const sub = coordinates.slice(last);
    features.push({
      ...feature,
      geometry: {
        type: 'LineString',
        coordinates: sub
      }
    });
  }

  return features;
}
