const mapboxgl = require('mapbox-gl');

require('qs-hash');
const geojsonRewind = require('@mapbox/geojson-rewind');
const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const MapboxGeocoder = require('@mapbox/mapbox-gl-geocoder');

const DrawLineString = require('../draw/linestring');
const DrawRectangle = require('../draw/rectangle');
const DrawCircle = require('../draw/circle');
const SimpleSelect = require('../draw/simple_select');
const ExtendDrawBar = require('../draw/extend_draw_bar');
const { EditControl, SaveCancelControl, TrashControl } = require('./controls');
const { geojsonToLayer, bindPopup } = require('./util');
const styles = require('./styles');
const {
  DEFAULT_STYLE,
  DEFAULT_PROJECTION,
  DEFAULT_DARK_FEATURE_COLOR,
  DEFAULT_LIGHT_FEATURE_COLOR,
  DEFAULT_SATELLITE_FEATURE_COLOR
} = require('../../constants');
const drawStyles = require('../draw/styles');

let writable = false;
let drawing = false;
let editing = false;

const dummyGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    }
  ]
};

module.exports = function (context, readonly) {
  writable = !readonly;

  // keyboard shortcuts
  const keybinding = d3
    .keybinding('map')
    // delete key triggers draw.trash()
    .on('⌫', () => {
      if (editing) {
        context.Draw.trash();
      }
    })
    .on('m', () => {
      if (!editing) {
        context.Draw.changeMode('draw_point');
      }
    })
    .on('l', () => {
      if (!editing) {
        context.Draw.changeMode('draw_line_string');
      }
    })
    .on('p', () => {
      if (!editing) {
        context.Draw.changeMode('draw_polygon');
      }
    })
    .on('r', () => {
      if (!editing) {
        context.Draw.changeMode('draw_rectangle');
      }
    })
    .on('c', () => {
      if (!editing) {
        context.Draw.changeMode('draw_circle');
      }
    });

  d3.select(document).call(keybinding);

  function maybeShowEditControl() {
    // if there are features, show the edit button
    if (context.data.hasFeatures()) {
      d3.select('.edit-control').style('display', 'block');
    }
  }

  function map() {
    mapboxgl.accessToken =
      'pk.eyJ1Ijoic3ZjLW9rdGEtbWFwYm94LXN0YWZmLWFjY2VzcyIsImEiOiJjbG5sMnExa3kxNTJtMmtsODJld24yNGJlIn0.RQ4CHchAYPJQZSiUJ0O3VQ';

    mapboxgl.setRTLTextPlugin(
      'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
      null,
      true
    );

    const projection = context.storage.get('projection') || DEFAULT_PROJECTION;
    let activeStyle = context.storage.get('style') || DEFAULT_STYLE;

    // handle previous users who had Streets selected
    if (activeStyle === 'Streets') {
      activeStyle = 'Standard';
    }

    const { style } = styles.find((d) => d.title === activeStyle);

    context.map = new mapboxgl.Map({
      container: 'map',
      style,
      center: [20, 0],
      zoom: 2,
      projection,
      hash: 'map'
    });

    if (writable) {
      context.map.addControl(
        new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl,
          marker: true
        })
      );

      context.Draw = new MapboxDraw({
        displayControlsDefault: false,
        modes: {
          ...MapboxDraw.modes,
          simple_select: SimpleSelect,
          direct_select: MapboxDraw.modes.direct_select,
          draw_line_string: DrawLineString,
          draw_rectangle: DrawRectangle,
          draw_circle: DrawCircle
        },
        controls: {},
        styles: drawStyles
      });

      const drawControl = new ExtendDrawBar({
        draw: context.Draw,
        buttons: [
          {
            on: 'click',
            action: () => {
              drawing = true;
              context.Draw.changeMode('draw_point');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_point'],
            title: 'Draw Point (m)'
          },
          {
            on: 'click',
            action: () => {
              drawing = true;
              context.Draw.changeMode('draw_line_string');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_line'],
            title: 'Draw LineString (l)'
          },
          {
            on: 'click',
            action: () => {
              drawing = true;
              context.Draw.changeMode('draw_polygon');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_polygon'],
            title: 'Draw Polygon (p)'
          },
          {
            on: 'click',
            action: () => {
              drawing = true;
              context.Draw.changeMode('draw_rectangle');
            },
            classes: [
              'mapbox-gl-draw_ctrl-draw-btn',
              'mapbox-gl-draw_rectangle'
            ],
            title: 'Draw Rectangular Polygon (r)'
          },
          {
            on: 'click',
            action: () => {
              drawing = true;
              context.Draw.changeMode('draw_circle');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_circle'],
            title: 'Draw Circular Polygon (c)'
          }
        ]
      });

      context.map.addControl(new mapboxgl.NavigationControl());

      context.map.addControl(drawControl, 'top-right');

      const editControl = new EditControl();
      context.map.addControl(editControl, 'top-right');

      const saveCancelControl = new SaveCancelControl();

      context.map.addControl(saveCancelControl, 'top-right');

      const trashControl = new TrashControl();

      context.map.addControl(trashControl, 'top-right');

      const exitEditMode = () => {
        editing = false;
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
        d3.select('.mapboxgl-ctrl-group:nth-child(3)').style(
          'display',
          'block'
        );
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
                features: stripIds(FC.features)
              }
            },
            'map'
          );
        }

        exitEditMode();
      });

      // handle delete
      d3.select('.mapbox-gl-draw_trash').on('click', () => {
        context.Draw.trash();
      });

      // enter edit mode
      d3.selectAll('.mapbox-gl-draw_edit').on('click', () => {
        editing = true;
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

    context.map.on('idle', () => {
      if (
        context.data.get('mapStyleLoaded') &&
        !context.map.getSource('map-data')
      ) {
        const { name } = context.map.getStyle();

        let color = DEFAULT_DARK_FEATURE_COLOR; // Sets default dark color for lighter base maps

        // Sets a light color for dark base map
        if (['Mapbox Dark'].includes(name)) {
          color = DEFAULT_LIGHT_FEATURE_COLOR;
        }

        // Sets a brighter color for the satellite base map to help with visibility.
        if (['Mapbox Satellite Streets'].includes(name)) {
          color = DEFAULT_SATELLITE_FEATURE_COLOR;
        }

        // setFog only on Light and Dark
        if (['Mapbox Light', 'Mapbox Dark', 'osm'].includes(name)) {
          context.map.setFog({
            range: [0.5, 10],
            color: '#ffffff',
            'high-color': '#245cdf',
            'space-color': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4,
              '#010b19',
              7,
              '#367ab9'
            ],
            'horizon-blend': [
              'interpolate',
              ['exponential', 1.2],
              ['zoom'],
              5,
              0.02,
              7,
              0.08
            ],
            'star-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              5,
              0.35,
              6,
              0
            ]
          });
        }

        context.map.addSource('map-data', {
          type: 'geojson',
          data: dummyGeojson
        });

        context.map.addLayer({
          id: 'map-data-fill',
          type: 'fill',
          source: 'map-data',
          paint: {
            'fill-color': ['coalesce', ['get', 'fill'], color],
            'fill-opacity': ['coalesce', ['get', 'fill-opacity'], 0.3]
          },
          filter: ['==', ['geometry-type'], 'Polygon']
        });

        context.map.addLayer({
          id: 'map-data-fill-outline',
          type: 'line',
          source: 'map-data',
          paint: {
            'line-color': ['coalesce', ['get', 'stroke'], color],
            'line-width': ['coalesce', ['get', 'stroke-width'], 2],
            'line-opacity': ['coalesce', ['get', 'stroke-opacity'], 1]
          },
          filter: ['==', ['geometry-type'], 'Polygon']
        });

        context.map.addLayer({
          id: 'map-data-line',
          type: 'line',
          source: 'map-data',
          paint: {
            'line-color': ['coalesce', ['get', 'stroke'], color],
            'line-width': ['coalesce', ['get', 'stroke-width'], 2],
            'line-opacity': ['coalesce', ['get', 'stroke-opacity'], 1]
          },
          filter: ['==', ['geometry-type'], 'LineString']
        });

        geojsonToLayer(context, writable);

        context.data.set({
          mapStyleLoaded: false
        });
      }
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

    const maybeSetCursorToPointer = () => {
      if (context.Draw.getMode() === 'simple_select') {
        context.map.getCanvas().style.cursor = 'pointer';
      }
    };

    const maybeResetCursor = () => {
      if (context.Draw.getMode() === 'simple_select') {
        context.map.getCanvas().style.removeProperty('cursor');
      }
    };

    const handleLinestringOrPolygonClick = (e) => {
      // prevent this popup from opening when the original click was on a marker
      const el = e.originalEvent.target;
      if (el.nodeName !== 'CANVAS') return;
      // prevent this popup from opening when drawing new features
      if (drawing) return;

      bindPopup(e, context, writable);
    };

    context.map.on('load', () => {
      context.data.set({
        mapStyleLoaded: true
      });
      context.map.on('mouseenter', 'map-data-fill', maybeSetCursorToPointer);
      context.map.on('mouseleave', 'map-data-fill', maybeResetCursor);
      context.map.on('mouseenter', 'map-data-line', maybeSetCursorToPointer);
      context.map.on('mouseleave', 'map-data-line', maybeResetCursor);

      context.map.on('click', 'map-data-fill', handleLinestringOrPolygonClick);
      context.map.on('click', 'map-data-line', handleLinestringOrPolygonClick);
      context.map.on(
        'touchstart',
        'map-data-fill',
        handleLinestringOrPolygonClick
      );
      context.map.on(
        'touchstart',
        'map-data-line',
        handleLinestringOrPolygonClick
      );
    });

    context.map.on('draw.create', created);

    function stripIds(features) {
      return features.map((feature) => {
        delete feature.id;
        return feature;
      });
    }

    function created(e) {
      context.Draw.deleteAll();
      update(stripIds(e.features));

      // delay setting drawing back to false after a drawn feature is created
      // this allows the map click handler to ignore the click and prevents a popup
      // if the drawn feature endeds within an existing feature
      setTimeout(() => {
        drawing = false;
      }, 500);
    }

    function update(features) {
      let FC = context.data.get('map');

      FC.features = [...FC.features, ...features];

      FC = geojsonRewind(FC);

      context.data.set({ map: FC }, 'map');
    }

    context.dispatch.on('change.map', ({ obj }) => {
      maybeShowEditControl();
      if (obj.map) {
        geojsonToLayer(context, writable);
      }
    });
  }

  return map;
};
