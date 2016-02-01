var gist = require('../source/gist'),
    modal = require('./modal');

module.exports = share;

function share(context) {
    return function() {
        gist.saveBlocks(context.data.get('map'), function(err, res) {
            var m = modal(d3.select('div.geojsonio'));
            m.select('.m')
                .attr('class', 'modal-splash modal col6');

            var content = m.select('.content');

            content.append('div')
                .attr('class', 'header pad2 fillD')
                .append('h1')
                .text('Share');

            if (err || !res) {
                content
                    .append('div')
                    .attr('class', 'pad2')
                    .text('Could not share: an error occurred: ' + err);
            } else {
                var container = content.append('div').attr('class', 'pad2');
                var input = container.append('input')
                    .style('width', '100%')
                    .property('value', 'http://bl.ocks.org/d/' + res.id);
                container.append('p')
                    .text('URL to the full-screen map in that embed');
                input.node().select();
            }
        });
    };
}
