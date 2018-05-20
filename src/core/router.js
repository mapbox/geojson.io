var d3 = require("d3");
var qs = require("qs-hash"),
  xtend = require("xtend");

module.exports = function(context) {
  var router = {};

  router.on = function() {
    d3.select(window).on("hashchange.router", route);
    context.dispatch.on("change.route", unroute);
    context.dispatch.call("route", router, getQuery());
    return router;
  };

  router.off = function() {
    d3.select(window).on("hashchange.router", null);
    return router;
  };

  function route() {
    var oldHash = d3.event.oldURL.split("#")[1] || "",
      newHash = d3.event.newURL.split("#")[1] || "",
      oldQuery = qs.stringQs(oldHash),
      newQuery = qs.stringQs(newHash);

    if (isOld(oldHash)) return upgrade(oldHash);
    if (newQuery.id !== oldQuery.id)
      context.dispatch.call("route", router, newQuery);
  }

  function isOld(id) {
    return (
      id.indexOf("gist") === 0 ||
      id.indexOf("github") === 0 ||
      !isNaN(parseInt(id, 10))
    );
  }

  function upgrade(id) {
    var split;
    if (isNaN(parseInt(id, 10))) {
      split = id.split(":");
      location.hash =
        "#id=" +
        (split[1].indexOf("/") === 0
          ? [split[0], split[1].substring(1)].join(":")
          : id);
    } else {
      location.hash = "#id=gist:/" + id;
    }
  }

  function unroute() {
    var query = getQuery();
    var rev = reverseRoute();
    if (rev.id && query.id !== rev.id) {
      location.hash = "#" + qs.qsString(rev);
    }
  }

  function getQuery() {
    return qs.stringQs(window.location.hash.substring(1));
  }

  function reverseRoute() {
    var query = getQuery();

    return xtend(query, {
      id: context.data.get("route")
    });
  }

  return router;
};
