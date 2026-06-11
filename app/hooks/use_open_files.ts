import { useImportFiles } from 'app/hooks/use_import_files';
import { captureException } from 'integrations/errors';
import { useCallback } from 'react';
import { useQuery } from 'react-query';

export function useOpenFiles() {
  const importFiles = useImportFiles();

  const { data: fsAccess } = useQuery('browser-fs-access', async () => {
    return import('browser-fs-access');
  });

  return useCallback(() => {
    if (!fsAccess) throw new Error('Sorry, still loading');
    return fsAccess
      .fileOpen({ multiple: true, description: 'Open files…' })
      .then((f) => importFiles(f))
      .catch((e) => {
        captureException(e);
      });
  }, [importFiles, fsAccess]);
}
