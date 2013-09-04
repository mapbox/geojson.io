module.exports = function(context) {

    d3.select(window).on('unload', onunload);
    context.dispatch.on('change', onchange);

    if (location.hash !== '#new') {
        var rec = context.storage.get('recover');
        if (rec && confirm('recover your map from the last time you edited?')) {
            context.data.set(rec);
        } else {
            context.storage.remove('recover');
        }
    }

    function onunload() {
        if (context.data.get('type') === 'local' && context.data.hasFeatures()) {
            context.storage.set('recover', context.data.all());
        } else {
            context.storage.remove('recover');
        }
    }

    function onchange() {
        if (context.data.get('type') !== 'local') {
            context.storage.remove('recover');
        }
    }
};
