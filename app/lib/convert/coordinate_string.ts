import { ConvertError } from 'app/lib/errors';
import { e6position, parseCoordinates } from 'app/lib/geometry';
import readAsText from 'app/lib/read_as_text';
import { eitherToAsync } from 'app/lib/utils';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { Feature, Point } from 'types';
import type { FileType, ImportOptions } from '.';
import { okResult } from './utils';

class CCoordinateString implements FileType {
  id = 'coordinate-string' as const;
  label = 'Coordinate string';
  extensions = [] as string[];
  filenames = [] as string[];
  mimes = [] as string[];
  forwardString(text: string, options: ImportOptions) {
    return eitherToAsync(
      parseCoordinates(text).map((coordinates) => {
        if (options.coordinateStringOptions.order === 'LATLON') {
          coordinates.reverse();
        }

        return okResult({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates
              },
              properties: {}
            }
          ]
        });
      })
    );
  }
  featureToString(feature: Feature) {
    return EitherAsync<ConvertError, string>(function copyPoint({ throwE }) {
      const geometry = feature.geometry;
      if (geometry?.type !== 'Point') {
        return throwE(
          new ConvertError(
            'Only Point features can be copied as a coordinate string'
          )
        );
      }
      return Promise.resolve(
        e6position((feature.geometry as Point).coordinates).join(',')
      );
    });
  }
  forwardBinary(file: ArrayBuffer, options: ImportOptions) {
    return readAsText(file).chain((text) => {
      return this.forwardString(text, options);
    });
  }
}

export const CoordinateString = new CCoordinateString();
