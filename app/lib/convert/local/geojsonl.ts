import { ConvertError, parseOrError } from 'app/lib/errors';
import { rough } from 'app/lib/roughly_geojson';
import { type Either, Left, Right } from 'purify-ts/Either';
import type { Feature, FeatureCollection } from 'types';

export function GeoJSONToGeoJSONL(geojson: FeatureCollection) {
  return geojson.features
    .map((feature) => {
      return JSON.stringify(feature);
    })
    .join('\n');
}

export function GeoJSONLToGeoJSON(
  geojsonl: string
): Either<ConvertError, FeatureCollection> {
  try {
    let features: Feature[] = [];

    for (const line of geojsonl.split(/[\n|\r]+/)) {
      parseOrError(line)
        .chain((value) => rough(value))
        .ifRight((result) => {
          features = features.concat(result.geojson.features);
        });
    }

    return Right({
      type: 'FeatureCollection',
      features
    } as FeatureCollection);
  } catch (_e) {
    return Left(new ConvertError('Some GeoJSON data in GeoJSONL was invalid'));
  }
}
