var pane = d3.select('.pane');

var production = (location.hostname === 'geojson.io');

var client_id = production ?
    '62c753fd0faf18392d85' :
    'bb7bbe70bd1f707125bc';

var gatekeeper_url = production ?
    'http://geojsonioauth.herokuapp.com' :
    'http://localhostauth.herokuapp.com';

var map = L.mapbox.map('map').setView([20, 0], 2);
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

L.mapbox.geocoderControl('tmcw.map-u4ca5hnt').addTo(map);

var drawnItems = new L.FeatureGroup().addTo(map);
var drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { circle: false }
}).addTo(map);

map.on('draw:edited', updateFromMap)
    .on('draw:deleted', updateFromMap)
    .on('draw:created', drawCreated)
    .on('draw:created', updateFromMap);

d3.select('.collapse-button')
    .on('click', function() {
        d3.select('.right').classed('hidden',
            !d3.select('.right').classed('hidden'));
        d3.select('#map').classed('fullsize',
            !d3.select('#map').classed('fullsize'));
        map.invalidateSize();
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

var updates = d3.dispatch('update_map', 'update_editor', 'update_refresh', 'focus_layer');

updates.on('focus_layer', function(layer) {
    if (!layer) return;
    if ('getBounds' in layer && layer.getBounds().isValid()) {
        layer.openPopup();
        map.fitBounds(layer.getBounds());
    } else if ('getLatLng' in layer) {
        layer.openPopup();
        map.setView(layer.getLatLng(), 15);
    }
});

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

function drawCreated(e) {
    // if ('setStyle' in e.layer) e.layer.setStyle(brush);
    drawnItems.addLayer(e.layer);
    geoify(drawnItems);
    refresh();
    analytics.track('Drew Feature');
}

CodeMirror.keyMap.tabSpace = {
    Tab: function(cm) {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces, 'end', '+input');
    },
    fallthrough: ['default']
};

var editor;

var dropSupport = (window.FileReader && 'ondrop' in window);

function authorize(xhr) {
    return localStorage.github_token ?
        xhr.header('Authorization', 'token ' + localStorage.github_token) :
        xhr;
}

function loggedin() {
    return !!localStorage.github_token;
}
var buttonData = [{
    icon: 'beaker',
    title: ' Import',
    behavior: importPanel
}, {
    icon: 'table',
    title: ' Table',
    alt: 'Edit feature properties in a table',
    behavior: tablePanel
}, {
    icon: 'share-alt',
    title: ' Share',
    alt: 'Share via Facebook, Twitter, or a map embed',
    behavior: sharePanel
},{
    icon: 'code',
    alt: 'JSON Source',
    behavior: jsonPanel
}, {
    icon: 'github',
    alt: 'Log in to GitHub',
    behavior: loginPanel
}];

var buttons;

function drawButtons(data) {
    buttons = d3.select('.buttons')
        .selectAll('button')
        .data(data, function(d) {
            return d.icon;
        });
    buttons.enter()
        .append('button')
        .attr('title', function(d) {
            return d.alt;
        })
        .attr('class', function(d) {
            return 'icon-' + d.icon;
        })
        .text(function(d) { return d.title; })
        .on('click', function(d) {
            updates.on('update_map.mode', null);
            buttons.classed('active', function(_) { return d.icon == _.icon; });
            pane.call(d.behavior, updates);
            updateFromMap();
        })
        .each(function(d) {
            if (d.behavior.init) d.behavior.init(this);
        });
    buttons.exit().remove();

    d3.select(buttons.node()).trigger('click');
}

drawButtons(buttonData);

map.on('popupopen', onPopupOpen);

function onPopupOpen(e) {
    var sel = d3.select(e.popup._contentNode);

    sel.selectAll('.cancel')
        .on('click', clickClose);

    sel.selectAll('.save')
        .on('click', saveFeature);

    function clickClose() {
        map.closePopup(e.popup);
    }

    function saveFeature() {
        var obj = {};
        sel.selectAll('tr')
            .each(function() {
                obj[d3.select(this).selectAll('input')[0][0].value] =
                    d3.select(this).selectAll('input')[0][1].value;
            });
        e.popup._source.feature.properties = obj;
        map.closePopup(e.popup);
        refresh();
        analytics.track('Save Properties via Popup');
    }
}

function jsonPanel(container) {
    container.html('');

    var textarea = container.append('textarea');
    editor = CodeMirror.fromTextArea(textarea.node(), {
        mode: 'application/json',
        matchBrackets: true,
        tabSize: 2,
        gutters: ['error'],
        theme: 'eclipse',
        autofocus: (window === window.top),
        keyMap: 'tabSpace',
        lineNumbers: true
    });

    // shush the callback-back
    var quiet = false;
    editor.on('change', validate(changeValidated));

    function changeValidated(err, data) {
        if (quiet) { quiet = false; return; }
        if (!err) {
            loadToMap(data);
        }
    }

    updates.on('update_map.mode', function(data) {
        quiet = true;
        editor.setValue(JSON.stringify(data, null, 2));
    });
}

d3.select(document).on('keydown', keydown);
d3.select(window).on('hashchange', hashChange);

if (window.location.hash) hashChange();

function keydown(e) {
    if (d3.event.keyCode == 83 && d3.event.metaKey) {
        d3.event.preventDefault();
        saveChanges();
    }
}

function saveChanges(message, callback) {
    var content = JSON.stringify({ type: 'FeatureCollection', features: featuresFromMap() }, null, 2);

    if (!source() || source().type == 'gist') {
        saveAsGist(content, function(err, resp) {
            if (err) return alert(err);
            var id = resp.id;
            location.hash = '#gist:' + id;
            if (callback) callback();
        });
    } else if (!source() || source().type == 'github') {
        saveAsGitHub(content, function(err, resp) {
            if (err) return alert(err);
            if (callback) callback();
        }, message);
    }
}

function featuresFromMap() {
    var features = [];
    drawnItems.eachLayer(function(l) {
        if ('toGeoJSON' in l) features.push(l.toGeoJSON());
    });
    return features;
}

function updateFromMap() {
    updates.update_map({ type: 'FeatureCollection', features: featuresFromMap() }, drawnItems);
}

function refresh() {
    drawnItems.eachLayer(function(l) {
        showProperties(l);
    });
}

updates.on('update_editor', loadToMap);
updates.on('update_refresh', refresh);

function loadToMap(gj) {
    drawnItems.clearLayers();
    L.geoJson(gj).eachLayer(function(l) {
        showProperties(l);
        l.addTo(drawnItems);
    });
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
    if (table) l.bindPopup('<table class="marker-properties">' + table + '</table>' +
        '<button class="save">save</button>' +
        '<button class="cancel">cancel</button>');
}

function mapFile(gist) {
    for (var f in gist.files) if (f == 'map.geojson') return JSON.parse(gist.files[f].content);
}

function source() {
    if (!location.hash) return null;

    var txt = location.hash.substring(1);

    if (!isNaN(parseInt(txt, 10))) {
        // legacy gist
        return {
            type: 'gist',
            id: parseInt(txt, 10)
        };
    } else if (txt.indexOf('gist:') === 0) {
        return {
            type: 'gist',
            id: parseInt(txt.replace(/^gist:/, ''), 10)
        };
    } else if (txt.indexOf('github:') === 0) {
        return {
            type: 'github',
            id: txt.replace(/^github:\/?/, '')
        };
    }
}

function hashChange() {
    var s = source();

    if (!s) {
        location.hash = '';
        return;
    }

    if (s.type == 'gist') loadGist(s.id, onGistLoad);
    if (s.type == 'github') loadGitHub(s.id, onGitHubLoad);

    function onGistLoad(err, json) {
        if (err) return alert('Gist API limit exceeded, come back in a bit.');

        var first = !drawnItems.getBounds().isValid();
        try {
            var file = mapFile(json);
        } catch(e) {
            alert('Invalid GeoJSON data in this Gist');
            analytics.track('Invalid JSON in Gist');
        }
        updates.update_editor(mapFile(json));
        if (first && drawnItems.getBounds().isValid()) {
            map.fitBounds(drawnItems.getBounds());
            buttons.filter(function(d, i) { return i == 1; }).trigger('click');
        }
    }

    function onGitHubLoad(err, file) {
        if (err) return alert('Gist API limit exceeded, come back in a bit.');

        try {
            var json = JSON.parse(Base64.fromBase64(file.content));
            var first = !drawnItems.getBounds().isValid();
            updates.update_editor(json);
            if (first && drawnItems.getBounds().isValid()) {
                map.fitBounds(drawnItems.getBounds());
                buttons.filter(function(d, i) { return i == 1; }).trigger('click');
            }
            drawButtons(buttonData.concat([{
                icon: 'save',
                title: ' Commit',
                behavior: commitPanel
            }]));
        } catch(e) {
            alert('Loading a file from GitHub failed');
            console.error(e);
        }
    }
}
