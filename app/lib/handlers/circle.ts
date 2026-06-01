import { MapContext } from 'app/context/map_context';
import { type ICircleProp, makeCircle } from 'app/lib/circle';
import { isRectangleNonzero } from 'app/lib/geometry';
import { useSetAtom } from 'jotai';
import noop from 'lodash/noop';
import { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { USelection } from 'state';
import { cursorStyleAtom, Mode, modeAtom, selectionAtom } from 'state/jotai';
import { CIRCLE_TYPE } from 'state/mode';
import type { HandlerContext, IFeature, Polygon, Position } from 'types';
import { createOrUpdateFeature, getMapCoord } from './utils';

function lngLatToPolygon(position: Position): Polygon {
  return {
    type: 'Polygon',
    coordinates: [[position, position, position, position]]
  };
}

export function useCircleHandlers({
  dragTargetRef,
  selection,
  featureMap,
  mode,
  rep
}: HandlerContext): Handlers {
  const multi = mode.modeOptions?.multi;
  const setSelection = useSetAtom(selectionAtom);
  const setMode = useSetAtom(modeAtom);
  const pmap = useContext(MapContext);
  const setCursor = useSetAtom(cursorStyleAtom);
  const transact = rep.useTransact();
  const [center, setCenter] = useState<Pos2 | null>(null);
  return {
    click: noop,
    move: (e) => {
      if (selection?.type !== 'single' || !center || !pmap) return;

      const wrappedFeature = featureMap.get(selection.id);

      if (wrappedFeature) {
        const feature = wrappedFeature.feature as IFeature<Polygon>;

        const geometry = makeCircle({
          center: center,
          mouse: e.lngLat.toArray() as Pos2,
          type: mode.modeOptions?.circleType || CIRCLE_TYPE.MERCATOR
        });

        return transact({
          putFeatures: [
            {
              ...wrappedFeature,
              feature: {
                ...feature,
                geometry
              }
            }
          ],
          quiet: true
        });
      }
    },
    down: (e) => {
      e.preventDefault();
      setCenter(e.lngLat.toArray() as Pos2);

      const center = getMapCoord(e);
      const polygon = lngLatToPolygon(center);

      const properties: ICircleProp = {
        '@circle': {
          type: mode.modeOptions?.circleType || CIRCLE_TYPE.MERCATOR,
          center
        }
      };

      const putFeature = createOrUpdateFeature({
        geometry: polygon,
        featureMap,
        selection,
        mode,
        properties
      });

      const id = putFeature.id;

      transact({
        note: 'Drew a circle',
        putFeatures: [putFeature]
      })
        .then(() => {
          setSelection(USelection.single(id));
        })
        .catch((e) => console.error(e as Error));
    },
    up: () => {
      dragTargetRef.current = null;
      if (selection?.type !== 'single') return;
      const wrappedFeature = featureMap.get(selection.id);
      if (wrappedFeature) {
        const feature = wrappedFeature.feature as IFeature<Polygon>;
        if (!isRectangleNonzero(feature)) {
          setSelection(USelection.none());
          setMode({ mode: Mode.NONE });
          toast('Click and drag to draw a circle.');
          return transact({
            note: 'Delete empty circle',
            deleteFeatures: [selection.id]
          });
        }
      }
      if (!multi) {
        setMode({ mode: Mode.NONE });
      } else {
        setSelection(USelection.none());
      }
      setCursor('');
    },
    enter() {
      setMode({ mode: Mode.NONE });
    },
    double: noop
  };
}
