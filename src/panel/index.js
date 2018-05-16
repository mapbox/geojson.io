import React from "react";
import { Subscribe } from "unstated";
import StateContainer from "../state";
import Help from "./help";
import Code from "./json";

export default () => {
  return (
    <Subscribe to={[StateContainer]}>
      {state =>
        state.state.mode === "code" ? (
          "code"
        ) : state.state.mode === "table" ? (
          "table"
        ) : (
          <Help />
        )
      }
    </Subscribe>
  );
};
