const { DEFAULT_PROJECTION } = require('../constants');

module.exports = function (context) {
  return function (selection) {
    const projections = [
      {
        label: 'Globe',
        value: 'globe'
      },
      {
        label: 'Mercator',
        value: 'mercator'
      }
    ];

    const projectionButtons = selection
      .append('div')
      .attr(
        'class',
        'projection-switch absolute left-0 bottom-0 mb-16 text-xs transition-all duration-200 z-10'
      )
      .selectAll('button')
      .data(projections);

    const setProjection = function () {
      const clicked = this instanceof d3.selection ? this.node() : this;
      projectionButtons.classed('active', function () {
        return clicked === this;
      });

      if (context.map._loaded) {
        const { value } = d3.select(clicked).datum();
        context.map.setProjection(value);
        context.storage.set('projection', value);
      }
    };

    projectionButtons
      .enter()
      .append('button')
      .attr('class', 'pad0x')
      .on('click', setProjection)
      .text((d) => {
        return d.label;
      });

    const activeProjection =
      context.storage.get('projection') || DEFAULT_PROJECTION;
    projectionButtons
      .filter(({ value }) => {
        return value === activeProjection;
      })
      .call(setProjection);
  };
};
