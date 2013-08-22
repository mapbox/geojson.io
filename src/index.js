'use strict';

var mobile = require('is-mobile');

if (mobile()) {
    var hash = window.location.hash;
    window.location.href = '/mobile.html' + hash;
}

var jsonPanel = require('./json_panel'),
    tablePanel = require('./table_panel'),
    importPanel = require('./import_panel'),
    commitPanel = require('./commit_panel'),
    sharePanel = require('./share_panel'),
    loginPanel = require('./login_panel'),
    fileBar = require('./file_bar'),
    gist = require('./gist'),
    github = require('./github'),
    map = require('./map')(),
    source = require('./source'),
    detectIndentationStyle = require('detect-json-indent'),
    exportIndentationStyle = 4,
    dropSupport = (window.FileReader && 'ondrop' in window);

CodeMirror.keyMap.tabSpace = {
    Tab: function(cm) {
        var spaces = new Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces, 'end', '+input');
    },
    fallthrough: ['default']
};

var pane = d3.select('.pane');

var editor, buttons;
var silentHash = false;

var drawnItems = new L.FeatureGroup().addTo(map);
var drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { circle: false }
}).addTo(map);

d3.select(document).on('keydown', keydown);
d3.select(window).on('hashchange', hashChange);

map.on('draw:edited', updateFromMap)
    .on('draw:deleted', updateFromMap)
    .on('draw:created', drawCreated)
    .on('draw:created', updateFromMap)
    .on('popupopen', onPopupOpen);

d3.select('.collapse-button').on('click', clickCollapse);

var updates = d3.dispatch('update_map', 'update_editor', 'update_refresh',
    'focus_layer', 'zoom_extent');

updates.on('focus_layer', focusLayer)
    .on('update_editor', loadToMap)
    .on('update_refresh', refresh)
    .on('zoom_extent', zoomToExtent);

if (window.location.hash) hashChange();

var buttonData = [{
    icon: 'table',
    title: ' Table',
    alt: 'Edit feature properties in a table',
    behavior: tablePanel
}, {
    icon: 'code',
    alt: 'JSON Source',
    behavior: jsonPanel
}, {
    icon: 'github',
    alt: '',
    behavior: loginPanel
}];

drawButtons(buttonData);

d3.select('.file-bar').call(fileBar(updates)
    .on('import', clickImport));

function clickImport() {
    d3.select('.left-panel').call(importPanel(updates));
}

function clickCollapse() {
    d3.select('.right').classed('hidden',
        !d3.select('.right').classed('hidden'));
    d3.select('#map').classed('fullsize',
        !d3.select('#map').classed('fullsize'));
    map.invalidateSize();
}

function focusLayer(layer) {
    if (!layer) return;
    // geometrycollections
    if ('eachLayer' in layer) {
        var first = null;
        layer.eachLayer(function(l) {
            if (!first && 'openPopup' in l) first = l;
        });
        if (first) {
            first.openPopup();
            map.fitBounds(first.getBounds());
        }
    } else if ('getBounds' in layer && layer.getBounds().isValid()) {
        layer.openPopup();
        map.fitBounds(layer.getBounds());
    } else if ('getLatLng' in layer) {
        layer.openPopup();
        map.setView(layer.getLatLng(), 15);
    }
}

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
}

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
        .on('click', buttonClick)
        .each(function(d) {
            if (d.behavior.init) d.behavior.init(this);
        })
        .append('span')
        .text(function(d) { return d.title; });

    buttons.exit().remove();

    d3.select(buttons.node()).trigger('click');

    function buttonClick(d) {
        updates.on('update_map.mode', null);
        buttons.classed('active', function(_) { return d.icon == _.icon; });
        pane.call(d.behavior, updates);
        updateFromMap();
    }
}

function onPopupOpen(e) {
    var sel = d3.select(e.popup._contentNode);

    sel.selectAll('.cancel')
        .on('click', clickClose);

    sel.selectAll('.save')
        .on('click', saveFeature);

    sel.selectAll('.delete-invert')
        .on('click', removeFeature);

    function clickClose() {
        map.closePopup(e.popup);
    }

    function removeFeature() {
        if (e.popup._source && drawnItems.hasLayer(e.popup._source)) {
            drawnItems.removeLayer(e.popup._source);
        }
    }

    function saveFeature() {
        var obj = {};
        sel.selectAll('tr').each(collectRow);
        function collectRow() {
            obj[d3.select(this).selectAll('input')[0][0].value] =
                d3.select(this).selectAll('input')[0][1].value;
        }
        e.popup._source.feature.properties = obj;
        map.closePopup(e.popup);
        refresh();
    }
}

function keydown(e) {
    if (d3.event.keyCode == 83 && d3.event.metaKey) {
        d3.event.preventDefault();
        saveChanges();
    }
}

function saveChanges(message, callback) {
    var content = JSON.stringify({
        type: 'FeatureCollection',
        features: featuresFromMap()
    }, null, exportIndentationStyle);

    if (!source() || source().type == 'gist') {
        gist.saveAsGist(content, function(err, resp) {
            if (err) return alert(err);
            var id = resp.id;
            window.location.hash = gist.urlHash(resp).url;
            if (callback) callback();
        });
    } else if (!source() || source().type == 'github') {
        buttons.filter(function(d) {
            return d.icon === 'save';
        }).trigger('click');
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
    updates.update_map({
        type: 'FeatureCollection',
        features: featuresFromMap()
    }, drawnItems, exportIndentationStyle);
}

function refresh() {
    drawnItems.eachLayer(function(l) {
        showProperties(l);
    });
}

function zoomToExtent() {
    if (drawnItems.getBounds().isValid()) {
        map.fitBounds(drawnItems.getBounds());
    }
}

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

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent('<div class="clearfix"><div class="marker-properties-limit"><table class="marker-properties">' + table + '</table></div>' +
        '<div class="clearfix col12 drop">' +
            '<div class="buttons-joined fl"><button class="save positive">save</button>' +
            '<button class="cancel">cancel</button></div>' +
            '<div class="fr clear-buttons"><button class="delete-invert"><span class="icon-remove-sign"></span> remove</button></div>' +
        '</div></div>'));
}

function mapFile(gist) {
    var f;
    for (f in gist.files) if (f.indexOf('.geojson') !== -1) return JSON.parse(gist.files[f].content);
    for (f in gist.files) if (f.indexOf('.json') !== -1) return JSON.parse(gist.files[f].content);
}

function hashChange() {

    // quiet a hashchange for one step
    if (silentHash) {
        silentHash = false;
        return;
    }

    var s = source();

    if (!s) {
        window.location.hash = '';
        return;
    }

    if (s.type == 'gist') gist.loadGist(s.id, onGistLoad);
    if (s.type == 'github') github.loadGitHub(s.id, onGitHubLoad);

    function onGistLoad(err, json) {
        if (err) return alert('Gist API limit exceeded, come back in a bit.');
        var first = !drawnItems.getBounds().isValid();

        try {
            var file = mapFile(json);
            updates.update_editor(mapFile(json));
            if (first && drawnItems.getBounds().isValid()) {
                map.fitBounds(drawnItems.getBounds());
                buttons.filter(function(d, i) { return i == 1; }).trigger('click');
            }
            silentHash = gist.urlHash(json).redirect;
            window.location.hash = gist.urlHash(json).url;
        } catch(e) {
            alert('Invalid GeoJSON data in this Gist');
        }
    }

    function onGitHubLoad(err, file) {
        if (err) return alert('GitHub API limit exceeded, come back in a bit.');

        try {
            var json = JSON.parse(file);
            exportIndentationStyle = detectIndentationStyle(file);
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
            }]).filter(function(d) {
                return d.icon !== 'share-alt';
            }));
        } catch(e) {
            alert('Loading a file from GitHub failed');
        }
    }
}
