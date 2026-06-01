import type { ConvertError } from 'app/lib/errors';
import readAsText from 'app/lib/read_as_text';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { FeatureCollection } from 'types';
import type { FileType, ImportOptions } from '.';
import { type ConvertResult, okResult, toDom } from './utils';

class CGPX implements FileType {
  id = 'gpx' as const;
  label = 'GPX';
  extensions = ['.gpx'];
  mimes = [] as string[];
  filenames = [] as string[];
  forwardBinary(file: ArrayBuffer, _options: ImportOptions) {
    return readAsText(file).chain((text) => {
      return GPX.forwardString(text);
    });
  }
  forwardString(text: string) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardGpx() {
        const tcx = await import('@tmcw/togeojson').then(
          (module) => module.gpx
        );
        const dom = await toDom(text);
        const geojson = tcx(dom as unknown as Document);
        return okResult(geojson as FeatureCollection);
      }
    );
  }
}

export const GPX = new CGPX();
