import React from "react";
import ReactDOM from "react-dom";
import { Provider, Subscribe } from "unstated";
import Help from "./panel/help";
import LayerSwitch from "./ui/layer_switch";
import FileBar from "./ui/file_bar";
import ModeButtons from "./ui/mode_buttons";
import User from "./ui/user";
import Map from "./ui/map";
import Panel from "./panel/index";
import StateContainer from "./state";

ReactDOM.render(
  <Provider>
    <div className="vh-100 flex sans-serif black-70">
      <div className="w-50 flex flex-column">
        <div className="bg-white pt2 ph2 flex justify-between">
          <FileBar />
        </div>
        <Subscribe to={[StateContainer]}>
          {({ state: { layer } }) => <Map layer={layer} />}
        </Subscribe>
        <LayerSwitch />
      </div>
      <div className="w-50 bl b--black-10 bg-light-gray">
        <div className="bg-white pt2 ph2 flex justify-between">
          <ModeButtons />
          <User />
        </div>
        <Panel />
      </div>
    </div>
  </Provider>,
  document.getElementById("geojsonio")
);
