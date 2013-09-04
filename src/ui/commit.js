var github = require('../source/github');

module.exports = commit;

function commit(context, callback) {
    context.container.select('.share').remove();
    context.container.select('.tooltip.in')
      .classed('in', false);

    var wrap = context.container.append('div')
        .attr('class', 'share pad1 center')
        .style('z-index', 10);

    var form = wrap.append('form')
        .on('submit', function() {
            d3.event.preventDefault();
            context.commitMessage = message.property('value');
            if (typeof callback === 'function') callback();
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
