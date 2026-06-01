import { GeometryError } from 'app/lib/errors';
import replaceCoordinates from 'app/lib/replace_coordinates';
import * as clipping from 'polygon-clipping';
import type { Either } from 'purify-ts/Either';
import { Left, Right } from 'purify-ts/Either';
import type { Feature, IFeature, Polygon } from 'types';

const { difference } = clipping;

function featureContainsFeature(
  a: IFeature<Polygon>,
  b: IFeature<Polygon>
): boolean {
  const res = difference(
    a.geometry.coordinates as clipping.Geom,
    b.geometry.coordinates as clipping.Geom
  );
  return res.length === 0;
}

export enum CanInnerRingResult {
  Yes,
  No
}

export function canInnerRing(features: Feature[]): CanInnerRingResult {
  if (features.length !== 2) return CanInnerRingResult.No;

  return features[0].geometry?.type === 'Polygon' &&
    features[1].geometry?.type === 'Polygon'
    ? CanInnerRingResult.Yes
    : CanInnerRingResult.No;
  // TODO: be more precise
  //   featureContainsFeature(aFeature, bFeature) ||
  //   featureContainsFeature(bFeature, aFeature)
}

export function addInnerRing(
  aFeature: IFeature<Polygon>,
  bFeature: IFeature<Polygon>
): Either<GeometryError, Feature[]> {
  let outerFeature: IFeature<Polygon>;
  let innerFeature: IFeature<Polygon>;

  if (featureContainsFeature(aFeature, bFeature)) {
    innerFeature = aFeature;
    outerFeature = bFeature;
  } else if (featureContainsFeature(bFeature, aFeature)) {
    innerFeature = bFeature;
    outerFeature = aFeature;
  } else {
    return Left(new GeometryError('Inner ring is outside the outer ring'));
  }

  const [newInnerRing, ...otherRings] = innerFeature.geometry.coordinates;

  outerFeature = replaceCoordinates(
    outerFeature,
    outerFeature.geometry.coordinates.concat([newInnerRing])
  );

  if (outerFeature.properties !== null && innerFeature.properties !== null) {
    outerFeature = {
      ...outerFeature,
      properties: { ...outerFeature.properties, ...innerFeature.properties }
    };
  }

  const newFeatures: Feature[] = [];

  if (otherRings.length) {
    for (const ring of otherRings) {
      newFeatures.push({
        ...innerFeature,
        geometry: {
          type: 'Polygon',
          coordinates: [ring]
        }
      });
    }
  }

  newFeatures.push(outerFeature);

  return Right(newFeatures);
}
