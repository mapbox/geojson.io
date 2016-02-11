try {
    var fs = require('fs');
} catch(e) {
    console.warn(e);
}

module.exports.save = save;

function save(context, callback) {

    var path = context.data.get('path'),
        map = context.data.get('map');

    var content = JSON.stringify(map, null, 2);

    fs.writeFile(path, content, function(err, res) {
        callback(null, {
            type: 'local',
            path: path,
            content: map
        });
    });
}
