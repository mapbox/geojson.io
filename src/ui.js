var buttons = require('./ui/mode_buttons'),
    file_bar = require('./ui/file_bar'),
    layer_switch = require('./ui/layer_switch');

module.exports = ui;

function ui(context) {
    function render(selection) {
        var container = selection
            .append('div')
            .attr('class', 'container');

        var map = selection
            .append('div')
            .attr('class', 'map');

        context.map = L.mapbox.map(map.node())
            .setView([20, 0], 2)
            .addControl(L.mapbox.geocoderControl('tmcw.map-u4ca5hnt'));

        context.mapLayer = L.featureGroup().addTo(context.map);

        context.drawControl = new L.Control.Draw({
            edit: { featureGroup: context.mapLayer },
            draw: { circle: false }
        }).addTo(context.map);

        map.call(layer_switch(context));

        var right = selection
            .append('div')
            .attr('class', 'right');

        var top = right
            .append('div')
            .attr('class', 'top');

        top
            .append('a')
            .attr('href', './about.html')
            .attr('class', 'info fr')
            .attr('target', '_blank')
            .append('class', 'span')
            .attr('class', 'icon-info');

        top
            .append('button')
            .attr('class', 'collapse-button')
            .attr('title', 'Collapse')
            .append('class', 'span')
            .attr('class', 'icon icon-caret-down');

        top
            .append('div')
            .attr('class', 'buttons')
            .call(buttons(context));

        var pane = right
            .append('div')
            .attr('class', 'pane');

        selection
            .append('div')
            .attr('class', 'file-bar')
            .call(file_bar(context));
    }

    return render;
}
