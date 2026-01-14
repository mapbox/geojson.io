import { StyledLabelSpan, styledSelect } from 'app/components/elements';
import { Field } from 'formik';

export function SelectHeader({
  label,
  name,
  columns,
  noDefault
}: {
  label: string;
  name: string;
  columns: string[];
  noDefault?: boolean;
}) {
  return (
    <label className="flex flex-col justify-stretch gap-y-2">
      <StyledLabelSpan>{label}</StyledLabelSpan>
      {columns.length === 0 ? (
        <div className="block w-full p-1 text-sm text-gray-700 dark:text-white dark:bg-transparent truncate bg-gray-100 border border-gray-300 rounded-sm cursor-not-allowed">
          No columns detected
        </div>
      ) : (
        <Field
          component="select"
          name={name}
          required
          className={styledSelect({ size: 'sm' })}
        >
          {noDefault ? <option value="">Select…</option> : null}
          {columns.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Field>
      )}
    </label>
  );
}
