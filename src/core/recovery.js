module.exports = function(context) {
    d3.select(window).on('unload', function() {
        if (context.data.get('type') === 'local') {
            context.storage.set('recover', context.data.all());
        }
    });

    if (location.hash !== '#new') {
        var rec = context.storage.get('recover');
        if (rec) context.data.set(rec);
    }
};
