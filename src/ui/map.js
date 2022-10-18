require('qs-hash');
const DrawRectangle = require('./draw/rectangle');
const ExtendDrawBar = require('./draw/extend_draw_bar');

let recentlyCreatedFeature = false;

// extend mapboxGL Marker so we can pass in an onClick handler
class ClickableMarker extends mapboxgl.Marker {
  // new method onClick, sets _handleClick to a function you pass in
  onClick(handleClick) {
      
    this._handleClick = handleClick;
    return this;
  }

  // the existing _onMapClick was there to trigger a popup
  // but we are hijacking it to run a function we define
  _onMapClick(e) {
    const targetElement = e.originalEvent.target;
    const element = this._element;

    if (
      this._handleClick &&
      (targetElement === element || element.contains(targetElement))
    ) {
      this._handleClick();
    }
  }
}

var popup = require('../lib/popup'),
  escape = require('escape-html'),
  LGeo = require('leaflet-geodesy'),
  geojsonRewind = require('geojson-rewind'),
  writable = false,
  showStyle = true;

const dummyGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
    },
  ],
};

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

module.exports = function (context, readonly) {
  writable = !readonly;

  function maybeShowEditControl() {
    // if there are features, show the edit button
    if (context.data.hasFeatures()) {
      d3.select('.edit-control').style('display', 'block');
    }
  }

  function map(selection) {
    mapboxgl.accessToken =
      'pk.eyJ1IjoiY2hyaXN3aG9uZ21hcGJveCIsImEiOiJjbDR5OTNyY2cxZGg1M2luejcxZmJpaG1yIn0.mUZ2xk8CLeBFotkPvPJHGg';

    context.map = new mapboxgl.Map({
      container: selection.node(),
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-96, 37.8],
      zoom: 3,
      projection: 'globe',
      hash: 'map',
    });

  
    if (writable) {
      context.map.addControl(
        new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl,
          marker: true,
        })
      );
  
      context.Draw = new MapboxDraw({
        displayControlsDefault: false,
        modes: {
          ...MapboxDraw.modes,
          draw_rectangle: DrawRectangle
        },
        controls: {
        },
      });
  
      const drawControl = new ExtendDrawBar({
        draw: context.Draw,
        buttons: [
          {
            on: 'click',
            action: () => {
              context.Draw.changeMode('draw_point');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_point']
          },
          {
            on: 'click',
            action: () => {
              context.Draw.changeMode('draw_line_string');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_line']
          },
          {
            on: 'click',
            action: () => {
              context.Draw.changeMode('draw_polygon');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_polygon']
          },
          {
            on: 'click',
            action: () => {
              context.Draw.changeMode('draw_rectangle');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_rectangle']
          },
        ]
      });
  
      context.map.addControl(new mapboxgl.NavigationControl());
  
      context.map.addControl(drawControl, 'top-right');
  
      class EditControl {
        onAdd(map) {
          this.map = map;
          this._container = document.createElement('div');
          this._container.className =
            'mapboxgl-ctrl-group mapboxgl-ctrl edit-control hidden';
  
          this._container.innerHTML = `
            <button class="mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_edit" title="Edit geometries" style="background-image: url(img/edit.svg); background-size: 13px 13px;">
              
            </button>
          `;
  
          return this._container;
        }
      }
  
  
      const editControl = new EditControl();
      context.map.addControl(editControl, 'top-right');
  
      class SaveCancelControl {
        onAdd(map) {
          this.map = map;
          this._container = document.createElement('div');
          this._container.className =
            'save-cancel-control bg-white rounded pt-1 pb-2 px-2 mt-2 mr-2 float-right clear-both pointer-events-auto';
          this._container.style = 'display: none;';
          this._container.innerHTML = `
            <div class='font-bold mb-0.5'>Editing Geometries</div>
              <div class="flex">
                <button class='mapboxgl-draw-actions-btn mapboxgl-draw-actions-btn_save txt-xs bg-gray-500 hover:bg-gray-700 text-white font-bold py-0 px-2 rounded' title="Save changes.">
                  Save
                </button>
                <button class='mapboxgl-draw-actions-btn mapboxgl-draw-actions-btn_cancel ml-1 txt-xs bg-gray-500 hover:bg-gray-700 text-white font-bold py-0 px-2 rounded' title="Cancel editing, discards all changes.">
                  Cancel
                </button>
              </div>
          `;
  
          return this._container;
        }
      }
  
      const saveCancelControl = new SaveCancelControl();
  
      context.map.addControl(saveCancelControl, 'top-right');
  
      class TrashControl {
        onAdd(map) {
          this.map = map;
          this._container = document.createElement('div');
          this._container.className =
            'mapboxgl-ctrl-group mapboxgl-ctrl trash-control';
          this._container.style = 'display: none;';
          this._container.innerHTML = `
            <button class="mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_trash" title="Delete">
            </button>
          `;
  
          return this._container;
        }
      }
  
      const trashControl = new TrashControl();
  
      context.map.addControl(trashControl, 'top-right');
  
      const exitEditMode = () => {
        // show the data layers
        context.map.setLayoutProperty('map-data-fill', 'visibility', 'visible');
        context.map.setLayoutProperty(
          'map-data-fill-outline',
          'visibility',
          'visible'
        );
        context.map.setLayoutProperty('map-data-line', 'visibility', 'visible');
  
        // show markers
        d3.selectAll('.mapboxgl-marker').style('display', 'block');
  
        // clean up draw
        context.Draw.changeMode('simple_select');
        context.Draw.deleteAll();
  
        // hide the save/cancel control and the delete control
        d3.select('.save-cancel-control').style('display', 'none');
        d3.select('.trash-control').style('display', 'none');
  
        // show the edit button and draw tools
        maybeShowEditControl();
        d3.select('.mapboxgl-ctrl-group:nth-child(3)').style('display', 'block');
      };
  
      // handle save or cancel from edit mode
      d3.selectAll('.mapboxgl-draw-actions-btn').on('click', function () {
        const target = d3.select(this);
        const isSaveButton = target.classed('mapboxgl-draw-actions-btn_save');
        if (isSaveButton) {
          const FC = context.Draw.getAll();
          context.data.set(
            {
              map: {
                ...FC,
                features: stripIds(FC.features),
              },
            },
            'map'
          );
        }
  
        exitEditMode();
      });
  
      // handle delete
      d3.select('.mapbox-gl-draw_trash').on('click', function () {
        context.Draw.trash();
      });
  
      // enter edit mode
      d3.selectAll('.mapbox-gl-draw_edit').on('click', function () {
        // hide the edit button and draw tools
        d3.select('.edit-control').style('display', 'none');
        d3.select('.mapboxgl-ctrl-group:nth-child(3)').style('display', 'none');
  
        // show the save/cancel control and the delete control
        d3.select('.save-cancel-control').style('display', 'block');
        d3.select('.trash-control').style('display', 'block');
  
        // hide the line and polygon data layers
        context.map.setLayoutProperty('map-data-fill', 'visibility', 'none');
        context.map.setLayoutProperty(
          'map-data-fill-outline',
          'visibility',
          'none'
        );
        context.map.setLayoutProperty('map-data-line', 'visibility', 'none');
  
        // hide markers
        d3.selectAll('.mapboxgl-marker').style('display', 'none');
  
        // import the current data into draw for editing
        const featureIds = context.Draw.add(context.data.get('map'));
        context.Draw.changeMode('simple_select', {
          featureIds
        });
      });
    }

    context.map.on('style.load', () => {
      context.map.setFog({});

      context.map.addSource('map-data', {
        type: 'geojson',
        data: addIds(context.data.get('map')) || dummyGeojson,
      });

      context.map.addLayer({
        id: 'map-data-fill',
        type: 'fill',
        source: 'map-data',
        paint: {
          'fill-color': '#555',
          'fill-opacity': 0.3,
        },
        filter: ['==', ['geometry-type'], 'Polygon'],
      });

      context.map.addLayer({
        id: 'map-data-fill-outline',
        type: 'line',
        source: 'map-data',
        paint: {
          'line-color': '#555',
          'line-width': 2,
        },
        filter: ['==', ['geometry-type'], 'Polygon'],
      });

      context.map.addLayer({
        id: 'map-data-line',
        type: 'line',
        source: 'map-data',
        paint: {
          'line-color': '#555',
          'line-width': 2,
        },
        filter: ['==', ['geometry-type'], 'LineString'],
      });

      addMarkers(context.data.get('map'), context.map, context);
    });

    // only show projection toggle on zoom < 6
    context.map.on('zoomend', () => {
      const zoom = context.map.getZoom();
      if (zoom < 6) {
        d3.select('.projection-switch').style('opacity', 1);
      } else {
        d3.select('.projection-switch').style('opacity', 0);
      }
    });

    context.map.on('load', () => {
   
      context.map.on('mouseenter', 'map-data-fill', () => {
        context.map.getCanvas().style.cursor = 'pointer';
      });

      context.map.on('mouseleave', 'map-data-fill', () => {
        context.map.getCanvas().style.cursor = 'default';
      });

      context.map.on('mouseenter', 'map-data-line', () => {
        context.map.getCanvas().style.cursor = 'pointer';
      });

      context.map.on('mouseleave', 'map-data-line', () => {
        context.map.getCanvas().style.cursor = 'default';
      });

      context.map.on('click', 'map-data-fill', (e) => {
        bindPopup(e, context);
      });

      context.map.on('click', 'map-data-line', (e) => {
        bindPopup(e, context);
      });
    });

    context.map.on('draw.create', created);

    function stripIds(features) {
      return features.map((feature) => {
        delete feature.id;
        return feature;
      });
    }

    function created(e) {
      recentlyCreatedFeature = true;
      context.Draw.deleteAll();
      update(stripIds(e.features));
    }

    function update(features) {
      const FC = context.data.get('map');

      FC.features = [...FC.features, ...features];

      context.data.set({ map: FC }, 'map');
    }

    context.dispatch.on('change.map', function () {
      maybeShowEditControl();

      geojsonToLayer(context.data.get('map'), context.map, context);
    });
  }

  function layerToGeoJSON(layer) {
    var features = [];
    layer.eachLayer(collect);
    function collect(l) {
      if ('toGeoJSON' in l) features.push(l.toGeoJSON());
    }
    return {
      type: 'FeatureCollection',
      features: features,
    };
  }

  return map;
};

function geojsonToLayer(geojson, map, context) {
  if (map.isStyleLoaded()) {
    map.getSource('map-data').setData(addIds(geojson));

    addMarkers(geojson, map, context);
  }
}

function bindPopup(e, context) {
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
      if (showStyle === false) {
        d3.select('#show-style').property('checked', false);
        d3.selectAll('.style-row').style('display', 'none');
      }
      d3.select('#show-style').on('click', function () {
        if (this.checked) {
          showStyle = true;
          d3.selectAll('.style-row').style('display', '');
        } else {
          showStyle = false;
          d3.selectAll('.style-row').style('display', 'none');
        }
      });
    })
    .addTo(context.map);
}
