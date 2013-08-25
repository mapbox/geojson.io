var table = require('../panel/table'),
    json = require('../panel/json'),
    login = require('../panel/login');

module.exports = function(context) {
    return function(selection) {
        var buttonData = [{
            icon: 'table',
            title: ' Table',
            alt: 'Edit feature properties in a table',
            behavior: table
        }, {
            icon: 'code',
            alt: 'JSON Source',
            behavior: json
        }, {
            icon: 'github',
            alt: '',
            behavior: login
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
            updates.on('update_map.mode', null);
            buttons.classed('active', function(_) { return d.icon == _.icon; });
            pane.call(d.behavior, updates);
            updateFromMap();
        }
    };
};
