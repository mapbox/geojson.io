module.exports = verticalPanel;

function verticalPanel(updates) {

    var sources = [
        {
            title: 'Import'
        }
    ];

    function panel(selection) {

        selection
            .classed('hide', false)
            .html('');

        selection
            .append('div')
            .attr('class', 'import-sources')
            .selectAll('div.import-source')
            .data(sources)
            .enter()
            .append('div')
            .attr('class', 'import-source')
            .text(function(d) {
                return d.name;
            });
        console.log(selection);
    }

    return panel;
}
