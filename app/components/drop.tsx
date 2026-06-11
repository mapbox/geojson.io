import { getFilesFromDataTransferItems } from '@placemarkio/flat-drop-files';
import { useImportFiles } from 'app/hooks/use_import_files';
import { captureException } from 'integrations/errors';
import { memo, useEffect, useState } from 'react';
import { StyledDropOverlay } from './elements';

const stopWindowDrag = (event: DragEvent) => {
  event.preventDefault();
};

export default memo(function Drop() {
  const [dragging, setDragging] = useState<boolean>(false);
  const importFiles = useImportFiles();

  useEffect(() => {
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
      await importFiles(files);
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
  }, [importFiles]);

  return dragging ? (
    <StyledDropOverlay>Drop files to add to the map</StyledDropOverlay>
  ) : null;
});
