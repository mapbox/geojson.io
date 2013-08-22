module.exports = fileBar;

function fileBar(updates) {
    var event = d3.dispatch('source');

    function bar(selection) {
        var name = selection.append('div')
            .attr('class', 'name');

        var filetype = name.append('span')
            .attr('class', 'icon-file-alt');

        var filename = name.append('span')
            .attr('class', 'filename')
            .text('unsaved');

        updates.on('sourcechange', onSource);

        function onSource(d) {
            filename.text(d.name);
            filetype.attr('class', function() {
                if (d.type == 'github') return 'icon-github';
                if (d.type == 'gist') return 'icon-github-alt';
            });
        }

        var actions = [
            {
                title: 'Save'
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
