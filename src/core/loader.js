module.exports = function(context) {

    function success(err, d) {
        context.container.select('.map').classed('loading', false);
        if (err) return;
        context.data.parse(d);
        zoomExtent();
    }

    function zoomExtent() {
        var bounds = context.mapLayer.getBounds();
        if (bounds.isValid()) context.map.fitBounds(bounds);
    }

    function dataId(d) {
        if (d.type === 'gist') return 'gist:' + d.source.id;
        if (d.type === 'github') {
            return 'github:' + [
                d.meta.login,
                d.meta.repo,
                d.meta.branch,
                d.source.path
            ].join('/');
        }
    }

    return function(query) {
        if (!query.id) return;
        if (query.id !== dataId(context.data.all())) {
            context.container.select('.map').classed('loading', true);
            context.data.fetch(query, success);
        }
    };
};
