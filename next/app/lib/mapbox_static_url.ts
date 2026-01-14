import type { PartialLayer } from 'state/jotai';
import { targetSize } from './constants';

/**
 * Given a layer, return a raw URL for its preview.
 *
 * @returns Raw URL pointing to an image for this layer's preview
 */
export function mapboxStaticURL(
  mapboxLayer: Pick<PartialLayer, 'type' | 'url' | 'token'>
) {
  switch (mapboxLayer.type) {
    case 'MAPBOX': {
      const params = new URLSearchParams({
        access_token: mapboxLayer.token,
        attribution: 'false',
        logo: 'false'
      }).toString();
      const u = new URL(mapboxLayer.url);
      const p = u.pathname.replace('//styles', '');
      return `https://api.mapbox.com/styles/v1${p}/static/[-136.3106,-35.8527,-22.7311,59.8357]/${targetSize.join(
        'x'
      )}@2x?${params}`;
    }
    case 'XYZ': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return mapboxLayer.url
        .replace('{x}', '0')
        .replace('{y}', '0')
        .replace('{z}', '0');
    }
    case 'TILEJSON': {
      // TODO: tilejson previews are… harder
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return mapboxLayer.url
        .replace('{x}', '0')
        .replace('{y}', '0')
        .replace('{z}', '0');
    }
  }
}
