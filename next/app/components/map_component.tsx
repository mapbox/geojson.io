import { MapContextMenu } from 'app/components/map_context_menu';
import { MapContext } from 'app/context/map_context';
import { env } from 'app/lib/env_client';
import type { FlatbushLike } from 'app/lib/generate_flatbush_instance';
import { EmptyIndex } from 'app/lib/generate_flatbush_instance';
import { useHandlers } from 'app/lib/handlers/index';
import { CLICKABLE_LAYERS } from 'app/lib/load_and_augment_style';
import { wrappedFeaturesFromMapFeatures } from 'app/lib/map_component_utils';
import type { PMapHandlers } from 'app/lib/pmap';
import PMap from 'app/lib/pmap';
import { useZoomTo } from 'app/hooks/use_zoom_to';
import clsx from 'clsx';
import { captureException } from 'integrations/errors';
import throttle from 'lodash/throttle';
import mapboxgl from 'mapbox-gl';
import { ContextMenu as CM } from 'radix-ui';
import type React from 'react';
import {
  type MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  cursorStyleAtom,
  dataAtom,
  ephemeralStateAtom,
  styleConfigAtom,
  Mode,
  modeAtom,
  selectedFeaturesAtom,
  styleOptionsAtom
} from 'state/jotai';
import type { DragTarget, HandlerContext, IWrappedFeature } from 'types';
import { SYMBOLIZATION_NONE } from 'types';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useClipboard } from 'app/hooks/use_clipboard';
import { keybindingOptions } from 'app/hooks/use_map_keybindings';
import { DECK_SYNTHETIC_ID } from 'app/lib/constants';
import { usePersistence } from 'app/lib/persistence/context';
import { useHotkeys } from 'integrations/hotkeys';
import { useAtom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { LastSearchResult } from './search/last_search_result';
import { ModeHints } from './mode_hints';

mapboxgl.accessToken = env.MAPBOX_TOKEN;

mapboxgl.setRTLTextPlugin(
  'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
  (_err) => {
    // console.error(err);
  },
  true // Lazy load the plugin
);

export interface ContextInfo {
  features: ReturnType<typeof wrappedFeaturesFromMapFeatures>;
  selectedFeatures: IWrappedFeature[];
  position: Pos2;
}

export const MapComponent = memo(function MapComponent({
  setMap
}: {
  setMap: (arg0: PMap | null) => void;
}) {
  const data = useAtomValue(dataAtom);

  const styleConfig = useAtomValue(styleConfigAtom);

  const styleOptions = useAtomValue(styleOptionsAtom);

  const zoomTo = useZoomTo();

  const { featureMap } = data;
  // State
  const [flatbushInstance, setFlatbushInstance] =
    useState<FlatbushLike>(EmptyIndex);
  const [contextInfo, setContextInfo] = useState<ContextInfo | null>(null);

  const lastCursor = useRef<{
    cursorLatitude: number;
    cursorLongitude: number;
  }>({
    cursorLatitude: 0,
    cursorLongitude: 0
  });

  const rep = usePersistence();

  // Atom state
  const selection = data.selection;
  const ephemeralState = useAtomValue(ephemeralStateAtom);
  const mode = useAtomValue(modeAtom);
  const [cursor, setCursor] = useAtom(cursorStyleAtom);

  // Refs
  const mapRef: React.MutableRefObject<PMap | null> = useRef<PMap>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);

  const dragTargetRef: React.MutableRefObject<DragTarget | null> =
    useRef<DragTarget>(null);
  const mapHandlers = useRef<PMapHandlers>();

  // Context
  const map = useContext(MapContext);

  const transact = rep.useTransact();

  // Queries
  const [meta] = rep.useMetadata();
  const { label, symbolization } = meta;

  const currentLayer = meta.layer;
  useClipboard();

  // Track if initial zoom has been performed
  const hasZoomedRef = useRef(false);

  // useMap
  //
  // Receives
  // - map & map div refs
  //
  // Emits
  // - map state
  useEffect(() => {
    // Map has already been initialized
    if (mapRef.current) return;
    if (!mapDivRef.current || !mapHandlers) return;

    // This part is not time-sensitive.
    mapRef.current = new PMap({
      element: mapDivRef.current,
      styleConfig,
      handlers: mapHandlers as MutableRefObject<PMapHandlers>,
      symbolization: symbolization || SYMBOLIZATION_NONE,
      previewProperty: label,
      idMap: idMap,
      styleOptions
    });

    setMap(mapRef.current);

    return () => {
      setMap(null);
      if (mapRef.current && 'remove' in mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line
  }, [mapRef, mapDivRef, setMap]);

  // Zoom to initial features once map is ready
  // Used for handling features loaded from sessionStorage
  useEffect(() => {
    if (!map?.map || hasZoomedRef.current || featureMap.size === 0) return;

    const handleLoad = () => {
      const selectedFeatures = Array.from(featureMap.values());
      zoomTo(selectedFeatures);
      hasZoomedRef.current = true;
    };

    if (map.map.loaded()) {
      handleLoad();
    } else {
      map.map.once('load', handleLoad);
    }
  }, [map, featureMap, zoomTo]);

  useEffect(
    function mapSetDataMethods() {
      if (!map?.map) {
        return;
      }

      // These are all, hopefully, things that we can call
      // really often without performance issues because these inputs
      // stay the same and the functions skip if they're given the same input.
      // Ordering here, though, is tricky.
      map.setData({
        data,
        ephemeralState
      });

      map
        .setStyle({
          styleConfig,
          symbolization: symbolization || SYMBOLIZATION_NONE,
          previewProperty: label,
          styleOptions
        })
        .catch((e) => captureException(e));
    },
    [map, symbolization, data, styleConfig, ephemeralState, label, styleOptions]
  );

  const throttledMovePointer = useMemo(() => {
    function fastMovePointer(point: mapboxgl.Point) {
      if (!map) return;
      const features = map.map.queryRenderedFeatures(point, {
        layers: CLICKABLE_LAYERS
      });
      try {
        const syntheticUnderCursor = map.overlay.pickObject({
          ...point,
          layerIds: [DECK_SYNTHETIC_ID]
        });
        setCursor(syntheticUnderCursor || features.length ? 'move' : '');
      } catch (_e) {
        // Deck can throw here if it's just been initialized
        // or uninitialized.
        // console.error(e);
      }
    }
    return fastMovePointer;
  }, [map, setCursor]);

  const idMap = rep.idMap;

  const handlerContext: HandlerContext = {
    flatbushInstance,
    setFlatbushInstance,
    throttledMovePointer,
    mode,
    dragTargetRef,
    featureMap,
    idMap,
    selection,
    pmap: mapRef.current!,
    rep
  };

  const HANDLERS = useHandlers(handlerContext);

  // const log = false;

  const newHandlers: PMapHandlers = {
    onClick: (e: mapboxgl.MapMouseEvent) => {
      // if (log) console.log(`${mode.mode} click`);
      HANDLERS[mode.mode].click(e);
    },
    onMapMouseDown: (e: mapboxgl.MapMouseEvent) => {
      // if (log) console.log(`${mode.mode} down`);
      HANDLERS[mode.mode].down(e);
    },
    onMapTouchStart: (e: mapboxgl.MapTouchEvent) => {
      // if (log) console.log(`${mode.mode} down`);
      const handler = HANDLERS[mode.mode];
      if (handler.touchstart) {
        handler.touchstart(e);
      } else {
        handler.down(e);
      }
    },
    onMapMouseUp: (e: mapboxgl.MapMouseEvent) => {
      // if (log) console.log(`${mode.mode} up`);
      HANDLERS[mode.mode].up(e);
    },
    onMapTouchEnd: (e: mapboxgl.MapTouchEvent) => {
      // if (log) console.log(`${mode.mode} up`);
      const handler = HANDLERS[mode.mode];
      if (handler.touchend) {
        handler.touchend(e);
      } else {
        handler.up(e);
      }
    },
    onMapTouchMove: (e: mapboxgl.MapTouchEvent) => {
      // if (log) console.log(`${mode.mode} up`);
      const handler = HANDLERS[mode.mode];
      if (handler.touchmove) {
        handler.touchmove(e);
      } else {
        handler.move(e);
      }
    },
    onMapMouseMove: (e: mapboxgl.MapMouseEvent) => {
      // if (log) console.log(`${mode.mode} move`);
      HANDLERS[mode.mode].move(e);
      const map = mapRef.current?.map;
      if (!map) return;
      lastCursor.current = {
        cursorLongitude: e.lngLat.lng,
        cursorLatitude: e.lngLat.lat
      };
    },
    onDoubleClick: (e: mapboxgl.MapMouseEvent) => {
      // if (log) console.log(`${mode.mode} double`);
      HANDLERS[mode.mode].double(e);
    },
    onMoveEnd() {},
    onMove: throttle((e: mapboxgl.MapboxEvent) => {
      const center = e.target.getCenter().toArray();
      const bounds = e.target.getBounds()?.toArray();
      return {
        center,
        bounds
      };
    }, 300)
  };

  useHotkeys(
    'Escape, Enter',
    () => {
      HANDLERS[mode.mode].enter();
    },
    keybindingOptions,
    [HANDLERS, mode]
  );

  mapHandlers.current = newHandlers;

  const onContextMenu = useAtomCallback(
    useCallback(
      (get, _set, event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const { featureMap } = get(dataAtom);
        const mapDivBox = mapDivRef.current?.getBoundingClientRect();
        const map = mapRef.current;
        if (mapDivBox && map) {
          const featureUnderMouse = map.map.queryRenderedFeatures(
            [event.pageX - mapDivBox.left, event.pageY - mapDivBox.top],
            {
              layers: CLICKABLE_LAYERS
            }
          );

          const position = map.map
            .unproject([
              event.pageX - mapDivBox.left,
              event.pageY - mapDivBox.top
            ])
            .toArray() as Pos2;

          const selectedFeatures = get(selectedFeaturesAtom);

          setContextInfo({
            features: wrappedFeaturesFromMapFeatures(
              featureUnderMouse,
              featureMap,
              rep.idMap
            ),
            position,
            selectedFeatures
          });
        }
      },
      [mapDivRef, rep]
    )
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      setContextInfo((contextInfo) => {
        if (!open && contextInfo) {
          return null;
        }
        return contextInfo;
      });
    },
    [setContextInfo]
  );

  return (
    <CM.Root modal={false} onOpenChange={onOpenChange}>
      <CM.Trigger asChild onContextMenu={onContextMenu}>
        <div
          className={clsx(
            'top-0 bottom-0 left-0 right-0 mapboxgl-map',
            cursor === 'move'
              ? 'cursor-move'
              : {
                  'geojsonio-cursor-default':
                    mode.mode === Mode.NONE ||
                    mode.mode === Mode.DRAW_POLYGON ||
                    mode.mode === Mode.DRAW_LINE,
                  'geojsonio-cursor-point': mode.mode === Mode.DRAW_POINT,
                  'geojsonio-cursor-crosshair':
                    mode.mode === Mode.DRAW_RECTANGLE ||
                    mode.mode === Mode.LASSO
                }
          )}
          ref={mapDivRef}
          data-testid="map"
          style={{
            position: 'absolute'
          }}
        ></div>
      </CM.Trigger>
      <MapContextMenu contextInfo={contextInfo} />
      <LastSearchResult />
      <ModeHints />
    </CM.Root>
  );
});
