var metatable = require('d3-metatable')(d3),
    smartZoom = require('../lib/smartzoom.js');

module.exports = function(context) {
    function render(selection) {

        selection.html('');

        function rerender() {
            var geojson = context.data.get('map');
            var props;

            if (!geojson || !geojson.geometry &&
                (!geojson.features || !geojson.features.length)) {
                selection
                    .html('')
                    .append('div')
                    .attr('class', 'blank-banner center')
                    .text('no features');
            } else {
                props = geojson.geometry ? [geojson.properties] :
                    geojson.features.map(getProperties);
                selection.select('.blank-banner').remove();
                selection
                    .data([props])
                    .call(metatable()
                        .on('change', function(row, i) {
                            var geojson = context.data.get('map');
                            if (geojson.geometry) {
                                geojson.properties = row;
                            } else {
                                geojson.features[i].properties = row;
                            }
                            context.data.set('map', geojson);
                        })
                        .on('rowfocus', function(row, i) {
                            var bounds = context.mapLayer.getBounds();
                            var j = 0;
                            context.mapLayer.eachLayer(function(l) {
                                if (i === j++) smartZoom(context.map, l, bounds);
                            });
                        })
                    );
            }

        }

        context.dispatch.on('change.table', function(evt) {
            rerender();
        });

        rerender();

        function getProperties(f) { return f.properties; }

        function zoomToMap(p) {
            var layer;
            // layers.eachLayer(function(l) {
            //     if (p == l.feature.properties) layer = l;
            // });
            return layer;
        }
    }

    render.off = function() {
        context.dispatch.on('change.table', null);
    };

    return render;
};
