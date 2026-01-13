import type { Feature, Position, FeatureCollection } from 'types';
import { dsvFormat } from 'd3-dsv';

type GTFSRow = {
  shape_id: string | number;
  shape_pt_sequence: number;
  shape_pt_lat: number;
  shape_pt_lon: number;
};

/** @public */
export function GTFSLinesToGeoJSON(gtfs: string): FeatureCollection {
  const points = dsvFormat(',')
    .parse(gtfs)
    .map((row): GTFSRow => {
      const { shape_id, shape_pt_lon, shape_pt_lat, shape_pt_sequence } = row;
      if (
        shape_id === undefined ||
        shape_pt_sequence === undefined ||
        shape_pt_lat === undefined ||
        shape_pt_lon === undefined
      ) {
        throw new Error('Missing a required GTFS Value');
      }
      return {
        shape_id,
        shape_pt_sequence: +shape_pt_sequence,
        shape_pt_lon: parseFloat(shape_pt_lon),
        shape_pt_lat: parseFloat(shape_pt_lat)
      };
    })
    .sort((a, b) => {
      if (a.shape_id === b.shape_id) {
        return +a.shape_pt_sequence - +b.shape_pt_sequence;
      }
      return a.shape_id < b.shape_id ? -1 : 1;
    });

  const features: Feature[] = [];

  for (let i = 0; i < points.length; ) {
    const shape_id = points[i].shape_id;
    const coordinates: Position[] = [];
    for (; i < points.length && points[i].shape_id === shape_id; i++) {
      const coord = points[i];
      coordinates.push([coord.shape_pt_lon, coord.shape_pt_lat]);
    }
    features.push({
      type: 'Feature',
      properties: {
        id: shape_id
      },
      geometry: {
        type: 'LineString',
        coordinates
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}
