import type { ConvertError } from 'app/lib/errors';
import readAsText from 'app/lib/read_as_text';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { FeatureCollection } from 'types';
import type { FileType } from '.';
import { type ConvertResult, okResult, toDom } from './utils';

class CTCX implements FileType {
  id = 'tcx' as const;
  label = 'TCX';
  extensions = ['.tcx'];
  filenames = [] as string[];
  mimes = [] as string[];
  forwardBinary(file: ArrayBuffer) {
    return readAsText(file).chain((text) => TCX.forwardString(text));
  }
  forwardString(text: string) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardTcx() {
        const tcx = await import('@tmcw/togeojson').then(
          (module) => module.tcx
        );
        const geojson = tcx((await toDom(text)) as unknown as Document);
        return okResult(geojson as FeatureCollection);
      }
    );
  }
}

export const TCX = new CTCX();
