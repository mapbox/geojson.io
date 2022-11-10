// this mode extends the build-in linestring tool, displaying the current length
// of the line as the user draws using a point feature and a symbol layer
const MapboxDraw = require('@mapbox/mapbox-gl-draw');

const { getDisplayMeasurements } = require('./util.js');

const ExtendedLineStringMode = {
  ...MapboxDraw.modes.draw_line_string,

  toDisplayFeatures: function (state, geojson, display) {
    const isActiveLine = geojson.properties.id === state.line.id;
    geojson.properties.active = isActiveLine ? 'true' : 'false';
    if (!isActiveLine) return display(geojson);
    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) return;
    geojson.properties.meta = 'feature';
    display({
      type: 'Feature',
      properties: {
        meta: 'vertex',
        parent: state.line.id,
        coord_path: `${
          state.direction === 'forward'
            ? geojson.geometry.coordinates.length - 2
            : 1
        }`,
        active: 'false'
      },
      geometry: {
        type: 'Point',
        coordinates:
          geojson.geometry.coordinates[
            state.direction === 'forward'
              ? geojson.geometry.coordinates.length - 2
              : 1
          ]
      }
    });

    display(geojson);

    const displayMeasurements = getDisplayMeasurements(geojson);

    // create custom feature for the current pointer position
    const currentVertex = {
      type: 'Feature',
      properties: {
        meta: 'currentPosition',
        radius: `${displayMeasurements.metric}\n${displayMeasurements.standard}`,
        parent: state.line.id
      },
      geometry: {
        type: 'Point',
        coordinates:
          geojson.geometry.coordinates[geojson.geometry.coordinates.length - 1]
      }
    };

    display(currentVertex);
  }
};

module.exports = ExtendedLineStringMode;
