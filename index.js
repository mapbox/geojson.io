var savedButton = document.getElementById('saved'),
    geojsonField = document.getElementById('geojson'),
    uploadButton = document.getElementById('upload'),
    downloadButton = document.getElementById('download'),
    aboutButton = document.getElementById('about'),
    copyButton = document.getElementById('copy'),
    loadButton = document.getElementById('load');

var map = L.mapbox.map('map', 'tmcw.map-7s15q36b')
    .setView([20, 0], 2);

// Initialize the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup().addTo(map);

// Initialize the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
    draw: {
        circle: false
    }
}).addTo(map);

function saveAsGist(editor) {
    var content = editor.getValue(),
        h = new window.XMLHttpRequest();

    h.onload = function() {
        uploadButton.className = 'done';
        uploadButton.innerHTML = 'saved';
        setTimeout(function() {
            uploadButton.className = '';
            uploadButton.innerHTML = 'upload';
        }, 1000);
        var d = (JSON.parse(h.responseText));
        window.location.hash = '#' + d.id;
    };

    h.onerror = function() {};

    h.open('POST', 'https://api.github.com/gists', true);
    h.send(JSON.stringify({
        description: "Gist from edit-GeoJSON",
        public: true,
        files: {
            "map.geojson": {
                content: content
            }
        }
    }));
}

function saveAsFile(editor) {
    var content = editor.getValue();
    if(content) {
        var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "map.geojson");
    }
}

var editor = CodeMirror.fromTextArea(geojsonField, {
    mode: 'javascript',
    matchBrackets: true,
    tabSize: 2,
    autofocus: (window === window.top),
    extraKeys: {
        'Ctrl-S': saveAsGist,
        'Cmd-S': saveAsGist
    },
    smartIndent: true
});

uploadButton.onclick = function() { saveAsGist(editor); };

downloadButton.onclick = function() { saveAsFile(editor); };

aboutButton.onclick = function() { window.open('about.html'); };

loadButton.onclick = function() {
    loadGeoJSON(JSON.parse(editor.getValue()));
};

document.onkeydown = function(e) {
    if (e.keyCode == 83 && e.metaKey) {
        saveAsGist(editor);
        e.preventDefault();
    }
};

ZeroClipboard.setDefaults({
    moviePath: 'lib/zeroclipboard/ZeroClipboard.swf'
});

var clip = new ZeroClipboard(copyButton);

clip.on('complete', function(client, args) {
    copyButton.className = 'done';
    copyButton.innerHTML = 'copied to your clipboard';
    setTimeout(function() {
        copyButton.innerHTML = 'copy';
        copyButton.className = '';
    }, 1000);
});

clip.on('mousedown', function(client) {
    clip.setText(JSON.stringify(getGeoJSON(), null, 2));
});

function loadGeoJSON(gj) {
    editor.setValue(JSON.stringify(gj, null, 2));
    drawnItems.clearLayers();
    L.geoJson(gj).eachLayer(function(l) {
        showProperties(l);
        l.addTo(drawnItems);
    });
}

function showProperties(l) {
    var properties = l.toGeoJSON().properties, table = '';

    for (var key in properties) {
        table += '<tr><th>' + key + '</th>' +
            '<td>' + properties[key] + '</td></tr>';
    }

    if (table) l.bindPopup('<table class="marker-properties">' + table + '</table>');
}

map.on('draw:created', updateG)
    .on('draw:edited', updateG)
    .on('draw:created', function(e) {
        drawnItems.addLayer(e.layer);
    });

function updateG() {
    window.setTimeout(function() {
        editor.setValue(JSON.stringify(getGeoJSON(), null, 2));
    }, 100);
}

function getGeoJSON() {
    var features = [];
    drawnItems.eachLayer(function(l) {
        if ('toGeoJSON' in l) features.push(l.toGeoJSON());
    });
    return {
        type: 'FeatureCollection',
        features: features
    };
}

function xhr(url, cb) {
    var h = new window.XMLHttpRequest();
    h.onload = cb;
    h.open('GET', url, true);
    h.send();
}

window.onhashchange = hashChange;

if (window.location.hash) {
    hashChange();
}

function firstFile(gist) {
    for (f in gist.files) {
        return JSON.parse(gist.files[f].content);
    }
}

function hashChange() {
    var id = window.location.hash.substring(1);
    xhr('https://api.github.com/gists/' + id,
        function() {
            if (this.status < 400 && this.responseText) {
                loadGeoJSON(firstFile(JSON.parse(this.responseText)));
            }
            savedButton.innerHTML = 'gist#' + id;
            savedButton.onclick = function() {
                window.open('http://gist.github.com/' + id);
            };
    });
}


