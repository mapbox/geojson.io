const bbox = require('@turf/bbox').default;

module.exports = function (context) {
  const geojson = context.data.get('map');
  // if the data is a single point, flyTo()
  if (
    geojson.features.filter((feature) => feature.geometry).length === 1 &&
    geojson.features[0].geometry.type === 'Point'
  ) {
    context.map.flyTo({
      center: geojson.features[0].geometry.coordinates,
      zoom: 6,
      duration: 1000
    });
  } else {
    const bounds = bbox(geojson);
    context.map.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  }
};
