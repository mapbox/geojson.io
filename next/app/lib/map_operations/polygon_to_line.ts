import { match } from 'ts-pattern';
import type {
  IFeature,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
  Position
} from 'types';

function polygonFromRings(
  feature: IFeature,
  rings: Position[][]
): IFeature<LineString | MultiLineString> {
  if (rings.length === 1) {
    return {
      ...feature,
      geometry: {
        type: 'LineString',
        coordinates: rings[0]
      }
    };
  } else {
    return {
      ...feature,
      geometry: {
        type: 'MultiLineString',
        coordinates: rings
      }
    };
  }
}

export const polygonToLine = (feature: IFeature<Polygon | MultiPolygon>) => {
  return match(feature)
    .with({ geometry: { type: 'Polygon' } }, (feature) => {
      return polygonFromRings(feature, feature.geometry.coordinates);
    })
    .with({ geometry: { type: 'MultiPolygon' } }, (feature) => {
      return polygonFromRings(feature, feature.geometry.coordinates.flat());
    })
    .exhaustive();
};
