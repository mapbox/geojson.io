import { atom } from 'jotai';
import type { IWrappedFeature } from 'types';

/**
 * Map drawing mode
 */
export enum Mode {
  NONE = 'NONE',
  LASSO = 'LASSO',
  DRAW_POINT = 'DRAW_POINT',
  DRAW_LINE = 'DRAW_LINE',
  DRAW_RECTANGLE = 'DRAW_RECTANGLE',
  DRAW_POLYGON = 'DRAW_POLYGON',
  DRAW_CIRCLE = 'DRAW_CIRCLE'
}

export enum CIRCLE_TYPE {
  MERCATOR = 'Mercator',
  GEODESIC = 'Geodesic',
  DEGREES = 'Degrees'
}

interface ModeOptions {
  /**
   * A weird special case: in "none" mode,
   * you can resize a rectangle. This shows a help
   * menu item showing that you can _avoid_ this behavior
   * by hitting a key.
   */
  hasResizedRectangle?: boolean;
  /**
   * This is for lines: if someone clicks on the first
   * vertex of a line to continue it from there, we need
   * to remember to add points to that end.
   */
  reverse?: boolean;
  /**
   * Accessed by shift-clicking mode buttons or adding
   * shift to the shortcuts, this lets people
   * draw multiple features by staying in the drawing
   * mode after finishing a feature.
   */
  multi?: boolean;

  circleType?: CIRCLE_TYPE;

  /**
   * Replace geometry of the feature with the given ID
   */
  replaceGeometryForId?: IWrappedFeature['id'] | null;
}

export const MODE_INFO: Record<
  Mode,
  {
    label: string;
  }
> = {
  [Mode.NONE]: { label: 'Select' },
  [Mode.DRAW_POINT]: { label: 'Point' },
  [Mode.DRAW_LINE]: { label: 'Line' },
  [Mode.DRAW_RECTANGLE]: { label: 'Rectangle' },
  [Mode.DRAW_POLYGON]: { label: 'Polygon' },
  [Mode.DRAW_CIRCLE]: { label: 'Circle' },
  [Mode.LASSO]: { label: 'Lasso' }
};

export type ModeWithOptions = {
  mode: Mode;
  modeOptions?: ModeOptions;
};

export const modeAtom = atom<ModeWithOptions>({
  mode: Mode.NONE
});
