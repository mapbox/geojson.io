var buttons = require('./ui/mode_buttons');

module.exports = ui;

function ui(context) {
    function render(selection) {
        var container = selection
            .append('div')
            .attr('class', 'container');

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
            .call(fileBar(updates)
                .on('source', clickSource)
                .on('save', saveChanges)
                .on('download', downloadFile)
                .on('share', shareMap));
    }

    return render;
}
