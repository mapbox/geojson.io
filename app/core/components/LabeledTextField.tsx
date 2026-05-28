import type { B3Size } from 'app/components/elements';
import { Input, StyledLabelSpan } from 'app/components/elements';
import { InlineError } from 'app/components/inline_error';
import { ErrorMessage, useField, useFormikContext } from 'formik';
import type { PropsWithoutRef } from 'react';
import { forwardRef } from 'react';

interface LabeledTextFieldProps
  extends PropsWithoutRef<JSX.IntrinsicElements['input']> {
  name: string;
  label: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'url';
  _size?: B3Size;
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements['div']>;
}

export const LabeledTextField = forwardRef<
  HTMLInputElement,
  LabeledTextFieldProps
>(
  (
    { name, label, _size = 'sm', outerProps, ...props }: LabeledTextFieldProps,
    ref
  ) => {
    const [input] = useField(name);
    const { isSubmitting } = useFormikContext();

    return (
      <div className="pb-2 space-y-2" {...outerProps}>
        <label>
          <div className="pb-1">
            <StyledLabelSpan size={_size}>{label}</StyledLabelSpan>
          </div>
          <Input
            spellCheck="false"
            autoCapitalize="false"
            disabled={isSubmitting}
            _size={_size}
            {...input}
            {...props}
            ref={ref}
          />
        </label>

        <ErrorMessage name={name} component={InlineError} />
      </div>
    );
  }
);
