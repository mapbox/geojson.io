import React from "react";
import Help from "./help";
import Code from "./json";
import Table from "./table";

export default ({ mode, geojson, setGeojson }) => {
  return mode === "code" ? (
    <Code geojson={geojson} setGeojson={setGeojson} />
  ) : mode === "table" ? (
    <Table geojson={geojson} setGeojson={setGeojson} />
  ) : (
    <Help />
  );
};
