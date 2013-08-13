require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],"topojson":[function(require,module,exports){
module.exports=require('g070js');
},{}],"g070js":[function(require,module,exports){
var fs = require("fs");

var topojson = module.exports = new Function("topojson", "return " + "topojson = (function() {\n\n  function merge(topology, arcs) {\n    var fragmentByStart = {},\n        fragmentByEnd = {};\n\n    arcs.forEach(function(i) {\n      var e = ends(i),\n          start = e[0],\n          end = e[1],\n          f, g;\n\n      if (f = fragmentByEnd[start]) {\n        delete fragmentByEnd[f.end];\n        f.push(i);\n        f.end = end;\n        if (g = fragmentByStart[end]) {\n          delete fragmentByStart[g.start];\n          var fg = g === f ? f : f.concat(g);\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;\n        } else if (g = fragmentByEnd[end]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByStart[end]) {\n        delete fragmentByStart[f.start];\n        f.unshift(i);\n        f.start = start;\n        if (g = fragmentByEnd[start]) {\n          delete fragmentByEnd[g.end];\n          var gf = g === f ? f : g.concat(f);\n          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;\n        } else if (g = fragmentByStart[start]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);\n          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByStart[start]) {\n        delete fragmentByStart[f.start];\n        f.unshift(~i);\n        f.start = end;\n        if (g = fragmentByEnd[end]) {\n          delete fragmentByEnd[g.end];\n          var gf = g === f ? f : g.concat(f);\n          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;\n        } else if (g = fragmentByStart[end]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);\n          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByEnd[end]) {\n        delete fragmentByEnd[f.end];\n        f.push(~i);\n        f.end = start;\n        if (g = fragmentByEnd[start]) {\n          delete fragmentByStart[g.start];\n          var fg = g === f ? f : f.concat(g);\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;\n        } else if (g = fragmentByStart[start]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else {\n        f = [i];\n        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;\n      }\n    });\n\n    function ends(i) {\n      var arc = topology.arcs[i], p0 = arc[0], p1 = [0, 0];\n      arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });\n      return [p0, p1];\n    }\n\n    var fragments = [];\n    for (var k in fragmentByEnd) fragments.push(fragmentByEnd[k]);\n    return fragments;\n  }\n\n  function mesh(topology, o, filter) {\n    var arcs = [];\n\n    if (arguments.length > 1) {\n      var geomsByArc = [],\n          geom;\n\n      function arc(i) {\n        if (i < 0) i = ~i;\n        (geomsByArc[i] || (geomsByArc[i] = [])).push(geom);\n      }\n\n      function line(arcs) {\n        arcs.forEach(arc);\n      }\n\n      function polygon(arcs) {\n        arcs.forEach(line);\n      }\n\n      function geometry(o) {\n        if (o.type === \"GeometryCollection\") o.geometries.forEach(geometry);\n        else if (o.type in geometryType) {\n          geom = o;\n          geometryType[o.type](o.arcs);\n        }\n      }\n\n      var geometryType = {\n        LineString: line,\n        MultiLineString: polygon,\n        Polygon: polygon,\n        MultiPolygon: function(arcs) { arcs.forEach(polygon); }\n      };\n\n      geometry(o);\n\n      geomsByArc.forEach(arguments.length < 3\n          ? function(geoms, i) { arcs.push(i); }\n          : function(geoms, i) { if (filter(geoms[0], geoms[geoms.length - 1])) arcs.push(i); });\n    } else {\n      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);\n    }\n\n    return object(topology, {type: \"MultiLineString\", arcs: merge(topology, arcs)});\n  }\n\n  function featureOrCollection(topology, o) {\n    return o.type === \"GeometryCollection\" ? {\n      type: \"FeatureCollection\",\n      features: o.geometries.map(function(o) { return feature(topology, o); })\n    } : feature(topology, o);\n  }\n\n  function feature(topology, o) {\n    var f = {\n      type: \"Feature\",\n      id: o.id,\n      properties: o.properties || {},\n      geometry: object(topology, o)\n    };\n    if (o.id == null) delete f.id;\n    return f;\n  }\n\n  function object(topology, o) {\n    var tf = topology.transform,\n        kx = tf.scale[0],\n        ky = tf.scale[1],\n        dx = tf.translate[0],\n        dy = tf.translate[1],\n        arcs = topology.arcs;\n\n    function arc(i, points) {\n      if (points.length) points.pop();\n      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, x = 0, y = 0, p; k < n; ++k) points.push([\n        (x += (p = a[k])[0]) * kx + dx,\n        (y += p[1]) * ky + dy\n      ]);\n      if (i < 0) reverse(points, n);\n    }\n\n    function point(coordinates) {\n      return [coordinates[0] * kx + dx, coordinates[1] * ky + dy];\n    }\n\n    function line(arcs) {\n      var points = [];\n      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);\n      if (points.length < 2) points.push(points[0].slice());\n      return points;\n    }\n\n    function ring(arcs) {\n      var points = line(arcs);\n      while (points.length < 4) points.push(points[0].slice());\n      return points;\n    }\n\n    function polygon(arcs) {\n      return arcs.map(ring);\n    }\n\n    function geometry(o) {\n      var t = o.type;\n      return t === \"GeometryCollection\" ? {type: t, geometries: o.geometries.map(geometry)}\n          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}\n          : null;\n    }\n\n    var geometryType = {\n      Point: function(o) { return point(o.coordinates); },\n      MultiPoint: function(o) { return o.coordinates.map(point); },\n      LineString: function(o) { return line(o.arcs); },\n      MultiLineString: function(o) { return o.arcs.map(line); },\n      Polygon: function(o) { return polygon(o.arcs); },\n      MultiPolygon: function(o) { return o.arcs.map(polygon); }\n    };\n\n    return geometry(o);\n  }\n\n  function reverse(array, n) {\n    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;\n  }\n\n  function bisect(a, x) {\n    var lo = 0, hi = a.length;\n    while (lo < hi) {\n      var mid = lo + hi >>> 1;\n      if (a[mid] < x) lo = mid + 1;\n      else hi = mid;\n    }\n    return lo;\n  }\n\n  function neighbors(objects) {\n    var indexesByArc = {}, // arc index -> array of object indexes\n        neighbors = objects.map(function() { return []; });\n\n    function line(arcs, i) {\n      arcs.forEach(function(a) {\n        if (a < 0) a = ~a;\n        var o = indexesByArc[a];\n        if (o) o.push(i);\n        else indexesByArc[a] = [i];\n      });\n    }\n\n    function polygon(arcs, i) {\n      arcs.forEach(function(arc) { line(arc, i); });\n    }\n\n    function geometry(o, i) {\n      if (o.type === \"GeometryCollection\") o.geometries.forEach(function(o) { geometry(o, i); });\n      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);\n    }\n\n    var geometryType = {\n      LineString: line,\n      MultiLineString: polygon,\n      Polygon: polygon,\n      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }\n    };\n\n    objects.forEach(geometry);\n\n    for (var i in indexesByArc) {\n      for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {\n        for (var k = j + 1; k < m; ++k) {\n          var ij = indexes[j], ik = indexes[k], n;\n          if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);\n          if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);\n        }\n      }\n    }\n\n    return neighbors;\n  }\n\n  return {\n    version: \"1.2.3\",\n    mesh: mesh,\n    feature: featureOrCollection,\n    neighbors: neighbors\n  };\n})();\n")();
topojson.topology = require("./lib/topojson/topology");
topojson.simplify = require("./lib/topojson/simplify");
topojson.clockwise = require("./lib/topojson/clockwise");
topojson.filter = require("./lib/topojson/filter");
topojson.prune = require("./lib/topojson/prune");
topojson.bind = require("./lib/topojson/bind");

},{"fs":1,"./lib/topojson/topology":2,"./lib/topojson/simplify":3,"./lib/topojson/clockwise":4,"./lib/topojson/filter":5,"./lib/topojson/prune":6,"./lib/topojson/bind":7}],8:[function(require,module,exports){
'use strict';

var jsonPanel = require('./json_panel'),
    tablePanel = require('./table_panel'),
    importPanel = require('./import_panel'),
    commitPanel = require('./commit_panel'),
    sharePanel = require('./share_panel'),
    loginPanel = require('./login_panel'),
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
}, {
    icon: 'code',
    alt: 'JSON Source',
    behavior: jsonPanel
}, {
    icon: 'github',
    alt: 'Log in to GitHub',
    behavior: loginPanel
}];

drawButtons(buttonData);

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
            var json = JSON.parse(Base64.fromBase64(file.content));
            exportIndentationStyle = detectIndentationStyle(file.content);
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

},{"./json_panel":9,"./table_panel":10,"./import_panel":11,"./commit_panel":12,"./share_panel":13,"./login_panel":14,"./gist":15,"./github":16,"./map":17,"./source":18,"detect-json-indent":19}],17:[function(require,module,exports){
'use strict';

module.exports = function() {
    var map = L.mapbox.map('map')
        .setView([20, 0], 2);

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

    L.mapbox.geocoderControl('tmcw.map-u4ca5hnt').addTo(map);

    return map;
};

},{}],18:[function(require,module,exports){
'use strict';

module.exports = function source() {

    if (!window.location.hash) return null;

    var txt = window.location.hash.substring(1);

    if (!isNaN(parseInt(txt, 10))) {
        // legacy gist
        return {
            type: 'gist',
            id: parseInt(txt, 10)
        };
    } else if (txt.indexOf('gist:') === 0) {
        var clean = txt.replace(/^gist:/, '');
        if (clean.indexOf('/') !== -1) {
            return {
                type: 'gist',
                login: clean.split('/')[0],
                id: parseInt(clean.split('/')[1], 10)
            };
        } else {
            return {
                type: 'gist',
                id: parseInt(clean, 10)
            };
        }
    } else if (txt.indexOf('github:') === 0) {
        return {
            type: 'github',
            id: txt.replace(/^github:\/?/, '')
        };
    }
};

},{}],9:[function(require,module,exports){
var validate = require('./validate');

module.exports = jsonPanel;

function jsonPanel(container, updates) {
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
        if (!err) updates.update_editor(data);
    }

    updates.on('update_map.mode', function(data) {
        quiet = true;
        editor.setValue(JSON.stringify(data, null, 2));
    });
}

},{"./validate":20}],12:[function(require,module,exports){
var github = require('./github');

module.exports = commitPanel;

function commitPanel(container, updates) {
    container.html('');

    var wrap = container.append('div')
        .attr('class', 'pad1 center');

    var message = wrap.append('textarea')
        .attr('placeholder', 'Commit message')
        .attr('class', 'full-width');

    var commitButton = wrap.append('button')
        .text('Commit changes to GitHub')
        .attr('class', 'semimajor');

    updates.on('update_map.mode', function(data, layer, exportIndentationStyle) {
        commitButton.on('click', function() {
            github.saveAsGitHub(
                JSON.stringify(data, null, exportIndentationStyle),
                done,
                message.property('value'));

            function done(err, resp) {
                if (err) return alert(err);
                commitButton.text('Changes saved');
                setTimeout(function() {
                    commitButton.text('Commit changes to GitHub');
                }, 1000);
            }
        });
    });
}

},{"./github":16}],13:[function(require,module,exports){
var gist = require('./gist');
module.exports = sharePanel;

function sharePanel(container, updates) {
    'use strict';
    container.html('');

    updates.on('update_map.mode', onUpdate);

    function onUpdate(data) {
        gist.saveAsGist(JSON.stringify(data), function(err, resp) {
            if (err) return alert(err);
            var id = resp.id;
            var wrap = container.append('div').attr('class', 'pad share');
            var thisurl = 'http://geojson.io/#' + id;
            location.hash = '#' + id;

            wrap.append('div').append('label').text('Map Embed');
            wrap.append('textarea')
                .attr('class', 'full-width')
                .attr('type', 'text')
                .property('value', '<script src="https://gist.github.com/' + id + '.js"></script>')
                .node()
                .select();

            function saveAsFile(data) {
                var content = JSON.stringify(data, null, 2);
                if (content) {
                    saveAs(new Blob([content], {
                        type: 'text/plain;charset=utf-8'
                    }), 'map.geojson');
                }
            }

            var links = wrap.append('div').attr('class', 'footlinks');

            var facebook = links.append('a')
                .attr('target', '_blank')
                .attr('href', function() {
                    return 'https://www.facebook.com/sharer/sharer.php?u=' +
                        encodeURIComponent(thisurl);
                }).on('click', function() {
                });

            facebook.append('span').attr('class', 'icon-facebook');
            facebook.append('span').text(' facebook');

            var tweet = links.append('a')
                .attr('target', '_blank')
                .attr('href', function() {
                    return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                        encodeURIComponent('my map: ' + thisurl);
                }).on('click', function() {
                });

            tweet.append('span').attr('class', 'icon-twitter');
            tweet.append('span').text(' tweet');

            var dl = links.append('a').on('click', function() {
                saveAsFile(data);
            });

            dl.append('span').attr('class', 'icon-download');
            dl.append('span').text(' download');

            var gist = links.append('a')
                .attr('target', '_target')
                .attr('href', resp.html_url);
            gist.append('span').attr('class', 'icon-link');
            gist.append('span').text(' source');

            wrap.append('p')
                .attr('class', 'intro-hint pad1')
                .html('<a target="_blank" href="/about.html#what-now">Need help about what to do with the files you download here?</a>');
        });
    }
}

},{"./gist":15}],15:[function(require,module,exports){
'use strict';

var source = require('./source');

module.exports.saveAsGist = saveAsGist;
module.exports.loadGist = loadGist;
module.exports.urlHash = urlHash;

function loggedin() {
    return !!localStorage.github_token;
}

function authorize(xhr) {
    return localStorage.github_token ?
        xhr.header('Authorization', 'token ' + localStorage.github_token) :
        xhr;
}

function saveAsGist(content, callback) {
    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
    }

    var user = localStorage.github_user ?
        JSON.parse(localStorage.github_user) : {};

    var endpoint,
        method = 'POST';

    if (loggedin() && (source() && source().id)) {
        if (user && source().login == user.login) {
            endpoint = 'https://api.github.com/gists/' + source().id;
            method = 'PATCH';
        } else {
            endpoint = 'https://api.github.com/gists/' + source().id + '/forks';
        }
    } else {
        endpoint = 'https://api.github.com/gists';
    }

    authorize(d3.json(endpoint))
        .on('load', function(data) {
            callback(null, data);
        })
        .on('error', function(err) {
            callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
        })
        .send(method, JSON.stringify({
            description: 'via:geojson.io',
            public: true,
            files: {
                'map.geojson': {
                    content: content
                }
            }
        }));
}

function loadGist(id, callback) {
    d3.json('https://api.github.com/gists/' + id)
        .on('load', onLoad)
        .on('error', onError).get();

    function onLoad(json) { callback(null, json); }
    function onError(err) { callback(err, null); }
}

function urlHash(data) {
    var login = (data.user && data.user.login) || 'anonymous';
    if (source() && source().id == data.id) {
        return {
            url: '#gist:' + login + '/' + data.id,
            redirect: true
        };
    } else {
        return {
            url: '#gist:' + login + '/' + data.id
        };
    }
}

},{"./source":18}],14:[function(require,module,exports){
'use strict';

var source = require('./source'),
    config = require('./config')(location.hostname);

module.exports = loginPanel;

function loginPanel(container) {
}

loginPanel.init = function(container) {
    var sel = d3.select(container);
    sel.attr('title', 'login to GitHub');
    sel.on('click', login);

    function login() {
        window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + config.client_id + '&scope=gist,public_repo';
    }

    function logout() {
        analytics.track('Logged Out');
        window.localStorage.removeItem('github_token');
        sel.attr('title', 'login to GitHub')
            .classed('logged-in', true)
            .on('click', login);
    }

    function killTokenUrl() {
        if (window.location.href.indexOf('?code') !== -1) {
            window.location.href = window.location.href.replace(/\?code=.*$/, '');
        }
    }

    if (window.location.search && window.location.search.indexOf('?code') === 0) {
        var code = window.location.search.replace('?code=', '');
        d3.json(config.gatekeeper_url + '/authenticate/' + code)
            .on('load', function(l) {
                if (l.token) window.localStorage.github_token = l.token;
                killTokenUrl();
            })
            .on('error', function() {
                analytics.track('GitHub Account / Fail');
                alert('Authentication with GitHub failed');
            })
            .get();
    }

    if (localStorage.github_token) {
        d3.json('https://api.github.com/user')
            .header('Authorization', 'token ' + window.localStorage.github_token)
            .on('load', function(user) {
                localStorage.github_user = JSON.stringify(user);
                sel
                    .classed('logged-in', true)
                    .attr('title', 'logout')
                    .on('click', logout);
            })
            .on('error', function() {
                sel.classed('logged-in', false);
                window.localStorage.removeItem('github_token');
            })
            .get();
    }
};

},{"./source":18,"./config":21}],16:[function(require,module,exports){
'use strict';

var source = require('./source');

module.exports.saveAsGitHub = saveAsGitHub;
module.exports.loadGitHub = loadGitHub;

function authorize(xhr) {
    return localStorage.github_token ?
        xhr.header('Authorization', 'token ' + localStorage.github_token) :
        xhr;
}

function githubFileUrl() {
    var pts = parseGitHubId(source().id);
    return 'https://api.github.com/repos/' + pts.user +
            '/' + pts.repo +
            '/contents/' + pts.file + '?ref=' + pts.branch;
}

function saveAsGitHub(content, callback, message) {
    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
    }

    if (!localStorage.github_token) {
        return alert('You need to log in with GitHub to commit changes');
    }

    var commitMessage = message || prompt('Commit message:');
    if (!commitMessage) return;

    loadGitHub(source().id, function(err, file) {
        if (err) {
            return alert('Failed to load file before saving');
        }
        authorize(d3.json(githubFileUrl()))
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(err) {
                callback('GitHub API limit exceeded; saving to GitHub temporarily disabled: ' + err);
            })
            .send('PUT', JSON.stringify({
                message: commitMessage,
                sha: file.sha,
                branch: file.branch,
                content: Base64.toBase64(content)
            }));
    });
}

function encode(content) {
  // Encode UTF-8 to Base64
  // https://developer.mozilla.org/en-US/docs/Web/API/window.btoa#Unicode_Strings
  return window.btoa(window.encodeURIComponent(content));
}

function decode(content) {
  // Decode Base64 to UTF-8
  // https://developer.mozilla.org/en-US/docs/Web/API/window.btoa#Unicode_Strings
  return window.decodeURIComponent(window.atob(content));
}

function parseGitHubId(id) {
    var parts = id.split('/');
    return {
        user: parts[0],
        repo: parts[1],
        mode: parts[2],
        branch: parts[3],
        file: parts.slice(4).join('/')
    };
}

function loadGitHub(id, callback) {
    var pts = parseGitHubId(id);
    d3.json('https://api.github.com/repos/' + pts.user +
        '/' + pts.repo +
        '/contents/' + pts.file + '?ref=' + pts.branch)
        .on('load', onLoad)
        .on('error', onError).get();

    function onLoad(file) {
        if (file.type !== 'file') return;
        callback(null, file);
    }
    function onError(err) { callback(err, null); }
}

},{"./source":18}],19:[function(require,module,exports){
module.exports = function(_, def) {
    def = def === undefined ? 4 : def;
    if (_ === '{}') return '    ';
    var lines = _.split('\n');
    if (lines.length < 2) return null;
    var space = lines[1].match(/^(\s*)/);
    return space[0];
};

},{}],10:[function(require,module,exports){
'use strict';

var metatable = require('d3-metatable')(d3);

module.exports = tablePanel;

function tablePanel(container, updates) {
    container.html('');

    updates.on('update_map.mode', function(data, layers) {
        function findLayer(p) {
            var layer;
            layers.eachLayer(function(l) {
                if (p == l.feature.properties) layer = l;
            });
            return layer;
        }
        if (!data.features.length) {
            container.append('div')
                .attr('class', 'blank-banner')
                .text('no features');
        } else {
            var props = [];
            layers.eachLayer(function(p) {
                props.push(p.feature.properties);
            });
            container.html('');
            container
                .append('div')
                .attr('class', 'pad1 scrollable')
                .data([props])
                .call(
                    metatable()
                        .on('change', function() {
                            updates.update_refresh();
                        })
                        .on('rowfocus', function(d) {
                            updates.focus_layer(findLayer(d));
                        })
                );
        }
    });
}

},{"d3-metatable":22}],11:[function(require,module,exports){
var topojson = require('topojson'),
    toGeoJSON = require('togeojson'),
    detectIndentationStyle = require('detect-json-indent');

module.exports = importPanel;

function importPanel(container, updates) {
    container.html('');
    var wrap = container.append('div').attr('class', 'pad1');

    var importSupport = !!(window.FileReader);

    wrap.append('p')
        .attr('class', 'intro')
        .text('Make a map! To start, draw with the tools on the left or import your own data.');

    wrap.append('div')
        .attr('class', 'modal-message')
        .text('Drop files to map!');

    function over() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        d3.select('body').classed('dragover', true);
    }

    function exit() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        d3.select('body').classed('dragover', false);
    }

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    function trackImport(format, method) {
        analytics.track('Imported Data / ' + method + ' / ' + format);
    }

    function readFile(f, method) {
        var reader = new FileReader();
        import_landing.classed('dragover', false);

        reader.onload = function(e) {
            var gj;
            var filename = f.name ? f.name.toLowerCase() : '';
            function ext(_) {
                return filename.indexOf(_) !== -1;
            }
            if (f.type === 'application/vnd.google-earth.kml+xml' || ext('.kml')) {
                var kmldom = toDom(e.target.result);
                if (!kmldom) {
                    return alert('Invalid KML file: not valid XML');
                }
                if (kmldom.getElementsByTagName('NetworkLink').length) {
                    alert('The KML file you uploaded included NetworkLinks: some content may not display. ' +
                          'Please export and upload KML without NetworkLinks for optimal performance');
                }
                gj = toGeoJSON.kml(kmldom);
            } else if (ext('.gpx')) {
                gj = toGeoJSON.gpx(toDom(e.target.result));
            } else if (ext('.geojson') || ext('.json')) {
                try {
                    gj = JSON.parse(e.target.result);
                    exportIndentationStyle = detectIndentationStyle(e.target.result);
                    if (gj && gj.type === 'Topology' && gj.objects) {
                        var collection = { type: 'FeatureCollection', features: [] };
                        for (var o in gj.objects) collection.features.push(topojson.feature(gj, gj.objects[o]));
                        gj = collection;
                    }
                } catch(err) {
                    alert('Invalid JSON file: ' + err);
                    analytics.track('Uploaded invalid JSON', {
                        snippet: e.target.result.substring(0, 20)
                    });
                    return;
                }
            } else if (f.type === 'text/csv' || ext('.csv') || ext('.tsv') || ext('.dsv')) {
                csv2geojson.csv2geojson(e.target.result, {
                    delimiter: 'auto'
                }, function(err, result) {
                    if (err) {
                        return handleGeocode(container.append('div'), e.target.result, updates);
                    } else {
                        gj = result;
                    }
                });
            } else {
                analytics.track('Invalid file', {
                    type: f.type,
                    snippet: e.target.result.substring(0, 20)
                });
                return alert('Sorry, that file type is not supported');
            }
            if (gj) {
                updates.update_editor(gj);
                updates.zoom_extent();
            }
        };

        reader.readAsText(f);
    }

    if (importSupport) {

        d3.select('body')
            .attr('dropzone', 'copy')
            .on('drop.localgpx', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                d3.select('body').classed('dragover', false);
                var f = d3.event.dataTransfer.files[0];
                readFile(f, 'drag');
            })
            .on('dragenter.localgpx', over)
            .on('dragexit.localgpx', exit)
            .on('dragover.localgpx', over);

        var import_landing = wrap.append('div')
            .attr('class', 'pad fillL');

        var message = import_landing
            .append('div')
            .attr('class', 'center');

        var button = message.append('button')
            .on('click', function() {
                fileInput.node().click();
            });
        button.append('span').attr('class', 'icon-arrow-down');
        button.append('span').text(' Import');
        message.append('p')
            .attr('class', 'deemphasize')
            .append('small')
            .text('GeoJSON, TopoJSON, KML, CSV, GPX supported. You can also drag & drop files.');
        var fileInput = message
            .append('input')
            .attr('type', 'file')
            .style('visibility', 'hidden')
            .style('position', 'absolute')
            .style('height', '0')
            .on('change', function() {
                if (this.files && this.files[0]) readFile(this.files[0], 'click');
            });
    } else {
        wrap.append('p')
            .attr('class', 'blank-banner')
            .text('Sorry, geojson.io supports importing GeoJSON, GPX, KML, and CSV files, but ' +
                  'your browser isn\'t compatible. Please use Google Chrome, Safari 6, IE10, Firefox, or Opera for an optimal experience.');
    }

    wrap.append('p')
        .attr('class', 'intro center deemphasize')
        .html('<a target="_blank" href="http://tmcw.wufoo.com/forms/z7x4m1/">Submit feedback or get help</a>, and <a target="_blank" href="http://github.com/mapbox/geojson.io"><span class="icon-github"></span> fork on GitHub</a>');

    if (window.chrome) wrap.append('p')
        .attr('class', 'intro-hint pad1 deemphasize')
        .html('Use GitHub? The <a target="_blank" href="https://chrome.google.com/webstore/detail/geojsonio/oibjgofbhldcajfamjganpeacipebckp">geojson.io chrome extension</a> lets you edit map data in your repositories!');

    wrap.append('div')
        .attr('class', 'pad1');
}

function handleGeocode(container, text, updates) {

    var list = csv2geojson.auto(text);

    var button = container.append('div')
        .attr('class', 'bucket-actions')
        .append('button')
        .attr('class', 'major')
        .attr('disabled', true)
        .text('At least one field required to geocode');

    var join = container.append('div')
        .attr('class', 'bucket-deposit')
        .append('div')
        .attr('class', 'bucket-join');

    var buckets = join.selectAll('.bucket')
        .data(['City', 'State', 'ZIP', 'Country'])
        .enter()
        .append('div')
        .attr('class', 'bucket')
        .text(String);

    var example = container.append('div')
        .attr('class', 'example');

    var store = container.append('div')
       .attr('class', 'bucket-store');

    var sources = store.selectAll('bucket-source')
       .data(Object.keys(list[0]))
       .enter()
       .append('div')
       .attr('class', 'bucket-source')
       .text(String);

    function transformRow(fields) {
        return function(obj) {
           return d3.entries(obj)
               .filter(function(e) { return fields.indexOf(e.key) !== -1; })
               .map(function(e) { return e.value; })
               .join(', ');
        };
    }

    function showExample(fields) {
        var i = 0;
        return function() {
            if (++i > list.length) i = 0;
            example.html('');
            example.text(transformRow(fields)(list[i]));
        };
    }

    var ti;
    var broker = bucket();
    buckets.call(broker.deposit());
    sources.call(broker.store().on('chosen', onChosen));

    function onChosen(fields) {
         if (ti) window.clearInterval(ti);
         if (fields.length) {
             button.attr('disabled', null)
                .text('Geocode');
             button.on('click', function() {
                 runGeocode(container, list, transformRow(fields), updates);
             });
             var se = showExample(fields);
             se();
             ti = window.setInterval(se, 2000);
         } else {
             button.attr('disabled', true)
                .text('At least one field required to geocode');
             example.text('');
         }
     }
}

function runGeocode(container, list, transform, updates) {
    container.html('');

    var wrap = container.append('div').attr('class', 'pad1');

    var doneBtn = wrap.append('div')
        .attr('class', 'pad1 center')
        .append('button')
        .attr('class', 'major')
        .text('Close')
        .on('click', function() {
            container.html('');
            if (task) task();
        });

    var chartDiv = wrap.append('div');
    var failedDiv = wrap.append('div');

    var geocode = geocodemany('tmcw.map-u4ca5hnt');

    function progressChart(elem, w, h) {
        var c = elem.appendChild(document.createElement('canvas'));
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        var gap;
        var fill = {
            success: '#e3e4b8',
            error: '#E0A990'
        };

        return function(e) {
            if (!gap) gap = ((e.done) / e.todo * w) - ((e.done - 1) / e.todo * w);
            ctx.fillStyle = fill[e.status];
            ctx.fillRect((e.done - 1) / e.todo * w, 0, gap, h);
        };
    }

    var chart = progressChart(chartDiv.node(), chartDiv.node().offsetWidth, 50);

    function progress(e) {
        chart(e);
    }

    function printObj(o) {
        return '(' + d3.entries(o)
            .map(function(_) {
                return _.key + ': ' + _.value;
            }).join(',') + ')';
    }

    function done(failed, completed) {

        failedDiv
            .selectAll('.fail')
            .data(failed)
            .enter()
            .append('div')
            .attr('class', 'fail')
            .text(function(d) {
                return 'failed: ' + transform(d.data) + ' / ' + printObj(d.data);
            });

        csv2geojson.csv2geojson(completed, function(err, result) {
            updates.update_editor(result);
        });
    }

    var task = geocode(list, transform, progress, done);
}

},{"topojson":"g070js","togeojson":23,"detect-json-indent":19}],2:[function(require,module,exports){
var type = require("./type"),
    stitch = require("./stitch-poles"),
    hashtable = require("./hashtable"),
    systems = require("./coordinate-systems");

var ε = 1e-6;

module.exports = function(objects, options) {
  var Q = 1e4, // precision of quantization
      id = function(d) { return d.id; }, // function to compute object id
      propertyTransform = function() {}, // function to transform properties
      stitchPoles = true,
      verbose = false,
      x0, y0, x1, y1,
      kx, ky,
      εmax = 0,
      coincidences,
      system = null,
      arcs = [],
      arcsByPoint,
      pointsByPoint;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]),
    "stitch-poles" in options && (stitchPoles = !!options["stitch-poles"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "quantization" in options && (Q = +options["quantization"]),
    "id" in options && (id = options["id"]),
    "property-transform" in options && (propertyTransform = options["property-transform"]);

  coincidences = hashtable(Q * 10);
  arcsByPoint = hashtable(Q * 10);
  pointsByPoint = hashtable(Q * 10);

  function each(callback) {
    var t = type(callback), o = {};
    for (var k in objects) o[k] = t.object(objects[k]) || {};
    return o;
  }

  // Compute bounding box.
  function bound() {
    x1 = y1 = -(x0 = y0 = Infinity);
    each({
      point: function(point) {
        var x = point[0],
            y = point[1];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    });
  }

  bound();

  // For automatic coordinate system determination, consider the bounding box.
  var oversize = x0 < -180 - ε || x1 > 180 + ε || y0 < -90 - ε || y1 > 90 + ε;
  if (!system) {
    system = systems[oversize ? "cartesian" : "spherical"];
    if (options) options["coordinate-system"] = system.name;
  }

  if (system === systems.spherical) {
    if (oversize) throw new Error("spherical coordinates outside of [±180°, ±90°]");
    if (stitchPoles) stitch(objects), bound();

    // When near the spherical coordinate limits, clamp to nice round values.
    // This avoids quantized coordinates that are slightly outside the limits.
    if (x0 < -180 + ε) x0 = -180;
    if (x1 > 180 - ε) x1 = 180;
    if (y0 < -90 + ε) y0 = -90;
    if (y1 > 90 - ε) y1 = 90;
  }

  if (!isFinite(x0)) x0 = 0;
  if (!isFinite(x1)) x1 = 0;
  if (!isFinite(y0)) y0 = 0;
  if (!isFinite(y1)) y1 = 0;

  // Compute quantization scaling factors.
  if (Q) {
    kx = x1 - x0 ? (Q - 1) / (x1 - x0) : 1;
    ky = y1 - y0 ? (Q - 1) / (y1 - y0) : 1;
  } else {
    console.warn("quantization: disabled; assuming inputs already quantized");
    Q = x1 + 1;
    kx = ky = 1;
    x0 = y0 = 0;
  }

  if (verbose) {
    var qx0 = Math.round((x0 - x0) * kx) * (1 / kx) + x0,
        qx1 = Math.round((x1 - x0) * kx) * (1 / kx) + x0,
        qy0 = Math.round((y0 - y0) * ky) * (1 / ky) + y0,
        qy1 = Math.round((y1 - y0) * ky) * (1 / ky) + y0;
    console.warn("quantization: bounds " + [qx0, qy0, qx1, qy1].join(" ") + " (" + system.name + ")");
  }

  // Quantize coordinates.
  each({
    point: function(point) {
      var x1 = point[0],
          y1 = point[1],
          x = Math.round((x1 - x0) * kx),
          y = Math.round((y1 - y0) * ky),
          ε = system.distance(x1, y1, x / kx + x0, y / ky + y0);
      if (ε > εmax) εmax = ε;
      point[0] = x;
      point[1] = y;
    }
  });

  if (verbose) console.warn("quantization: maximum error "  + system.formatDistance(εmax));

  // Compute the line strings that go through each unique point.
  // If the line string goes through the same point more than once,
  // only record that point once.
  each({
    line: function(line) {
      var i = -1,
          n = line.length,
          lines;
      while (++i < n) {
        lines = coincidences.get(line[i]);
        if (lines.indexOf(line) < 0) lines.push(line);
      }
    }
  });

  // Convert features to geometries, and stitch together arcs.
  objects = each({
    Feature: function(feature) {
      var geometry = feature.geometry;
      if (feature.geometry == null) geometry = {};
      if ("id" in feature) geometry.id = feature.id;
      if ("properties" in feature) geometry.properties = feature.properties;
      return this.geometry(geometry);
    },

    FeatureCollection: function(collection) {
      collection.type = "GeometryCollection";
      collection.geometries = collection.features.map(this.Feature, this);
      delete collection.features;
      return collection;
    },

    GeometryCollection: function(collection) {
      collection.geometries = collection.geometries.map(this.geometry, this);
    },

    MultiPolygon: function(multiPolygon) {
      multiPolygon.arcs = multiPolygon.coordinates.map(polygon);
    },

    Polygon: function(polygon) {
      polygon.arcs = polygon.coordinates.map(lineClosed);
    },

    MultiLineString: function(multiLineString) {
      multiLineString.arcs = multiLineString.coordinates.map(lineOpen);
    },

    LineString: function(lineString) {
      lineString.arcs = lineOpen(lineString.coordinates);
    },

    geometry: function(geometry) {
      if (geometry == null) geometry = {};
      else this.defaults.geometry.call(this, geometry);

      geometry.id = id(geometry);
      if (geometry.id == null) delete geometry.id;

      if (properties0 = geometry.properties) {
        var properties0, properties1 = {};
        delete geometry.properties;
        for (var key0 in properties0) {
          if (propertyTransform(properties1, key0, properties0[key0])) {
            geometry.properties = properties1;
          }
        }
      }

      if (geometry.arcs) delete geometry.coordinates;
      return geometry;
    }
  });

  coincidences = arcsByPoint = pointsByPoint = null;

  function polygon(polygon) {
    return polygon.map(lineClosed);
  }

  function lineClosed(points) {
    return line(points, false);
  }

  function lineOpen(points) {
    return line(points, true);
  }

  function line(points, open) {
    var lineArcs = [],
        n = points.length,
        a = [],
        k = 0,
        p;

    if (!open) points.pop(), --n;

    // For closed lines, rotate to find a suitable shared starting point.
    for (; k < n; ++k) {
      var t = coincidences.peek(points[k]);
      if (open) break;
      if (p && !linesEqual(p, t)) {
        var tInP = t.every(function(line) { return p.indexOf(line) >= 0; }),
            pInT = p.every(function(line) { return t.indexOf(line) >= 0; });
        if (tInP && !pInT) --k;
        break;
      }
      p = t;
    }

    // If no shared starting point is found for closed lines, rotate to minimum.
    if (k === n && p.length > 1) {
      var point0 = points[0];
      for (k = 0, i = 1; i < n; ++i) {
        var point = points[i];
        if (pointCompare(point0, point) > 0) point0 = point, k = i;
      }
    }

    for (var i = 0, m = open ? n : n + 1; i < m; ++i) {
      var point = points[(i + k) % n],
          p = coincidences.peek(point);
      if (!linesEqual(p, t)) {
        var tInP = t.every(function(line) { return p.indexOf(line) >= 0; }),
            pInT = p.every(function(line) { return t.indexOf(line) >= 0; });
        if (tInP) a.push(point);
        arc(a);
        if (!tInP && !pInT) arc([a[a.length - 1], point]);
        if (pInT) a = [a[a.length - 1]];
        else a = [];
      }
      if (!a.length || pointCompare(a[a.length - 1], point)) a.push(point); // skip duplicate points
      t = p;
    }

    arc(a, true);

    function arc(a, last) {
      var n = a.length;

      if (last && !lineArcs.length && n === 1) {
        var point = a[0],
            index = pointsByPoint.get(point);
        if (index.length) {
          lineArcs.push(index[0]);
        } else {
          lineArcs.push(index[0] = arcs.length);
          arcs.push(a);
        }
      } else if (n > 1) {
        var a0 = a[0],
            a1 = a[n - 1],
            point = pointCompare(a0, a1) < 0 ? a0 : a1,
            pointArcs = arcsByPoint.get(point);
        if (pointArcs.some(matchForward)) return;
        if (pointArcs.some(matchBackward)) return;
        pointArcs.push(a);
        lineArcs.push(a.index = arcs.length);
        arcs.push(a);
      }

      function matchForward(b) {
        var i = -1;
        if (b.length !== n) return false;
        while (++i < n) if (pointCompare(a[i], b[i])) return false;
        lineArcs.push(b.index);
        return true;
      }

      function matchBackward(b) {
        var i = -1;
        if (b.length !== n) return false;
        while (++i < n) if (pointCompare(a[i], b[n - i - 1])) return false;
        lineArcs.push(~b.index);
        return true;
      }
    }

    return lineArcs;
  }

  return {
    type: "Topology",
    bbox: [x0, y0, x1, y1],
    transform: {
      scale: [1 / kx, 1 / ky],
      translate: [x0, y0]
    },
    objects: objects,
    arcs: arcs.map(function(arc) {
      var i = 0,
          n = arc.length,
          point = arc[0],
          x1 = point[0], x2, dx,
          y1 = point[1], y2, dy,
          points = [[x1, y1]];
      while (++i < n) {
        point = arc[i];
        x2 = point[0];
        y2 = point[1];
        dx = x2 - x1;
        dy = y2 - y1;
        if (dx || dy) {
          points.push([dx, dy]);
          x1 = x2, y1 = y2;
        }
      }
      return points;
    })
  };
};

function linesEqual(a, b) {
  var n = a.length, i = -1;
  if (b.length !== n) return false;
  while (++i < n) if (a[i] !== b[i]) return false;
  return true;
}

function pointCompare(a, b) {
  return a[0] - b[0] || a[1] - b[1];
}

function noop() {}

},{"./type":24,"./stitch-poles":25,"./coordinate-systems":26,"./hashtable":27}],3:[function(require,module,exports){
var minHeap = require("./min-heap"),
    systems = require("./coordinate-systems");

module.exports = function(topology, options) {
  var mininumArea = 0,
      retainProportion,
      verbose = false,
      heap = minHeap(),
      maxArea = 0,
      system = null,
      triangle,
      N = 0,
      M = 0;

  if (options)
    "minimum-area" in options && (mininumArea = +options["minimum-area"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "retain-proportion" in options && (retainProportion = +options["retain-proportion"]),
    "verbose" in options && (verbose = !!options["verbose"]);

  topology.arcs.forEach(function(arc) {
    var triangles = [];

    arc.forEach(transformAbsolute(topology.transform));

    for (var i = 1, n = arc.length - 1; i < n; ++i) {
      triangle = arc.slice(i - 1, i + 2);
      triangle[1].area = system.triangleArea(triangle);
      triangles.push(triangle);
      heap.push(triangle);
    }

    // Always keep the arc endpoints!
    arc[0].area = arc[n].area = Infinity;

    N += n + 1;

    for (var i = 0, n = triangles.length; i < n; ++i) {
      triangle = triangles[i];
      triangle.previous = triangles[i - 1];
      triangle.next = triangles[i + 1];
    }
  });

  while (triangle = heap.pop()) {
    var previous = triangle.previous,
        next = triangle.next;

    // If the area of the current point is less than that of the previous point
    // to be eliminated, use the latter's area instead. This ensures that the
    // current point cannot be eliminated without eliminating previously-
    // eliminated points.
    if (triangle[1].area < maxArea) triangle[1].area = maxArea;
    else maxArea = triangle[1].area;

    if (previous) {
      previous.next = next;
      previous[2] = triangle[2];
      update(previous);
    }

    if (next) {
      next.previous = previous;
      next[0] = triangle[0];
      update(next);
    }
  }

  if (retainProportion) {
    var areas = [];
    topology.arcs.forEach(function(arc) {
      arc.forEach(function(point) {
        areas.push(point.area);
      });
    });
    mininumArea = areas.sort(function(a, b) { return b - a; })[Math.ceil((N - 1) * retainProportion)];
    if (verbose) console.warn("simplification: effective minimum area " + mininumArea.toPrecision(3));
  }

  topology.arcs = topology.arcs.map(function(arc) {
    return arc.filter(function(point) {
      return point.area >= mininumArea;
    });
  });

  topology.arcs.forEach(function(arc) {
    arc.forEach(transformRelative(topology.transform));
    M += arc.length;
  });

  function update(triangle) {
    heap.remove(triangle);
    triangle[1].area = system.triangleArea(triangle);
    heap.push(triangle);
  }

  if (verbose) console.warn("simplification: retained " + M + " / " + N + " points (" + Math.round((M / N) * 100) + "%)");

  return topology;
};

function transformAbsolute(transform) {
  var x0 = 0,
      y0 = 0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point) {
    point[0] = (x0 += point[0]) * kx + dx;
    point[1] = (y0 += point[1]) * ky + dy;
  };
}

function transformRelative(transform) {
  var x0 = 0,
      y0 = 0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point) {
    var x1 = (point[0] - dx) / kx | 0,
        y1 = (point[1] - dy) / ky | 0;
    point[0] = x1 - x0;
    point[1] = y1 - y0;
    x0 = x1;
    y0 = y1;
  };
}

},{"./coordinate-systems":26,"./min-heap":28}],21:[function(require,module,exports){
module.exports = function(hostname) {
    var production = (hostname === 'geojson.io');

    return {
        client_id: production ?
            '62c753fd0faf18392d85' :
            'bb7bbe70bd1f707125bc',
        gatekeeper_url: production ?
            'http://geojsonioauth.herokuapp.com' :
            'http://localhostauth.herokuapp.com'
    };
};

},{}],5:[function(require,module,exports){
var type = require("./type"),
    prune = require("./prune"),
    clockwise = require("./clockwise"),
    systems = require("./coordinate-systems"),
    topojson = require("../../");

module.exports = function(topology, options) {
  var system = null,
      forceClockwise = true; // force exterior rings to be clockwise?

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "force-clockwise" in options && (forceClockwise = !!options["force-clockwise"]);

  if (forceClockwise) clockwise(topology, options); // deprecated; for backwards-compatibility

  var filter = type({
    LineString: noop, // TODO remove empty lines
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) {
      polygon.arcs = polygon.arcs.filter(ringArea);
      if (!polygon.arcs.length) {
        polygon.type = null;
        delete polygon.arcs;
      }
    },
    MultiPolygon: function(multiPolygon) {
      multiPolygon.arcs = multiPolygon.arcs.map(function(polygon) {
        return polygon.filter(ringArea);
      }).filter(function(polygon) {
        return polygon.length;
      });
      if (!multiPolygon.arcs.length) {
        multiPolygon.type = null;
        delete multiPolygon.arcs;
      }
    },
    GeometryCollection: function(collection) {
      this.defaults.GeometryCollection.call(this, collection);
      collection.geometries = collection.geometries.filter(function(geometry) { return geometry.type != null; });
      if (!collection.geometries.length) {
        collection.type = null;
        delete collection.geometries;
      }
    }
  });

  for (var key in topology.objects) {
    filter.object(topology.objects[key]);
  }

  prune(topology, options);

  function ringArea(ring) {
    return system.absoluteArea(system.ringArea(topojson.feature(topology, {type: "Polygon", arcs: [ring]}).geometry.coordinates[0]));
  }
};

// TODO It might be slightly more compact to reverse the arc.
function reverse(ring) {
  var i = -1, n = ring.length;
  ring.reverse();
  while (++i < n) ring[i] = ~ring[i];
}

function noop() {}

},{"./type":24,"./prune":6,"./clockwise":4,"./coordinate-systems":26,"../../":"g070js"}],6:[function(require,module,exports){
var type = require("./type"),
    topojson = require("../../");

module.exports = function(topology, options) {
  var verbose = false,
      retained = [],
      j = -1,
      n = topology.arcs.length;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]);

  var prune = type({
    LineString: function(lineString) {
      this.line(lineString.arcs);
    },
    MultiLineString: function(multiLineString) {
      var arcs = multiLineString.arcs, i = -1, n = arcs.length;
      while (++i < n) this.line(arcs[i]);
    },
    MultiPoint: noop,
    MultiPolygon: function(multiPolygon) {
      var arcs = multiPolygon.arcs, i = -1, n = arcs.length;
      while (++i < n) this.polygon(arcs[i]);
    },
    Point: noop,
    Polygon: function(polygon) {
      this.polygon(polygon.arcs);
    },
    line: function(arcs) {
      var i = -1, n = arcs.length, arc, reversed;
      while (++i < n) {
        arc = arcs[i];
        if (reversed = arc < 0) arc = ~arc;
        if (retained[arc] == null) retained[arc] = ++j, arc = j;
        else arc = retained[arc];
        arcs[i] = reversed ? ~arc : arc;
      }
    },
    polygon: function(arcs) {
      var i = -1, n = arcs.length;
      while (++i < n) this.line(arcs[i]);
    }
  });

  for (var key in topology.objects) {
    prune.object(topology.objects[key]);
  }

  if (verbose) console.warn("prune: retained " + (j + 1) + " / " + n + " arcs (" + Math.round((j + 1) / n * 100) + "%)");

  var arcs = [];
  retained.forEach(function(i, j) { arcs[i] = topology.arcs[j]; });
  topology.arcs = arcs;
};

function noop() {}

},{"./type":24,"../../":"g070js"}],4:[function(require,module,exports){
var type = require("./type"),
    systems = require("./coordinate-systems"),
    topojson = require("../../");

module.exports = function(object, options) {
  if (object.type === "Topology") clockwiseTopology(object, options);
  else clockwiseGeometry(object, options);
};

function clockwiseGeometry(object, options) {
  var system = null;

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]);

  type({
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) { clockwisePolygon(polygon.coordinates); },
    MultiPolygon: function(multiPolygon) { multiPolygon.coordinates.forEach(clockwisePolygon); }
  }).object(object);

  function clockwisePolygon(rings) {
    if (rings.length && system.ringArea(r = rings[0]) < 0) r.reverse();
    for (var i = 1, n = rings.length, r; i < n; ++i) {
      if (system.ringArea(r = rings[i]) > 0) r.reverse();
    }
  }
}

function clockwiseTopology(topology, options) {
  var system = null;

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]);

  var clockwise = type({
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) { clockwisePolygon(polygon.arcs); },
    MultiPolygon: function(multiPolygon) { multiPolygon.arcs.forEach(clockwisePolygon); }
  });

  for (var key in topology.objects) {
    clockwise.object(topology.objects[key]);
  }

  function clockwisePolygon(rings) {
    if (rings.length && ringArea(r = rings[0]) < 0) reverse(r);
    for (var i = 1, n = rings.length, r; i < n; ++i) {
      if (ringArea(r = rings[i]) > 0) reverse(r);
    }
  }

  function ringArea(ring) {
    return system.ringArea(topojson.feature(topology, {type: "Polygon", arcs: [ring]}).geometry.coordinates[0]);
  }

  // TODO It might be slightly more compact to reverse the arc.
  function reverse(ring) {
    var i = -1, n = ring.length;
    ring.reverse();
    while (++i < n) ring[i] = ~ring[i];
  }
};

function noop() {}

},{"./coordinate-systems":26,"./type":24,"../../":"g070js"}],7:[function(require,module,exports){
var type = require("./type"),
    topojson = require("../../");

module.exports = function(topology, propertiesById) {
  var bind = type({
    geometry: function(geometry) {
      var properties0 = geometry.properties,
          properties1 = propertiesById[geometry.id];
      if (properties1) {
        if (properties0) for (var k in properties1) properties0[k] = properties1[k];
        else for (var k in properties1) { geometry.properties = properties1; break; }
      }
      this.defaults.geometry.call(this, geometry);
    },
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: noop,
    MultiPolygon: noop
  });

  for (var key in topology.objects) {
    bind.object(topology.objects[key]);
  }
};

function noop() {}

},{"./type":24,"../../":"g070js"}],22:[function(require,module,exports){
if (typeof module !== 'undefined') {
    module.exports = function(d3) {
        return metatable;
    };
}

function metatable() {
    var event = d3.dispatch('change', 'rowfocus');

    function table(selection) {
        selection.each(function(d) {
            var sel = d3.select(this),
                table;

            var keyset = d3.set();
            d.map(Object.keys).forEach(function(k) {
                k.forEach(function(_) {
                    keyset.add(_);
                });
            });

            var keys = keyset.values();

            bootstrap();
            paint();

            function bootstrap() {

                var controls = sel.selectAll('.controls')
                    .data([d])
                    .enter()
                    .append('div')
                    .attr('class', 'controls');

                var colbutton = controls.append('button')
                    .on('click', function() {
                        var name = prompt('column name');
                        if (name) {
                            keys.push(name);
                            paint();
                        }
                    });
                colbutton.append('span').attr('class', 'icon-plus');
                colbutton.append('span').text(' new column');
                var enter = sel.selectAll('table').data([d]).enter().append('table');
                var thead = enter.append('thead');
                var tbody = enter.append('tbody');
                var tr = thead.append('tr');

                table = sel.select('table');
            }

            function paint() {

                var th = table
                    .select('thead')
                    .select('tr')
                    .selectAll('th')
                    .data(keys);

                th.enter()
                    .append('th')
                    .text(String);

                th.exit().remove();

                var tr = table.select('tbody').selectAll('tr')
                    .data(function(d) { return d; });

                tr.enter()
                    .append('tr');

                tr.exit().remove();

                var td = tr.selectAll('td')
                    .data(keys);

                td.enter()
                    .append('td')
                    .append('input')
                    .attr('field', String);

                function write(d) {
                    d[d3.select(this).attr('field')] = this.value;
                    event.change();
                }

                tr.selectAll('input')
                    .data(function(d) {
                        return d3.range(keys.length).map(function() { return d; });
                    })
                    .classed('disabled', function(d) {
                        return d[d3.select(this).attr('field')] === undefined;
                    })
                    .property('value', function(d) {
                        return d[d3.select(this).attr('field')] || '';
                    })
                    .on('keyup', write)
                    .on('change', write)
                    .on('click', function(d) {
                        if (d[d3.select(this).attr('field')] === undefined) {
                            d[d3.select(this).attr('field')] = '';
                            paint();
                        }
                    })
                    .on('focus', function(d) {
                        event.rowfocus(d);
                    });
            }
        });
    }

    return d3.rebind(table, event, 'on');
}

},{}],23:[function(require,module,exports){
toGeoJSON = (function() {
    'use strict';

    var removeSpace = (/\s*/g),
        trimSpace = (/^\s*|\s*$/g),
        splitSpace = (/\s+/);
    // generate a short, numeric hash of a string
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        } return h;
    }
    // all Y children of X
    function get(x, y) { return x.getElementsByTagName(y); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(attr(x, y)); }
    // one Y child of X, if any, otherwise null
    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
    // cast array x into numbers
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }
    function clean(x) {
        var o = {};
        for (var i in x) if (x[i]) o[i] = x[i];
        return o;
    }
    // get the content of a text node, if any
    function nodeVal(x) { if (x) {norm(x);} return x && x.firstChild && x.firstChild.nodeValue; }
    // get one coordinate from a coordinate array, if any
    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
    // get all coordinates from a coordinate array as [[],[]]
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace),
            o = [];
        for (var i = 0; i < coords.length; i++) {
            o.push(coord1(coords[i]));
        }
        return o;
    }
    function coordPair(x) { return [attrf(x, 'lon'), attrf(x, 'lat')]; }

    // create a new feature collection parent object
    function fc() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }

    var styleSupport = false;
    if (typeof XMLSerializer !== 'undefined') {
        var serializer = new XMLSerializer();
        styleSupport = true;
    }
    function xml2str(str) { return serializer.serializeToString(str); }

    var t = {
        kml: function(doc, o) {
            o = o || {};

            var gj = fc(),
                // styleindex keeps track of hashed styles in order to match features
                styleIndex = {},
                // atomic geospatial types supported by KML - MultiGeometry is
                // handled separately
                geotypes = ['Polygon', 'LineString', 'Point'],
                // all root placemarks in the file
                placemarks = get(doc, 'Placemark'),
                styles = get(doc, 'Style');

            if (styleSupport) for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + attr(styles[k], 'id')] = okhash(xml2str(styles[k])).toString(16);
            }
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j]));
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({
                                    type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'),
                                    coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({
                                    type: 'Polygon',
                                    coordinates: coords
                                });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root) {
                var geoms = getGeometry(root), i, properties = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    description = nodeVal(get1(root, 'description')),
                    extendedData = get1(root, 'ExtendedData');

                if (!geoms.length) return false;
                if (name) properties.name = name;
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    properties.styleHash = styleIndex[styleUrl];
                }
                if (description) properties.description = description;
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');

                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                }
                return [{
                    type: 'Feature',
                    geometry: (geoms.length === 1) ? geoms[0] : {
                        type: 'GeometryCollection',
                        geometries: geoms
                    },
                    properties: properties
                }];
            }
            return gj;
        },
        gpx: function(doc, o) {
            var i,
                tracks = get(doc, 'trk'),
                routes = get(doc, 'rte'),
                waypoints = get(doc, 'wpt'),
                // a feature collection
                gj = fc();
            for (i = 0; i < tracks.length; i++) {
                gj.features.push(getLinestring(tracks[i], 'trkpt'));
            }
            for (i = 0; i < routes.length; i++) {
                gj.features.push(getLinestring(routes[i], 'rtept'));
            }
            for (i = 0; i < waypoints.length; i++) {
                gj.features.push(getPoint(waypoints[i]));
            }
            function getLinestring(node, pointname) {
                var j, pts = get(node, pointname), line = [];
                for (j = 0; j < pts.length; j++) {
                    line.push(coordPair(pts[j]));
                }
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: 'LineString',
                        coordinates: line
                    }
                };
            }
            function getPoint(node) {
                var prop = getProperties(node);
                prop.ele = nodeVal(get1(node, 'ele'));
                prop.sym = nodeVal(get1(node, 'sym'));
                return {
                    type: 'Feature',
                    properties: prop,
                    geometry: {
                        type: 'Point',
                        coordinates: coordPair(node)
                    }
                };
            }
            function getProperties(node) {
                var meta = ['name', 'desc', 'author', 'copyright', 'link',
                            'time', 'keywords'],
                    prop = {},
                    k;
                for (k = 0; k < meta.length; k++) {
                    prop[meta[k]] = nodeVal(get1(node, meta[k]));
                }
                return clean(prop);
            }
            return gj;
        }
    };
    return t;
})();

if (typeof module !== 'undefined') module.exports = toGeoJSON;

},{}],20:[function(require,module,exports){
'use strict';

var geojsonhint = require('geojsonhint');

module.exports = function(callback) {
    return function(editor) {

        var err = geojsonhint.hint(editor.getValue());
        editor.clearGutter('error');

        if (err instanceof Error) {
            handleError(err.message);
            return callback({
                class: 'icon-circle-blank',
                title: 'invalid JSON',
                message: 'invalid JSON'});
        } else if (err.length) {
            handleErrors(err);
            return callback({
                class: 'icon-circle-blank',
                title: 'invalid GeoJSON',
                message: 'invalid GeoJSON'});
        } else {
            var gj = JSON.parse(editor.getValue());
            try {
                return callback(null, gj);
            } catch(e) {
                return callback({
                    class: 'icon-circle-blank',
                    title: 'invalid GeoJSON',
                    message: 'invalid GeoJSON'});
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
    };
};

},{"geojsonhint":29}],24:[function(require,module,exports){
module.exports = function(types) {
  for (var type in typeDefaults) {
    if (!(type in types)) {
      types[type] = typeDefaults[type];
    }
  }
  types.defaults = typeDefaults;
  return types;
};

var typeDefaults = {

  Feature: function(feature) {
    if (feature.geometry) this.geometry(feature.geometry);
  },

  FeatureCollection: function(collection) {
    var features = collection.features, i = -1, n = features.length;
    while (++i < n) this.Feature(features[i]);
  },

  GeometryCollection: function(collection) {
    var geometries = collection.geometries, i = -1, n = geometries.length;
    while (++i < n) this.geometry(geometries[i]);
  },

  LineString: function(lineString) {
    this.line(lineString.coordinates);
  },

  MultiLineString: function(multiLineString) {
    var coordinates = multiLineString.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.line(coordinates[i]);
  },

  MultiPoint: function(multiPoint) {
    var coordinates = multiPoint.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.point(coordinates[i]);
  },

  MultiPolygon: function(multiPolygon) {
    var coordinates = multiPolygon.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.polygon(coordinates[i]);
  },

  Point: function(point) {
    this.point(point.coordinates);
  },

  Polygon: function(polygon) {
    this.polygon(polygon.coordinates);
  },

  object: function(object) {
    return object == null ? null
        : typeObjects.hasOwnProperty(object.type) ? this[object.type](object)
        : this.geometry(object);
  },

  geometry: function(geometry) {
    return geometry == null ? null
        : typeGeometries.hasOwnProperty(geometry.type) ? this[geometry.type](geometry)
        : null;
  },

  point: function() {},

  line: function(coordinates) {
    var i = -1, n = coordinates.length;
    while (++i < n) this.point(coordinates[i]);
  },

  polygon: function(coordinates) {
    var i = -1, n = coordinates.length;
    while (++i < n) this.line(coordinates[i]);
  }
};

var typeGeometries = {
  LineString: 1,
  MultiLineString: 1,
  MultiPoint: 1,
  MultiPolygon: 1,
  Point: 1,
  Polygon: 1,
  GeometryCollection: 1
};

var typeObjects = {
  Feature: 1,
  FeatureCollection: 1
};

},{}],28:[function(require,module,exports){
module.exports = function() {
  var heap = {},
      array = [];

  heap.push = function() {
    for (var i = 0, n = arguments.length; i < n; ++i) {
      var object = arguments[i];
      up(object.index = array.push(object) - 1);
    }
    return array.length;
  };

  heap.pop = function() {
    var removed = array[0],
        object = array.pop();
    if (array.length) {
      array[object.index = 0] = object;
      down(0);
    }
    return removed;
  };

  heap.remove = function(removed) {
    var i = removed.index,
        object = array.pop();
    if (i !== array.length) {
      array[object.index = i] = object;
      (compare(object, removed) < 0 ? up : down)(i);
    }
    return i;
  };

  function up(i) {
    var object = array[i];
    while (i > 0) {
      var up = ((i + 1) >> 1) - 1,
          parent = array[up];
      if (compare(object, parent) >= 0) break;
      array[parent.index = i] = parent;
      array[object.index = i = up] = object;
    }
  }

  function down(i) {
    var object = array[i];
    while (true) {
      var right = (i + 1) << 1,
          left = right - 1,
          down = i,
          child = array[down];
      if (left < array.length && compare(array[left], child) < 0) child = array[down = left];
      if (right < array.length && compare(array[right], child) < 0) child = array[down = right];
      if (down === i) break;
      array[child.index = i] = child;
      array[object.index = i = down] = object;
    }
  }

  return heap;
};

function compare(a, b) {
  return a[1].area - b[1].area;
}

},{}],25:[function(require,module,exports){
var type = require("./type");

module.exports = function(objects, options) {
  var verbose = false;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]);

  var stitch = type({
    polygon: function(polygon) {
      for (var j = 0, m = polygon.length; j < m; ++j) {
        var line = polygon[j],
            i = -1,
            n = line.length,
            a = false,
            b = false,
            c = false,
            i0 = -1;
        for (i = 0; i < n; ++i) {
          var point = line[i],
              antimeridian = Math.abs(Math.abs(point[0]) - 180) < 1e-2,
              polar = Math.abs(Math.abs(point[1]) - 90) < 1e-2;
          if (antimeridian || polar) {
            if (!(a || b || c)) i0 = i;
            if (antimeridian) {
              if (a) c = true;
              else a = true;
            }
            if (polar) b = true;
          }
          if (!antimeridian && !polar || i === n - 1) {
            if (a && b && c) {
              if (verbose) console.warn("stitch: removed polar cut [" + line[i0] + "] … [" + line[i] + "]");
              line.splice(i0, i - i0);
              n -= i - i0;
              i = i0;
            }
            a = b = c = false;
          }
        }
      }
    }
  });

  for (var key in objects) {
    stitch.object(objects[key]);
  }
};

},{"./type":24}],26:[function(require,module,exports){
module.exports = {
  cartesian: require("./cartesian"),
  spherical: require("./spherical")
};

},{"./cartesian":30,"./spherical":31}],27:[function(require,module,exports){
var hasher = require("./hash");

module.exports = function(size) {
  var hashtable = new Array(size = 1 << Math.ceil(Math.log(size) / Math.LN2)),
      hash = hasher(size);
  return {
    size: size,
    peek: function(key) {
      var matches = hashtable[hash(key)];

      if (matches) {
        var i = -1,
            n = matches.length,
            match;
        while (++i < n) {
          match = matches[i];
          if (equal(match.key, key)) {
            return match.values;
          }
        }
      }

      return null;
    },
    get: function(key) {
      var index = hash(key),
          matches = hashtable[index];

      if (matches) {
        var i = -1,
            n = matches.length,
            match;
        while (++i < n) {
          match = matches[i];
          if (equal(match.key, key)) {
            return match.values;
          }
        }
      } else {
        matches = hashtable[index] = [];
      }

      var values = [];
      matches.push({key: key, values: values});
      return values;
    }
  };
};

function equal(keyA, keyB) {
  return keyA[0] === keyB[0]
      && keyA[1] === keyB[1];
}

},{"./hash":32}],29:[function(require,module,exports){
var jsonlint = require('jsonlint-lines');

function hint(str) {

    var errors = [], gj;

    function root(_) {
        if (!_.type) {
            errors.push({
                message: 'The type property is required and was not found',
                line: _.__line__
            });
        } else if (!types[_.type]) {
            errors.push({
                message: 'The type ' + _.type + ' is unknown',
                line: _.__line__
            });
        } else {
            types[_.type](_);
        }
    }

    function everyIs(_, type) {
        return _.every(function(x) { return typeof x === 'number'; });
    }

    function requiredProperty(_, name, type) {
        if (typeof _[name] == 'undefined') {
            return errors.push({
                message: '"' + name + '" property required',
                line: _.__line__
            });
        } else if (type === 'array') {
            if (!Array.isArray(_[name])) {
                return errors.push({
                    message: '"' + name +
                        '" property should be an array, but is an ' +
                        (typeof _[name]) + ' instead',
                    line: _.__line__
                });
            }
        } else if (type && typeof _[name] !== type) {
            return errors.push({
                message: '"' + name +
                    '" property should be ' + (type) +
                    ', but is an ' + (typeof _[name]) + ' instead',
                line: _.__line__
            });
        }
    }

    // http://geojson.org/geojson-spec.html#feature-collection-objects
    function FeatureCollection(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'features', 'array')) {
            _.features.forEach(Feature);
        }
    }

    // http://geojson.org/geojson-spec.html#positions
    function position(_, line) {
        if (!Array.isArray(_)) {
            return errors.push({
                message: 'position should be an array, is a ' + (typeof _) +
                    ' instead',
                line: _.__line__ || line
            });
        } else {
            if (_.length < 2) {
                return errors.push({
                    message: 'position must have 2 or more elements',
                    line: _.__line__ || line
                });
            }
            if (!everyIs(_, 'number')) {
                return errors.push({
                    message: 'each element in a position must be a number',
                    line: _.__line__ || line
                });
            }
        }
    }

    function positionArray(coords, depth, line) {
        if (line === undefined && coords.__line__ !== undefined) {
            line = coords.__line__;
        }
        if (depth === 0) {
            return position(coords, line);
        } else {
            if (!Array.isArray(coords)) {
                return errors.push({
                    message: 'coordinates should be an array, are an ' + (typeof coords) +
                        'instead',
                    line: line
                });
            }
            coords.forEach(function(c) {
                positionArray(c, depth - 1, c.__line__ || line);
            });
        }
    }

    function crs(_) {
        if (!_.crs) return;
        if (typeof _.crs === 'object') {
            var strErr = requiredProperty(_.crs, 'type', 'string'),
                propErr = requiredProperty(_.crs, 'properties', 'object');
            if (!strErr && !propErr) {
                // http://geojson.org/geojson-spec.html#named-crs
                if (_.crs.type == 'name') {
                    requiredProperty(_.crs.properties, 'name', 'string');
                } else if (_.crs.type == 'link') {
                    requiredProperty(_.crs.properties, 'href', 'string');
                }
            }
        }
    }

    function bbox(_) {
        if (!_.bbox) return;
        if (Array.isArray(_.bbox)) {
            if (!everyIs(_.bbox, 'number')) {
                return errors.push({
                    message: 'each element in a bbox property must be a number',
                    line: _.bbox.__line__
                });
            }
        } else {
            errors.push({
                message: 'bbox property must be an array of numbers, but is a ' + (typeof _.bbox),
                line: _.__line__
            });
        }
    }

    // http://geojson.org/geojson-spec.html#point
    function Point(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            position(_.coordinates);
        }
    }

    // http://geojson.org/geojson-spec.html#polygon
    function Polygon(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 2);
        }
    }

    // http://geojson.org/geojson-spec.html#multipolygon
    function MultiPolygon(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 3);
        }
    }

    // http://geojson.org/geojson-spec.html#linestring
    function LineString(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 1);
        }
    }

    // http://geojson.org/geojson-spec.html#multilinestring
    function MultiLineString(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 2);
        }
    }

    // http://geojson.org/geojson-spec.html#multipoint
    function MultiPoint(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 1);
        }
    }

    function GeometryCollection(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'geometries', 'array')) {
            _.geometries.forEach(root);
        }
    }

    function Feature(_) {
        crs(_);
        bbox(_);
        if (_.type !== 'Feature') {
            errors.push({
                message: 'GeoJSON features must have a type=feature property',
                line: _.__line__
            });
        }
        requiredProperty(_, 'properties', 'object');
        requiredProperty(_, 'geometry', 'object');
        root(_.geometry);
    }

    var types = {
        Point: Point,
        Feature: Feature,
        MultiPoint: MultiPoint,
        LineString: LineString,
        MultiLineString: MultiLineString,
        FeatureCollection: FeatureCollection,
        GeometryCollection: GeometryCollection,
        Polygon: Polygon,
        MultiPolygon: MultiPolygon
    };

    try {
        gj = jsonlint.parse(str);
    } catch(e) {
        return e;
    }

    root(gj);

    return errors;
}

module.exports.hint = hint;

},{"jsonlint-lines":33}],34:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],33:[function(require,module,exports){
(function(process){/* parser generated by jison 0.4.6 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var jsonlint = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"JSONString":3,"STRING":4,"JSONNumber":5,"NUMBER":6,"JSONNullLiteral":7,"NULL":8,"JSONBooleanLiteral":9,"TRUE":10,"FALSE":11,"JSONText":12,"JSONValue":13,"EOF":14,"JSONObject":15,"JSONArray":16,"{":17,"}":18,"JSONMemberList":19,"JSONMember":20,":":21,",":22,"[":23,"]":24,"JSONElementList":25,"$accept":0,"$end":1},
terminals_: {2:"error",4:"STRING",6:"NUMBER",8:"NULL",10:"TRUE",11:"FALSE",14:"EOF",17:"{",18:"}",21:":",22:",",23:"[",24:"]"},
productions_: [0,[3,1],[5,1],[7,1],[9,1],[9,1],[12,2],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[15,2],[15,3],[20,3],[19,1],[19,3],[16,2],[16,3],[25,1],[25,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: // replace escaped characters with actual character
          this.$ = yytext.replace(/\\(\\|")/g, "$"+"1")
                     .replace(/\\n/g,'\n')
                     .replace(/\\r/g,'\r')
                     .replace(/\\t/g,'\t')
                     .replace(/\\v/g,'\v')
                     .replace(/\\f/g,'\f')
                     .replace(/\\b/g,'\b');
        
break;
case 2:this.$ = Number(yytext);
break;
case 3:this.$ = null;
break;
case 4:this.$ = true;
break;
case 5:this.$ = false;
break;
case 6:return this.$ = $$[$0-1];
break;
case 13:this.$ = {}; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 14:this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 15:this.$ = [$$[$0-2], $$[$0]];
break;
case 16:this.$ = {}; this.$[$$[$0][0]] = $$[$0][1];
break;
case 17:this.$ = $$[$0-2]; $$[$0-2][$$[$0][0]] = $$[$0][1];
break;
case 18:this.$ = []; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 19:this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 20:this.$ = [$$[$0]];
break;
case 21:this.$ = $$[$0-2]; $$[$0-2].push($$[$0]);
break;
}
},
table: [{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],12:1,13:2,15:7,16:8,17:[1,14],23:[1,15]},{1:[3]},{14:[1,16]},{14:[2,7],18:[2,7],22:[2,7],24:[2,7]},{14:[2,8],18:[2,8],22:[2,8],24:[2,8]},{14:[2,9],18:[2,9],22:[2,9],24:[2,9]},{14:[2,10],18:[2,10],22:[2,10],24:[2,10]},{14:[2,11],18:[2,11],22:[2,11],24:[2,11]},{14:[2,12],18:[2,12],22:[2,12],24:[2,12]},{14:[2,3],18:[2,3],22:[2,3],24:[2,3]},{14:[2,4],18:[2,4],22:[2,4],24:[2,4]},{14:[2,5],18:[2,5],22:[2,5],24:[2,5]},{14:[2,1],18:[2,1],21:[2,1],22:[2,1],24:[2,1]},{14:[2,2],18:[2,2],22:[2,2],24:[2,2]},{3:20,4:[1,12],18:[1,17],19:18,20:19},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:23,15:7,16:8,17:[1,14],23:[1,15],24:[1,21],25:22},{1:[2,6]},{14:[2,13],18:[2,13],22:[2,13],24:[2,13]},{18:[1,24],22:[1,25]},{18:[2,16],22:[2,16]},{21:[1,26]},{14:[2,18],18:[2,18],22:[2,18],24:[2,18]},{22:[1,28],24:[1,27]},{22:[2,20],24:[2,20]},{14:[2,14],18:[2,14],22:[2,14],24:[2,14]},{3:20,4:[1,12],20:29},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:30,15:7,16:8,17:[1,14],23:[1,15]},{14:[2,19],18:[2,19],22:[2,19],24:[2,19]},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:31,15:7,16:8,17:[1,14],23:[1,15]},{18:[2,17],22:[2,17]},{18:[2,15],22:[2,15]},{22:[2,21],24:[2,21]}],
defaultActions: {16:[2,6]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 6
break;
case 2:yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2); return 4
break;
case 3:return 17
break;
case 4:return 18
break;
case 5:return 23
break;
case 6:return 24
break;
case 7:return 22
break;
case 8:return 21
break;
case 9:return 10
break;
case 10:return 11
break;
case 11:return 8
break;
case 12:return 14
break;
case 13:return 'INVALID'
break;
}
},
rules: [/^(?:\s+)/,/^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,/^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:,)/,/^(?::)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:$)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = jsonlint;
exports.Parser = jsonlint.Parser;
exports.parse = function () { return jsonlint.parse.apply(jsonlint, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
})(require("__browserify_process"))
},{"fs":1,"path":35,"__browserify_process":34}],35:[function(require,module,exports){
(function(process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

})(require("__browserify_process"))
},{"__browserify_process":34}],31:[function(require,module,exports){
var π = Math.PI,
    π_4 = π / 4,
    radians = π / 180;

exports.name = "spherical";
exports.formatDistance = formatDistance;
exports.ringArea = ringArea;
exports.absoluteArea = absoluteArea;
exports.triangleArea = triangleArea;
exports.distance = haversinDistance; // XXX why two implementations?

function formatDistance(radians) {
  var km = radians * 6371;
  return (km > 1 ? km.toFixed(3) + "km" : (km * 1000).toPrecision(3) + "m")
      + " (" + (radians * 180 / Math.PI).toPrecision(3) + "°)";
}

function ringArea(ring) {
  if (!ring.length) return 0;
  var area = 0,
      p = ring[0],
      λ = p[0] * radians,
      φ = p[1] * radians / 2 + π_4,
      λ0 = λ,
      cosφ0 = Math.cos(φ),
      sinφ0 = Math.sin(φ);

  for (var i = 1, n = ring.length; i < n; ++i) {
    p = ring[i], λ = p[0] * radians, φ = p[1] * radians / 2 + π_4;

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dλ = λ - λ0,
        cosφ = Math.cos(φ),
        sinφ = Math.sin(φ),
        k = sinφ0 * sinφ,
        u = cosφ0 * cosφ + k * Math.cos(dλ),
        v = k * Math.sin(dλ);
    area += Math.atan2(v, u);

    // Advance the previous point.
    λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
  }

  return 2 * area;
}

function absoluteArea(a) {
  return a < 0 ? a + 4 * π : a;
}

function triangleArea(t) {
  var a = distance(t[0], t[1]),
      b = distance(t[1], t[2]),
      c = distance(t[2], t[0]),
      s = (a + b + c) / 2;
  return 4 * Math.atan(Math.sqrt(Math.max(0, Math.tan(s / 2) * Math.tan((s - a) / 2) * Math.tan((s - b) / 2) * Math.tan((s - c) / 2))));
}

function distance(a, b) {
  var Δλ = (b[0] - a[0]) * radians,
      sinΔλ = Math.sin(Δλ),
      cosΔλ = Math.cos(Δλ),
      sinφ0 = Math.sin(a[1] * radians),
      cosφ0 = Math.cos(a[1] * radians),
      sinφ1 = Math.sin(b[1] * radians),
      cosφ1 = Math.cos(b[1] * radians),
      _;
  return Math.atan2(Math.sqrt((_ = cosφ1 * sinΔλ) * _ + (_ = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * _), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
}

function haversinDistance(x0, y0, x1, y1) {
  x0 *= radians, y0 *= radians, x1 *= radians, y1 *= radians;
  return 2 * Math.asin(Math.sqrt(haversin(y1 - y0) + Math.cos(y0) * Math.cos(y1) * haversin(x1 - x0)));
}

function haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}

},{}],30:[function(require,module,exports){
exports.name = "cartesian";
exports.formatDistance = formatDistance;
exports.ringArea = ringArea;
exports.absoluteArea = Math.abs;
exports.triangleArea = triangleArea;
exports.distance = distance;

function formatDistance(d) {
  return d.toString();
}

function ringArea(ring) {
  var i = 0,
      n = ring.length,
      area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) {
    area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  }
  return area * .5;
}

function triangleArea(triangle) {
  return Math.abs(
    (triangle[0][0] - triangle[2][0]) * (triangle[1][1] - triangle[0][1])
    - (triangle[0][0] - triangle[1][0]) * (triangle[2][1] - triangle[0][1])
  );
}

function distance(x0, y0, x1, y1) {
  var dx = x0 - x1, dy = y0 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

},{}],32:[function(require,module,exports){
// Note: requires that size is a power of two!
module.exports = function(size) {
  var mask = size - 1;
  return function(point) {
    var key = (point[0] + 31 * point[1]) | 0;
    return (key < 0 ? ~key : key) & mask;
  };
};

},{}]},{},[8])
;