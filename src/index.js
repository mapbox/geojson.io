var ui = require('./ui'),
    map = require('./ui/map'),
    data = require('./core/data'),
    router = require('./core/router'),
    recovery = require('./core/recovery'),
    loader = require('./core/loader'),
    user = require('./core/user'),
    store = require('store');

var gjIO = geojsonIO(),
    gjUI = ui(gjIO);


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
    context.router = router(context);
    context.user = user(context);
    return context;
}
