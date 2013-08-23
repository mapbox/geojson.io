var gist = require('./gist');

module.exports = sharePanel;

function sharePanel(container, updates) {
    'use strict';
    container.html('');

    updates.on('update_map.mode', onUpdate);

    function onUpdate(data) {
        var id = resp.id;
        var wrap = container.append('div').attr('class', 'pad share');
        var thisurl = 'http://geojson.io/#' + id;
        location.hash = '#' + id;

        wrap.append('div').append('label').text('Map Embed');
        wrap.append('textarea')
            .attr('class', 'full-width')
            .attr('type', 'text')
            .property('value', '<script src="https://gist.github.com/' + id + '.js"></script>')
            .node()
            .select();

        var links = wrap.append('div').attr('class', 'footlinks');

        var facebook = links.append('a')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://www.facebook.com/sharer/sharer.php?u=' +
                    encodeURIComponent(thisurl);
            }).on('click', function() {
            });

        facebook.append('span').attr('class', 'icon-facebook');
        facebook.append('span').text(' facebook');

        var tweet = links.append('a')
            .attr('target', '_blank')
            .attr('href', function() {
                return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                    encodeURIComponent('my map: ' + thisurl);
            }).on('click', function() {
            });

        tweet.append('span').attr('class', 'icon-twitter');
        tweet.append('span').text(' tweet');

        dl.append('span').attr('class', 'icon-download');
        dl.append('span').text(' download');

        var gist = links.append('a')
            .attr('target', '_target')
            .attr('href', resp.html_url);
        gist.append('span').attr('class', 'icon-link');
        gist.append('span').text(' source');

        wrap.append('p')
            .attr('class', 'intro-hint pad1')
            .html('<a target="_blank" href="/about.html#what-now">Need help about what to do with the files you download here?</a>');
    }
}
