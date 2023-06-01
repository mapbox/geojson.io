// extend mapboxGL Marker so we can pass in an onClick handler
const mapboxgl = require('mapbox-gl');

class ClickableMarker extends mapboxgl.Marker {
  constructor(options, legacyOptions) {
    super(options, legacyOptions);

    const {
        symbol = "circle",
        symbolColor = "#fff"
    } = options

    if (
      symbol != "circle" &&
      (makiNames.includes(symbol) || /^[a-z0-9]$/.test(symbol))
    ) {
      const symbolPath = document.createElement('path');
      this._element.querySelector('circle').replaceWith(symbolPath)

      // download svg symbol and insert its path where the circle was
      const xml = d3.xml(`../dist/icons/${symbol}.svg`, function(err, xml) {
        if (err) {
          console.error(`Error downloading the svg from: ../dist/icons/${symbol}.svg`);
        } else {
          symbolPath.outerHTML = `<path fill="${symbolColor}" transform="translate(6 6)"
            d="${xml.documentElement.getElementsByTagName("path")[0].getAttribute("d")}"></path>`
        }
      });
    }
  }

  // new method onClick, sets _handleClick to a function you pass in
  onClick(handleClick) {
    this._handleClick = handleClick;
    return this;
  }

  // the existing _onMapClick was there to trigger a popup
  // but we are hijacking it to run a function we define
  _onMapClick(e) {
    const targetElement = e.originalEvent.target;
    const element = this._element;

    if (
      this._handleClick &&
      (targetElement === element || element.contains(targetElement))
    ) {
      this._handleClick();
    }
  }
}

module.exports = ClickableMarker;
