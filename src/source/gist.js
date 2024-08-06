const config = require('../config.js')(location.hostname);
const githubBase = config.GithubAPI
  ? config.GithubAPI + '/api/v3'
  : 'https://api.github.com';

module.exports.load = load;
module.exports.loadRaw = loadRaw;

function load(id, context, callback) {
  const endpoint = githubBase + '/gists/';
  context.user
    .signXHR(d3.json(endpoint + id))
    .on('load', onLoad)
    .on('error', onError)
    .get();

  function onLoad(json) {
    callback(null, json);
  }
  function onError(err) {
    callback(err, null);
  }
}

function loadRaw(url, context, callback) {
  context.user
    .signXHR(d3.text(url))
    .on('load', onLoad)
    .on('error', onError)
    .get();

  function onLoad(file) {
    callback(null, file);
  }
  function onError(err) {
    callback(err, null);
  }
}
