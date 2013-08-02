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
            container.html('');
            container.append('div').attr('class', 'table-wrap').data([props]).call(metatable().on('change', function() {
                updates.update_refresh();
            }));
        }
    });
}
