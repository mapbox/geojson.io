export interface CameraPosition {
  zoom: number;
  lat: number;
  lng: number;
  bearing: number;
  pitch: number;
}

/**
 * Parse the `map` query parameter into a camera position.
 * Format: zoom/lat/lng/bearing/pitch
 * bearing and pitch are optional (default to 0)
 */
export function parseMapParam(param: string): CameraPosition | null {
  const parts = param.split('/');
  if (parts.length < 3) return null;

  const zoom = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  const lng = parseFloat(parts[2]);
  const bearing = parts.length >= 4 ? parseFloat(parts[3]) : 0;
  const pitch = parts.length >= 5 ? parseFloat(parts[4]) : 0;

  if ([zoom, lat, lng, bearing, pitch].some(isNaN)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;
  if (zoom < 0 || zoom > 26) return null;
  if (pitch < 0 || pitch > 85) return null;

  return { zoom, lat, lng, bearing, pitch };
}

/**
 * Serialize a camera position into the `map` query parameter format.
 * Format: zoom/lat/lng[/bearing[/pitch]]
 *
 * Omission rules:
 *   - bearing=0, pitch=0  → zoom/lat/lng
 *   - bearing≠0, pitch=0  → zoom/lat/lng/bearing
 *   - bearing=0, pitch≠0  → zoom/lat/lng/bearing/pitch  (bearing must be present)
 *   - bearing≠0, pitch≠0  → zoom/lat/lng/bearing/pitch
 */
export function serializeMapParam(camera: CameraPosition): string {
  const round = (n: number, decimals: number) =>
    Math.round(n * 10 ** decimals) / 10 ** decimals;

  const bearing = round(camera.bearing, 1);
  const pitch = round(camera.pitch, 0);

  const parts: number[] = [
    round(camera.zoom, 2),
    round(camera.lat, 5),
    round(camera.lng, 5)
  ];

  if (bearing !== 0 || pitch !== 0) {
    parts.push(bearing);
    if (pitch !== 0) {
      parts.push(pitch);
    }
  }

  return parts.join('/');
}
