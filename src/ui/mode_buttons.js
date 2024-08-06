const table = require('../panel/table'),
  json = require('../panel/json'),
  help = require('../panel/help');

module.exports = function (context, pane) {
  return function (selection) {
    let mode = null;

    const buttonData = [
      {
        icon: 'code',
        title: ' JSON',
        alt: 'JSON Source',
        behavior: json
      },
      {
        icon: 'table',
        title: ' Table',
        alt: 'Edit feature properties in a table',
        behavior: table
      },
      {
        icon: 'question',
        title: ' Help',
        alt: 'Help',
        behavior: help
      }
    ];

    const buttons = selection.selectAll('button').data(buttonData, (d) => {
      return d.icon;
    });

    const enter = buttons
      .enter()
      .append('button')
      .attr('class', 'grow')
      .attr('title', (d) => {
        return d.alt;
      })
      .on('click', buttonClick);
    enter.append('i').attr('class', (d) => {
      return `fa-solid fa-${d.icon}`;
    });
    enter.append('span').text((d) => {
      return d.title;
    });

    d3.select(buttons.node()).trigger('click');

    function buttonClick(d) {
      buttons.classed('active', (_) => {
        return d.icon === _.icon;
      });
      if (mode) mode.off();
      mode = d.behavior(context);
      pane.call(mode);
    }
  };
};
