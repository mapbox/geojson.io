var popup = require('../lib/popup'),
    customHash = require('../lib/custom_hash.js'),
    qs = require('qs-hash'),
    LGeo = require('leaflet-geodesy'),
    writable = false,
    showStyle = true,
    maki = '';

d3.json("data/maki.json", function(error, json) {
    for (i = 0; i < json.length; i++) {
        console.log(json[i].icon);
        maki += '<option value="' + json[i].icon + '">';
    }
});

module.exports = function(context, readonly) {

    writable = !readonly;

    function map(selection) {
        context.map = L.mapbox.map(selection.node(), null, {
                infoControl: false,
                attributionControl: true
            })
            .setView([20, 0], 2)
            .addControl(L.mapbox.geocoderControl('mapbox.places-permanent', {
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
                  polyline: { metric: (navigator.language !== 'en-us' && navigator.language !== 'en-US') },
                  polygon: { metric: (navigator.language !== 'en-us' && navigator.language !== 'en-US') },
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

    if (l.feature && l.feature.geometry && writable) {
        if (l.feature.geometry.type === 'Point') {
            if (!('marker-color' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="marker-color"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="color" value="#7E7E7E"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
            }
            if (!('marker-size' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="marker-size"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="text" list="marker-size" value="medium"' + (!writable ? ' readonly' : '') + ' /><datalist id="marker-size"><option value="small"><option value="medium"><option value="large"></datalist></td></tr>';
            }
            if (!('marker-symbol' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="marker-symbol"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="text" list="marker-symbol" value=""' + (!writable ? ' readonly' : '') + ' /><datalist id="marker-symbol">' + maki + '</datalist></td></tr>';
            }
        }
        if (l.feature.geometry.type === 'LineString' || l.feature.geometry.type === 'Polygon') {
            if (!('stroke' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="stroke"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="color" value="#555555"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
            }
            if (!('stroke-width' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="stroke-width"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="number" min="0" step="0.1" value="2"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
            }
            if (!('stroke-opacity' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="stroke-opacity"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="range" min="0" max="1" step="0.1" value="1"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
            }
        }
        if (l.feature.geometry.type === 'Polygon') {
            if (!('fill' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="fill"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="color" value="#555555"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
            }
            if (!('fill-opacity' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="fill-opacity"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="range" min="0" max="1" step="0.1" value="0.5"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
            }
        }
    }

    for (var key in properties) {
        if ((key == 'marker-color' || key == 'stroke' || key == 'fill') && writable) {
            table += '<tr class="style-row"><th><input type="text" value="' + key + '"' + (!writable ? ' readonly' : '') + ' /></th>' +
                '<td><input type="color" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
        }
        else if (key == 'marker-size' && writable) {
            table += '<tr class="style-row"><th><input type="text" value="' + key + '"' + (!writable ? ' readonly' : '') + ' /></th>' +
                '<td><input type="text" list="marker-size" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /><datalist id="marker-size"><option value="small"><option value="medium"><option value="large"></datalist></td></tr>';
        }
        else if (key == 'marker-symbol' && writable) {
            table += '<tr class="style-row"><th><input type="text" value="' + key + '"' + (!writable ? ' readonly' : '') + ' /></th>' +
                '<td><input type="text" list="marker-symbol" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /><datalist id="marker-symbol">' + maki + '</datalist></td></tr>';
        }
        else if (key == 'stroke-width' && writable) {
            table += '<tr class="style-row"><th><input type="text" value="' + key + '"' + (!writable ? ' readonly' : '') + ' /></th>' +
                '<td><input type="number" min="0" step="0.1" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
        }
        else if ((key == 'stroke-opacity' || key == 'fill-opacity') && writable) {
            table += '<tr class="style-row"><th><input type="text" value="' + key + '"' + (!writable ? ' readonly' : '') + ' /></th>' +
                '<td><input type="range" min="0" max="1" step="0.1" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
        }
        else {
            table += '<tr><th><input type="text" value="' + key + '"' + (!writable ? ' readonly' : '') + ' /></th>' +
                '<td><input type="text" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
        }
    }

    if (l.feature && l.feature.geometry) {
        info += '<table class="metadata">';
        if (l.feature.geometry.type === 'LineString') {
            var total = d3.pairs(l.feature.geometry.coordinates).reduce(function(total, pair) {
                return total + L.latLng(pair[0][1], pair[0][0])
                    .distanceTo(L.latLng(pair[1][1], pair[1][0]));
            }, 0);
            info += '<tr><td>Meters</td><td>' + total.toFixed(2) + '</td></tr>' +
                    '<tr><td>Kilometers</td><td>' + (total / 1000).toFixed(2) + '</td></tr>' +
                    '<tr><td>Feet</td><td>' + (total / 0.3048).toFixed(2) + '</td></tr>' +
                    '<tr><td>Yards</td><td>' + (total / 0.9144).toFixed(2) + '</td></tr>' +
                    '<tr><td>Miles</td><td>' + (total / 1609.34).toFixed(2) + '</td></tr>';
        } else if (l.feature.geometry.type === 'Point') {
            info += '<tr><td>Latitude </td><td>' + l.feature.geometry.coordinates[1].toFixed(4) + '</td></tr>' +
                    '<tr><td>Longitude</td><td>' + l.feature.geometry.coordinates[0].toFixed(4) + '</td></tr>';
        } else if (l.feature.geometry.type === 'Polygon') {
          info += '<tr><td>Sq. Meters</td><td>' + (LGeo.area(l)).toFixed(2) + '</td></tr>' +
                  '<tr><td>Sq. Kilometers</td><td>' + (LGeo.area(l) / 1000000).toFixed(2) + '</td></tr>' +
                  '<tr><td>Sq. Feet</td><td>' + (LGeo.area(l) / 0.092903).toFixed(2) + '</td></tr>' +
                  '<tr><td>Acres</td><td>' + (LGeo.area(l) / 4046.86).toFixed(2) + '</td></tr>' +
                  '<tr><td>Sq. Miles</td><td>' + (LGeo.area(l) / 2589990).toFixed(2) + '</td></tr>';
        }
        info += '</table>';
    }

    var tabs = '<div class="tabs-ui">' +
                    '<div class="tab">' +
                        '<input type="radio" id="properties" name="tab-group" checked="true">' +
                        '<label for="properties">Properties</label>' +
                        '<div class="content">' +
                            (writable ? '<input type="checkbox" id="show-style" name="show-style" value="true" checked> Show style properties<br>' : '') +
                            '<table class="marker-properties">' + table + '</table>' +
                        '</div>' +
                    '</div>' +
                    '<div class="tab">' +
                        '<input type="radio" id="info" name="tab-group">' +
                        '<label for="info">Info</label>' +
                        '<div class="content">' +
                            '<div class="marker-info">' + info + ' </div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

    var content = '<div class="clearfix">' +
        '<div>' + tabs + '</div>' +
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

    l.on('popupopen', function(e){
        if (showStyle === false) {
            d3.select('#show-style').property('checked', false);
              d3.selectAll('.style-row').style('display','none');
        }
        d3.select('#show-style').on('click', function() {
            if (this.checked) {
                showStyle = true;
                d3.selectAll('.style-row').style('display','');
            } else {
                showStyle = false;
                d3.selectAll('.style-row').style('display','none');
            }
        });
    });
}
