module.exports = function(context) {

  return function(selection) {
  
    var projections = [
      {
        label: 'Globe',
        value: 'globe'
      },
      {
        label: 'Mercator',
        value: 'mercator'
      }
    ];
  
          
  
    var setProjection = function(d) {
      var clicked = this instanceof d3.selection ? this.node() : this;
      projectionButtons.classed('active', function() {
        return clicked === this;
      });
  
      if (context.map._loaded) {
        const { value } = d3.select(clicked).datum();
        context.map.setProjection(value);
      }
    };
  
    const projectionButtons = selection.append('div')
      .attr('class', 'projection-switch absolute bottom-0 right-0 mb-9 text-xs transition-all duration-200')
      .selectAll('button')
      .data(projections)
      .enter()
      .append('button')
      .attr('class', 'pad0x')
      .on('click', setProjection)
      .text(function(d) { return d.label; });
  
    projectionButtons.filter(function(d, i) { return i === 0; }).call(setProjection);
  };
};
  