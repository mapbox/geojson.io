module.exports = function(context) {

    var data = {
        map: null,
        meta: null
    };

    data.set = function(k, v) {
        data[k] = v;
        context.dispatch.change({
            field: k,
            value: v
        });
    };

    data.get = function(k) {
        return data[k];
    };

    return data;
};
