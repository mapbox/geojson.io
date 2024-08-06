const turfLength = require('@turf/length').default;
const numeral = require('numeral');

function getDisplayMeasurements(feature) {
  // should log both metric and standard display strings for the current drawn feature

  // metric calculation
  const drawnLength = turfLength(feature) * 1000; // meters

  let metricUnits = 'm';
  let metricFormat = '0,0';
  let metricMeasurement;

  let standardUnits = 'ft';
  let standardFormat = '0,0';
  let standardMeasurement;

  metricMeasurement = drawnLength;
  if (drawnLength >= 1000) {
    // if over 1000 meters, upgrade metric
    metricMeasurement = drawnLength / 1000;
    metricUnits = 'km';
    metricFormat = '0.00';
  }

  standardMeasurement = drawnLength * 3.28084;
  if (standardMeasurement >= 5280) {
    // if over 5280 feet, upgrade standard
    standardMeasurement /= 5280;
    standardUnits = 'mi';
    standardFormat = '0.00';
  }

  const displayMeasurements = {
    metric: `${numeral(metricMeasurement).format(metricFormat)} ${metricUnits}`,
    standard: `${numeral(standardMeasurement).format(
      standardFormat
    )} ${standardUnits}`
  };
  return displayMeasurements;
}

module.exports = {
  getDisplayMeasurements
};
