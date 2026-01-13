import { Cross1Icon, InfoCircledIcon } from '@radix-ui/react-icons';
import { contentLike } from 'app/components/elements';
import { useBreakpoint } from 'app/hooks/use_responsive';
import { getIsMac, localizeKeybinding } from 'app/lib/utils';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';
import { hideHintsAtom, selectionAtom } from 'state/jotai';
import { Mode, modeAtom } from 'state/mode';

function ModeHint({
  mode,
  children
}: {
  mode: Mode;
  children: React.ReactNode;
}) {
  const [hideHints, setHideHints] = useAtom(hideHintsAtom);

  if (hideHints.includes(mode)) {
    return null;
  }

  return (
    <div
      className={clsx(
        'z-0 absolute top-2 left-2 px-2 text-sm flex gap-x-2 items-center dark:text-white',
        contentLike
      )}
    >
      <InfoCircledIcon />
      {children}

      <button
        type="button"
        onClick={() => {
          setHideHints((hints) => {
            return hints.concat(mode);
          });
        }}
        className="pl-3"
      >
        <Cross1Icon className="w-2 h-2" />
      </button>
    </div>
  );
}

export function ModeHints() {
  const mode = useAtomValue(modeAtom);
  const selection = useAtomValue(selectionAtom);
  const show = useBreakpoint('lg');
  const isMac = getIsMac();

  if (!show) {
    return null;
  }

  const hold = (shift: boolean = false) => (
    <div className="text-xs">
      Hold {localizeKeybinding('Option', isMac)} to snap to existing features.
      {shift ? 'Hold Shift to snap to right angles.' : null}
    </div>
  );

  switch (mode.mode) {
    case Mode.DRAW_RECTANGLE: {
      return (
        <ModeHint mode={mode.mode}>
          {selection.type === 'single'
            ? 'Lift the mouse button to finish'
            : 'Click and drag to draw a rectangle'}
        </ModeHint>
      );
    }
    case Mode.LASSO:
    case Mode.DRAW_POINT: {
      // This one is pretty self-explanatory I think.
      return null;
    }
    case Mode.DRAW_POLYGON: {
      return (
        <ModeHint mode={mode.mode}>
          {selection.type === 'single' ? (
            <div>
              Finish by clicking the starting point, double-clicking or hitting
              Enter
              <br />
              {hold(true)}
            </div>
          ) : (
            'Click to start the polygon, then click to add each vertex'
          )}
        </ModeHint>
      );
    }
    case Mode.NONE: {
      if (selection.type === 'single') {
        if (mode.modeOptions?.hasResizedRectangle) {
          return (
            <ModeHint mode={mode.mode}>
              Resizing a rectangle. Hold Cmd to edit as a polygon.
            </ModeHint>
          );
        } else {
          return (
            <ModeHint mode={mode.mode}>
              <div>
                Hold space bar & drag to move entire features. Hold option &
                drag to rotate.
                <br />
                {hold()}
              </div>
            </ModeHint>
          );
        }
      }
      break;
    }
    case Mode.DRAW_CIRCLE: {
      return (
        <ModeHint mode={mode.mode}>
          {selection.type === 'single'
            ? 'Lift the mouse button to finish'
            : 'Click and drag to draw a circle'}
        </ModeHint>
      );
    }
    case Mode.DRAW_LINE: {
      return (
        <ModeHint mode={mode.mode}>
          {selection.type === 'single' ? (
            <div>
              End a line by double-clicking or hitting Enter
              <br />
              {hold(true)}
            </div>
          ) : (
            'Click to start the line, then click to add each vertex'
          )}
        </ModeHint>
      );
    }
  }

  return null;
}
