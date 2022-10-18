const escape = require('escape-html');

const popup = require('../../lib/popup');
const ClickableMarker = require('./clickable_marker');

const markers = [];

const addIds = (geojson) => {
  if (geojson.type === 'FeatureCollection') {
    return {
      ...geojson,
      features: geojson.features.map((feature, i) => {
        return {
          ...feature,
          id: i,
        };
      }),
    };
  }
  
  return geojson;
};
  
const addMarkers = (geojson, map, context) => {
  markers.forEach((d) => {
    d.remove();
  });
  let pointFeatures = [];
  let pointFeaturesIndices = [];
  // add markers
  if (geojson.features) {
    geojson.features.forEach((d, i) => {
      if (d.geometry.type === 'Point') {
        pointFeatures.push(d);
        pointFeaturesIndices.push(i);
      }
    });
  }
  
  if (pointFeatures.length === 0) {
    return;
  }
  
  pointFeatures.map((d, i) => {
    const marker = new ClickableMarker({
      color: '#7e7e7e',
    })
      .setLngLat(d.geometry.coordinates)
      .onClick(() => {
        bindPopup(
          {
            lngLat: d.geometry.coordinates,
            features: [
              {
                id: pointFeaturesIndices[i],
                ...d,
              },
            ],
          },
          context
        );
      })
      .addTo(map);
    markers.push(marker);
  });
};
function geojsonToLayer(geojson, map, context) {
  if (map.isStyleLoaded()) {
    map.getSource('map-data').setData(addIds(geojson));
  
    addMarkers(geojson, map, context);
  }
}
  
function bindPopup(e, context, writable, recentlyCreatedFeature) {
  // don't show a popup when drawing new features
  if ((context.Draw.getMode() !== 'simple_select') || recentlyCreatedFeature) return;
  recentlyCreatedFeature = false;
    
  const [feature] = e.features;
  var props = feature.properties;
  var table = '';
  var info = '';
  
  var properties = {};
  
  // Steer clear of XSS
  for (var k in props) {
    var esc = escape(k);
    // users don't want to see "[object Object]"
    if (typeof props[k] === 'object') {
      properties[esc] = escape(JSON.stringify(props[k]));
    } else {
      properties[esc] = escape(props[k]);
    }
  }
  
  if (!properties) return;
  
  if (!Object.keys(properties).length) properties = { '': '' };
  
  for (var key in properties) {
    table +=
        '<tr><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="text" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></td></tr>';
  }
  
  if (feature && feature.geometry) {
    info += '<table class="metadata">';
    if (feature.geometry.type === 'LineString') {
      var total = turf.length(feature) * 1000;
      info +=
          '<tr><td>Meters</td><td>' +
          total.toFixed(2) +
          '</td></tr>' +
          '<tr><td>Kilometers</td><td>' +
          (total / 1000).toFixed(2) +
          '</td></tr>' +
          '<tr><td>Feet</td><td>' +
          (total / 0.3048).toFixed(2) +
          '</td></tr>' +
          '<tr><td>Yards</td><td>' +
          (total / 0.9144).toFixed(2) +
          '</td></tr>' +
          '<tr><td>Miles</td><td>' +
          (total / 1609.34).toFixed(2) +
          '</td></tr>';
    } else if (feature.geometry.type === 'Point') {
      info +=
          '<tr><td>Latitude </td><td>' +
          feature.geometry.coordinates[1].toFixed(4) +
          '</td></tr>' +
          '<tr><td>Longitude</td><td>' +
          feature.geometry.coordinates[0].toFixed(4) +
          '</td></tr>';
    } else if (feature.geometry.type === 'Polygon') {
      info +=
          '<tr><td>Sq. Meters</td><td>' +
          turf.area(feature.geometry).toFixed(2) +
          '</td></tr>' +
          '<tr><td>Sq. Kilometers</td><td>' +
          (turf.area(feature.geometry) / 1000000).toFixed(2) +
          '</td></tr>' +
          '<tr><td>Sq. Feet</td><td>' +
          (turf.area(feature.geometry) / 0.092903).toFixed(2) +
          '</td></tr>' +
          '<tr><td>Acres</td><td>' +
          (turf.area(feature.geometry) / 4046.86).toFixed(2) +
          '</td></tr>' +
          '<tr><td>Sq. Miles</td><td>' +
          (turf.area(feature.geometry) / 2589990).toFixed(2) +
          '</td></tr>';
    }
    info += '</table>';
  }
  
  var tabs =
      '<div class="pad1 tabs-ui clearfix col12">' +
      '<div class="tab col12">' +
      '<input class="hide" type="radio" id="properties" name="tab-group" checked="true">' +
      '<label class="keyline-top keyline-right tab-toggle pad0 pin-bottomleft z10 center col6" for="properties">Properties</label>' +
      '<div class="space-bottom1 col12 content">' +
      '<table class="space-bottom0 marker-properties">' +
      table +
      '</table>' +
      (writable
        ? '<div class="add-row-button add fl col3"><span class="icon-plus"> Add row</div>'
        : '') +
      '</div>' +
      '</div>' +
      '<div class="space-bottom2 tab col12">' +
      '<input class="hide" type="radio" id="info" name="tab-group">' +
      '<label class="keyline-top tab-toggle pad0 pin-bottomright z10 center col6" for="info">Info</label>' +
      '<div class="space-bottom1 col12 content">' +
      '<div class="marker-info">' +
      info +
      ' </div>' +
      '</div>' +
      '</div>' +
      '</div>';
  
  var content =
      tabs +
      (writable
        ? '<div class="clearfix col12 pad1 keyline-top">' +
          '<div class="pill col6">' +
          '<button class="save col6 major">Save</button> ' +
          '<button class="minor col6 cancel">Cancel</button>' +
          '</div>' +
          '<button class="col6 text-right pad0 delete-invert"><span class="icon-remove-sign"></span> Delete feature</button></div>'
        : '');
  
  new mapboxgl.Popup({
    closeButton: false,
    maxWidth: '251px',
    className: 'geojsonio-feature',
  })
    .setLngLat(e.lngLat)
    .setHTML(content)
    .on('open', (e) => {
      // bind popup event listeners
      popup(context)(e, feature.id);
    })
    .addTo(context.map);
}

module.exports = {
  addIds,
  addMarkers,
  geojsonToLayer,
  bindPopup
};
  