// PROPERTIES
// ----------------------------------------------------------------------------
function propertyTable(container, layer) {

    var properties = layer.toGeoJSON().properties;
    var div = container.html('').append('div')
        .attr('class', 'property-table');

    var table = div.append('table');

    function removeRow() {
        var inputs = this.parentNode.parentNode.getElementsByTagName('input');
        for (var i = 0; i < inputs.length; i++) { inputs[i].value = ''; }
        this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
        onchange();
    }

    var fields = [];

    for (var key in properties) {
        var tr = table.append('tr');

        var removeButton = tr.append('td').append('button')
            .attr('class', 'remove')
            .on('click', removeRow)
            .text('x');

        var keyInput = tr.append('td').append('input')
            .property('value', key);

        tr.append('td').append('div').attr('class', 'separator').text(': ');

        var valueInput = tr.append('td').append('input')
            .property('value', properties[key]);

        keyInput.onblur =
            keyInput.onchange =
            valueInput.onchange =
            valueInput.onblur = onchange;

        fields.push([keyInput, valueInput]);
    }

    var addRowButton = div.append('button')
        .text('add row')
        .attr('class', 'addrow');

    function onchange() {
        var props = fieldArrayToProperties(fields);
        layer.feature.properties = props;
    }

    addRowButton.on('click', function() {
        var props = fieldArrayToProperties(fields);
        props[''] = '';
        layer.feature.properties = props;
        container.call(propertyTable, layer);
    });
}

function clean(o) {
    var x = {};
    for (var k in o) {
        if (k) x[k] = o[k];
    }
    return x;
}

function addMiniMap(layer) {
    if (!('toGeoJSON' in layer)) return;
    var fDiv = propertiesPane.append('div').attr('class', 'pad1'),
        mDiv = fDiv.append('div').attr('class', 'mini-map');

    var map = L.mapbox.map(mDiv.node(), 'tmcw.map-7s15q36b', {
        scrollWheelZoom: false
    });
    var gj = layer.toGeoJSON();
    var gjL = L.geoJson(gj).addTo(map);
    map.fitBounds(gjL.getBounds());
    var tableContainer = fDiv.append('div').call(propertyTable, layer);
}

function updatePropertiesPane() {
    propertiesLink.classed('active', true);
    propertiesPane.classed('active', true).html('');
    drawnItems.eachLayer(function(l) {
        addMiniMap(l);
    });
}

function fieldArrayToProperties(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) obj[arr[i][0].value] = arr[i][1].value;
    return obj;
}
