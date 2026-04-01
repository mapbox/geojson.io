import { svgArray } from '@mapbox/maki';
import mapboxgl from 'mapbox-gl';

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
