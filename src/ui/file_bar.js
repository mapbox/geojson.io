var share = require('./share'),
    saver = require('../core/saver.js');

module.exports = function fileBar(context) {

    function bar(selection) {

        var name = selection.append('div')
            .attr('class', 'name');

        var filetype = name.append('span')
            .attr('class', 'icon-file-alt');

        var filename = name.append('span')
            .attr('class', 'filename')
            .text('unsaved');

        var link = name.append('a')
            .attr('target', '_blank')
            .attr('class', 'icon-external-link')
            .classed('hide', true);

        var actions = [{
            title: 'Save',
            icon: 'icon-save',
            action: function() {
                saver(context);
            }
        }, {
            title: 'Open',
            icon: 'icon-folder-open-alt',
            action: function() {
                open();
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

        function download() {
            if (d3.event) d3.event.preventDefault();
            var content = JSON.stringify(context.data.get('map'));
            saveAs(new Blob([content], {
                type: 'text/plain;charset=utf-8'
            }), 'map.geojson');
        }

        var buttons = selection.append('div')
            .attr('class', 'button-wrap fr')
            .selectAll('button')
            .data(actions)
            .enter()
            .append('button')
            .on('click', function(d) {
                d.action.apply(this, d);
            });

        buttons.append('span')
            .attr('class', function(d) {
                return d.icon + ' icon';
            });

        buttons.append('span')
            .attr('class', 'title')
            .text(function(d) {
                return d.title;
            });

        function saveNoun(_) {
            buttons.filter(function(b) {
                return b.title === 'Save';
            }).select('span.title').text(_);
        }

        context.dispatch.on('change.filebar', onchange);

        function onchange(d) {
            if (d.field === 'github' || d.field === 'meta' || d.field === 'type') {
                var gh = context.data.get('github'),
                    type = context.data.get('type');
                filename.text(gh && gh.id);
                // if (sourceUrl(d)) {
                //     link
                //         .attr('href', sourceUrl(d))
                //         .classed('hide', false);
                // } else {
                //     link
                //         .classed('hide', true);
                // }
                filetype.attr('class', function() {
                    if (type == 'github') return 'icon-github';
                    if (type == 'gist') return 'icon-github-alt';
                });
                saveNoun(type == 'github' ? 'Commit' : 'Save');
            }

        }

        d3.select(document).call(
            d3.keybinding('file_bar')
                .on('⌘+a', download));

    }

    return bar;
};
