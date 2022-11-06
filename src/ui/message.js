module.exports = message;

function message(selection) {
  'use strict';

  selection.select('div.message').remove();

  const sel = selection.append('div').attr('class', 'message pad1');

  sel
    .append('a')
    .attr('class', 'icon-remove fr')
    .on('click', () => {
      sel.remove();
    });

  sel.append('div').attr('class', 'content');

  sel.style('opacity', 0).transition().duration(200).style('opacity', 1);

  sel.close = function () {
    sel.transition().duration(200).style('opacity', 0).remove();
    sel.transition().duration(200).style('top', '0px');
  };

  return sel;
}
