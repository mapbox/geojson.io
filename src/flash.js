var message = require('./message');

module.exports = flash;

function flash(selection, txt) {
    'use strict';

    var msg = message(selection);

    if (txt) msg.select('.content').text(txt);

    setTimeout(function() {
        msg
            .transition()
            .style('opacity', 0)
            .remove();
    }, 1500);

    return msg;
}
