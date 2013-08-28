var readDrop = require('../lib/readfile.js').readDrop;

module.exports = function(context) {
    d3.select('body')
        .attr('dropzone', 'copy')
        .on('drop.import', readDrop(context, function(err, gj) {
            console.log(arguments);
            if (err) return;
            context.data.set('map', gj);
            d3.select('body').classed('dragover', false);
        }))
        .on('dragenter.import', over)
        .on('dragleave.import', exit)
        .on('dragover.import', over);

   function over() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        d3.select('body').classed('dragover', true);
    }

    function exit() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        d3.select('body').classed('dragover', false);
    }
};
