let fs;

try {
  fs = require('fs');
} catch (e) {
  console.warn(e);
}

module.exports.save = save;

function save(context, callback) {
  const path = context.data.get('path'),
    map = context.data.get('map');

  const content = JSON.stringify(map, null, 2);

  fs.writeFile(path, content, () => {
    callback(null, {
      type: 'local',
      path: path,
      content: map
    });
  });
}
