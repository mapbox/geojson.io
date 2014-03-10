var zoomextent = require('../lib/zoomextent'),
    qs = require('qs-hash');

module.exports = function(context) {

    d3.select(window).on('unload', onunload);
    context.dispatch.on('change', onchange);

    var query = qs.stringQs(location.hash.split('#')[1] || '');

    if (location.hash !== '#new' && !query.id && !query.data) {
        var rec = context.storage.get('recover');
        if (rec && confirm('recover your map from the last time you edited?')) {
            context.data.set(rec);
            setTimeout(function() {
                zoomextent(context);
            }, 100);
        } else {
            context.storage.remove('recover');
        }
    }

    function onunload() {
        if (context.data.get('type') === 'local' && context.data.hasFeatures()) {
            try {
                context.storage.set('recover', context.data.all());
            } catch(e) {
                // QuotaStorageExceeded
            }
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
