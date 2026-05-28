import type { ConvertError } from 'app/lib/errors';
import readAsText from 'app/lib/read_as_text';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { Feature, FeatureCollection } from 'types';
import type {
  ExportOptions,
  ExportResult,
  FileType,
  ImportOptions,
  ProgressCb
} from '.';
import { type ConvertResult, okResult, stringToBlob } from './utils';

class CCSV implements FileType {
  id = 'csv' as const;
  label = 'CSV';
  extensions = ['.csv', '.tsv'];
  filenames = [] as string[];
  mimes = [] as string[];
  forwardBinary(
    file: ArrayBuffer,
    options: ImportOptions,
    progress: ProgressCb
  ) {
    return readAsText(file).chain((text) => {
      return CSV.forwardString(text, options, progress);
    });
  }
  forwardString(text: string, options: ImportOptions, progress: ProgressCb) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardCsv() {
        const { csvToGeoJSON } = await import(
          'app/lib/convert/local/csv_to_geojson'
        );
        const geojson = await csvToGeoJSON(text, options.csvOptions, progress);
        return okResult(geojson);
      }
    );
  }
  back({ geojson }: { geojson: FeatureCollection }, options: ExportOptions) {
    return EitherAsync<ConvertError, ExportResult>(async function backCsv() {
      const { geojsonToCSV } = await import(
        'app/lib/convert/local/geojson_to_csv'
      );
      return {
        blob: stringToBlob(geojsonToCSV(geojson, options)),
        name: 'features.csv'
      };
    });
  }
  featureToString(feature: Feature, options: ExportOptions) {
    return EitherAsync<ConvertError, string>(
      async function featureToStringCsv() {
        const { geojsonToCSV } = await import(
          'app/lib/convert/local/geojson_to_csv'
        );
        return geojsonToCSV(
          {
            type: 'FeatureCollection',
            features: [feature]
          },
          options
        );
      }
    );
  }
}

export const CSV = new CCSV();
