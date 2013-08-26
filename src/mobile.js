var map = require('./ui/map')();
var gist = require('./source/gist'),
    source = require('./source.js'),
    github = require('./source/github');

var drawnItems = L.featureGroup().addTo(map);

var s = source();

if (!s) { window.location.hash = ''; }
else if (s.type == 'gist') gist.loadGist(s.id, onGistLoad);
else if (s.type == 'github') github.loadGitHub(s.id, onGitHubLoad);

function mapFile(gist) {
    var f;
    for (f in gist.files) if (f.indexOf('.geojson') !== -1) return JSON.parse(gist.files[f].content);
    for (f in gist.files) if (f.indexOf('.json') !== -1) return JSON.parse(gist.files[f].content);
}

function loadToMap(gj) {
    drawnItems.clearLayers();
    L.geoJson(gj).eachLayer(function(l) {
        showProperties(l);
        l.addTo(drawnItems);
    });
}

function onGistLoad(err, json) {
    if (err) return alert('Gist API limit exceeded, come back in a bit.');
    var first = !drawnItems.getBounds().isValid();

    try {
        var file = mapFile(json);
        loadToMap(file);
        if (first && drawnItems.getBounds().isValid()) {
            map.fitBounds(drawnItems.getBounds());
        }
    } catch(e) {
    }
}

function onGitHubLoad(err, file) {
    if (err) return alert('GitHub API limit exceeded, come back in a bit.');

    try {
        var json = JSON.parse(Base64.fromBase64(file.content));
        loadToMap(json);
        if (drawnItems.getBounds().isValid()) {
            map.fitBounds(drawnItems.getBounds());
        }
    } catch(e) {
        alert('Loading a file from GitHub failed');
    }
}

function isEmpty(o) {
    for (var i in o) { return false; }
    return true;
}

function showProperties(l) {
    var properties = l.toGeoJSON().properties, table = '';
    if (isEmpty(properties)) properties = { '': '' };

    for (var key in properties) {
        table += '<tr><th>' + key + '</th>' +
            '<td>' + properties[key] + '</td></tr>';
    }

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent('<table class="marker-properties display">' + table + '</table>'));
}
