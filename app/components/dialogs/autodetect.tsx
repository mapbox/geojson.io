import {
  DEFAULT_IMPORT_OPTIONS,
  detectType,
  type ImportOptions
} from 'app/lib/convert';
import { useFormikContext } from 'formik';
import { captureException } from 'integrations/errors';
import { useEffect } from 'react';

const defaultOptions = {
  type: 'geojson',
  toast: true,
  secondary: false,
  ...DEFAULT_IMPORT_OPTIONS
} as const;

export function AutoDetect({ file }: { file: File }) {
  const { setValues } = useFormikContext<ImportOptions>();

  useEffect(() => {
    detectType(file)
      .then((detected) => {
        return setValues((values) => ({
          ...values,
          ...detected.orDefault(defaultOptions)
        }));
      })
      .catch((e) => captureException(e));
  }, [file, setValues]);
  return null;
}
