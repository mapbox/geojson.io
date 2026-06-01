import clsx from 'clsx';
import * as d3 from 'd3-color';
import type { FieldProps } from 'formik';
import { Popover as P } from 'radix-ui';
import {
  HexColorInput,
  type HexColorPicker,
  RgbaStringColorPicker
} from 'react-colorful';
import * as E from './elements';

export function ColorPopoverField({
  field,
  form,
  ...other
}: FieldProps & React.ComponentProps<typeof ColorPopover>) {
  return (
    <ColorPopover
      color={field.value}
      onChange={(value) => {
        form.setFieldValue(field.name, value);
      }}
      {...other}
    />
  );
}

/**
 * Helpers, from d3-color. Remove these
 * when I can finally use ESM modules.
 */
function clampi(value: number) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}

function hex(value: number) {
  value = clampi(value);
  return (value < 16 ? '0' : '') + value.toString(16);
}

function rgba2hex(orig: string): string {
  const c = d3.color(orig);
  if (c === null) return '';
  if (c.opacity !== 1) {
    return `${c.formatHex()}${hex(c.opacity * 255)}`;
  }
  return c.formatHex();
}

function color2rgb(orig: string): string {
  const c = d3.color(orig);
  if (c === null) return 'rgba(0, 0, 0, 0)';
  return c.formatRgb();
}

export function ColorPopover({
  color,
  onChange,
  onBlur,
  _size = 'sm'
}: React.ComponentProps<typeof HexColorPicker> & {
  _size?: E.B3Size;
}) {
  return (
    <P.Root>
      <P.Trigger
        className={clsx(
          E.sharedOutline('default'),
          E.sharedPadding(_size),
          'flex items-center w-full gap-x-2 font-mono dark:text-white'
        )}
      >
        <div
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor: color
          }}
        ></div>
        <span>{color ? rgba2hex(color) : ''}</span>
      </P.Trigger>
      <E.PopoverContent2 size="no-width">
        <div className="space-y-2">
          <div className="border border-white" style={{ borderRadius: 5 }}>
            <RgbaStringColorPicker
              color={color2rgb(color!)}
              onChange={onChange}
              onBlur={onBlur}
            />
          </div>
          <HexColorInput
            className={E.inputClass({ _size })}
            prefixed
            alpha
            color={color}
            onChange={onChange}
          />
          <P.Close asChild>
            <E.Button>Done</E.Button>
          </P.Close>
        </div>
      </E.PopoverContent2>
    </P.Root>
  );
}
