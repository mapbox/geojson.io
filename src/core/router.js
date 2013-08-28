var qs = require('../lib/querystring');

module.exports = function(context) {
    var router = {};

    router.on = function() {
        d3.select(window).on('hashchange.router', route);
        context.dispatch.on('change', unroute);
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
    }

    function getQuery() {
        return qs.stringQs(window.location.hash.substring(1));
    }

    return router;
};
