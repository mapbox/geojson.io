import type { Folder, Root } from '@tmcw/togeojson';
import type { ImportOptions } from 'app/lib/convert';
import {
  importToExportOptions,
  type RawProgressCb,
  stringToGeoJSON
} from 'app/lib/convert';
import type { ShapefileGroup } from 'app/lib/convert/shapefile';
import { Shapefile } from 'app/lib/convert/shapefile';
import type { ConvertResult } from 'app/lib/convert/utils';
import { newFeatureId } from 'app/lib/id';
import { usePersistence } from 'app/lib/persistence/context';
import { type Moment, type MomentInput } from 'app/lib/persistence/moment';
import { lib } from 'app/lib/worker';
import type { FileWithHandle } from 'browser-fs-access';
import * as Comlink from 'comlink';
import { transfer } from 'comlink';
import { generateNKeysBetween } from 'fractional-indexing';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { fileInfoAtom } from 'state/jotai';
import type { IWrappedFeature } from 'types';

/**
 * Creates the _input_ to a transact() operation,
 * given some imported result.
 */
function resultToTransact({
  result,
  file,
  track
}: {
  result: ConvertResult;
  file: Pick<File, 'name'>;
  track: [
    string,
    {
      format: string;
    }
  ];
}): Partial<MomentInput> {
  switch (result.type) {
    case 'geojson': {
      const { features } = result.geojson;
      const ats = generateNKeysBetween(null, null, features.length);
      return {
        note: `Imported ${file?.name ? file.name : 'a file'}`,
        track: track,
        putFeatures: result.geojson.features.map((feature, i) => {
          return {
            at: ats[i],
            id: newFeatureId(),
            feature
          };
        })
      };
    }
    case 'root': {
      // In the (rare) case in which someone imported
      // something with a root, then import it in its original
      // structure.
      const flat = flattenRoot(result.root, []);
      return flat;
    }
  }
}

export function flattenRoot(
  root: Root | Folder,
  features: IWrappedFeature[]
): Pick<Moment, 'note' | 'putFeatures'> {
  // TODO: find a start key here and use that as the start, not null.
  const ats = generateNKeysBetween(null, null, root.children.length);
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    switch (child.type) {
      case 'Feature': {
        features.push({
          at: ats[i],
          id: newFeatureId(),
          feature: child
        });
        break;
      }
    }
  }

  return {
    note: 'Imported a file',
    putFeatures: features
  };
}

export function useImportString() {
  const rep = usePersistence();
  const transact = rep.useTransact();

  return useCallback(
    /**
     * Convert a given file or string and add it to the
     * current map content.
     */
    async (
      text: string,
      options: ImportOptions,
      progress: RawProgressCb,
      name: string = 'Imported text'
    ) => {
      return (await stringToGeoJSON(text, options, Comlink.proxy(progress)))
        .map(async (result) => {
          await transact(
            resultToTransact({
              result,
              file: { name },
              track: [
                'import-string',
                {
                  format: 'geojson'
                }
              ]
            })
          );
          return result;
        })
        .mapLeft((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          return e;
        });
    },
    [transact]
  );
}

export function useImportFile() {
  const rep = usePersistence();
  const setFileInfo = useSetAtom(fileInfoAtom);
  const transact = rep.useTransact();

  return useCallback(
    /**
     * Convert a given file or string and add it to the
     * current map content.
     */
    async (
      file: FileWithHandle,
      options: ImportOptions,
      progress: RawProgressCb
    ) => {
      const arrayBuffer = await file.arrayBuffer();

      const either = (
        await lib.fileToGeoJSON(
          transfer(arrayBuffer, [arrayBuffer]),
          options,
          Comlink.proxy(progress)
        )
      ).bimap(
        (err) => {
          return err;
        },
        async (result) => {
          const exportOptions = importToExportOptions(options);
          if (file.handle && exportOptions) {
            setFileInfo({ handle: file.handle, options: exportOptions });
          }
          const moment = resultToTransact({
            result,
            file,
            track: [
              'import',
              {
                format: options.type
              }
            ]
          });
          await transact(moment);
          return result;
        }
      );

      return either;
    },
    [setFileInfo, transact]
  );
}

export function useImportShapefile() {
  const rep = usePersistence();
  const transact = rep.useTransact();

  return useCallback(
    /**
     * Convert a given file or string and add it to the
     * current map content.
     */
    async (file: ShapefileGroup, options: ImportOptions) => {
      const either = (await Shapefile.forwardLoose(file, options)).map(
        async (result) => {
          await transact(
            resultToTransact({
              result,
              file: file.files.shp,
              track: [
                'import',
                {
                  format: 'shapefile'
                }
              ]
            })
          );
          return result;
        }
      );

      return either;
    },
    [transact]
  );
}
