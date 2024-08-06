const mapboxgl = require('mapbox-gl');
const escape = require('escape-html');
const length = require('@turf/length').default;
const area = require('@turf/area').default;

const popup = require('../../lib/popup');
const ClickableMarker = require('./clickable_marker');
const zoomextent = require('../../lib/zoomextent');
const {
  DEFAULT_DARK_FEATURE_COLOR,
  DEFAULT_LIGHT_FEATURE_COLOR,
  DEFAULT_SATELLITE_FEATURE_COLOR
} = require('../../constants');

const markers = [];

makiNames = require('@mapbox/maki/layouts/all.json');
let makiOptions = '';

for (let i = 0; i < makiNames.length; i++) {
  makiOptions += '<option value="' + makiNames[i] + '">';
}

const addIds = (geojson) => {
  return {
    ...geojson,
    features: geojson.features.map((feature, i) => {
      return {
        ...feature,
        id: i
      };
    })
  };
};

const addMarkers = (geojson, context, writable) => {
  // remove all existing markers
  markers.forEach((d) => {
    d.remove();
  });
  const pointFeatures = [];

  // wrap point geometry in a feature and push
  const handlePointGeometry = (geometry, properties, id) => {
    pointFeatures.push({
      type: 'Feature',
      id,
      geometry,
      properties
    });
  };

  // the three geometry types that may need markers are Point, MultiPoint, or GeometryCollection
  // for each point to be rendered, create a separate feature with the parent's properties
  // so that they will show up properly in the popup
  // TODO: indicate in the popup and/or elsewhere when a point is part of a MultiPoint or GeometryCollection
  const handleGeometry = (geometry, properties, index) => {
    if (geometry.type === 'Point') {
      handlePointGeometry(geometry, properties, index);
    }

    if (geometry.type === 'MultiPoint') {
      geometry.coordinates.forEach((coordinatePair) => {
        handlePointGeometry(
          {
            type: 'Point',
            coordinates: coordinatePair
          },
          properties || {},
          index
        );
      });
    }

    if (geometry.type === 'GeometryCollection') {
      geometry.geometries.forEach((geometry) => {
        handleGeometry(geometry, properties, index);
      });
    }
  };

  geojson.features.forEach((d, i) => {
    const { geometry, properties } = d;
    handleGeometry(geometry, properties, i);
  });

  if (pointFeatures.length === 0) {
    return;
  }

  pointFeatures.map((d) => {
    let defaultColor = DEFAULT_DARK_FEATURE_COLOR; // Default feature color
    let defaultSymbolColor = '#fff';

    const activeStyle = context.storage.get('style');

    // Adjust the feature color for certain styles to help visibility
    switch (activeStyle) {
      case 'Satellite Streets':
        defaultColor = DEFAULT_SATELLITE_FEATURE_COLOR;
        defaultSymbolColor = '#fff';
        break;
      case 'Dark':
        defaultColor = DEFAULT_LIGHT_FEATURE_COLOR;
        defaultSymbolColor = DEFAULT_DARK_FEATURE_COLOR;
        break;
      default:
        defaultColor = DEFAULT_DARK_FEATURE_COLOR;
        defaultSymbolColor = '#fff';
    }

    // If the Feature Object contains styling then use that, otherwise use our default feature color.
    const color =
      (d.properties && d.properties['marker-color']) || defaultColor;
    const symbolColor =
      (d.properties && d.properties['symbol-color']) || defaultSymbolColor;

    let scale = 1;
    if (d.properties && d.properties['marker-size']) {
      if (d.properties['marker-size'] === 'small') {
        scale = 0.6;
      }

      if (d.properties['marker-size'] === 'large') {
        scale = 1.2;
      }
    }

    let symbol;
    if (d.properties && d.properties['marker-symbol'] !== undefined) {
      symbol = d.properties['marker-symbol'];
    }

    const marker = new ClickableMarker({
      color,
      scale,
      symbol,
      symbolColor
    })
      .setLngLat(d.geometry.coordinates)
      .onClick(() => {
        bindPopup(
          {
            lngLat: d.geometry.coordinates,
            features: [d]
          },
          context,
          writable
        );
      })
      .addTo(context.map);

    marker.getElement().addEventListener('touchstart', () => {
      bindPopup(
        {
          lngLat: d.geometry.coordinates,
          features: [d]
        },
        context,
        writable
      );
    });

    // Update the dot in the Marker for Dark base map style
    if (activeStyle === 'Dark')
      d3.selectAll('.mapboxgl-marker svg circle').style(
        'fill',
        '#555',
        'important'
      );

    markers.push(marker);
  });
};

function geojsonToLayer(context, writable) {
  const geojson = context.data.get('map');
  if (!geojson) return;

  const workingDatasetSource = context.map.getSource('map-data');

  if (workingDatasetSource) {
    const filteredFeatures = geojson.features.filter(
      (feature) => feature.geometry
    );
    const filteredGeojson = {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
    workingDatasetSource.setData(addIds(filteredGeojson));
    addMarkers(filteredGeojson, context, writable);
    if (context.data.get('recovery')) {
      zoomextent(context);
      context.data.set({
        recovery: false
      });
    }
  }
}

function bindPopup(e, context, writable) {
  // build the popup using the actual feature from the data store,
  // not the feature returned from queryRenderedFeatures()
  const { id } = e.features[0];
  const feature = context.data.get('map').features[id];

  // the id is needed when clicking buttons in the popup, but only exists on the feature after it is added to the map
  feature.id = id;

  const props = feature.properties;
  let table = '';
  let info = '';

  let properties = {};

  // Steer clear of XSS
  for (const k in props) {
    const esc = escape(k);
    // users don't want to see "[object Object]"
    if (typeof props[k] === 'object') {
      properties[esc] = escape(JSON.stringify(props[k]));
    } else {
      properties[esc] = escape(props[k]);
    }
  }

  if (!properties) return;

  if (!Object.keys(properties).length) properties = { '': '' };

  for (const key in properties) {
    if (
      (key === 'marker-color' || key === 'stroke' || key === 'fill') &&
      writable
    ) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="color" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></td></tr>';
    } else if (key === 'marker-size' && writable) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="text" list="marker-size" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /><datalist id="marker-size"><option value="small"><option value="medium"><option value="large"></datalist></td></tr>';
    } else if (key === 'marker-symbol' && writable) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="text" list="marker-symbol" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /><datalist id="marker-symbol">' +
        makiOptions +
        '</datalist></td></tr>';
    } else if (key === 'stroke-width' && writable) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="number" min="0" step="0.1" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></td></tr>';
    } else if (['stroke-opacity', 'fill-opacity'].includes(key) && writable) {
      table +=
        '<tr class="style-row"><th><input type="text" value="' +
        key +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></th>' +
        '<td><input type="number" min="0" max="1" step="0.1" value="' +
        properties[key] +
        '"' +
        (!writable ? ' readonly' : '') +
        ' /></td></tr>';
    } else {
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
  }

  if (feature && feature.geometry) {
    info += '<table class="metadata">';
    if (feature.geometry.type === 'LineString') {
      const total = length(feature) * 1000;
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
        area(feature.geometry).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Sq. Kilometers</td><td>' +
        (area(feature.geometry) / 1000000).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Sq. Feet</td><td>' +
        (area(feature.geometry) / 0.092903).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Acres</td><td>' +
        (area(feature.geometry) / 4046.86).toFixed(2) +
        '</td></tr>' +
        '<tr><td>Sq. Miles</td><td>' +
        (area(feature.geometry) / 2589990).toFixed(2) +
        '</td></tr>';
    }
    info += '</table>';
  }

  // don't show the add simplestyle properties button if the feature already contains simplestyle properties
  let showAddStyleButton = true;

  if (
    feature.geometry.type === 'Point' ||
    feature.geometry.type === 'MultiPoint'
  ) {
    if ('marker-color' in properties && 'marker-size' in properties) {
      showAddStyleButton = false;
    }
  }

  if (
    feature.geometry.type === 'LineString' ||
    feature.geometry.type === 'MultiLineString'
  ) {
    if (
      'stroke' in properties &&
      'stroke-width' in properties &&
      'stroke-opacity' in properties
    ) {
      showAddStyleButton = false;
    }
  }

  if (
    feature.geometry.type === 'Polygon' ||
    feature.geometry.type === 'MultiPolygon'
  ) {
    showAddStyleButton = true;
    if (
      'stroke' in properties &&
      'stroke-width' in properties &&
      'stroke-opacity' in properties &&
      'fill' in properties &&
      'fill-opacity' in properties
    ) {
      showAddStyleButton = false;
    }
  }

  const tabs =
    '<div class="pad1 tabs-ui clearfix col12">' +
    '<div class="tab col12">' +
    '<input class="hide" type="radio" id="properties" name="tab-group" checked="true">' +
    '<label class="keyline-top keyline-right tab-toggle pad0 pin-bottomleft z10 center col6" for="properties">Properties</label>' +
    '<div class="space-bottom1 col12 content">' +
    '<table class="space-bottom0 marker-properties">' +
    table +
    '</table>' +
    (writable
      ? '<div class="add-row-button add fl col4"><span class="fa-solid fa-plus"></span> Add row</div>'
      : '') +
    (writable && showAddStyleButton
      ? '<div class="add-simplestyle-properties-button fl text-right col8">Add simplestyle properties</div>'
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

  const content =
    '<form action="javascript:void(0);">' +
    tabs +
    (writable
      ? '<div class="clearfix col12 pad1 keyline-top">' +
        '<div class="pill col6">' +
        '<button class="save col6 major" type="submit">Save</button>' +
        '<button class="minor col6 cancel">Cancel</button>' +
        '</div>' +
        '<button class="col6 text-right pad0 delete-invert"><span class="fa-solid fa-trash"></span> Delete feature</button></div>'
      : '') +
    '</form>';

  const popupOffsets = {
    top: [0, 10],
    'top-left': [0, 10],
    'top-right': [0, 10],
    bottom: [0, -40],
    'bottom-left': [0, -40],
    'bottom-right': [0, -40],
    left: [25, -20],
    right: [-25, -20]
  };

  new mapboxgl.Popup({
    closeButton: false,
    maxWidth: '251px',
    offset: popupOffsets,
    className: 'geojsonio-feature'
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
