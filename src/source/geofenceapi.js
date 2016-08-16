var fs = require('fs');
var tmpl = fs.readFileSync('data/share.html', 'utf8');

var geofenceApiBase = 'https://api.geofenceapi.org';

module.exports.save = save;

function save(context, callback) {

    var source = context.data.get('source'),
        meta = context.data.get('meta'),
        name = (meta && meta.name) || 'map.geojson',
        map = context.data.get('map');

    var description = (source && source.description) || 'via:geojson.io',
        public = source ? !!source.public : false;


    var method = 'POST',
        source = context.data.get('source'),
        files = {};
    var endpoint = geofenceApiBase + '/v1/geojsonio';

    files[name] = {
        content: JSON.stringify(map, null, 2)
    };

    d3.json(endpoint)
        .on('load', function(data) {
            data.type = 'geofenceapi';
            callback(null, data);
        })
        .on('error', function(err) {
            message = 'Sorry, an error occurred';
            callback(message);
        })
        .send(method, JSON.stringify({
            files: files
        }));
}
