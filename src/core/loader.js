var qs = require('../lib/querystring');
var flash = require('../ui/flash');

module.exports = function(context) {

    function success(err, d) {
        context.container.select('.map').classed('loading', false);

        var message,
            url = /(http:\/\/\S*)/g;

        if (err) {
            message = JSON.parse(err.responseText).message
                .replace(url, '<a href="$&">$&</a>');
            return flash(context.container, message);
        }

        context.data.parse(d);
        zoomExtent();
    }

    function zoomExtent() {
        var bounds = context.mapLayer.getBounds();
        if (bounds.isValid()) context.map.fitBounds(bounds);
    }

    return function(query) {
        if (!query.id) return;

        var oldRoute = d3.event ? qs.stringQs(d3.event.oldURL.split('#')[1]).id :
            context.data.get('route');

        if (query.id !== oldRoute) {
            context.container.select('.map').classed('loading', true);
            context.data.fetch(query, success);
        }
    };
};
