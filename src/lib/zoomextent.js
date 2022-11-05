const bbox = require('@turf/bbox').default;

module.exports = function(context) {
  var bounds = bbox(context.data.get('map'));
  context.map.fitBounds(bounds, {
    padding: 50
  });
};
