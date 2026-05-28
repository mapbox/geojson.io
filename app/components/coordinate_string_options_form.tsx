import type { ImportOptions } from 'app/lib/convert';
import { COORDINATE_STRING_ORDERS } from 'app/lib/convert';
import { Field, useFormikContext } from 'formik';
import { StyledLabelSpan, styledRadio } from './elements';

export function CoordinateStringOptionsForm() {
  const { values } = useFormikContext<ImportOptions>();
  const { type } = values;
  const noop = type !== 'coordinate-string';
  if (noop) return null;

  return (
    <>
      <div className="flex items-center gap-x-4">
        {COORDINATE_STRING_ORDERS.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-x-1">
            <Field
              className={styledRadio}
              type="radio"
              name="coordinateStringOptions.order"
              value={value}
            />
            <StyledLabelSpan>{label}</StyledLabelSpan>
          </label>
        ))}
      </div>
      <div>
        <div className="pt-2 text-sm text-gray-700 dark:text-gray-300">
          Decimal coordinate strings, like <code>-72.00, 40.00</code> are
          supported.
        </div>
      </div>
    </>
  );
}
