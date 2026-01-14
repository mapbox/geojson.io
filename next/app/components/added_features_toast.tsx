import type { ConvertResult } from 'app/lib/convert/utils';
import { pluralize } from 'app/lib/utils';
import { useSetAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { dialogAtom } from 'state/dialog_state';
import { Button } from './elements';

function AddedFeaturesToast({ result }: { result: ConvertResult }) {
  const setModal = useSetAtom(dialogAtom);
  return (
    <div className="flex items-center justify-between flex-auto gap-x-4">
      <div className="text-md">Imported</div>
      {result.notes.length ? (
        <Button
          type="button"
          onClick={() => {
            setModal({
              type: 'import_notes',
              result
            });
          }}
        >
          {pluralize('issue', result.notes.length)}
        </Button>
      ) : null}
    </div>
  );
}

export default function addedFeaturesToast(result: ConvertResult) {
  return toast.success(
    () => {
      return <AddedFeaturesToast result={result} />;
    },
    {
      duration: result.notes.length ? 10000 : 5000
    }
  );
}
