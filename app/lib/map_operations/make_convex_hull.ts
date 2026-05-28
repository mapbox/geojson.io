import type { Feature } from 'types';
import { convex } from 'vendor/concaveman';

export const makeConvexHull = (features: Feature[]) => {
  const hull = convex({
    type: 'FeatureCollection',
    features: features
  });

  return hull;
};
