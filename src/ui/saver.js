var flash = require('./flash');

module.exports = function(context) {
    if (d3.event) d3.event.preventDefault();

    function success(err, res) {
        if (err) return flash(context.container, err.toString());

        var message,
          url,
          path,
          commitMessage,
          type = context.data.get('type');

        if (type === 'gist' || res.type === 'gist') {
            // Saved as Gist
            message = 'Changes to this map saved to Gist: ';
            url = res.html_url;
            path = res.id;
        } else if (type === 'github') {
            // Committed to GitHub
            message = 'Changes committed to GitHub: ';
            url = res.commit.html_url;
            path = res.commit.sha.substring(0, 10);
        } else {
            // Saved as a file
            message = 'Changes saved to disk.';
        }

        flash(context.container, message + (url ? '<a href="' + url + '">' + path + '</a>' : ''));

        context.container.select('.map').classed('loading', false);
        context.data.parse(res);
    }

    var meta = context.data.get('meta'),
        map = context.data.get('map'),
        features = map && map.geometry || (map.features && map.features.length),
        type = context.data.get('type');

    if (!features) {
        return flash(context.container, 'Add a feature to the map to save it');
    }

    context.container.select('.map').classed('loading', true);

    if (type === 'github') {
        context.repo.details(onrepo);
    } else {
        context.data.save(success);
    }

    function onrepo(err, repo) {
        if (!err && repo.permissions.push) {
            var msg = prompt('Commit Message');
            if (!msg) {
                context.container.select('.map').classed('loading', false);
                return;
            }
            context.commitMessage = msg;
            context.data.save(success);
        } else {
            context.data.save(success);
        }
    }
};
