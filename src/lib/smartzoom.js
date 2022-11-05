const bbox = require('@turf/bbox').default;

module.exports = function (map, feature) {
  var zoomLevel;

  if (feature.geometry.type === 'Point') {
    map.flyTo({
      center: feature.geometry.coordinates,
    });
  } else {
    const bounds = bbox(feature);
    map.fitBounds(bounds, { padding: 60 });
  }
};
