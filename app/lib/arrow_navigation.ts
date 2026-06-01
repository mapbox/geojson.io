import type { KeyboardEventHandler } from 'react';
import type { CoordProps } from 'types';

type FocusCoordinate = CoordProps & {
  inputLocation: 'empty' | 'start' | 'end' | 'middle';
};

/**
 * Danger: while loop
 */
function getXY(element: HTMLElement | null): FocusCoordinate | null {
  let inputLocation: FocusCoordinate['inputLocation'] = 'empty';

  if (element instanceof HTMLInputElement) {
    if ('selectionStart' in element && element.type === 'text') {
      const value = element.value;
      // If there's nothing in the input element,
      // this is the special "empty" state - you can navigate
      // forward or backward.
      if (!value) {
        inputLocation = 'empty';
      }
      // If something is selected, never move.
      else if (element.selectionStart === element.selectionEnd) {
        if (element.selectionStart === 0) {
          inputLocation = 'start';
        } else if (element.selectionStart === value.length) {
          inputLocation = 'end';
        } else {
          inputLocation = 'middle';
        }
      } else {
        inputLocation = 'middle';
      }
    }
  }

  while (element && !(element.dataset && 'focusScope' in element.dataset)) {
    if (element.dataset && 'focusX' in element.dataset) {
      return {
        x: +(element.dataset.focusX || 0),
        y: +(element.dataset.focusY || 0),
        inputLocation
      };
    }
    element = element.parentNode as HTMLElement;
  }
  return null;
}

export const onArrow: KeyboardEventHandler = (e) => {
  const elem = e.target;

  const xy = getXY(elem as HTMLElement);

  if (xy) {
    switch (e.key) {
      case 'ArrowUp': {
        xy.y--;
        break;
      }
      case 'ArrowDown': {
        xy.y++;
        break;
      }
      case 'ArrowLeft': {
        if (xy.inputLocation === 'middle' || xy.inputLocation === 'end') {
          return;
        }
        xy.x--;
        break;
      }
      case 'ArrowRight': {
        if (xy.inputLocation === 'middle' || xy.inputLocation === 'start') {
          return;
        }
        xy.x++;
        break;
      }
    }

    const target = document.querySelector(
      `[data-focus-x="${xy.x}"][data-focus-y="${xy.y}"]`
    );
    if (target) {
      (target as HTMLElement).focus();
    }
  }
};
