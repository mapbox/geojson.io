import React from 'react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import * as E from 'app/components/elements';
import { dialogAtom } from 'state/jotai';
import { DialogHelpers } from 'state/dialog_helpers';
import { useSetAtom } from 'jotai';
import { getIsMac, localizeKeybinding } from '../../lib/utils';
import { Tooltip as T } from 'radix-ui';

const SearchBoxButton = () => {
  const SEARCH_KEYBINDING = 'Command+k';
  const setDialogState = useSetAtom(dialogAtom);
  const isMac = getIsMac();

  return (
    <div className="mt-2 mr-2 top-0 right-0 absolute z-10">
      <T.Root>
        <T.Trigger asChild>
          <E.Button
            className="py-2 w-[200px] bg-white rounded-lg border border-gray-300 flex justify-between align-items cursor-text hover:bg-white hover:border-purple-500 "
            variant="quiet"
            aria-label="Search"
            onClick={() => {
              setDialogState(DialogHelpers.quickswitcher());
            }}
          >
            <div className="flex items-center">
              <MagnifyingGlassIcon />
              <span className="ml-2 text-gray-400">Search</span>
            </div>

            <span className="text-gray-400 txt-bold">⌘K</span>
          </E.Button>
        </T.Trigger>
        <E.TContent>
          <div className="flex items-center gap-x-2">
            Search{' '}
            <E.Keycap>{localizeKeybinding(SEARCH_KEYBINDING, isMac)}</E.Keycap>
          </div>
        </E.TContent>
      </T.Root>
    </div>
  );
};

export default SearchBoxButton;
