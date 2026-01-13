import type { BufferOptions } from 'app/lib/buffer';
import { lib } from 'app/lib/worker';
import type { Feature } from 'types';

export async function buffer(feature: Feature, options: BufferOptions) {
  return lib.bufferFeature(feature, options);
}
