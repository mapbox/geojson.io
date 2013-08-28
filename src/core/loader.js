var gist = require('../source/gist.js'),
    Spinner = require('spinner-browserify');

module.exports = function(context) {

    var indication = new Spinner();

    var load = {
        gist: function(q) {
            var id = q.id.split(':')[1];
            if ((context.data.get('github') || {}).id === id) return;
            context.container.select('.map').classed('loading', true);
            return gist.load(id, gistSuccess);
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

    return function(query) {
        if (!query.id) return;
        var type = query.id.split(':')[0];
        if (load[type]) load[type](query);
    };
};

function mapFile(gist) {
    var f;
    for (f in gist.files) if (f.indexOf('.geojson') !== -1) return JSON.parse(gist.files[f].content);
    for (f in gist.files) if (f.indexOf('.json') !== -1) return JSON.parse(gist.files[f].content);
}
