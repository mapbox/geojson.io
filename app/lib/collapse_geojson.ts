import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiLineString,
  MultiPoint,
  MultiPolygon
} from 'types';

/**
 * Intended to be used to shrink geojson for
 * thumbnails, this collapses geometries into multigeometries.
 */
export function collapseGeoJSON(fc: FeatureCollection): FeatureCollection {
  const multiPoint: MultiPoint = {
    type: 'MultiPoint',
    coordinates: []
  };
  const multiLineString: MultiLineString = {
    type: 'MultiLineString',
    coordinates: []
  };
  const multiPolygon: MultiPolygon = {
    type: 'MultiPolygon',
    coordinates: []
  };

  function collapseGeometry(geometry: Geometry | null) {
    if (!geometry) return;

    switch (geometry.type) {
      case 'Point': {
        multiPoint.coordinates.push(geometry.coordinates);
        break;
      }
      case 'Polygon': {
        multiPolygon.coordinates.push(geometry.coordinates);
        break;
      }
      case 'LineString': {
        multiLineString.coordinates.push(geometry.coordinates);
        break;
      }

      case 'MultiPoint': {
        multiPoint.coordinates = multiPoint.coordinates.concat(
          geometry.coordinates
        );
        break;
      }
      case 'MultiPolygon': {
        multiPolygon.coordinates = multiPolygon.coordinates.concat(
          geometry.coordinates
        );
        break;
      }
      case 'MultiLineString': {
        multiLineString.coordinates = multiLineString.coordinates.concat(
          geometry.coordinates
        );
        break;
      }
      case 'GeometryCollection': {
        for (const g of geometry.geometries) {
          collapseGeometry(g);
        }
      }
    }
  }

  for (const feature of fc.features) {
    collapseGeometry(feature.geometry);
  }

  return {
    type: 'FeatureCollection',
    features: [multiPolygon, multiPoint, multiLineString]
      .filter((geom) => geom.coordinates.length)
      .map((geom): Feature => {
        return {
          type: 'Feature',
          geometry: geom,
          properties: null
        };
      })
  };
}
