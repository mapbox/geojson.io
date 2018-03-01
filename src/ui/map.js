require('qs-hash');
require('../lib/custom_hash.js');

var popup = require('../lib/popup'),
    escape = require('escape-html'),
    LGeo = require('leaflet-geodesy'),
    geojsonRewind = require('geojson-rewind'),
    writable = false,
    showStyle = true,
    makiValues = require('../../data/maki.json'),
    maki = '';

for (var i = 0; i < makiValues.length; i++) {
    maki += '<option value="' + makiValues[i].icon + '">';
}

module.exports = function(context, readonly) {

    writable = !readonly;

    function map(selection) {
        context.map = L.mapbox.map(selection.node(), null)
            .setView([20, 0], 2)
            .addControl(L.mapbox.geocoderControl('mapbox.places', {
                position: 'topright'
            }));

        L.control.scale().setPosition('bottomright').addTo(context.map);
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

        context.map.attributionControl.setPrefix('<a target="_blank" href="http://geojson.io/about.html">About</a>');

        function update() {
            var geojson = context.mapLayer.toGeoJSON();
            geojson = geojsonRewind(geojson);
            geojsonToLayer(geojson, context.mapLayer);
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

    var props = JSON.parse(JSON.stringify(l.toGeoJSON().properties)),
        table = '',
        info = '';

    var properties = {};

    // Steer clear of XSS
    for (var k in props) {
        var e = escape(k);
        // users don't want to see "[object Object]"
        if (typeof props[k] === 'object') {
          properties[e] = escape(JSON.stringify(props[k]));
        } else {
          properties[e] = escape(props[k]);
        }
    }

    if (!properties) return;

    if (!Object.keys(properties).length) properties = { '': '' };

    if (l.feature && l.feature.geometry && writable) {
        if (l.feature.geometry.type === 'Point' || l.feature.geometry.type === 'MultiPoint') {
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
        if (l.feature.geometry.type === 'LineString' || l.feature.geometry.type === 'MultiLineString' || l.feature.geometry.type === 'Polygon' || l.feature.geometry.type === 'MultiPolygon') {
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
                    '<td><input type="number" min="0" max="1" step="0.1" value="1"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
            }
        }
        if (l.feature.geometry.type === 'Polygon' || l.feature.geometry.type === 'MultiPolygon') {
            if (!('fill' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="fill"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="color" value="#555555"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
            }
            if (!('fill-opacity' in properties)) {
                table += '<tr class="style-row"><th><input type="text" value="fill-opacity"' + (!writable ? ' readonly' : '') + ' /></th>' +
                    '<td><input type="number" min="0" max="1" step="0.1" value="0.5"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
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
                '<td><input type="number" min="0" max="1" step="0.1" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
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

    var tabs = '<div class="pad1 tabs-ui clearfix col12">' +
                    '<div class="tab col12">' +
                        '<input class="hide" type="radio" id="properties" name="tab-group" checked="true">' +
                        '<label class="keyline-top keyline-right tab-toggle pad0 pin-bottomleft z10 center col6" for="properties">Properties</label>' +
                        '<div class="space-bottom1 col12 content">' +
                            '<table class="space-bottom0 marker-properties">' + table + '</table>' +
                            (writable ? '<div class="add-row-button add fl col3"><span class="icon-plus"> Add row</div>' +
                            '<div class="fl text-right col9"><input type="checkbox" id="show-style" name="show-style" value="true" checked><label for="show-style">Show style properties</label></div>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="space-bottom2 tab col12">' +
                        '<input class="hide" type="radio" id="info" name="tab-group">' +
                        '<label class="keyline-top tab-toggle pad0 pin-bottomright z10 center col6" for="info">Info</label>' +
                        '<div class="space-bottom1 col12 content">' +
                            '<div class="marker-info">' + info + ' </div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

    var content = tabs +
        (writable ? '<div class="clearfix col12 pad1 keyline-top">' +
            '<div class="pill col6">' +
            '<button class="save col6 major">Save</button> ' +
            '<button class="minor col6 cancel">Cancel</button>' +
            '</div>' +
            '<button class="col6 text-right pad0 delete-invert"><span class="icon-remove-sign"></span> Delete feature</button></div>' : '');

    l.bindPopup(L.popup({
        closeButton: false,
        maxWidth: 500,
        maxHeight: 400,
        autoPanPadding: [5, 45],
        className: 'geojsonio-feature'
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
