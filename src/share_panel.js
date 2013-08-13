var gist = require('./gist');
module.exports = sharePanel;

function sharePanel(container, updates) {
    container.html('');

    updates.on('update_map.mode', onUpdate);

    function onUpdate(data) {
        gist.saveAsGist(JSON.stringify(data), function(err, resp) {
            if (err) return alert(err);
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

            function saveAsFile(data) {
                var content = JSON.stringify(data, null, 2);
                if (content) {
                    saveAs(new Blob([content], {
                        type: 'text/plain;charset=utf-8'
                    }), 'map.geojson');
                }
            }

            var links = wrap.append('div').attr('class', 'footlinks');

            var facebook = links.append('a')
                .attr('target', '_blank')
                .attr('href', function() {
                    return 'https://www.facebook.com/sharer/sharer.php?u=' +
                        encodeURIComponent(thisurl);
                }).on('click', function() {
                    analytics.track('Shared via Facebook');
                });

            facebook.append('span').attr('class', 'icon-facebook');
            facebook.append('span').text(' facebook');

            var tweet = links.append('a')
                .attr('target', '_blank')
                .attr('href', function() {
                    return 'https://twitter.com/intent/tweet?source=webclient&text=' +
                        encodeURIComponent('my map: ' + thisurl);
                }).on('click', function() {
                    analytics.track('Shared via Twitter');
                });

            tweet.append('span').attr('class', 'icon-twitter');
            tweet.append('span').text(' tweet');

            var dl = links.append('a').on('click', function() {
                saveAsFile(data);
                analytics.track('Saved as File');
            });

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
        });
    }
}
