import type { ConvertError } from 'app/lib/errors';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type {
  FeatureCollection,
  Geometry,
  IFeature,
  IFeatureCollection
} from 'types';
import type { ExportOptions, ExportResult, FileType, ImportOptions } from '.';
import { type ConvertResult, okResult } from './utils';

/**
 * The FlatGeobuf format doesn’t support null geometries.
 * This removes them.
 *
 * This also serializes any complex properties
 */
export function adjustForFgb(
  geojson: FeatureCollection
): IFeatureCollection<Geometry> {
  const features: IFeature<Geometry>[] = [];

  for (const feature of geojson.features) {
    if (!feature.geometry) {
      // FlatGeobuf cannot encode features without
      // a geometry member.
      continue;
    }

    features.push({
      ...(feature as IFeature<Geometry>),
      properties: feature.properties
        ? Object.fromEntries(
            Object.entries(feature.properties).map(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                return [key, JSON.stringify(value)];
              }
              return [key, value];
            })
          )
        : null
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

class CFlatGeobuf implements FileType {
  id = 'flatgeobuf' as const;
  label = 'FlatGeobuf';
  extensions = ['.fgb'];
  filenames = [] as string[];
  mimes = [] as string[];
  forwardBinary(file: ArrayBuffer, _options: ImportOptions) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardFlatGeobuf() {
        const flatgeobuf = await import('flatgeobuf/lib/mjs/geojson');
        // TODO: use Array.fromAsync in a year or two, when it's widely
        // available.
        const features = [];
        const iterator = flatgeobuf.deserialize(new Uint8Array(file));
        for await (const feature of iterator) {
          features.push(feature);
        }
        return okResult({
          type: 'FeatureCollection',
          features
        });
      }
    );
  }
  back({ geojson }: { geojson: FeatureCollection }, _options: ExportOptions) {
    return EitherAsync<ConvertError, ExportResult>(
      async function backFlatGeobuf() {
        const flatgeobuf = await import('flatgeobuf/lib/mjs/geojson');
        const res = flatgeobuf.serialize(adjustForFgb(geojson));
        return {
          blob: new Blob([res]),
          name: 'features.fgb'
        };
      }
    );
  }
}

const FlatGeobuf = new CFlatGeobuf();

export { FlatGeobuf };
