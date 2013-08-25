module.exports = function(context) {

    function map(selection) {
        context.map = L.mapbox.map(selection.node())
            .setView([20, 0], 2)
            .addControl(L.mapbox.geocoderControl('tmcw.map-u4ca5hnt'));

        context.mapLayer = L.featureGroup().addTo(context.map);

        context.drawControl = new L.Control.Draw({
            edit: { featureGroup: context.mapLayer },
            draw: { circle: false }
        }).addTo(context.map);

        context.map
            .on('draw:edited', update)
            .on('draw:deleted', update)
            .on('draw:created', created);
            // .on('popupopen', onPopupOpen);

        function update() {
            geoify(context.mapLayer);
            context.data.set('map', layerToGeoJSON(context.mapLayer));
        }

        function created(e) {
            context.mapLayer.addLayer(e.layer);
            update();
        }
    }


    function layerToGeoJSON(layer) {
        var features = [];
        layer.eachLayer(collect);
        function collect(l) { if ('toGeoJSON' in l) features.push(l.toGeoJSON()); }
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    return map;
};

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
