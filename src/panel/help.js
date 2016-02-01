var fs = require('fs');
var marked = require('marked');

module.exports = function() {
    var html = '';
    function render(selection) {
        selection
            .html('')
            .append('div')
            .attr('class', 'pad2 prose')
            .html(html);
    }

    render.off = function() {
    };

    return render;
};
