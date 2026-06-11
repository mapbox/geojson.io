import { GearIcon } from '@radix-ui/react-icons';
import * as E from 'app/components/elements';
import { useSetAtom } from 'jotai';
import { Tooltip as T } from 'radix-ui';
import { dialogAtom } from 'state/jotai';
import { DialogHelpers } from 'state/dialog_helpers';

export function OptionsDropdown() {
  const setDialogState = useSetAtom(dialogAtom);

  return (
    <T.Root>
      <div className="h-10 w-10 p-1 flex items-stretch">
        <T.Trigger asChild>
          <E.Button
            variant="quiet"
            aria-label="Options"
            onClick={() => setDialogState(DialogHelpers.options())}
          >
            <GearIcon />
          </E.Button>
        </T.Trigger>
      </div>
      <E.TContent side="bottom">
        <span className="whitespace-nowrap">Options</span>
      </E.TContent>
    </T.Root>
  );
}
