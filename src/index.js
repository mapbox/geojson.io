var mobile = require('is-mobile');

if (mobile() || (window.navigator && /iPad/.test(window.navigator.userAgent))) {
    var hash = window.location.hash;
    window.location.href = '/mobile.html' + hash;
}

var ui = require('./ui'),
    map = require('./ui/map'),
    data = require('./core/data'),
    loader = require('./core/loader'),
    router = require('./core/router'),
    recovery = require('./core/recovery'),
    repo = require('./core/repo'),
    user = require('./core/user'),
    store = require('store');

var gjIO = geojsonIO(),
    gjUI = ui(gjIO).write;


d3.select('.geojsonio').call(gjUI);

gjIO.recovery = recovery(gjIO);
gjIO.router.on();

function geojsonIO() {
    var context = {};
    context.dispatch = d3.dispatch('change', 'route');
    context.storage = store;
    context.map = map(context);
    context.data = data(context);
    context.dispatch.on('route', loader(context));
    context.repo = repo(context);
    context.router = router(context);
    context.user = user(context);
    return context;
}
