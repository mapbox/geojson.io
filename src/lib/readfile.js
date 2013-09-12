var topojson = require('topojson'),
    toGeoJSON = require('togeojson'),
    shp = require('shpjs'),
    osm2geojson = require('osm-and-geojson').osm2geojson;

module.exports.readDrop = readDrop;
module.exports.readFile = readFile;

function readDrop(callback) {
    return function() {
        if (d3.event.dataTransfer) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            var f = d3.event.dataTransfer.files[0];
            readFile(f, callback);
        }
    };
}

function readFile(f, callback) {

    var reader = new FileReader();

    var fileType = detectType(f);

    reader.onload = function(e) {
        switch (fileType) {
            case 'kml' : return fromKML(e.target.result, callback);
            case 'xml' : return fromXML(e.target.result, callback);
            case 'gpx' : return callback(null, toGeoJSON.gpx(toDom(e.target.result)));
            case 'geojson' : return fromGeoJSON(e.target.result, callback);
            case 'dsv' : return fromDSV(e.target.result, callback);
            case 'zip' : return fromZIP(e.target.result, callback);
            default : return callback({
                message: 'Could not detect file type'
            });
        }
    };

    if (fileType === 'zip') {
        reader.readAsArrayBuffer(f);
    } else {
        reader.readAsText(f);
    }

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }
    
    function fromKML(raw,callback) {
        var kmldom = toDom(raw);
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
    }
    
    function fromXML(raw, callback) {
        var xmldom = toDom(raw);
        if (!xmldom) {
            return callback({
                message: 'Invalid XML file: not valid XML'
            });
        }
        callback(null, osm2geojson(xmldom));
    }
    
    function fromGeoJSON(raw, callback) {
        try {
            checkTopo(JSON.parse(raw), callback);
        } catch(err) {
            alert('Invalid JSON file: ' + err);
        }
    }
    
    function checkTopo(gj, callback) {
        if (gj && gj.type === 'Topology' && gj.objects) {
            var collection = { type: 'FeatureCollection', features: [] };
            for (var o in gj.objects) collection.features.push(topojson.feature(gj, gj.objects[o]));
            callback(null, collection);
        } else {
            callback(null, gj);
        }
    }
    
    function fromDSV(raw, callback) {
        csv2geojson.csv2geojson(raw, {
            delimiter: 'auto'
        }, function(err, result) {
            if (err) {
                return callback({
                    type: 'geocode',
                    result: result,
                    raw: raw
                });
            } else {
                return callback(null, result);
            }
        });
    }
    
    function zipResult(result, callback) {
        result.name = result.fileName;
        var fileType = detectType(result);
        switch (fileType) {
            case 'kml' : return fromKML(result, callback);
            case 'xml' : return fromXML(result, callback);
            case 'gpx' : return callback(null, toGeoJSON.gpx(toDom(result)));
            case 'dsv' : return fromDSV(result, callback);
            default : return checkTopo(result, callback);
        }
    }
    
    function fromZIP(raw, callback) {
        shp(raw,['kml','gpx','csv','tsv','dsv','xml','osm']).then(function(result) {
            if (Array.isArray(result)) {
                shp.deferred.all(result.map(function(item) {
                    var def = shp.deferred();
                    zipResult(item, function(err,response) {
                        if (err) {
                            def.reject(err);
                        } else {
                            def.resolve(response);
                        }
                    });
                    return def.promise;
                })).then(function(responses){
                    callback(null, responses.filter(function(item) {
                        return item.features && Array.isArray(item.features);
                    }).reduce(function(a, b) {
                        a.features = a.features.concat(b.features);
                        return a;
                    },{ type: 'FeatureCollection', features: [], name: 'combo'}));
                }, callback);
            } else {
                zipResult(result, callback);
            }
        },function(err) {
            callback({
                type: 'shapefile',
                result: err,
                raw: raw
            });
        });
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
        
        if (ext('.zip')) return 'zip';
    }
}
