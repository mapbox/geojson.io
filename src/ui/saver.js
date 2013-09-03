var Spinner = require('spinner-browserify');

module.exports = function(context) {

    var indication = new Spinner();

    function success(err, d) {
        context.container.select('.map').classed('saving', false);
        if (err) return;
        context.data.parse(d);
    }

    context.container.select('.map').classed('saving', true);
    context.data.save(success);
};
