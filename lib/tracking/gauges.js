var config = require('../../src/config.js')(location.hostname);
var mapboxAPI = !config.MapboxAPITile || /(?:http:\/\/)?a\.tiles\.mapbox\.com\/?/.test(config.MapboxAPITile) ? true : false;

if (mapboxAPI) {
    var _gauges = _gauges || [];
      (function() {
        var t   = document.createElement('script');
        t.type  = 'text/javascript';
        t.async = true;
        t.id    = 'gauges-tracker';
        t.setAttribute('data-site-id', '51eee846108d7b2871000081');
        t.src = '//secure.gaug.es/track.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(t, s);
      })();
}
