const topojson = require('topojson-client'),
  toGeoJSON = require('@tmcw/togeojson'),
  gtfs2geojson = require('./gtfs2geojson').default,
  csv2geojson = require('csv2geojson'),
  osmtogeojson = require('osmtogeojson'),
  polytogeojson = require('polytogeojson'),
  geojsonNormalize = require('@mapbox/geojson-normalize');

module.exports.readDrop = readDrop;
module.exports.readAsText = readAsText;
module.exports.readFile = readFile;

function readDrop(callback) {
  return function () {
    const results = [];
    const errors = [];
    if (
      d3.event.dataTransfer &&
      d3.event.dataTransfer &&
      d3.event.dataTransfer.files &&
      d3.event.dataTransfer.files.length
    ) {
      d3.event.stopPropagation();
      d3.event.preventDefault();
      let remaining = d3.event.dataTransfer.files.length;
      [].forEach.call(d3.event.dataTransfer.files, (f) => {
        readAsText(f, (err, text) => {
          if (err) {
            errors.push(err);
            if (!--remaining) finish(errors, results);
          } else {
            readFile(f, text, (err, res, war) => {
              if (err) errors.push(err);
              if (res) results.push(res);
              if (war) results.push(war);
              if (!--remaining) finish(errors, results, war);
            });
          }
        });
      });
    } else {
      return callback({
        message: 'No files were dropped'
      });
    }

    function finish(errors, results, war) {
      // if no conversions suceeded, return the first error
      if (!results.length && errors.length)
        return callback(errors[0], null, war);
      // otherwise combine results
      return callback(
        null,
        {
          type: 'FeatureCollection',
          features: results.reduce((memo, r) => {
            r = geojsonNormalize(r);
            if (r) {
              memo = memo.concat(r.features);
            }
            return memo;
          }, [])
        },
        war
      );
    }
  };
}

function readAsText(f, callback) {
  try {
    const reader = new FileReader();
    reader.readAsText(f);
    reader.onload = function (e) {
      if (e.target && e.target.result) callback(null, e.target.result);
      else
        callback({
          message: 'Dropped file could not be loaded'
        });
    };
    reader.onerror = function () {
      callback({
        message: 'Dropped file was unreadable'
      });
    };
  } catch (e) {
    callback({
      message: 'Dropped file was unreadable'
    });
  }
}

function readFile(f, text, callback) {
  const fileType = detectType(f, text);

  if (!fileType) {
    return callback({
      message: 'Could not detect file type'
    });
  } else if (fileType === 'kml') {
    const kmldom = toDom(text);
    if (!kmldom) {
      return callback({
        message: 'Invalid KML file: not valid XML'
      });
    }
    let warning;
    if (kmldom.getElementsByTagName('NetworkLink').length) {
      warning = {
        message:
          'The KML file you uploaded included NetworkLinks: some content may not display. ' +
          'Please export and upload KML without NetworkLinks for optimal performance'
      };
    }
    callback(null, toGeoJSON.kml(kmldom), warning);
  } else if (fileType === 'xml') {
    const xmldom = toDom(text);
    if (!xmldom) {
      return callback({
        message: 'Invalid XML file: not valid XML'
      });
    }
    const result = osmtogeojson.toGeojson(xmldom);
    // only keep object tags as properties
    result.features.forEach((feature) => {
      feature.properties = feature.properties.tags;
    });
    callback(null, result);
  } else if (fileType === 'gpx') {
    callback(null, toGeoJSON.gpx(toDom(text)));
  } else if (fileType === 'geojson') {
    try {
      const gj = JSON.parse(text);
      if (gj && gj.type === 'Topology' && gj.objects) {
        const collection = { type: 'FeatureCollection', features: [] };
        for (const o in gj.objects) {
          const ft = topojson.feature(gj, gj.objects[o]);
          if (ft.features)
            collection.features = collection.features.concat(ft.features);
          else collection.features = collection.features.concat([ft]);
        }
        return callback(null, collection);
      } else {
        return callback(null, gj);
      }
    } catch (err) {
      alert('Invalid JSON file: ' + err);
      return;
    }
  } else if (fileType === 'dsv') {
    csv2geojson.csv2geojson(
      text,
      {
        delimiter: 'auto'
      },
      (err, result) => {
        if (err) {
          return callback({
            type: 'geocode',
            result: result,
            raw: text
          });
        } else {
          return callback(null, result);
        }
      }
    );
  } else if (fileType === 'gtfs-shapes') {
    try {
      return callback(null, gtfs2geojson.lines(text));
    } catch (e) {
      return callback({ message: 'Invalid GTFS shapes.txt file' });
    }
  } else if (fileType === 'gtfs-stops') {
    try {
      return callback(null, gtfs2geojson.stops(text));
    } catch (e) {
      return callback({ message: 'Invalid GTFS stops.txt file' });
    }
  } else if (fileType === 'poly') {
    callback(null, polytogeojson(text));
  }

  function toDom(x) {
    return new DOMParser().parseFromString(x, 'text/xml');
  }

  function detectType(f, text) {
    const filename = f.name ? f.name.toLowerCase() : '';
    function ext(_) {
      return filename.indexOf(_) !== -1;
    }
    if (f.type === 'application/vnd.google-earth.kml+xml' || ext('.kml')) {
      return 'kml';
    }
    if (ext('.gpx')) return 'gpx';
    if (ext('.geojson') || ext('.json') || ext('.topojson')) return 'geojson';
    if (f.type === 'text/csv' || ext('.csv') || ext('.tsv') || ext('.dsv')) {
      return 'dsv';
    }
    if (ext('.xml') || ext('.osm')) return 'xml';
    if (ext('.poly')) return 'poly';
    if (
      (text && text.indexOf('shape_id,shape_pt_lat,shape_pt_lon') !== -1) ||
      (text && text.indexOf('"shape_id","shape_pt_lat","shape_pt_lon"') !== -1)
    ) {
      return 'gtfs-shapes';
    }
    if (
      (text &&
        text.indexOf(
          'stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon'
        ) !== -1) ||
      (text &&
        text.indexOf(
          '"stop_id","stop_code","stop_name","stop_desc","stop_lat","stop_lon"'
        ) !== -1)
    ) {
      return 'gtfs-stops';
    }
  }
}
