var commit = require('./commit');
var flash = require('./flash');

module.exports = function(context) {
    if (d3.event) d3.event.preventDefault();

    var type = context.data.get('type');

    function success(err, res) {
        if (err) return flash(context.container, err.toString());

        var message,
          url,
          path,
          commitMessage;

        switch (type) {
            case 'github':
                message = 'Changes committed to GitHub: ';
                url = res.commit.html_url;
                path = res.commit.sha.substring(0,10);
                break;
            case 'gist':
            case 'local':
                message = 'Changes to this map saved to Gist: ';
                url = res.html_url;
                path = res.id;
                break;
        }

        flash(context.container, message + '<a href="' + url + '">' + path + '</a>');

        context.container.select('.map').classed('loading', false);
        context.data.parse(res);
    }

    var map = context.data.get('map');
    var features = map && map.features && map.features.length;

    if (!features) {
        return flash(container, 'Add a feature to the map to save it');
    }

    context.container.select('.map').classed('loading', true);

    switch(type) {
        case 'github':
            var wrap = commit(context, function() {
                wrap.remove();
                context.data.save(success);
            });
            break;
        case 'local':
        case 'gist':
            context.data.save(success);
            break;

    }
};
