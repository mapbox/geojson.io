import { GearIcon } from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import { TextWell } from 'app/components/elements';
import { useAtom } from 'jotai';
import { Switch } from 'radix-ui';
import { removeCoincidentsAtom } from 'state/jotai';

const switchRootClass =
  'relative mt-0.5 h-4 w-7 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 ' +
  'data-[state=checked]:bg-mb-blue-500 ' +
  'transition-colors duration-200 cursor-pointer outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-mb-blue-500';

const switchThumbClass =
  'block h-3 w-3 rounded-full bg-white shadow ' +
  'translate-x-0.5 data-[state=checked]:translate-x-3.5 ' +
  'transition-transform duration-200';

const sectionHeadingClass =
  'text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 pb-1';

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange
}: {
  label: string;
  description: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-x-6 py-2">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        <TextWell size="xs">{description}</TextWell>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className={switchRootClass}
      >
        <Switch.Thumb className={switchThumbClass} />
      </Switch.Root>
    </div>
  );
}

export function OptionsDialog() {
  const [removeCoincidents, setRemoveCoincidents] = useAtom(
    removeCoincidentsAtom
  );

  return (
    <>
      <DialogHeader title="Options" titleIcon={GearIcon} />
      <div className={sectionHeadingClass}>Import</div>
      <SettingRow
        label="Remove coincident vertices"
        description="Removes duplicate consecutive vertices sometimes produced by other GIS tools."
        checked={removeCoincidents}
        onCheckedChange={setRemoveCoincidents}
      />
    </>
  );
}
