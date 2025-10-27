const geojsonRandom = require('geojson-random'),
  geojsonExtent = require('@mapbox/geojson-extent'),
  geojsonFlatten = require('geojson-flatten'),
  polyline = require('@mapbox/polyline'),
  wkx = require('wkx'),
  Buffer = require('buffer/').Buffer,
  zoomextent = require('../lib/zoomextent'),
  openlr = require('openlr-js');

function isValidTileUrl(url) {
  try {
    const u = new URL(url);

    // Must use HTTPS
    if (u.protocol !== 'https:') return false;

    // Optional: check that {z}, {x}, {y} placeholders are present
    const hasPlaceholders =
      url.includes('{z}') && url.includes('{x}') && url.includes('{y}');
    if (!hasPlaceholders) return false;

    return true;
  } catch (e) {
    // Invalid URL format
    return false;
  }
}

function isValidTilesetName(name) {
  const trimmed = name.trim();
  return (
    /^[a-zA-Z0-9 ]+$/.test(trimmed) &&
    trimmed.length >= 3 &&
    trimmed.length <= 25
  );
}

module.exports.adduserlayer = function (context, url, name) {
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

  try {
    if (!isValidTileUrl(url)) {
      throw new Error(
        'Invalid tile URL. Must be HTTPS and include {z}, {x}, {y}.'
      );
    }

    if (!isValidTilesetName(name)) {
      throw new Error(
        'Invalid tileset name. Must be 3-25 characters long and contain only alphanumeric characters and spaces.'
      );
    }

    // reset the control if a user-layer was added before
    d3.select('.user-layer-button').remove();

    // append a button to the existing style selection UI
    d3.select('.layer-switch')
      .append('button')
      .attr('class', 'pad0x user-layer-button')
      .on('click', addUserSourceAndLayer)
      .text(name);

    addUserSourceAndLayer(url);
  } catch (e) {
    alert(e.message);
  }
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

module.exports.openLR = function (context) {
  const openLrInput = prompt(
    'Enter your OpenLR String(s) - comma separated for multiple'
  );
  try {
    // Split by comma and trim whitespace
    const openLrStrings = openLrInput
      .split(',')
      .map((s) => s.trim().trim('"'))
      .filter((s) => s.length > 0);

    const BinaryDecoder = openlr.BinaryDecoder;
    const binaryDecoder = new BinaryDecoder();
    const LocationReference = openlr.LocationReference;
    const Serializer = openlr.Serializer;

    const allFeatures = [];
    const errors = [];

    // Process each OpenLR string
    for (const openLrString of openLrStrings) {
      try {
        const openLrBinary = Buffer.from(openLrString, 'base64');
        const locationReference = LocationReference.fromIdAndBuffer(
          'binary',
          openLrBinary
        );
        const rawLocationReference =
          binaryDecoder.decodeData(locationReference);
        const jsonObject = Serializer.serialize(rawLocationReference);

        switch (jsonObject.type) {
          case 'RawLineLocationReference':
            {
              const coordinates = jsonObject.properties._points.properties.map(
                ({ properties }) => [
                  properties._longitude,
                  properties._latitude
                ]
              );
              allFeatures.push({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: coordinates
                },
                properties: {
                  raw: jsonObject,
                  input: openLrString
                }
              });
            }
            break;
          case 'RawGeoCoordLocationReference':
            {
              const point = jsonObject.properties._geoCoord.properties;
              allFeatures.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [point._longitude, point._latitude]
                },
                properties: {
                  raw: jsonObject,
                  input: openLrString
                }
              });
            }
            break;
          case 'RawPolygonLocationReference':
            {
              const polygonCorners = jsonObject.properties._corners.properties;
              const polygonCoordinates = polygonCorners.map((point) => [
                point.properties._longitude,
                point.properties._latitude
              ]);
              allFeatures.push({
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [[...polygonCoordinates]]
                },
                properties: {
                  raw: jsonObject,
                  input: openLrString
                }
              });
            }
            break;
          default:
            errors.push(
              `Unsupported OpenLR location type: ${jsonObject.type} for input: ${openLrString}`
            );
        }
      } catch (e) {
        errors.push(`Failed to decode: ${openLrString.substring(0, 20)}...`);
        console.error(`Error decoding ${openLrString}:`, e);
      }
    }

    if (allFeatures.length > 0) {
      const geojson = {
        type: 'FeatureCollection',
        features: allFeatures
      };
      context.data.set({ map: geojson });
      zoomextent(context);

      if (errors.length > 0) {
        alert(
          `Successfully decoded ${
            allFeatures.length
          } features, but encountered ${errors.length} error(s):\n${errors.join(
            '\n'
          )}`
        );
      }
    } else {
      alert(
        'Sorry, we were unable to decode any OpenLR data:\n' + errors.join('\n')
      );
    }
  } catch (e) {
    console.error(e);
    alert('Sorry, we were unable to decode that OpenLR data');
  }
};
