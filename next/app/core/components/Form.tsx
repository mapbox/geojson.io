import SimpleDialogActions from 'app/components/dialogs/simple_dialog_actions';
import { InlineError } from 'app/components/inline_error';
import type { FormikHelpers, FormikProps } from 'formik';
import { Formik } from 'formik';
import type { PropsWithoutRef, ReactNode } from 'react';
import { useState } from 'react';
import type { z } from 'zod';

interface FormProps<S extends z.ZodType<any, any>>
  extends Omit<PropsWithoutRef<JSX.IntrinsicElements['form']>, 'onSubmit'> {
  children?: ReactNode;
  submitText?: string;
  schema?: S;
  fullWidthSubmit?: boolean;
  mini?: boolean;
  onCancel?: () => void;
  track?: string;
  onSubmit: (
    values: z.infer<S>,
    helpers: FormikHelpers<z.infer<S>>
  ) => Promise<undefined | OnSubmitResult>;
  initialValues?: FormikProps<z.infer<S>>['initialValues'];
}

interface OnSubmitResult {
  FORM_ERROR?: string;
  [prop: string]: any;
}

export const FORM_ERROR = 'FORM_ERROR';

export function Form<S extends z.ZodType<any, any>>({
  children,
  submitText,
  schema,
  mini,
  initialValues,
  onCancel,
  onSubmit,
  fullWidthSubmit = false,
  track,
  ...props
}: FormProps<S>) {
  const [formError, setFormError] = useState<string | null>(null);
  return (
    <Formik
      initialValues={initialValues || {}}
      validate={(values) => {
        if (!schema) return;
        const res = schema.safeParse(values);
        if (res.success === false) {
          return res.error.formErrors.fieldErrors;
        }
      }}
      validateOnChange={false}
      validateOnBlur={false}
      onSubmit={async (values, helpers) => {
        const { setErrors } = helpers;
        const { FORM_ERROR, ...otherErrors } =
          (await onSubmit(values, helpers)) || {};

        if (FORM_ERROR) {
          setFormError(FORM_ERROR);
        } else {
          setFormError(null);
        }

        if (Object.keys(otherErrors).length > 0) {
          setErrors(otherErrors);
        }
      }}
    >
      {({ handleSubmit }) => (
        <form
          onSubmit={handleSubmit}
          className="form"
          autoComplete="off"
          {...props}
        >
          <div className="space-y-2">{children}</div>

          {formError && <InlineError>{formError}</InlineError>}

          {submitText && (
            <SimpleDialogActions
              onClose={onCancel}
              action={submitText}
              fullWidthSubmit={!!fullWidthSubmit}
            />
          )}
        </form>
      )}
    </Formik>
  );
}
