function githubFileUrl() {
    var pts = parseGitHubId(source().id);
    return 'https://api.github.com/repos/' + pts.user +
            '/' + pts.repo +
            '/contents/' + pts.file + '?ref=' + pts.branch;
}

function saveAsGitHub(content, callback, message) {
    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
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
                callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
            })
            .send('PUT', JSON.stringify({
                message: commitMessage,
                sha: file.sha,
                branch: file.branch,
                content: Base64.toBase64(content)
            }));
    });
}

function encode(content) {
  // Encode UTF-8 to Base64
  // https://developer.mozilla.org/en-US/docs/Web/API/window.btoa#Unicode_Strings
  return window.btoa(window.encodeURIComponent(content));
}

function decode(content) {
  // Decode Base64 to UTF-8
  // https://developer.mozilla.org/en-US/docs/Web/API/window.btoa#Unicode_Strings
  return window.decodeURIComponent(window.atob(content));
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
    d3.json('https://api.github.com/repos/' + pts.user +
        '/' + pts.repo +
        '/contents/' + pts.file + '?ref=' + pts.branch)
        .on('load', onLoad)
        .on('error', onError).get();

    function onLoad(file) {
        if (file.type !== 'file') return;
        callback(null, file);
    }
    function onError(err) { callback(err, null); }
}
