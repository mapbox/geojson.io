const { DEFAULT_3D_BUILDINGS } = require('../constants');

module.exports = function (context) {
  return function (selection) {
    const Buildings3D = [
      {
        label: 'Show',
        value: true
      },
      {
        label: 'Hide',
        value: false
      }
    ];

    const container3D = selection
      .append('div')
      .attr(
        'class',
        'toggle-3D absolute left-0 bottom-0 mb-16 text-xs transition-all duration-200 z-10'
      );

    container3D
      .append('span')
      .attr('class', 'bg-white p-[4px]')
      .text('3D Buildings');

    const buttons3D = container3D.selectAll('button').data(Buildings3D);

    const set3DBuildings = function () {
      const clicked = this instanceof d3.selection ? this.node() : this;

      buttons3D.classed('active', function () {
        return clicked === this;
      });

      if (context.map._loaded) {
        console.log('were loaded!');
        const { value } = d3.select(clicked).datum();
        context.map.setConfigProperty('basemap', 'show3dObjects', value);
        context.storage.set('3DBuildings', value);
      }
    };

    buttons3D
      .enter()
      .append('button')
      .attr('class', 'pad0x')
      .on('click', set3DBuildings)
      .text((d) => {
        return d.label;
      });

    const hasKey = context.storage.get('3DBuildings') !== undefined;
    const active3DBuildings = hasKey
      ? context.storage.get('3DBuildings')
      : DEFAULT_3D_BUILDINGS;

    buttons3D
      .filter(({ value }) => value === active3DBuildings)
      .call(set3DBuildings);
  };
};
