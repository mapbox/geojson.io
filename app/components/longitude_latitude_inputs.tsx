import type useResettable from 'app/hooks/use_resettable';
import { Input } from './elements';

type ResettableProps = ReturnType<typeof useResettable>;

function ResetField({
  label,
  inputProps
}: {
  label: string;
  inputProps: ResettableProps & React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <label>
      <div className="pb-1 text-xs text-gray-500 dark:text-gray-200">
        {label}
      </div>
      <Input type="number" {...inputProps} />
    </label>
  );
}

export function LongitudeLatitudeInputs({
  longitudeProps,
  latitudeProps
}: {
  longitudeProps: ResettableProps;
  latitudeProps: ResettableProps;
}) {
  const coordinateOrder = 'LONLAT';
  const lon = <ResetField label="Longitude" inputProps={longitudeProps} />;
  const lat = (
    <ResetField
      label="Latitude"
      inputProps={{
        ...latitudeProps,
        min: -90,
        max: 90
      }}
    />
  );
  return (
    <div className="grid grid-cols-2 gap-x-2">
      {coordinateOrder === 'LONLAT' ? (
        <>
          {lon}
          {lat}
        </>
      ) : (
        <>
          {lat}
          {lon}
        </>
      )}
    </div>
  );
}
