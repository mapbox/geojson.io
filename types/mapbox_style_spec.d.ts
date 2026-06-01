declare module '@mapbox/mapbox-gl-style-spec' {
  export function validate(any): any[];
  namespace expression {
    export function createExpression(def: mapboxgl.Expression): {
      value: {
        evaluate(globals: any, feature: IFeature): string;
      };
    };
  }
}
