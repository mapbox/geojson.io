var metatable = require('d3-metatable')(d3);

module.exports = tablePanel;

function tablePanel(container, updates) {
    container.html('');

    updates.on('update_map.mode', function(data, layers) {
        function findLayer(p) {
            var layer;
            layers.eachLayer(function(l) {
                if (p == l.feature.properties) layer = l;
            });
            return layer;
        }
        if (!data.features.length) {
            container.append('div')
                .attr('class', 'blank-banner')
                .text('no features');
        } else {
            var props = [];
            layers.eachLayer(function(p) {
                props.push(p.feature.properties);
            });
            container.html('');
            container
                .append('div')
                .attr('class', 'pad1 scrollable')
                .data([props])
                .call(
                    metatable()
                        .on('change', function() {
                            updates.update_refresh();
                        })
                        .on('rowfocus', function(d) {
                            updates.focus_layer(findLayer(d));
                        })
                );
        }
    });

    analytics.track('Entered Table Mode');
}
