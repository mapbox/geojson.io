var clone = require('clone');
var save = {
  gist: require('../source/gist').save,
  github: require('../source/github').save
};

module.exports = function(context) {

    var _data = {
        map: {
            type: 'FeatureCollection',
            features: []
        },
        dirty: false,
        source: null,
        meta: null,
        type: 'local'
    };

    function mapFile(gist) {
        var f;
        var content;

        for (f in gist.files) {
            content = gist.files[f].content;
            if (f.indexOf('.geojson') !== -1 && content) {
                return JSON.parse(content);
            }
        }

        for (f in gist.files) {
            content = gist.files[f].content;
            if (f.indexOf('.json') !== -1 && content) {
                return JSON.parse(content);
            }
        }
    }

    var data = {};

    data.set = function(obj, src) {
        for (var k in obj) {
            _data[k] = (typeof obj[k] === 'object') ? clone(obj[k], false) : obj[k];
        }
        if (obj.dirty !== false) data.dirty = true;
        context.dispatch.change({
            obj: obj,
            source: src
        });
        return data;
    };

    data.mergeFeatures = function(features, src) {
        _data.map.features = (_data.map.features || []).concat(features);
        return data.set({ map: _data.map }, src);
    };

    data.get = function(k) {
        return _data[k];
    };

    data.all = function() {
        return clone(_data, false);
    };

    data.load = function(d, browser) {
        var login,
            repo,
            branch,
            chunked;

        if (d.files) d.type = 'gist';

        switch(d.type) {
          case 'blob':
              login = browser.path[1].login;
              repo = browser.path[2].name;
              branch = browser.path[3].name;

              data.set({
                  type: 'github',
                  source: d,
                  meta: {
                      login: login,
                      repo: repo,
                      branch: branch
                  },
                  map: d.content,
                  path: d.path,
                  url: [
                    'https://github.com',
                    login,
                    repo,
                    'blob',
                    branch,
                    d.path
                  ].join('/')
              });
              break;
          case 'file':
              chunked = d.html_url.split('/');

              data.set({
                  type: 'github',
                  source: d,
                  meta: {
                      login: chunked[3],
                      repo: chunked[4],
                      branch: chunked[6]
                  },
                  map: d.content,
                  path: d.path,
                  url: d.html_url
              });
              break;
          case 'gist':
              data.set({
                  type: 'gist',
                  source: d,
                  meta: {
                      login: d.user.login
                  },
                  map: mapFile(d),
                  path: [d.user.login, d.id].join('/'),
                  url: d.html_url
              });
              break;
        }
    };

    data.save = function(cb) {
        var type = context.data.get('type');
        if (save[type]) save[type](context, cb);
        else save.gist(context, cb);
    };

    return data;
};
