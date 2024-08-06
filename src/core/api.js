module.exports = api;

function api(context) {
  if (typeof console === 'undefined' || !console || !console.log) return;

  console.log(
    '%c⚛ geojson.io console api ⚛',
    'font-family:monospace;font-size:20px;color:darkblue;'
  );
  console.log(
    '%cfrom here, you can customize geojson.io to your liking by mucking around with the internals',
    'font-family:monospace;font-size:14px;color:darkblue;'
  );
  console.log("%chere's what's available ↓", 'color:blue;');
  console.log('');

  console.log(
    '%c- window.api.map: the mapboxgl map object',
    'font-weight:bold;'
  );
  console.log('%O', context.map);

  console.log(
    '%c- window.api.draw: the mapbox-gl-draw instance',
    'font-weight:bold;'
  );
  console.log('%O', context.Draw);

  console.log('');

  console.log('%c- window.api.data: the data model', 'font-weight:bold;');
  console.log('%O', context.data);

  console.log('');
  console.log('%cExample:', 'font-weight:bold;');
  console.log('');
  console.log(
    '%c  window.api.map.flyTo({ center: [-78, 38], zoom: 5 });',
    'color:green;'
  );

  console.log('');
  console.log(
    '%c  window.api.data.mergeFeatures([{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } }]);',
    'color:green;'
  );

  window.api = {
    map: context.map,
    draw: context.Draw,
    data: context.data
  };

  d3.rebind(window.api, context.dispatch, 'on');
}
