var gist = require('./gist');

module.exports = share;

function facebookUrl(_) {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(_);
}

function twitterUrl(_) {
    return 'https://twitter.com/intent/tweet?source=webclient&text=' + encodeURIComponent(_);
}

function emailUrl(_) {
    return 'mailto:?subject=' + encodeURIComponent('My Map on geojson.io') +
        '&body=Here\'s the link: ' + encodeURIComponent(_);
}

function share(container, features) {
    'use strict';
    container.select('.share').remove();

    var selection = container.append('div')
        .attr('class', 'share pad1');

    var networks = [
        {
            icon: 'icon-facebook',
            title: 'Facebook',
            url: facebookUrl(location.href)
        },
        {
            icon: 'icon-twitter',
            title: 'Twitter',
            url: twitterUrl(location.href)
        },
        {
            icon: 'icon-envelope-alt',
            title: 'Email',
            url: emailUrl(location.href)
        }
    ];

    var links = selection
        .selectAll('.network')
        .data(networks)
        .enter()
        .append('a')
        .attr('target', '_blank')
        .attr('class', 'network')
        .attr('href', function(d) { return d.url; });

    links.append('span')
        .attr('class', function(d) { return d.icon + ' pre-icon'; });

    links.append('span')
        .text(function(d) { return d.title; });

    var embed_html = selection
        .append('input')
        .attr('type', 'text')
        .attr('title', 'Embed HTML');

    selection.append('a')
        .attr('class', 'icon-remove')
        .on('click', function() {
            selection.remove();
        });

    gist.saveBlocks(JSON.stringify(features), function(err, res) {
        if (err) return;
        if (res) {
            embed_html.property('value',
                '<iframe frameborder="0" width="100%" height="300" ' + 
                'src="http://bl.ocks.org/d/' + res.id + '"></iframe>');
            embed_html.node().select();
        }
    });
}
