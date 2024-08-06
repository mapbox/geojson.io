const clone = require('clone'),
  xtend = require('xtend'),
  config = require('../config.js')(location.hostname),
  source = {
    gist: require('../source/gist'),
    github: require('../source/github'),
    local: require('../source/local')
  };

function _getData() {
  return {
    map: {
      type: 'FeatureCollection',
      features: []
    },
    dirty: false,
    source: null,
    meta: null,
    type: 'local',
    mapStyleLoaded: false
  };
}

module.exports = function (context) {
  const _data = _getData();

  function mapFile(gist) {
    let f;
    let content;

    for (f in gist.files) {
      content = gist.files[f].content;
      if (f.indexOf('.geojson') !== -1 && content) {
        return f;
      }
    }

    for (f in gist.files) {
      content = gist.files[f].content;
      if (f.indexOf('.json') !== -1 && content) {
        return f;
      }
    }
  }

  const data = {};

  data.hasFeatures = function () {
    return !!(_data.map && _data.map.features && _data.map.features.length);
  };

  data.set = function (obj, src) {
    for (const k in obj) {
      _data[k] = typeof obj[k] === 'object' ? clone(obj[k], false) : obj[k];
    }
    if (obj.dirty !== false) data.dirty = true;
    context.dispatch.change({
      obj: obj,
      source: src
    });
    return data;
  };

  data.clear = function () {
    data.set(_getData());
  };

  data.mergeFeatures = function (features, src) {
    function coerceNum(feature) {
      const props = feature.properties,
        keys = Object.keys(props),
        length = keys.length;

      for (let i = 0; i < length; i++) {
        const key = keys[i];
        const value = props[key];
        feature.properties[key] = losslessNumber(value);
      }

      return feature;
    }

    function losslessNumber(x) {
      const fl = parseFloat(x);
      if (fl.toString() === x) return fl;
      else return x;
    }

    _data.map.features = (_data.map.features || []).concat(
      features.map(coerceNum)
    );
    return data.set({ map: _data.map }, src);
  };

  data.get = function (k) {
    return _data[k];
  };

  data.all = function () {
    return clone(_data, false);
  };

  data.fetch = function (q, cb) {
    const type = q.id.split(':')[0];

    switch (type) {
      case 'gist': {
        const id = q.id.split(':')[1].split('/')[1];

        // From: https://api.github.com/gists/dfa850f66f61ddc58bbf
        // Gists > 1 MB will have truncated set to true. Request
        // the raw URL in those cases.
        source.gist.load(id, context, (err, d) => {
          if (err) return cb(err, d);

          const file = mapFile(d);
          // Test for .json or .geojson found
          if (typeof file === 'undefined') return cb(err, d);

          const f = d.files[file];
          if (f.truncated === true) {
            source.gist.loadRaw(f.raw_url, context, (err, content) => {
              if (err) return cb(err);
              return cb(
                err,
                xtend(d, { file: f.filename, content: JSON.parse(content) })
              );
            });
          } else {
            return cb(
              err,
              xtend(d, { file: f.filename, content: JSON.parse(f.content) })
            );
          }
        });

        break;
      }
      case 'github': {
        const url = q.id.split('/');
        const parts = {
          user: url[0].split(':')[1],
          repo: url[1],
          branch: url[3],
          path: (url.slice(4) || []).join('/')
        };

        source.github.load(parts, context, (err, meta) => {
          if (err) return cb(err);
          return source.github.loadRaw(
            parts,
            meta.sha,
            context,
            (err, file) => {
              try {
                return cb(err, xtend(meta, { content: JSON.parse(file) }));
              } catch (e) {
                // this was not a github file
                history.replaceState(
                  '',
                  document.title,
                  window.location.pathname
                );
                return cb(e);
              }
            }
          );
        });

        break;
      }
    }
  };

  data.parse = function (d) {
    const endpoint = config.GithubAPI || 'https://github.com/';
    let login, repo, branch, path, chunked;

    if (d.files) d.type = 'gist';
    let type = d.length ? d[d.length - 1].type : d.type;
    if (d.commit) type = 'commit';
    switch (type) {
      case 'commit': {
        data.set({
          source: d.content
        });
        break;
      }
      case 'local': {
        data.set({
          type: 'local',
          map: d.content,
          path: d.path
        });
        break;
      }
      case 'blob': {
        login = d[0].login;
        repo = d[1].name;
        branch = d[2].name;
        path = d
          .slice(3)
          .map((p) => {
            return p.path;
          })
          .join('/');

        data.set({
          type: 'github',
          source: d,
          meta: {
            login: login,
            repo: repo,
            branch: branch,
            name: d.path
          },
          path: path,
          route: 'github:' + [login, repo, 'blob', branch, path].join('/'),
          url: [endpoint, login, repo, 'blob', branch, path].join('/')
        });
        if (d.content) data.set({ map: d.content });
        break;
      }
      case 'file': {
        chunked = d.html_url.split('/');
        login = chunked[3];
        repo = chunked[4];
        branch = chunked[6];

        data.set({
          type: 'github',
          source: d,
          meta: {
            login: login,
            repo: repo,
            branch: branch,
            name: d.name,
            sha: d.sha
          },
          map: d.content,
          path: d.path,
          route: 'github:' + [login, repo, 'blob', branch, d.path].join('/'),
          url: d.html_url
        });
        break;
      }
      case 'gist': {
        login = (d.owner && d.owner.login) || 'anonymous';
        path = [login, d.id].join('/');

        const name = mapFile(d);

        try {
          if (d.files[name].content)
            data.set({ map: JSON.parse(d.files[name].content) });
        } catch (e) {
          console.error(e);
        }
        data.set({
          type: 'gist',
          source: d,
          meta: {
            login: login,
            name: name
          },
          path: path,
          route: 'gist:' + path,
          url: d.html_url
        });
        break;
      }
    }
  };

  return data;
};
