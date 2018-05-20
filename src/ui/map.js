import React from "react";
import Draw from "leaflet-draw";
import L from "leaflet";
import marker from "../map/marker";
import { layers } from "../layers";
import geojsonRewind from "geojson-rewind";
import simplestyle from "./simplestyle";
var makiValues = require("../../data/maki.json");
import LGeo from "leaflet-geodesy";
// require("qs-hash");
// require("../lib/custom_hash.js");
//
// var popup = require("../lib/popup"),
//   escape = require("escape-html"),
//
let maki = "";
for (var i = 0; i < makiValues.length; i++) {
  maki += '<option value="' + makiValues[i].icon + '">';
}

export default class Map extends React.Component {
  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
  }
  componentDidMount() {
    let map = new L.Map(this.mapRef.current);
    const { layer } = this.props;
    L.control
      .scale()
      .setPosition("bottomright")
      .addTo(map);
    map.zoomControl.setPosition("topright");
    // L.hash(map);
    let mapLayer = L.featureGroup().addTo(map);
    const metric =
      navigator.language !== "en-us" && navigator.language !== "en-US";
    let drawControl = new L.Control.Draw({
      position: "topright",
      edit: { featureGroup: mapLayer },
      draw: {
        circle: false,
        polyline: {
          metric
        },
        polygon: {
          metric
        },
        marker: {
          icon: marker.icon({})
        }
      }
    }).addTo(map);
    map.setView([20, 0], 2);

    map.attributionControl.setPrefix(
      '<a target="_blank" href="http://geojson.net/about.html">About</a>'
    );

    const baseLayerGroup = L.layerGroup().addTo(map);
    layers.find(({ id }) => id === layer).layer.addTo(baseLayerGroup);
    map
      .on("draw:edited", this.updateFromMap)
      .on("draw:deleted", this.updateFromMap)
      .on("draw:created", this.createFromMap);
    this.setState({
      map,
      baseLayerGroup,
      mapLayer
    });
  }
  createFromMap = e => {
    const { mapLayer } = this.state;
    mapLayer.addLayer(e.layer);
    this.updateFromMap();
  };
  updateFromMap = () => {
    const { setGeojson } = this.props;
    const { mapLayer } = this.state;
    let geojson = geojsonRewind(mapLayer.toGeoJSON());
    setGeojson(geojson);
  };
  componentDidUpdate(prevProps, prevState) {
    console.log("map -> componentDidUpdate");
    const { layer, geojson } = this.props;
    const { baseLayerGroup, mapLayer, map } = this.state;
    if (prevProps.layer !== layer) {
      baseLayerGroup
        .clearLayers()
        .addLayer(layers.find(({ id }) => id === layer).layer);
    }
    geojsonToLayer(geojson, mapLayer);
  }
  render() {
    return <div className="flex-auto" ref={this.mapRef} />;
  }
}
function layerToGeoJSON(layer) {
  var features = [];
  layer.eachLayer(collect);
  function collect(l) {
    if ("toGeoJSON" in l) features.push(l.toGeoJSON());
  }
  return {
    type: "FeatureCollection",
    features: features
  };
}

function geojsonToLayer(geojson, layer) {
  layer.clearLayers();
  L.geoJson(geojson, {
    style: simplestyle,
    pointToLayer: function(feature, latlon) {
      if (!feature.properties) feature.properties = {};
      return marker.style(feature, latlon);
    }
  }).eachLayer(add);

  function add(l) {
    bindPopup(l);
    l.addTo(layer);
  }
}

function bindPopup(l) {
  var props = JSON.parse(JSON.stringify(l.toGeoJSON().properties)),
    table = "",
    info = "";

  var properties = {};

  // Steer clear of XSS
  for (var k in props) {
    var e = escape(k);
    // users don't want to see "[object Object]"
    if (typeof props[k] === "object") {
      properties[e] = escape(JSON.stringify(props[k]));
    } else {
      properties[e] = escape(props[k]);
    }
  }

  if (!properties) return;

  if (!Object.keys(properties).length) properties = { "": "" };

  if (l.feature && l.feature.geometry) {
    if (
      l.feature.geometry.type === "Point" ||
      l.feature.geometry.type === "MultiPoint"
    ) {
      if (!("marker-color" in properties)) {
        table +=
          '<tr class="style-row"><th><input type="text" value="marker-color"' +
          " /></th>" +
          '<td><input type="color" value="#7E7E7E"' +
          " /></td></tr>";
      }
      if (!("marker-size" in properties)) {
        table +=
          '<tr class="style-row"><th><input type="text" value="marker-size"' +
          " /></th>" +
          '<td><input type="text" list="marker-size" value="medium"' +
          ' /><datalist id="marker-size"><option value="small"><option value="medium"><option value="large"></datalist></td></tr>';
      }
      if (!("marker-symbol" in properties)) {
        table +=
          '<tr class="style-row"><th><input type="text" value="marker-symbol"' +
          " /></th>" +
          '<td><input type="text" list="marker-symbol" value=""' +
          ' /><datalist id="marker-symbol">' +
          maki +
          "</datalist></td></tr>";
      }
    }
    if (
      l.feature.geometry.type === "LineString" ||
      l.feature.geometry.type === "MultiLineString" ||
      l.feature.geometry.type === "Polygon" ||
      l.feature.geometry.type === "MultiPolygon"
    ) {
      if (!("stroke" in properties)) {
        table +=
          '<tr class="style-row"><th><input type="text" value="stroke"' +
          " /></th>" +
          '<td><input type="color" value="#555555"' +
          " /></td></tr>";
      }
      if (!("stroke-width" in properties)) {
        table +=
          '<tr class="style-row"><th><input type="text" value="stroke-width"' +
          " /></th>" +
          '<td><input type="number" min="0" step="0.1" value="2"' +
          " /></td></tr>";
      }
      if (!("stroke-opacity" in properties)) {
        table +=
          '<tr class="style-row"><th><input type="text" value="stroke-opacity"' +
          " /></th>" +
          '<td><input type="number" min="0" max="1" step="0.1" value="1"' +
          " /></td></tr>";
      }
    }
    if (
      l.feature.geometry.type === "Polygon" ||
      l.feature.geometry.type === "MultiPolygon"
    ) {
      if (!("fill" in properties)) {
        table +=
          '<tr class="style-row"><th><input type="text" value="fill"' +
          " /></th>" +
          '<td><input type="color" value="#555555"' +
          " /></td></tr>";
      }
      if (!("fill-opacity" in properties)) {
        table +=
          '<tr class="style-row"><th><input type="text" value="fill-opacity"' +
          " /></th>" +
          '<td><input type="number" min="0" max="1" step="0.1" value="0.5"' +
          " /></td></tr>";
      }
    }
  }

  for (var key in properties) {
    if (key == "marker-color" || key == "stroke" || key == "fill") {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        " /></th>" +
        '<td><input type="color" value="' +
        properties[key] +
        '"' +
        " /></td></tr>";
    } else if (key == "marker-size") {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        " /></th>" +
        '<td><input type="text" list="marker-size" value="' +
        properties[key] +
        '"' +
        ' /><datalist id="marker-size"><option value="small"><option value="medium"><option value="large"></datalist></td></tr>';
    } else if (key == "marker-symbol") {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        " /></th>" +
        '<td><input type="text" list="marker-symbol" value="' +
        properties[key] +
        '"' +
        ' /><datalist id="marker-symbol">' +
        maki +
        "</datalist></td></tr>";
    } else if (key == "stroke-width") {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        " /></th>" +
        '<td><input type="number" min="0" step="0.1" value="' +
        properties[key] +
        '"' +
        " /></td></tr>";
    } else if (key == "stroke-opacity" || key == "fill-opacity") {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        " /></th>" +
        '<td><input type="number" min="0" max="1" step="0.1" value="' +
        properties[key] +
        '"' +
        " /></td></tr>";
    } else {
      table +=
        '<tr><th><input type="text" value="' +
        key +
        '"' +
        " /></th>" +
        '<td><input type="text" value="' +
        properties[key] +
        '"' +
        " /></td></tr>";
    }
  }

  if (l.feature && l.feature.geometry) {
    info += '<table class="metadata">';
    if (l.feature.geometry.type === "LineString") {
      var total = d3
        .pairs(l.feature.geometry.coordinates)
        .reduce(function(total, pair) {
          return (
            total +
            L.latLng(pair[0][1], pair[0][0]).distanceTo(
              L.latLng(pair[1][1], pair[1][0])
            )
          );
        }, 0);
      info +=
        "<tr><td>Meters</td><td>" +
        total.toFixed(2) +
        "</td></tr>" +
        "<tr><td>Kilometers</td><td>" +
        (total / 1000).toFixed(2) +
        "</td></tr>" +
        "<tr><td>Feet</td><td>" +
        (total / 0.3048).toFixed(2) +
        "</td></tr>" +
        "<tr><td>Yards</td><td>" +
        (total / 0.9144).toFixed(2) +
        "</td></tr>" +
        "<tr><td>Miles</td><td>" +
        (total / 1609.34).toFixed(2) +
        "</td></tr>";
    } else if (l.feature.geometry.type === "Point") {
      info +=
        "<tr><td>Latitude </td><td>" +
        l.feature.geometry.coordinates[1].toFixed(4) +
        "</td></tr>" +
        "<tr><td>Longitude</td><td>" +
        l.feature.geometry.coordinates[0].toFixed(4) +
        "</td></tr>";
    } else if (l.feature.geometry.type === "Polygon") {
      info +=
        "<tr><td>Sq. Meters</td><td>" +
        LGeo.area(l).toFixed(2) +
        "</td></tr>" +
        "<tr><td>Sq. Kilometers</td><td>" +
        (LGeo.area(l) / 1000000).toFixed(2) +
        "</td></tr>" +
        "<tr><td>Sq. Feet</td><td>" +
        (LGeo.area(l) / 0.092903).toFixed(2) +
        "</td></tr>" +
        "<tr><td>Acres</td><td>" +
        (LGeo.area(l) / 4046.86).toFixed(2) +
        "</td></tr>" +
        "<tr><td>Sq. Miles</td><td>" +
        (LGeo.area(l) / 2589990).toFixed(2) +
        "</td></tr>";
    }
    info += "</table>";
  }

  var tabs =
    '<div class="pad1 tabs-ui clearfix col12">' +
    '<div class="tab col12">' +
    '<input class="hide" type="radio" id="properties" name="tab-group" checked="true">' +
    '<label class="keyline-top keyline-right tab-toggle pad0 pin-bottomleft z10 center col6" for="properties">Properties</label>' +
    '<div class="space-bottom1 col12 content">' +
    '<table class="space-bottom0 marker-properties">' +
    table +
    "</table>" +
    //   ? '<div class="add-row-button add fl col3"><span class="icon-plus"> Add row</div>' +
    //     '<div class="fl text-right col9"><input type="checkbox" id="show-style" name="show-style" value="true" checked><label for="show-style">Show style properties</label></div>'
    //   : "") +
    "</div>" +
    "</div>" +
    '<div class="space-bottom2 tab col12">' +
    '<input class="hide" type="radio" id="info" name="tab-group">' +
    '<label class="keyline-top tab-toggle pad0 pin-bottomright z10 center col6" for="info">Info</label>' +
    '<div class="space-bottom1 col12 content">' +
    '<div class="marker-info">' +
    info +
    " </div>" +
    "</div>" +
    "</div>" +
    "</div>";

  var content = tabs;
  //   ? '<div class="clearfix col12 pad1 keyline-top">' +
  //     '<div class="pill col6">' +
  //     '<button class="save col6 major">Save</button> ' +
  //     '<button class="minor col6 cancel">Cancel</button>' +
  //     "</div>" +
  //     '<button class="col6 text-right pad0 delete-invert"><span class="icon-remove-sign"></span> Delete feature</button></div>'
  //  : "");

  l.bindPopup(
    L.popup(
      {
        closeButton: false,
        maxWidth: 500,
        maxHeight: 400,
        autoPanPadding: [5, 45],
        className: "geojsonio-feature"
      },
      l
    ).setContent(content)
  );

  l.on("popupopen", function(e) {
    if (showStyle === false) {
      d3.select("#show-style").property("checked", false);
      d3.selectAll(".style-row").style("display", "none");
    }
    d3.select("#show-style").on("click", function() {
      if (this.checked) {
        showStyle = true;
        d3.selectAll(".style-row").style("display", "");
      } else {
        showStyle = false;
        d3.selectAll(".style-row").style("display", "none");
      }
    });
  });
}
