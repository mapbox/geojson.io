var d3 = require("d3");
var config = require("../config.js")(location.hostname);

module.exports = function(context) {
  var user = {};

  user.details = function(callback) {
    if (!context.storage.get("github_token"))
      return callback(new Error("not logged in"));

    var cached = context.storage.get("github_user_details");

    if (cached && cached.when > +new Date() - 1000 * 60 * 60) {
      callback(null, cached.data);
    } else {
      context.storage.remove("github_user_details");
      var endpoint = config.GithubAPI
        ? config.GithubAPI + "/api/v3"
        : "https://api.github.com";

      d3
        .json(endpoint + "/user")
        .header("Authorization", "token " + context.storage.get("github_token"))
        .on("load", onload)
        .on("error", onerror)
        .get();
    }

    function onload(user) {
      context.storage.set("github_user_details", {
        when: +new Date(),
        data: user
      });
      context.storage.set("github_user", user);
      callback(null, user);
    }

    function onerror() {
      user.logout();
      context.storage.remove("github_user_details");
      callback(new Error("not logged in"));
    }
  };

  user.signXHR = function(xhr) {
    return user.token()
      ? xhr.header("Authorization", "token " + user.token())
      : xhr;
  };

  user.authenticate = function() {
    window.location.href = config.authService + "/login";
  };

  user.token = function(callback) {
    return context.storage.get("github_token");
  };

  user.logout = function() {
    context.storage.remove("github_token");
  };

  user.login = function() {
    context.storage.remove("github_token");
  };

  function killTokenUrl() {
    if (window.location.href.indexOf("?access_token") !== -1) {
      window.location.href = window.location.href.replace(
        /\?access_token=.*$/,
        ""
      );
    }
  }

  if (
    window.location.search &&
    window.location.search.indexOf("?access_token") === 0
  ) {
    var accessToken = window.location.search.replace(
      /\?{0,1}access_token=([^\#\&]+).*$/g,
      "$1"
    );
    window.localStorage.github_token = accessToken;
    killTokenUrl();
  }

  return user;
};
