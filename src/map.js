'use strict';

module.exports.showProperties = showProperties;
module.exports.setupMap = setupMap;
module.exports.geoify = geoify;

function setupMap(container) {
    var mapDiv = container.append('div')
        .attr('id', 'map');

    var map = L.mapbox.map(mapDiv.node())
        .setView([20, 0], 2);

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

    var layerButtons = container.append('div')
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
                if (l.layer == d.layer) map.addLayer(d.layer);
                else if (map.hasLayer(l.layer)) map.removeLayer(l.layer);
            }
        })
        .text(function(d) { return d.title; });

    layerButtons.filter(function(d, i) { return i === 0; }).trigger('click');

    L.mapbox.geocoderControl('tmcw.map-u4ca5hnt').addTo(map);

    return map;
}

function isEmpty(o) {
    for (var i in o) { return false; }
    return true;
}

function showProperties(l) {
    var properties = l.toGeoJSON().properties, table = '';
    if (isEmpty(properties)) properties = { '': '' };

    for (var key in properties) {
        table += '<tr><th><input type="text" value="' + key + '" /></th>' +
            '<td><input type="text" value="' + properties[key] + '" /></td></tr>';
    }

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent('<div class="clearfix"><div class="marker-properties-limit"><table class="marker-properties">' + table + '</table></div>' +
        '<div class="clearfix col12 drop">' +
            '<div class="buttons-joined fl"><button class="save positive">save</button>' +
            '<button class="cancel">cancel</button></div>' +
            '<div class="fr clear-buttons"><button class="delete-invert"><span class="icon-remove-sign"></span> remove</button></div>' +
        '</div></div>'));
}

function geoify(layer) {
    var features = [];
    layer.eachLayer(function(l) {
        if ('toGeoJSON' in l) features.push(l.toGeoJSON());
    });
    layer.clearLayers();
    L.geoJson({ type: 'FeatureCollection', features: features }).eachLayer(function(l) {
        l.addTo(layer);
    });
}
