var gist = require('../source/gist.js'),
    Spinner = require('spinner-browserify');

module.exports = function(context) {

    var indication = new Spinner();

    var save = {
        gist: function() {
            context.container.select('.map').classed('saving', true);
            return gist.save(context, gistSuccess);
        },
        github: function() {
            context.container.select('.map').classed('saving', true);
            return github.save(context, gitHubSuccess);
        }
    };

    function gistSuccess(err, d) {
        context.container.select('.map').classed('saving', false);
        if (err) return;
        context.data
            .set({
                type: 'gist',
                github: d,
                dirty: false
            });
    }

    function gitHubSuccess(err, d) {
        context.container.select('.map').classed('saving', false);
        if (err) return;
        context.data
            .set({
                type: 'github',
                github: d,
                dirty: false
            });
    }

    var type = context.data.get('type');
    if (save[type]) save[type]();
    else save.gist();
};
