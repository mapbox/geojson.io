module.exports = api;

function api(context) {
    if (typeof console === 'undefined' || !console || !console.log) return;

    console.log('%c⚛ geojson.io api ⚛', 'font-family:monospace;font-size:20px;color:darkblue;');
    console.log('%cfrom here, you can customize geojson.io to your liking by mucking around with the internals', 'font-family:monospace;font-size:14px;color:darkblue;');
    console.log('%chere\'s what\'s available ↓', 'color:blue;');
    console.log('');

    console.log('%c- window.api.map: the leaflet map object', 'font-weight:bold;');
    console.log('%O', context.map);

    console.log('%c- window.api.mapLayer: the leaflet mapLayer object', 'font-weight:bold;');
    console.log('%O', context.mapLayer);

    console.log('%c- window.api.drawControl: the leaflet.draw control', 'font-weight:bold;');
    console.log('%O', context.drawControl);

    console.log('');

    console.log('%c- window.api.data: the data model', 'font-weight:bold;');
    console.log('%O', context.data);

    console.log('');
    console.log('%cExample:', 'font-weight:bold;');
    console.log('');
    console.log('%c  window.api.map.setView([38, -78], 5);', 'color:green;');

    console.log('');
    console.log('%c  window.api.data.mergeFeatures([{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } }]);', 'color:green;');

    window.api = {
        map: context.map,
        mapLayer: context.mapLayer,
        drawControl: context.drawControl,
        data: context.data
    };

    d3.rebind(window.api, context.dispatch, 'on');
}
