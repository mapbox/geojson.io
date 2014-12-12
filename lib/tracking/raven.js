var config = require('../../src/config.js')(location.hostname);
var mapboxAPI = !config.MapboxAPITile || /(?:http:\/\/)?a\.tiles\.mapbox\.com\/?/.test(config.MapboxAPITile) ? true : false;

if (mapboxAPI) {
    Raven.config('https://c2d096c944dd4150ab7e44b0881b4a46@app.getsentry.com/11480', {
      whitelistUrls: [/geojson\.io/],
      ignoreErrors: [
          'Uncaught Error: Error connecting to extension ckibcdccnfeookdmbahgiakhnjcddpki',
          'Uncaught Error: Error connecting to extension pioclpoplcdbaefihamjohnefbikjilc'
      ]
  }).install();
}
