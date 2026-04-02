import { svgArray } from '@mapbox/maki';
import mapboxgl from 'mapbox-gl';

export interface MakiIcon {
  name: string;
  /** data URI usable as <img src> */
  dataUri: string;
}

/**
 * All maki icons with their names and data URIs for UI rendering.
 */
export const MAKI_ICONS: MakiIcon[] = (svgArray as string[]).flatMap((svg) => {
  const name = svg.match(/id="([^"]+)"/)?.[1];
  if (!name) return [];
  return [
    {
      name,
      dataUri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    }
  ];
});

/**
 * Load all maki icons into a Mapbox GL map as SDF images so they can be
 * recolored via the icon-color paint property.
 */
export async function loadMakiIcons(map: mapboxgl.Map): Promise<void> {
  await Promise.all(
    (svgArray as string[]).map((svg) => {
      const name = svg.match(/id="([^"]+)"/)?.[1];
      if (!name) return Promise.resolve();

      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

      return new Promise<void>((resolve) => {
        const img = new Image(15, 15);
        img.onload = () => {
          if (!map.hasImage(name)) {
            map.addImage(name, img, { sdf: true });
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    })
  );
}
