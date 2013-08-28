var metatable = require('d3-metatable')(d3);

module.exports = function(context) {
    function render(selection) {

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
                selection
                    .html('')
                    .append('div')
                    .attr('class', 'pad1 scrollable')
                    .data([props])
                    .call(
                        metatable()
                            .on('change', function(row, i) {
                            })
                            .on('rowfocus', function(row, i) {
                                // console.log(arguments);
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
