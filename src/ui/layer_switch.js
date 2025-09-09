const styles = require('./map/styles');
const { DEFAULT_STYLE } = require('../constants');

module.exports = function (context) {
  return function (selection) {
    const layerButtons = selection
      .append('div')
      .attr('class', 'layer-switch absolute left-0 bottom-0 mb-9 text-xs z-10')
      .selectAll('button')
      .data(styles);

    const layerSwap = function () {
      const clicked = this instanceof d3.selection ? this.node() : this;
      layerButtons.classed('active', function () {
        return clicked === this;
      });

      // set user-layer button to inactive
      d3.select('.user-layer-button').classed('active', false);

      // this will likely run before the initial map style is loaded
      // streets is default, but on subsequent runs we must change styles
      if (context.map._loaded) {
        const { title, style, config } = d3.select(clicked).datum();

        context.map.setStyle(style, {
          ...(config ? { config } : {})
        });

        context.storage.set('style', title);

        context.data.set({
          mapStyleLoaded: true
        });

        // Update toggle visibility based on new style
        setTimeout(() => {
          const toggle3D = d3.select('.toggle-3D');
          const shouldHide3DForStyle =
            title === 'OSM' ||
            title === 'Outdoors' ||
            title === 'Standard Satellite';
          toggle3D.classed('hidden', shouldHide3DForStyle);
        }, 100);
      }
    };

    layerButtons
      .enter()
      .append('button')
      .attr('class', 'pad0x')
      .on('click', layerSwap)
      .text((d) => {
        return d.title;
      });

    const activeStyle = context.storage.get('style') || DEFAULT_STYLE;

    // Check if activeStyle exists in styles array, default to 'Standard' if not
    const styleExists = styles.some(({ title }) => title === activeStyle);
    const correctedStyle = styleExists ? activeStyle : 'Standard';

    // Update localStorage if we had to correct the style
    if (!styleExists) {
      context.storage.set('style', correctedStyle);
    }

    layerButtons
      .filter(({ title }) => {
        return title === correctedStyle;
      })
      .call(layerSwap);
  };
};
