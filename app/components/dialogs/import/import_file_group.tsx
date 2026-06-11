import { CoordinateStringOptionsForm } from 'app/components/coordinate_string_options_form';
import {
  CsvOptionsForm,
  XlsOptionsForm
} from 'app/components/csv_options_form';
import { SelectFileType } from 'app/components/fields';
import { useImportFile } from 'app/hooks/use_import';
import {
  DEFAULT_IMPORT_OPTIONS,
  type ImportOptions,
  type Progress
} from 'app/lib/convert';
import type { FileGroup } from 'app/lib/group_files';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useState } from 'react';
import { AutoDetect } from '../autodetect';
import type { OnNext } from '../import';
import SimpleDialogActions from '../simple_dialog_actions';
import { FileWarning } from './file_warning';
import { ImportProgressBar } from './import_progress_bar';

type SecondaryAction = React.ComponentProps<
  typeof SimpleDialogActions
>['secondary'];

export function ImportFileGroup({
  onNext,
  hasNext,
  onClose,
  secondary,
  file: fileGroup
}: {
  onNext: OnNext;
  hasNext: boolean;
  onClose: () => void;
  secondary: SecondaryAction;
  file: FileGroup;
}) {
  const { file } = fileGroup;
  const doImport = useImportFile();
  const [progress, setProgress] = useState<Progress | null>(null);

  return (
    <Formik
      onSubmit={async function onSubmit(
        options: ImportOptions,
        helpers: FormikHelpers<ImportOptions>
      ) {
        try {
          // Don't show a toast if we're going to import
          // another feature.
          options = { ...options, toast: !hasNext };
          const res = await doImport(file, options, (newProgress) => {
            setProgress(newProgress);
          });
          res.caseOf({
            Left(err) {
              setProgress(null);
              helpers.setErrors({ type: err.message });
            },
            Right: async (r) => {
              return onNext(await r);
            }
          });
        } catch (e: any) {
          helpers.setErrors({
            type: e.message
          });
        }
      }}
      initialValues={{
        ...DEFAULT_IMPORT_OPTIONS,
        type: 'geojson',
        text: '',
        toast: true,
        secondary: false
      }}
    >
      <Form>
        <div>
          <div className="space-y-4">
            <SelectFileType />
            <CoordinateStringOptionsForm />
            <CsvOptionsForm file={file} geocoder />
            <XlsOptionsForm file={file} geocoder />
          </div>
          <FileWarning file={fileGroup}>
            <SimpleDialogActions
              secondary={secondary}
              onClose={onClose}
              action="Import"
            />
          </FileWarning>
          <ImportProgressBar progress={progress} />
        </div>
        <AutoDetect file={file} />
      </Form>
    </Formik>
  );
}
