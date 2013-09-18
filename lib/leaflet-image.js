var queue = require('./queue');

module.exports = function leafletImage(map, callback) {
    var dimensions = map.getSize(),
        layerQueue = new queue(1);

    map.eachLayer(function(l) {
        if (l instanceof L.TileLayer) {
            layerQueue.defer(handleTileLayer, l);
        } else if (l instanceof L.Marker) {
            // TODO: cors on marker images.
            // layerQueue.defer(handleMarkerLayer, l);
        }
    });

    if (map._pathRoot) {
        layerQueue.defer(handlePathRoot, map._pathRoot);
    }

    var canvas = document.createElement('canvas');
    canvas.width = dimensions.x;
    canvas.height = dimensions.y;
    var ctx = canvas.getContext('2d');

    function done() {
        callback(null, canvas);
    }

    layerQueue.awaitAll(function(err, layers) {
        if (err) throw err;
        layers.forEach(function(layer) {
            if (layer && layer.canvas) {
                ctx.drawImage(layer.canvas, 0, 0);
            }
        });
        done();
    });

    function handleTileLayer(layer, callback) {
        var canvas = document.createElement('canvas');
        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        var ctx = canvas.getContext('2d');
        var bounds = map.getPixelBounds(),
            zoom = map.getZoom(),
            tileSize = layer.options.tileSize;

        if (!layer.options.tiles || zoom > layer.options.maxZoom || zoom < layer.options.minZoom) {
            return callback();
        }

        var tileBounds = L.bounds(
            bounds.min.divideBy(tileSize)._floor(),
            bounds.max.divideBy(tileSize)._floor());

        var tiles = [],
            center = tileBounds.getCenter();

        var j, i, point;

        for (j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
            for (i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
                tiles.push(new L.Point(i, j));
            }
        }

        var tileQueue = new queue(1);

        tiles.forEach(function(tilePoint) {
            tileQueue.defer(function(callback) {
                layer._adjustTilePoint(tilePoint);
                var tilePos = layer._getTilePos(tilePoint);
                var url = layer.getTileUrl(tilePoint) + '?cache=' + (+new Date());
                var im = new Image();
                im.crossOrigin = '';
                im.onload = function() {
                    callback(null, {
                        img: this,
                        pos: tilePos,
                        size: tileSize
                    });
                };
                im.src = url;
            });
            tileQueue.awaitAll(function(err, data) {
                data.forEach(function(d) {
                    ctx.drawImage(d.img, Math.floor(d.pos.x), Math.floor(d.pos.y),
                        d.size, d.size);
                });
                callback(null, {
                    canvas: canvas
                });
            });
        });
    }

    function handlePathRoot(root, callback) {
        var canvas = document.createElement('canvas');
        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        var ctx = canvas.getContext('2d');
        var pos = L.DomUtil.getPosition(root);
        ctx.drawImage(root, pos.x, pos.y);
        callback(null, {
            canvas: canvas
        });
    }

    function handleMarkerLayer(marker, callback) {
        var url = marker._icon.src + '?cache=false';
        var im = new Image();
        im.crossOrigin = '*';
        im.onload = function() {
            // callback(null, {
            //     img: this,
            //     pos: tilePos
            // });
        };
        im.src = url;

        // var canvas = document.createElement('canvas');
        // canvas.width = dimensions.x;
        // canvas.height = dimensions.y;
        // var ctx = canvas.getContext('2d');
        // var pos = L.DomUtil.getPosition(root);
        // ctx.drawImage(root, pos.x, pos.y);
        // callback(null, {
        //     canvas: canvas
        // });
    }
}
