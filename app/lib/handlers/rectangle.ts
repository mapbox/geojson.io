import { MapContext } from 'app/context/map_context';
import { isRectangleNonzero } from 'app/lib/geometry';
import replaceCoordinates from 'app/lib/replace_coordinates';
import { captureException } from 'integrations/errors';
import { useSetAtom } from 'jotai';
import noop from 'lodash/noop';
import { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { USelection } from 'state';
import { cursorStyleAtom, Mode, modeAtom, selectionAtom } from 'state/jotai';
import type { HandlerContext, IFeature, Polygon, Position } from 'types';
import { createOrUpdateFeature, getMapCoord } from './utils';

function lngLatToPolygon(position: Position): Polygon {
  return {
    type: 'Polygon',
    coordinates: [[position, position, position, position]]
  };
}

export function useRectangleHandlers({
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
  const [firstCorner, setFirstCorner] = useState<mapboxgl.Point | null>(null);
  return {
    click: noop,
    move: (e) => {
      if (selection?.type !== 'single' || !firstCorner || !pmap) return;
      const shiftKey = e.originalEvent.shiftKey;

      const wrappedFeature = featureMap.get(selection.id);
      if (wrappedFeature) {
        const feature = wrappedFeature.feature as IFeature<Polygon>;
        const point = {
          x: e.point.x,
          y: e.point.y
        };

        if (shiftKey) {
          const xDelta = point.x - firstCorner.x;
          const yDelta = point.y - firstCorner.y;
          const size = Math.max(Math.abs(xDelta), Math.abs(yDelta));
          point.x = firstCorner.x + Math.sign(xDelta) * size;
          point.y = firstCorner.y + Math.sign(yDelta) * size;
        }

        const map = pmap.map;

        const newRing = [
          firstCorner,
          [point.x, firstCorner.y] as Pos2,
          [point.x, point.y] as Pos2,
          [firstCorner.x, point.y] as Pos2,
          firstCorner
        ].map((ll) => map.unproject(ll).toArray());
        return transact({
          putFeatures: [
            {
              ...wrappedFeature,
              feature: replaceCoordinates(feature, [newRing])
            }
          ],
          quiet: true
        });
      }
    },
    down: (e) => {
      e.preventDefault();
      setFirstCorner(e.point);

      const polygon = lngLatToPolygon(getMapCoord(e));

      const putFeature = createOrUpdateFeature({
        geometry: polygon,
        featureMap,
        selection,
        mode
      });

      const id = putFeature.id;

      transact({
        note: 'Drew a rectangle',
        putFeatures: [putFeature]
      })
        .then(() => {
          setSelection(USelection.single(id));
        })
        .catch((e) => captureException(e as Error));
    },
    up: () => {
      dragTargetRef.current = null;
      if (selection?.type !== 'single') return;
      const wrappedFeature = featureMap.get(selection.id);
      if (wrappedFeature) {
        const feature = wrappedFeature.feature as IFeature<Polygon>;
        if (!isRectangleNonzero(feature)) {
          setSelection(USelection.none());
          toast('Click and drag to draw a rectangle.');
          return transact({
            note: 'Delete empty rectangle',
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
