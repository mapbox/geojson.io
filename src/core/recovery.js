module.exports = function(context) {
    d3.select(window).on('unload', function() {
        if (context.data.get('type') === 'local') {
            context.storage.set('recover', context.data.all());
        }
    });

    if (location.hash !== '#new') {
        var rec = context.storage.get('recover');
        if (rec && confirm('recover your map from the last time you edited?')) {
            context.data.set(rec);
        } else {
            context.storage.remove('recover');
        }
    }
};
