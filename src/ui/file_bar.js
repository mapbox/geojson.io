var shpwrite = require('shp-write'),
    clone = require('clone'),
    geojson2dsv = require('geojson2dsv'),
    topojson = require('topojson'),
    saveAs = require('filesaver.js'),
    tokml = require('tokml'),
    githubBrowser = require('github-file-browser'),
    gistBrowser = require('gist-map-browser');

var share = require('./share'),
    modal = require('./modal.js'),
    flash = require('./flash'),
    zoomextent = require('../lib/zoomextent'),
    readFile = require('../lib/readfile'),
    meta = require('../lib/meta.js'),
    saver = require('../ui/saver.js');

/**
 * This module provides the file picking & status bar above the map interface.
 * It dispatches to source implementations that interface with specific
 * sources, like GitHub.
 */
module.exports = function fileBar(context) {

    var shpSupport = typeof ArrayBuffer !== 'undefined';

    var exportFormats = [{
        title: 'GeoJSON',
        action: downloadGeoJSON
    }, {
        title: 'TopoJSON',
        action: downloadTopo
    }, {
        title: 'CSV',
        action: downloadDSV
    }, {
        title: 'KML',
        action: downloadKML
    }];

    if (shpSupport) {
        exportFormats.push({
            title: 'Shapefile',
            action: downloadShp
        });
    }

    function bar(selection) {

        var actions = [{
            title: 'Open',
            children: [
                {
                    title: 'File',
                    alt: 'CSV, KML, GPX, and other filetypes',
                    action: blindImport
                }, {
                    title: 'GitHub',
                    alt: 'GeoJSON files in GitHub Repositories',
                    authenticated: true,
                    action: clickGitHubOpen
                }, {
                    title: 'Gist',
                    alt: 'GeoJSON files in GitHub Gists',
                    authenticated: true,
                    action: clickGist
                }
            ]
        }, {
            title: 'Save',
            action: saveAction,
            children: [
                {
                    title: 'GitHub',
                    alt: 'GeoJSON files in GitHub Repositories',
                    authenticated: true,
                    action: clickGitHubSave
                }, {
                    title: 'Gist',
                    alt: 'GeoJSON files in GitHub Gists',
                    authenticated: true,
                    action: clickGistSave
                }
            ].concat(exportFormats)
        }, {
            title: 'New',
            action: function() {
                window.open('/#new');
            }
        }, {
            title: 'Share',
            action: function() {
                context.container.call(share(context));
            }
        }, {
            title: 'Meta',
            action: function() {},
            children: [
                {
                    title: 'Clear',
                    alt: 'Delete all features from the map',
                    action: function() {
                        if (confirm('Are you sure you want to delete all features from this map?')) {
                            meta.clear(context);
                        }
                    }
                }, {
                    title: 'Random: Points',
                    alt: 'Add random points to your map',
                    action: function() {
                        var response = prompt('Number of points (default: 100)');
                        if (response === null) return;
                        var count = parseInt(response, 10);
                        if (isNaN(count)) count = 100;
                        meta.random(context, count, 'point');
                    }
                }, {
                    title: 'Add bboxes',
                    alt: 'Add bounding box members to all applicable GeoJSON objects',
                    action: function() {
                        meta.bboxify(context);
                    }
                }, {
                    title: 'Flatten Multi Features',
                    alt: 'Flatten MultiPolygons, MultiLines, and GeometryCollections into simple geometries',
                    action: function() {
                        meta.flatten(context);
                    }
                }
            ]
        }];

        var items = selection.append('div')
            .attr('class', 'inline')
            .selectAll('div.item')
            .data(actions)
            .enter()
            .append('div')
            .attr('class', 'item');

        var buttons = items.append('a')
            .attr('class', 'parent')
            .on('click', function(d) {
                if (d.action) d.action.apply(this, d);
            })
            .text(function(d) {
                return ' ' + d.title;
            });

        items.each(function(d) {
            if (!d.children) return;
            d3.select(this)
                .append('div')
                .attr('class', 'children')
                .call(submenu(d.children));
        });

        var name = selection.append('div')
            .attr('class', 'name');

        var filetype = name.append('a')
            .attr('target', '_blank')
            .attr('class', 'icon-file-alt');

        var filename = name.append('span')
            .attr('class', 'filename')
            .text('unsaved');

        function clickGistSave() {
            if (d3.event) d3.event.preventDefault();
            context.data.set({ type: 'gist' });
            saver(context);
        }

        function saveAction() {
            if (d3.event) d3.event.preventDefault();
            saver(context);
        }

        function sourceIcon(type) {
            if (type == 'github') return 'icon-github';
            else if (type == 'gist') return 'icon-github-alt';
            else return 'icon-file-alt';
        }

        function saveNoun(_) {
            buttons.filter(function(b) {
                return b.title === 'Save';
            }).select('span.title').text(_);
        }

        function submenu(children) {
            return function(selection) {
                selection
                    .selectAll('a')
                    .data(children)
                    .enter()
                    .append('a')
                    .text(function(d) {
                        return d.title;
                    })
                    .on('click', function(d) {
                        d.action.apply(this, d);
                    });
            };
        }

        context.dispatch.on('change.filebar', onchange);

        function clickGitHubOpen() {
            var m = modal(d3.select('div.geojsonio'));

            m.select('.m')
                .attr('class', 'modal-splash modal col6');

            m.select('.content')
                .append('div')
                .attr('class', 'header pad2 fillD')
                .append('h1')
                .text('GitHub');

            githubBrowser(context.user.token(), false)
                .open()
                .onclick(function(d) {
                    if (!d || !d.length) return;
                    var last = d[d.length - 1];
                    if (!last.path) {
                        throw new Error('last is invalid: ' + JSON.stringify(last));
                    }
                    if (!last.path.match(/\.(geo)?json/i)) {
                        return alert('only GeoJSON files are supported from GitHub');
                    }
                    if (last.type === 'blob') {
                        context.data.parse(d);
                        m.close();
                    }
                })
                .appendTo(
                    m.select('.content')
                        .append('div')
                        .attr('class', 'repos pad2')
                        .node());
        }

        function clickGitHubSave() {
            var m = modal(d3.select('div.geojsonio'));

            m.select('.m')
                .attr('class', 'modal-splash modal col6');

            m.select('.content')
                .append('div')
                .attr('class', 'header pad2 fillD')
                .append('h1')
                .text('GitHub');

            githubBrowser(context.user.token(), true)
                .open()
                .onclick(function(d) {
                    if (!d || !d.length) return;
                    var last = d[d.length - 1];
                    if (last.type === 'new') {
                        var filename = prompt('New file name');
                        if (!filename) {
                            m.close();
                            return;
                        }
                        var pathparts = d.slice(3);
                        pathparts.pop();
                        pathparts.push({ path: filename });
                        var partial = pathparts.map(function(p) {
                            return p.path;
                        }).join('/');
                        context.data.set({
                            source: {
                                url: 'https://api.github.com/repos/' +
                                    d[0].login + '/' + d[1].name +
                                        '/contents/' + partial +
                                        '?ref=' + d[2].name
                            },
                            type: 'github',
                            meta: {
                                branch: d[2].name
                            }
                        });
                        context.data.set({ newpath: partial + filename });
                        m.close();
                        saver(context);
                    } else {
                        alert('overwriting existing files is not yet supported');
                    }
                })
                .appendTo(
                    m.select('.content')
                        .append('div')
                        .attr('class', 'repos pad2')
                        .node());
        }

        function clickGist() {
            var m = modal(d3.select('div.geojsonio'));

            m.select('.m')
                .attr('class', 'modal-splash modal col6');

            gistBrowser(context.user.token())
                .open()
                .onclick(function(d) {
                    context.data.parse(d);
                    m.close();
                })
                .appendTo(
                    m.select('.content')
                        .append('div')
                        .attr('class', 'repos pad2')
                        .node());
        }

        function onchange(d) {
            var data = d.obj,
                type = data.type,
                path = data.path;
            filename
                .text(path ? path : 'unsaved')
                .classed('deemphasize', context.data.dirty);
            filetype
                .attr('href', data.url)
                .attr('class', sourceIcon(type));
            saveNoun(type == 'github' ? 'Commit' : 'Save');
        }

        function blindImport() {
            var put = d3.select('body')
                .append('input')
                .attr('type', 'file')
                .style('visibility', 'hidden')
                .style('position', 'absolute')
                .style('height', '0')
                .on('change', function() {
                    var files = this.files;
                    if (!(files && files[0])) return;
                    readFile.readAsText(files[0], function(err, text) {
                        readFile.readFile(files[0], text, onImport);
                        if (files[0].path) {
                            context.data.set({
                                path: files[0].path
                            });
                        }
                    });
                    put.remove();
                });
            put.node().click();
        }

        function onImport(err, gj, warning) {
            if (gj && gj.features) {
                context.data.mergeFeatures(gj.features);
                if (warning) {
                    flash(context.container, warning.message);
                } else {
                    flash(context.container, 'Imported ' + gj.features.length + ' features.')
                        .classed('success', 'true');
                }
                zoomextent(context);
            }
        }

        d3.select(document).call(
            d3.keybinding('file_bar')
                .on('⌘+o', function() {
                    blindImport();
                    d3.event.preventDefault();
                })
                .on('⌘+s', saveAction));
    }

    function downloadTopo() {
        var content = JSON.stringify(topojson.topology({
            collection: clone(context.data.get('map'))
        }, {'property-transform': allProperties}));

        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'map.topojson');

    }

    function downloadGeoJSON() {
        if (d3.event) d3.event.preventDefault();
        var content = JSON.stringify(context.data.get('map'));
        var meta = context.data.get('meta');
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), (meta && meta.name) || 'map.geojson');
    }

    function downloadDSV() {
        if (d3.event) d3.event.preventDefault();
        var content = geojson2dsv(context.data.get('map'));
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'points.csv');
    }

    function downloadKML() {
        if (d3.event) d3.event.preventDefault();
        var content = tokml(context.data.get('map'));
        var meta = context.data.get('meta');
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'map.kml');
    }

    function downloadShp() {
        if (d3.event) d3.event.preventDefault();
        d3.select('.map').classed('loading', true);
        try {
            shpwrite.download(context.data.get('map'));
        } finally {
            d3.select('.map').classed('loading', false);
        }
    }

    function allProperties(properties, key, value) {
        properties[key] = value;
        return true;
    }

    return bar;
};
