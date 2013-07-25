var geojsonField = document.getElementById('geojson'),
    uploadButton = document.getElementById('save'),
    downloadButton = document.getElementById('download'),
    aboutButton = document.getElementById('about'),
    copyButton = document.getElementById('copy'),
    statusIcon = document.getElementById('status'),
    aboutButton = document.getElementById('about'),
    editButton = document.getElementById('edit'),
    loadButton = document.getElementById('load'),
    gistLink = document.getElementById('gist-link'),
    hereLink = document.getElementById('here-link'),
    linkUi = document.getElementsByClassName('link-ui')[0];
    linkUiClose = document.getElementById('link-ui-close');

var map = L.mapbox.map('map', 'tmcw.map-7s15q36b').setView([20, 0], 2);

// Initialize the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup().addTo(map);

// Initialize the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { circle: false }
}).addTo(map);

CodeMirror.keyMap.tabSpace = {
    Tab: function(cm) {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces, 'end', '+input');
    },
    fallthrough: ['default']
};

var editor = CodeMirror.fromTextArea(geojsonField, {
    mode: 'application/json',
    matchBrackets: true,
    tabSize: 2,
    gutters: ['error'],
    theme: 'monokai',
    autofocus: (window === window.top),
    keyMap: 'tabSpace',
    lineNumbers: true
});

editor.on('change', editorChange);

uploadButton.onclick = function() { saveAsGist(editor); };

downloadButton.onclick = function() { saveAsFile(editor); };

function closeLinkUI() { linkUi.className = 'link-ui'; }

linkUiClose.onclick = closeLinkUI;

aboutButton.onclick = function() {
    document.getElementsByClassName('edit-pane')[0].className = 'edit-pane pane';
    document.getElementsByClassName('about-pane')[0].className = 'about-pane pane active';
};

editButton.onclick = function() {
    document.getElementsByClassName('edit-pane')[0].className = 'edit-pane pane active';
    document.getElementsByClassName('about-pane')[0].className = 'about-pane pane';
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
        copyButton.innerHTML = "<span class='icon icon-copy'></span>";
        copyButton.className = '';
    }, 1000);
});

clip.on('mousedown', function(client) {
    clip.setText(JSON.stringify(getGeoJSON(), null, 2));
});


map.on('draw:created', updateG)
    .on('draw:edited', updateG)
    .on('draw:created', function(e) {
        drawnItems.addLayer(e.layer);
    });

window.onhashchange = hashChange;

if (window.location.hash) {
    hashChange();
}

function loadGeoJSON(gj) {
    drawnItems.clearLayers();
    L.geoJson(gj).eachLayer(function(l) {
        showProperties(l);
        l.addTo(drawnItems);
    });
    map.fitBounds(drawnItems.getBounds());
}

function editorChange() {
    closeLinkUI();
    var err = geojsonhint.hint(editor.getValue());
    statusIcon.className = 'icon-circle';
    if (err && err instanceof Error) {
        handleError(err.message);
        statusIcon.className = 'icon-circle-blank';
        statusIcon.title = 'invalid JSON';
        statusIcon.setAttribute('message', 'invalid JSON');
    } else if (err && err.length) {
        handleErrors(err);
        statusIcon.className = 'icon-circle-blank';
        statusIcon.setAttribute('message', 'invalid GeoJSON');
    } else {
        var gj = JSON.parse(editor.getValue());
        try {
            loadGeoJSON(gj);
            editor.clearGutter('error');
            statusIcon.setAttribute('message', 'valid');
        } catch(e) {
            statusIcon.className = 'icon-circle-blank';
            statusIcon.setAttribute('message', 'invalid GeoJSON');
        }
    }
}

function handleError(msg) {
    var match = msg.match(/line (\d+)/);
    if (match && match[1]) {
        editor.clearGutter('error');
        editor.setGutterMarker(parseInt(match[1], 10) - 1, 'error', makeMarker(msg));
    }
}

function handleErrors(errors) {
    editor.clearGutter('error');
    errors.forEach(function(e) {
        editor.setGutterMarker(e.line, 'error', makeMarker(e.message));
    });
}

function makeMarker(msg) {
    var el = document.createElement('div');
    el.className = 'error-marker';
    el.setAttribute('message', msg);
    return el;
}

function showProperties(l) {
    var properties = l.toGeoJSON().properties, table = '';
    for (var key in properties) {
        table += '<tr><th>' + key + '</th>' +
            '<td>' + properties[key] + '</td></tr>';
    }
    if (table) l.bindPopup('<table class="marker-properties">' + table + '</table>');
}

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

function firstFile(gist) {
    for (var f in gist.files) {
        return gist.files[f].content;
    }
}

function hashChange() {
    var id = window.location.hash.substring(1);

    uploadButton.className = 'loading';
    xhr('https://api.github.com/gists/' + id,
        function() {
            uploadButton.className = '';
            if (this.status < 400 && this.responseText) {
                var first = !editor.getValue();
                editor.setValue(firstFile(JSON.parse(this.responseText)));
                editorChange();
                if (first && drawnItems.getBounds()) {
                    map.fitBounds(drawnItems.getBounds());
                }
            } else {
                alert('Gist API limit exceeded, come back in a bit.');
            }
    });
}

function xhr(url, cb) {
    var h = new window.XMLHttpRequest();
    h.onload = cb;
    h.open('GET', url, true);
    h.send();
}

function saveAsGist(editor) {
    var content = editor.getValue(),
        h = new window.XMLHttpRequest();

    h.onload = function() {
        if (this.status < 400 && this.responseText) {
            var d = (JSON.parse(h.responseText));
            window.location.hash = '#' + d.id;

            hereLink.innerHTML = window.location;
            hereLink.setAttribute('href', window.location);

            var gistUrl = 'http://gist.github.com/' + d.id;
            gistLink.innerHTML = gistUrl;
            gistLink.setAttribute('href', gistUrl);

            linkUi.className = 'link-ui active';
        } else {
            alert('Gist API limit exceeded; saving to GitHub temporarily disabled.');
        }
    };

    h.onerror = function() {};

    h.open('POST', 'https://api.github.com/gists', true);
    h.send(JSON.stringify({
        description: 'Gist from edit-GeoJSON',
        public: true,
        files: {
            'map.geojson': {
                content: content
            }
        }
    }));
}

function saveAsFile(editor) {
    var content = editor.getValue();
    if (content) {
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'map.geojson');
    }
}
