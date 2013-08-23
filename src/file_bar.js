module.exports = fileBar;

function fileBar(updates) {
    var event = d3.dispatch('source', 'save');

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

        updates.on('sourcechange', onSource);

        function sourceUrl(d) {
            switch(d.type) {
                case 'gist':
                    return d.data.html_url;
                case 'github':
                    return 'https://github.com/' + d.data.id;
            }
        }

        function onSource(d) {
            filename.text(d.name);
            filetype.attr('class', function() {
                if (d.type == 'github') return 'icon-github';
                if (d.type == 'gist') return 'icon-github-alt';
            });
            if (sourceUrl(d)) {
                link
                    .attr('href', sourceUrl(d))
                    .classed('hide', false);
            } else {
                link
                    .classed('hide', true);
            }
        }

        var actions = [
            {
                title: 'Save',
                action: function() {
                    event.save();
                }
            },
            {
                title: 'Open',
                action: function() {
                    event.source();
                }
            }
        ];

        var buttons = selection.append('div')
            .attr('class', 'button-wrap')
            .selectAll('button')
            .data(actions)
            .enter()
            .append('button')
            .text(function(d) {
                return d.title;
            })
            .on('click', function(d) {
                d.action.apply(this, d);
            });
    }

    return d3.rebind(bar, event, 'on');
}
