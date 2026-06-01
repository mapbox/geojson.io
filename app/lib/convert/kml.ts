import { solveRootItems } from 'app/components/panels/feature_editor/feature_editor_folder/math';
import { ConvertError } from 'app/lib/errors';
import readAsText from 'app/lib/read_as_text';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { FeatureCollection, FeatureMap } from 'types';
import type { ExportOptions, ExportResult, FileType, ImportOptions } from '.';
import { type ConvertResult, stringToBlob, toDom } from './utils';

class CKML implements FileType {
  id = 'kml' as const;
  label = 'KML';
  extensions = ['.kml'];
  filenames = [] as string[];
  mimes = ['application/vnd.google-earth.kml+xml'];
  forwardBinary(file: ArrayBuffer, _options: ImportOptions) {
    return readAsText(file).chain((text) => {
      return KML.forwardString(text);
    });
  }
  forwardString(text: string) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardKML() {
        const toGeoJSON = await import('@tmcw/togeojson');
        const dom = await toDom(text);
        const FeatureCollection = toGeoJSON.kml(dom as unknown as Document);
        return {
          type: 'geojson',
          geojson: FeatureCollection,
          notes: []
        };
      }
    );
  }
  back(
    {
      geojson: _ignore,
      featureMap
    }: {
      geojson: FeatureCollection;
      featureMap: FeatureMap;
    },
    _options: ExportOptions
  ) {
    return EitherAsync<ConvertError, ExportResult>(async ({ throwE }) => {
      const { foldersToKML } = await import('@placemarkio/tokml');
      try {
        const root = solveRootItems(featureMap);
        return {
          blob: stringToBlob(foldersToKML(root)),
          name: 'features.kml'
        };
      } catch (_e) {
        return throwE(new ConvertError('Could not convert to KML'));
      }
    });
  }
}

export const KML = new CKML();
