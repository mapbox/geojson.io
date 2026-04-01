import { ColorPopoverField } from 'app/components/color_popover';
import {
  Button,
  inputClass,
  PopoverContent2,
  StyledLabelSpan,
  styledCheckbox,
  TextWell
} from 'app/components/elements';
import { useAutoSubmit } from 'app/hooks/use_auto_submit';
import { purple900 } from 'app/lib/constants';
import { MAKI_ICONS } from 'app/lib/maki';
import { usePersistence } from 'app/lib/persistence/context';
import * as d3 from 'd3-color';
import { Field, Form, Formik, type FormikProps } from 'formik';
import { useSetAtom } from 'jotai';
import cloneDeep from 'lodash/cloneDeep';
import { useMemo, useState } from 'react';
import { Popover as P } from 'radix-ui';
import { TabOption, tabAtom } from 'state/jotai';
import type { JsonValue } from 'type-fest';
import type { GeoJsonProperties, IWrappedFeature } from 'types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type MarkerSize = 'small' | 'medium' | 'large';

interface StrokeFillFormValues {
  enableFill: boolean;
  fill: string;
  enableFillOpacity: boolean;
  'fill-opacity': number;
  enableStroke: boolean;
  stroke: string;
  enableStrokeOpacity: boolean;
  'stroke-opacity': number;
  enableStrokeWidth: boolean;
  'stroke-width': number;
}

interface MarkerFormValues {
  enableMarkerColor: boolean;
  'marker-color': string;
  'marker-size': MarkerSize;
  enableMarkerSymbol: boolean;
  'marker-symbol': string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getString(set: Set<JsonValue>): string | undefined {
  if (set.size === 1) {
    const val = [...set][0];
    if (typeof val === 'string') return val;
  }
}

function getNumber(set: Set<JsonValue>): number | undefined {
  if (set.size === 1) {
    const val = [...set][0];
    if (typeof val === 'number') return val;
  }
}

function colorRefine(val: string) {
  return d3.color(val) !== null;
}

function AutoSubmit() {
  useAutoSubmit();
  return null;
}

function LiteralStyleNotice() {
  const setTab = useSetAtom(tabAtom);
  return (
    <TextWell>
      The current map symbolization has literal styles disabled.{' '}
      <Button onClick={() => setTab(TabOption.Symbolization)} size="xs">
        Enable literal styles
      </Button>{' '}
      for your changes to be seen on the map.
    </TextWell>
  );
}

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

export function parseProperties(properties: GeoJsonProperties) {
  const enables = {
    enableFill: true,
    enableStroke: true,
    enableFillOpacity: true,
    enableStrokeWidth: true,
    enableStrokeOpacity: true
  };

  const zStyles = z.object({
    fill: z
      .string()
      .refine(colorRefine)
      .catch(() => {
        enables.enableFill = false;
        return purple900;
      }),
    stroke: z
      .string()
      .refine(colorRefine)
      .catch(() => {
        enables.enableStroke = false;
        return purple900;
      }),
    'fill-opacity': z.number().catch(() => {
      enables.enableFillOpacity = false;
      return 0.3;
    }),
    'stroke-width': z.number().catch(() => {
      enables.enableStrokeWidth = false;
      return 1;
    }),
    'stroke-opacity': z.number().catch(() => {
      enables.enableStrokeOpacity = false;
      return 1;
    })
  });

  return { ...zStyles.parse(properties), ...enables };
}

function parseMarkerProperties(
  properties: GeoJsonProperties
): MarkerFormValues {
  const raw = properties || {};
  const colorRaw = raw['marker-color'];
  const hasColor = typeof colorRaw === 'string' && d3.color(colorRaw) !== null;

  const symbolRaw = raw['marker-symbol'];
  const hasSymbol = typeof symbolRaw === 'string' && symbolRaw.length > 0;

  const sizeRaw = raw['marker-size'];
  const size: MarkerSize =
    sizeRaw === 'small' || sizeRaw === 'large' ? sizeRaw : 'medium';

  return {
    enableMarkerColor: hasColor,
    'marker-color': hasColor ? String(colorRaw) : purple900,
    'marker-size': size,
    enableMarkerSymbol: hasSymbol,
    'marker-symbol': hasSymbol ? String(symbolRaw) : ''
  };
}

// ---------------------------------------------------------------------------
// Maki icon picker
// ---------------------------------------------------------------------------

type PickerItem =
  | { kind: 'char'; name: string }
  | { kind: 'icon'; name: string; dataUri: string };

// 0-9 then a-z, followed by all maki icons.
const CHAR_ITEMS: PickerItem[] = [
  ...'0123456789abcdefghijklmnopqrstuvwxyz'
    .split('')
    .map((ch): PickerItem => ({ kind: 'char', name: ch }))
];

const ALL_PICKER_ITEMS: PickerItem[] = [
  ...CHAR_ITEMS,
  ...MAKI_ICONS.map(
    ({ name, dataUri }): PickerItem => ({ kind: 'icon', name, dataUri })
  )
];

function PickerItemButton({
  item,
  selected,
  onSelect,
  onHover
}: {
  item: PickerItem;
  selected: boolean;
  onSelect: (name: string) => void;
  onHover: (name: string | null) => void;
}) {
  const base = `w-7 h-7 flex items-center justify-center rounded border transition-colors`;
  const active = 'bg-blue-500 border-blue-600 text-white';
  const inactive =
    'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <button
      type="button"
      title={item.name}
      onClick={() => onSelect(item.name)}
      onMouseEnter={() => onHover(item.name)}
      onMouseLeave={() => onHover(null)}
      className={`${base} ${selected ? active : inactive}`}
    >
      {item.kind === 'char' ? (
        <span className="font-bold text-xs leading-none">
          {item.name.toUpperCase()}
        </span>
      ) : (
        <img
          src={item.dataUri}
          alt={item.name}
          className={`w-4 h-4 ${selected ? 'invert' : 'dark:invert'}`}
        />
      )}
    </button>
  );
}

function MakiIconPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return ALL_PICKER_ITEMS;
    const q = search.toLowerCase();
    return ALL_PICKER_ITEMS.filter((item) => item.name.includes(q));
  }, [search]);

  const selectedItem = ALL_PICKER_ITEMS.find((i) => i.name === value) ?? null;

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
    setSearch('');
  }

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger asChild>
        <button
          type="button"
          className={
            inputClass({ _size: 'sm' }) +
            ' flex items-center gap-x-2 w-full text-left'
          }
        >
          {selectedItem ? (
            <>
              {selectedItem.kind === 'char' ? (
                <span className="w-4 h-4 flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedItem.name.toUpperCase()}
                </span>
              ) : (
                <img
                  src={selectedItem.dataUri}
                  alt={selectedItem.name}
                  className="w-4 h-4 shrink-0 dark:invert"
                />
              )}
              <span className="font-mono text-xs truncate">
                {selectedItem.name}
              </span>
            </>
          ) : (
            <span className="text-gray-400 text-xs">None</span>
          )}
        </button>
      </P.Trigger>

      <PopoverContent2 size="md">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search icons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass({ _size: 'sm' }) + ' w-full'}
            autoFocus
          />

          <div
            className="grid overflow-y-auto"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))',
              maxHeight: 220,
              gap: 2
            }}
          >
            {filtered.map((item) => (
              <PickerItemButton
                key={item.name}
                item={item}
                selected={item.name === value}
                onSelect={handleSelect}
                onHover={setHovered}
              />
            ))}
          </div>

          {/* Hover label */}
          <div className="h-4 text-xs text-gray-500 font-mono truncate">
            {hovered ?? '\u00a0'}
          </div>
        </div>
      </PopoverContent2>
    </P.Root>
  );
}

// ---------------------------------------------------------------------------
// Point marker fields
// ---------------------------------------------------------------------------

function MarkerFields({ helpers }: { helpers: FormikProps<MarkerFormValues> }) {
  return (
    <div className="grid grid-cols-2 gap-y-1 gap-x-2 items-center">
      {/* Marker color */}
      <div className="py-1 whitespace-nowrap">
        <StyledLabelSpan size="xs">Marker color</StyledLabelSpan>
      </div>
      <div className="flex items-center gap-x-2">
        <Field
          type="checkbox"
          name="enableMarkerColor"
          className={styledCheckbox({ variant: 'default' })}
        />
        {helpers.values.enableMarkerColor ? (
          <Field
            component={ColorPopoverField}
            name="marker-color"
            _size="sm"
            className={inputClass({ _size: 'sm' })}
          />
        ) : null}
      </div>

      {/* Marker size */}
      <div className="py-1 whitespace-nowrap">
        <StyledLabelSpan size="xs">Marker size</StyledLabelSpan>
      </div>
      <div>
        <Field
          as="select"
          name="marker-size"
          className={inputClass({ _size: 'sm' }) + ' w-full'}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </Field>
      </div>

      {/* Marker icon */}
      <div className="py-1 whitespace-nowrap">
        <StyledLabelSpan size="xs">Marker symbol</StyledLabelSpan>
      </div>
      <div className="flex items-center gap-x-2">
        <Field
          type="checkbox"
          name="enableMarkerSymbol"
          className={styledCheckbox({ variant: 'default' })}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            helpers.setFieldValue('enableMarkerSymbol', e.target.checked);
            if (!e.target.checked) {
              helpers.setFieldValue('marker-symbol', '');
            }
          }}
        />
        {helpers.values.enableMarkerSymbol ? (
          <div className="flex-1 min-w-0">
            <MakiIconPicker
              value={helpers.values['marker-symbol']}
              onChange={(name) => {
                helpers.setFieldValue('marker-symbol', name);
                helpers.submitForm();
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stroke/fill fields
// ---------------------------------------------------------------------------

function ColorField({
  enableName,
  name,
  helpers
}: {
  enableName: 'enableFill' | 'enableStroke';
  name: 'fill' | 'stroke';
  helpers: FormikProps<StrokeFillFormValues>;
}) {
  return (
    <div className="flex items-center gap-x-2">
      <Field
        type="checkbox"
        name={enableName}
        className={styledCheckbox({ variant: 'default' })}
      />
      {helpers.values[enableName] ? (
        <Field
          component={ColorPopoverField}
          name={name}
          _size="sm"
          className={inputClass({ _size: 'sm' })}
        />
      ) : null}
    </div>
  );
}

function StrokeFields({
  helpers
}: {
  helpers: FormikProps<StrokeFillFormValues>;
}) {
  return (
    <>
      <div className="py-1">
        <StyledLabelSpan size="xs">Stroke</StyledLabelSpan>
      </div>
      <ColorField name="stroke" enableName="enableStroke" helpers={helpers} />
      <div className="py-1 whitespace-nowrap">
        <StyledLabelSpan size="xs">Stroke opacity</StyledLabelSpan>
      </div>
      <div className="flex items-center gap-x-2">
        <Field
          type="checkbox"
          name="enableStrokeOpacity"
          className={styledCheckbox({ variant: 'default' })}
        />
        {helpers.values.enableStrokeOpacity ? (
          <Field
            type="number"
            name="stroke-opacity"
            step="0.1"
            min="0"
            max="1"
            className={inputClass({ _size: 'sm' })}
          />
        ) : null}
      </div>
      <div className="py-1 whitespace-nowrap">
        <StyledLabelSpan size="xs">Stroke width</StyledLabelSpan>
      </div>
      <div className="flex items-center gap-x-2">
        <Field
          type="checkbox"
          name="enableStrokeWidth"
          className={styledCheckbox({ variant: 'default' })}
        />
        {helpers.values.enableStrokeWidth ? (
          <Field
            type="number"
            name="stroke-width"
            className={inputClass({ _size: 'sm' })}
          />
        ) : null}
      </div>
    </>
  );
}

function AllStyleFields({
  helpers
}: {
  helpers: FormikProps<StrokeFillFormValues>;
}) {
  return (
    <div className="grid grid-cols-2 gap-y-1 gap-x-2 items-center">
      <div className="py-1">
        <StyledLabelSpan size="xs">Fill</StyledLabelSpan>
      </div>
      <ColorField name="fill" enableName="enableFill" helpers={helpers} />
      <div className="py-1 whitespace-nowrap">
        <StyledLabelSpan size="xs">Fill opacity</StyledLabelSpan>
      </div>
      <div className="flex items-center gap-x-2">
        <Field
          type="checkbox"
          name="enableFillOpacity"
          className={styledCheckbox({ variant: 'default' })}
        />
        {helpers.values.enableFillOpacity ? (
          <Field
            type="number"
            name="fill-opacity"
            step="0.1"
            min="0"
            max="1"
            className={inputClass({ _size: 'sm' })}
          />
        ) : null}
      </div>
      <StrokeFields helpers={helpers} />
    </div>
  );
}

function LineStyleFields({
  helpers
}: {
  helpers: FormikProps<StrokeFillFormValues>;
}) {
  return (
    <div className="grid grid-cols-2 gap-y-1 gap-x-2 items-center">
      <StrokeFields helpers={helpers} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stroke/fill form submit helper
// ---------------------------------------------------------------------------

function buildStrokeFillProps(
  base: GeoJsonProperties,
  values: StrokeFillFormValues,
  includesFill: boolean
): GeoJsonProperties {
  const props = cloneDeep(base || {}) as Record<string, unknown>;

  if (includesFill) {
    if (values.enableFill) {
      props.fill = values.fill;
    } else {
      delete props.fill;
    }
    if (values.enableFillOpacity) {
      props['fill-opacity'] = values['fill-opacity'];
    } else {
      delete props['fill-opacity'];
    }
  }

  if (values.enableStroke) {
    props.stroke = values.stroke;
  } else {
    delete props.stroke;
  }
  if (values.enableStrokeOpacity) {
    props['stroke-opacity'] = values['stroke-opacity'];
  } else {
    delete props['stroke-opacity'];
  }
  if (values.enableStrokeWidth) {
    props['stroke-width'] = values['stroke-width'];
  } else {
    delete props['stroke-width'];
  }

  return props;
}

// ---------------------------------------------------------------------------
// FeatureEditorStyle — single feature
// ---------------------------------------------------------------------------

export function FeatureEditorStyle({
  wrappedFeature
}: {
  wrappedFeature: IWrappedFeature;
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();

  const properties = wrappedFeature.feature.properties;
  const geometryType = wrappedFeature.feature.geometry?.type;

  const isPoint = geometryType === 'Point' || geometryType === 'MultiPoint';
  // Polygons get fill + stroke; lines and everything else get stroke only
  const isPolygon =
    geometryType === 'Polygon' || geometryType === 'MultiPolygon';

  // ---- Point ----------------------------------------------------------------
  if (isPoint) {
    const initialValues = parseMarkerProperties(properties);

    return (
      <div className="px-4 py-2">
        <Formik<MarkerFormValues>
          onSubmit={(values) => {
            const props = cloneDeep(properties || {}) as GeoJsonProperties;

            if (values.enableMarkerColor) {
              props!['marker-color'] = values['marker-color'];
            } else {
              delete props!['marker-color'];
            }

            props!['marker-size'] = values['marker-size'];

            if (values.enableMarkerSymbol && values['marker-symbol']) {
              props!['marker-symbol'] = values['marker-symbol'];
            } else {
              delete props!['marker-symbol'];
            }

            return transact({
              track: 'feature-update-style',
              putFeatures: [
                {
                  ...wrappedFeature,
                  feature: { ...wrappedFeature.feature, properties: props }
                }
              ]
            });
          }}
          initialValues={initialValues}
        >
          {(helpers) => (
            <Form>
              <AutoSubmit />
              <MarkerFields helpers={helpers} />
            </Form>
          )}
        </Formik>
      </div>
    );
  }

  // ---- Line / Polygon -------------------------------------------------------
  const initialValues = parseProperties(properties);
  const includesFill = isPolygon;

  return (
    <div className="px-4 py-2">
      <Formik<StrokeFillFormValues>
        onSubmit={(values) => {
          const props = buildStrokeFillProps(properties, values, includesFill);
          return transact({
            track: 'feature-update-style',
            putFeatures: [
              {
                ...wrappedFeature,
                feature: { ...wrappedFeature.feature, properties: props }
              }
            ]
          });
        }}
        initialValues={initialValues}
      >
        {(helpers) => (
          <Form>
            <AutoSubmit />
            {isPolygon ? (
              <AllStyleFields helpers={helpers} />
            ) : (
              <LineStyleFields helpers={helpers} />
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatureEditorStyleMulti — multiple features selected
// ---------------------------------------------------------------------------

const STROKE_FILL_PROPS = [
  'fill',
  'stroke',
  'fill-opacity',
  'stroke-opacity',
  'stroke-width'
] as const;

export function FeatureEditorStyleMulti({
  wrappedFeatures
}: {
  wrappedFeatures: IWrappedFeature[];
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();
  const [meta] = rep.useMetadata();

  const uniformValues = useMemo(() => {
    const allValues: Record<
      (typeof STROKE_FILL_PROPS)[number],
      Set<JsonValue>
    > = {
      fill: new Set(),
      stroke: new Set(),
      'fill-opacity': new Set(),
      'stroke-opacity': new Set(),
      'stroke-width': new Set()
    };

    for (const { feature } of wrappedFeatures) {
      const { properties } = feature;
      if (!properties) continue;
      for (const key of STROKE_FILL_PROPS) {
        allValues[key].add(properties[key]);
      }
    }

    return {
      fill: getString(allValues.fill),
      'fill-opacity': getNumber(allValues['fill-opacity']),
      stroke: getString(allValues.stroke),
      'stroke-opacity': getNumber(allValues['stroke-opacity']),
      'stroke-width': getNumber(allValues['stroke-width'])
    };
  }, [wrappedFeatures]);

  const initialValues = parseProperties(uniformValues);

  return (
    <div className="px-4 py-2">
      {meta.symbolization?.simplestyle === false ? (
        <LiteralStyleNotice />
      ) : null}
      <Formik<StrokeFillFormValues>
        onSubmit={(values) => {
          return transact({
            track: 'feature-update-style-multi',
            putFeatures: wrappedFeatures.map((wrappedFeature) => {
              const props = buildStrokeFillProps(
                wrappedFeature.feature.properties,
                values,
                true
              );
              return {
                ...wrappedFeature,
                feature: { ...wrappedFeature.feature, properties: props }
              };
            })
          });
        }}
        initialValues={initialValues}
      >
        {(helpers) => (
          <Form>
            <AutoSubmit />
            <AllStyleFields helpers={helpers} />
          </Form>
        )}
      </Formik>
    </div>
  );
}
