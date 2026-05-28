import { CardStackIcon } from '@radix-ui/react-icons';
import {
  Button,
  PopoverTitleAndClose,
  StyledField,
  StyledPopoverArrow,
  StyledPopoverContent
} from 'app/components/elements';
import { coordPropsAttr } from 'app/components/panels/feature_editor/property_row/value';
import type { MultiPair } from 'app/lib/multi_properties';
import { pluralize } from 'app/lib/utils';
import { Form, Formik } from 'formik';
import isObject from 'lodash/isObject';
import { Popover as P } from 'radix-ui';
import { useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { JsonValue } from 'type-fest';
import type { CoordProps } from 'types';

type MultiValueProps = CoordProps & {
  pair: MultiPair;
  onAccept: (arg0: JsonValue | undefined) => void;
};

function ValueList({ pair, onAccept }: Omit<MultiValueProps, 'x' | 'y'>) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const values = Array.from(pair[1].entries());

  const rowVirtualizer = useVirtualizer({
    count: values.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 28, [])
  });

  return (
    <div>
      <div className="pb-2 text-xs">Existing values</div>
      <div ref={parentRef} className="h-32 overflow-y-auto">
        <div
          className="w-full relative rounded"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const val = values[virtualRow.index];
            return (
              <button
                type="button"
                key={virtualRow.index}
                className="top-0 left-0 block text-left w-full absolute py-1 px-2 flex items-center
                hover:bg-gray-200 dark:hover:bg-gray-700
                gap-x-2"
                onClick={() => onAccept(val[0])}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <div className="flex-auto font-mono text-xs truncate">
                  {isObject(val[0])
                    ? JSON.stringify(val[0]).substring(0, 1024)
                    : String(val[0])}
                </div>
                <div
                  className="text-xs font-mono"
                  title="Features with this value"
                >
                  ({val[1]})
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="pt-3 pb-2 text-xs">New value</div>
      <Formik
        initialValues={{ value: '' }}
        onSubmit={(formValues) => {
          onAccept(formValues.value);
        }}
      >
        <Form>
          <div className="flex items-center gap-x-2">
            <StyledField
              name="value"
              spellCheck="false"
              type="text"
              _size="xs"
            />
            <Button size="xs" type="submit">
              Set
            </Button>
          </div>
        </Form>
      </Formik>
    </div>
  );
}

export function MultiValueEditor({ pair, onAccept, x, y }: MultiValueProps) {
  const [, value] = pair;
  return (
    <div>
      <P.Root>
        <P.Trigger
          {...coordPropsAttr({ x, y })}
          aria-label="Multiple values"
          className="group
          text-left font-mono
          text-xs px-1.5 py-2
          text-gray-700

          focus-visible:ring-inset
          focus-visible:ring-1
          focus-visible:ring-mb-blue-500
          aria-expanded:ring-1
          aria-expanded:ring-mb-blue-500

          gap-x-1 block w-full
          dark:text-white bg-transparent
          flex overflow-hidden"
        >
          <CardStackIcon />
          {pluralize('value', value.size)}
        </P.Trigger>
        <P.Portal>
          <StyledPopoverContent>
            <StyledPopoverArrow />
            <PopoverTitleAndClose title="" />
            <ValueList pair={pair} onAccept={onAccept} />
          </StyledPopoverContent>
        </P.Portal>
      </P.Root>
    </div>
  );
}
