module.exports.showProperties = showProperties;
module.exports.geoify = geoify;

function isEmpty(o) {
    for (var i in o) { return false; }
    return true;
}

function showProperties(l) {
    var properties = l.toGeoJSON().properties, table = '';
    if (isEmpty(properties)) properties = { '': '' };

    for (var key in properties) {
        table += '<tr><th><input type="text" value="' + key + '" /></th>' +
            '<td><input type="text" value="' + properties[key] + '" /></td></tr>';
    }

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent('<div class="clearfix"><div class="marker-properties-limit"><table class="marker-properties">' + table + '</table></div>' +
        '<div class="clearfix col12 drop">' +
            '<div class="buttons-joined fl"><button class="save positive">save</button>' +
            '<button class="cancel">cancel</button></div>' +
            '<div class="fr clear-buttons"><button class="delete-invert"><span class="icon-remove-sign"></span> remove</button></div>' +
        '</div></div>'));
}

function geoify(layer) {
    var features = [];
    layer.eachLayer(function(l) {
        if ('toGeoJSON' in l) features.push(l.toGeoJSON());
    });
    layer.clearLayers();
    L.geoJson({ type: 'FeatureCollection', features: features }).eachLayer(function(l) {
        l.addTo(layer);
    });
}
