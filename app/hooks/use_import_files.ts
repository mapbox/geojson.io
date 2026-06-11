import addedFeaturesToast from 'app/components/added_features_toast';
import { flattenResult } from 'app/components/dialogs/import_utils';
import { MapContext } from 'app/context/map_context';
import { useImportFile, useImportShapefile } from 'app/hooks/use_import';
import { DEFAULT_IMPORT_OPTIONS, detectType } from 'app/lib/convert';
import { extendExtent, getExtent } from 'app/lib/geometry';
import { groupFiles } from 'app/lib/group_files';
import { DialogHelpers } from 'state/dialog_helpers';
import type { FileWithHandle } from 'browser-fs-access';
import { useAtomValue, useSetAtom } from 'jotai';
import type { LngLatBoundsLike } from 'mapbox-gl';
import { useCallback, useContext, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Nothing } from 'purify-ts/Maybe';
import { dialogAtom, removeCoincidentsAtom } from 'state/jotai';

// File types that require user input in the import modal
// (ambiguous column mapping or coordinate order).
export const TYPES_REQUIRING_MODAL = new Set([
  'csv',
  'xls',
  'coordinate-string'
]);

/**
 * Returns a stable callback that classifies a list of dropped/opened files,
 * auto-imports those that don't need user input, and opens the modal only
 * for types that do (csv, xls, coordinate-string).
 */
export function useImportFiles() {
  const setDialogState = useSetAtom(dialogAtom);
  const doImport = useImportFile();
  const doImportShapefile = useImportShapefile();
  const removeCoincidents = useAtomValue(removeCoincidentsAtom);
  const map = useContext(MapContext);
  const mapRef = useRef(map);
  mapRef.current = map;

  return useCallback(
    async (files: FileWithHandle[]) => {
      if (!files.length) return;
      const groupedFiles = groupFiles(files);

      const modalFiles: typeof groupedFiles = [];
      let extent = Nothing as ReturnType<typeof extendExtent>;

      for (const fileGroup of groupedFiles) {
        if (fileGroup.type === 'shapefile') {
          const result = await doImportShapefile(fileGroup, {
            ...DEFAULT_IMPORT_OPTIONS,
            type: 'shapefile',
            removeCoincidents
          });
          await result.caseOf<Promise<void>>({
            Left: (err) => {
              toast.error(err.message);
              return Promise.resolve();
            },
            Right: async (r) => {
              const resolved = await r;
              extent = extendExtent(getExtent(flattenResult(resolved)), extent);
              addedFeaturesToast(resolved);
            }
          });
        } else {
          const detected = await detectType(fileGroup.file);
          const options = detected.orDefault({
            ...DEFAULT_IMPORT_OPTIONS,
            type: 'geojson' as const
          });
          if (TYPES_REQUIRING_MODAL.has(options.type)) {
            modalFiles.push(fileGroup);
          } else {
            const result = await doImport(
              fileGroup.file,
              { ...options, removeCoincidents },
              () => {}
            );
            await result.caseOf<Promise<void>>({
              Left: (err) => {
                toast.error(err.message);
                return Promise.resolve();
              },
              Right: async (r) => {
                const resolved = await r;
                extent = extendExtent(
                  getExtent(flattenResult(resolved)),
                  extent
                );
                addedFeaturesToast(resolved);
              }
            });
          }
        }
      }

      extent.map((bbox) => {
        mapRef.current?.map.fitBounds(bbox as LngLatBoundsLike, {
          padding: 100
        });
      });

      if (modalFiles.length) {
        setDialogState(DialogHelpers.import(modalFiles));
      }
    },
    [doImport, doImportShapefile, removeCoincidents, setDialogState]
  );
}
