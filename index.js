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

var saved = document.getElementById('saved');

function saveAsGist(editor) {
    var content = editor.getValue(),
        h = new window.XMLHttpRequest();

    document.body.className = 'loading';

    h.onload = function() {
        document.body.className = '';
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

var editor = CodeMirror.fromTextArea(document.getElementById('geojson'), {
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

document.getElementById('upload').onclick = function() {
    saveAsGist(editor);
};

document.getElementById('about').onclick = function() {
    window.open('about.html');
};

document.getElementById('load').onclick = function() {
    loadGeoJSON(JSON.parse(editor.getValue()));
};

document.onkeydown = function(e) {
    if (e.keyCode == 83 && e.metaKey) {
        saveAsGist(editor);
        e.preventDefault();
    }
};

function loadGeoJSON(gj) {
    editor.setValue(JSON.stringify(gj, null, 2))
    drawnItems.clearLayers();
    L.geoJson(gj).eachLayer(function(l) {
        l.addTo(drawnItems);
    });
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
            saved.innerHTML = 'gist#' + id;
            saved.onclick = function() {
                window.open('http://gist.github.com/' + id);
            };
    });
}
