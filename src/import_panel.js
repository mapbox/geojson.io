var verticalPanel = require('./vertical_panel'),
    topojson = require('topojson'),
    toGeoJSON = require('togeojson'),
    gist = require('./source/gist'),
    progressChart = require('./lib/progress_chart'),
    detectIndentationStyle = require('detect-json-indent'),
    importSupport = !!(window.FileReader);

module.exports.importPanel = importPanel;
module.exports.bindBody = bindBody;

function over() {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    d3.event.dataTransfer.dropEffect = 'copy';
    d3.select('body').classed('dragover', true);
}

function exit() {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    d3.event.dataTransfer.dropEffect = 'copy';
    d3.select('body').classed('dragover', false);
}

function toDom(x) {
    return (new DOMParser()).parseFromString(x, 'text/xml');
}

function trackImport(format, method) {
    analytics.track('Imported Data / ' + method + ' / ' + format);
}

function readFile(f, method, updates) {
    var reader = new FileReader();

    reader.onload = function(e) {
        var gj;

        switch (detectType(f)) {

            case 'kml':
                var kmldom = toDom(e.target.result);
                if (!kmldom) {
                    return alert('Invalid KML file: not valid XML');
                }
                if (kmldom.getElementsByTagName('NetworkLink').length) {
                    alert('The KML file you uploaded included NetworkLinks: some content may not display. ' +
                          'Please export and upload KML without NetworkLinks for optimal performance');
                }
                gj = toGeoJSON.kml(kmldom);
                break;

            case 'gpx':
                gj = toGeoJSON.gpx(toDom(e.target.result));
                break;

            case 'geojson':
                try {
                    gj = JSON.parse(e.target.result);
                    exportIndentationStyle = detectIndentationStyle(e.target.result);
                    if (gj && gj.type === 'Topology' && gj.objects) {
                        var collection = { type: 'FeatureCollection', features: [] };
                        for (var o in gj.objects) collection.features.push(topojson.feature(gj, gj.objects[o]));
                        gj = collection;
                    }
                } catch(err) {
                    alert('Invalid JSON file: ' + err);
                    analytics.track('Uploaded invalid JSON', {
                        snippet: e.target.result.substring(0, 20)
                    });
                    return;
                }
                break;

            case 'dsv':
                csv2geojson.csv2geojson(e.target.result, {
                    delimiter: 'auto'
                }, function(err, result) {
                    if (err) {
                        return handleGeocode(container.append('div'), e.target.result, updates);
                    } else {
                        gj = result;
                    }
                });
                break;

            default:
                analytics.track('Invalid file', {
                    type: f.type,
                    snippet: e.target.result.substring(0, 20)
                });
                return alert('Sorry, that file type is not supported');
        }

        if (gj) {
            updates.update_editor(gj);
            updates.zoom_extent();
            updates.update_geojson();
        }
    };

    reader.readAsText(f);
}

function bindBody(updates) {
    if (importSupport) {
        d3.select('body')
            .attr('dropzone', 'copy')
            .on('drop.localgpx', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                d3.select('body').classed('dragover', false);
                var f = d3.event.dataTransfer.files[0];
                readFile(f, 'drag', updates);
            })
            .on('dragenter.localgpx', over)
            .on('dragleave.localgpx', exit)
            .on('dragover.localgpx', over);
    }
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
    if (ext('.geojson') || ext('.json')) return 'geojson';
    if (f.type === 'text/csv' || ext('.csv') || ext('.tsv') || ext('.dsv')) {
        return 'dsv';
    }
}

function importPanel(container, updates) {
    container.html('');

    var wrap = container
        .append('div')
        .attr('class', 'pad1');

    wrap.append('div')
        .attr('class', 'modal-message')
        .text('Drop files to map!');

    if (importSupport) {

        var import_landing = wrap.append('div')
            .attr('class', 'pad fillL');

        var message = import_landing
            .append('div')
            .attr('class', 'center');

        var button = message.append('button')
            .on('click', function() {
                fileInput.node().click();
            });
        button.append('span').attr('class', 'icon-arrow-down');
        button.append('span').text(' Import');
        message.append('p')
            .attr('class', 'deemphasize')
            .append('small')
            .text('GeoJSON, TopoJSON, KML, CSV, GPX supported. You can also drag & drop files.');
        var fileInput = message
            .append('input')
            .attr('type', 'file')
            .style('visibility', 'hidden')
            .style('position', 'absolute')
            .style('height', '0')
            .on('change', function() {
                if (this.files && this.files[0]) readFile(this.files[0], 'click', updates);
            });
    } else {
        wrap.append('p')
            .attr('class', 'blank-banner')
            .text('Sorry, geojson.io supports importing GeoJSON, GPX, KML, and CSV files, but ' +
                  'your browser isn\'t compatible. Please use Google Chrome, Safari 6, IE10, Firefox, or Opera for an optimal experience.');
    }

    wrap.append('p')
        .attr('class', 'intro center deemphasize')
        .html('This is an open source project. <a target="_blank" href="http://tmcw.wufoo.com/forms/z7x4m1/">Submit feedback or get help</a>, and <a target="_blank" href="http://github.com/mapbox/geojson.io"><span class="icon-github"></span> fork on GitHub</a>');

    wrap.append('div')
        .attr('class', 'pad1');
}

function handleGeocode(container, text, updates) {

    var list = csv2geojson.auto(text);

    var button = container.append('div')
        .attr('class', 'bucket-actions')
        .append('button')
        .attr('class', 'major')
        .attr('disabled', true)
        .text('At least one field required to geocode');

    var join = container.append('div')
        .attr('class', 'bucket-deposit')
        .append('div')
        .attr('class', 'bucket-join');

    var buckets = join.selectAll('.bucket')
        .data(['City', 'State', 'ZIP', 'Country'])
        .enter()
        .append('div')
        .attr('class', 'bucket')
        .text(String);

    var example = container.append('div')
        .attr('class', 'example');

    var store = container.append('div')
       .attr('class', 'bucket-store');

    var sources = store.selectAll('bucket-source')
       .data(Object.keys(list[0]))
       .enter()
       .append('div')
       .attr('class', 'bucket-source')
       .text(String);

    function transformRow(fields) {
        return function(obj) {
           return d3.entries(obj)
               .filter(function(e) { return fields.indexOf(e.key) !== -1; })
               .map(function(e) { return e.value; })
               .join(', ');
        };
    }

    function showExample(fields) {
        var i = 0;
        return function() {
            if (++i > list.length) i = 0;
            example.html('');
            example.text(transformRow(fields)(list[i]));
        };
    }

    var ti;
    var broker = bucket();
    buckets.call(broker.deposit());
    sources.call(broker.store().on('chosen', onChosen));

    function onChosen(fields) {
         if (ti) window.clearInterval(ti);
         if (fields.length) {
             button.attr('disabled', null)
                .text('Geocode');
             button.on('click', function() {
                 runGeocode(container, list, transformRow(fields), updates);
             });
             var se = showExample(fields);
             se();
             ti = window.setInterval(se, 2000);
         } else {
             button.attr('disabled', true)
                .text('At least one field required to geocode');
             example.text('');
         }
     }
}

function runGeocode(container, list, transform, updates) {
    container.html('');

    var wrap = container.append('div').attr('class', 'pad1');

    var doneBtn = wrap.append('div')
        .attr('class', 'pad1 center')
        .append('button')
        .attr('class', 'major')
        .text('Close')
        .on('click', function() {
            container.html('');
            if (task) task();
        });

    var chartDiv = wrap.append('div');
    var failedDiv = wrap.append('div');

    var geocode = geocodemany('tmcw.map-u4ca5hnt');

    var chart = progressChart(chartDiv.node(), chartDiv.node().offsetWidth, 50);

    function progress(e) {
        chart(e);
    }

    function printObj(o) {
        return '(' + d3.entries(o)
            .map(function(_) {
                return _.key + ': ' + _.value;
            }).join(',') + ')';
    }

    function done(failed, completed) {

        failedDiv
            .selectAll('.fail')
            .data(failed)
            .enter()
            .append('div')
            .attr('class', 'fail')
            .text(function(d) {
                return 'failed: ' + transform(d.data) + ' / ' + printObj(d.data);
            });

        csv2geojson.csv2geojson(completed, function(err, result) {
            updates.update_editor(result);
        });
    }

    var task = geocode(list, transform, progress, done);
}
