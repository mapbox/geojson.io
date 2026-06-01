import { newFeatureId } from 'app/lib/id';
import type { MomentInput } from 'app/lib/persistence/moment';
import type { Feature, IWrappedFeature } from 'types';

export function divideFeatures(
  features: IWrappedFeature[]
): Pick<MomentInput, 'putFeatures' | 'deleteFeatures'> {
  let putFeatures: MomentInput['putFeatures'] = [];
  const deleteFeatures: MomentInput['deleteFeatures'] = [];
  for (const feature of features) {
    const putRawFeatures = divideFeature(feature.feature);
    // This feature cannot be divided, ignore it.
    if (putRawFeatures === null) continue;

    deleteFeatures.push(feature.id);

    putFeatures = putFeatures.concat(
      putRawFeatures.map((newFeature) => {
        return {
          id: newFeatureId(),
          feature: newFeature
        };
      })
    );
  }

  return { putFeatures, deleteFeatures };
}

export function divideFeature(feature: Feature): Feature[] | null {
  const properties = feature.properties;

  if (feature.geometry === null) {
    return null;
  }

  switch (feature.geometry.type) {
    case 'Point':
    case 'LineString':
    case 'Polygon':
      return null;
    case 'GeometryCollection':
      return feature.geometry.geometries.map((geometry) => {
        return {
          type: 'Feature',
          properties,
          geometry
        };
      });
    case 'MultiLineString':
      return feature.geometry.coordinates.map((coord) => {
        return {
          type: 'Feature',
          properties,
          geometry: {
            type: 'LineString',
            coordinates: coord
          }
        };
      });
    case 'MultiPolygon':
      return feature.geometry.coordinates.map((coord) => {
        return {
          type: 'Feature',
          properties,
          geometry: {
            type: 'Polygon',
            coordinates: coord
          }
        };
      });
    case 'MultiPoint':
      return feature.geometry.coordinates.map((coord) => {
        return {
          type: 'Feature',
          properties,
          geometry: {
            type: 'Point',
            coordinates: coord
          }
        };
      });
  }
}
