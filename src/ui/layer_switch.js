module.exports = function(context) {

    return function(selection) {
        var layers;

        if (!(/a\.tiles\.mapbox.com/).test(L.mapbox.config.HTTP_URL)) {
            layers = [{
                title: 'Mapbox',
                layer: L.mapbox.tileLayer('mapbox.osm-bright')
            }, {
                title: 'Mapbox Outdoors',
                layer: L.mapbox.tileLayer('mapbox.mapbox-outdoors')
            }, {
                title: 'Satellite',
                layer: L.mapbox.tileLayer('mapbox.satellite-full')
            }];

        } else {
            layers = [{
                title: 'Mapbox',
                layer: L.mapbox.tileLayer('mapbox.streets')
            }, {
                title: 'Satellite',
                layer: L.mapbox.tileLayer('mapbox.satellite')
            }, {
                title: 'OSM',
                layer: L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                })
            }
            // OCM tiles from Thunderforest require an API key. Add your key and uncomment the lines
            // below to enable the OCM layer.
            //       
            // , {
            //    title: 'OCM',
            //    layer: L.tileLayer('https://a.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=<insert-your-apikey-here>', {
            //       attribution: 'Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            //    })
            // }
            ];
        }

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
            .data(layers);

        layerButtons = layerButtons.enter()
            .append('button')
            .attr('class', 'pad0x')
            .on('click', layerSwap)
            .text(function(d) { return d.title; })
            .merge(layerButtons);

        layerButtons.filter(function(d, i) { return i === 0; }).call(layerSwap);

    };
};
