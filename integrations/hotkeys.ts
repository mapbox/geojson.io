import { useHotkeys as rawUseHotkeys } from 'react-hotkeys-hook';

type Params = Parameters<typeof rawUseHotkeys>;

export function useHotkeys(
  keys: Params[0],
  fn: Params[1],
  a: Params[2],
  b?: Params[3]
) {
  const wrap: Params[1] = (...args) => {
    return fn(...args);
  };
  return rawUseHotkeys(keys, wrap, a, b);
}
