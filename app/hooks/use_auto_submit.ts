import { useFormikContext } from 'formik';
import debounce from 'lodash/debounce';
import { useEffect, useMemo } from 'react';

const AUTO_SUBMIT_DEBOUNCE_MS = 100;

/**
 * This needs to be called within a formik context. It'll
 * detect changes to the form and submit it automatically,
 * up to 10 times a second.
 */
export function useAutoSubmit() {
  const { submitForm, values } = useFormikContext();

  const debouncedSubmit = useMemo(
    () => debounce(() => submitForm(), AUTO_SUBMIT_DEBOUNCE_MS),
    [submitForm]
  );

  useEffect(() => {
    void debouncedSubmit();
  }, [debouncedSubmit, values]);
}
