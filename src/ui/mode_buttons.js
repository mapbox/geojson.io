var table = require('../panel/table'),
    json = require('../panel/json'),
    help = require('../panel/help');

module.exports = function(context, pane) {
    return function(selection) {

        var mode = null;

        var buttonData = [{
            icon: 'code',
            title: ' JSON',
            alt: 'JSON Source',
            behavior: json
        }, {
            icon: 'table',
            title: ' Table',
            alt: 'Edit feature properties in a table',
            behavior: table
        }, {
            icon: 'question',
            title: ' Help',
            alt: 'Help',
            behavior: help
        }];

        var buttons = selection
            .selectAll('button')
            .data(buttonData, function(d) { return d.icon; });

        var enter = buttons.enter()
            .append('button')
            .attr('title', function(d) { return d.alt; })
            .on('click', buttonClick);
        enter.append('span')
            .attr('class', function(d) { return 'icon-' + d.icon; });
        enter
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
