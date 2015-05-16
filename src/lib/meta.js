var escape = require('escape-html'),
    geojsonRandom = require('geojson-random'),
    geojsonExtent = require('geojson-extent'),
    geojsonFlatten = require('geojson-flatten'),
    zoomextent = require('../lib/zoomextent');

module.exports.adduserlayer = function(context, _url, _name) {
    var url = escape(_url), name = escape(_name);
    var layer = L.tileLayer(url);
    if (context.layerControl) {
        context.map.addLayer(layer);
        context.layerControl.addOverlay(layer, name);
    }
    else {
        context.layerControl = L.control.layers(null, {}, {
            position: 'bottomright',
            collapsed: false
        }).addTo(context.map).addOverlay(layer, name);
        context.map.addLayer(layer);
    }
};

module.exports.zoomextent = function(context) {
    zoomextent(context);
};

module.exports.clear = function(context) {
    context.data.clear();
};

module.exports.random = function(context, count, type) {
    context.data.mergeFeatures(geojsonRandom(count, type).features, 'meta');
};

module.exports.bboxify = function(context) {
    context.data.set({ map: geojsonExtent.bboxify(context.data.get('map')) });
};

module.exports.flatten = function(context) {
    context.data.set({ map: geojsonFlatten(context.data.get('map')) });
};
