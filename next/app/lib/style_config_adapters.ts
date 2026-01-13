import { getMapboxLayerURL } from 'app/lib/utils';
import once from 'lodash/once';
import mapboxgl from 'mapbox-gl';
import { toast } from 'react-hot-toast';
import type { IStyleConfig, StyleOptions } from 'types';

const warnOffline = once(() => {
  toast.error('Offline: falling back to blank background');
});

export async function addMapboxStyle(
  _base: mapboxgl.Style,
  layer: IStyleConfig,
  styleOptions: StyleOptions
): Promise<mapboxgl.Style> {
  let style: mapboxgl.Style;

  if ('json' in layer && layer.json) {
    style = layer.json;
  } else if ('url' in layer && layer.url) {
    const url = getMapboxLayerURL(layer);
    style = await fetch(url)
      .then((res) => {
        if (!res?.ok) {
          throw new Error('Could not fetch layer');
        }
        return res.json();
      })
      .catch(() => {
        warnOffline();
        return {
          version: 8,
          name: 'Empty',
          sprite: 'mapbox://sprites/mapbox/streets-v8',
          glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
          sources: {},
          layers: []
        };
      });
  } else {
    throw new Error('Layer must have either a json or url property');
  }

  const updatedStyle = updateMapboxStyle(style, {
    labelVisibility: styleOptions.labelVisibility
  });
  return updatedStyle;
}

function updateMapboxStyle(
  style: mapboxgl.Style,
  options: {
    labelVisibility?: boolean;
    rasterOpacity?: number;
  }
): mapboxgl.Style {
  const { labelVisibility = true, rasterOpacity } = options;

  if (!style.layers) {
    return style;
  }

  const isSatelliteStyle =
    style.name === 'Mapbox Satellite Streets' ||
    style.name === 'Mapbox Satellite';

  const updatedLayers = style.layers
    .map((layer) => {
      // Identify label layers
      const isLabelLayer =
        layer.type === 'symbol' && layer.layout?.['text-field'] !== undefined;

      if (!labelVisibility && isLabelLayer) {
        return null;
      }

      if (
        isSatelliteStyle &&
        layer.type === 'raster' &&
        rasterOpacity !== undefined
      ) {
        return {
          ...layer,
          paint: {
            ...(layer.paint || {}),
            'raster-opacity': rasterOpacity
          }
        };
      }

      if (isSatelliteStyle && layer.type === 'background' && layer.paint) {
        return {
          ...layer,
          paint: {
            ...layer.paint,
            'background-color': '#ffffff'
          }
        };
      }

      return layer;
    })
    .filter(Boolean) as mapboxgl.AnyLayer[];

  let updatedImports = style.imports;
  // update imports for styles that use Mapbox standard or standard satellite style
  if (style.imports) {
    updatedImports = style.imports.map((imp) => {
      if (imp.id === 'basemap') {
        return {
          ...imp,
          config: {
            ...imp.config,
            showRoadLabels: labelVisibility,
            showPlaceLabels: labelVisibility,
            showTransitLabels: labelVisibility,
            showPointOfInterestLabels: labelVisibility
          }
        };
      }
      return imp;
    });
  }

  const result: any = {
    ...style,
    layers: updatedLayers
  };
  if (typeof updatedImports !== 'undefined') {
    result.imports = updatedImports;
  }
  return result;
}
