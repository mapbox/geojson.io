var source = require('./source');
var fs = require('fs');
var tmpl = fs.readFileSync('data/share.html', 'utf8');

module.exports.saveAsGist = saveAsGist;
module.exports.saveBlocks = saveBlocks;
module.exports.loadGist = loadGist;
module.exports.urlHash = urlHash;

function loggedin() {
    return !!localStorage.github_token;
}

function authorize(xhr) {
    return localStorage.github_token ?
        xhr.header('Authorization', 'token ' + localStorage.github_token) :
        xhr;
}

function saveBlocks(content, callback) {
    var endpoint = 'https://api.github.com/gists';

    d3.json(endpoint)
        .on('load', function(data) {
            callback(null, data);
        })
        .on('error', function(err) {
            callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
        })
        .send('POST', JSON.stringify({
            description: 'via:geojson.io',
            public: true,
            files: {
                'index.html': {
                    content: tmpl
                },
                'map.geojson': {
                    content: content
                }
            }
        }));
}

function saveAsGist(content, callback) {
    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
    }

    var user = localStorage.github_user ?
        JSON.parse(localStorage.github_user) : {};

    var endpoint,
        method = 'POST';

    if (loggedin() && (source() && source().id)) {
        if (user && source().login == user.login) {
            endpoint = 'https://api.github.com/gists/' + source().id;
            method = 'PATCH';
        } else {
            endpoint = 'https://api.github.com/gists/' + source().id + '/forks';
        }
    } else {
        endpoint = 'https://api.github.com/gists';
    }

    authorize(d3.json(endpoint))
        .on('load', function(data) {
            callback(null, data);
        })
        .on('error', function(err) {
            callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
        })
        .send(method, JSON.stringify({
            description: 'via:geojson.io',
            public: true,
            files: {
                'map.geojson': {
                    content: content
                }
            }
        }));
}

function loadGist(id, callback) {
    d3.json('https://api.github.com/gists/' + id)
        .on('load', onLoad)
        .on('error', onError).get();

    function onLoad(json) { callback(null, json); }
    function onError(err) { callback(err, null); }
}

function urlHash(data) {
    var login = (data.user && data.user.login) || 'anonymous';
    if (source() && source().id == data.id) {
        return {
            url: '#gist:' + login + '/' + data.id,
            redirect: true
        };
    } else {
        return {
            url: '#gist:' + login + '/' + data.id
        };
    }
}
