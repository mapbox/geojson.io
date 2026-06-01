import { getFilesFromDataTransferItems } from '@placemarkio/flat-drop-files';
import { groupFiles } from 'app/lib/group_files';
import { DialogHelpers } from 'state/dialog_helpers';
import type { FileWithHandle } from 'browser-fs-access';
import { captureException } from 'integrations/errors';
import { useSetAtom } from 'jotai';
import { memo, useEffect, useState } from 'react';
import { dialogAtom } from 'state/jotai';
import { StyledDropOverlay } from './elements';

/**
 * From an event, get files, with handles for re-saving.
 * Result is nullable.
 */

const stopWindowDrag = (event: DragEvent) => {
  event.preventDefault();
};

export default memo(function Drop() {
  const [dragging, setDragging] = useState<boolean>(false);
  const setDialogState = useSetAtom(dialogAtom);

  useEffect(() => {
    const onDropFiles = (files: FileWithHandle[]) => {
      if (!files.length) return;
      const groupedFiles = groupFiles(files);
      setDialogState(DialogHelpers.import(groupedFiles));
    };

    const onDragEnter = () => {
      setDragging(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) {
        setDragging(false);
        return;
      }
      const portals = document.querySelectorAll('[data-radix-portal]');
      for (const portal of portals) {
        if (
          event.relatedTarget instanceof Node &&
          portal.contains(event.relatedTarget)
        ) {
          setDragging(false);
          return;
        }
      }
    };

    const onDrop = async (event: DragEvent) => {
      setDragging(false);
      const files = event.dataTransfer?.items
        ? await getFilesFromDataTransferItems(event.dataTransfer.items)
        : [];
      onDropFiles(files);
      event.preventDefault();
    };

    const onDropCaught = (event: DragEvent) => {
      onDrop(event).catch((e) => captureException(e));
    };

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDropCaught);
    window.addEventListener('dragover', stopWindowDrag);
    window.addEventListener('drop', stopWindowDrag);

    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDropCaught);
      window.removeEventListener('dragover', stopWindowDrag);
      window.removeEventListener('drop', stopWindowDrag);
    };
  }, [setDialogState]);

  return dragging ? (
    <StyledDropOverlay>Drop files to add to the map</StyledDropOverlay>
  ) : null;
});
