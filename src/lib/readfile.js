var topojson = require('topojson'),
    toGeoJSON = require('togeojson'),
    csv2geojson = require('csv2geojson'),
    osmtogeojson = require('osmtogeojson');

module.exports.readDrop = readDrop;
module.exports.readAsText = readAsText;
module.exports.readFile = readFile;

function readDrop(callback) {
    return function() {
        var results = [];
        var errors = [];
        var warnings = [];
        if (d3.event.dataTransfer && d3.event.dataTransfer &&
           d3.event.dataTransfer.files && d3.event.dataTransfer.files.length) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            var remaining = d3.event.dataTransfer.files.length;
            [].forEach.call(d3.event.dataTransfer.files, function(f) {
                readAsText(f, function(err, text) {
                    if (err) {
                        errors.push(err);
                        if (!--remaining) finish(errors, results);
                    } else {
                        readFile(f, text, function(err, res, war) {
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
            if (!results.length && errors.length) return callback(errors[0], null, war);
            // otherwise combine results
            return callback(null, {
                type: 'FeatureCollection',
                features: results.reduce(function(memo, r) {
                    if (r.features) memo = memo.concat(r.features);
                    else if (r.type === 'Feature') memo.push(r);
                    return memo;
                }, [])
            }, war);
        }
    };
}

function readAsText(f, callback) {
    try {
        var reader = new FileReader();
        reader.readAsText(f);
        reader.onload = function(e) {
            if (e.target && e.target.result) callback(null, e.target.result);
            else callback({
                message: 'Dropped file could not be loaded'
            });
        };
        reader.onerror = function(e) {
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

    var fileType = detectType(f);

    if (!fileType) {
        var filename = f.name ? f.name.toLowerCase() : '',
            pts = filename.split('.');
        return callback({
            message: 'Could not detect file type'
        });
    } else if (fileType === 'kml') {
        var kmldom = toDom(text);
        if (!kmldom) {
            return callback({
                message: 'Invalid KML file: not valid XML'
            });
        }
        var warning;
        if (kmldom.getElementsByTagName('NetworkLink').length) {
            warning = {
                message: 'The KML file you uploaded included NetworkLinks: some content may not display. ' +
                  'Please export and upload KML without NetworkLinks for optimal performance'
            };
        }
        callback(null, toGeoJSON.kml(kmldom), warning);
    } else if (fileType === 'xml') {
        var xmldom = toDom(text),
            result;
        if (!xmldom) {
            return callback({
                message: 'Invalid XML file: not valid XML'
            });
        }
        result = osmtogeojson.toGeojson(xmldom);
        // only keep object tags as properties
        result.features.forEach(function(feature) {
            feature.properties = feature.properties.tags;
        });
        callback(null, result);
    } else if (fileType === 'gpx') {
        callback(null, toGeoJSON.gpx(toDom(text)));
    } else if (fileType === 'geojson') {
        try {
            gj = JSON.parse(text);
            if (gj && gj.type === 'Topology' && gj.objects) {
                var collection = { type: 'FeatureCollection', features: [] };
                for (var o in gj.objects) {
                    var ft = topojson.feature(gj, gj.objects[o]);
                    if (ft.features) collection.features = collection.features.concat(ft.features);
                    else collection.features = collection.features.concat([ft]);
                }
                return callback(null, collection);
            } else {
                return callback(null, gj);
            }
        } catch(err) {
            alert('Invalid JSON file: ' + err);
            return;
        }
    } else if (fileType === 'dsv') {
        csv2geojson.csv2geojson(text, {
            delimiter: 'auto'
        }, function(err, result) {
            if (err) {
                return callback({
                    type: 'geocode',
                    result: result,
                    raw: text
                });
            } else {
                return callback(null, result);
            }
        });
    }

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    function detectType(f) {
        var filename = f.name ? f.name.toLowerCase() : '';
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
    }
}
