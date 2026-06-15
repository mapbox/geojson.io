import { LayersIcon, InfoCircledIcon, Share2Icon } from '@radix-ui/react-icons';
import * as E from 'app/components/elements';
import { buildShareUrl } from 'app/components/dialogs/share';
import { useAtomValue, useSetAtom } from 'jotai';
import { Popover, Tooltip as T } from 'radix-ui';
import { memo, Suspense, useEffect, useState } from 'react';
import { dataAtom, dialogAtom } from 'state/jotai';
import { DialogHelpers } from 'state/dialog_helpers';
import { StylesPopover } from './styles/popover';
import { useOpenFiles } from 'app/hooks/use_open_files';

export const Visual = memo(function Visual() {
  const setDialogState = useSetAtom(dialogAtom);
  const data = useAtomValue(dataAtom);
  const openFiles = useOpenFiles();
  const hasFeatures = data.featureMap.size > 0;
  const [shareTooLong, setShareTooLong] = useState(false);

  useEffect(() => {
    buildShareUrl(data.featureMap).then(({ tooLong }) =>
      setShareTooLong(tooLong)
    );
  }, [data.featureMap]);

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
        <div className="h-10 w-10 p-1 flex items-stretch">
          <T.Trigger asChild>
            <E.Button
              variant="quiet"
              aria-label="Share"
              disabled={!hasFeatures || shareTooLong}
              onClick={() => {
                setDialogState(DialogHelpers.share());
              }}
            >
              <Share2Icon />
            </E.Button>
          </T.Trigger>
        </div>
        {shareTooLong && hasFeatures ? (
          <E.TContent side="bottom">
            <span className="whitespace-nowrap">
              Dataset too large to share via URL
            </span>
          </E.TContent>
        ) : null}
      </T.Root>

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
            <E.TContent side="bottom">
              <span className="whitespace-nowrap">Change Basemap</span>
            </E.TContent>
          </div>
          <E.PopoverContent2 size="md">
            <Suspense fallback={<E.Loading size="sm" />}>
              <StylesPopover />
            </Suspense>
          </E.PopoverContent2>
        </Popover.Root>
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
