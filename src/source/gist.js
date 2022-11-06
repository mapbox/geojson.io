const fs = require('fs');
const tmpl = fs.readFileSync('data/share.html', 'utf8');

const config = require('../config.js')(location.hostname);
const githubBase = config.GithubAPI
  ? config.GithubAPI + '/api/v3'
  : 'https://api.github.com';

module.exports.save = save;
module.exports.saveBlocks = saveBlocks;
module.exports.load = load;
module.exports.loadRaw = loadRaw;

function saveBlocks(content, callback) {
  d3.json(githubBase + '/gists')
    .on('load', (data) => {
      callback(null, data);
    })
    .on('error', (err) => {
      const url = /(http:\/\/\S*)/g;

      const message = JSON.parse(err.responseText).message.replace(
        url,
        '<a href="$&">$&</a>'
      );

      callback(message);
    })
    .send(
      'POST',
      JSON.stringify({
        description: 'via:geojson.io',
        public: false,
        files: {
          'index.html': { content: tmpl },
          'map.geojson': { content: JSON.stringify(content) }
        }
      })
    );
}

function save(context, callback) {
  const meta = context.data.get('meta');
  const name = (meta && meta.name) || 'map.geojson';
  const map = context.data.get('map');
  context.user.details(onuser);

  function onuser(err, user) {
    let method = 'POST';
    const source = context.data.get('source');
    const files = {};
    let endpoint = githubBase + '/gists';

    if (
      !err &&
      user &&
      user.login &&
      meta &&
      // check that it's not previously a github
      source &&
      source.id &&
      // and it is mine
      meta.login &&
      user.login === meta.login
    ) {
      endpoint += '/' + source.id;
      method = 'PATCH';
    } else if (!err && source && source.id) {
      endpoint += '/' + source.id + '/forks';
    }

    files[name] = {
      content: JSON.stringify(map, null, 2)
    };

    context.user
      .signXHR(d3.json(endpoint))
      .on('load', (data) => {
        data.type = 'gist';
        callback(null, data);
      })
      .on('error', (err) => {
        let message;
        const url = /(http:\/\/\S*)/g;

        try {
          message = JSON.parse(err.responseText).message.replace(
            url,
            '<a href="$&">$&</a>'
          );
        } catch (e) {
          message = 'Sorry, an error occurred';
        }

        callback(message);
      })
      .send(
        method,
        JSON.stringify({
          files: files
        })
      );
  }
}

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
