ZeroClipboard.setDefaults({
    moviePath: 'lib/zeroclipboard/ZeroClipboard.swf'
});

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
    newHere = document.getElementById('new-here'),
    hereLink = document.getElementById('here-link'),

    propertiesLink = document.getElementById('properties-view'),
    propertiesPane = document.getElementById('properties-pane'),

    linkUi = document.getElementsByClassName('link-ui')[0];
    linkUiClose = document.getElementById('link-ui-close'),
    clip = new ZeroClipboard(copyButton);

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


clip.on('complete', clipComplete);

clip.on('mousedown', function(client) {
    clip.setText(JSON.stringify(getGeoJSON(), null, 2));
});

map.on('draw:created', updateG)
    .on('draw:edited', updateG)
    .on('draw:deleted', updateG)
    .on('draw:created', function(e) {
        drawnItems.addLayer(e.layer);
    });

window.onhashchange = hashChange;
if (window.location.hash) hashChange();

function clipComplete(client, args) {
    copyButton.className = 'done';
    copyButton.innerHTML = 'copied to your clipboard';
    setTimeout(function() {
        copyButton.innerHTML = "<span class='icon icon-copy'></span>";
        copyButton.className = '';
    }, 1000);
}

function closeLinkUI() { linkUi.className = 'link-ui'; }

function loadGeoJSON(gj) {
    drawnItems.clearLayers();
    L.geoJson(gj).eachLayer(function(l) {
        showProperties(l);
        l.addTo(drawnItems);
    });
}

function editorChange() {
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

function fieldArrayToProperties(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) {
        obj[arr[i][0].value] = arr[i][1].value;
    }
    return obj;
}

// PROPERTIES
// ----------------------------------------------------------------------------
function propertyTable(layer, container) {

    var properties = layer.toGeoJSON().properties;
    var div = document.createElement('div');
    div.className = 'property-table';

    var table = div.appendChild(document.createElement('table'));

    function removeRow() {
        var inputs = this.parentNode.parentNode.getElementsByTagName('input');
        for (var i = 0; i < inputs.length; i++) { inputs[i].value = ''; }
        this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
        onchange();
    }

    var fields = [];

    for (var key in properties) {
        var tr = table.appendChild(document.createElement('tr'));

        var removeTd = tr.appendChild(document.createElement('td'));
        var removeButton = removeTd.appendChild(document.createElement('button'));

        removeButton.onclick = removeRow;
        removeButton.innerHTML = 'x';

        var keyTd = tr.appendChild(document.createElement('td'));
        var keyInput = tr.appendChild(document.createElement('input'));
        keyInput.value = key;

        var valueTd = tr.appendChild(document.createElement('td'));
        var valueInput = tr.appendChild(document.createElement('input'));
        valueInput.value = properties[key];

        keyInput.onblur =
            keyInput.onchange =
            valueInput.onchange =
            valueInput.onblur = onchange;

        fields.push([keyInput, valueInput]);
    }

    var addRowButton = div.appendChild(document.createElement('button'));
    addRowButton.innerHTML = 'add row';
    addRowButton.className = 'addrow';

    function onchange() {
        var props = fieldArrayToProperties(fields);
        layer.feature.properties = props;
    }

    addRowButton.onclick = function() {
        var props = fieldArrayToProperties(fields);
        props[''] = '';
        layer.feature.properties = props;
        propertyTable(layer, container);
    };

    container.innerHTML = '';
    container.appendChild(div);
}

function clean(o) {
    var x = {};
    for (var k in o) {
        if (k) x[k] = o[k];
    }
    return x;
}

propertiesLink.onclick = function() {
    if (propertiesPane.className === 'sub-pane') {
        this.className = 'active';
        propertiesPane.className = 'sub-pane active';
        propertiesPane.innerHTML = '';
        drawnItems.eachLayer(function(l) {
            if (!('toGeoJSON' in l)) return;
            var fDiv = propertiesPane.appendChild(document.createElement('div')),
                mDiv = fDiv.appendChild(document.createElement('div'));
            fDiv.className = 'pad1';
            mDiv.className = 'mini-map';
            var map = L.mapbox.map(mDiv, 'tmcw.map-7s15q36b', {
                scrollWheelZoom: false
            });
            var gj = l.toGeoJSON();
            var gjL = L.geoJson(gj).addTo(map);
            map.fitBounds(gjL.getBounds());
            var tableContainer = fDiv.appendChild(document.createElement('div'));
            propertyTable(l, tableContainer);
        });
    } else {
        this.className = '';
        propertiesPane.className = 'sub-pane';
        propertiesPane.innerHTML = '';
        drawnItems.eachLayer(function(l) {
            if (!('toGeoJSON' in l)) return;
            l.feature.properties = clean(l.feature.properties);
        });
        updateG();
    }
};

// GIST
// ----------------------------------------------------------------------------
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

try {
    if (window.localStorage && !localStorage.visited) {
        newHere.className = 'active pad1';
        document.getElementById('close-new').onclick =
        document.getElementById('new-load-file').onclick = function() {
            newHere.className = '';
        };
        localStorage.visited = true;
    }
} catch(e) { }
