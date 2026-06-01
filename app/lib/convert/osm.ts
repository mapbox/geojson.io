import type { ConvertError } from 'app/lib/errors';
import readAsText from 'app/lib/read_as_text';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { FileType, ImportOptions } from '.';
import { type ConvertResult, okResult, toDom } from './utils';

class COSM implements FileType {
  id = 'osm' as const;
  label = 'OpenStreetMap XML';
  extensions = ['.osm', '.xml'];
  filenames = [] as string[];
  mimes = [] as string[];
  forwardString(text: string) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardKML() {
        const osmtogeojson = await import('@placemarkio/osmtogeojson').then(
          (m) => m.default
        );
        const dom = await toDom(text);
        const geojson = osmtogeojson(dom);
        return okResult(geojson);
      }
    );
  }
  forwardBinary(file: ArrayBuffer, _options: ImportOptions) {
    return readAsText(file).chain((text) => {
      return OSM.forwardString(text);
    });
  }
}

export const OSM = new COSM();
