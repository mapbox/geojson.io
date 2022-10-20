require('qs-hash');
const geojsonRewind = require('geojson-rewind');

const DrawRectangle = require('../draw/rectangle');
const ExtendDrawBar = require('../draw/extend_draw_bar');
const { EditControl, SaveCancelControl, TrashControl } = require('./controls');
const { addIds, addMarkers, geojsonToLayer, bindPopup } = require('./util');

let writable = false;

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

const DARK_FEATURE_COLOR = '#555';
const LIGHT_FEATURE_COLOR = '#e8e8e8';

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

    window.map = context.map;

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
          draw_rectangle: DrawRectangle,
        },
        controls: {},
      });

      const drawControl = new ExtendDrawBar({
        draw: context.Draw,
        buttons: [
          {
            on: 'click',
            action: () => {
              context.Draw.changeMode('draw_point');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_point'],
          },
          {
            on: 'click',
            action: () => {
              context.Draw.changeMode('draw_line_string');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_line'],
          },
          {
            on: 'click',
            action: () => {
              context.Draw.changeMode('draw_polygon');
            },
            classes: ['mapbox-gl-draw_ctrl-draw-btn', 'mapbox-gl-draw_polygon'],
          },
          {
            on: 'click',
            action: () => {
              context.Draw.changeMode('draw_rectangle');
            },
            classes: [
              'mapbox-gl-draw_ctrl-draw-btn',
              'mapbox-gl-draw_rectangle',
            ],
          },
        ],
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
          featureIds,
        });
      });
    }

    context.map.on('style.load', () => {
      const { name } = context.map.getStyle();
      let color = DARK_FEATURE_COLOR;
      if (['Mapbox Satellite', 'Mapbox Dark'].includes(name)) {
        color = LIGHT_FEATURE_COLOR;
      }
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
          'fill-color': ['coalesce', ['get', 'fill'], color],
          'fill-opacity': ['coalesce', ['get', 'fill-opacity'], 0.3],
        },
        filter: ['==', ['geometry-type'], 'Polygon'],
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
        filter: ['==', ['geometry-type'], 'Polygon'],
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
        filter: ['==', ['geometry-type'], 'LineString'],
      });

      addMarkers(context.data.get('map'), context.map, context, writable);
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

    context.map.on('load', () => {
      context.map.on('mouseenter', 'map-data-fill', maybeSetCursorToPointer);
      context.map.on('mouseleave', 'map-data-fill', maybeResetCursor);
      context.map.on('mouseenter', 'map-data-line', maybeSetCursorToPointer);
      context.map.on('mouseleave', 'map-data-line', maybeResetCursor);

      context.map.on('click', 'map-data-fill', (e) => {
        bindPopup(e, context, writable);
      });

      context.map.on('click', 'map-data-line', (e) => {
        bindPopup(e, context, writable);
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
      context.Draw.deleteAll();
      update(stripIds(e.features));
    }

    function update(features) {
      let FC = context.data.get('map');

      FC.features = [...FC.features, ...features];

      FC = geojsonRewind(FC);

      context.data.set({ map: FC }, 'map');
    }

    context.dispatch.on('change.map', function () {
      maybeShowEditControl();

      geojsonToLayer(context.data.get('map'), context.map, context);
    });
  }

  return map;
};
