import { InlineError } from 'app/components/inline_error';
import { useImportShapefile } from 'app/hooks/use_import';
import { DEFAULT_IMPORT_OPTIONS, type ImportOptions } from 'app/lib/convert';
import type { ShapefileGroup } from 'app/lib/group_files';
import { ErrorMessage, Form, Formik, type FormikHelpers } from 'formik';
import type { OnNext } from '../import';
import SimpleDialogActions from '../simple_dialog_actions';
import { FileWarning } from './file_warning';
import { ShapefileWarning } from './shapefile_warning';

type SecondaryAction = React.ComponentProps<
  typeof SimpleDialogActions
>['secondary'];

export function ImportShapefile({
  onNext,
  hasNext,
  onClose,
  secondary,
  file
}: {
  onNext: OnNext;
  hasNext: boolean;
  onClose: () => void;
  secondary: SecondaryAction;
  file: ShapefileGroup;
}) {
  const doImportShapefile = useImportShapefile();

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
          const res = await doImportShapefile(file, options);
          res.caseOf({
            Left(err) {
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
        type: 'shapefile',
        toast: true,
        secondary: false
      }}
    >
      <Form>
        <div>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="font-bold">Shapefile components</div>
              {Object.values(file.files)
                .filter(Boolean)
                .map((file, i) => {
                  return (
                    <div key={i} className="text-sm">
                      {file.name}
                    </div>
                  );
                })}
            </div>
          </div>
          <ShapefileWarning file={file} />
          <ErrorMessage name="type" component={InlineError} />
          <FileWarning file={file}>
            <SimpleDialogActions
              secondary={secondary}
              onClose={onClose}
              action="Import"
            />
          </FileWarning>
        </div>
      </Form>
    </Formik>
  );
}
