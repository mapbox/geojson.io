const escape = require('escape-html'),
  geojsonRandom = require('geojson-random'),
  geojsonExtent = require('@mapbox/geojson-extent'),
  geojsonFlatten = require('geojson-flatten'),
  polyline = require('@mapbox/polyline'),
  wkx = require('wkx'),
  Buffer = require('buffer/').Buffer,
  zoomextent = require('../lib/zoomextent');

module.exports.adduserlayer = function (context, _url, _name) {
  const url = escape(_url),
    name = escape(_name);

  // reset the control if a user-layer was added before
  d3.select('.user-layer-button').remove();

  function addUserSourceAndLayer() {
    // if the source and layer aren't present, add them
    context.map.setStyle({
      name: 'user-layer',
      version: 8,
      sources: {
        'user-layer': {
          type: 'raster',
          tiles: [url],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'user-layer',
          type: 'raster',
          source: 'user-layer',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    });

    // make this layer's button active
    d3.select('.layer-switch .active').classed('active', false);
    d3.select('.user-layer-button').classed('active', true);

    context.data.set({
      mapStyleLoaded: true
    });
  }

  // append a button to the existing style selection UI
  d3.select('.layer-switch')
    .append('button')
    .attr('class', 'pad0x user-layer-button')
    .on('click', addUserSourceAndLayer)
    .text(name);

  addUserSourceAndLayer();
};

module.exports.zoomextent = function (context) {
  zoomextent(context);
};

module.exports.clear = function (context) {
  context.data.clear();
};

module.exports.random = function (context, count, type) {
  context.data.mergeFeatures(geojsonRandom(count, type).features, 'meta');
};

module.exports.bboxify = function (context) {
  context.data.set({ map: geojsonExtent.bboxify(context.data.get('map')) });
};

module.exports.flatten = function (context) {
  context.data.set({ map: geojsonFlatten(context.data.get('map')) });
};

module.exports.polyline = function (context) {
  const input = prompt('Enter your polyline');
  try {
    const decoded = polyline.toGeoJSON(input);
    context.data.set({ map: decoded });
  } catch (e) {
    alert('Sorry, we were unable to decode that polyline');
  }
};

module.exports.polyline6 = function (context) {
  const input = prompt('Enter your polyline');
  try {
    const decoded = polyline.toGeoJSON(input, 6);
    context.data.set({ map: decoded });
  } catch (e) {
    alert('Sorry, we were unable to decode that polyline');
  }
};

module.exports.wkxBase64 = function (context) {
  const input = prompt('Enter your Base64 encoded WKB/EWKB');
  try {
    const decoded = wkx.Geometry.parse(Buffer.from(input, 'base64'));
    context.data.set({ map: decoded.toGeoJSON() });
    zoomextent(context);
  } catch (e) {
    console.error(e);
    alert('Sorry, we were unable to decode that Base64 encoded WKX data');
  }
};

module.exports.wkxHex = function (context) {
  const input = prompt('Enter your Hex encoded WKB/EWKB');
  try {
    const decoded = wkx.Geometry.parse(Buffer.from(input, 'hex'));
    context.data.set({ map: decoded.toGeoJSON() });
    zoomextent(context);
  } catch (e) {
    console.error(e);
    alert('Sorry, we were unable to decode that Hex encoded WKX data');
  }
};

module.exports.wkxString = function (context) {
  const input = prompt('Enter your WKT/EWKT String');
  try {
    const decoded = wkx.Geometry.parse(input);
    context.data.set({ map: decoded.toGeoJSON() });
    zoomextent(context);
  } catch (e) {
    console.error(e);
    alert('Sorry, we were unable to decode that WKT data');
  }
};
