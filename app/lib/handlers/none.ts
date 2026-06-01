import { useAltHeld, useSpaceHeld } from 'app/hooks/use_held';
import { CURSOR_DEFAULT, DECK_SYNTHETIC_ID } from 'app/lib/constants';
import {
  type FlatbushLike,
  generateFeaturesFlatbushInstance,
  generateVertexFlatbushInstance
} from 'app/lib/generate_flatbush_instance';
import { decodeId, encodeVertex } from 'app/lib/id';
import { UIDMap } from 'app/lib/id_mapper';
import * as utils from 'app/lib/map_component_utils';
import * as ops from 'app/lib/map_operations';
import { useEndSnapshot, useStartSnapshot } from 'app/lib/persistence/shared';
import { captureException } from 'integrations/errors';
import { useSetAtom } from 'jotai';
import noop from 'lodash/noop';
import { useRef } from 'react';
import { USelection } from 'state';
import {
  cursorStyleAtom,
  ephemeralStateAtom,
  Mode,
  selectionAtom
} from 'state/jotai';
import { modeAtom } from 'state/mode';
import type { HandlerContext, IWrappedFeature } from 'types';
import { getMapCoord, getSnappingCoordinates } from './utils';

export const getAllFeatures = ({
  featureMap
}: {
  featureMap: Map<string, IWrappedFeature>;
}) => {
  const features: IWrappedFeature[] = [];
  for (const feature of featureMap.values()) {
    features.push(feature);
  }
  return features;
};

export function useNoneHandlers({
  setFlatbushInstance,
  throttledMovePointer,
  dragTargetRef,
  selection,
  featureMap,
  idMap,
  mode,
  rep,
  pmap
}: HandlerContext): Handlers {
  const setEphemeralState = useSetAtom(ephemeralStateAtom);
  const setMode = useSetAtom(modeAtom);
  const setSelection = useSetAtom(selectionAtom);
  const setCursor = useSetAtom(cursorStyleAtom);
  const transact = rep.useTransact();
  const endSnapshot = useEndSnapshot();
  const startSnapshot = useStartSnapshot();
  const lastPoint = useRef<mapboxgl.LngLat | null>(null);
  const spaceHeld = useSpaceHeld();
  const altHeld = useAltHeld();

  const handlers: Handlers = {
    double: noop,
    down: (e) => {
      lastPoint.current = e.lngLat;

      // If this is a right-click, ignore it. The context menu
      // will handle it.
      if ('button' in e.originalEvent && e.originalEvent.button === 2) {
        return;
      }

      const { shiftKey } = e.originalEvent;

      // Start a lasso operation:
      // - Switch to lasso mode
      // - Set the ephemeral state
      // - Generate the index
      // - Prevent this from being a drag
      if (shiftKey) {
        let index: undefined | FlatbushLike;

        if (selection.type === 'single') {
          const feature = featureMap.get(selection.id);
          if (!feature) return;
          if (feature.feature.geometry?.type === 'Point') {
            // If you have a point selected, there's no point
            // in selecting "vertexes" because it only has one.
            // Instead, act as if you didn’t have a single
            // feature selection.

            index = generateFeaturesFlatbushInstance(
              getAllFeatures({ featureMap })
            );
          } else {
            index = generateVertexFlatbushInstance(
              feature,
              UIDMap.getIntID(idMap, selection.id)
            );
          }
        } else {
          index = generateFeaturesFlatbushInstance(
            getAllFeatures({ featureMap })
          );
        }

        if (index) {
          setFlatbushInstance(index);
          setMode({ mode: Mode.LASSO });
          setEphemeralState({
            type: 'lasso',
            box: [e.lngLat.toArray() as Pos2, e.lngLat.toArray() as Pos2]
          });

          if (selection.type === 'multi') {
            setSelection((selection) => {
              if (selection.type !== 'multi') {
                return selection;
              }
              return {
                type: 'multi',
                ids: selection.ids,
                previousIds: selection.ids
              };
            });
          }
        }
        // // TODO
        e.preventDefault();

        return;
      }

      const selectedIds = USelection.toIds(selection);
      if ((e.originalEvent.altKey || spaceHeld.current) && selectedIds.length) {
        // Maybe drag a whole feature
        dragTargetRef.current = selectedIds.slice();
        void startSnapshot(
          USelection.getSelectedFeatures({
            selection,
            featureMap
          })
        );
        e.preventDefault();
        return;
      }

      // Is this a potential drag or selection?
      // If there is a feature under the cursor, prevent this
      // from being a drag and set the current drag target.
      const feature = pmap.overlay.pickObject({
        ...e.point,
        layerIds: [DECK_SYNTHETIC_ID]
      });

      if (!feature?.object || selection.type !== 'single') {
        const fuzzyResult = utils.fuzzyClick(e, {
          idMap,
          featureMap,
          pmap
        });

        if (fuzzyResult) {
          const { wrappedFeature, id } = fuzzyResult;
          if (
            selection.type === 'single' &&
            selection.id !== wrappedFeature.id
          ) {
            void startSnapshot(wrappedFeature);
            dragTargetRef.current = id;
            setSelection(USelection.single(wrappedFeature.id));
          }
          e.preventDefault();
        }

        return;
      }
      e.preventDefault();

      const rawId = feature.object.id as RawId;
      const id = decodeId(rawId);
      const wrappedFeature = featureMap.get(selection.id);

      if (!wrappedFeature) {
        return;
      }

      // Splice a midpoint, if the drag target is a midpoint.
      if (id.type === 'midpoint') {
        const spliced = ops.spliceNewVertex({
          feature: wrappedFeature.feature,
          id,
          position: getMapCoord(e)
        });
        void startSnapshot(wrappedFeature);
        transact({
          putFeatures: [
            {
              ...wrappedFeature,
              feature: spliced
            }
          ]
        })
          .then(() => {
            dragTargetRef.current = encodeVertex(id.featureId, id.vertex + 1);
          })
          .catch((e) => captureException(e));

        return;
      }

      void startSnapshot(wrappedFeature);
      dragTargetRef.current = rawId;
      setCursor('pointer');
    },
    up: () => {
      dragTargetRef.current = null;
      void endSnapshot();
      setCursor(CURSOR_DEFAULT);
    },
    move: (e) => {
      if (dragTargetRef.current === null) {
        throttledMovePointer(e.point);
        return;
      }

      if (lastPoint.current === null) {
        lastPoint.current = e.lngLat;
      }

      const dragTarget = dragTargetRef.current;

      // Multiple items are selected. In this case,
      // we can rotate with the alt key, or move features
      // with just dragging. In order to get into this state
      // of being able to move multiple features, we needed
      // the space key held when the drag started.
      if (Array.isArray(dragTarget)) {
        if (e.originalEvent.altKey) {
          const a = lastPoint.current;
          lastPoint.current = e.lngLat;
          return transact({
            putFeatures: ops.rotateFeatures(
              dragTarget.map((uuid) => {
                return featureMap.get(uuid)!;
              }),
              a,
              e.lngLat
            ),
            quiet: true
          });
        } else {
          const dx = lastPoint.current.lng - e.lngLat.lng;
          const dy = lastPoint.current.lat - e.lngLat.lat;
          lastPoint.current = e.lngLat;
          return transact({
            putFeatures: dragTarget.map((uuid) => {
              const feature = featureMap.get(uuid)!;
              return {
                ...feature,
                feature: ops.moveFeature(feature.feature, dx, dy)
              };
            }),
            quiet: true
          });
        }
      } else if (selection.type === 'single') {
        // Otherwise, we are moving one vertex.
        const id = decodeId(dragTarget);
        switch (id.type) {
          case 'feature':
          case 'midpoint': {
            break;
          }
          case 'vertex': {
            const feature = featureMap.get(selection.id);
            if (!feature) return;

            let nextCoord = getMapCoord(e);
            if (altHeld.current) {
              nextCoord = getSnappingCoordinates(
                e,
                featureMap,
                pmap,
                idMap,
                selection.id
              ) as Pos2;
            }

            const { feature: newFeature, wasRectangle } = ops.setCoordinates({
              feature: feature.feature,
              position: nextCoord,
              breakRectangle: e.originalEvent.metaKey,
              vertexId: id
            });

            if (wasRectangle && !mode?.modeOptions?.hasResizedRectangle) {
              setMode((mode) => {
                return {
                  ...mode,
                  modeOptions: {
                    hasResizedRectangle: true
                  }
                };
              });
            }

            return transact({
              putFeatures: [
                {
                  ...feature,
                  feature: newFeature
                }
              ],
              quiet: true
            });
          }
        }
      }
    },
    click: (e) => {
      // Get the fuzzy feature. This is a mapboxgl feature
      // with only an id.
      const fuzzyResult = utils.fuzzyClick(e, {
        idMap,
        featureMap,
        pmap
      });

      // If there's a selection right now and someone clicked on
      // bare map, clear the selection.
      if (!fuzzyResult) {
        setSelection(USelection.none());
        setMode({ mode: Mode.NONE });
        return;
      }

      const { wrappedFeature, decodedId } = fuzzyResult;

      const feature = wrappedFeature.feature;
      // StringId
      const id = wrappedFeature.id;

      switch (decodedId.type) {
        case 'feature': {
          setSelection(USelection.single(id));
          break;
        }
        case 'vertex': {
          setSelection({
            type: 'single',
            parts: [decodedId],
            id
          });
          break;
        }
        case 'midpoint': {
          // Midpoint dragging is handled by the mousemove handler.
          break;
        }
      }

      if (feature.geometry === null) {
        return;
      }

      // If someone clicked on the first or last vertex of
      // a line, start drawing that line again.
      if (
        !(
          decodedId.type === 'vertex' &&
          feature.geometry.type === 'LineString' &&
          USelection.isVertexSelected(selection, id, decodedId)
        )
      ) {
        return;
      }
    },
    enter() {
      setSelection(USelection.none());
    }
  };

  return handlers;
}
