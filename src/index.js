var mobile = require('is-mobile');

if (mobile()) {
    var hash = window.location.hash;
    window.location.href = '/mobile.html' + hash;
}

var jsonPanel = require('./json_panel'),
    tablePanel = require('./table_panel'),
    sourcePanel = require('./source_panel'),
    loginPanel = require('./login_panel'),
    fileBar = require('./file_bar'),
    gist = require('./gist'),
    github = require('./github'),
    flash = require('./flash'),
    commit = require('./commit'),
    share = require('./share'),
    mapUtil = require('./map'),
    source = require('./source'),
    detectIndentationStyle = require('detect-json-indent'),
    exportIndentationStyle = 4;

var container = d3.select('body')
    .append('div')
    .attr('class', 'container');

var map = mapUtil.setupMap(container);

L.Polygon.prototype.getCenter = function() {
    var pts = this._latlngs;
    var off = pts[0];
    var twicearea = 0;
    var x = 0;
    var y = 0;
    var nPts = pts.length;
    var p1, p2;
    var f;
    for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
        p1 = pts[i];
        p2 = pts[j];
        f = (p1.lat - off.lat) * (p2.lng - off.lng) - (p2.lat - off.lat) * (p1.lng - off.lng);
        twicearea += f;
        x += (p1.lat + p2.lat - 2 * off.lat) * f;
        y += (p1.lng + p2.lng - 2 * off.lng) * f;
    }
    f = twicearea * 3;
    return new L.LatLng(
        x / f + off.lat,
        y / f + off.lng
    );
}

var pane = d3.select('.pane');

var buttons,
    silentHash = false;

var drawnItems = new L.FeatureGroup().addTo(map);
var drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { circle: false }
}).addTo(map);

d3.select(window).on('hashchange', hashChange);

map.on('draw:edited', updateFromMap)
    .on('draw:deleted', updateFromMap)
    .on('draw:created', drawCreated)
    .on('draw:created', updateFromMap)
    .on('popupopen', onPopupOpen);

d3.select('.collapse-button').on('click', clickCollapse);

var updates = d3.dispatch('update_geojson', 'update_map', 'update_editor', 'update_refresh',
    'focus_layer', 'zoom_extent', 'sourcechange');

updates.on('focus_layer', focusLayer)
    .on('update_geojson', updateFromMap)
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

container.append('div')
    .attr('class', 'file-bar')
    .call(fileBar(updates)
        .on('source', clickSource)
        .on('save', saveChanges)
        .on('download', downloadFile)
        .on('share', shareMap));

function clickSource() {
    if (d3.event) d3.event.preventDefault();
    d3.select('.left-panel').call(sourcePanel(updates));
}

function downloadFile() {
    var features = featuresFromMap();

    var content = JSON.stringify({
        type: 'FeatureCollection',
        features: features
    }, null, 4);

    if (content) {
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'map.geojson');
    }
}

function shareMap() {
    share(container, featuresFromMap());
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
        if ('getCenter' in layer) {
          layer.openPopup(layer.getCenter());
        } else {
          layer.openPopup();
        }
        map.fitBounds(layer.getBounds());
    } else if ('getLatLng' in layer) {
        layer.openPopup();
        map.setView(layer.getLatLng(), 15);
    }
}

function drawCreated(e) {
    drawnItems.addLayer(e.layer);
    mapUtil.geoify(drawnItems);
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
            updates.update_geojson();
        }
        updateFromMap();
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

d3.select(document).call(
    d3.keybinding('global')
        .on('⌘+s', saveChanges)
        .on('⌘+o', clickSource));

function saveChanges() {
    if (d3.event) d3.event.preventDefault();

    var features = featuresFromMap();

    if (!features.length) {
        return flash(container, 'Add a feature to the map to save it');
    }

    var content = JSON.stringify({
        type: 'FeatureCollection',
        features: features
    }, null, exportIndentationStyle);

    if (!source() || source().type == 'gist') {
        gist.saveAsGist(content, function(err, resp) {
            if (err) return flash(container, err.toString());
            var id = resp.id;
            window.location.hash = gist.urlHash(resp).url;
            flash(container,
                'Changes to this map saved to Gist: <a href="' + resp.html_url +
                '">' + resp.html_url + '</a>');
        });
    } else if (!source() || source().type == 'github') {
        var wrap = commit(container, content, function(err, resp) {
            wrap.remove();
            if (err) return flash(container, err.toString());
            else flash(container, 'Changes committed to GitHub: <a href="' +
                       resp.commit.html_url + '">' + resp.commit.sha.substring(0, 10) + '</a>');

        });
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
        mapUtil.showProperties(l);
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
        mapUtil.showProperties(l);
        l.addTo(drawnItems);
    });
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
    if (s.type == 'github') github.loadGitHubRaw(s.id, onGitHubLoad);

    function onGistLoad(err, json) {
        if (err) return flash(container, 'Gist API limit exceeded, come back in a bit.');
        var first = !drawnItems.getBounds().isValid();

        try {
            var file = mapFile(json);
            updates.update_editor(mapFile(json));
            if (drawnItems.getBounds().isValid()) map.fitBounds(drawnItems.getBounds());
            if (gist.urlHash(json).redirect) {
                silentHash = true;
                window.location.hash = gist.urlHash(json).url;
            }
            updates.update_map(mapFile(json), drawnItems);
            updates.sourcechange({
                type: 'gist',
                name: '#' + json.id,
                data: json
            });
        } catch(e) {
            console.log(e);
            flash(container, 'Invalid GeoJSON data in this Gist');
        }
    }

    function onGitHubLoad(err, file) {
        if (err) return flash(container, 'GitHub API limit exceeded, come back in a bit.');

        try {
            var json = JSON.parse(file);
            exportIndentationStyle = detectIndentationStyle(file);
            var first = !drawnItems.getBounds().isValid();
            updates.update_editor(json);
            if (first && drawnItems.getBounds().isValid()) {
                map.fitBounds(drawnItems.getBounds());
                buttons.filter(function(d, i) { return i == 1; }).trigger('click');
            }
            updates.update_map(json, drawnItems);
            updates.sourcechange({
                type: 'github',
                name: source().id,
                data: source()
            });
        } catch(e) {
            flash(container, 'Loading a file from GitHub failed');
        }
    }
}
