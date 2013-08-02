;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var pane = d3.select('.pane');

var map = L.mapbox.map('map').setView([20, 0], 2);
var osmTiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});
var mapboxTiles = L.mapbox.tileLayer('tmcw.map-7s15q36b').addTo(map);
var drawnItems = new L.FeatureGroup().addTo(map);
var drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { circle: false }
}).addTo(map);

map.on('draw:edited', updateFromMap)
    .on('draw:deleted', updateFromMap)
    .on('draw:created', drawCreated)
    .on('draw:created', updateFromMap);

drawnItems.on('click', function(e) {
});

var brush = {
    color: '#1f77b4',
    weight: 2,
    opacity: 0.8,
    fillColor: '#1f77b4',
    fillOpacity: 0.2
};

function swatches(type) {
    var color = '';
    var event = d3.dispatch('chosen');
    function s(container) {
        var color = d3.scale.category10();
        var swatches = container.selectAll('.swatch')
            .data(d3.range(5).map(color))
            .enter()
            .append('div')
            .attr('class', 'swatch swatch-' + type)
            .style(type === 'stroke-color' ? 'border-color' : 'background-color', String)
            .on('click', function(d) {
                swatches.classed('active', function() {
                    return this == d3.event.target;
                });
                event.chosen(d);
            });
    }
    return d3.rebind(s, event, 'on');
}

function strokes(color) {
    var stroke = 2;
    var event = d3.dispatch('chosen', 'color');
    function s(container) {

        event.on('color', function(color) {
            swatches.style('background-color', color);
        });

        var swatches = container.selectAll('.swatch-stroke')
            .data(d3.range(1, 10, 2))
            .enter()
            .append('div')
            .attr('class', 'swatch-stroke')
            .style('background-color', color)
            .style('border', function(d) { return (10 - d) + 'px solid #fff'; })
            .on('click', function(d) {
                swatches.classed('active', function() {
                    return this == d3.event.target;
                });
                event.chosen(d);
            });
    }
    return d3.rebind(s, event, 'on', 'color');
}

var brushes = d3.select('#brushes');

var strokeTools = brushes.append('div').attr('class', 'stroketools brush-tools');
strokeTools.append('div').attr('class', 'brush-label').text('line');
strokeTools.append('div')
    .attr('class', 'swatch-bin')
    .call(swatches('stroke-color').on('chosen', function(d) {
        brush.color = d;
        strokeUI.color(d);
    }));
var strokeUI = strokes().on('chosen', function(d) {
    brush.weight = d;
});
strokeTools.append('div').attr('class', 'swatch-bin').call(strokeUI);

var fillTools = brushes.append('div').attr('class', 'filltools brush-tools');
fillTools.append('div').attr('class', 'brush-label').text('fill');
fillTools.append('div').attr('class', 'swatch-bin').call(swatches().on('chosen', function(d) {
    brush.fillColor = d;
}));

var theBrush = brushes.append('div').attr('class', 'brush-tools');

var brushButton = theBrush.append('button')
    .attr('class', 'brush')
    .on('click', function() {
        if (brushButton.classed('active')) {
            return deactivate();
        }
        brushButton.classed('active', true);
        function doBrush(e) {
            e.layer.setStyle(brush);
        }
        drawnItems.on('click', doBrush);
        map.on('click', deactivate);
        function deactivate(l) {
            brushButton.classed('active', false);
            drawnItems.off('click', doBrush);
        }
        d3.event.stopPropagation();
    });
brushButton
    .append('span')
    .attr('class', 'icon-pencil');

strokeTools.select('.swatch').trigger('click');
strokeTools.selectAll('.swatch-stroke').filter(function(d, i) { return i == 1; }).trigger('click');
fillTools.select('.swatch').trigger('click');

var updates = d3.dispatch('update_map', 'update_editor');

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
    if ('setStyle' in e.layer) e.layer.setStyle(brush);
    drawnItems.addLayer(e.layer);
    // geoify(drawnItems);
}

CodeMirror.keyMap.tabSpace = {
    Tab: function(cm) {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces, 'end', '+input');
    },
    fallthrough: ['default']
};

var editor;

var buttons = d3.select('.buttons')
    .selectAll('button')
    .data([{
            icon: 'code',
            behavior: jsonPanel
        }, {
            icon: 'share-alt',
            behavior: sharePanel
        }])
    .enter()
    .append('button')
    .attr('class', function(d) {
        return 'icon-' + d.icon;
    })
    .on('click', function(d) {
        updates.on('update_map.mode', null);
        buttons.classed('active', function(_) { return d.icon == _.icon; });
        pane.call(d.behavior, updates);
        updateFromMap();
    });

d3.select(buttons.node()).trigger('click');

function jsonPanel(container) {
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

    var statusIcon = d3.select('#status'),
        // shush the callback-back
        quiet = false;
    // editor.on('change', validation(changeValidated));

    function changeValidated(err, data) {
        if (quiet) { quiet = false; return; }
        if (err) {
            statusIcon.attr('class', err.class)
                .attr('title', err.title)
                .attr('message', err.message);
        } else {
            statusIcon.attr('class', 'icon-circle');
            loadToMap(data);
        }
    }

    updates.on('update_map.mode', function(data) {
        quiet = true;
        editor.setValue(JSON.stringify(data, null, 2));
    });
}


function sharePanel(container, updates) {
    container.html('');

    updates.on('update_map.mode', function(data) {
        saveAsGist(JSON.stringify(data), function(err, resp) {
            if (err) return alert(err);
            var id = resp.id;
            var wrap = pane.append('div').attr('class', 'pad1 share');

            wrap.append('label').text('Map Embed').attr('class', 'horizontal');
            wrap.append('input').attr('class', 'horizontal')
                .property('value', '<iframe frameborder="0" width="100%" height="300" src="http://bl.ocks.org/d/' + id + '"></iframe>');

            function saveAsFile(data) {
                var content = editor.getValue();
                if (content) {
                    saveAs(new Blob([content], {
                        type: 'text/plain;charset=utf-8'
                    }), 'map.geojson');
                }
            }

            var links = wrap.append('div').attr('class', 'footlinks');

            links.append('a').text('download data')
                .on('click', function() {
                    saveAsFile(data);
                });

            links.append('a').text('link to data')
                .attr('target', '_target')
                .attr('href', 'http://gist.github.com/anonymous/' + id);
        });
    });
}

d3.select(document).on('keydown', keydown);
d3.select(window).on('hashchange', hashChange);

if (window.location.hash) hashChange();

function keydown(e) {
    if (d3.event.keyCode == 83 && d3.event.metaKey) {
        saveAsGist(editor.getValue(), function() {});
        d3.event.preventDefault();
    }
}

function updateFromMap() {
    var features = [];
    drawnItems.eachLayer(function(l) {
        if ('toGeoJSON' in l) features.push(l.toGeoJSON());
    });
    updates.update_map({ type: 'FeatureCollection', features: features });
}

updates.on('update_editor', loadToMap);

function loadToMap(gj) {
    drawnItems.clearLayers();

    var styleProps = ['fill_color', 'stroke_color', 'stroke_opacity', 'fill_opacity', 'stroke_width'];

    L.geoJson(gj).eachLayer(function(l) {
        showProperties(l);
        setStyles(l);
        l.addTo(drawnItems);
    });

    function setStyles(l) {
        var properties = l.toGeoJSON().properties;
        if (properties.fill_color) l.setStyle({ fillColor: properties.fill_color });
        if (properties.stroke_color) l.setStyle({ color: properties.stroke_color });
        if (properties.stroke_opacity !== undefined) l.setStyle({ opacity: properties.stroke_opacity });
        if (properties.fill_opacity !== undefined) l.setStyle({ fillOpacity: properties.fill_opacity });
        if (properties.stroke_width !== undefined) l.setStyle({ weight: properties.stroke_width });
    }

    function showProperties(l) {
        var properties = l.toGeoJSON().properties, table = '';
        for (var key in properties) {
            if (styleProps.indexOf(key) == -1) {
            table += '<tr><th>' + key + '</th>' +
                '<td>' + properties[key] + '</td></tr>';
            }
        }
        if (table) l.bindPopup('<table class="marker-properties">' + table + '</table>');
    }
}

function mapFile(gist) {
    for (var f in gist.files) if (f == 'map.geojson') return gist.files[f].content;
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

},{}]},{},[1])
;
