/// <reference types="react/next" />

type Opaque<Type, Token = unknown> = Type & { readonly __opaque__: Token };

type BBox4 = [number, number, number, number];

type Pos2 = [number, number];
type RGBA = [number, number, number, number];

type VertexId = {
  type: 'vertex';
  featureId: number;
  vertex: number;
};

type FeatureId = {
  type: 'feature';
  featureId: number;
};

type MidpointId = {
  type: 'midpoint';
  featureId: number;
  vertex: number;
};

type Id = FeatureId | VertexId | MidpointId;

// Mapbox-land ID system
type RawId = Opaque<number, 'RawId'>;

// React-land ID system
type StringId = string;

type LayerScopedEvent = mapboxgl.MapMouseEvent & {
  features?: mapboxgl.MapboxGeoJSONFeature[];
} & mapboxgl.EventData;

type BothHandler = (
  arg0: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
) => Promisable<void>;

type TouchHandler = (arg0: mapboxgl.MapTouchEvent) => Promisable<void>;

type Handlers = {
  click: BothHandler;
  move: BothHandler;
  down: BothHandler;
  touchstart?: TouchHandler;
  touchmove?: TouchHandler;
  touchend?: TouchHandler;
  up: BothHandler;
  double: BothHandler;
  enter: () => Promisable<void>;
};
