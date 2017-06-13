var escape = require('escape-html'),
    geojsonRandom = require('geojson-random'),
    geojsonExtent = require('geojson-extent'),
    geojsonFlatten = require('geojson-flatten'),
    polyline = require('polyline'),
    wkx = require('wkx'),
    zoomextent = require('../lib/zoomextent');

module.exports.adduserlayer = function(context, _url, _name) {
    var url = escape(_url), name = escape(_name);
    var layer = L.tileLayer(url, {
        maxZoom: context.map.getMaxZoom()
    });
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

module.exports.polyline = function(context) {
    var input = prompt('Enter your polyline');
    try {
        var decoded = polyline.toGeoJSON(input);
        context.data.set({ map: decoded });
    } catch(e) {
        alert('Sorry, we were unable to decode that polyline');
    }
};

module.exports.wkxBase64 = function(context) {
    var input = prompt('Enter your Base64 encoded WKB/EWKB');
    try {
        var decoded = wkx.Geometry.parse(Buffer.from(input,'base64'));
        context.data.set({ map: decoded.toGeoJSON() });
        zoomextent(context);
    } catch(e) {
        console.error(e);
        alert('Sorry, we were unable to decode that Base64 encoded WKX data');
    }
};

module.exports.wkxHex = function(context) {
    var input = prompt('Enter your Hex encoded WKB/EWKB');
    try {
        var decoded = wkx.Geometry.parse(Buffer.from(input,'hex'));
        context.data.set({ map: decoded.toGeoJSON() });
        zoomextent(context);
    } catch(e) {
        console.error(e);
        alert('Sorry, we were unable to decode that Hex encoded WKX data');
    }
};

module.exports.wkxString = function(context) {
    var input = prompt('Enter your WKT/EWKT String');
    try {
        var decoded = wkx.Geometry.parse(input);
        context.data.set({ map: decoded.toGeoJSON() });
        zoomextent(context);
    } catch(e) {
        console.error(e);
        alert('Sorry, we were unable to decode that WKT data');
    }
};
