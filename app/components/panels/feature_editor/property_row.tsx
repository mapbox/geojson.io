import { styledTd } from 'app/components/elements';
import { MultiValueEditor } from 'app/components/shared/multi_value_editor';
import type { ExplicitCast } from 'app/lib/cast';
import type { MultiPair } from 'app/lib/multi_properties';
import { Popover as P } from 'radix-ui';
import type { JsonValue } from 'type-fest';
import { PropertyRowKey, PropertyRowKeyReadonly } from './property_row/key';
import { PropertyRowValue } from './property_row/value';

export type OnChangeValue = (key: string, value: JsonValue) => void;
export type OnDeleteKey = (key: string) => void;
export type OnCast = (
  key: string,
  value: string,
  castType: ExplicitCast
) => void;
export type OnChangeKey = (key: string, newKey: string) => void;
export type PropertyPair = [string, JsonValue | undefined];
export type Pair = PropertyPair | MultiPair;

interface PropertyRowProps {
  pair: PropertyPair;
  onChangeValue: OnChangeValue;
  even: boolean;
  onChangeKey: OnChangeKey;
  onDeleteKey: OnDeleteKey;
  onCast: OnCast;
  y: number;
}

export function PropertyRowMulti({
  pair,
  onChangeValue,
  onChangeKey,
  onDeleteKey,
  onCast,
  even,
  y
}: Omit<PropertyRowProps, 'pair'> & {
  pair: MultiPair;
}) {
  const [key, values] = pair;
  const hasMulti = values.size > 1;
  const { value } = values.keys().next();

  return (
    <P.Root>
      <tr className={`${even ? '' : 'bg-gray-100 dark:bg-gray-700'} group`}>
        <td className={`border-r border-b border-t ${styledTd}`}>
          <PropertyRowKey pair={pair} onChangeKey={onChangeKey} x={0} y={y} />
        </td>

        <td className={`border-l border-b border-t ${styledTd}`}>
          {hasMulti ? (
            <MultiValueEditor
              x={1}
              y={y}
              pair={pair}
              onAccept={(newValue) => {
                if (newValue === undefined) {
                  onDeleteKey(key);
                } else {
                  onChangeValue(key, newValue);
                }
              }}
            />
          ) : (
            <PropertyRowValue
              x={1}
              y={y}
              pair={[key, value]}
              onChangeValue={onChangeValue}
              even={even}
              onDeleteKey={onDeleteKey}
              onCast={onCast}
            />
          )}
        </td>
      </tr>
    </P.Root>
  );
}

export function PropertyRow({
  pair,
  onChangeValue,
  onChangeKey,
  even,
  onDeleteKey,
  onCast,
  y
}: PropertyRowProps) {
  return (
    <P.Root>
      <tr className={`${even ? '' : 'bg-gray-100 dark:bg-gray-700'}`}>
        <td className={`border-r border-b border-t ${styledTd}`}>
          <PropertyRowKey x={0} y={y} pair={pair} onChangeKey={onChangeKey} />
        </td>
        <td className={`border-l border-b border-t relative ${styledTd}`}>
          <PropertyRowValue
            x={1}
            y={y}
            pair={pair}
            onChangeValue={onChangeValue}
            onDeleteKey={onDeleteKey}
            onCast={onCast}
            even={even}
          />
        </td>
      </tr>
    </P.Root>
  );
}

export function PropertyRowReadonly({
  pair,
  even,
  y
}: Pick<PropertyRowProps, 'pair' | 'even' | 'y'>) {
  return (
    <P.Root>
      <tr className={`${even ? '' : 'bg-gray-100 dark:bg-gray-700'}`}>
        <td className={`border-r border-b border-t ${styledTd}`}>
          <PropertyRowKeyReadonly x={0} y={y} pair={pair} />
        </td>
        <td className={`border-l border-b border-t relative ${styledTd}`}>
          <PropertyRowValue
            readOnly
            onChangeValue={() => {}}
            onDeleteKey={() => {}}
            onCast={() => {}}
            x={1}
            y={y}
            pair={pair}
            even={even}
          />
        </td>
      </tr>
    </P.Root>
  );
}
