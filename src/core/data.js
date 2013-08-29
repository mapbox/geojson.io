var clone = require('clone');

module.exports = function(context) {

    var _data = {
        map: {
            type: 'FeatureCollection',
            features: []
        },
        dirty: false,
        github: null,
        meta: null,
        type: 'local'
    };

    var data = {};

    data.set = function(obj, source) {
        for (var k in obj) {
            _data[k] = (typeof obj[k] === 'object') ? clone(obj[k], false) : obj[k];
        }
        if (obj.dirty !== false) data.dirty = true;
        context.dispatch.change({
            obj: obj,
            source: source
        });
        return data;
    };

    data.mergeFeatures = function(features, source) {
        _data.map.features = (_data.map.features || []).concat(features);
        return data.set({ map: _data.map }, source);
    };

    data.get = function(k) {
        return _data[k];
    };

    data.all = function() {
        return clone(_data, false);
    };

    return data;
};
