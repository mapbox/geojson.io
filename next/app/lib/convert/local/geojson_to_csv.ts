import { geoJSONToPolyline } from '@placemarkio/polyline';
import { geoJSONToWkt } from 'betterknown';
import { csvFormat } from 'd3-dsv';
import { Maybe } from 'purify-ts/Maybe';
import type { FeatureCollection } from 'types';
import type { ExportOptions } from '..';

// TODO: what if the feature has latitude & longitude properties?
export function geojsonToCSV(
  geojson: FeatureCollection,
  options: ExportOptions
) {
  const rows = [];

  const kind = options.csvOptions?.kind || 'lonlat';

  switch (kind) {
    case 'lonlat': {
      for (const feature of geojson.features) {
        if (feature.geometry?.type === 'Point') {
          const [longitude, latitude] = feature.geometry.coordinates;
          const row = { ...feature.properties, latitude, longitude };
          rows.push(row);
        } else if (feature.geometry?.type === 'MultiPoint') {
          for (const point of feature.geometry.coordinates) {
            const [longitude, latitude] = point;
            const row = { ...feature.properties, latitude, longitude };
            rows.push(row);
          }
        }
      }
      break;
    }
    case 'wkt': {
      for (const feature of geojson.features) {
        const wkt: string = feature.geometry
          ? Maybe.fromNullable(geoJSONToWkt(feature.geometry)).orDefault('')
          : '';
        const row = { ...feature.properties, wkt };
        rows.push(row);
      }
      break;
    }
    case 'geojson': {
      for (const feature of geojson.features) {
        const geojson = feature.geometry
          ? JSON.stringify(feature.geometry)
          : '';
        const row = { ...feature.properties, geojson };
        rows.push(row);
      }
      break;
    }
    case 'polyline': {
      for (const feature of geojson.features) {
        const polyline =
          feature.geometry?.type === 'LineString'
            ? geoJSONToPolyline(feature.geometry)
            : '';
        const row = { ...feature.properties, polyline };
        rows.push(row);
      }
      break;
    }
  }

  return csvFormat(rows);
}
