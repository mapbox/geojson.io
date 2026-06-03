import { getMapboxLayerURL } from 'app/lib/utils';
import STANDARD_FOG from 'app/lib/standard_fog';
import once from 'lodash/once';
import mapboxgl from 'mapbox-gl';
import { toast } from 'react-hot-toast';
import type { IStyleConfig, StyleOptions } from 'types';
import type { CustomRasterLayer } from 'state/jotai';

const warnOffline = once(() => {
  toast.error('Offline: falling back to blank background');
});

export async function addMapboxStyle(
  _base: mapboxgl.Style,
  layer: IStyleConfig,
  styleOptions: StyleOptions,
  customRasterLayers: CustomRasterLayer[] = []
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
    labelVisibility: styleOptions.labelVisibility,
    show3dFeatures: styleOptions.show3dFeatures,
    customRasterLayers
  });
  return updatedStyle;
}

function updateMapboxStyle(
  style: mapboxgl.Style,
  options: {
    labelVisibility?: boolean;
    show3dFeatures?: boolean;
    rasterOpacity?: number;
    customRasterLayers?: CustomRasterLayer[];
  }
): mapboxgl.Style {
  const {
    labelVisibility = true,
    show3dFeatures = true,
    rasterOpacity,
    customRasterLayers = []
  } = options;

  if (!style.layers) {
    return style;
  }

  // Add custom raster sources
  const updatedSources = { ...style.sources };
  // Only include visible layers
  const visibleCustomRasterLayers = customRasterLayers.filter(
    (layer) => layer.visible !== false
  );
  visibleCustomRasterLayers.forEach((layer) => {
    const isTms = layer.tileUrl.includes('{-y}');
    const tiles = [
      isTms ? layer.tileUrl.replace('{-y}', '{y}') : layer.tileUrl
    ];
    updatedSources[`custom-raster-${layer.id}`] = {
      type: 'raster',
      tiles,
      tileSize: 256,
      ...(isTms ? { scheme: 'tms' } : {})
    } as mapboxgl.RasterSource;
  });

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

  // Reverse the order so layers at the top of the UI list render on top on the map
  const customRasterMapboxLayers: mapboxgl.AnyLayer[] =
    visibleCustomRasterLayers
      .slice()
      .reverse()
      .map((layer) => ({
        id: `custom-raster-layer-${layer.id}`,
        type: 'raster',
        source: `custom-raster-${layer.id}`,
        minzoom: 0,
        maxzoom: 22,
        paint: {
          'raster-emissive-strength': 1
        }
      }));

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
            showPointOfInterestLabels: labelVisibility,
            show3dOptions: show3dFeatures,
            show3dBuildings: show3dFeatures,
            show3dTrees: show3dFeatures,
            show3dLandmarks: show3dFeatures,
            show3dFacades: show3dFeatures
          }
        };
      }
      return imp;
    });
  }

  // For import-based styles (Standard variants), layers in the parent style render
  // above the imported basemap, so custom rasters go at the start of layers.
  // For traditional styles (Outdoors, OSM), basemap layers are in the layers array
  // directly, so custom rasters must go at the end to appear on top of the basemap.
  const layers = style.imports
    ? [...customRasterMapboxLayers, ...updatedLayers]
    : [...updatedLayers, ...customRasterMapboxLayers];

  const result: any = {
    ...style,
    sources: updatedSources,
    layers
  };
  if (typeof updatedImports !== 'undefined') {
    result.imports = updatedImports;
  }
  // Apply Standard fog to non-import styles (OSM, Outdoors) so they get
  // stars and atmospheric haze when in globe projection.
  if (!style.imports) {
    result.fog = STANDARD_FOG;
  }
  return result;
}
