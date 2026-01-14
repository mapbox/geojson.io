import useFileSave from 'app/hooks/use_file_save';
import { useMapKeybindings } from 'app/hooks/use_map_keybindings';
import { useOpenFiles } from 'app/hooks/use_open_files';
import { captureException } from 'integrations/errors';
import { useHotkeys } from 'integrations/hotkeys';
import { useSetAtom } from 'jotai';
import toast from 'react-hot-toast';
import { dialogAtom } from 'state/jotai';
import { DialogHelpers } from 'state/dialog_helpers';

export function Keybindings() {
  const setDialogState = useSetAtom(dialogAtom);
  const saveNative = useFileSave();
  const openFiles = useOpenFiles();

  useMapKeybindings();

  useHotkeys(
    '/',
    (e) => {
      e.preventDefault();
      setDialogState(DialogHelpers.quickswitcher());
    },
    [setDialogState]
  );

  useHotkeys(
    'meta+k, Ctrl+k',
    (e) => {
      e.preventDefault();
      setDialogState(DialogHelpers.quickswitcher());
    },
    [setDialogState]
  );

  useHotkeys(
    'meta+shift+s, Ctrl+shift+s',
    (e) => {
      // Don't type a / in the input.
      e.preventDefault();
      setDialogState(DialogHelpers.export());
    },
    [setDialogState]
  );

  useHotkeys(
    'meta+s, Ctrl+s',
    (e) => {
      e.preventDefault();
      (async () => {
        const either = await saveNative();
        return either
          .ifLeft((error) => toast.error(error?.message || 'Could not save'))
          .map((saved) => {
            if (saved) return;
            setDialogState(DialogHelpers.export());
          });
      })().catch((e) => captureException(e));
    },
    [setDialogState, saveNative]
  );

  useHotkeys(
    'meta+o, Ctrl+o',
    (e) => {
      e.preventDefault();
      openFiles().catch((e) => captureException(e));
    },
    [openFiles]
  );

  return null;
}
