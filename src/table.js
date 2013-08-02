function tablePanel(container, updates) {
    container.html('');
    updates.on('update_map.mode', function(data, layers) {
        if (!data.features.length) {
            container.text('no features');
        } else {
            var props = [];
            layers.eachLayer(function(p) {
                props.push(p.feature.properties);
            });
            function findLayer(p) {
                var layer;
                layers.eachLayer(function(l) {
                    if (p == l.feature.properties) {
                        layer = l;
                    }
                });
                return layer;
            }
            container.html('');
            container.append('div').attr('class', 'table-wrap')
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
}
