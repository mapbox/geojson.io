var leafletImage = require('leaflet-image');

module.exports = download;

function download(context) {
    function downloadGeoJSON() {
        if (d3.event) d3.event.preventDefault();
        var content = JSON.stringify(context.data.get('map'));
        var meta = context.data.get('meta');
        window.saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), (meta && meta.name) || 'map.geojson');
    }

    function downloadImage() {
        if (d3.event) d3.event.preventDefault();
        d3.select('.map').classed('loading', true);
        leafletImage(context.map, function(err, canvas) {
            d3.select('.map').classed('loading', false);
            var data = canvas.toDataURL('image/png').match(/data:(.*),(.*)/),
                content = window.atob(data[2]),
                meta = context.data.get('meta'),
                arr = new Uint8Array(content.length);

            for (var i = 0, length = content.length; i < length; i++) {
                arr[i] = content.charCodeAt(i);
            }

            window.saveAs(new Blob([arr.buffer], {
                type: 'image/png'
            }), (meta && meta.name ? meta.name.split('.')[0] : 'map') + '.png');
        });
    }

    return function(selection) {

        selection.select('.download').remove();
        selection.select('.tooltip.in')
          .classed('in', false);

        var sel = selection.append('div')
            .attr('class', 'download pad1');

        var actions = [{
            icon: 'icon-map-marker',
            title: 'GeoJSON',
            action: downloadGeoJSON
        }, {
            icon: 'icon-picture',
            title: 'Image',
            action: downloadImage
        }];

        var links = sel
            .selectAll('.action')
            .data(actions)
            .enter()
            .append('a')
            .attr('class', 'action')
            .on('click', function(d) {
                d.action.apply(this, d);
            });

        links.append('span')
            .attr('class', function(d) { return d.icon + ' pre-icon'; });

        links.append('span')
            .text(function(d) { return d.title; });

        sel.append('a')
            .attr('class', 'icon-remove')
            .on('click', function() { sel.remove(); });
    };
}
