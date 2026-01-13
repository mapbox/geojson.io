import { centroidFeature } from 'app/lib/map_operations/draw_label_points';
import { EMPTY_MOMENT, type MomentInput } from 'app/lib/persistence/moment';
import { USelection } from 'state';
import type { Sel } from 'state/jotai';
import type { IWrappedFeature, Position } from 'types';

type Sums = [number, number, number];

function sumRing(ring: Position[], sums: Sums) {
  for (let i = 0; i < ring.length - 1; i++) {
    const position = ring[i];
    sums[0] += position[0];
    sums[1] += position[1];
    sums[2]++;
  }
  return sums;
}

function averageSums([x, y, len]: Sums): Pos2 {
  return [x / len, y / len];
}

/**
 * Very basic centroid math here, the same as Turf.
 */
export function drawCentroids(wrappedFeatures: IWrappedFeature[]): {
  newSelection: Sel;
  moment: MomentInput;
} {
  const putFeatures: MomentInput['putFeatures'] = wrappedFeatures.flatMap(
    (wrappedFeature) => {
      const geometry = wrappedFeature.feature.geometry;
      if (geometry) {
        const sums: Sums = [0, 0, 0];
        switch (geometry.type) {
          case 'MultiPolygon': {
            for (const polygon of geometry.coordinates) {
              for (const ring of polygon) {
                sumRing(ring, sums);
              }
            }
            return [centroidFeature(wrappedFeature, averageSums(sums))];
          }
          case 'Polygon': {
            for (const ring of geometry.coordinates) {
              sumRing(ring, sums);
            }
            return [centroidFeature(wrappedFeature, averageSums(sums))];
          }
          default: {
            return [];
          }
        }
      }
      return [];
    }
  );

  return {
    newSelection: USelection.fromIds(putFeatures.map((f) => f.id)),
    moment: {
      ...EMPTY_MOMENT,
      note: 'Added centroids',
      track: 'operation-centroids',
      putFeatures
    }
  };
}
