var buttons = require('./ui/mode_buttons'),
  file_bar = require('./ui/file_bar'),
  dnd = require('./ui/dnd'),
  userUi = require('./ui/user'),
  layer_switch = require('./ui/layer_switch'),
  projection_switch = require('./ui/projection_switch');

module.exports = ui;

function ui(context) {
  function init(selection) {

    var container = selection
      .append('div')
      .attr('class', 'ui-container flex-grow relative');

    var map = container
      .append('div')
      .attr('class', 'map')
      .call(context.map)
      .call(layer_switch(context))
      .call(projection_switch(context));

    context.container = container;

    return container;
  }

  function render(selection) {

    var container = init(selection);

    var right = container
      .append('div')
      .attr('class', 'right');

    var top = right
      .append('div')
      .attr('class', 'top');

    top
      .append('button')
      .attr('class', 'collapse-button')
      .attr('title', 'Collapse')
      .on('click', function collapse() {
        d3.select('body').classed('fullscreen',
          !d3.select('body').classed('fullscreen'));
        var full = d3.select('body').classed('fullscreen');
        d3.select(this)
          .select('.icon')
          .classed('fa-caret-up', !full)
          .classed('fa-caret-down', full);
        context.map.resize();
      })
      .append('i')
      .attr('class', 'icon fa-solid fa-caret-up');

    var pane = right
      .append('div')
      .attr('class', 'pane group');

    // user ui, disabled for now
    // top
    //     .append('div')
    //     .attr('class', 'user fr pad1 deemphasize')
    //     .call(userUi(context));

    top
      .append('div')
      .attr('class', 'buttons')
      .call(buttons(context, pane));

    container
      .append('div')
      .attr('class', 'file-bar')
      .call(file_bar(context));

    dnd(context);
  }


  return {
    read: init,
    write: render
  };
}
