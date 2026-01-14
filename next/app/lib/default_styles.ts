import { env } from 'app/lib/env_client';

const defaults = {
  type: 'MAPBOX',
  token: env.MAPBOX_TOKEN
} as const;

export type StyleConfigTemplate = {
  name: string;
  url?: string;
  json?: mapboxgl.Style;
};

const STYLES: Record<string, StyleConfigTemplate> = {
  STANDARD_LIGHT: {
    name: 'Standard Light',
    json: {
      version: 8,
      sources: {},
      layers: [],
      imports: [
        {
          id: 'basemap',
          url: 'mapbox://styles/mapbox/standard',
          config: {
            theme: 'monochrome'
          }
        }
      ]
    },
    ...defaults
  },
  STANDARD_DARK: {
    name: 'Standard Dark',
    json: {
      version: 8,
      sources: {},
      layers: [],
      imports: [
        {
          id: 'basemap',
          url: 'mapbox://styles/mapbox/standard',
          config: {
            theme: 'monochrome',
            lightPreset: 'night'
          }
        }
      ]
    },
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
