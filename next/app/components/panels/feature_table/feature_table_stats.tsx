import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import * as E from 'app/components/elements';
import {
  collectGeometryCounts,
  collectStatistics,
  type RetStat
} from 'app/lib/stats';
import { formatCount, pluralize } from 'app/lib/utils';
import { Popover as P } from 'radix-ui';
import React, { useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { IWrappedFeature } from 'types';

export function GeometryTypesGrid({
  features
}: {
  features: IWrappedFeature[];
}) {
  const counts = useMemo(() => {
    return collectGeometryCounts(features);
  }, [features]);
  return (
    <>
      <div className="font-bold text-sm pb-2">Geometry types</div>
      <div
        className="
          grid grid-cols-2 gap-x-2 gap-y-1
          text-xs"
        style={{
          gridTemplateColumns: 'min-content 1fr min-content 1fr'
        }}
      >
        {Object.entries(counts).map(([type, number]) => {
          return (
            <React.Fragment key={type}>
              <div className="tabular-nums text-right">
                {formatCount(number)}
              </div>
              <div>{type}</div>
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}

export function FeatureTableStats({
  features
}: {
  features: IWrappedFeature[];
}) {
  const stats = useMemo(() => {
    return collectStatistics(features);
  }, [features]);

  return (
    <div
      className="mt-2 rounded p-3 dark:text-white bg-gray-100 dark:bg-gray-900 overflow-y-auto geojsonio-scrollbar"
      style={{
        maxHeight: 420
      }}
    >
      <GeometryTypesGrid features={features} />
      <div className="font-bold text-sm pt-4 pb-2">Properties</div>
      <table className="w-full border-collapse text-xs">
        <tbody>
          {stats.map(({ property, stats }) => {
            const shared =
              'border border-gray-300 dark:border-gray-700 text-left p-2 overflow-x-auto';
            return (
              <tr key={property}>
                <th className={`${shared} align-top`}>{property}</th>
                <td className={shared}>
                  <StatValue stats={stats} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatValue({ stats }: { stats: RetStat }) {
  const { types } = stats;

  return (
    <div>
      <div>
        {[
          types.number && pluralize('number', types.number),
          types.string && pluralize('string', types.string),
          types.boolean && pluralize('boolean', types.boolean),
          types.other && pluralize('other value', types.other)
        ]
          .filter(Boolean)
          .join(', ')}
      </div>
      {types.number > 0 ? (
        <div>
          min={stats.min}, max={stats.max}, sum={stats.sum}
        </div>
      ) : null}
      {types.string > 0 ? (
        <div>
          <P.Root>
            <div>
              {pluralize('unique value', stats.strings.length)}{' '}
              <P.Trigger
                title="View values"
                className="align-middle inline-flex items-center opacity-50 hover:opacity-100
                aria-expanded:opacity-100
                aria-expanded:ring
                aria-expanded:ring-1
                aria-expanded:ring-mb-blue-500
                "
              >
                <MagnifyingGlassIcon className="w-3 h-3" />
              </P.Trigger>
            </div>
            <E.PopoverContent2>
              <StatValuePopover stats={stats} />
            </E.PopoverContent2>
          </P.Root>
        </div>
      ) : null}
    </div>
  );
}

function StatValuePopover({ stats }: { stats: RetStat }) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: stats.strings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 24, [])
  });

  return (
    <div
      ref={parentRef}
      className="text-xs overflow-y-auto h-48 geojsonio-scrollbar"
    >
      <div
        className="w-full relative rounded"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const value = stats.strings[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              className="absolute whitespace-nowrap top-0 left-0 "
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {value[0]}{' '}
              <span className="select-none opacity-50">({value[1]})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
