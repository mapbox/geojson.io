module.exports = function() {
    var map = L.mapbox.map('map')
        .setView([20, 0], 2);

    var osmTiles = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });

    var mapboxTiles = L.mapbox.tileLayer('tmcw.map-7s15q36b', {
        retinaVersion: 'tmcw.map-u4ca5hnt',
        detectRetina: true
    }).addTo(map);

    var mapboxSatelliteTiles = L.mapbox.tileLayer('tmcw.map-j5fsp01s', {
        retinaVersion: 'tmcw.map-ujx9se0r',
        detectRetina: true
    });

    var layerButtons = d3.select('#layer-switch')
        .selectAll('button')
        .on('click', function() {
            var clicked = this;
            layerButtons.classed('active', function() {
                return clicked === this;
            });
            if (this.id == 'mapbox' && !map.hasLayer(mapboxTiles)) {
                map.addLayer(mapboxTiles);
                if (map.hasLayer(osmTiles)) map.removeLayer(osmTiles);
                if (map.hasLayer(mapboxSatelliteTiles)) map.removeLayer(mapboxSatelliteTiles);
            }
            if (this.id == 'mapbox-satellite' && !map.hasLayer(mapboxSatelliteTiles)) {
                map.addLayer(mapboxSatelliteTiles);
                if (map.hasLayer(osmTiles)) map.removeLayer(osmTiles);
                if (map.hasLayer(mapboxTiles)) map.removeLayer(mapboxTiles);
            }
            if (this.id == 'osm' && !map.hasLayer(osmTiles)) {
                map.addLayer(osmTiles);
                if (map.hasLayer(mapboxTiles)) map.removeLayer(mapboxTiles);
                if (map.hasLayer(mapboxSatelliteTiles)) map.removeLayer(mapboxSatelliteTiles);
            }
        });

    L.mapbox.geocoderControl('tmcw.map-u4ca5hnt').addTo(map);

    return map;
};
