var progressChart = require('../lib/progress_chart');

module.exports = function(context) {
    return function(container, text) {

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
                     runGeocode(container, list, transformRow(fields), context);
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
    };
};

function runGeocode(container, list, transform, context) {
    container.html('');

    var wrap = container
        .append('div')
        .attr('class', 'pad1');

    var doneBtn = wrap.append('div')
        .attr('class', 'pad1 center')
        .append('button')
        .attr('class', 'major')
        .text('Close')
        .on('click', function() {
            container.html('');
            if (task) task();
        });

    var chartDiv = wrap.append('div'),
        failedDiv = wrap.append('div'),
        geocode = geocodemany('tmcw.map-u4ca5hnt');

    var chart = progressChart(chartDiv.node(), chartDiv.node().offsetWidth, 50),
        task = geocode(list, transform, progress, done);

    function progress(e) {
        chart(e);
    }

    function done(failed, completed) {

        failedDiv
            .selectAll('.fail')
            .data(failed)
            .enter()
            .append('div')
            .attr('class', 'fail')
            .text(failedMessage);

        function failedMessage(d) {
            return 'failed: ' + transform(d.data) + ' / ' + printObj(d.data);
        }

        csv2geojson.csv2geojson(completed, function(err, result) {
            if (result.features) {
                context.data.mergeFeatures(result.features);
            }
        });
    }
}

function transformRow(fields) {
    return function(obj) {
       return d3.entries(obj)
           .filter(function(_) { return fields.indexOf(_.key) !== -1; })
           .map(function(_) { return _.value; })
           .join(', ');
    };
}

function printObj(o) {
    return '(' + d3.entries(o)
        .map(function(_) { return _.key + ': ' + _.value; }).join(',') + ')';
}
