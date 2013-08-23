var share = require('./share');

module.exports = fileBar;

function fileBar(updates) {

    var event = d3.dispatch('source', 'save', 'share', 'download', 'share');

    function bar(selection) {

        updates.on('sourcechange', onSource);

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

        var actions = [
            {
                title: 'Save',
                icon: 'icon-save',
                action: function() {
                    event.save();
                }
            },
            {
                title: 'Open',
                icon: 'icon-folder-open-alt',
                action: function() {
                    event.source();
                }
            },
            {
                title: 'Download',
                icon: 'icon-download',
                action: function() {
                    event.download();
                }
            },
            {
                title: 'Share',
                icon: 'icon-share-alt',
                action: function() {
                    event.share();
                }
            }
        ];

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

        function sourceUrl(d) {
            switch(d.type) {
                case 'gist':
                    return d.data.html_url;
                case 'github':
                    return 'https://github.com/' + d.data.id;
            }
        }

        function saveNoun(_) {
            buttons.filter(function(b) {
                return b.title === 'Save';
            }).select('span.title').text(_);
        }

        function onSource(d) {
            filename.text(d.name);
            filetype.attr('class', function() {
                if (d.type == 'github') return 'icon-github';
                if (d.type == 'gist') return 'icon-github-alt';
            });

            saveNoun(d.type == 'github' ? 'Commit' : 'Save');

            if (sourceUrl(d)) {
                link
                    .attr('href', sourceUrl(d))
                    .classed('hide', false);
            } else {
                link
                    .classed('hide', true);
            }
        }
    }

    return d3.rebind(bar, event, 'on');
}
