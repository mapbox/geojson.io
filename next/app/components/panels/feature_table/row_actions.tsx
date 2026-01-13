// Menu

import { styledCheckbox } from 'app/components/elements';
import type { SetStateAction } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import max from 'lodash/max';
import min from 'lodash/min';
import range from 'lodash/range';
import { memo, useCallback } from 'react';
import { dataAtom, type Sel, selectionAtom } from 'state/jotai';
import { USelection } from 'state/uselection';
import type { IWrappedFeature } from 'types';
import { HEIGHT } from '../feature_table';

export default memo(function RowActions({
  feature,
  features,
  selected,
  setSelection
}: {
  feature: IWrappedFeature;
  features: IWrappedFeature[];
  selected: boolean;
  setSelection: (update: SetStateAction<Sel>) => void;
}) {
  const { id } = feature;

  const shiftClick = useAtomCallback(
    useCallback(
      (get, set, id: string) => {
        const { selection } = get(dataAtom);
        const existingIds = USelection.toIds(selection);
        const allIndexes = existingIds
          .map((id) => {
            return features.findIndex((feature) => feature.id === id);
          })
          .concat(features.findIndex((feature) => feature.id === id));

        const newIds = range(min(allIndexes)!, max(allIndexes)! + 1).map(
          (idx) => {
            return features[idx].id;
          }
        );

        set(selectionAtom, USelection.fromIds(newIds));
        return;
      },
      [features]
    )
  );

  return (
    <label
      className="pl-1 dark:text-white z-10 contain-layout
        hover:bg-gray-100 dark:hover:bg-gray-900
        flex items-center"
      style={{
        height: HEIGHT
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        className={
          styledCheckbox({ variant: 'default' }) +
          ' w-3 h-3 group-hover:opacity-100 checked:opacity-100 opacity-0 focus:ring-mb-blue-500 focus:ring-1'
        }
        onChange={(e) => {
          const pointerEvent =
            e.nativeEvent instanceof PointerEvent ? e.nativeEvent : null;
          if (pointerEvent?.shiftKey) {
            return shiftClick(id);
          } else {
            setSelection((selection) =>
              USelection.toggleSelectionId(selection, id)
            );
          }
        }}
      ></input>
      <div className="text-xs pl-2 text-gray-700 dark:text-gray-200">
        {feature.feature.geometry?.type || 'Null'}
      </div>
    </label>
  );
});
