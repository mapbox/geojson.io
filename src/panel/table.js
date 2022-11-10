const metatable = require('d3-metatable')(d3),
  smartZoom = require('../lib/smartzoom.js');

module.exports = function (context) {
  function render(selection) {
    selection.html('');

    function rerender() {
      const geojson = context.data.get('map');
      let props;

      if (
        !geojson ||
        (!geojson.geometry && (!geojson.features || !geojson.features.length))
      ) {
        selection
          .html('')
          .append('div')
          .attr('class', 'blank-banner center')
          .text('no features');
      } else {
        props = geojson.geometry
          ? [geojson.properties]
          : geojson.features.map(getProperties);
        selection.select('.blank-banner').remove();
        selection.data([props]).call(
          metatable()
            .on('change', (row, i) => {
              const geojson = context.data.get('map');
              if (geojson.geometry) {
                geojson.properties = row;
              } else {
                geojson.features[i].properties = row;
              }
              context.data.set('map', geojson);
            })
            .on('rowfocus', (row, i) => {
              const geojson = context.data.get('map');
              if (!geojson.geometry) {
                smartZoom(context.map, geojson.features[i]);
              }
            })
        );
      }
    }

    context.dispatch.on('change.table', () => {
      rerender();
    });

    rerender();

    function getProperties(f) {
      return f.properties;
    }
  }

  render.off = function () {
    context.dispatch.on('change.table', null);
  };

  return render;
};
