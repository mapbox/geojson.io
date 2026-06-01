import { groupFiles } from 'app/lib/group_files';
import { captureException } from 'integrations/errors';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { dialogAtom } from 'state/jotai';
import { DialogHelpers } from 'state/dialog_helpers';

export function useOpenFiles() {
  const setDialogState = useSetAtom(dialogAtom);

  const { data: fsAccess } = useQuery('browser-fs-access', async () => {
    return import('browser-fs-access');
  });

  return useCallback(() => {
    if (!fsAccess) throw new Error('Sorry, still loading');
    return fsAccess
      .fileOpen({ multiple: true, description: 'Open files…' })
      .then((f) => {
        const files = groupFiles(f);
        setDialogState(DialogHelpers.import(files));
      })
      .catch((e) => {
        captureException(e);
      });
  }, [setDialogState, fsAccess]);
}
