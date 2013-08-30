var qs = require('../lib/querystring'),
    xtend = require('xtend');

module.exports = function(context) {
    var router = {};

    router.on = function() {
        d3.select(window).on('hashchange.router', route);
        context.dispatch.on('change.route', unroute);
        context.dispatch.route(getQuery());
        return router;
    };

    router.off = function() {
        d3.select(window).on('hashchange.router', null);
        return router;
    };

    function route() {
        var oldHash = d3.event.oldURL.split('#')[1];
        var newHash = d3.event.newURL.split('#')[1];

        var oldSource = qs.stringQs(oldHash).id;
        var newSource = qs.stringQs(newHash).id;

        if (newSource !== oldSource) context.dispatch.route(newHash);
    }

    function unroute() {
        var query = getQuery();
        var rev = reverseRoute();
        if (rev.id && query.id !== rev.id) {
            location.hash = '#' + qs.qsString(rev);
        }
    }

    function getQuery() {
        return qs.stringQs(window.location.hash.substring(1));
    }

    function reverseRoute() {
        var query = getQuery();
        var data = context.data.all();

        if (data.type === 'gist') {
            return xtend(query, {
                id: 'gist:' + [
                    data.meta.login,
                    data.source.id
                ].join('/')
            });
        } else if (data.type === 'github') {
            var id = 'github:' + [
              data.meta.login,
              data.meta.repo,
              'blob',
              data.meta.branch,
              data.source.path
            ].join('/');

            return xtend(query, {
                id: id
            });
        }

        return false;
    }

    return router;
};
