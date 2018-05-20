const token =
  "pk.eyJ1IjoidG1jdyIsImEiOiJjamJ6eXpkd2EwMndoMzRtb3B6NjkyZG85In0.8kzWTUAe9DL5YzckMAEYfA";

export const layers = [
  {
    title: "Mapbox",
    id: "mapbox",
    layer: L.tileLayer(
      "https://b.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}@2x.png?access_token=" +
        token
    )
  },
  {
    title: "Satellite",
    id: "satellite",
    layer: L.tileLayer(
      "https://b.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=" +
        token
    )
  },
  {
    title: "OSM",
    id: "osm",
    layer: L.tileLayer("https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
    })
  }
];
