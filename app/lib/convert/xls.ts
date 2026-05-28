import type { ConvertError } from 'app/lib/errors';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { FileType, ImportOptions } from '.';
import { type ConvertResult, okResult } from './utils';

class CXLS implements FileType {
  id = 'xls' as const;
  label = 'Excel (.xls, .xlsx)';
  extensions = ['.xls', '.xlsx'];
  filenames = [] as string[];
  mimes = [] as string[];
  forwardBinary(file: ArrayBuffer, options: ImportOptions) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardXls() {
        const { xlsxToGeoJSON } = await import(
          'app/lib/convert/local/xlsx_to_geojson'
        );
        const geojson = await xlsxToGeoJSON(file, options.csvOptions);
        return okResult(geojson);
      }
    );
  }
}

export const XLS = new CXLS();
