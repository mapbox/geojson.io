import {
  BarChartIcon,
  Cross2Icon,
  GearIcon,
  MagnifyingGlassIcon
} from '@radix-ui/react-icons';
import { useMove } from '@react-aria/interactions';
import * as E from 'app/components/elements';
import AddColumn from 'app/components/panels/feature_table/add_column';
import { FeatureTableStats } from 'app/components/panels/feature_table/feature_table_stats';
import { Header } from 'app/components/panels/feature_table/header';
import { PropertyColumn } from 'app/components/panels/feature_table/property_column';
import RowActions from 'app/components/panels/feature_table/row_actions';
import TableEmptyState from 'app/components/panels/feature_table/table_empty_state';
import { onArrow } from 'app/lib/arrow_navigation';
import { geometryTypes } from 'app/lib/constants';
import { getFn, useColumns } from 'app/lib/search_utils';
import clsx from 'clsx';
import { Field, Form, Formik } from 'formik';
import Fuse from 'fuse.js';
import { useAtom, useAtomValue } from 'jotai';
import clamp from 'lodash/clamp';
import sortBy from 'lodash/sortBy';
import { Popover as P } from 'radix-ui';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VirtualItem } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import { USelection } from 'state';
import {
  type Data,
  dataAtom,
  type FilterOptions,
  initialFilterValues,
  selectionAtom,
  splitsAtom,
  tableFilterAtom,
  virtualColumnsAtom
} from 'state/jotai';
import type { IWrappedFeature } from 'types';

type ColumnConfig = Map<string, { width: number }>;

export const HEIGHT = 33;
const NARROW_COLUMN_WIDTH = 64;
const AUTO_MAX_COLUMN_WIDTH = 140;
const MAX_COLUMN_WIDTH = 180;
/** Compensate for the width of the "expand" button */
const WIDGET_WIDTH = 40;
/** Estimated width of a character, for column measurement */
const CHAR_WIDTH = 10;

/**
 * Clamp widths. Allow wider variations when auto is false,
 * and someone is dragging, than when auto is true and this
 * is being auto calculated.
 */
function clampColumnWidth(width: number, auto: boolean) {
  return clamp(
    width,
    NARROW_COLUMN_WIDTH,
    auto ? AUTO_MAX_COLUMN_WIDTH : MAX_COLUMN_WIDTH
  );
}

function virtualPosition(
  virtualColumn: VirtualItem,
  virtualRow: VirtualItem
): NonNullable<React.HTMLAttributes<HTMLDivElement>['style']> {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${virtualColumn.size - 1}px`,
    height: `${virtualRow.size - 2}px`,
    transform: `translate(${virtualColumn.start + 1}px, ${
      virtualRow.start + 1
    }px)`
  };
}

export function virtualPositionTop(
  virtualColumn: VirtualItem
): NonNullable<React.HTMLAttributes<HTMLDivElement>['style']> {
  return {
    width: `${virtualColumn.size}px`,
    transform: `translateX(${virtualColumn.start}px)`,
    height: HEIGHT + 1
  };
}

function HeaderResizer({
  virtualColumn,
  column,
  onResize
}: {
  virtualColumn: VirtualItem;
  column: string;
  onResize: (column: string, width: number) => void;
}) {
  const w = 8;
  const { moveProps } = useMove({
    onMove(e) {
      onResize(column, e.deltaX);
    }
  });
  return (
    <button
      className="absolute flex
      bg-mb-blue-300 rounded
      opacity-0 hover:opacity-100 focus:opacity-100
      hover-none:opacity-20
      touch-none
      cursor-ew-resize"
      style={{
        width: `${w}px`,
        transform: `translateX(${0.5 + virtualColumn.end - w / 2}px)`,
        height: HEIGHT
      }}
      {...moveProps}
    />
  );
}

export function measureColumn(column: string, featureMap: Data['featureMap']) {
  let maxLength = column.length + 2;
  let measured = 0;

  for (const { feature } of featureMap.values()) {
    const value = feature.properties?.[column];
    if (typeof value === 'string') {
      if (value.length > maxLength) {
        maxLength = value.length;
      }
      if (++measured > 20) break;
    } else if (typeof value === 'object') {
      if (8 > maxLength) {
        maxLength = 8;
      }
      if (++measured > 20) break;
    }
  }
  return clampColumnWidth(maxLength * CHAR_WIDTH, true);
}

export function filterFeatures({
  featureMap,
  filter,
  columns
}: {
  featureMap: Data['featureMap'];
  filter: FilterOptions;
  columns: string[];
}): IWrappedFeature[] {
  const { column, search, geometryType, isCaseSensitive } = filter;
  const hasSearch = !!search;
  const hasGeometryType = geometryType !== null;

  if (!(hasSearch || hasGeometryType)) {
    return Array.from(featureMap.values());
  }

  const results = [];

  for (const wrappedFeature of featureMap.values()) {
    const { feature } = wrappedFeature;
    const geometry = feature.geometry;
    const geometryTypeMatch =
      !hasGeometryType || geometry?.type === geometryType;

    if (geometryTypeMatch) {
      results.push(wrappedFeature);
    }
  }

  if (!hasSearch) {
    return results;
  }

  return new Fuse(results, {
    keys: column ? [column] : columns,
    isCaseSensitive,
    getFn,
    threshold: filter.exact ? 0 : 0.2,
    ignoreLocation: filter.exact
  })
    .search(search)
    .map((result) => result.item);
}

function FeatureTableInner({ data }: { data: Data }) {
  const { featureMap } = data;
  const panelWidth = useAtomValue(splitsAtom).right;
  const panelIsWide = panelWidth > 300;

  const [selection, setSelection] = useAtom(selectionAtom);
  const { type: selectionType } = selection;
  const selectionId = selection.type === 'single' ? selection.id : null;

  /**
   * Used for the virtualization of the table.
   */
  const parentRef = useRef<HTMLDivElement | null>(null);

  /**
   * Virtal columns are added when you add a column to the database:
   * they are appended to the list of columns to force the table
   * to display another column even though the data doesn't contain
   * that column yet.
   */
  const [virtualColumns, setVirtualColumns] = useAtom(virtualColumnsAtom);

  /**
   * Column widths are stored separately from columns and are
   * set automatically when you initially see the table, and then
   * can be resized by dragging resizers.
   */
  const [columnWidths, setColumnWidths] = useState<ColumnConfig>(new Map());

  const [_filter, setFilter] = useAtom(tableFilterAtom);

  const filter = useMemo(() => {
    return {
      ..._filter
    };
  }, [_filter]);

  let columns = useColumns({
    featureMap,
    virtualColumns
  });

  const localOrder = useRef<string[]>(columns || []);

  /**
   * Used to skip useEffect calls when focus moves but does
   * not affect the selected feature id.
   */
  const lastSelectionId = useRef<IWrappedFeature['id'] | null>(null);

  /**
   * Measure columns for the table. This is
   * additive: when new columns are introduced, we add them
   * to the list. Columns should not be overwritten by this method.
   */
  useEffect(
    function measureColumns() {
      setColumnWidths((oldValue) => {
        const newValue = new Map(oldValue);

        for (const column of columns) {
          if (oldValue.has(column)) continue;
          const measurement = measureColumn(column, data.featureMap);
          newValue.set(column, {
            width: measurement
          });
        }

        return newValue;
      });
    },
    [data, columns]
  );

  // Sort order! Same as in the feature properties pane.
  columns = useMemo(
    () =>
      sortBy(columns, (name) => {
        return localOrder.current.indexOf(name);
      }),
    [columns]
  );

  const features: IWrappedFeature[] = useMemo(() => {
    const features = filterFeatures({
      filter,
      columns,
      featureMap: data.featureMap
    });
    return features;
  }, [filter, columns, data]);

  const estimateSize = useCallback(
    (index: number) => {
      switch (index) {
        case 0:
          return 120;
        case columns.length + 1:
          return 50;
        default:
          return (
            (columnWidths.get(columns[index - 1])?.width ||
              NARROW_COLUMN_WIDTH) + WIDGET_WIDTH
          );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnWidths]
  );

  /**
   * Virtualizers. Note that we use overscan here so that arrow keybindings
   * work at the edges of the display, otherwise there isn't something to focus.
   */
  const rowVirtualizer = useVirtualizer({
    count: features.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => HEIGHT, []),
    overscan: 3
  });

  const columnVirtualizer = useVirtualizer({
    count: columns.length + 2,
    horizontal: true,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 3
  });

  useEffect(() => {
    if (selectionType === 'single' && lastSelectionId.current !== selectionId) {
      rowVirtualizer.scrollToIndex(
        features.findIndex((wrappedFeature) => {
          return wrappedFeature.id === selectionId;
        }),
        {
          align: 'auto'
        }
      );
    }
    lastSelectionId.current = selectionId;
  }, [selectionType, selectionId, rowVirtualizer, features]);

  /**
   * Called when you drag a column resizer. Updates column widths.
   */
  const onResize = useCallback((column: string, delta: number) => {
    setColumnWidths((oldValue) => {
      const newValue = new Map(oldValue);
      newValue.set(column, {
        width: clampColumnWidth(
          (newValue.get(column)?.width || NARROW_COLUMN_WIDTH) + delta,
          false
        )
      });
      return newValue;
    });
  }, []);

  const [statsOpen, setStatsOpen] = useState<boolean>(false);

  const headerBase = `text-xs text-left
    text-gray-700 dark:text-gray-300
    flex items-center
    bg-gray-100 dark:bg-gray-700
    border-t border-b border-gray-300 dark:border-gray-600`;
  const headerHoverClass = `hover:bg-gray-200 dark:hover:bg-gray-700
    hover:text-black dark:hover:text-white`;

  const geometryColumnClass = clsx(headerBase, `absolute pl-1`);

  const addColumnClass = clsx(
    headerBase,
    headerHoverClass,
    `px-2 justify-center border-r border-l`
  );
  const headerClass = clsx(
    headerBase,
    headerHoverClass,
    `
    group justify-between
    gap-x-2
    w-full truncate
    px-2 border-l`
  );

  return (
    <>
      <div className="p-2">
        <div className="flex items-stretch gap-x-1">
          <E.Button
            size="xs"
            type="button"
            {...(statsOpen
              ? {
                  'aria-expanded': true
                }
              : {})}
            onClick={() => {
              setStatsOpen((val) => !val);
            }}
          >
            <BarChartIcon />
            {panelIsWide ? 'Stats' : ''}
          </E.Button>
          <div className="w-1 mr-1 border-r border-gray-300 dark:border-gray-700" />
          <P.Root>
            <Formik
              onSubmit={({
                exact,
                search,
                isCaseSensitive,
                column,
                geometryType
              }) => {
                setFilter((filter) => ({
                  ...filter,
                  search: search?.trim() || null,
                  isCaseSensitive: !!isCaseSensitive,
                  column: column || null,
                  geometryType: geometryType || null,
                  exact: exact
                }));
              }}
              initialValues={filter}
            >
              {(helpers) => (
                <Form className="flex-auto">
                  <div className="flex items-stretch gap-x-1">
                    <div className="relative w-full">
                      <Field
                        className={E.inputClass({ _size: 'xs' })}
                        name="search"
                        type="input"
                        placeholder="Search"
                      />
                      <div className="absolute flex items-center top-0 bottom-0 right-1">
                        <E.Button
                          size="xs"
                          type="button"
                          variant="quiet"
                          onClick={() => {
                            helpers.resetForm();
                            setFilter(() => ({
                              ...initialFilterValues
                            }));
                          }}
                        >
                          <Cross2Icon />
                        </E.Button>
                      </div>
                    </div>
                    <P.Trigger asChild>
                      <E.Button size="xs">
                        <GearIcon />
                      </E.Button>
                    </P.Trigger>
                    <E.Button size="xs" type="submit">
                      {panelIsWide ? 'Search' : <MagnifyingGlassIcon />}
                    </E.Button>
                  </div>
                  <E.PopoverContent2>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 py-2">
                      <Field
                        as="select"
                        className={E.styledSelect({ size: 'xs' })}
                        name="column"
                      >
                        <option value={''}>Any column</option>:
                        {columns.map((column) => {
                          return (
                            <option key={column} value={column}>
                              {column}
                            </option>
                          );
                        })}
                      </Field>
                      <Field
                        as="select"
                        className={E.styledSelect({ size: 'xs' })}
                        name="geometryType"
                      >
                        <option value={''}>Any geometry type</option>:
                        {geometryTypes.map((type) => {
                          return (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          );
                        })}
                      </Field>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-x-1">
                        <E.FieldCheckbox
                          type="checkbox"
                          size="xs"
                          name="isCaseSensitive"
                        />
                        <E.StyledLabelSpan size="xs">
                          Case sensitive
                        </E.StyledLabelSpan>
                      </label>
                      <label className="flex items-center gap-x-1">
                        <E.FieldCheckbox
                          type="checkbox"
                          size="xs"
                          name="exact"
                        />
                        <E.StyledLabelSpan size="xs">
                          Exact string
                        </E.StyledLabelSpan>
                      </label>
                    </div>
                  </E.PopoverContent2>
                </Form>
              )}
            </Formik>
          </P.Root>
        </div>
        {statsOpen ? <FeatureTableStats features={features} /> : null}
      </div>
      <div
        ref={parentRef}
        className="overflow-auto flex-auto geojsonio-scrollbar"
        data-focus-scope
        onKeyUp={onArrow}
      >
        <div
          className="relative w-full sticky top-0 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 z-10"
          style={{
            height: HEIGHT,
            width: `${columnVirtualizer.getTotalSize()}px`
          }}
        >
          {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            return virtualColumn.index === 0 ? (
              <div
                style={virtualPositionTop(virtualColumn)}
                key={`geometry-column-${virtualColumn.index}`}
                className={geometryColumnClass}
              >
                <input
                  className={
                    E.styledCheckbox({ variant: 'default' }) +
                    ' mr-2 w-3 h-3 focus:ring-mb-blue-500 focus:ring-1'
                  }
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelection(
                        USelection.fromIds(features.map((f) => f.id))
                      );
                    } else {
                      setSelection(USelection.none());
                    }
                  }}
                />
                Geometry
              </div>
            ) : virtualColumn.index === columns.length + 1 ? (
              <div
                className="absolute"
                key={`add-column-${virtualColumn.index}`}
                style={virtualPositionTop(virtualColumn)}
              >
                <AddColumn
                  style={{
                    height: HEIGHT + 1
                  }}
                  className={addColumnClass}
                  onAddColumn={(name) => {
                    setVirtualColumns(virtualColumns.concat(name));
                    localOrder.current.push(name);
                  }}
                />
              </div>
            ) : (
              <Header
                key={`header-column-${virtualColumn.index}`}
                virtualColumn={virtualColumn}
                column={columns[virtualColumn.index - 1]}
                localOrder={localOrder}
                statsOpen={statsOpen}
                className={headerClass}
              />
            );
          })}
          {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            return virtualColumn.index === 0 ? null : virtualColumn.index ===
              columns.length + 1 ? null : (
              <HeaderResizer
                key={`resizer-${virtualColumn.index}`}
                virtualColumn={virtualColumn}
                column={columns[virtualColumn.index - 1]}
                onResize={onResize}
              />
            );
          })}
        </div>
        <div
          className="relative w-full"
          style={{
            willChange: 'transform',
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: `${columnVirtualizer.getTotalSize()}px`
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const feature = features[virtualRow.index];
            const selected = USelection.isSelected(selection, feature.id);
            const rowActionsCol = columnVirtualizer.getVirtualItems()[0];
            return (
              <div key={`row-${virtualRow.index}`} className="group">
                {columnVirtualizer
                  .getVirtualItems()
                  .slice(1)
                  .map((virtualColumn) => {
                    const style = virtualPosition(virtualColumn, virtualRow);
                    return virtualColumn.index === columns.length + 1 ? null : (
                      <div
                        key={`property-column-${virtualColumn.index}`}
                        style={style}
                      >
                        <PropertyColumn
                          x={virtualColumn.index}
                          y={virtualRow.index}
                          column={columns[virtualColumn.index - 1]}
                          feature={feature}
                        />
                      </div>
                    );
                  })}
                <div style={virtualPosition(rowActionsCol, virtualRow)}>
                  <RowActions
                    selected={selected}
                    setSelection={setSelection}
                    features={features}
                    feature={feature}
                  />
                </div>
              </div>
            );
          })}

          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            return (
              <div
                key={`row-line-${virtualRow.index}`}
                className="group absolute left-0 top-0 border-t border-gray-300 dark:border-gray-700 z-50"
                style={{
                  transform: `translateY(${
                    virtualRow.start + virtualRow.size
                  }px)`,
                  width: columnVirtualizer.getTotalSize() - 50
                }}
              />
            );
          })}
          {columnVirtualizer
            .getVirtualItems()
            .slice(0, -1)
            .map((virtualColumn) => {
              return (
                <div
                  key={`column-line-${virtualColumn.index}`}
                  className="group absolute top-0 border-l border-gray-200 dark:border-gray-700 z-50"
                  style={{
                    transform: `translateX(${
                      virtualColumn.start + virtualColumn.size
                    }px)`,
                    height: rowVirtualizer.getTotalSize()
                  }}
                />
              );
            })}
        </div>
      </div>
    </>
  );
}

export default function FeatureTable() {
  const data = useAtomValue(dataAtom);
  if (data.featureMap.size === 0) {
    return <TableEmptyState />;
  }
  return <FeatureTableInner data={data} />;
}
