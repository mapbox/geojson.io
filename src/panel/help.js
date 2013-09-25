var fs = require('fs');

module.exports = function(context) {

    function render(selection) {
        var area = selection
            .html('')
            .append('div')
            .attr('class', 'pad2 prose')
            .html(fs.readFileSync('data/help.html'));
    }

    render.off = function() {
    };

    return render;
};
