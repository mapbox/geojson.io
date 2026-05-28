import { rewindFeature } from '@placemarkio/geojson-rewind';
import { GEOJSONIO_ID_PROP } from 'app/lib/constants';
import { addBbox, e6feature } from 'app/lib/geometry';
import cloneDeep from 'lodash/cloneDeep';
import type { FeatureCollection, FeatureMap, IWrappedFeature } from 'types';
import type { ExportOptions } from '..';

function wrappedFeatureToExportable(
  wrappedFeature: IWrappedFeature,
  options: ExportOptions['geojsonOptions']
) {
  let feature = cloneDeep(wrappedFeature.feature);
  const { id } = wrappedFeature;

  feature = options?.truncate ? e6feature(feature) : feature;

  if (options?.addBboxes) {
    feature = addBbox(feature);
  }

  if (options?.includeId) {
    if (!feature.properties) {
      feature.properties = {};
    }
    feature.properties[GEOJSONIO_ID_PROP] = id;
  }

  return feature;
}

export function geojsonToString(
  featureMap: FeatureMap,
  options: ExportOptions['geojsonOptions']
) {
  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: Array.from(featureMap.values(), (wrappedFeature) => {
      return rewindFeature(
        wrappedFeatureToExportable(wrappedFeature, options),
        options?.winding
      );
    })
  };

  const stringified = options?.indent
    ? JSON.stringify(featureCollection, null, 4)
    : JSON.stringify(featureCollection);
  return stringified;
}
