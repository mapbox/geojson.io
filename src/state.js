import { Container } from "unstated";

export default class StateContainer extends Container {
  state = {
    mode: "code",
    layer: "mapbox",
    geojson: { type: "FeatureCollection", features: [] }
  };
  setMode = mode => {
    this.setState({ mode });
  };
  setLayer = layer => {
    this.setState({ layer });
  };
}
