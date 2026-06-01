import type { Units } from '@turf/helpers';
import { GROUPED_UNIT_OPTIONS } from 'app/lib/constants';
import { memo } from 'react';
import { styledSelect } from './elements';

export function UnitOptionsGroups({
  groups
}: {
  groups: typeof GROUPED_UNIT_OPTIONS['area' | 'length'];
}) {
  return (
    <>
      {groups.map((group, i) => (
        <optgroup key={i} label={group.name}>
          {group.items.map((item) => (
            <option key={item.name} value={item.key}>
              {item.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

export const UnitSelect = memo(function UnitSelect({
  onChange,
  value,
  type
}: {
  onChange: (arg0: string) => void;
  value: Units;
  type: 'area' | 'length';
}) {
  return (
    <select
      className={`${styledSelect({ size: 'sm' })} w-24`}
      value={value}
      aria-label="Select units"
      onChange={(e) => {
        onChange(e.target.value);
      }}
    >
      <UnitOptionsGroups groups={GROUPED_UNIT_OPTIONS[type]} />
    </select>
  );
});
