var d3 = require("d3");
var ui = require("./ui"),
  map = require("./ui/map"),
  data = require("./core/data"),
  loader = require("./core/loader"),
  router = require("./core/router"),
  repo = require("./core/repo"),
  user = require("./core/user"),
  store = require("store");

var gjIO = geojsonIO(),
  gjUI = ui(gjIO).read;

d3.select(".geojsonio").call(gjUI);

gjIO.router.on();

function geojsonIO() {
  var context = {};
  context.dispatch = d3.dispatch("change", "route");
  context.storage = store;
  context.map = map(context, true);
  context.data = data(context);
  context.dispatch.on("route", loader(context));
  context.repo = repo(context);
  context.router = router(context);
  context.user = user(context);
  return context;
}
