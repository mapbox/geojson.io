var fs = require('fs');
var tmpl = fs.readFileSync('data/share.html', 'utf8');

var config = require('../config.js')(location.hostname);
var githubBase = config.GithubAPI ? config.GithubAPI + '/api/v3': 'https://api.github.com';

module.exports.save = save;
module.exports.saveBlocks = saveBlocks;
module.exports.load = load;
module.exports.loadRaw = loadRaw;

function saveBlocks(content, callback) {
    d3.json(githubBase + '/gists')
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
        var method = 'POST',
            source = context.data.get('source'),
            files = {};
        var endpoint = githubBase + '/gists';

        if (!err && user && user.login && meta &&
            // check that it's not previously a github
            source && source.id &&
            // and it is mine
            meta.login && user.login === meta.login) {
            endpoint += '/' + source.id;
            method = 'PATCH';
        } else if (!err && source && source.id) {
            endpoint += '/' + source.id + '/forks';
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
    var endpoint = githubBase + '/gists/';
    context.user.signXHR(d3.json(endpoint + id))
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
