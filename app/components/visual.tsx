import { LayersIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import * as E from 'app/components/elements';
import { useAtomValue, useSetAtom } from 'jotai';
import { Popover, Tooltip as T } from 'radix-ui';
import { memo, Suspense } from 'react';
import { dataAtom, dialogAtom } from 'state/jotai';
import { DialogHelpers } from 'state/dialog_helpers';
import { StylesPopover } from './styles/popover';
import { useOpenFiles } from 'app/hooks/use_open_files';

export const Visual = memo(function Visual() {
  const setDialogState = useSetAtom(dialogAtom);
  const data = useAtomValue(dataAtom);
  const openFiles = useOpenFiles();
  const hasFeatures = data.featureMap.size > 0;

  return (
    <div className="flex items-center">
      <E.Button
        variant="quiet"
        aria-label="Search"
        onClick={() => {
          return openFiles();
        }}
      >
        Import
      </E.Button>
      <E.Button
        variant="quiet"
        aria-label="Export"
        disabled={!hasFeatures}
        onClick={() => {
          setDialogState(DialogHelpers.export());
        }}
      >
        Export
      </E.Button>

      <T.Root>
        <Popover.Root>
          <div className="h-10 w-10 p-1 flex items-stretch">
            <T.Trigger asChild>
              <Popover.Trigger aria-label="Layers" asChild>
                <E.Button variant="quiet">
                  <LayersIcon />
                </E.Button>
              </Popover.Trigger>
            </T.Trigger>
          </div>
          <E.PopoverContent2 size="md">
            <Suspense fallback={<E.Loading size="sm" />}>
              <StylesPopover />
            </Suspense>
          </E.PopoverContent2>
        </Popover.Root>
        <E.TContent side="bottom">
          <span className="whitespace-nowrap">Change Basemap</span>
        </E.TContent>
      </T.Root>
      <T.Root>
        <div className="h-10 w-10 p-1 flex items-stretch">
          <T.Trigger asChild>
            <E.Button
              variant="quiet"
              aria-label="About"
              onClick={() => setDialogState(DialogHelpers.about())}
            >
              <InfoCircledIcon />
            </E.Button>
          </T.Trigger>
          <E.TContent side="bottom">
            <span className="whitespace-nowrap">About geojson.io</span>
          </E.TContent>
        </div>
      </T.Root>
    </div>
  );
});
