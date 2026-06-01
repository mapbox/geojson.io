import { PlusIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { useOpenFiles } from 'app/hooks/use_open_files';
import { captureException } from 'integrations/errors';
import { memo } from 'react';
import { Button } from './elements';
import { DialogHelpers } from 'state/dialog_helpers';
import { dialogAtom } from 'state/jotai';
import { useSetAtom } from 'jotai';

export const NothingSelected = memo(function NothingSelected() {
  const openFiles = useOpenFiles();
  const setDialogState = useSetAtom(dialogAtom);

  return (
    <div className="px-3 pt-3 overflow-y-auto pb-4 text-gray-900 dark:text-gray-300 flex-auto geojsonio-scrollbar">
      <div className="text-sm pb-2">
        To get started, draw features on the map using the drawing tools above
        or import spatial data from a file.
      </div>
      <div className="pt-4 space-y-3">
        <div className="text-sm font-semibold">Import a file</div>

        <div className="flex items-center gap-x-2">
          <Button
            type="button"
            onClick={() => {
              openFiles().catch((e) => captureException(e));
            }}
          >
            <PlusIcon />
            Import
          </Button>
        </div>
        <div
          onClick={() => setDialogState(DialogHelpers.about())}
          className="flex items-center text-gray-500 text-xs hover:text-mb-blue-500 transition cursor-pointer"
        >
          Supported file types <ChevronRightIcon />
        </div>
      </div>
    </div>
  );
});
