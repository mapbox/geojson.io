import React from "react";
import { Subscribe } from "unstated";
import StateContainer from "../state";
import L from "leaflet";
import { layers } from "../layers";

export default () => (
  <Subscribe to={[StateContainer]}>
    {({ state: { layer }, setLayer }) => (
      <div className="pb2 ph2">
        {layers.map(({ id, title }) => (
          <button
            key={id}
            onClick={() => setLayer(id)}
            className={`pointer bn pv1 ph2 br2 br--bottom outline-0 f6 ${
              layer === id ? "bg-light-gray black" : "bg-white black-50"
            }`}
          >
            {title}
          </button>
        ))}
      </div>
    )}
  </Subscribe>
);
