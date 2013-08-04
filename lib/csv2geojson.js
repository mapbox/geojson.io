(function(e){if("function"==typeof bootstrap)bootstrap("csv2geojson",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeCsv2geojson=e}else"undefined"!=typeof window?window.csv2geojson=e():global.csv2geojson=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
function csv(text) {
    var header;

    return csv_parseRows(text, function(row, i) {
        if (i) {
            var o = {}, j = -1, m = header.length;
            while (++j < m) o[header[j]] = row[j];
            return o;
        } else {
            header = row;
            return null;
        }
    });

    function csv_parseRows (text, f) {
        var EOL = {}, // sentinel value for end-of-line
        EOF = {}, // sentinel value for end-of-file
        rows = [], // output rows
        re = /\r\n|[,\r\n]/g, // field separator regex
        n = 0, // the current line number
        t, // the current token
        eol; // is the current token followed by EOL?

        re.lastIndex = 0; // work-around bug in FF 3.6

        /** @private Returns the next token. */
        function token() {
            if (re.lastIndex >= text.length) return EOF; // special case: end of file
            if (eol) { eol = false; return EOL; } // special case: end of line

            // special case: quotes
            var j = re.lastIndex;
            if (text.charCodeAt(j) === 34) {
                var i = j;
                while (i++ < text.length) {
                    if (text.charCodeAt(i) === 34) {
                        if (text.charCodeAt(i + 1) !== 34) break;
                        i++;
                    }
                }
                re.lastIndex = i + 2;
                var c = text.charCodeAt(i + 1);
                if (c === 13) {
                    eol = true;
                    if (text.charCodeAt(i + 2) === 10) re.lastIndex++;
                } else if (c === 10) {
                    eol = true;
                }
                return text.substring(j + 1, i).replace(/""/g, "\"");
            }

            // common case
            var m = re.exec(text);
            if (m) {
                eol = m[0].charCodeAt(0) !== 44;
                return text.substring(j, m.index);
            }
            re.lastIndex = text.length;
            return text.substring(j);
        }

        while ((t = token()) !== EOF) {
            var a = [];
            while ((t !== EOL) && (t !== EOF)) {
                a.push(t);
                t = token();
            }
            if (f && !(a = f(a, n++))) continue;
            rows.push(a);
        }
        return rows;
    }
}

function csv2geojson(x, lonfield, latfield) {

    var features = [],
        featurecollection = {
            type: 'FeatureCollection',
            features: features
        };

    var parsed = (typeof x == 'string') ? csv(x) : x;

    if (!parsed.length) return featurecollection;

    latfield = latfield || '';
    lonfield = lonfield || '';

    for (var f in parsed[0]) {
        if (!latfield && f.match(/^Lat/i)) latfield = f;
        if (!lonfield && f.match(/^Lon/i)) lonfield = f;
    }

    if (!latfield || !lonfield) {
        var fields = [];
        for (var k in parsed[0]) fields.push(k);
        return {
            type: 'Error',
            message: 'Latitude and longitude fields not present',
            data: parsed
        };
    }

    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i][lonfield] !== undefined &&
            parsed[i][lonfield] !== undefined) {
            features.push({
                type: 'Feature',
                properties: parsed[i],
                geometry: {
                    type: 'Point',
                    coordinates: [
                        parseFloat(parsed[i][lonfield]),
                        parseFloat(parsed[i][latfield])]
                }
            });
        }
    }
    return featurecollection;
}

function toline(gj) {
    var features = gj.features;
    var line = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: []
        }
    };
    for (var i = 0; i < features.length; i++) {
        line.geometry.coordinates.push(features[i].geometry.coordinates);
    }
    line.properties = features[0].properties;
    return {
        type: 'FeatureSet',
        features: [line]
    };
}

function topolygon(gj) {
    var features = gj.features;
    var poly = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[]]
        }
    };
    for (var i = 0; i < features.length; i++) {
        poly.geometry.coordinates[0].push(features[i].geometry.coordinates);
    }
    poly.properties = features[0].properties;
    return {
        type: 'FeatureSet',
        features: [poly]
    };
}


module.exports = {
    csv: csv,
    csv2geojson: csv2geojson,
    toline: toline,
    topolygon: topolygon
};

},{}]},{},[1])(1)
});
;