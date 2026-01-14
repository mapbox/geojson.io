import type { ConvertError } from 'app/lib/errors';
import readAsText from 'app/lib/read_as_text';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { FileType } from '.';
import { type ConvertResult, okResult } from './utils';

class CGTFS implements FileType {
  id = 'gtfs' as const;
  label = 'GTFS shapes.txt';
  filenames = ['shapes.txt'];
  extensions = [] as string[];
  mimes = [] as string[];
  forwardBinary(file: ArrayBuffer) {
    return readAsText(file).chain((text) => {
      return this.forwardString(text);
    });
  }
  forwardString(text: string) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardGtfs() {
        const gtfs = await import('vendor/gtfs');
        const geojson = gtfs.GTFSLinesToGeoJSON(text);
        return okResult(geojson);
      }
    );
  }
}

export const GTFS = new CGTFS();
