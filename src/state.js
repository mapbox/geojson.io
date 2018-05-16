import { Container } from "unstated";

export default class StateContainer extends Container {
  state = { mode: "code", layer: "mapbox" };
  setMode = mode => {
    this.setState({ mode });
  };
  setLayer = layer => {
    this.setState({ layer });
  };
}
