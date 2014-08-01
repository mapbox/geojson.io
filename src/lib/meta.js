var geojsonRandom = require('geojson-random'),
    geojsonExtent = require('geojson-extent');

module.exports.clear = function(context) {
    context.data.clear();
};

module.exports.random = function(context, count, type) {
    context.data.mergeFeatures(geojsonRandom(count, type).features, 'meta');
};

module.exports.bboxify = function(context) {
    context.data.set({ map: geojsonExtent.bboxify(context.data.get('map')) });
};
