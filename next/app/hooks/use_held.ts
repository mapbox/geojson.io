import { useSetAtom } from 'jotai';
import { useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { cursorStyleAtom } from 'state/jotai';
import type { Position } from 'types';

export function lockDirection(lastCoord: Position, nextCoord: Position): Pos2 {
  // Use euclidean projected coordinates for this
  const angleBetween = Math.atan2(
    lastCoord[1] - nextCoord[1],
    lastCoord[0] - nextCoord[0]
  );

  if (
    Math.abs(angleBetween) < Math.PI / 4 ||
    Math.abs(angleBetween) > Math.PI * (3 / 4)
  ) {
    return [nextCoord[0], lastCoord[1]];
  }
  return [lastCoord[0], nextCoord[1]];
}

export function useShiftHeld() {
  const shiftHeld = useRef<boolean>(false);

  useHotkeys(
    '*',
    (e) => {
      shiftHeld.current = e.shiftKey;
    },
    { keydown: true, keyup: true },
    []
  );

  return shiftHeld;
}

export function useSpaceHeld() {
  const spaceHeld = useRef<boolean>(false);
  const setCursor = useSetAtom(cursorStyleAtom);

  useHotkeys(
    'Space',
    (e) => {
      setCursor(e.type === 'keydown' ? 'move' : '');
      spaceHeld.current = e.type === 'keydown';
    },
    { keydown: true, keyup: true },
    []
  );

  return spaceHeld;
}

export function useAltHeld() {
  const altHeld = useRef<boolean>(false);

  useHotkeys(
    '*',
    (e) => {
      altHeld.current = e.altKey;
    },
    { keydown: true, keyup: true },
    []
  );

  return altHeld;
}
