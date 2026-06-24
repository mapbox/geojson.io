// This file is used to encode GeoJSON to base64 for more efficient storage of geojson data in
// shareable URL's.  Providing as much as 90% increase in larger available geojson for sharing
// Uses the Browser native CompressionStream() API.

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function collectStream(
  readable: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = readable.getReader();
  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;
    if (result.value) chunks.push(result.value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export async function gzipEncode(text: string): Promise<string> {
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(new TextEncoder().encode(text));
  writer.close();
  const compressed = await collectStream(stream.readable);
  return toBase64Url(compressed);
}

export async function gzipDecode(encoded: string): Promise<string> {
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(fromBase64Url(encoded) as unknown as BufferSource);
  writer.close();
  const decompressed = await collectStream(stream.readable);
  return new TextDecoder().decode(decompressed);
}
