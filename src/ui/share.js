var gist = require('../source/gist'),
    modal = require('./modal');

module.exports = share;

function facebookUrl(_) {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(_);
}

function twitterUrl(_) {
    return 'https://twitter.com/intent/tweet?source=webclient&text=' + encodeURIComponent(_);
}

function emailUrl(_) {
    return 'mailto:?subject=' + encodeURIComponent('My Map on geojson.io') + '&body=Here\'s the link: ' + encodeURIComponent(_);
}

function share(context) {
    return function(selection) {
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
                var container = content.append('div')
                    .attr('class', 'pad2');
                var input = container.append('input')
                    .style('width', '100%')
                    .property('value', '<iframe frameborder="0" width="100%" height="300" ' +
                        'src="http://bl.ocks.org/d/' + res.id + '"></iframe>');
                container.append('p')
                    .text('This is an iframe embed, a snippet of HTML code you can copy and paste onto a webpage to add this map.');
                var url = container.append('input')
                    .style('width', '100%')
                    .property('value', 'http://bl.ocks.org/d/' + res.id);
                container.append('p')
                    .text('URL to the full-screen map in that embed');
                input.node().select();
            }
        });
    };
}
