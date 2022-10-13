module.exports = function (map, feature) {
  var zoomLevel;

  if (feature.geometry.type === 'Point') {
    map.flyTo({
      center: feature.geometry.coordinates,
    });
  } else {
    const bounds = turf.bbox(feature);
    map.fitBounds(bounds, { padding: 60 });
  }
};
