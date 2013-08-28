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

    data.set = function(k, v, source) {
        data[k] = v;
        if (k !== 'dirty') data.dirty = true;
        context.dispatch.change({
            field: k,
            value: v,
            source: source
        });
        return data;
    };

    data.get = function(k) {
        return data[k];
    };

    data.all = function() {
        return data;
    };

    return data;
};
