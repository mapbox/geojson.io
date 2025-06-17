module.exports = [
  {
    title: 'Standard',
    style: 'mapbox://styles/mapbox/standard',
    config: {
      basemap: {
        show3dObjects: false
      }
    }
  },
  {
    title: 'Standard Satellite',
    style: 'mapbox://styles/mapbox/standard-satellite'
  },
  {
    title: 'Standard Light',
    style: 'mapbox://styles/mapbox/standard',
    config: {
      basemap: {
        show3dObjects: false,
        theme: 'monochrome'
      }
    }
  },
  {
    title: 'Standard Dark',
    style: 'mapbox://styles/mapbox/standard',
    config: {
      basemap: {
        show3dObjects: false,
        theme: 'monochrome',
        lightPreset: 'night'
      }
    }
  },
  {
    title: 'Outdoors',
    style: 'mapbox://styles/mapbox/outdoors-v12'
  },
  {
    title: 'OSM',
    style: {
      name: 'osm',
      version: 8,
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
      sources: {
        'osm-raster-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
      },
      layers: [
        {
          id: 'osm-raster-layer',
          type: 'raster',
          source: 'osm-raster-tiles',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    }
  }
];
