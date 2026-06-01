import type { Either } from 'purify-ts/Either';
import { Right } from 'purify-ts/Either';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { IFeature } from 'types';
import { CoordinateString } from './convert/coordinate_string';
import type { GeojsonIOError } from './errors';
import { ConvertError } from './errors';

/**
 * This powers the "Copy" UI for single features.
 */
export const COPIERS: Record<
  'wkt' | 'geojson' | 'geohash' | 'coordinates' | 'polyline' | 'bbox',
  (arg0: IFeature) => Promise<Either<GeojsonIOError, string>>
> = {
  wkt: async (feature) => {
    const { WKT } = await import('app/lib/convert/wkt');
    return WKT.featureToString(feature);
  },
  geojson: (feature) => {
    return Promise.resolve(Right(JSON.stringify(feature)));
  },
  geohash: async (feature) => {
    return await EitherAsync(async function copyGeohash({ throwE }) {
      const geometry = feature.geometry;
      if (geometry.type !== 'Point') {
        return throwE(
          new ConvertError('Only Point features can be copied as geohash')
        );
      }
      const geohash = await import('vendor/geohash');
      return geohash.encode(geometry.coordinates as [number, number]);
    });
  },
  coordinates: (feature) => {
    return Promise.resolve(CoordinateString.featureToString(feature));
  },
  bbox: async (feature) => {
    const { BBOX } = await import('app/lib/convert/bbox');
    return BBOX.featureToString(feature);
  },
  polyline: async (feature) => {
    const { Polyline } = await import('app/lib/convert/polyline');
    return Polyline.featureToString(feature);
  }
};
