var clone = require('clone');
    xtend = require('xtend');
    source = {
        gist: require('../source/gist'),
        github: require('../source/github')
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
                return {
                    name: f,
                    content: JSON.parse(content)
                };
            }
        }

        for (f in gist.files) {
            content = gist.files[f].content;
            if (f.indexOf('.json') !== -1 && content) {
                return {
                    name: f,
                    file: JSON.parse(content)
                };
            }
        }
    }

    var data = {};

    data.hasFeatures = function() {
        return !!(_data.map && _data.map.features && _data.map.features.length);
    };

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
        function coerceNum(feature) {
            var props = feature.properties,
                keys = Object.keys(props),
                length = keys.length;

            for (var i = 0; i < length; i++) {
                key = keys[i];
                value = props[key];
                feature.properties[key] = !isNaN(parseFloat(value)) &&
                    /^(?!0.)/.test(value) ? Number(value) : value;
            }

            return feature;
        }

        _data.map.features = (_data.map.features || []).concat(features.map(coerceNum));
        return data.set({ map: _data.map }, src);
    };

    data.get = function(k) {
        return _data[k];
    };

    data.all = function() {
        return clone(_data, false);
    };

    data.fetch = function(q, cb) {
        var type = q.id.split(':')[0];

        switch(type) {
            case 'gist':
                var id = q.id.split(':')[1].split('/')[1];

                source.gist.load(id, context, function(err, d) {
                    return cb(err, d);
                });

                break;
            case 'github':
                var url = q.id.split('/');
                var parts = {
                    user: url[0].split(':')[1],
                    repo: url[1],
                    branch: url[3],
                    path: (url.slice(4) || []).join('/')
                };

                source.github.load(parts, context, function(err, meta) {
                    return source.github.loadRaw(parts, context, function(err, raw) {
                        return cb(err, xtend(meta, { content: JSON.parse(raw) }));
                    });
                });

                break;
        }
    };

    data.parse = function(d, browser) {
        var login,
            repo,
            branch,
            path,
            chunked,
            file;

        if (d.files) d.type = 'gist';

        switch(d.type) {
            case 'blob':
                login = browser.path[1].login;
                repo = browser.path[2].name;
                branch = browser.path[3].name;
                path = [browser.path[4].path, d.path].join('/');

                data.set({
                    type: 'github',
                    source: d,
                    meta: {
                        login: login,
                        repo: repo,
                        branch: branch,
                        name: d.path
                    },
                    map: d.content,
                    path: path,
                    route: 'github:' + [
                        login,
                        repo,
                        'blob',
                        branch,
                        path
                    ].join('/'),
                    url: [
                        'https://github.com',
                        login,
                        repo,
                        'blob',
                        branch,
                        [path, d.path].join('/')
                    ].join('/')
                });
                break;
            case 'file':
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
                        name: d.name
                    },
                    map: d.content,
                    path: d.path,
                    route: 'github:' + [
                        login,
                        repo,
                        'blob',
                        branch,
                        d.path
                    ].join('/'),
                    url: d.html_url
                });
                break;
            case 'gist':
                login = (d.user && d.user.login) || 'anonymous';
                path = [login, d.id].join('/');
                file = mapFile(d);

                data.set({
                    type: 'gist',
                    source: d,
                    meta: {
                        login: login,
                        name: file && file.name
                    },
                    map: file && file.content,
                    path: path,
                    route: 'gist:' + path,
                    url: d.html_url
                });
                break;
        }
    };

    data.save = function(cb) {
        var type = context.data.get('type');
        if (source[type] && source[type].save) source[type].save(context, cb);
        else source.gist.save(context, cb);
    };

    return data;
};
