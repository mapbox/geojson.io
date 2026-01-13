import { ColorPopoverField } from 'app/components/color_popover';
import {
  Button,
  inputClass,
  StyledLabelSpan,
  styledCheckbox,
  TextWell
} from 'app/components/elements';
import { useAutoSubmit } from 'app/hooks/use_auto_submit';
import { purple900 } from 'app/lib/constants';
import { usePersistence } from 'app/lib/persistence/context';
import * as d3 from 'd3-color';
import { Field, Form, Formik, type FormikProps } from 'formik';
import { useSetAtom } from 'jotai';
import cloneDeep from 'lodash/cloneDeep';
import { useMemo } from 'react';
import { TabOption, tabAtom } from 'state/jotai';
import type { JsonValue } from 'type-fest';
import type { GeoJsonProperties, IWrappedFeature } from 'types';
import { z } from 'zod';

interface FormValues {
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

  const defaults = zStyles.parse(properties);

  const initialValues = {
    ...defaults,
    ...enables
  };

  return initialValues;
}

/**
 * Used to validate that a string can
 * be parsed as a color.
 */
function colorRefine(val: string) {
  const c = d3.color(val);
  return c !== null;
}

const STYLE_PROPS = [
  'fill',
  'stroke',
  'fill-opacity',
  'stroke-opacity',
  'stroke-width'
] as const;

function AutoSubmit() {
  useAutoSubmit();
  return null;
}

function ColorField({
  enableName,
  name,
  helpers
}: {
  enableName: 'enableFill' | 'enableStroke';
  name: 'fill' | 'stroke';
  helpers: FormikProps<FormValues>;
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
          className={inputClass({
            _size: 'sm'
          })}
        />
      ) : null}
    </div>
  );
}

function StyleFields({ helpers }: { helpers: FormikProps<FormValues> }) {
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
    </div>
  );
}

function LiteralStyleNotice() {
  const setTab = useSetAtom(tabAtom);
  return (
    <TextWell>
      The current map symbolization has literal styles disabled.{' '}
      <Button
        onClick={() => {
          setTab(TabOption.Symbolization);
        }}
        size="xs"
      >
        Enable literal styles
      </Button>{' '}
      for your changes to be seen on the map.
    </TextWell>
  );
}

export function FeatureEditorStyle({
  wrappedFeature
}: {
  wrappedFeature: IWrappedFeature;
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();
  const [meta] = rep.useMetadata();

  const properties = wrappedFeature.feature.properties;
  const initialValues = parseProperties(properties);

  return (
    <div className="px-4 py-2">
      <Formik<FormValues>
        onSubmit={(values) => {
          const properties: GeoJsonProperties = cloneDeep(
            wrappedFeature.feature.properties || {}
          );

          if (values.enableFill) {
            properties.fill = values.fill;
          } else {
            delete properties.fill;
          }

          if (values.enableFillOpacity) {
            properties['fill-opacity'] = values['fill-opacity'];
          } else {
            delete properties['fill-opacity'];
          }

          if (values.enableStroke) {
            properties.stroke = values.stroke;
          } else {
            delete properties.stroke;
          }

          if (values.enableStrokeOpacity) {
            properties['stroke-opacity'] = values['stroke-opacity'];
          } else {
            delete properties['stroke-opacity'];
          }

          if (values.enableStrokeWidth) {
            properties['stroke-width'] = values['stroke-width'];
          } else {
            delete properties['stroke-width'];
          }

          return transact({
            track: 'feature-update-style',
            putFeatures: [
              {
                ...wrappedFeature,
                feature: {
                  ...wrappedFeature.feature,
                  properties
                }
              }
            ]
          });
        }}
        initialValues={initialValues}
      >
        {(helpers) => {
          return (
            <Form>
              <AutoSubmit />
              <StyleFields helpers={helpers} />
              {/*<AutoReset properties={properties} />*/}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

// function AutoReset({ properties }: { properties: GeoJsonProperties }) {
//   const context = useFormikContext();
//
//   // useEffect(() => {
//   //   context.resetForm();
//   // }, [context, properties]);
//
//   return null;
// }

export function FeatureEditorStyleMulti({
  wrappedFeatures
}: {
  wrappedFeatures: IWrappedFeature[];
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();
  const [meta] = rep.useMetadata();

  const uniformValues = useMemo(() => {
    const allValues: Record<typeof STYLE_PROPS[number], Set<JsonValue>> = {
      fill: new Set(),
      stroke: new Set(),
      'fill-opacity': new Set(),
      'stroke-opacity': new Set(),
      'stroke-width': new Set()
    };

    for (const { feature } of wrappedFeatures) {
      const { properties } = feature;
      if (!properties) continue;
      for (const key of STYLE_PROPS) {
        const val = properties[key];
        allValues[key].add(val);
      }
    }

    const uniformValues = {
      fill: getString(allValues.fill),
      'fill-opacity': getNumber(allValues['fill-opacity']),
      stroke: getString(allValues.stroke),
      'stroke-opacity': getNumber(allValues['stroke-opacity']),
      'stroke-width': getNumber(allValues['stroke-width'])
    };

    return uniformValues;
  }, [wrappedFeatures]);

  const initialValues = parseProperties(uniformValues);

  return (
    <div className="px-4 py-2">
      {meta.symbolization?.simplestyle === false ? (
        <LiteralStyleNotice />
      ) : null}
      <Formik<FormValues>
        onSubmit={(values) => {
          return transact({
            track: 'feature-update-style-multi',
            putFeatures: wrappedFeatures.map((wrappedFeature) => {
              const properties: GeoJsonProperties = cloneDeep(
                wrappedFeature.feature.properties || {}
              );

              if (values.enableFill) {
                properties.fill = values.fill;
              }

              if (values.enableFillOpacity) {
                properties['fill-opacity'] = values['fill-opacity'];
              }

              if (values.enableStroke) {
                properties.stroke = values.stroke;
              }

              if (values.enableStrokeOpacity) {
                properties['stroke-opacity'] = values['stroke-opacity'];
              }

              if (values.enableStrokeWidth) {
                properties['stroke-width'] = values['stroke-width'];
              }

              return {
                ...wrappedFeature,
                feature: {
                  ...wrappedFeature.feature,
                  properties
                }
              };
            })
          });
        }}
        initialValues={initialValues}
      >
        {(helpers) => {
          return (
            <Form>
              <AutoSubmit />
              <StyleFields helpers={helpers} />
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
