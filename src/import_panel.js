var gist = require('./source/gist'),
    progressChart = require('./lib/progress_chart'),
    importSupport = !!(window.FileReader);

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
                if (this.files && this.files[0]) readFile(this.files[0], 'click');
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
