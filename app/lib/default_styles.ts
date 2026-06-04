import { env } from 'app/lib/env_client';

const defaults = {
  type: 'MAPBOX',
  token: env.MAPBOX_TOKEN
} as const;

export type StyleConfigTemplate = {
  name: string;
  url?: string;
  json?: mapboxgl.Style;
  supports3dFeatures?: boolean;
};

const STYLES: Record<string, StyleConfigTemplate> = {
  LIGHT: {
    name: 'Light',
    url: 'mapbox://styles/mapbox/light-v11',
    ...defaults
  },
  DARK: {
    name: 'Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    ...defaults
  },
  STANDARD_SATELLITE: {
    name: 'Standard Satellite',
    json: {
      version: 8,
      sources: {},
      layers: [],
      imports: [
        {
          id: 'basemap',
          url: 'mapbox://styles/mapbox/standard-satellite'
        }
      ]
    },
    ...defaults
  },
  STANDARD: {
    name: 'Standard',
    json: {
      version: 8,
      sources: {},
      layers: [],
      imports: [
        {
          id: 'basemap',
          url: 'mapbox://styles/mapbox/standard'
        }
      ]
    },
    supports3dFeatures: true,
    ...defaults
  },
  OUTDOORS: {
    name: 'Outdoors',
    url: 'mapbox://styles/mapbox/outdoors-v11',
    ...defaults
  },
  OSM: {
    name: 'OSM',
    json: {
      version: 8,
      // sprite and glyphs are unused, but required to prevent an error when switching to this style
      sprite: 'mapbox://sprites/mapbox/streets-v8',
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution:
            '© OpenStreetMap contributors, CC-BY-SA. Tiles courtesy of OpenStreetMap France'
        }
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
    ...defaults
  }
};

export default STYLES;
