import * as Comlink from 'comlink';
import { EitherHandler } from './shared';
import type { Lib } from './worker';

Comlink.transferHandlers.set('EITHER', EitherHandler);

export const lib = Comlink.wrap<Lib>(
  new Worker(new URL('./worker', import.meta.url), {
    type: 'module'
  })
);
