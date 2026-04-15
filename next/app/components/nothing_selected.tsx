import {
  DotFilledIcon,
  DownloadIcon,
  PlusIcon,
  SquareIcon
} from '@radix-ui/react-icons';
import Line from 'app/components/icons/line';
import { useOpenFiles } from 'app/hooks/use_open_files';
import { captureException } from 'integrations/errors';
import { useSetAtom } from 'jotai';
import { memo } from 'react';
import { dialogAtom } from 'state/dialog_state';
import { DialogHelpers } from 'state/dialog_helpers';
import { Button } from './elements';
import SvgPolygon from './icons/polygon';

export const NothingSelected = memo(function NothingSelected() {
  const openFiles = useOpenFiles();
  const setDialogState = useSetAtom(dialogAtom);
  return (
    <div className="px-3 pt-3 overflow-y-auto pb-4 text-gray-900 dark:text-gray-300 flex-auto geojsonio-scrollbar">
      <div className="text-sm font-semibold pb-2">
        Select a drawing tool from the menu
      </div>
      <div
        className="grid gap-x-2 gap-y-4 items-start p-2 text-sm"
        style={{
          gridTemplateColumns: 'min-content 1fr'
        }}
      >
        <div className="pt-1">
          <DotFilledIcon />
        </div>
        <div>Draw points</div>
        <div className="pt-1">
          <Line />
        </div>
        <div>Draw line strings</div>
        <div className="pt-1">
          <SvgPolygon />
        </div>
        <div>Draw polygons</div>
        <div className="pt-1">
          <SquareIcon />
        </div>
        <div>Draw rectangles</div>
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
      </div>
    </div>
  );
});
