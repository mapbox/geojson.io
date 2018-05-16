var L = require("leaflet");
var sanitize = require("sanitize-caja");

var token =
  "pk.eyJ1IjoidG1jdyIsImEiOiJjamJ6eXpkd2EwMndoMzRtb3B6NjkyZG85In0.8kzWTUAe9DL5YzckMAEYfA";

// mapbox-related markers functionality
// provide an icon from mapbox's simple-style spec and hosted markers
// service
function icon(fp, options) {
  fp = fp || {};

  var sizes = {
      small: [20, 50],
      medium: [30, 70],
      large: [35, 90]
    },
    size = fp["marker-size"] || "medium",
    symbol =
      "marker-symbol" in fp && fp["marker-symbol"] !== ""
        ? "-" + fp["marker-symbol"]
        : "",
    color = (fp["marker-color"] || "7e7e7e").replace("#", "");

  return L.icon({
    iconUrl:
      "https://a.tiles.mapbox.com/v4/marker/" +
      "pin-" +
      size.charAt(0) +
      symbol +
      "+" +
      color +
      // detect and use retina markers, which are x2 resolution
      (L.Browser.retina ? "@2x" : "") +
      ".png?access_token=" +
      token,
    iconSize: sizes[size],
    iconAnchor: [sizes[size][0] / 2, sizes[size][1] / 2],
    popupAnchor: [0, -sizes[size][1] / 2]
  });
}

function strip_tags(_) {
  return _.replace(/<[^<]+>/g, "");
}

// a factory that provides markers for Leaflet from Mapbox's
// [simple-style specification](https://github.com/mapbox/simplestyle-spec)
// and [Markers API](http://mapbox.com/developers/api/#markers).
function style(f, latlon, options) {
  return L.marker(latlon, {
    icon: icon(f.properties, options),
    title: strip_tags(sanitize((f.properties && f.properties.title) || ""))
  });
}

module.exports = { icon, style };
