(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"../../src/config.js":2}],2:[function(require,module,exports){
module.exports = function(hostname) { 			
	var production = (hostname === 'geojson.io'); 			
	return { 			
		MapboxAPITile: null, 			
		client_id: production ? 			
			'62c753fd0faf18392d85' : 			
			'bb7bbe70bd1f707125bc', 			
		gatekeeper_url: production ? 			
			'https://geojsonioauth.herokuapp.com' : 			
			'https://localhostauth.herokuapp.com' 			
	}; 		
};

},{}]},{},[1])