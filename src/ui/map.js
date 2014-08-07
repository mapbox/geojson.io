var popup = require('../lib/popup'),
    customHash = require('../lib/custom_hash.js'),
    qs = require('qs-hash');
    LGeo = require('leaflet-geodesy'),
    writable = false;


module.exports = function(context, readonly) {

    writable = !readonly;

    function map(selection) {

        context.map = L.mapbox.map(selection.node(), null, {
                infoControl: false,
                attributionControl: true
            })
            .setView([20, 0], 2)
            .addControl(L.mapbox.geocoderControl('tmcw.map-u4ca5hnt', {
                position: 'topright'
            }));

        context.map.zoomControl.setPosition('topright');

        L.hash(context.map);

        context.mapLayer = L.featureGroup().addTo(context.map);

        if (writable) {
          context.drawControl = new L.Control.Draw({
              position: 'topright',
              edit: { featureGroup: context.mapLayer },
              draw: {
                  circle: false,
                  polyline: { metric: navigator.language !== 'en-US' },
                  polygon: { metric: navigator.language !== 'en-US' },
                  marker: {
                      icon: L.mapbox.marker.icon({})
                  }
              }
          }).addTo(context.map);

          context.map
            .on('draw:edited', update)
            .on('draw:deleted', update);
        }

        context.map
            .on('draw:created', created)
            .on('popupopen', popup(context));

        context.map.attributionControl.addAttribution('<a target="_blank" href="http://tmcw.wufoo.com/forms/z7x4m1/">Feedback</a>');
        context.map.attributionControl.addAttribution('<a target="_blank" href="http://geojson.io/about.html">About</a>');

        function update() {
            geojsonToLayer(context.mapLayer.toGeoJSON(), context.mapLayer);
            context.data.set({map: layerToGeoJSON(context.mapLayer)}, 'map');
        }

        context.dispatch.on('change.map', function() {
            geojsonToLayer(context.data.get('map'), context.mapLayer);
        });

        function created(e) {
            context.mapLayer.addLayer(e.layer);
            update();
        }
    }

    function layerToGeoJSON(layer) {
        var features = [];
        layer.eachLayer(collect);
        function collect(l) { if ('toGeoJSON' in l) features.push(l.toGeoJSON()); }
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    return map;
};

function geojsonToLayer(geojson, layer) {
    layer.clearLayers();
    L.geoJson(geojson, {
        style: L.mapbox.simplestyle.style,
        pointToLayer: function(feature, latlon) {
            if (!feature.properties) feature.properties = {};
            return L.mapbox.marker.style(feature, latlon);
        }
    }).eachLayer(add);
    function add(l) {
        bindPopup(l);
        l.addTo(layer);
    }
}

function bindPopup(l) {

    var properties = l.toGeoJSON().properties,
        table = '',
        info = '';

    if (!properties) return;

    if (!Object.keys(properties).length) properties = { '': '' };

    for (var key in properties) {
        table += '<tr><th><input type="text" value="' + key + '"' + (!writable ? ' readonly' : '') + ' /></th>' +
            '<td><input type="text" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
    }

    if (l.feature && l.feature.geometry) {
        info += '<table class="metadata">';
        if (l.feature.geometry.type === 'LineString') {
            var total = d3.pairs(l.feature.geometry.coordinates).reduce(function(total, pair) {
                return total + L.latLng(pair[0][1], pair[0][0])
                    .distanceTo(L.latLng(pair[1][1], pair[1][0]));
            }, 0);
            info += '<tr><td>meters</td><td>' + total.toFixed(2) +    '</td></tr>';
            info += '<tr><td>miles</td><td>' + (total / 1609.34).toFixed(2) + '</td></tr>';
        } else if (l.feature.geometry.type === 'Point') {
            info += '<tr><td>Latitude </td><td>' + l.feature.geometry.coordinates[1].toFixed(4) + '</td></tr>' +
                    '<tr><td>Longitude</td><td>' + l.feature.geometry.coordinates[0].toFixed(4) + '</td></tr>';
        } else if (l.feature.geometry.type === 'Polygon') {
            info += '<tr><td>Area km<sup>2</sup></td><td>' + (LGeo.area(l) / 1000000).toFixed(2) + '</td></tr>';
        }
        info += '</table>';
    }

    var content = '<div class="clearfix">' +
        '<div class="marker-info">' + info + ' </div>' +
        '<div class="marker-properties-limit"><table class="marker-properties">' + table + '</table></div>' +
        (writable ? '<br /><div class="clearfix col12">' +
            '<div class="buttons-joined fl"><button class="add major">add row</button> ' +
            '<button class="save major">save</button> ' +
            '<button class="major cancel">cancel</button></div>' +
            '<div class="fr clear-buttons"><button class="delete-invert"><span class="icon-remove-sign"></span> remove</button></div></div>' : '') +
        '</div>';

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent(content));
}
