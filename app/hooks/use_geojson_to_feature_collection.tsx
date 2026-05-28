/* Given a GeoJSON Geometry, Feature, or FeatureCollection object, returns a FeatureCollection,
showing a toast to let the user know their imported data has been converted */

import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { FeatureCollection, GeoJSON } from 'types';

export function useGeoJSONtoFeatureCollection() {
  return useCallback((input: GeoJSON): FeatureCollection => {
    let fc: FeatureCollection;

    if (!input || typeof input !== 'object' || !('type' in input)) {
      fc = {
        type: 'FeatureCollection',
        features: []
      };
    } else if (input.type === 'FeatureCollection') {
      fc = input;
    } else if (input.type === 'Feature') {
      toast('Converted Feature to FeatureCollection');
      fc = {
        type: 'FeatureCollection',
        features: [input]
      };
    } else {
      // Assume Geometry
      toast('Converted Geometry to FeatureCollection');
      fc = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: input,
            properties: {}
          }
        ]
      };
    }

    return fc;
  }, []);
}
