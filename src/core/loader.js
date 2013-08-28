var gist = require('../source/gist.js'),
    github = require('../source/github.js'),
    Spinner = require('spinner-browserify');

module.exports = function(context) {

    var indication = new Spinner();

    var load = {
        gist: function(q) {
            var id = q.id.split(':')[1];
            context.container.select('.map').classed('loading', true);
            gist.load(id, function(err, d) {
                return gistSuccess(err, d);
            });
        },
        github: function(q) {
            var url = q.id.split('/');
            var parts = {
                user: url[0].split(':')[1],
                repo: url[1],
                branch: url[2],
                path: (url.slice(3) || []).join('/')
            };

            context.container.select('.map').classed('loading', true);

            github.load(parts, function(err, meta) {
                github.loadRaw(parts, function(err, raw) {
                    gitHubSuccess(err, meta, raw);
                });
            });
        }
    };

    function gistSuccess(err, d) {
        context.container.select('.map').classed('loading', false);
        if (err) return;
        context.data
            .set({
                type: 'gist',
                github: d,
                map: mapFile(d),
                dirty: false
            });
    }

    function gitHubSuccess(err, meta, raw) {
        context.container.select('.map').classed('loading', false);
        if (err) return;
        context.data
            .set({
                type: 'github',
                github: meta,
                map: JSON.parse(raw),
                dirty: false
            });
    }

    function dataId(d) {
        if (d.type === 'gist') return 'gist:' + d.github.id;
        if (d.type === 'github') {
            var url = d.github.html_url.split('/'),
                login = url[3],
                repo = url[4],
                branch = url[6];
            return 'github:' + [login, repo, branch, d.github.path].join('/');
        }
    }

    return function(query) {
        if (!query.id) return;
        var type = query.id.split(':')[0];
        if (query.id !== dataId(context.data)) {
            if (load[type]) load[type](query);
        }
    };
};

function mapFile(gist) {
    var f;
    for (f in gist.files) if (f.indexOf('.geojson') !== -1) return JSON.parse(gist.files[f].content);
    for (f in gist.files) if (f.indexOf('.json') !== -1) return JSON.parse(gist.files[f].content);
}
