var ui = require('./ui'),
    map = require('./ui/map'),
    data = require('./core/data'),
    loader = require('./core/loader'),
    router = require('./core/router'),
    recovery = require('./core/recovery'),
    repo = require('./core/repo'),
    user = require('./core/user'),
    api = require('./core/api'),
    store = require('store');

var gjIO = geojsonIO(),
    gjUI = ui(gjIO).write;

d3.select('.geojsonio').call(gjUI);

gjIO.recovery = recovery(gjIO);
gjIO.router.on();

api(gjIO);

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

