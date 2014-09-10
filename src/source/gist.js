var fs = require('fs'),
    tmpl = fs.readFileSync('data/share.html', 'utf8');

module.exports.save = save;
module.exports.saveBlocks = saveBlocks;
module.exports.load = load;
module.exports.loadRaw = loadRaw;

function saveBlocks(content, callback) {
    var endpoint = 'https://api.github.com/gists';

    d3.json(endpoint)
        .on('load', function(data) {
            callback(null, data);
        })
        .on('error', function(err) {
            var message,
                url = /(http:\/\/\S*)/g;

            message = JSON.parse(err.responseText).message
                .replace(url, '<a href="$&">$&</a>');

            callback(message);
        })
        .send('POST', JSON.stringify({
            description: 'via:geojson.io',
            public: false,
            files: {
                'index.html': { content: tmpl },
                'map.geojson': { content: JSON.stringify(content) }
            }
        }));
}

function save(context, callback) {

    var source = context.data.get('source'),
        meta = context.data.get('meta'),
        name = (meta && meta.name) || 'map.geojson',
        map = context.data.get('map');

    var description = (source && source.description) || 'via:geojson.io',
        public = source ? !!source.public : false;

    context.user.details(onuser);

    function onuser(err, user) {
        var endpoint,
            method = 'POST',
            source = context.data.get('source'),
            files = {};

        if (!err && user && user.login && meta &&
            // check that it's not previously a github
            source && source.id &&
            // and it is mine
            meta.login && user.login === meta.login) {
            endpoint = 'https://api.github.com/gists/' + source.id;
            method = 'PATCH';
        } else if (!err && source && source.id) {
            endpoint = 'https://api.github.com/gists/' + source.id + '/forks';
        } else {
            endpoint = 'https://api.github.com/gists';
        }

        files[name] = {
            content: JSON.stringify(map, null, 2)
        };

        context.user.signXHR(d3.json(endpoint))
            .on('load', function(data) {
                data.type = 'gist';
                callback(null, data);
            })
            .on('error', function(err) {
                var message,
                    url = /(http:\/\/\S*)/g;

                try {
                    message = JSON.parse(err.responseText).message
                        .replace(url, '<a href="$&">$&</a>');
                } catch(e) {
                    message = 'Sorry, an error occurred';
                }

                callback(message);
            })
            .send(method, JSON.stringify({
                files: files
            }));
    }
}

function load(id, context, callback) {
    context.user.signXHR(d3.json('https://api.github.com/gists/' + id))
        .on('load', onLoad)
        .on('error', onError)
        .get();

    function onLoad(json) { callback(null, json); }
    function onError(err) { callback(err, null); }
}

function loadRaw(url, context, callback) {
    context.user.signXHR(d3.text(url))
        .on('load', onLoad)
        .on('error', onError)
        .get();

    function onLoad(file) { callback(null, file); }
    function onError(err) { callback(err, null); }
}
