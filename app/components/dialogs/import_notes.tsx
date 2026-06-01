import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import { Button } from 'app/components/elements';
import { pluralize } from 'app/lib/utils';
import type { DialogStateImportNotes } from 'state/dialog_state';

export function ImportNotesDialog({
  modal,
  onClose
}: {
  modal: DialogStateImportNotes;
  onClose: () => void;
}) {
  const {
    result: { notes }
  } = modal;

  return (
    <>
      <DialogHeader
        title={`${pluralize('issue', notes.length)} detected on import`}
        titleIcon={ExclamationTriangleIcon}
      />
      <div className="max-h-48 overflow-y-auto text-sm">
        {notes.map((note, i) => {
          return <div key={i}>{note}</div>;
        })}
      </div>
      <div className="pt-6 pb-1 flex flex-col sm:flex-row-reverse space-y-2 sm:space-y-0 sm:gap-x-3">
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );
}
