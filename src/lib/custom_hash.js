var qs = require('qs-hash');
require('leaflet-hash');

L.Hash.prototype.parseHash = function(hash) {
    var query = qs.stringQs(hash.substring(1));
    var map = query.map || '';
    var args = map.split('/');
    if (args.length == 3) {
        var zoom = parseInt(args[0], 10),
            lat = parseFloat(args[1]),
                lon = parseFloat(args[2]);
                if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
                    return false;
                } else {
                    return {
                        center: new L.LatLng(lat, lon),
                        zoom: zoom
                    };
                }
    } else {
        return false;
    }
};

L.Hash.prototype.formatHash = function(map) {
    var query = qs.stringQs(location.hash.substring(1)),
        center = map.getCenter(),
            zoom = map.getZoom(),
                precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

                query.map = [zoom,
                    center.lat.toFixed(precision),
                    center.lng.toFixed(precision)
                ].join('/');

                return '#' + qs.qsString(query);
};
