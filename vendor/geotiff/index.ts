import GeoTIFF from './geotiff';

/**
 * Construct a GeoTIFF from an HTML
 * [Blob]{@link https://developer.mozilla.org/en-US/docs/Web/API/Blob} or
 * [File]{@link https://developer.mozilla.org/en-US/docs/Web/API/File}
 * object.
 */
export function fromArrayBuffer(blob: ArrayBuffer) {
  return GeoTIFF.fromSource({
    fetch(start: number, length: number) {
      return Promise.resolve(blob.slice(start, start + length));
    }
  });
}
