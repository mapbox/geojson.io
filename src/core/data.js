var xtend = require('xtend');

module.exports = function(context) {

    var data = {
        map: {
            type: 'FeatureCollection',
            features: []
        },
        dirty: false,
        github: null,
        meta: null,
        type: 'local'
    };

    data.set = function(obj, source) {
        for (var k in obj) {
            data[k] = (typeof obj[k] === 'object') ? xtend(obj[k]) : obj[k];
        }
        if (obj.dirty !== false) data.dirty = true;
        context.dispatch.change({
            obj: obj,
            source: source
        });
        return data;
    };

    data.mergeFeatures = function(features, source) {
        data.map.features = (data.map.features || []).concat(features);
        return data.set({ map: data.map }, source);
    };

    data.get = function(k) {
        return data[k];
    };

    data.all = function() {
        return data;
    };

    return data;
};
