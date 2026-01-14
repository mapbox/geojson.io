import { EitherAsync } from 'purify-ts/EitherAsync';
import type { GeojsonIOError } from './errors';

export default function readAsText(
  file: ArrayBuffer
): EitherAsync<GeojsonIOError, string> {
  return EitherAsync(function readAsTextInner() {
    return Promise.resolve(new TextDecoder().decode(file));
  });
}
