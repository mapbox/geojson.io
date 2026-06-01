import * as utils from 'app/lib/map_component_utils';
import { toggle, toggleByValue } from 'app/lib/utils';
import { useAtomCallback } from 'jotai/utils';
import noop from 'lodash/noop';
import { useCallback } from 'react';
import { USelection } from 'state';
import type { EphemeralEditingStateLasso } from 'state/jotai';
import { ephemeralStateAtom, modeAtom, selectionAtom } from 'state/jotai';
import { Mode } from 'state/mode';
import type { HandlerContext } from 'types';

export function useLassoHandlers({
  flatbushInstance,
  featureMap,
  idMap,
  selection,
  pmap
}: HandlerContext): Handlers {
  return {
    click: useAtomCallback(
      useCallback((_get, set) => {
        set(modeAtom, { mode: Mode.NONE });
      }, [])
    ),
    move: useAtomCallback(
      useCallback(
        (get, set, e) => {
          const map = e.target;
          const oldState = get(ephemeralStateAtom);
          if (oldState.type !== 'lasso') return;
          const pos = e.lngLat.toArray() as Pos2;
          const newLasso: EphemeralEditingStateLasso = {
            type: 'lasso',
            box: [oldState.box[0], pos]
          };
          if (utils.isLassoTiny(newLasso, map)) {
            set(ephemeralStateAtom, newLasso);
            return;
          }
          const { box } = newLasso;
          switch (flatbushInstance.type) {
            case 'feature': {
              set(ephemeralStateAtom, newLasso);
              set(selectionAtom, (sel) => flatbushInstance.search(box, sel));
              break;
            }
            case 'vertex': {
              const oldSelection = get(selectionAtom);
              if (oldSelection.type === 'single') {
                set(ephemeralStateAtom, newLasso);
                set(selectionAtom, (sel) => flatbushInstance.search(box, sel));
              }
              break;
            }
            default:
              break;
          }
          e.preventDefault();
        },
        [flatbushInstance]
      )
    ),
    down: noop,
    up: useAtomCallback((get, set, e) => {
      const map = e.target;
      const ephemeralState = get(ephemeralStateAtom);
      set(ephemeralStateAtom, { type: 'none' });
      // If the lasso is tiny, this was probably just a shift-click!
      // In that case, set the new selection with added features.
      if (ephemeralState?.type !== 'lasso') return;

      // Shift-add or remove to/from a selection
      if (
        !(utils.isLassoTiny(ephemeralState, map) && e.originalEvent.shiftKey)
      ) {
        set(modeAtom, { mode: Mode.NONE });
        return;
      }

      // From here on out we assume that this was a shift-click.
      const fuzzyResult = utils.fuzzyClick(e, {
        idMap,
        featureMap,
        pmap
      });
      if (!fuzzyResult) {
        set(selectionAtom, USelection.none());
        return;
      }

      const { wrappedFeature, decodedId } = fuzzyResult;

      const id = wrappedFeature.id;

      switch (selection.type) {
        case 'none': {
          set(selectionAtom, USelection.single(id));
          break;
        }
        case 'multi': {
          const newSelection = USelection.toggleSelectionId(selection, id);
          set(selectionAtom, newSelection);
          break;
        }
        case 'single': {
          if (decodedId.type === 'vertex') {
            set(selectionAtom, {
              type: 'single',
              parts: toggleByValue(selection.parts, decodedId),
              id: id
            });
          } else if (decodedId.type === 'feature') {
            const ids = toggle([selection.id], id);
            set(
              selectionAtom,
              ids.length === 0
                ? {
                    type: 'none'
                  }
                : {
                    type: 'multi',
                    ids
                  }
            );
          }
          break;
        }
      }
    }),
    double: noop,
    enter() {}
  };
}
