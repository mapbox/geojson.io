module.exports = function(context) {

    return function(selection) {

        var layers = [{
            title: 'MapBox',
            layer: L.mapbox.tileLayer('tmcw.map-7s15q36b', {
                retinaVersion: 'tmcw.map-u4ca5hnt',
                detectRetina: true
            })
        }, {
            title: 'Satellite',
            layer: L.mapbox.tileLayer('tmcw.map-j5fsp01s', {
                retinaVersion: 'tmcw.map-ujx9se0r',
                detectRetina: true
            })
        }, {
            title: 'OSM',
            layer: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            })
        }];

        var layerButtons = selection.append('div')
            .attr('id', 'layer-switch')
            .selectAll('button')
            .data(layers)
            .enter()
            .append('button')
            .on('click', function(d) {
                var clicked = this;
                layerButtons.classed('active', function() {
                    return clicked === this;
                });
                layers.forEach(swap);
                function swap(l) {
                    if (l.layer == d.layer) context.map.addLayer(d.layer);
                    else if (context.map.hasLayer(l.layer)) context.map.removeLayer(l.layer);
                }
            })
            .text(function(d) { return d.title; });

        layerButtons.filter(function(d, i) { return i === 0; }).trigger('click');

    };
};
