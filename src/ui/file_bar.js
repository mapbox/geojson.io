var share = require('./share'),
    githubBrowser = require('github-file-browser')(d3),
    modal = require('./modal.js'),
    flash = require('./flash'),
    download = require('./download'),
    zoomextent = require('../lib/zoomextent'),
    readFile = require('../lib/readfile'),
    saver = require('../ui/saver.js');

module.exports = function fileBar(context) {

    function bar(selection) {

        var actions = [{
            title: 'Open',
            children: [
                {
                    title: 'File',
                    alt: 'CSV, KML, GPX, and other filetypes',
                    icon: 'icon-cog'
                }, {
                    title: 'GitHub',
                    alt: 'GeoJSON files in GitHub Repositories',
                    icon: 'icon-github',
                    authenticated: true,
                    action: clickGitHub
                }, {
                    title: 'Gist',
                    alt: 'GeoJSON files in GitHub Gists',
                    icon: 'icon-github-alt',
                    authenticated: true,
                    action: clickGist
                }
            ]
        }, {
            title: 'Save',
            action: saveAction
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
                d.action.apply(this, d);
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

        function clickGitHub() {
            var m = modal(d3.select('div.geojsonio'));

            m.select('.m')
                .attr('class', 'modal-splash modal col6');

            m.select('.content')
                .append('div')
                .attr('class', 'repos')
                .call(githubBrowser
                    .gitHubBrowse(context.user.token(), {
                        sort: function(a, b) {
                            return new Date(b.pushed_at) - new Date(a.pushed_at);
                        }
                    }).on('chosen', function(d) {
                        context.data.parse(d);
                        m.close();
                    }));
        }

        function clickImport() {
            $subpane
                .html('')
                .append('div')
                .call(importPanel(context));
        }

        function clickGist() {
            var m = modal(d3.select('div.geojsonio'));

            m.select('.m')
                .attr('class', 'modal-splash modal col6');

            m.select('.content')
                .append('div')
                .append('div')
                .attr('class', 'browser pad1')
                .call(githubBrowser
                    .gistBrowse(context.user.token(), {
                        sort: function(a, b) {
                            return new Date(b.updated_at) - new Date(a.updated_at);
                        }
                    })
                .on('chosen', function(d) {
                    context.data.parse(d);
                    m.close();
                }));
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

    return bar;
};
