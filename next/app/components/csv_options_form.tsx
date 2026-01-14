import { SelectHeader } from 'app/components/csv_options_form/select_header';
import type { ImportOptions } from 'app/lib/convert';
import { CSV_DELIMITERS, CSV_KINDS } from 'app/lib/convert';
import { detectColumns } from 'app/lib/convert/local/csv_to_geojson';
import { dsvFormat } from 'd3-dsv';
import { Field, type FormikContextType, useFormikContext } from 'formik';
import { captureException } from 'integrations/errors';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import type { JsonObject } from 'type-fest';
import type { WorkBook } from 'xlsx';
import {
  FieldCheckbox,
  StyledLabelSpan,
  styledRadio,
  styledSelect,
  TextWell
} from './elements';
import { InlineError } from './inline_error';

function KindSelector() {
  return (
    <div className="space-y-2">
      <div>
        <StyledLabelSpan>Kind</StyledLabelSpan>
      </div>
      <div className="grid grid-cols-3 items-center gap-2">
        {CSV_KINDS.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-x-1">
            <Field
              type="radio"
              name="csvOptions.kind"
              className={styledRadio}
              value={value}
            />
            <StyledLabelSpan>{label}</StyledLabelSpan>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Overwrite some fields based on autodetected column names.
 * This logic is the same for CSV and XLSX files.
 */
function setAutodetectedFields(
  setFieldValue: FormikContextType<ImportOptions>['setFieldValue'],
  detected: ReturnType<typeof detectColumns>
) {
  if (detected.kind) {
    setFieldValue('csvOptions.kind', detected.kind);
  }
  if (detected.geometryHeader) {
    setFieldValue('csvOptions.geometryHeader', detected.geometryHeader);
  }
  // Lon lat
  setFieldValue('csvOptions.longitudeHeader', detected.longitudeHeader);
  setFieldValue('csvOptions.latitudeHeader', detected.latitudeHeader);
}

type Columns = string[];

function LonLatHeaders({ columns }: { columns: Columns }) {
  return (
    <>
      <SelectHeader
        label="Latitude column"
        name="csvOptions.latitudeHeader"
        columns={columns}
      />
      <SelectHeader
        label="Longitude column"
        name="csvOptions.longitudeHeader"
        columns={columns}
      />
    </>
  );
}

function GeometryHeaders({
  kind,
  columns
}: {
  kind: 'WKT' | 'GeoJSON' | 'Polyline';
  columns: Columns;
}) {
  return (
    <div className="col-span-2">
      <SelectHeader
        label={`${kind} column`}
        name="csvOptions.geometryHeader"
        columns={columns}
      />
    </div>
  );
}

function HeaderSelections({
  values,
  columns
}: {
  values: ImportOptions;
  columns: Columns;
}) {
  const kind = values.csvOptions.kind;
  switch (kind) {
    case 'geojson': {
      return <GeometryHeaders kind="GeoJSON" columns={columns} />;
    }
    case 'polyline': {
      return <GeometryHeaders kind="Polyline" columns={columns} />;
    }
    case 'wkt': {
      return <GeometryHeaders kind="WKT" columns={columns} />;
    }
    case 'lonlat': {
      return <LonLatHeaders columns={columns} />;
    }
  }
}

export function CsvOptionsForm({ file }: { file: File | string }) {
  const { values, setFieldValue } = useFormikContext<ImportOptions>();
  const [columns, setColumns] = useState<Columns>([]);

  const {
    csvOptions: { delimiter },
    type
  } = values;

  const noop = type !== 'csv';

  useEffect(() => {
    if (noop) return;
    const slice = file.slice(0, 512);
    const head =
      typeof slice === 'string' ? Promise.resolve(slice) : slice.text();
    void head
      .then((head) => {
        const headParsed = dsvFormat(delimiter).parse(head);
        const columns = headParsed.columns.filter(Boolean);
        const csvDetected = detectColumns(columns);
        setColumns(columns);
        setAutodetectedFields(setFieldValue, csvDetected);
      })
      .catch((e) => captureException(e));
  }, [file, delimiter, setFieldValue, noop]);

  if (noop) return null;

  return (
    <>
      <KindSelector />
      <div className="grid grid-cols-3 gap-x-3 gap-y-3">
        <div>
          <label className="flex flex-col justify-stretch gap-y-2">
            <StyledLabelSpan>Delimiter</StyledLabelSpan>
            <Field
              name="csvOptions.delimiter"
              component="select"
              className={styledSelect({ size: 'sm' })}
            >
              <option value="none">Select…</option>
              {CSV_DELIMITERS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Field>
          </label>
        </div>
        <HeaderSelections columns={columns} values={values} />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-x-2">
          <FieldCheckbox type="checkbox" name="csvOptions.autoType" />
          <StyledLabelSpan>Infer types</StyledLabelSpan>
        </label>
        <TextWell>
          CSV files technically only contain string values. You can choose to
          infer number, boolean, and null values.
        </TextWell>
      </div>
    </>
  );
}

interface XlsOptionsFormProps {
  file: File;
}

export function XlsOptionsForm(props: XlsOptionsFormProps) {
  const { data: xlsx } = useQuery('xlsx', async () => import('xlsx'), {
    suspense: true
  });

  return <XlsOptionsFormInner {...props} xlsx={xlsx!} />;
}

function XlsOptionsFormInner({
  file,
  xlsx
}: XlsOptionsFormProps & {
  xlsx: typeof import('xlsx');
}) {
  const { values, setFieldValue } = useFormikContext<ImportOptions>();
  const [columns, setColumns] = useState<Columns>([]);
  const [doc, setDoc] = useState<WorkBook | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    csvOptions: { sheet },
    type
  } = values;

  const noop = type !== 'xls';

  useEffect(() => {
    if (noop) return;
    void file
      .arrayBuffer()
      .then((array) => {
        const doc = xlsx.read(array, { type: 'array' });
        setDoc(doc);
        const sheet = Object.keys(doc.Sheets)[0];
        setFieldValue('csvOptions.sheet', sheet);
        setError(null);
      })
      .catch((e) => {
        captureException(e);
        setError('Could not parse spreadsheet');
      });
  }, [file, setFieldValue, noop, xlsx]);

  useEffect(() => {
    if (noop || !doc) return;
    const output = xlsx.utils.sheet_to_json(
      doc.Sheets[sheet]
    ) as unknown as JsonObject[];
    if (!output[0]) {
      // console.error(output, sheet);
      return;
    }
    const columns = Object.keys(output[0]).filter(Boolean);
    const csvDetected = detectColumns(columns);
    setColumns(columns);
    setAutodetectedFields(setFieldValue, csvDetected);
  }, [doc, sheet, setFieldValue, noop, xlsx]);

  if (error && !noop) {
    return <InlineError>{error}</InlineError>;
  }

  if (noop || !doc) return null;

  const sheets = Object.keys(doc.Sheets);

  return (
    <>
      <KindSelector />
      <div className="grid grid-cols-3 gap-x-3 gap-y-3">
        <div>
          <label className="flex flex-col justify-stretch gap-y-2">
            <StyledLabelSpan>Sheet</StyledLabelSpan>
            <Field
              name="csvOptions.sheet"
              component="select"
              className={styledSelect({ size: 'sm' })}
            >
              <option value="none">Select…</option>
              {sheets.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Field>
          </label>
        </div>
        <HeaderSelections columns={columns} values={values} />
      </div>
    </>
  );
}
