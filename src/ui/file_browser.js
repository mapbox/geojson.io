var d3 = require("d3");
var queue = require("d3").queue,
  request = require("browser-request"),
  treeui = require("treeui"),
  token;

var base = "https://api.github.com";

var create = false;

module.exports = function(_, _create, endpoint) {
  token = _;
  if (_create !== undefined) create = _create;
  base = endpoint || base;
  return module.exports;
};

module.exports.open = open;
module.exports.request = req;

function open() {
  var out = treeui(treeRequest)
    .expandable(function(res) {
      var last = res[res.length - 1];
      return (
        last.type !== "blob" && last.type !== "commit" && last.type !== "new"
      );
    })
    .display(function(res) {
      var last = res[res.length - 1];
      return last.name || last.login || last.path;
    });

  return out;
}

function treeRequest(tree, callback) {
  if (tree.length === 0) {
    req("/user", function(err, user) {
      req("/user/orgs", function(err, res) {
        var orgs = res.map(function(_) {
          return [_];
        });
        callback(null, [user].concat(orgs));
      });
    });
  } else if (tree.length === 1) {
    if (tree[0].type === "User") {
      req("/users/" + tree[0].login + "/repos", function(err, res) {
        callback(
          null,
          res.map(function(_) {
            return [tree[0], _];
          })
        );
      });
    } else {
      req("/orgs/" + tree[0].login + "/repos", function(err, res) {
        callback(
          null,
          res.map(function(_) {
            return [tree[0], _];
          })
        );
      });
    }
  } else if (tree.length === 2) {
    req("/repos/" + tree[1].full_name + "/branches", function(err, res) {
      callback(
        null,
        res.map(function(_) {
          return [tree[0], tree[1], _];
        })
      );
    });
  } else if (tree.length === 3) {
    req(
      "/repos/" + tree[1].full_name + "/git/trees/" + tree[2].commit.sha,
      function(err, res) {
        var r = [];
        if (!res.length && res.tree) res = [res];
        for (var i = 0; i < res.length; i++) {
          for (var j = 0; j < res[i].tree.length; j++) {
            r.push([tree[0], tree[1], tree[2], res[i].tree[j]]);
          }
        }
        if (create) {
          r.push([
            tree[0],
            tree[1],
            tree[2],
            {
              type: "new",
              name: "+ New File"
            }
          ]);
        }
        callback(null, r);
      }
    );
  } else if (tree.length > 3) {
    req(
      "/repos/" + tree[1].full_name + "/git/trees/" + tree[tree.length - 1].sha,
      function(err, res) {
        var r = [];
        if (!res.length && res.tree) res = [res];
        for (var i = 0; i < res.length; i++) {
          for (var j = 0; j < res[i].tree.length; j++) {
            r.push(tree.concat([res[i].tree[j]]));
          }
        }
        if (create) {
          r.push([
            tree[0],
            tree[1],
            tree[2],
            {
              type: "new",
              name: "+ New File"
            }
          ]);
        }
        callback(null, r);
      }
    );
  }
}

function req(postfix, callback) {
  var q = queue(1);
  q.defer(page, null).awaitAll(function(err, res) {
    if (res) {
      var flat = res.reduce(function(mem, r) {
        return mem.concat(r);
      }, []);
      callback(err, flat);
    } else {
      callback(err);
    }
  });

  function page(url, callback) {
    request(
      {
        uri: url || base + postfix,
        headers: {
          Authorization: "token " + token
        },
        json: true,
        crossOrigin: true
      },
      function(err, res, body) {
        var link = (res.getResponseHeader("Link") || "").match(
          /\<([^\>]+)\>\; rel="next"/
        );
        if (link) {
          q.defer(page, link[1]);
        }
        callback(null, body);
      }
    );
  }
}
