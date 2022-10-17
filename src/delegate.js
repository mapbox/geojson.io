const Bowser = require('bowser');

const { platform: { type } } = Bowser.parse(window.navigator.userAgent);

if (type !== 'desktop') {
  var hash = window.location.hash;
  window.location.href = '/mobile.html' + hash;
}

if (!mapboxgl.supported()) {
  window.location.href = '/unsupported.html';
}
