var share = require('./share'),
    sourcepanel = require('./source.js'),
    saver = require('../core/saver.js');

module.exports = function fileBar(context) {

    function bar(selection) {

        var name = selection.append('div')
            .attr('class', 'name');

        var filetype = name.append('a')
            .attr('target', '_blank')
            .attr('class', 'icon-file-alt');

        var filename = name.append('span')
            .attr('class', 'filename')
            .text('unsaved');

        var actions = [{
            title: 'Save',
            icon: 'icon-save',
            action: saveAction
        }, {
            title: 'Open',
            icon: 'icon-folder-open-alt',
            action: function() {
                context.container.call(sourcepanel(context));
            }
        }, {
            title: 'New',
            icon: 'icon-plus',
            action: function() {
                window.open('/#new');
            }
        }, {
            title: 'Download',
            icon: 'icon-download',
            action: function() {
                download();
            }
        }, {
            title: 'Share',
            icon: 'icon-share-alt',
            action: function() {
                context.container.call(share(context));
            }
        }];

        function saveAction() {
            if (d3.event) d3.event.preventDefault();
            saver(context);
        }

        function download() {
            if (d3.event) d3.event.preventDefault();
            var content = JSON.stringify(context.data.get('map'));
            saveAs(new Blob([content], {
                type: 'text/plain;charset=utf-8'
            }), 'map.geojson');
        }

        var buttons = selection.append('div')
            .attr('class', 'fr')
            .selectAll('button')
            .data(actions)
            .enter()
            .append('button')
            .on('click', function(d) {
                d.action.apply(this, d);
            })
            .attr('data-original-title', function(d) {
                return d.title;
            })
            .attr('class', function(d) {
                return d.icon + ' icon sq40';
            })
            .call(bootstrap.tooltip().placement('bottom'));

        function saveNoun(_) {
            buttons.filter(function(b) {
                return b.title === 'Save';
            }).select('span.title').text(_);
        }

        context.dispatch.on('change.filebar', onchange);

        function onchange(d) {
            var gh = context.data.get('github'),
                type = context.data.get('type');
            filename
                .text(sourceName(type, gh))
                .classed('deemphasize', context.data.dirty);
            filetype
                .attr('href', type && gh && sourceUrl(type, gh))
                .attr('class', sourceIcon(type));
            saveNoun(type == 'github' ? 'Commit' : 'Save');
        }

        d3.select(document).call(
            d3.keybinding('file_bar')
                .on('⌘+a', download)
                .on('⌘+s', saveAction));
    }

    function sourceIcon(type) {
        if (type == 'github') return 'icon-github';
        else if (type == 'gist') return 'icon-github-alt';
        else return 'icon-file-alt';
    }

    function sourceName(type, gh) {
        if (gh && gh.id) {
            return gh.id;
        } else if (gh && gh.path) {
            return gh.path;
        } else {
            return 'unsaved';
        }
    }

    function sourceUrl(type, gh) {
        if (type === 'gist') {
            return gh.html_url;
        }
    }

    return bar;
};
