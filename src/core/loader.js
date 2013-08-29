var gist = require('../source/gist.js'),
    github = require('../source/github.js'),
    xtend = require('xtend');
    Spinner = require('spinner-browserify');

module.exports = function(context) {

    var indication = new Spinner();

    var load = {
        gist: function(q) {
            var id = q.id.split(':')[1];
            context.container.select('.map').classed('loading', true);
            gist.load(id, context, function(err, d) {
                return gistSuccess(err, d);
            });
        },
        github: function(q) {
            var url = q.id.split('/');
            var parts = {
                user: url[0].split(':')[1],
                repo: url[1],
                branch: url[3],
                path: (url.slice(4) || []).join('/')
            };

            context.container.select('.map').classed('loading', true);

            github.load(parts, context, function(err, meta) {
                github.loadRaw(parts, context, function(err, raw) {
                    gitHubSuccess(err, meta, raw);
                });
            });
        }
    };

    function gistSuccess(err, d) {
        context.container.select('.map').classed('loading', false);
        if (err) return;
        context.data.load(d);
    }

    function gitHubSuccess(err, meta, raw) {
        context.container.select('.map').classed('loading', false);
        if (err) return;
        context.data.load(xtend(meta, { content: JSON.parse(raw) }));
    }

    function dataId(d) {
        if (d.type === 'gist') return 'gist:' + d.source.id;
        if (d.type === 'github') {
            var url = d.source.html_url.split('/'),
                login = url[3],
                repo = url[4],
                branch = url[6];
            return 'github:' + [login, repo, branch, d.source.path].join('/');
        }
    }

    return function(query) {
        if (!query.id) return;
        var type = query.id.split(':')[0];
        if (query.id !== dataId(context.data.all())) {
            if (load[type]) load[type](query);
        }
    };
};
