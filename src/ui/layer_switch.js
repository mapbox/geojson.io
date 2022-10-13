module.exports = function(context) {

  return function(selection) {

    var layers = [
      {
        title: 'Streets',
        style: 'mapbox://styles/mapbox/streets-v11'
      }, 
      {
        title: 'Satellite Streets',
        style: 'mapbox://styles/mapbox/satellite-v9'
      },
      {
        title: 'Outdoors',
        style: 'mapbox://styles/mapbox/outdoors-v11'
      },
      {
        title: 'Light',
        style: 'mapbox://styles/mapbox/light-v10'
      },
      {
        title: 'Dark',
        style: 'mapbox://styles/mapbox/dark-v10'
      }
    ];

        

    var layerSwap = function(d) {
      var clicked = this instanceof d3.selection ? this.node() : this;
      layerButtons.classed('active', function() {
        return clicked === this;
      });

      // this will likely run before the initial map style is loaded
      // streets is default, but on subsequent runs we must change styles
      if (context.map._loaded) {
        const { title, style } = d3.select(clicked).datum();

        context.map.setStyle(style);
      }
    };

    var layerButtons = selection.append('div')
      .attr('class', 'layer-switch mb-10')
      .selectAll('button')
      .data(layers)
      .enter()
      .append('button')
      .attr('class', 'pad0x')
      .on('click', layerSwap)
      .text(function(d) { return d.title; });

    layerButtons.filter(function(d, i) { return i === 0; }).call(layerSwap);

  };
};
