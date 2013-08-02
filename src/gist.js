function saveAsGist(content, callback) {
    d3.text('data/share.html').on('load', function(sharehtml) {
        var h = new window.XMLHttpRequest();
        h.onload = function() {
            if (this.status < 400 && this.responseText) {
                var d = JSON.parse(h.responseText);
                callback(null, d);
            } else {
                callback('Gist API limit exceeded; saving to GitHub temporarily disabled.');
            }
        };
        h.onerror = function() {};
        h.open('POST', 'https://api.github.com/gists', true);
        h.send(JSON.stringify({
            description: 'Gist from edit-GeoJSON',
            public: true,
            files: {
                'map.geojson': {
                    content: content
                },
                'index.html': {
                    content: sharehtml
                }
            }
        }));
    }).get();
}
