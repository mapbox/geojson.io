'use strict';

module.exports = function source() {

    if (!window.location.hash) return null;

    var txt = window.location.hash.substring(1);

    if (!isNaN(parseInt(txt, 10))) {
        // legacy gist
        return {
            type: 'gist',
            id: parseInt(txt, 10)
        };
    } else if (txt.indexOf('gist:') === 0) {
        var clean = txt.replace(/^gist:/, '');
        if (clean.indexOf('/') !== -1) {
            return {
                type: 'gist',
                login: clean.split('/')[0],
                id: parseInt(clean.split('/')[1], 10)
            };
        } else {
            return {
                type: 'gist',
                id: parseInt(clean, 10)
            };
        }
    } else if (txt.indexOf('github:') === 0) {
        return {
            type: 'github',
            id: txt.replace(/^github:\/?/, '')
        };
    }
};
