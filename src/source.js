module.exports = function source() {
    if (!location.hash) return null;

    var txt = location.hash.substring(1);

    if (!isNaN(parseInt(txt, 10))) {
        // legacy gist
        return {
            type: 'gist',
            id: parseInt(txt, 10)
        };
    } else if (txt.indexOf('gist:') === 0) {
        return {
            type: 'gist',
            id: parseInt(txt.replace(/^gist:/, ''), 10)
        };
    } else if (txt.indexOf('github:') === 0) {
        return {
            type: 'github',
            id: txt.replace(/^github:\/?/, '')
        };
    }
};
