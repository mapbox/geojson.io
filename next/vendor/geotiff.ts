import type { FeatureCollection } from 'types';
import { polygonFromPositions } from 'app/lib/geometry';

export async function getGeotiffExtent(
  file: ArrayBuffer
): Promise<FeatureCollection> {
  const { fromArrayBuffer } = await import('vendor/geotiff/index');
  const { default: proj4 } = await import('proj4');
  const tiff = await fromArrayBuffer(file);
  const image = await tiff.getImage();
  const geoKeys = image.geoKeys;
  const code: string =
    geoKeys.ProjectedCSTypeGeoKey || geoKeys.GeographicTypeGeoKey;

  const epsg = `EPSG:${code}`;
  if (!proj4.defs(epsg)) {
    const response = await fetch(`//epsg.io/${code}.proj4`);
    proj4.defs(epsg, await response.text());
  }
  const bbox = image.getBoundingBox();

  const tl: Pos2 = proj4(epsg, 'EPSG:4326', [bbox[0], bbox[1]]);
  const br: Pos2 = proj4(epsg, 'EPSG:4326', [bbox[2], bbox[3]]);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: geoKeys,
        geometry: polygonFromPositions(tl, br)
      }
    ]
  };
}
