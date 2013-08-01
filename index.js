ZeroClipboard.setDefaults({
    moviePath: 'lib/zeroclipboard/ZeroClipboard.swf'
});

var geojsonField = d3.select('#geojson'),
    uploadButton = d3.select('#save'),
    downloadButton = d3.select('#download'),
    aboutButton = d3.select('#about'),
    copyButton = d3.select('#copy'),
    statusIcon = d3.select('#status'),
    aboutButton = d3.select('#about'),
    editButton = d3.select('#edit'),
    loadButton = d3.select('#load'),
    gistLink = d3.select('#gist-link'),
    newHere = d3.select('#new-here'),
    hereLink = d3.select('#here-link'),
    switchBasemap = d3.select('#switch-basemap'),

    propertiesLink = d3.select('#properties-view'),
    propertiesPane = d3.select('#properties-pane'),

    linkUi = d3.select('.link-ui');
    linkUiClose = d3.select('#link-ui-close'),
    clip = new ZeroClipboard(copyButton.node());

var map = L.mapbox.map('map').setView([20, 0], 2),
    osmTiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }),
    mapboxTiles = L.mapbox.tileLayer('tmcw.map-7s15q36b').addTo(map);

switchBasemap.on('click', function() {
    if (map.hasLayer(osmTiles)) {
        map.removeLayer(osmTiles);
        map.addLayer(mapboxTiles);
    } else {
        map.addLayer(osmTiles);
        map.removeLayer(mapboxTiles);
    }
});

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

var editor = CodeMirror.fromTextArea(geojsonField.node(), {
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

uploadButton.on('click', function() { saveAsGist(editor.getValue()); });
downloadButton.on('click', function() { saveAsFile(editor); });

linkUiClose.onclick = closeLinkUI;

aboutButton.on('click', function() {
    d3.select('.edit-pane').classed('active', false);
    d3.select('.about-pane').classed('active', true);
});

editButton.on('click', function() {
    d3.select('.edit-pane').classed('active', true);
    d3.select('.about-pane').classed('active', false);
});

d3.select(document).on('keydown', function(e) {
    if (d3.event.keyCode == 83 && d3.event.metaKey) {
        saveAsGist(editor.getValue());
        d3.event.preventDefault();
    }
});


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

d3.select(window).on('hashchange', hashChange);
if (window.location.hash) hashChange();

function clipComplete(client, args) {
    copyButton.classed('done', true);
    copyButton.text('copied to your clipboard');
    setTimeout(function() {
        copyButton.html("<span class='icon icon-copy'></span>");
        copyButton.classed('done', false);
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
    statusIcon.attr('class', 'icon-circle');
    editor.clearGutter('error');
    if (err instanceof Error) {
        handleError(err.message);
        statusIcon.attr('class', 'icon-circle-blank')
            .attr('title', 'invalid JSON')
            .attr('message', 'invalid JSON');
    } else if (err.length) {
        handleErrors(err);
        statusIcon.attr('class', 'icon-circle-blank')
            .attr('message', 'invalid GeoJSON');
    } else {
        var gj = JSON.parse(editor.getValue());
        try {
            loadGeoJSON(gj);
            statusIcon.attr('message', 'valid');
        } catch(e) {
            statusIcon.attr('class', 'icon-circle-blank')
                .attr('message', 'invalid GeoJSON');
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
    return d3.select(document.createElement('div'))
        .attr('class', 'error-marker')
        .attr('message', msg).node();
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
        if (propertiesPane.classed('active')) updatePropertiesPane();
    }, 100);
}

function fieldArrayToProperties(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) {
        obj[arr[i][0].value] = arr[i][1].value;
    }
    return obj;
}

propertiesLink.on('click', function() {
    if (!propertiesPane.classed('active')) {
        updatePropertiesPane();
    } else {
        this.className = '';
        propertiesPane.attr('class', 'sub-pane').html('');
        drawnItems.eachLayer(function(l) {
            if (!('toGeoJSON' in l)) return;
            l.feature.properties = clean(l.feature.properties);
        });
        updateG();
    }
});

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
    if (!isNaN(+id)) {
        uploadButton.attr('class', 'loading');
        d3.json('https://api.github.com/gists/' + id).on('load',
            function(json) {
                uploadButton.attr('class', '');
                var first = !editor.getValue();
                editor.setValue(firstFile(json));
                editorChange();
                if (first && drawnItems.getBounds().isValid()) {
                    map.fitBounds(drawnItems.getBounds());
                }
            })
            .on('error', function() {
                alert('Gist API limit exceeded, come back in a bit.');
            }).get();
    } else {
        d3.text(id).on('load',
            function(text) {
                uploadButton.attr('class', '');
                var first = !editor.getValue();
                editor.setValue(text);
                editorChange();
                if (first && drawnItems.getBounds().isValid()) {
                    map.fitBounds(drawnItems.getBounds());
                }
            })
            .on('error', function() {
                alert('URL load failed');
            }).get();
    }
}

function saveAsFile(editor) {
    var content = editor.getValue();
    if (content) {
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'map.geojson');
    }
}

function closeNewHere() {
    newHere.attr('class', '');
}

try {
    if (window.localStorage && !localStorage.visited) {
        newHere.className = 'active pad1';
        d3.select('#close-new').on('click', closeNewHere);
        d3.select('#new-load-file').on('click', closeNewHere);
        localStorage.visited = true;
    }
} catch(e) { }
