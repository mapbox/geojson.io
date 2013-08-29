var metatable = require('d3-metatable')(d3),
    smartZoom = require('../lib/smartzoom.js');

module.exports = function(context) {
    function render(selection) {

        selection.html('');

        function rerender() {
            var geojson = context.data.get('map');
            if (!geojson || !geojson.features.length) {
                selection
                    .html('')
                    .append('div')
                    .attr('class', 'blank-banner')
                    .text('no features');
            } else {
                var props = geojson.features.map(getProperties);
                selection.select('.blank-banner').remove();
                selection
                    .data([props])
                    .call(metatable()
                        .on('change', function(row, i) {
                            var geojson = context.data.get('map');
                            geojson.features[i].properties = row;
                            context.data.set('map', geojson);
                        })
                        .on('rowfocus', function(row, i) {
                            var j = 0;
                            context.mapLayer.eachLayer(function(l) {
                                if (i === j++) smartZoom(context.map, l);
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
            layers.eachLayer(function(l) {
                if (p == l.feature.properties) layer = l;
            });
            return layer;
        }
    }

    render.off = function() {
        context.dispatch.on('change.table', null);
    };

    return render;
};
