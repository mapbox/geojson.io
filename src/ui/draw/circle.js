// custom mapbopx-gl-draw mode that extends draw_line_string
// shows a center point, radius line, and circle polygon while drawing
// forces draw.create on creation of second vertex

const numeral = require('numeral');

function circleFromTwoVertexLineString(geojson) {

  const center = geojson.geometry.coordinates[0];
  const radiusInKm = turf.lineDistance(geojson, 'kilometers');

  return turf.circle(center, radiusInKm);
}

function getDisplayMeasurements(feature) {
  // should log both metric and standard display strings for the current drawn feature
  
  // metric calculation
  const drawnLength = (turf.lineDistance(feature) * 1000); // meters

  let metricUnits = 'm';
  let metricFormat = '0,0';
  let metricMeasurement;

  let standardUnits = 'feet';
  let standardFormat = '0,0';
  let standardMeasurement;

  metricMeasurement = drawnLength;
  if (drawnLength >= 1000) { // if over 1000 meters, upgrade metric
    metricMeasurement = drawnLength / 1000;
    metricUnits = 'km';
    metricFormat = '0.00';
  }

  standardMeasurement = drawnLength * 3.28084;
  if (standardMeasurement >= 5280) { // if over 5280 feet, upgrade standard
    standardMeasurement /= 5280;
    standardUnits = 'mi';
    standardFormat = '0.00';
  }

  const displayMeasurements = {
    metric: `${numeral(metricMeasurement).format(metricFormat)} ${metricUnits}`,
    standard: `${numeral(standardMeasurement).format(standardFormat)} ${standardUnits}`,
  };
  return displayMeasurements;
}

const CircleMode = {
  ...MapboxDraw.modes.draw_line_string,

  clickAnywhere: function(state, e) {
    // this ends the drawing after the user creates a second point, triggering this.onStop
    if (state.currentVertexPosition === 1) {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
      return this.changeMode('simple_select', { featureIds: [state.line.id] });
    }

    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    if (state.direction === 'forward') {
      state.currentVertexPosition += 1;
      state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    } else {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    }
      
    return null;
  },

  onStop: function(state) {
    
    // remove last added coordinate
    state.line.removeCoordinate('0');
    if (state.line.isValid()) {
      const lineGeoJson = state.line.toGeoJSON();
      const circleFeature = circleFromTwoVertexLineString(lineGeoJson);

      this.map.fire('draw.create', {
        features: [circleFeature],
      });
    } else {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode('simple_select', {}, { silent: true });
    }
  },

  toDisplayFeatures: function(state, geojson, display) {
  
    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) return null;
  
    display({
      type: 'Feature',
      properties: {
        active: 'true'
      },
      geometry: {
        type: 'Point',
        coordinates: geojson.geometry.coordinates[0],
      },
    });
  
    // displays the line as it is drawn
    geojson.properties.active = 'true';
    display(geojson);
  
    const displayMeasurements = getDisplayMeasurements(geojson);
  
    // create custom feature for the current pointer position
    const currentVertex = {
      type: 'Feature',
      properties: {
        meta: 'currentPosition',
        radius: `${displayMeasurements.metric} ${displayMeasurements.standard}`,
        parent: state.line.id,
      },
      geometry: {
        type: 'Point',
        coordinates: geojson.geometry.coordinates[1],
      },
    };
  
    display(currentVertex);
  
    const circleFeature = circleFromTwoVertexLineString(geojson);
    
    circleFeature.properties = {
      active: 'true'
    };
  
    display(circleFeature);
  
    return null;
  }
};




module.exports = CircleMode;