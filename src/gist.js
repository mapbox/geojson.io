function saveAsGist(content, callback) {
    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
    }

    d3.text('data/share.html').on('load', function(sharehtml) {
        var update = (loggedin() && (source() && source().id));
        var endpoint = update ?
            'https://api.github.com/gists/' + source().id :
            'https://api.github.com/gists';
        authorize(d3.json(endpoint))
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(err) {
                callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
            })
            .send(update ? 'PATCH' : 'POST', JSON.stringify({
                description: 'via:geojson.io',
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

function loadGist(id, callback) {
    d3.json('https://api.github.com/gists/' + id)
        .on('load', onLoad)
        .on('error', onError).get();

    function onLoad(json) { callback(null, json); }
    function onError(err) { callback(err, null); }
}
