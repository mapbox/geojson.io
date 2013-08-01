module.exports = function(container, updates) {
    container.html('');

    updates.on('update_map', function(data) {

        function render() {
            var feature = container
                .selectAll('.feature')
                .data(data.features, function(d, i) { return i; });

            var featureEnter = feature.enter()
                .append('div')
                .attr('class', 'feature pad1');

            featureEnter.append('div')
                .attr('class', 'mini-map')
                .call(function(container) {
                    var d = container.datum();
                    var map = L.mapbox.map(this.node(), 'tmcw.map-7s15q36b', {
                        scrollWheelZoom: false
                    });
                    var gjL = L.geoJson(d).addTo(map);
                    map.fitBounds(gjL.getBounds());
                });

            featureEnter.append('table');

            var tr = feature.selectAll('table').selectAll('tr')
                .data(function(d) {
                    return d3.entries(d.properties);
                });

            tr.enter().append('tr');
            tr.exit().remove();

            var keyInput = tr.append('td').append('input')
                .property('value', function(d) {
                    return d.key;
                });

            tr.append('td').append('div').attr('class', 'separator').text(': ');

            var valueInput = tr.append('td').append('input')
                .property('value', function(d) {
                    return d.value;
                });

            var addRowButton = featureEnter.append('button')
                .text('add row')
                .attr('class', 'addrow')
                .on('click', function(d) {
                    d.properties[''] = '';
                    render();
                });

            function onchange() {
                var props = fieldArrayToProperties(fields);
                layer.feature.properties = props;
            }
        }

        render();
    });
};

function clean(o) {
    var x = {};
    for (var k in o) {
        if (k) x[k] = o[k];
    }
    return x;
}

function fieldArrayToProperties(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) obj[arr[i][0].value] = arr[i][1].value;
    return obj;
}
