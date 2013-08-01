module.exports = function(container, feature, updates) {
    container.html('');

    var div = container
        .datum(feature);

    function render() {

    div.selectAll('table').data([feature]).enter().append('table');

    var tr = div.select('table').selectAll('tr')
        .data(function(d) {
            return d3.entries(d.feature.properties);
        }, function(d) {
            return JSON.stringify(d);
        });

    var trEnter = tr.enter().append('tr');
    tr.exit().remove();

    var keyInput = trEnter.append('td').append('input')
        .property('value', function(d) {
            return d.key;
        });

    trEnter.append('td').append('div').attr('class', 'separator').text(': ');

    var valueInput = trEnter.append('td').append('input')
        .property('value', function(d) {
            return d.value;
        });

    var addRowButton = div.selectAll('button').data([feature]).enter().append('button')
        .text('add row')
        .attr('class', 'addrow')
        .on('click', function(d) {
            d.feature.properties[''] = '';
            render();
        });
    }
    render();

    function onchange() {
        var props = fieldArrayToProperties(fields);
        layer.feature.properties = props;
    }
};

function clean(o) {
    var x = {};
    for (var k in o) {
        if (k) x[k] = o[k];
    }
    return x;
}

function fieldArrayToProperties(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) obj[arr[i][0].value] = arr[i][1].value;
    return obj;
}
