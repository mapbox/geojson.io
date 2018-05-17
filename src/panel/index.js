import React from "react";
import { Subscribe } from "unstated";
import StateContainer from "../state";
import Help from "./help";
import Code from "./json";
import Table from "./table";

export default () => {
  return (
    <Subscribe to={[StateContainer]}>
      {({ state: { mode, geojson } }) =>
        mode === "code" ? (
          <Code geojson={geojson} />
        ) : mode === "table" ? (
          <Table geojson={geojson} />
        ) : (
          <Help />
        )
      }
    </Subscribe>
  );
};
