const mapboxgl = require('mapbox-gl');
const Bowser = require('bowser');

const {
  platform: { type }
} = Bowser.parse(window.navigator.userAgent);

if (type !== 'desktop') {
  const hash = window.location.hash;
  window.location.href = '/mobile.html' + hash;
}

if (!mapboxgl.supported()) {
  window.location.href = '/unsupported.html';
}
