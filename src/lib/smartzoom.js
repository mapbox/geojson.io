module.exports = function(map, feature) {
    if (feature instanceof L.Marker) {
        map.setView(feature.getLatLng(), 10);
    } else if ('getBounds' in feature && feature.getBounds().isValid()) {
        map.fitBounds(feature.getBounds());
    }
};
