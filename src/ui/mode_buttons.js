var table = require('../panel/table'),
    json = require('../panel/json');

module.exports = function(context, pane) {
    return function(selection) {

        var mode = null;

        var buttonData = [{
            icon: 'table',
            title: ' Table',
            alt: 'Edit feature properties in a table',
            behavior: table
        }, {
            icon: 'code',
            title: ' JSON',
            alt: 'JSON Source',
            behavior: json
        }];

        var buttons = selection
            .selectAll('button')
            .data(buttonData, function(d) { return d.icon; });

        buttons.enter()
            .append('button')
            .attr('title', function(d) { return d.alt; })
            .attr('class', function(d) { return 'icon-' + d.icon; })
            .on('click', buttonClick)
            .append('span')
            .text(function(d) { return d.title; });

        d3.select(buttons.node()).trigger('click');

        function buttonClick(d) {
            buttons.classed('active', function(_) { return d.icon == _.icon; });
            if (mode) mode.off();
            mode = d.behavior(context);
            pane.call(mode);
        }
    };
};
