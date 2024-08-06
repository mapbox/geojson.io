const qs = require('qs-hash');

module.exports = function (context) {
  d3.select(window).on('unload', onunload);
  context.dispatch.on('change', onchange);

  const query = qs.stringQs(location.hash.split('#')[1] || '');

  if (location.hash !== '#new' && !query.id && !query.data) {
    const rec = context.storage.get('recover');
    if (rec && confirm('recover your map from the last time you edited?')) {
      context.data.set({
        ...rec,
        recovery: true
      });
    } else {
      context.storage.remove('recover');
    }
  }

  function onunload() {
    if (context.data.get('type') === 'local' && context.data.hasFeatures()) {
      try {
        context.storage.set('recover', context.data.all());
      } catch (e) {
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
