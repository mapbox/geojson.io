module.exports = function(context) {

    return function(selection) {

        var layers = [{
            title: 'Mapbox',
            layer: L.mapbox.tileLayer('tmcw.map-7s15q36b', {
                detectRetina: true
            })
        }, {
            title: 'Satellite',
            layer: L.mapbox.tileLayer('tmcw.map-j5fsp01s', {
                detectRetina: true
            })
        }, {
            title: 'OSM',
            layer: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            })
        }];

        var layerSwap = function(d) {
            var clicked = this instanceof d3.selection ? this.node() : this;
            layerButtons.classed('active', function() {
                return clicked === this;
            });
            layers.forEach(swap);
            function swap(l) {
                var datum = d instanceof d3.selection ? d.datum() : d;
                if (l.layer == datum.layer) context.map.addLayer(datum.layer);
                else if (context.map.hasLayer(l.layer)) context.map.removeLayer(l.layer);
            }
        };

        var layerButtons = selection.append('div')
            .attr('class', 'layer-switch')
            .selectAll('button')
            .data(layers)
            .enter()
            .append('button')
            .attr('class', 'pad0x')
            .on('click', layerSwap)
            .text(function(d) { return d.title; });

        layerButtons.filter(function(d, i) { return i === 0; }).call(layerSwap);

    };
};

