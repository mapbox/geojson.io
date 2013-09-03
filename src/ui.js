var buttons = require('./ui/mode_buttons'),
    file_bar = require('./ui/file_bar'),
    dnd = require('./ui/dnd'),
    userUi = require('./ui/user'),
    layer_switch = require('./ui/layer_switch');

module.exports = ui;

function ui(context) {
    function render(selection) {

        var container = selection
            .append('div')
            .attr('class', 'container');

        var map = container
            .append('div')
            .attr('class', 'map')
            .call(context.map);

        var right = container
            .append('div')
            .attr('class', 'right');

        var top = right
            .append('div')
            .attr('class', 'top');

        container
            .append('a')
            .attr('href', './about.html')
            .attr('class', 'info bottom-right icon-info')
            .attr('target', '_blank');

        map
            .call(layer_switch(context));

        top
            .append('button')
            .attr('class', 'collapse-button')
            .attr('title', 'Collapse')
            .on('click', function collapse() {
                d3.select('body').classed('fullscreen',
                    !d3.select('body').classed('fullscreen'));
                context.map.invalidateSize();
            })
            .append('class', 'span')
            .attr('class', 'icon icon-caret-down');

        var pane = right
            .append('div')
            .attr('class', 'pane');

        top
            .append('div')
            .attr('class', 'user fr pad1')
            .call(userUi(context));

        top
            .append('div')
            .attr('class', 'buttons')
            .call(buttons(context, pane));

        container
            .append('div')
            .attr('class', 'file-bar')
            .call(file_bar(context));

        context.container = container;

        dnd(context);
    }

    return render;
}
