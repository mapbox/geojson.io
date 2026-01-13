import { deleteFeatures } from 'app/lib/map_operations/delete_features';
import { usePersistence } from 'app/lib/persistence/context';
import { captureException } from 'integrations/errors';
import { useHotkeys } from 'integrations/hotkeys';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';
import type { Options } from 'react-hotkeys-hook';
import { USelection } from 'state';
import { dataAtom, selectionAtom } from 'state/jotai';
import { getAllFeatures } from 'app/lib/handlers/none';

const IGNORE_ROLES = new Set(['menuitem']);

export const keybindingOptions: Options = {
  enabled(e) {
    try {
      return !IGNORE_ROLES.has((e.target as HTMLElement).getAttribute('role')!);
    } catch (_e) {
      return true;
    }
  }
};

function shouldControlTree(e: Event) {
  return (
    'target' in e &&
    e.target instanceof HTMLElement &&
    e.target.closest('[data-keybinding-scope="editor_folder"]')
  );
}

export function useMapKeybindings() {
  const rep = usePersistence();
  const historyControl = rep.useHistoryControl();
  const transact = rep.useTransact();

  useHotkeys(
    'meta+z, Ctrl+z',
    (e) => {
      e.preventDefault();
      historyControl('undo').catch((e) => captureException(e));
      return false;
    },
    [historyControl]
  );

  useHotkeys(
    'meta+shift+z, Ctrl+shift+z',
    (_e: KeyboardEvent) => {
      historyControl('redo').catch((e) => captureException(e));
    },
    [historyControl]
  );

  const maybeToggleFolder = useAtomCallback(
    useCallback(
      (get, set, expanded: boolean) => {
        const data = get(dataAtom);
        const { selection } = data;
        if (!expanded) {
          set(selectionAtom, USelection.none());
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [transact]
    )
  );

  useHotkeys(
    'arrowright',
    (e) => {
      if (shouldControlTree(e)) {
        e.preventDefault();
        void maybeToggleFolder(true);
      }
    },
    keybindingOptions,
    [maybeToggleFolder]
  );

  useHotkeys(
    'arrowleft',
    (e) => {
      if (shouldControlTree(e)) {
        e.preventDefault();
        void maybeToggleFolder(false);
      }
    },
    keybindingOptions,
    [maybeToggleFolder]
  );

  const onSelectAll = useAtomCallback(
    useCallback((get, set) => {
      const data = get(dataAtom);
      set(selectionAtom, {
        type: 'multi',
        ids: getAllFeatures(data).map((f) => f.id)
      });
    }, [])
  );

  useHotkeys(
    'meta+a, Ctrl+a',
    (e) => {
      e.preventDefault();
      void onSelectAll();
    },
    keybindingOptions,
    [onSelectAll]
  );

  const onDelete = useAtomCallback(
    useCallback(
      (get, set) => {
        const data = get(dataAtom);
        set(selectionAtom, USelection.none());
        (async () => {
          const { newSelection, moment } = deleteFeatures(data);
          set(selectionAtom, newSelection);
          await transact(moment);
        })().catch((e) => captureException(e));
        return false;
      },
      [transact]
    )
  );

  useHotkeys(
    'Backspace, delete',
    (e) => {
      e.preventDefault();
      void onDelete();
    },
    keybindingOptions,
    [onDelete]
  );
}
