module.exports = function(context) {
    var bounds = context.mapLayer.getBounds();
    if (bounds.isValid()) context.map.fitBounds(bounds);
};
