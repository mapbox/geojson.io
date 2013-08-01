var pane = d3.select('.pane');

var map = L.mapbox.map('map').setView([20, 0], 2),
    osmTiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }),
    mapboxTiles = L.mapbox.tileLayer('tmcw.map-7s15q36b').addTo(map);

var drawnItems = new L.FeatureGroup().addTo(map);

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

var editor;

map.on('draw:created', updateG)
    .on('draw:edited', updateG)
    .on('draw:deleted', updateG)
    .on('draw:created', function(e) {
        drawnItems.addLayer(e.layer);
    });

d3.select('.buttons')
    .call(jsonEditButton)
    .call(propertiesEditButton)
    .call(shareButton);
    // .call(download, editor)
    // .call(gistButton, editor);

// JSON EDITOR ----------------------------------------------------------------
function toggleJsonEditor() {

    if (d3.event) {
        d3.select('.buttons')
            .selectAll('button')
            .classed('active', false);

        d3.select(d3.event.target).classed('active', true);
    }

    pane.html('');
    var textarea = pane.append('textarea');
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
    editor.on('change', editorChange);
}

function jsonEditButton(container) {
    var button = container.append('button')
        .attr('class', 'active')
        .on('click', toggleJsonEditor);
    button.append('span').attr('class', 'icon icon-code');
}

toggleJsonEditor();
// ----------------------------------------------------------------------------

// PROPERTIES  ----------------------------------------------------------------
function togglePropertiesEditor() {
    pane.html('');
    var textarea = pane.append('textarea');
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
    editor.on('change', editorChange);
}

function propertiesEditButton(container) {
    var button = container.append('button').on('click', togglePropertiesEditor);
    button.append('span').attr('class', 'icon icon-table');
}
// ----------------------------------------------------------------------------

// PROPERTIES  ----------------------------------------------------------------
function toggleShare() {
    if (d3.event) {
        d3.select('.buttons')
            .selectAll('button')
            .classed('active', false);
        d3.select(d3.event.target).classed('active', true);
    }
    pane.html('');
    saveAsGist(editor.getValue(), function(err, resp) {
        if (err) return alert(err);
        var id = resp.id;
        var wrap = pane.append('div').attr('class', 'pad1 share');
        wrap.append('label').text('Map Embed').attr('class', 'horizontal');
        wrap.append('input').attr('class', 'horizontal')
            .property('value', '<iframe frameborder="0" width="100%" height="300" src="http://bl.ocks.org/d/' + id + '"></iframe>');

        wrap.append('label').text('Link to Editor').attr('class', 'horizontal');
        wrap.append('input').attr('class', 'horizontal')
            .property('value', 'http://geojson.io/#' + id);

        wrap.append('label').text('On GitHub Gist').attr('class', 'horizontal');
        wrap.append('input').attr('class', 'horizontal')
            .property('value', 'http://gist.github.com/anonymous/' + id);

        wrap.append('label').text('Raw GeoJSON Data').attr('class', 'horizontal');
        wrap.append('input').attr('class', 'horizontal')
            .property('value', 'http://gist.github.com/anonymous/' + id + '/raw/map.geojson');
    });
}

function shareButton(container) {
    var button = container.append('button').on('click', toggleShare);
    button.append('span').attr('class', 'icon icon-share-alt');
}
// ----------------------------------------------------------------------------

d3.select(document).on('keydown', keydown);
d3.select(window).on('hashchange', hashChange);

if (window.location.hash) hashChange();

function keydown(e) {
    if (d3.event.keyCode == 83 && d3.event.metaKey) {
        saveAsGist(editor.getValue());
        d3.event.preventDefault();
    }
}

function loadGeoJSON(gj) {
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

function updateG() {
    window.setTimeout(function() {
         editor.setValue(JSON.stringify(getGeoJSON(), null, 2));
        // if (propertiesPane.classed('active')) updatePropertiesPane();
    }, 100);
}

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
        d3.json('https://api.github.com/gists/' + id).on('load',
            function(json) {
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
