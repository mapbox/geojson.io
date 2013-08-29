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
        for (f in gist.files) if (f.indexOf('.geojson') !== -1) return JSON.parse(gist.files[f].content);
        for (f in gist.files) if (f.indexOf('.json') !== -1) return JSON.parse(gist.files[f].content);
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
        var github = false;
        var meta = {};
        var url;

        switch(d.type) {
          case 'blob':
              github = true;
              meta.login = browser.path[1].login;
              meta.repo = browser.path[2].name;
              meta.branch = browser.path[3].name;
              break;
          case 'file':
              github = true;
              url = d.html_url.split('/');
              meta.login = url[3];
              meta.repo = url[4];
              meta.branch = url[6];
              break;
          case 'gist':
              d.user.login;
              break;
        }

        data.set({
            type: github ? 'github' :  'gist',
            source: d,
            meta: meta,
            map: github ? d.content : mapFile(d)
        });
    };

    return data;
};
