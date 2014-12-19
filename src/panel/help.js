var fs = require('fs');
var marked = require('marked');

module.exports = function(context) {
    var html = fs.readFileSync('data/help.html') +
        '<br><hr><br>' +
        marked(fs.readFileSync('API.md', 'utf8'));
    function render(selection) {
        var area = selection
            .html('')
            .append('div')
            .attr('class', 'pad2 prose')
            .html(html);
    }

    render.off = function() {
    };

    return render;
};
