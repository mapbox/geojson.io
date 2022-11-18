const Sentry = require('@sentry/browser');
const { BrowserTracing } = require('@sentry/tracing');

const ui = require('./ui'),
  map = require('./ui/map'),
  data = require('./core/data'),
  loader = require('./core/loader'),
  router = require('./core/router'),
  recovery = require('./core/recovery'),
  repo = require('./core/repo'),
  user = require('./core/user'),
  store = require('store');

const gjIO = geojsonIO(),
  gjUI = ui(gjIO).write;

d3.select('.geojsonio').call(gjUI);

gjIO.recovery = recovery(gjIO);
gjIO.router.on();

function geojsonIO() {
  const context = {};
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

Sentry.init({
  dsn: 'https://c2d096c944dd4150ab7e44b0881b4a46@o5937.ingest.sentry.io/11480',
  release: 'geojson.io@latest',
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0
});
