var clone = require('clone');

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

    data.set = function(obj, source) {
        for (var k in obj) {
            _data[k] = (typeof obj[k] === 'object') ? clone(obj[k], false) : obj[k];
        }
        if (obj.dirty !== false) data.dirty = true;
        context.dispatch.change({
            obj: obj,
            source: source
        });
        return data;
    };

    data.mergeFeatures = function(features, source) {
        _data.map.features = (_data.map.features || []).concat(features);
        return data.set({ map: _data.map }, source);
    };

    data.get = function(k) {
        return _data[k];
    };

    data.all = function() {
        return clone(_data, false);
    };

    data.load = function(d, browser) {
        var chunked;

        if (d.files) d.type = 'gist';

        switch(d.type) {
          case 'blob':
              data.set({
                  type: 'github',
                  source: d,
                  meta: {
                      login: browser.path[1].login,
                      repo: browser.path[2].name,
                      branch: browser.path[3].name
                  },
                  map: d.content,
                  path: d.path,
                  url: [
                    'https://github.com',
                    meta.login,
                    meta.repo,
                    'blob',
                    meta.branch,
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

    return data;
};
