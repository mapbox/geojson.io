var qs = require('../lib/querystring'),
    xtend = require('xtend');

module.exports = function(context) {
    var router = {};

    router.on = function() {
        d3.select(window).on('hashchange.router', route);
        context.dispatch.on('change.route', unroute);
        route();
        return router;
    };

    router.off = function() {
        d3.select(window).on('hashchange.router', null);
        return router;
    };

    function route() {
        context.dispatch.route(getQuery());
    }

    function unroute() {
        var query = getQuery();
        var rev = reverseRoute();
        if (rev && query !== rev) {
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
                id: 'gist:' + data.github.id
            });
        }

        return false;
    }

    return router;
};
