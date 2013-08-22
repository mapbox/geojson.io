module.exports = function(elem, w, h) {
    var c = elem.appendChild(document.createElement('canvas'));

    c.width = w;
    c.height = h;

    var ctx = c.getContext('2d'),
        gap,
        fill = {
            success: '#e3e4b8',
            error: '#E0A990'
        };

    return function(e) {
        if (!gap) gap = ((e.done) / e.todo * w) - ((e.done - 1) / e.todo * w);
        ctx.fillStyle = fill[e.status];
        ctx.fillRect((e.done - 1) / e.todo * w, 0, gap, h);
    };
};
