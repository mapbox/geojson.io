function importPanel(container) {
    container.html('');
    var wrap = container.append('div').attr('class', 'pad1');

    wrap.append('p')
        .attr('class', 'intro')
        .text('Make a map! To start, draw with the tools on the left or import your own data.');

    function over() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        import_landing.classed('dragover', true);
    }

    function exit() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        import_landing.classed('dragover', false);
    }

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    function trackImport(format, method) {
        analytics.track('Imported Data / ' + method + ' / ' + format);
    }

    function readFile(f, method) {
        var reader = new FileReader();
        import_landing.classed('dragover', false);

        reader.onload = function(e) {
            var gj;
            if (f.type === "application/vnd.google-earth.kml+xml" ||
                f.name.indexOf('.kml') !== -1) {
                gj = toGeoJSON.kml(toDom(e.target.result));
                trackImport('KML', method);
            } else if (f.name.indexOf('.gpx') !== -1) {
                gj = toGeoJSON.gpx(toDom(e.target.result));
                trackImport('GPX', method);
            } else if (f.name.indexOf('.geojson') !== -1 || f.name.indexOf('.json') !== -1) {
                gj = JSON.parse(e.target.result);
                trackImport('GeoJSON', method);
            } else if (f.name.indexOf('.csv') !== -1) {
                gj = csv2geojson.csv2geojson(e.target.result);
                if (gj.type === 'Error') {
                    return handleGeocode(container.append('div'), e.target.result);
                }
                trackImport('CSV', method);
            }
            if (gj) updates.update_editor(gj);
        };

        reader.readAsText(f);
    }

    var import_landing = wrap.append('div')
        .attr('class', 'import')
        .attr('dropzone', 'copy')
        .on('drop.localgpx', function() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            import_landing.classed('dragover', false);

            var f = d3.event.dataTransfer.files[0];
            readFile(f, 'drag');
        })
        .on('dragenter.localgpx', over)
        .on('dragexit.localgpx', exit)
        .on('dragover.localgpx', over);

    var message = import_landing.append('div').attr('class', 'message');
    message.append('span').attr('class', 'icon-arrow-down');
    message.append('span').text(' Drop a GeoJSON, KML, CSV, or GPX file');
    message.append('p').text('or');
    var fileInput = message
        .append('input')
        .attr('type', 'file')
        .style('display', 'none')
        .on('change', function() {
            if (this.files && this.files[0]) readFile(this.files[0], 'click');
        });
    message.append('p').append('button').text('Choose a file to upload')
        .on('click', function() {
            fileInput.trigger('click');
        });

    wrap.append('p')
        .attr('class', 'intro')
        .style('text-align', 'center')
        .style('color', '#888')
        .html('Need help or found a bug? Ask in <a href="http://support.mapbox.com/">support.mapbox.com</a>');

    wrap.append('div')
        .attr('class', 'geocode-ui');
}

function handleGeocode(container, text) {

    analytics.track('A CSV Required Geocoding');

    var list = csv2geojson.csv(text);

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
                 analytics.track('Ran a Geocode batch');
                 runGeocode(container, list, transformRow(fields));
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

function runGeocode(container, list, transform) {
    container.html('');

    var wrap = container.append('div').attr('class', 'pad1');

    var doneBtn = wrap.append('div')
        .style('text-align', 'center')
        .style('padding', '10px')
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

    function progressChart(elem, w, h) {
        var c = elem.appendChild(document.createElement('canvas'));
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        var gap;
        var fill = {
            success: '#e3e4b8',
            error: '#E0A990'
        };

        return function(e) {
            if (!gap) gap = ((e.done) / e.todo * w) - ((e.done - 1) / e.todo * w);
            ctx.fillStyle = fill[e.status];
            ctx.fillRect((e.done - 1) / e.todo * w, 0, gap, h);
        };
    }

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

        updates.update_editor(csv2geojson.csv2geojson(completed));
    }

    var task = geocode(list, transform, progress, done);
}
