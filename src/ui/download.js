var shpwrite = require('shp-write'),
    clone = require('clone'),
    topojson = require('topojson'),
    saveAs = require('filesaver.js');

module.exports = download;

function download(context) {

    var shpSupport = typeof ArrayBuffer !== 'undefined';

    function downloadTopo() {
        var content = JSON.stringify(topojson.topology({
            collection: clone(context.data.get('map'))
        }, {'property-transform': allProperties}));

        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'map.topojson');
    }

    function downloadGeoJSON() {
        if (d3.event) d3.event.preventDefault();
        var content = JSON.stringify(context.data.get('map'));
        var meta = context.data.get('meta');
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), (meta && meta.name) || 'map.geojson');
    }

    function downloadShp() {
        if (d3.event) d3.event.preventDefault();
        d3.select('.map').classed('loading', true);
        try {
            shpwrite.download(context.data.get('map'));
        } finally {
            d3.select('.map').classed('loading', false);
        }
    }

    function allProperties(properties, key, value) {
        properties[key] = value;
        return true;
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
            icon: 'icon-file',
            title: 'TopoJSON',
            action: downloadTopo
        }];

        if (shpSupport) {
            actions.push({
                icon: 'icon-file-alt',
                title: 'Shapefile (beta)',
                action: downloadShp
            });
        }

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
