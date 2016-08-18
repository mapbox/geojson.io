var geofenceApiBase = 'https://api.geofenceapi.org';

module.exports.save = save;

function save(context, callback) {

    var source = context.data.get('source'),
        meta = context.data.get('meta'),
        name = (meta && meta.name) || 'map.geojson',
        map = context.data.get('map');

    var method = 'POST',
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
            callback('Sorry, an error occurred');
        })
        .send(method, JSON.stringify({
            files: files
        }));
}
