const qs = require('qs-hash'),
  zoomextent = require('../lib/zoomextent'),
  flash = require('../ui/flash');

module.exports = function (context) {
  function success(err, d) {
    context.container.select('.map').classed('loading', false);

    let message;
    const url = /(http:\/\/\S*)/g;

    if (err) {
      try {
        message =
          err.message ||
          JSON.parse(err.responseText).message.replace(
            url,
            '<a href="$&">$&</a>'
          );
      } catch (e) {
        message = 'Sorry, an error occurred.';
      }
      return flash(context.container, message);
    }

    context.data.parse(d);

    if (!qs.stringQs(location.hash.substring(1)).map || mapDefault()) {
      zoomextent(context);
    }
  }

  function mapDefault() {
    return (
      context.map.getZoom() === 2 ||
      JSON.stringify(context.map.getCenter()) ===
        JSON.stringify({ lng: 20, lat: 2 })
    );
  }

  function inlineJSON(data) {
    try {
      context.data.set({
        map: JSON.parse(data)
      });
      history.replaceState('', document.title, window.location.pathname);

      zoomextent(context);
    } catch (e) {
      return flash(context.container, 'Could not parse JSON');
    }
  }

  function loadUrl(data) {
    d3.json(data)
      .header('Accept', 'application/vnd.geo+json')
      .on('load', onload)
      .on('error', onerror)
      .get();

    function onload(d) {
      context.data.set({ map: d });
      history.replaceState('', document.title, window.location.pathname);
      zoomextent(context);
    }

    function onerror() {
      return flash(
        context.container,
        'Could not load external file. External files must be served with CORS and be valid GeoJSON.'
      );
    }
  }

  return function (query) {
    if (!query.id && !query.data) return;

    const oldRoute = d3.event
      ? qs.stringQs(d3.event.oldURL.split('#')[1]).id
      : context.data.get('route');

    if (query.data) {
      // eslint-disable-next-line
      var type = query.data.match(/^(data\:[\w\-]+\/[\w\-]+\,?)/);
      if (type) {
        if (type[0] === 'data:application/json,') {
          inlineJSON(query.data.replace(type[0], ''));
        } else if (type[0] === 'data:text/x-url,') {
          loadUrl(query.data.replace(type[0], ''));
        }
      }
    } else if (query.id !== oldRoute) {
      context.container.select('.map').classed('loading', true);
      context.data.fetch(query, success);
    }
  };
};
