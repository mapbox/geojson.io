import type { Folder } from '@tmcw/togeojson';
import type { GeojsonIOError } from 'app/lib/errors';
import { ConvertError, parseOrError } from 'app/lib/errors';
import readAsText from 'app/lib/read_as_text';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { FeatureCollection } from 'types';
import type { ExportResult, FileType, ImportOptions } from '.';
import { type ConvertResult, type RootResult, stringToBlob } from './utils';

class CTopoJSON implements FileType {
  id = 'topojson' as const;
  label = 'TopoJSON';
  extensions = ['.topojson', '.json'];
  filenames = [] as string[];
  mimes = [] as string[];
  forwardBinary(file: ArrayBuffer, _options: ImportOptions) {
    return readAsText(file).chain((text) => {
      return TopoJSON.forwardString(text);
    });
  }
  forwardString(text: string, _options?: ImportOptions) {
    return EitherAsync<GeojsonIOError, ConvertResult>(
      async function forwardTopoJSON({ liftEither, throwE }) {
        const { feature } = await import('topojson-client');
        type Topology = Parameters<typeof feature>[0];
        const obj = await liftEither(parseOrError<Topology>(text));
        const objectKeys = Object.keys(obj.objects);
        const root: RootResult = {
          type: 'root',
          root: {
            type: 'root',
            children: []
          },
          notes: []
        };
        try {
          for (const key of objectKeys) {
            const folder: Folder = {
              type: 'folder',
              meta: {
                name: key
              },
              children: []
            };
            root.root.children.push(folder);
            const geo = feature(obj, obj.objects[key]);
            switch (geo.type) {
              case 'Feature':
                folder.children.push(geo);
                break;
              case 'FeatureCollection':
                for (const f of geo.features) {
                  folder.children.push(f);
                }
            }
          }
          return root;
        } catch (_e) {
          return throwE(new ConvertError('Could not read TopoJSON file'));
        }
      }
    );
  }
  back({ geojson }: { geojson: FeatureCollection }) {
    return EitherAsync<GeojsonIOError, ExportResult>(
      async function backTopoJSON({ throwE }) {
        const { topology } = await import('topojson-server');
        try {
          return {
            blob: stringToBlob(JSON.stringify(topology({ objects: geojson }))),
            name: 'features.json'
          };
        } catch (_e) {
          return throwE(
            new ConvertError('Could not convert GeoJSON to TopoJSON')
          );
        }
      }
    );
  }
}

export const TopoJSON = new CTopoJSON();
