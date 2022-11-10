module.exports = function (selection, blocking) {
  const previous = selection.select('div.modal');
  const animate = previous.empty();

  previous.transition().duration(200).style('opacity', 0).remove();

  const shaded = selection
    .append('div')
    .attr('class', 'shaded')
    .style('opacity', 0);

  const modal = shaded.append('div').attr('class', 'modal fillL col6');

  const keybinding = d3
    .keybinding('modal')
    .on('⌫', shaded.close)
    .on('⎋', shaded.close);

  shaded.close = function () {
    shaded.transition().duration(200).style('opacity', 0).remove();
    modal.transition().duration(200).style('top', '0px');
    keybinding.off();
  };

  d3.select(document).call(keybinding);

  shaded.on('click.remove-modal', function () {
    if (d3.event.target === this && !blocking) shaded.close();
  });

  modal
    .append('button')
    .attr('class', 'close')
    .on('click', () => {
      if (!blocking) shaded.close();
    })
    .append('div')
    .attr('class', 'icon close');

  modal.append('div').attr('class', 'content');

  if (animate) {
    shaded.transition().style('opacity', 1);
    modal.style('top', '0px').transition().duration(200).style('top', '40px');
  } else {
    shaded.style('opacity', 1);
  }

  return shaded;
};
