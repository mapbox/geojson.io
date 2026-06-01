import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { useMove } from '@react-aria/interactions';
import { TContent } from 'app/components/elements';
import clsx from 'clsx';
import { useAtom, useSetAtom } from 'jotai';
import { Tooltip as T } from 'radix-ui';
import { memo, useEffect, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import {
  MIN_SPLITS,
  OTHER_SIDE,
  type Side,
  type Splits,
  splitsAtom
} from 'state/jotai';

const MIN_MAP_WIDTH = 80;

export function useWindowResizeSplits() {
  const isBigScreen = useBigScreen();
  const setSplits = useSetAtom(splitsAtom);

  useEffect(() => {
    function updateSplits() {
      if (!isBigScreen) return;

      setSplits((splits) => {
        const windowWidth = window.innerWidth;
        const panelsCombined = splits.left + splits.right;
        const remainingSpaceForMap = windowWidth - panelsCombined;

        if (remainingSpaceForMap > MIN_MAP_WIDTH) {
          return splits;
        }

        const newSplits = { ...splits };

        // First try reducing the left width.
        if (windowWidth - splits.right > MIN_MAP_WIDTH) {
          newSplits.leftOpen = false;
          return newSplits;
        }
        if (windowWidth - splits.right > MIN_MAP_WIDTH) {
          newSplits.rightOpen = false;
          return newSplits;
        }

        newSplits.rightOpen = false;
        newSplits.leftOpen = false;

        return newSplits;
      });
    }

    window.addEventListener('resize', updateSplits);
    return () => {
      window.removeEventListener('resize', updateSplits);
    };
  }, [setSplits, isBigScreen]);
}

/**
 * True if the window is > 640px wide.
 */
export function useBigScreen() {
  /**
   * The window is > 640px wide
   */
  return useMediaQuery({ minWidth: 640 });
}

function solveSplits(splits: Splits, side: Side, newValue: number): Splits {
  const otherSide = OTHER_SIDE[side];
  const windowWidth = window.innerWidth;
  const newSplits = { ...splits };

  if (newValue < MIN_SPLITS[side]) {
    newSplits[`${side}Open`] = false;
  } else {
    newSplits[side] = Math.min(newValue, windowWidth - MIN_MAP_WIDTH);
  }

  const thisPane = newSplits[side];
  const panelsCombined = newSplits.left + newSplits.right;
  const remainingSpaceForMap = windowWidth - panelsCombined;
  const proposedOtherSide = windowWidth - thisPane - MIN_MAP_WIDTH;

  // Maybe we've moved this panel so far out that the panels
  // will nearly overlap.
  if (remainingSpaceForMap < MIN_MAP_WIDTH) {
    if (proposedOtherSide < MIN_SPLITS[otherSide]) {
      newSplits[`${otherSide}Open`] = false;
    } else {
      newSplits[otherSide] = proposedOtherSide;
    }
  }

  return newSplits;
}

function useResize(side: Side) {
  const [splits, setSplits] = useAtom(splitsAtom);
  const showPanel = splits[`${side}Open`];
  const rawSplit = useRef<number | null>(null);

  const { moveProps } = useMove({
    onMoveStart() {
      rawSplit.current = splits[side];
    },
    onMove(e) {
      if (rawSplit.current === null) return;
      rawSplit.current -= Math.round(e.deltaX * (side === 'left' ? -1 : 1));
      if (rawSplit.current === null) return;
      const raw = rawSplit.current;
      setSplits((splits) => {
        return solveSplits(splits, side, raw);
      });
    },
    onMoveEnd() {
      rawSplit.current = null;
    }
  });

  return { moveProps, showPanel, splits };
}

function useResizeBottom() {
  const [splits, setSplits] = useAtom(splitsAtom);
  const rawSplit = useRef<number | null>(null);

  const { moveProps } = useMove({
    onMoveStart() {
      rawSplit.current = splits.bottom;
    },
    onMove(e) {
      if (rawSplit.current === null) return;
      rawSplit.current -= Math.round(e.deltaY * 1);
      if (rawSplit.current === null) return;
      const raw = rawSplit.current;
      setSplits((splits) => {
        return {
          ...splits,
          bottom: raw
        };
      });
    },
    onMoveEnd() {
      rawSplit.current = null;
    }
  });

  return { moveProps, splits };
}

export const Resizer = memo(function ResizerInner({ side }: { side: Side }) {
  const { moveProps, showPanel, splits } = useResize(side);

  return (
    <>
      <button
        {...moveProps}
        type="button"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        tabIndex={0}
        style={{
          cursor: 'col-resize',
          [side]: showPanel ? splits[side] : 0
        }}
        className="absolute top-0 bottom-0
        touch-none
        flex items-center
        justify-center
        w-1
        hover-none:w-3
        z-max
        bg-opacity-0
        dark:bg-opacity-0
        hover-none:bg-opacity-40
        hover-none:dark:bg-opacity-40
        hover-none:bg-white
        hover-none:dark:bg-black
        hover-hover:hover:bg-opacity-100
        hover-hover:dark:hover:bg-opacity-100
        bg-mb-blue-700
        dark:bg-mb-blue-700
        "
      >
        <div
          className="
        hover-hover:hidden
        h-16
        w-1
        rounded
        bg-white"
        />
      </button>
      {showPanel ? null : <PanelToggle side={side} />}
    </>
  );
});

function PanelToggle({ side }: { side: Side }) {
  const setSplits = useSetAtom(splitsAtom);

  const togglePanel = () => {
    setSplits((splits) => {
      return {
        ...splits,
        [`${side}Open`]: !splits[`${side}Open`]
      };
    });
  };

  return (
    <T.Root>
      <T.Trigger
        onClick={togglePanel}
        aria-label="Show panel"
        className={clsx(
          side === 'right' ? 'right-0' : 'left-0',
          side === 'right'
            ? 'border-l rounded-r-none'
            : 'border-r rounded-l-none',
          `
          absolute px-0.5 py-2 top-1/2 border-t border-b
          bg-white hover:bg-purple-100 border-gray-300
          dark:bg-gray-900 dark:text-white dark:hover:bg-mb-blue-700 dark:border-white
          rounded
        `
        )}
      >
        {side === 'right' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </T.Trigger>
      <T.Portal>
        <TContent>
          <div className="whitespace-nowrap">Expand panel</div>
        </TContent>
      </T.Portal>
    </T.Root>
  );
}

export const BottomResizer = memo(function BottomResizerInner() {
  const { moveProps, splits } = useResizeBottom();

  return (
    <button
      {...moveProps}
      type="button"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      tabIndex={0}
      style={{
        cursor: 'row-resize',
        bottom: splits.bottom
      }}
      className="absolute left-0 right-0
        touch-none
        flex items-center
        justify-center
        h-1
        hover-none:w-3
        z-max
        bg-opacity-0
        dark:bg-opacity-0
        hover-none:bg-opacity-40
        hover-none:dark:bg-opacity-40
        hover-none:bg-white
        hover-none:dark:bg-black
        hover-hover:hover:bg-opacity-100
        hover-hover:dark:hover:bg-opacity-100
        bg-mb-blue-700
        dark:bg-mb-blue-700
        "
    >
      <div
        className="
        hover-hover:hidden
        h-16
        w-1
        rounded
        bg-white"
      />
    </button>
  );
});
