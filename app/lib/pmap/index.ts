import { _GlobeView as GlobeView } from '@deck.gl/core';
import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { colorFromPresence } from 'app/lib/color';
import { loadMakiIcons } from 'app/lib/maki';
import type { CameraPosition } from 'app/lib/parse_map_param';
import {
  CURSOR_DEFAULT,
  DECK_LASSO_ID,
  DECK_SYNTHETIC_ID,
  emptySelection,
  LASSO_DARK_YELLOW,
  LASSO_YELLOW,
  LINE_COLORS_SELECTED_RGB,
  WHITE
} from 'app/lib/constants';
import type { IDMap } from 'app/lib/id_mapper';
import loadAndAugmentStyle, {
  EPHEMERAL_SOURCE_NAME,
  FEATURES_SOURCE_NAME
} from 'app/lib/load_and_augment_style';
import { makeRectangle } from 'app/lib/pmap/merge_ephemeral_state';
import { splitFeatureGroups } from 'app/lib/pmap/split_feature_groups';
import { shallowArrayEqual } from 'app/lib/utils';
import mapboxgl from 'mapbox-gl';
import type {
  Data,
  EphemeralEditingState,
  PreviewProperty,
  Sel,
  CustomRasterLayer
} from 'state/jotai';
import type {
  Feature,
  IFeatureCollection,
  IPresence,
  ISymbolization,
  IStyleConfig,
  Point,
  StyleOptions
} from 'types';

const MAP_OPTIONS: Omit<mapboxgl.MapboxOptions, 'container'> = {
  style: { version: 8, layers: [], sources: {} },
  maxZoom: 26,
  boxZoom: false,
  attributionControl: false,
  fadeDuration: 0
};

const cursorSvg = (color: string) => {
  const div = document.createElement('div');
  div.style.color = color;
  div.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7 17L1 1L17 7L10 10L7 17Z" stroke="white" fill="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
</svg>
`;
  return div;
};

type ClickEvent = mapboxgl.MapMouseEvent;
type MoveEvent = mapboxgl.MapboxEvent;

export type PMapHandlers = {
  onClick: (e: ClickEvent) => void;
  onDoubleClick: (e: ClickEvent) => void;
  onMapMouseUp: (e: mapboxgl.MapMouseEvent) => void;
  onMapMouseMove: (e: mapboxgl.MapMouseEvent) => void;
  onMapTouchMove: (e: mapboxgl.MapTouchEvent) => void;
  onMapMouseDown: (e: mapboxgl.MapMouseEvent) => void;
  onMapTouchStart: (e: mapboxgl.MapTouchEvent) => void;
  onMoveEnd: (e: mapboxgl.MapboxEvent) => void;
  onMapTouchEnd: (e: mapboxgl.MapTouchEvent) => void;
  onMove: (e: mapboxgl.MapboxEvent) => void;
};

const lastValues = new WeakMap<mapboxgl.GeoJSONSource, Feature[]>();

/**
 * Memoized set data for a mapboxgl.GeoJSONSource. If
 * the same source is called with the same data,
 * it won't set.
 */
function mSetData(
  source: mapboxgl.GeoJSONSource,
  newData: Feature[],
  _label: string,
  force?: boolean
) {
  if (!shallowArrayEqual(lastValues.get(source), newData) || force) {
    source.setData({
      type: 'FeatureCollection',
      features: newData
    } as IFeatureCollection);
    lastValues.set(source, newData);
  } else {
    // console.log(
    //   "Skipped update",
    //   _label,
    //   source,
    //   newData,
    //   lastValues.get(source)
    // );
  }
}

export default class PMap {
  map: mapboxgl.Map;
  handlers: React.MutableRefObject<PMapHandlers>;
  idMap: IDMap;

  lastSelection: Sel;
  lastSelectionIds: Set<RawId>;
  lastData: Data | null;
  lastEphemeralState: EphemeralEditingState;
  lastSymbolization: ISymbolization | null;
  presenceMarkers: Map<IPresence['userId'], mapboxgl.Marker>;
  lastLayer: IStyleConfig | null;
  lastPreviewProperty: PreviewProperty;
  lastStyleOptions: StyleOptions | null;
  lastCustomRasterLayers: CustomRasterLayer[] | null;
  overlay: MapboxOverlay;

  // Sequence counter to prevent stale setStyle calls from overwriting newer ones.
  // Incremented on each setStyle call; only the most recent call applies its result.
  private _setStyleSeq = 0;

  // Stored state for per-frame globe projection correction
  private _deckSyntheticData: Feature[] = [];
  private _deckSelectionIds: Set<RawId> = new Set();
  private _deckEphemeralState: EphemeralEditingState = { type: 'none' };

  constructor({
    element,
    styleConfig,
    handlers,
    previewProperty,
    symbolization,
    idMap,
    controlsCorner = 'bottom-left',
    styleOptions,
    initialCamera
  }: {
    element: HTMLDivElement;
    styleConfig: IStyleConfig;
    handlers: React.MutableRefObject<PMapHandlers>;
    symbolization: ISymbolization;
    previewProperty: PreviewProperty;
    idMap: IDMap;
    controlsCorner?: Parameters<mapboxgl.Map['addControl']>[1];
    styleOptions: StyleOptions;
    initialCamera?: CameraPosition;
  }) {
    this.idMap = idMap;
    const positionOptions = initialCamera
      ? {
          center: [initialCamera.lng, initialCamera.lat] as mapboxgl.LngLatLike,
          zoom: initialCamera.zoom,
          bearing: initialCamera.bearing,
          pitch: initialCamera.pitch
        }
      : {
          center: [0, 20] as mapboxgl.LngLatLike,
          zoom: 2
        };

    const map = new mapboxgl.Map({
      container: element,
      ...MAP_OPTIONS,
      ...positionOptions
    });

    this.overlay = new MapboxOverlay({
      interleaved: false,
      layers: []
    });

    map.addControl(this.overlay as any);

    // Registered AFTER addControl so it fires after MapboxOverlay._updateViewState,
    // ensuring the deck viewport reflects the current frame before we rebuild layers.
    map.on('render', this._syncDeckLayers);

    map.addControl(
      new mapboxgl.GeolocateControl({
        showUserLocation: false,
        showAccuracyCircle: false,
        positionOptions: {
          enableHighAccuracy: true
        }
      }),
      controlsCorner
    );
    map.addControl(new mapboxgl.NavigationControl({}), controlsCorner);
    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true
      })
    );
    map.getCanvas().style.cursor = CURSOR_DEFAULT;
    map.on('click', this.onClick);
    map.on('mousedown', this.onMapMouseDown);
    map.on('mousemove', this.onMapMouseMove);
    map.on('dblclick', this.onMapDoubleClick);
    map.on('mouseup', this.onMapMouseUp);
    map.on('moveend', this.onMoveEnd);
    map.on('moveend', this._syncDeckLayers);
    map.on('touchend', this.onMapTouchEnd);
    map.on('move', this.onMove);

    map.on('touchstart', this.onMapTouchStart);
    map.on('touchmove', this.onMapTouchMove);
    map.on('touchend', this.onMapTouchEnd);
    map.on('style.load', this.onMapStyleLoad);

    this.presenceMarkers = new Map();
    this.lastSymbolization = symbolization;

    this.lastSelection = { type: 'none' };
    this.lastSelectionIds = emptySelection;
    this.lastData = null;
    this.lastEphemeralState = { type: 'none' };
    this.lastLayer = null;
    this.lastPreviewProperty = null;
    this.lastStyleOptions = null;
    this.lastCustomRasterLayers = null;
    this.handlers = handlers;
    this.map = map;
    void this.setStyle({
      styleConfig,
      symbolization,
      previewProperty: previewProperty,
      styleOptions
    });
  }

  /**
   * Handler proxies --------------------------------------
   */
  onClick = (e: LayerScopedEvent) => {
    this.handlers.current.onClick(e);
  };

  onMapMouseDown = (e: LayerScopedEvent) => {
    this.handlers.current.onMapMouseDown(e);
  };

  onMapTouchStart = (e: mapboxgl.MapTouchEvent) => {
    this.handlers.current.onMapTouchStart(e);
  };

  onMapMouseUp = (e: LayerScopedEvent) => {
    this.handlers.current.onMapMouseUp(e);
  };

  onMoveEnd = (e: MoveEvent) => {
    this.handlers.current.onMoveEnd(e);
  };

  onMapTouchEnd = (e: mapboxgl.MapTouchEvent) => {
    this.handlers.current.onMapTouchEnd(e);
  };

  onMove = (e: MoveEvent) => {
    this.handlers.current.onMove(e);
  };

  onMapMouseMove = (e: mapboxgl.MapMouseEvent) => {
    this.handlers.current.onMapMouseMove(e);
  };

  onMapTouchMove = (e: mapboxgl.MapTouchEvent) => {
    this.handlers.current.onMapTouchMove(e);
  };

  onMapStyleLoad = (event: mapboxgl.MapEvent) => {
    const map = event.target as mapboxgl.Map;
    // disable terrain. If enabled in the style (as in Mapbox Standard style), it causes an alignment bug in the deck.gl overlay
    map.setTerrain(null);
    // set projection to last known value (if any) so that style reloads don't reset it to default
    map.setProjection(this.lastStyleOptions?.mapProjection ?? 'globe');
    // Load maki icons as SDF so they can be recolored via icon-color. Done here rather than on
    // idle so the replace happens before tiles are painted, avoiding a visible flash.
    void loadMakiIcons(map);
  };

  onMapDoubleClick = (e: mapboxgl.MapMouseEvent) => {
    this.handlers.current.onDoubleClick(e);
  };

  setPresences(presences: IPresence[]) {
    const ids = new Set(presences.map((p) => p.userId));
    for (const presence of presences) {
      const marker =
        this.presenceMarkers.get(presence.userId) ??
        new mapboxgl.Marker(cursorSvg(colorFromPresence(presence)));
      marker
        .setLngLat([presence.cursorLongitude, presence.cursorLatitude])
        .addTo(this.map);
      this.presenceMarkers.set(presence.userId, marker);
    }
    // Remove stale presences
    for (const [id, marker] of this.presenceMarkers.entries()) {
      if (!ids.has(id)) {
        marker.remove();
        this.presenceMarkers.delete(id);
      }
    }
  }

  /**
   * The central hard method, trying to optimize feature updates
   * on the map.
   */
  setData({
    data,
    ephemeralState,
    force = false
  }: {
    data: Data;
    ephemeralState: EphemeralEditingState;
    force?: boolean;
  }) {
    if (!(this.map && (this.map as any).style)) {
      this.lastData = data;
      return;
    }

    const featuresSource = this.map.getSource(
      FEATURES_SOURCE_NAME
    ) as mapboxgl.GeoJSONSource;

    const ephemeralSource = this.map.getSource(
      EPHEMERAL_SOURCE_NAME
    ) as mapboxgl.GeoJSONSource;

    if (!featuresSource || !ephemeralSource) {
      // Set the lastFeatureList here
      // so that the setStyle method will
      // add it again. This happens when the map
      // is initially loaded.
      this.lastData = data;
      return;
    }

    const groups = splitFeatureGroups({
      idMap: this.idMap,
      data,
      lastSymbolization: this.lastSymbolization,
      previewProperty: this.lastPreviewProperty
    });

    // console.log(
    //   "in setData",
    //   JSON.stringify({
    //     newSelection,
    //     outputIds: [...groups.selectionIds],
    //   })
    // );
    // TODO: fix flash
    mSetData(ephemeralSource, groups.ephemeral, 'ephem');
    mSetData(featuresSource, groups.features, 'features', force);

    this._deckSyntheticData = groups.synthetic;
    this._deckSelectionIds = groups.selectionIds;
    this._deckEphemeralState = ephemeralState;
    this._syncDeckLayers();

    this.lastData = data;
    this.updateSelections(groups.selectionIds);
    this.lastEphemeralState = ephemeralState;
  }

  /**
   * Builds the ScatterplotLayer with globe-corrected vertex positions.
   *
   * deck.gl's GlobeViewport applies a latitude-dependent scaleAdjust that doesn't
   * match Mapbox GL JS's globe projection. We correct each point by round-tripping
   * through map.project() (Mapbox's exact globe math → screen pixels) and then
   * viewport.unproject() (screen pixels → the lng/lat that deck.gl maps there).
   * A fresh closure is created each call so deck.gl sees a new getPosition reference
   * and re-evaluates all positions.
   */
  private _buildScatterplotLayer(
    viewport: ReturnType<typeof GlobeView.prototype.makeViewport>
  ): ScatterplotLayer<Feature> {
    const map = this.map;
    const selectionIds = this._deckSelectionIds;

    const getPosition = viewport
      ? (d: Feature): [number, number] => {
          const [lng, lat] = (d.geometry as Point).coordinates as [
            number,
            number
          ];
          try {
            const pt = map.project([lng, lat]);
            const adjusted = viewport.unproject([pt.x, pt.y]) as number[];
            if (Number.isFinite(adjusted[0]) && Number.isFinite(adjusted[1])) {
              return [adjusted[0], adjusted[1]];
            }
          } catch {
            // fall through to original coords
          }
          return [lng, lat];
        }
      : (d: Feature) => (d.geometry as Point).coordinates as [number, number];

    return new ScatterplotLayer<Feature>({
      id: DECK_SYNTHETIC_ID,
      radiusUnits: 'pixels',
      lineWidthUnits: 'pixels',
      pickable: true,
      stroked: true,
      filled: true,
      billboard: true,
      data: this._deckSyntheticData,
      getPosition,
      // updateTriggers tells deck.gl to re-evaluate getPosition whenever the
      // viewport changes. Without this, deck.gl reuses the cached position
      // attribute buffer even though getPosition captures a new viewport closure.
      updateTriggers: {
        getPosition: viewport
          ? [
              map.getCenter().lng,
              map.getCenter().lat,
              map.getZoom(),
              map.getBearing(),
              map.getPitch()
            ]
          : []
      },
      getFillColor: (d) =>
        selectionIds.has(d.id as RawId) ? WHITE : LINE_COLORS_SELECTED_RGB,
      getLineColor: (d) =>
        selectionIds.has(d.id as RawId) ? LINE_COLORS_SELECTED_RGB : WHITE,
      getLineWidth: 1.5,
      getRadius: (d) => {
        const id = Number(d.id || 0);
        const fp = d.properties?.fp;
        if (fp) return 10;
        return id % 2 === 0 ? 5 : 3.5;
      }
    });
  }

  /**
   * Called on every Mapbox render event (after MapboxOverlay._updateViewState
   * has already updated the deck viewport for this frame). Rebuilds the deck
   * layers with fresh globe-corrected positions and forces an immediate redraw
   * so corrections apply in the same frame rather than one frame behind.
   */
  private _syncDeckLayers = () => {
    const ephemeralState = this._deckEphemeralState;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deckInst = (this.overlay as any)._deck;
    // Only apply globe correction when the map is actually in globe projection.
    // In Mercator mode, deck.gl and Mapbox agree on screen positions, so no
    // correction is needed (and passing a viewport would do unnecessary work).
    const isGlobe = this.map.getProjection()?.name === 'globe';

    // Use deck's own rendering viewport — it has a √2 scale factor vs a manually
    // constructed GlobeView.makeViewport(), so this is the only viewport that
    // produces correct round-trip corrections via map.project → viewport.unproject.
    const viewport =
      isGlobe && deckInst?.isInitialized
        ? deckInst.getViewports()?.[0]
        : undefined;

    this.overlay.setProps({
      layers: [
        this._buildScatterplotLayer(viewport),
        ephemeralState.type === 'lasso' &&
          new PolygonLayer<number[]>({
            id: DECK_LASSO_ID,
            data: [makeRectangle(ephemeralState)],
            visible: true,
            pickable: false,
            stroked: true,
            filled: true,
            lineWidthUnits: 'pixels',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            getPolygon: (d) => d,
            getFillColor: LASSO_YELLOW,
            getLineColor: LASSO_DARK_YELLOW,
            getLineWidth: 1
          })
      ]
    });

    // Force a second redraw this frame so corrected positions overwrite the
    // draw that _updateViewState already issued with stale positions.
    if (deckInst?.isInitialized) {
      deckInst.redraw();
    }
  };

  remove() {
    this.map.off('render', this._syncDeckLayers);
    this.map.off('moveend', this._syncDeckLayers);
    this.map.remove();
  }

  // Use { diff: false } to force a style load: otherwise
  // if we switch from a style to itself, we don't get
  // a style.load event.
  async setStyle({
    styleConfig,
    symbolization,
    previewProperty,
    styleOptions,
    customRasterLayers = []
  }: {
    styleConfig: IStyleConfig;
    symbolization: ISymbolization;
    previewProperty: PreviewProperty;
    styleOptions: StyleOptions;
    customRasterLayers?: CustomRasterLayer[];
  }) {
    // Check if custom raster layers changed
    const customRasterLayersChanged =
      JSON.stringify(this.lastCustomRasterLayers) !==
      JSON.stringify(customRasterLayers);

    // If only styleOptions changed, and the style has imports, update config properties instead of reloading style.
    // Only treat as a styleOptions-only change if the style is already applied to the map (features source exists).
    // Without this guard, the optimization fires on initial load when the map still has the empty placeholder style,
    // causing the in-flight style fetch to be discarded and leaving the map blank (especially in Firefox).
    const onlyStyleOptionsChanged =
      styleConfig === this.lastLayer &&
      symbolization === this.lastSymbolization &&
      previewProperty === this.lastPreviewProperty &&
      styleOptions !== this.lastStyleOptions &&
      !customRasterLayersChanged &&
      !!this.map.getSource(FEATURES_SOURCE_NAME);

    if (
      styleConfig === this.lastLayer &&
      symbolization === this.lastSymbolization &&
      previewProperty === this.lastPreviewProperty &&
      styleOptions === this.lastStyleOptions &&
      !customRasterLayersChanged
    ) {
      return;
    }

    // Stamp this call so we can discard results if a newer call supersedes it
    // (prevents a slow first fetch from overwriting a faster subsequent one).
    const seq = ++this._setStyleSeq;

    // Save previous styleOptions so we can compare individual fields after the async fetch.
    const prevStyleOptions = this.lastStyleOptions;

    // Always update last* values
    this.lastLayer = styleConfig;
    this.lastSymbolization = symbolization;
    this.lastPreviewProperty = previewProperty;
    this.lastStyleOptions = styleOptions;
    this.lastCustomRasterLayers = customRasterLayers;

    const style = await loadAndAugmentStyle({
      styleConfig,
      symbolization,
      previewProperty,
      styleOptions,
      customRasterLayers
    });

    if (seq !== this._setStyleSeq) return;

    // If only styleOptions changed and style has imports, update config properties instead of reloading style
    if (
      onlyStyleOptionsChanged &&
      style.imports &&
      Array.isArray(style.imports)
    ) {
      const labelProperties = [
        'showRoadLabels',
        'showPlaceLabels',
        'showTransitLabels',
        'showPointOfInterestLabels'
      ];
      for (const property of labelProperties) {
        this.map.setConfigProperty(
          'basemap',
          property,
          styleOptions.labelVisibility
        );
      }
      const show3d = styleOptions.show3dFeatures ?? true;
      for (const property of [
        'show3dOptions',
        'show3dBuildings',
        'show3dTrees',
        'show3dLandmarks',
        'show3dFacades'
      ]) {
        this.map.setConfigProperty('basemap', property, show3d);
      }
      this.map.setProjection(styleOptions.mapProjection ?? 'globe');
      return;
    }

    // For non-import styles (OSM, Outdoors, etc.) when only styleOptions changed:
    // setStyle(style) with the default diff:true would see no changes in the style JSON
    // (projection is not embedded in the style) and skip the reload, so style.load never
    // fires and setProjection in onMapStyleLoad never runs. Call setProjection directly
    // instead, and skip the style reload when only the projection changed.
    if (onlyStyleOptionsChanged) {
      this.map.setProjection(styleOptions.mapProjection ?? 'globe');
      const onlyProjectionChanged =
        prevStyleOptions?.labelVisibility === styleOptions.labelVisibility &&
        prevStyleOptions?.show3dFeatures === styleOptions.show3dFeatures;
      if (onlyProjectionChanged) return;

      // For classic styles, toggle label layer visibility without a full reload.
      if (prevStyleOptions?.labelVisibility !== styleOptions.labelVisibility) {
        const visibility = styleOptions.labelVisibility ? 'visible' : 'none';
        for (const layer of this.map.getStyle()?.layers ?? []) {
          if (
            layer.type === 'symbol' &&
            (layer.layout as mapboxgl.SymbolLayout | undefined)?.[
              'text-field'
            ] !== undefined
          ) {
            this.map.setLayoutProperty(layer.id, 'visibility', visibility);
          }
        }
        const onlyLabelsChanged =
          prevStyleOptions?.show3dFeatures === styleOptions.show3dFeatures;
        if (onlyLabelsChanged) return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.map.setStyle(style, { diff: false } as any);

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (this.lastData) {
      this.setData({
        data: this.lastData,
        ephemeralState: this.lastEphemeralState,
        force: true
      });
      this.lastSelection = { type: 'none' };
    }
  }

  private updateSelections(newSet: Set<RawId>) {
    if (!this.map || !(this.map as any).style) return;
    const oldSet = this.lastSelectionIds;
    const tmpSet = new Set(newSet);
    // let adds = 0;
    // let removes = 0;

    // In new set, but not in old set: add to selection
    for (const id of tmpSet) {
      if (!oldSet.has(id)) {
        // If this selection id is a base feature, make all of its
        // vertexes visible
        this.map.setFeatureState(
          {
            source: FEATURES_SOURCE_NAME,
            id
          },
          {
            state: 'selected'
          }
        );
        tmpSet.delete(id);
        // adds++;
      }
    }

    // In old set, but not in new set: remove from selection
    for (const id of oldSet) {
      if (!tmpSet.has(id)) {
        this.map.removeFeatureState(
          {
            source: FEATURES_SOURCE_NAME,
            id
          },
          'state'
        );
        // removes++;
      }
    }

    // if (adds || removes) {
    //   console.log("adds", adds, "removes", removes);
    // }

    this.lastSelectionIds = newSet;
  }
}
