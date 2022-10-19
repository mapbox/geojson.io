module.exports = function(context) {
  var bounds = turf.bbox(context.data.get('map'));
  context.map.fitBounds(bounds, {
    padding: 50
  });
};
