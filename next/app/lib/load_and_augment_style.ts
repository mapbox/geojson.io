import {
  emptyFeatureCollection,
  LINE_COLORS_SELECTED
} from 'app/lib/constants';
import { addMapboxStyle } from 'app/lib/style_config_adapters';
// TODO: this is a UI concern that should be separate.
import type { Style } from 'mapbox-gl';
import type { PreviewProperty } from 'state/jotai';
import type { ISymbolization, IStyleConfig, StyleOptions } from 'types';

function getEmptyStyle() {
  const style: mapboxgl.Style = {
    version: 8,
    name: 'XYZ Layer',
    sprite: 'mapbox://sprites/mapbox/streets-v8',
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    sources: {},
    layers: []
  };
  return style;
}

const CIRCLE_LAYOUT: mapboxgl.CircleLayout = {};

export const FEATURES_SOURCE_NAME = 'features';
export const EPHEMERAL_SOURCE_NAME = 'ephemeral';

const EPHEMERAL_LINE_LAYER_NAME = 'ephemeral-line';
const EPHEMERAL_FILL_LAYER_NAME = 'ephemeral-fill';

const FEATURES_POINT_HALO_LAYER_NAME = 'features-symbol-halo';
const FEATURES_POINT_LAYER_NAME = 'features-symbol';
const FEATURES_POINT_LABEL_LAYER_NAME = 'features-point-label';
const FEATURES_FILL_LABEL_LAYER_NAME = 'features-fill-label';
const FEATURES_LINE_LABEL_LAYER_NAME = 'features-line-label';
const FEATURES_LINE_LAYER_NAME = 'features-line';
const FEATURES_FILL_LAYER_NAME = 'features-fill';

const emptyGeoJSONSource = {
  type: 'geojson',
  data: emptyFeatureCollection,
  /**
   * Higher values are worse for performance,
   * lower values will cause rendering artifacts.
   * See https://github.com/placemark/placemark/pull/92
   */
  buffer: 4,
  tolerance: 0
} as const;

const CONTENT_LAYER_FILTERS: {
  [key: string]: mapboxgl.Layer['filter'];
} = {
  [FEATURES_LINE_LAYER_NAME]: [
    'any',
    ['==', '$type', 'LineString'],
    ['==', '$type', 'Polygon']
  ],
  [FEATURES_FILL_LAYER_NAME]: ['==', '$type', 'Polygon'],
  [FEATURES_POINT_LAYER_NAME]: ['all', ['==', '$type', 'Point']]
};

function addPreviewFilter(
  filters: mapboxgl.Layer['filter'],
  previewProperty: PreviewProperty
): mapboxgl.Layer['filter'] {
  if (!previewProperty) return filters;
  return ['all', filters, ['has', previewProperty]];
}

export default async function loadAndAugmentStyle({
  styleConfig,
  symbolization,
  previewProperty,
  styleOptions
}: {
  styleConfig: IStyleConfig;
  symbolization: ISymbolization;
  previewProperty: PreviewProperty;
  styleOptions: StyleOptions;
}): Promise<Style> {
  let style = getEmptyStyle();
  style = await addMapboxStyle(style, styleConfig, styleOptions);
  addEditingLayers({ style, symbolization, previewProperty });
  return style;
}

export function addEditingLayers({
  style,
  symbolization,
  previewProperty
}: {
  style: Style;
  symbolization: ISymbolization;
  previewProperty: PreviewProperty;
}) {
  style.sources[FEATURES_SOURCE_NAME] = emptyGeoJSONSource;
  style.sources[EPHEMERAL_SOURCE_NAME] = emptyGeoJSONSource;

  if (!style.layers) {
    throw new Error('Style unexpectedly had no layers');
  }

  style.layers = style.layers.concat(
    makeLayers({ symbolization, previewProperty })
  );
}

export function makeLayers({
  symbolization,
  previewProperty
}: {
  symbolization: ISymbolization;
  previewProperty: PreviewProperty;
}): mapboxgl.AnyLayer[] {
  return [
    // Real polygons, from the dataset.
    {
      id: FEATURES_FILL_LAYER_NAME,
      type: 'fill',
      source: FEATURES_SOURCE_NAME,
      filter: CONTENT_LAYER_FILTERS[FEATURES_FILL_LAYER_NAME],
      paint: FILL_PAINT(symbolization)
    },

    // Real lines, from the dataset.
    {
      id: FEATURES_LINE_LAYER_NAME,
      type: 'line',
      source: FEATURES_SOURCE_NAME,
      filter: CONTENT_LAYER_FILTERS[FEATURES_LINE_LAYER_NAME],
      paint: LINE_PAINT(symbolization)
    },

    {
      id: EPHEMERAL_FILL_LAYER_NAME,
      type: 'fill',
      source: EPHEMERAL_SOURCE_NAME,
      filter: ['==', '$type', 'Polygon'],
      paint: FILL_PAINT(symbolization)
    },

    // Real lines, from the dataset.
    {
      id: EPHEMERAL_LINE_LAYER_NAME,
      type: 'line',
      source: EPHEMERAL_SOURCE_NAME,
      filter: [
        'any',
        ['==', '$type', 'LineString'],
        ['==', '$type', 'Polygon']
      ],
      paint: LINE_PAINT(symbolization)
    },

    // Real points, from the dataset.
    {
      id: FEATURES_POINT_HALO_LAYER_NAME,
      type: 'circle',
      source: FEATURES_SOURCE_NAME,
      layout: CIRCLE_LAYOUT,
      filter: CONTENT_LAYER_FILTERS[FEATURES_POINT_LAYER_NAME],
      paint: CIRCLE_PAINT(symbolization, true)
    },

    // Real points, from the dataset.
    {
      id: FEATURES_POINT_LAYER_NAME,
      type: 'circle',
      source: FEATURES_SOURCE_NAME,
      layout: CIRCLE_LAYOUT,
      filter: CONTENT_LAYER_FILTERS[FEATURES_POINT_LAYER_NAME],
      paint: CIRCLE_PAINT(symbolization)
    },

    ...(typeof previewProperty === 'string'
      ? [
          {
            id: FEATURES_POINT_LABEL_LAYER_NAME,
            type: 'symbol',
            source: FEATURES_SOURCE_NAME,
            paint: LABEL_PAINT(symbolization, previewProperty),
            layout: LABEL_LAYOUT(previewProperty, 'point'),
            filter: addPreviewFilter(
              CONTENT_LAYER_FILTERS[FEATURES_POINT_LAYER_NAME],
              previewProperty
            )
          } as mapboxgl.AnyLayer,
          {
            id: FEATURES_LINE_LABEL_LAYER_NAME,
            type: 'symbol',
            source: FEATURES_SOURCE_NAME,
            paint: LABEL_PAINT(symbolization, previewProperty),
            layout: LABEL_LAYOUT(previewProperty, 'line'),
            filter: addPreviewFilter(
              CONTENT_LAYER_FILTERS[FEATURES_LINE_LAYER_NAME],
              previewProperty
            )
          } as mapboxgl.AnyLayer,
          {
            id: FEATURES_FILL_LABEL_LAYER_NAME,
            type: 'symbol',
            source: FEATURES_SOURCE_NAME,
            paint: LABEL_PAINT(symbolization, previewProperty),
            layout: LABEL_LAYOUT(previewProperty, 'point'),
            filter: addPreviewFilter(
              CONTENT_LAYER_FILTERS[FEATURES_FILL_LAYER_NAME],
              previewProperty
            )
          } as mapboxgl.AnyLayer
        ]
      : [])
  ];
}

function asNumberExpression({
  symbolization,
  defaultValue = 2,
  part
}: {
  symbolization: ISymbolization;
  defaultValue?: number;
  part: 'stroke-width' | 'fill-opacity' | 'stroke-opacity';
}): mapboxgl.Expression | number {
  if (symbolization.simplestyle) {
    return ['coalesce', ['get', part], defaultValue];
  }
  return defaultValue;
}

export function asColorExpression({
  symbolization,
  part = 'fill'
}: {
  symbolization: ISymbolization;
  part?: 'fill' | 'stroke';
}): mapboxgl.Expression | string {
  const expression = asColorExpressionInner({ symbolization });
  if (symbolization.simplestyle) {
    return ['coalesce', ['get', part], expression];
  }
  return expression;
}

function asColorExpressionInner({
  symbolization
}: {
  symbolization: ISymbolization;
}): mapboxgl.Expression | string {
  const { defaultColor } = symbolization;
  switch (symbolization.type) {
    case 'none': {
      return defaultColor;
    }
    case 'categorical': {
      return [
        'match',
        ['get', symbolization.property],
        ...symbolization.stops.flatMap((stop) => [stop.input, stop.output]),
        defaultColor
      ];
    }
    case 'ramp': {
      return [
        'match',
        ['typeof', ['get', symbolization.property]],
        'number',
        symbolization.interpolate === 'linear'
          ? [
              'interpolate-lab',
              ['linear'],
              ['get', symbolization.property],
              ...symbolization.stops.flatMap((stop) => {
                return [stop.input, stop.output];
              })
            ]
          : [
              'step',
              ['get', symbolization.property],
              defaultColor,
              ...symbolization.stops.flatMap((stop) => {
                return [stop.input, stop.output];
              })
            ],
        defaultColor
      ];
    }
  }
}

function LABEL_PAINT(
  _symbolization: ISymbolization,
  _previewProperty: PreviewProperty
): mapboxgl.SymbolPaint {
  const paint: mapboxgl.SymbolPaint = {
    'text-halo-color': '#fff',
    'text-halo-width': 1,
    'text-halo-blur': 0.8
  };
  return paint;
}

function LABEL_LAYOUT(
  previewProperty: PreviewProperty,
  placement: NonNullable<mapboxgl.SymbolLayout>['symbol-placement']
): mapboxgl.SymbolLayout {
  const paint: mapboxgl.SymbolLayout = {
    'text-field': ['get', previewProperty],
    'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
    'text-radial-offset': 0.5,
    'symbol-placement': placement,
    'icon-optional': true,
    'text-size': 13,
    'text-justify': 'auto'
  };
  return paint;
}

export function CIRCLE_PAINT(
  symbolization: ISymbolization,
  halo = false
): mapboxgl.CirclePaint {
  const r = halo ? 2 : 0;
  if (halo) {
    return {
      'circle-color': [
        'match',
        ['feature-state', 'state'],
        'selected',
        'white',
        asColorExpression({
          symbolization,
          part: 'stroke'
        })
      ],
      'circle-radius': [
        'match',
        ['feature-state', 'state'],
        'selected',
        6 + r,
        4 + r
      ],
      'circle-emissive-strength': 1
    };
  }
  return {
    'circle-stroke-color': [
      'match',
      ['feature-state', 'state'],
      'selected',
      LINE_COLORS_SELECTED,
      'white'
    ],
    'circle-stroke-width': 1,
    'circle-radius': ['match', ['feature-state', 'state'], 'selected', 6, 4],
    'circle-opacity': 1,
    'circle-color': [
      'match',
      ['feature-state', 'state'],
      'selected',
      'white',
      asColorExpression({
        symbolization,
        part: 'stroke'
      })
    ],
    'circle-emissive-strength': 1
  };
}

/**
 * Optionally add a feature-state expression to emphasize this when
 * selected.
 *
 * @param exp: Whether this is exporting, which case omit the selected
 * expression.
 */
function handleSelected(
  expression: mapboxgl.Expression | string,
  exp = false,
  selected: mapboxgl.Expression | string
) {
  return exp
    ? expression
    : ([
        'match',
        ['feature-state', 'state'],
        'selected',
        selected,
        expression
      ] as mapboxgl.Expression);
}

export function FILL_PAINT(
  symbolization: ISymbolization,
  exp = false
): mapboxgl.FillPaint {
  return {
    'fill-opacity': asNumberExpression({
      symbolization,
      part: 'fill-opacity',
      defaultValue:
        typeof symbolization.defaultOpacity === 'number'
          ? symbolization.defaultOpacity
          : 0.3
    }),
    'fill-color': handleSelected(
      asColorExpression({ symbolization, part: 'fill' }),
      exp,
      LINE_COLORS_SELECTED
    ),
    'fill-emissive-strength': 1
  };
}

export function LINE_PAINT(
  symbolization: ISymbolization,
  exp = false
): mapboxgl.LinePaint {
  return {
    'line-opacity': asNumberExpression({
      symbolization,
      part: 'stroke-opacity',
      defaultValue: 1
    }),
    'line-width': asNumberExpression({
      symbolization,
      part: 'stroke-width',
      defaultValue: 2
    }),
    'line-color': handleSelected(
      asColorExpression({ symbolization, part: 'stroke' }),
      exp,
      LINE_COLORS_SELECTED
    ),
    'line-emissive-strength': 1
  };
}

const CONTENT_LAYERS = [
  FEATURES_POINT_LAYER_NAME,
  FEATURES_FILL_LAYER_NAME,
  FEATURES_LINE_LAYER_NAME
];

export const CLICKABLE_LAYERS = CONTENT_LAYERS.concat([
  EPHEMERAL_FILL_LAYER_NAME
]);
