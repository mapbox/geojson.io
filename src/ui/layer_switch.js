var L = require("leaflet");
var d3 = require("d3");
module.exports = function(context) {
  var token =
    "pk.eyJ1IjoidG1jdyIsImEiOiJjamJ6eXpkd2EwMndoMzRtb3B6NjkyZG85In0.8kzWTUAe9DL5YzckMAEYfA";

  return function(selection) {
    var layers = [
      {
        title: "Mapbox",
        layer: L.tileLayer(
          "https://b.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}@2x.png?access_token=" +
            token
        )
      },
      {
        title: "Satellite",
        layer: L.tileLayer(
          "https://b.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=" +
            token
        )
      },
      {
        title: "OSM",
        layer: L.tileLayer("https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        })
      }
    ];

    var layerSwap = function(d) {
      var clicked = this instanceof d3.selection ? this.node() : this;
      layerButtons.classed("active", function() {
        return clicked === this;
      });
      layers.forEach(swap);
      function swap(l) {
        var datum = d instanceof d3.selection ? d.datum() : d;
        if (l.layer == datum.layer) context.map.addLayer(datum.layer);
        else if (context.map.hasLayer(l.layer))
          context.map.removeLayer(l.layer);
      }
    };

    var layerButtons = selection
      .append("div")
      .attr("class", "layer-switch")
      .selectAll("button")
      .data(layers);

    layerButtons = layerButtons
      .enter()
      .append("button")
      .attr("class", "pad0x")
      .on("click", layerSwap)
      .text(function(d) {
        return d.title;
      })
      .merge(layerButtons);

    layerButtons
      .filter(function(d, i) {
        return i === 0;
      })
      .call(layerSwap);
  };
};
