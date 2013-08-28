var github = require('./source/github');

module.exports = commit;

function commit(container, contents, callback) {
    container.select('.share').remove();

    var wrap = container.append('div')
        .attr('class', 'share pad1 center');

    var form = wrap.append('form')
        .on('submit', function() {
            d3.event.preventDefault();
            github.save(contents,
                message.property('value'), callback);
        });

    var message = form.append('input')
        .attr('placeholder', 'Commit message')
        .attr('type', 'text');

    var commitButton = form.append('input')
        .attr('type', 'submit')
        .property('value', 'Commit Changes')
        .attr('class', 'semimajor');

    message.node().focus();

    return wrap;
}
