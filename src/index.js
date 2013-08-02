var pane = d3.select('.pane');

var map = L.mapbox.map('map').setView([20, 0], 2);
var osmTiles = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

d3.select('.collapse-button')
    .on('click', function() {
        d3.select('.right').classed('hidden',
            !d3.select('.right').classed('hidden'));
        d3.select('#map').classed('fullsize',
            !d3.select('#map').classed('fullsize'));
        map.invalidateSize();
    });

var layerButtons = d3.select('#layer-switch')
    .selectAll('button')
    .on('click', function() {
        var clicked = this;
        layerButtons.classed('active', function() {
            return clicked === this;
        });
        if (this.id == 'mapbox' && map.hasLayer(osmTiles)) {
            map.removeLayer(osmTiles);
            map.addLayer(mapboxTiles);
        }
        if (this.id == 'osm' && map.hasLayer(mapboxTiles)) {
            map.addLayer(osmTiles);
            map.removeLayer(mapboxTiles);
        }
    });

    /*
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
*/

var updates = d3.dispatch('update_map', 'update_editor', 'update_refresh', 'focus_layer');

updates.on('focus_layer', function(layer) {
    if ('getBounds' in layer && layer.getBounds().isValid()) {
        layer.openPopup();
        map.fitBounds(layer.getBounds());
    } else if ('getLatLng' in layer) {
        layer.openPopup();
        map.setView(layer.getLatLng(), 15);
    }
});

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
    analytics.track('Drew Feature');
}

CodeMirror.keyMap.tabSpace = {
    Tab: function(cm) {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces, 'end', '+input');
    },
    fallthrough: ['default']
};

var editor;

var dropSupport = (window.FileReader && 'ondrop' in window);

var buttons = d3.select('.buttons')
    .selectAll('button')
    .data([{
            icon: 'beaker',
            title: ' Import',
            behavior: importPanel
        }, {
            icon: 'table',
            title: ' Table',
            behavior: tablePanel
        }, {
            icon: 'share-alt',
            title: ' Share',
            behavior: sharePanel
        }, {
            icon: 'code',
            behavior: jsonPanel
        }])
    .enter()
    .append('button')
    .attr('class', function(d) {
        return 'icon-' + d.icon;
    })
    .text(function(d) { return d.title; })
    .on('click', function(d) {
        updates.on('update_map.mode', null);
        buttons.classed('active', function(_) { return d.icon == _.icon; });
        pane.call(d.behavior, updates);
        updateFromMap();
    });

d3.select(buttons.node()).trigger('click');

map.on('popupopen', function(e) {
    var sel = d3.select(e.popup._contentNode);

    sel.selectAll('.cancel')
        .on('click', clickClose);

    sel.selectAll('.save')
        .on('click', saveFeature);

    function clickClose() {
        map.closePopup(e.popup);
    }

    function saveFeature() {
        var obj = {};
        sel.selectAll('tr')
            .each(function() {
                obj[d3.select(this).selectAll('input')[0][0].value] =
                    d3.select(this).selectAll('input')[0][1].value;
            });
        e.popup._source.feature.properties = obj;
        map.closePopup(e.popup);
        refresh();
        analytics.track('Save Properties via Popup');
    }
});

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

    var // shush the callback-back
        quiet = false;
    editor.on('change', validate(changeValidated));

    function changeValidated(err, data) {
        if (quiet) { quiet = false; return; }
        if (!err) {
            loadToMap(data);
        }
    }

    updates.on('update_map.mode', function(data) {
        quiet = true;
        editor.setValue(JSON.stringify(data, null, 2));
    });
}

function importPanel(container) {
    container.html('');
    var wrap = container.append('div').attr('class', 'pad1');

    wrap.append('p')
        .attr('class', 'intro')
        .text('Make a map! To start, draw with the tools on the left or import your own data.');

    function over() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        import_landing.classed('dragover', true);
    }

    function exit() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        import_landing.classed('dragover', false);
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
            if (f.type === "application/vnd.google-earth.kml+xml" ||
                f.name.indexOf('.kml') !== -1) {
                gj = toGeoJSON.kml(toDom(e.target.result));
                trackImport('KML', method);
            } else if (f.name.indexOf('.gpx') !== -1) {
                gj = toGeoJSON.gpx(toDom(e.target.result));
                trackImport('GPX', method);
            } else if (f.name.indexOf('.geojson') !== -1 || f.name.indexOf('.json') !== -1) {
                gj = JSON.parse(e.target.result);
                trackImport('GeoJSON', method);
            } else if (f.name.indexOf('.csv') !== -1) {
                gj = csv2geojson.csv2geojson(e.target.result);
                trackImport('CSV', method);
            }
            if (gj) updates.update_editor(gj);
        };

        reader.readAsText(f);
    }

    var import_landing = wrap.append('div')
        .attr('class', 'import')
        .attr('dropzone', 'copy')
        .on('drop.localgpx', function() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            import_landing.classed('dragover', false);

            var f = d3.event.dataTransfer.files[0];
            readFile(f, 'drag');
        })
        .on('dragenter.localgpx', over)
        .on('dragexit.localgpx', exit)
        .on('dragover.localgpx', over);

    var message = import_landing.append('div').attr('class', 'message');
    message.append('span').attr('class', 'icon-arrow-down');
    message.append('span').text(' Drop a GeoJSON, KML, CSV, or GPX file');
    message.append('p').text('or');
    var fileInput = message
        .append('input')
        .attr('type', 'file')
        .style('display', 'none')
        .on('change', function() {
            if (this.files[0]) readFile(this.files[0], 'click');
        });
    message.append('p').append('button').text('Choose a file to upload')
        .on('click', function() {
            fileInput.trigger('click');
        });

    wrap.append('p')
        .attr('class', 'intro')
        .style('text-align', 'center')
        .style('color', '#888')
        .html('Need help or found a bug? Ask in <a href="http://support.mapbox.com/">support.mapbox.com</a>');
}

function sharePanel(container, updates) {
    container.html('');

    updates.on('update_map.mode', function(data) {
        saveAsGist(JSON.stringify(data), function(err, resp) {
            if (err) return alert(err);
            var id = resp.id;
            var wrap = pane.append('div').attr('class', 'pad1 share');
            var thisurl = 'http://geojson.io/#' + id;
            location.hash = '#' + id;

            wrap.append('label').text('Map Embed').attr('class', 'horizontal');
            wrap.append('input').attr('class', 'horizontal')
                .property('value', '<iframe frameborder="0" width="100%" height="300" src="http://bl.ocks.org/d/' + id + '"></iframe>')
                .node().select();

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
                    analytics.track('Shared via Twitter');
                    return 'https://www.facebook.com/sharer/sharer.php?u=' +
                        encodeURIComponent(thisurl);
                });

            facebook.append('span').attr('class', 'icon-facebook');
            facebook.append('span').text(' facebook');

            var tweet = links.append('a')
                .attr('target', '_blank')
                .attr('href', function() {
                    analytics.track('Shared via Twitter');
                    return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                        encodeURIComponent('my map: ' + thisurl);
                });

            tweet.append('span').attr('class', 'icon-twitter');
            tweet.append('span').text(' tweet');

            var dl = links.append('a').on('click', function() {
                saveAsFile(data);
                analytics.track('Saved as File');
            });

            dl.append('span').attr('class', 'icon-download');
            dl.append('span').text(' download');

            var gist = links.append('a')
                .attr('target', '_target')
                .attr('href', 'http://gist.github.com/anonymous/' + id);
            gist.append('span').attr('class', 'icon-link');
            gist.append('span').text(' source');
        });
    });
}

d3.select(document).on('keydown', keydown);
d3.select(window).on('hashchange', hashChange);

if (window.location.hash) hashChange();

function keydown(e) {
    if (d3.event.keyCode == 83 && d3.event.metaKey) {
        saveAsGist(editor.getValue());
        d3.event.preventDefault();
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
    updates.update_map({ type: 'FeatureCollection', features: featuresFromMap() }, drawnItems);
}

function refresh() {
    drawnItems.eachLayer(function(l) {
        showProperties(l);
    });
}

updates.on('update_editor', loadToMap);
updates.on('update_refresh', refresh);

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
    var styleProps = ['fill_color', 'stroke_color', 'stroke_opacity', 'fill_opacity', 'stroke_width'];
    var properties = l.toGeoJSON().properties, table = '';
    if (isEmpty(properties)) properties = { '': '' };
    for (var key in properties) {
        table += '<tr><th><input type="text" value="' + key + '" /></th>' +
            '<td><input type="text" value="' + properties[key] + '" /></td></tr>';
    }
    if (table) l.bindPopup('<table class="marker-properties">' + table + '</table>' +
        '<button class="save">save</button>' +
        '<button class="cancel">cancel</button>');
}

function mapFile(gist) {
    for (var f in gist.files) if (f == 'map.geojson') return JSON.parse(gist.files[f].content);
}

function hashChange() {
    var id = window.location.hash.substring(1);
    d3.json('https://api.github.com/gists/' + id).on('load',
        function(json) {
            var first = !drawnItems.getBounds().isValid();
            updates.update_editor(mapFile(json));
            if (first && drawnItems.getBounds().isValid()) {
                map.fitBounds(drawnItems.getBounds());
                buttons.filter(function(d, i) { return i == 1; }).trigger('click');
            }
        })
        .on('error', function() {
            alert('Gist API limit exceeded, come back in a bit.');
        }).get();
}
