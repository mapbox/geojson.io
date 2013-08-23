'use strict';

var source = require('./source');

module.exports.saveAsGitHub = saveAsGitHub;
module.exports.loadGitHub = loadGitHub;
module.exports.loadGitHubRaw = loadGitHubRaw;
module.exports.urlHash = urlHash;

function authorize(xhr) {
    return localStorage.github_token ?
        xhr.header('Authorization', 'token ' + localStorage.github_token) :
        xhr;
}

function githubFileUrl() {
    var pts = parseGitHubId(source().id);
    
    return 'https://api.github.com/repos/' + pts.user +
            '/' + pts.repo +
            '/contents/' + pts.file + '?ref=' + pts.branch;
}

function saveAsGitHub(content, message, callback) {
    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
    }

    if (!localStorage.github_token) {
        return alert('You need to log in with GitHub to commit changes');
    }

    var commitMessage = message || prompt('Commit message:');
    if (!commitMessage) return;

    loadGitHub(source().id, function(err, file) {
        if (err) {
            return alert('Failed to load file before saving');
        }
        authorize(d3.json(githubFileUrl()))
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(err) {
                callback('GitHub API limit exceeded; saving to GitHub temporarily disabled: ' + err);
            })
            .send('PUT', JSON.stringify({
                message: commitMessage,
                sha: file.sha,
                branch: file.branch,
                content: Base64.toBase64(content)
            }));
    });
}

function parseGitHubId(id) {
    var parts = id.split('/');
    return {
        user: parts[0],
        repo: parts[1],
        mode: parts[2],
        branch: parts[3],
        file: parts.slice(4).join('/')
    };
}

function loadGitHub(id, callback) {
    var pts = parseGitHubId(id);
    authorize(d3.json('https://api.github.com/repos/' + pts.user +
        '/' + pts.repo +
        '/contents/' + pts.file + '?ref=' + pts.branch))
        .on('load', onLoad)
        .on('error', onError)
        .get();

    function onLoad(file) {
        callback(null, file);
    }
    function onError(err) { callback(err, null); }
}

function loadGitHubRaw(id, callback) {
    var pts = parseGitHubId(id);
    authorize(d3.text('https://api.github.com/repos/' + pts.user +
        '/' + pts.repo +
        '/contents/' + pts.file + '?ref=' + pts.branch))
        .on('load', onLoad)
        .on('error', onError)
        .header('Accept', 'application/vnd.github.raw').get();

    function onLoad(file) {
        callback(null, file);
    }
    function onError(err) { callback(err, null); }
}

function urlHash(d) {
    var prefix = '';

    if (d.parents && d.parents.length) {
        prefix = d.parents.map(function(p) {
            return p.path;
        }).join('/') + '/';
    }

    return {
        url: 'github:/' + d.parent.full_name + '/' + d.type + '/' + d.parent.default_branch + '/' + prefix + d.path
    };
}
