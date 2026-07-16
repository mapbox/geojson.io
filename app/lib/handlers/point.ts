import { useAltHeld, useShiftHeld } from 'app/hooks/use_held';
import { CURSOR_DEFAULT } from 'app/lib/constants';
import { captureException } from 'integrations/errors';
import { useSetAtom } from 'jotai';
import noop from 'lodash/noop';
import { USelection } from 'state';
import {
  cursorStyleAtom,
  ephemeralStateAtom,
  Mode,
  modeAtom,
  selectionAtom
} from 'state/jotai';
import type { HandlerContext, Point } from 'types';
import {
  createOrUpdateFeature,
  getMapCoord,
  getNearbyVertices,
  getSnappingCoordinates
} from './utils';

export function usePointHandlers({
  dragTargetRef,
  mode,
  selection,
  featureMap,
  pmap,
  idMap,
  rep
}: HandlerContext): Handlers {
  const setSelection = useSetAtom(selectionAtom);
  const setMode = useSetAtom(modeAtom);
  const setCursor = useSetAtom(cursorStyleAtom);
  const setEphemeralState = useSetAtom(ephemeralStateAtom);
  const transact = rep.useTransact();
  const multi = mode.modeOptions?.multi;
  const altHeld = useAltHeld();
  const shiftHeld = useShiftHeld();
  return {
    click: (e) => {
      if (!multi) {
        setMode({ mode: Mode.NONE });
      }

      const verticesOnly = altHeld.current && shiftHeld.current;
      const point: Point = {
        type: 'Point',
        coordinates: altHeld.current
          ? getSnappingCoordinates(
              e,
              featureMap,
              pmap,
              idMap,
              undefined,
              verticesOnly
            )
          : getMapCoord(e)
      };

      const putFeature = createOrUpdateFeature({
        mode,
        selection,
        featureMap,
        geometry: point
      });

      const id = putFeature.id;

      transact({
        note: 'Drew a point',
        putFeatures: [putFeature]
      })
        .then(() => {
          if (!multi) {
            setSelection(USelection.single(id));
          }
        })
        .catch((e) => captureException(e));
    },
    move: (e) => {
      if (altHeld.current && shiftHeld.current) {
        setEphemeralState({
          type: 'vertex-snap',
          vertices: getNearbyVertices(e, featureMap, pmap, idMap)
        });
      } else {
        setEphemeralState({ type: 'none' });
      }
    },
    down: noop,
    up() {
      dragTargetRef.current = null;
      setCursor(CURSOR_DEFAULT);
    },
    double: noop,
    enter() {
      setMode({ mode: Mode.NONE });
    }
  };
}
