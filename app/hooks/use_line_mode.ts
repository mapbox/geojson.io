import type { LineString } from '@turf/helpers';
import { usePersistence } from 'app/lib/persistence/context';
import replaceCoordinates from 'app/lib/replace_coordinates';
import { captureException } from 'integrations/errors';
import { useAtomCallback } from 'jotai/utils';
import last from 'lodash/last';
import { useCallback } from 'react';
import { USelection } from 'state';
import { dataAtom, ephemeralStateAtom, selectionAtom } from 'state/jotai';
import { Mode, modeAtom } from 'state/mode';
import type { Feature, IFeature, IWrappedFeature } from 'types';

export function getContinuationDirection(
  id: Id,
  feature: Feature
): 'forward' | 'reverse' | null {
  if (id.type !== 'vertex' || feature.geometry?.type !== 'LineString')
    return null;
  return id.vertex === feature.geometry.coordinates.length - 1
    ? 'forward'
    : id.vertex === 0
    ? 'reverse'
    : null;
}

type Direction = NonNullable<ReturnType<typeof getContinuationDirection>>;

export function continueFeature(
  feature: IFeature<LineString>,
  direction: Direction
) {
  return replaceCoordinates(
    feature,
    direction === 'forward'
      ? feature.geometry.coordinates.concat([
          last(feature.geometry.coordinates)!
        ])
      : [feature.geometry.coordinates[0]].concat(feature.geometry.coordinates)
  );
}

/**
 * A hook for the subtle behavior of the line
 * drawing mode switch.
 */
export function useLineMode() {
  const rep = usePersistence();
  const transact = rep.useTransact();

  return useAtomCallback(
    useCallback(
      (
        get,
        set,
        {
          event,
          replaceGeometryForId = null
        }: {
          event: Pick<React.MouseEvent, 'shiftKey'> | undefined;
          replaceGeometryForId?: IWrappedFeature['id'] | null;
        }
      ) => {
        const { featureMap, selection } = get(dataAtom);

        // Just switch to line mode, don't continue a line!
        function justSwitch() {
          set(ephemeralStateAtom, { type: 'none' });
          const data = get(dataAtom);
          set(dataAtom, {
            ...data,
            selection: USelection.none()
          });
          set(modeAtom, {
            mode: Mode.DRAW_LINE,
            modeOptions: { multi: !!event?.shiftKey, replaceGeometryForId }
          });
        }

        if (
          selection.type !== 'single' ||
          selection.parts.length !== 1 ||
          replaceGeometryForId
        ) {
          return justSwitch();
        }

        const decodedId = selection.parts[0];
        const wrappedFeature = featureMap.get(selection.id);
        if (wrappedFeature) {
          const { feature } = wrappedFeature;
          if (feature.geometry?.type !== 'LineString') {
            return justSwitch();
          }
          const direction = getContinuationDirection(decodedId, feature);
          if (direction) {
            const newFeature = continueFeature(
              feature as IFeature<LineString>,
              direction
            );
            transact({
              note: 'Continued a line',
              putFeatures: [
                {
                  ...wrappedFeature,
                  feature: newFeature
                }
              ]
            })
              .then(() => {
                set(selectionAtom, USelection.single(wrappedFeature.id));
                set(modeAtom, {
                  mode: Mode.DRAW_LINE,
                  modeOptions: { reverse: direction === 'reverse' }
                });
              })
              .catch((e) => captureException(e));
            return;
          } else {
            justSwitch();
          }
        }
      },
      [transact]
    )
  );
}
