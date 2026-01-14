import { DownloadIcon } from '@radix-ui/react-icons';
import type { Root } from '@tmcw/togeojson';
import { DialogHeader } from 'app/components/dialog';
import SimpleDialogActions from 'app/components/dialogs/simple_dialog_actions';
import * as E from 'app/components/elements';
import { SelectFileType } from 'app/components/fields';
import { useRootItems } from 'app/components/panels/feature_editor/feature_editor_folder/math';
import {
  DEFAULT_EXPORT_GEOJSON_OPTIONS,
  DEFAULT_IMPORT_OPTIONS,
  type ExportedData,
  type ExportOptions,
  type FileType,
  findType,
  fromGeoJSON
} from 'app/lib/convert';
import { pluralize } from 'app/lib/utils';
import { lib } from 'app/lib/worker';
import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { captureException } from 'integrations/errors';
import { useAtomValue, useSetAtom } from 'jotai';
import { Collapsible as C } from 'radix-ui';
import toast from 'react-hot-toast';
import { dataAtom, fileInfoAtom } from 'state/jotai';
import type { FeatureMap } from 'types';

function fallbackSave(result: ExportedData, type: FileType) {
  const a = document.createElement('a');
  a.download = `untitled${type.extensions[0] || ''}`;
  a.href = URL.createObjectURL(result.result.blob);
  a.addEventListener('click', () => {
    // `setTimeout()` due to
    // https://github.com/LLK/scratch-gui/issues/1783#issuecomment-426286393
    setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
  });
  a.click();
}

function CSVOptions({
  root,
  featureMap,
  values
}: {
  root: Root;
  featureMap: FeatureMap;
  values: ExportOptions;
}) {
  const omittedFeatureCount = 0;

  return (
    <div className="space-y-3">
      <label className="block">
        <div>
          <E.StyledLabelSpan>Geometry representation</E.StyledLabelSpan>
        </div>
        <Field
          as="select"
          className={E.styledSelect({ size: 'sm' })}
          name="csvOptions.kind"
        >
          <option value="lonlat">Longitude & latitude columns</option>
          <option value="wkt">WKT Column</option>
          <option value="geojson">GeoJSON Column</option>
          <option value="polyline">Polyline Column</option>
        </Field>
      </label>
      {values.csvOptions?.kind === 'lonlat' && omittedFeatureCount ? (
        <E.TextWell variant="destructive">
          CSV exports as "Longitude & latitude columns" will only include Point
          & MultiPoint features. This export will be missing{' '}
          {pluralize('feature', omittedFeatureCount)}. To export those features
          as well, choose a different Geometry representation.
        </E.TextWell>
      ) : null}
      {values.csvOptions?.kind === 'polyline' ? (
        <E.TextWell variant="destructive">
          Exporting as polyline will only include LineString geometries, because
          other geometries don’t have a representation as encoded polylines.
        </E.TextWell>
      ) : null}
    </div>
  );
}

export function GeoJSONOptions() {
  return (
    <>
      <div className="space-y-1">
        <label className="flex items-center">
          <E.FieldCheckbox type="checkbox" name="geojsonOptions.truncate" />
          <div className="pl-2 text-sm">Truncate coordinates</div>
        </label>
        <E.TextWell>
          Limits coordinate precision to 6 decimal places, 10cm precision.
        </E.TextWell>
      </div>
      <div className="space-y-1">
        <label className="flex items-center">
          <E.FieldCheckbox type="checkbox" name="geojsonOptions.indent" />
          <div className="pl-2 text-sm">Indent & format</div>
        </label>
        <E.TextWell>
          Make this file more readable by indenting objects and adding
          linebreaks.
        </E.TextWell>
      </div>
      <div className="space-y-1">
        <label className="flex items-center">
          <E.FieldCheckbox type="checkbox" name="geojsonOptions.addBboxes" />
          <div className="pl-2 text-sm">Add BBOX to features</div>
        </label>
        <E.TextWell>
          Adds a <code>bbox</code> property to each Feature. This can be useful
          if another application wants to speed up search and indexing.
        </E.TextWell>
      </div>
      <C.Root>
        <C.Trigger asChild>
          <E.Button size="xs">Advanced options</E.Button>
        </C.Trigger>

        <C.Content className="space-y-2 pl-2 pt-4">
          <div className="space-y-1">
            <label className="flex items-center">
              <Field
                as="select"
                className={E.styledSelect({ size: 'sm' })}
                name="geojsonOptions.winding"
              >
                <option value="RFC7946">RFC7946</option>
                <option value="d3">D3</option>
              </Field>
              <div className="pl-2 text-sm">Winding order</div>
            </label>
            <E.TextWell>
              Advanced option: use the default for GeoJSON’s standard winding
              order. You can use the opposite for compatibility with d3-geo,
              which expects the opposite. You almost certainly want the default,
              unless you are having issues using exported files with d3-geo.
            </E.TextWell>
          </div>

          <div className="space-y-1">
            <label className="flex items-center">
              <E.FieldCheckbox
                type="checkbox"
                name="geojsonOptions.includeId"
              />
              <div className="pl-2 text-sm">Include @id</div>
            </label>
            <E.TextWell>
              Adds an <code>@id</code> property to each Feature.
            </E.TextWell>
          </div>
        </C.Content>
      </C.Root>
    </>
  );
}

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const data = useAtomValue(dataAtom);

  const root = useRootItems(data);
  const setFileInfo = useSetAtom(fileInfoAtom);

  async function onSubmit(
    exportOptions: ExportOptions,
    helpers: FormikHelpers<ExportOptions>
  ) {
    const { fileSave, supported } = await import('browser-fs-access');

    try {
      const type = findType(exportOptions.type);
      // TODO: remove this workaround.
      if (supported) {
        const either = await lib.fromGeoJSON(data, exportOptions);

        if (either.isLeft()) {
          either.ifLeft((error) => {
            helpers.setErrors({
              type: error.message
            });
          });
          return;
        }

        const res = either
          .map((result) => result.result.blob)
          .orDefaultLazy(() => new Blob());

        try {
          const newHandle = await fileSave(
            res,
            {
              extensions: type.extensions,
              description: 'Save file',
              mimeTypes: ['application/octet-stream']
            },
            null
          );
          if (newHandle) {
            setFileInfo({ handle: newHandle, options: exportOptions });
          }
        } catch (e) {
          captureException(e);
        }
      } else {
        await fromGeoJSON(data, exportOptions)
          .ifRight((result) => {
            const type = findType(exportOptions.type);
            fallbackSave(result, type);
          })
          .ifLeft((error) => {
            helpers.setErrors({
              type: error.message
            });
          })
          .run();
      }
      toast.success('Saved');
      onClose();
    } catch (_e) {
      // Expected
      // console.error(e);
      // console.log("A user went to save a file but cancelled it");
    }
  }

  const featureCount = root.children.length;
  const dialogTitle = `Export ${pluralize('feature', featureCount)}`;

  return (
    <>
      <DialogHeader title={dialogTitle} titleIcon={DownloadIcon} />
      <Formik
        onSubmit={onSubmit}
        initialValues={{
          type: 'geojson',
          geojsonOptions: DEFAULT_EXPORT_GEOJSON_OPTIONS,
          csvOptions: DEFAULT_IMPORT_OPTIONS.csvOptions
        }}
      >
        {({ values }) => {
          return (
            <Form>
              <div>
                <div className="space-y-4">
                  <SelectFileType exportable />
                  {values.type === 'geojson' ? <GeoJSONOptions /> : null}
                  {values.type === 'csv' ? (
                    <CSVOptions
                      root={root}
                      featureMap={data.featureMap}
                      values={values}
                    />
                  ) : null}
                </div>
                <SimpleDialogActions onClose={onClose} action="Export" />
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  );
}
