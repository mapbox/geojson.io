import React from "react";
import L from "leaflet";
import keybinding from "../../lib/d3.keybinding";
import shpwrite from "shp-write";
import clone from "clone";
import geojson2dsv from "geojson2dsv";
import togpx from "togpx";
import topojson from "topojson";
import { saveAs } from "file-saver";
import tokml from "tokml";
import githubBrowser from "./file_browser.js";
import gistBrowser from "@mapbox/gist-map-browser";
import geojsonNormalize from "geojson-normalize";
import wellknown from "wellknown";
import config from "../config.js";

const shpSupport = typeof ArrayBuffer !== "undefined";

const githubAPI = !!config.GithubAPI;
const githubBase = githubAPI
  ? config.GithubAPI + "/api/v3"
  : "https://api.github.com";

export default class FileBar extends React.Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
  }
  blindImport = () => {
    this.fileInputRef.current.click();
  };
  onFileInputChange = e => {
    var files = e.target.files;
    if (!(files && files[0])) return;
    readFile.readAsText(files[0], function(err, text) {
      readFile.readFile(files[0], text, onImport);
      if (files[0].path) {
        // context.data.set({
        //   path: files[0].path
        // });
      }
    });
    put.remove();
  };

  downloadTopo = () => {
    const { geojson } = this.props;
    var content = JSON.stringify(
      topojson.topology(
        {
          collection: clone(geojson)
        },
        {
          "property-transform": function(properties, key, value) {
            properties[key] = value;
            return true;
          }
        }
      )
    );

    saveAs(
      new Blob([content], {
        type: "text/plain;charset=utf-8"
      }),
      "map.topojson"
    );
  };

  downloadGPX = () => {
    var content = togpx(clone(context.data.get("map")), {
      creator: "geojson.net"
    });

    saveAs(
      new Blob([content], {
        type: "text/xml;charset=utf-8"
      }),
      "map.gpx"
    );
  };

  downloadGeoJSON = () => {
    const { geojson } = this.props;
    saveAs(
      new Blob([JSON.stringify(geojson, null, 2)], {
        type: "text/plain;charset=utf-8"
      }),
      "map.geojson"
    );
  };

  downloadDSV = () => {
    const { geojson } = this.props;
    var content = geojson2dsv(geojson);
    saveAs(
      new Blob([content], {
        type: "text/plain;charset=utf-8"
      }),
      "points.csv"
    );
  };

  downloadKML = () => {
    const { geojson } = this.props;
    var content = tokml(geojson);
    saveAs(
      new Blob([content], {
        type: "text/plain;charset=utf-8"
      }),
      "map.kml"
    );
  };

  downloadShp = () => {
    d3.select(".map").classed("loading", true);
    try {
      shpwrite.download(context.data.get("map"));
    } finally {
      d3.select(".map").classed("loading", false);
    }
  };

  downloadWKT = () => {
    var contentArray = [];
    var features = context.data.get("map").features;
    if (features.length === 0) return;
    var content = features.map(wellknown.stringify).join("\n");
    saveAs(
      new Blob([content], {
        type: "text/plain;charset=utf-8"
      }),
      "map.wkt"
    );
  };

  render() {
    const exportFormats = [
      {
        title: "GeoJSON",
        action: this.downloadGeoJSON
      },
      {
        title: "TopoJSON",
        action: this.downloadTopo
      },
      {
        title: "GPX",
        action: this.downloadGPX
      },
      {
        title: "CSV",
        action: this.downloadDSV
      },
      {
        title: "KML",
        action: this.downloadKML
      },
      {
        title: "WKT",
        action: this.downloadWKT
      }
    ];
    var actions = [
      {
        title: "Save",
        action: githubAPI ? saveAction : function() {},
        children: exportFormats
      },
      {
        title: "New",
        action: function() {
          window.open(
            window.location.origin + window.location.pathname + "#new"
          );
        }
      },
      {
        title: "Meta",
        action: function() {},
        children: [
          {
            title: "Add map layer",
            alt: "Add a custom tile layer",
            action: function() {
              var layerURL = prompt(
                "Layer URL \n(https://tile.stamen.com/watercolor/{z}/{x}/{y}.jpg)"
              );
              if (layerURL === null) return;
              var layerName = prompt("Layer name");
              if (layerName === null) return;
              meta.adduserlayer(context, layerURL, layerName);
            }
          },
          {
            title: "Zoom to features",
            alt: "Zoom to the extent of all features",
            action: function() {
              meta.zoomextent(context);
            }
          },
          {
            title: "Clear",
            alt: "Delete all features from the map",
            action: function() {
              if (
                confirm(
                  "Are you sure you want to delete all features from this map?"
                )
              ) {
                meta.clear(context);
              }
            }
          },
          {
            title: "Random: Points",
            alt: "Add random points to your map",
            action: function() {
              var response = prompt("Number of points (default: 100)");
              if (response === null) return;
              var count = parseInt(response, 10);
              if (isNaN(count)) count = 100;
              meta.random(context, count, "point");
            }
          },
          {
            title: "Add bboxes",
            alt: "Add bounding box members to all applicable GeoJSON objects",
            action: function() {
              meta.bboxify(context);
            }
          },
          {
            title: "Flatten Multi Features",
            alt:
              "Flatten MultiPolygons, MultiLines, and GeometryCollections into simple geometries",
            action: function() {
              meta.flatten(context);
            }
          },
          {
            title: "Load encoded polyline",
            alt:
              "Decode and show an encoded polyline. Precision 5 is supported.",
            action: function() {
              meta.polyline(context);
            }
          },
          {
            title: "Load WKB Base64 Encoded String",
            alt: "Decode and show WKX data",
            action: function() {
              meta.wkxBase64(context);
            }
          },
          {
            title: "Load WKB Hex Encoded String",
            alt: "Decode and show WKX data",
            action: function() {
              meta.wkxHex(context);
            }
          },
          {
            title: "Load WKT String",
            alt: "Decode and show WKX data",
            action: function() {
              meta.wkxString(context);
            }
          }
        ]
      }
    ];

    if (githubAPI) {
      actions.unshift({
        title: "Open",
        children: [
          {
            title: "File",
            alt: "GeoJSON, TopoJSON, GTFS, KML, CSV, GPX and OSM XML supported",
            action: this.blindImport
          },
          {
            title: "GitHub",
            alt: "GeoJSON files in GitHub Repositories",
            authenticated: true,
            action: clickGitHubOpen
          },
          {
            title: "Gist",
            alt: "GeoJSON files in GitHub Gists",
            authenticated: true,
            action: clickGist
          }
        ]
      });
      actions[1].children.unshift(
        {
          title: "GitHub",
          alt: "GeoJSON files in GitHub Repositories",
          authenticated: true,
          action: clickGitHubSave
        },
        {
          title: "Gist",
          alt: "GeoJSON files in GitHub Gists",
          authenticated: true,
          action: clickGistSave
        }
      );

      actions.splice(3, 0, {
        title: "Share",
        action: function() {
          context.container.call(share(context));
        }
      });
    } else {
      actions.unshift({
        title: "Open",
        alt: "CSV, GTFS, KML, GPX, and other filetypes",
        action: this.blindImport
      });
    }

    return (
      <div className="inline-flex">
        {actions.map((item, i) => {
          return (
            <div
              key={i}
              style={{ zIndex: 999 }}
              onClick={item.action}
              className="db bn pv1 ph2 br2 br--top outline-0 hide-child relative pointer black-50 hover-black f6"
            >
              {item.title}
              {item.children ? (
                <div
                  className="child bg-white absolute w4"
                  style={{
                    top: 24
                  }}
                >
                  {item.children.map((child, i) => {
                    return (
                      <div
                        onClick={child.action}
                        key={i}
                        className={`bn pv1 ph2 outline-0 tl f6 db hover-bg-blue hover-white w-100 pointer`}
                      >
                        {child.title}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        <input
          type="file"
          className="dn"
          ref={this.fileInputRef}
          onChange={this.onFileInputChange}
        />
      </div>
    );
  }
}

if (githubAPI) {
  var filetype = name
    .append("a")
    .attr("target", "_blank")
    .attr("class", "icon-file-alt");

  var filename = name
    .append("span")
    .attr("class", "filename")
    .text("unsaved");
}

function clickGistSave() {
  context.data.set({ type: "gist" });
  saver(context);
}

function saveAction() {
  saver(context);
}

function sourceIcon(type) {
  if (type == "github") return "icon-github";
  else if (type == "gist") return "icon-github-alt";
  else return "icon-file-alt";
}

function saveNoun(_) {
  buttons
    .filter(function(b) {
      return b.title === "Save";
    })
    .select("span.title")
    .text(_);
}

function submenu(children) {
  return function(selection) {
    selection
      .selectAll("a")
      .data(children)
      .enter()
      .append("a")
      .attr("title", function(d) {
        if (
          d.title == "File" ||
          d.title == "GitHub" ||
          d.title == "Gist" ||
          d.title == "Add map layer" ||
          d.title == "Zoom to features" ||
          d.title == "Clear" ||
          d.title == "Random: Points" ||
          d.title == "Add bboxes" ||
          d.title == "Flatten Multi Features"
        )
          return d.alt;
      })
      .text(function(d) {
        return d.title;
      })
      .on("click", function(d) {
        d.action.apply(this, d);
      });
  };
}

function clickGitHubOpen() {
  if (!context.user.token())
    return flash(context.container, "You must authenticate to use this API.");

  var m = modal(d3.select("div.geojsonio"));

  m.select(".m").attr("class", "modal-splash modal col6");

  m
    .select(".content")
    .append("div")
    .attr("class", "header pad2 fillD")
    .append("h1")
    .text("GitHub");

  githubBrowser(context.user.token(), false, githubBase)
    .open()
    .onclick(function(d) {
      if (!d || !d.length) return;
      var last = d[d.length - 1];
      if (!last.path) {
        throw new Error("last is invalid: " + JSON.stringify(last));
      }
      if (!last.path.match(/\.(geo)?json/i)) {
        return alert("only GeoJSON files are supported from GitHub");
      }
      if (last.type === "blob") {
        githubBrowser.request(
          "/repos/" + d[1].full_name + "/git/blobs/" + last.sha,
          function(err, blob) {
            d.content = JSON.parse(
              decodeURIComponent(
                Array.prototype.map
                  .call(atob(blob[0].content), function(c) {
                    return (
                      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                    );
                  })
                  .join("")
              )
            );
            context.data.parse(d);
            zoomextent(context);
            m.close();
          }
        );
      }
    })
    .appendTo(
      m
        .select(".content")
        .append("div")
        .attr("class", "repos pad2")
        .node()
    );
}

function clickGitHubSave() {
  if (!context.user.token())
    return flash(context.container, "You must authenticate to use this API.");

  var m = modal(d3.select("div.geojsonio"));

  m.select(".m").attr("class", "modal-splash modal col6");

  m
    .select(".content")
    .append("div")
    .attr("class", "header pad2 fillD")
    .append("h1")
    .text("GitHub");

  githubBrowser(context.user.token(), true, githubBase)
    .open()
    .onclick(function(d) {
      if (!d || !d.length) return;
      var last = d[d.length - 1];
      var pathparts;
      var partial;

      // New file
      if (last.type === "new") {
        var filename = prompt("New file name");
        if (!filename) {
          m.close();
          return;
        }
        pathparts = d.slice(3);
        pathparts.pop();
        pathparts.push({ path: filename });
        partial = pathparts
          .map(function(p) {
            return p.path;
          })
          .join("/");
        context.data.set({
          source: {
            url:
              githubBase +
              "/repos/" +
              d[0].login +
              "/" +
              d[1].name +
              "/contents/" +
              partial +
              "?ref=" +
              d[2].name
          },
          type: "github",
          meta: {
            branch: d[2].name,
            login: d[0].login,
            repo: d[1].name
          }
        });
        context.data.set({ newpath: partial + filename });
        m.close();
        saver(context);
      }
      // Update a file
      else if (last.type === "blob") {
        // Build the path
        pathparts = d.slice(3);
        partial = pathparts
          .map(function(p) {
            return p.path;
          })
          .join("/");

        context.data.set({
          source: {
            url:
              githubBase +
              "/repos/" +
              d[0].login +
              "/" +
              d[1].name +
              "/contents/" +
              partial +
              "?ref=" +
              d[2].name,
            sha: last.sha
          },
          type: "github",
          meta: {
            branch: d[2].name,
            login: d[0].login,
            repo: d[1].name
          }
        });
        m.close();
        saver(context);
      }
    })
    .appendTo(
      m
        .select(".content")
        .append("div")
        .attr("class", "repos pad2")
        .node()
    );
}

function clickGist() {
  if (!context.user.token())
    return flash(context.container, "You must authenticate to use this API.");

  var m = modal(d3.select("div.geojsonio"));

  m.select(".m").attr("class", "modal-splash modal col6");

  gistBrowser(context.user.token(), githubBase)
    .open()
    .onclick(function(d) {
      context.data.parse(d);
      zoomextent(context);
      m.close();
    })
    .appendTo(
      m
        .select(".content")
        .append("div")
        .attr("class", "repos pad2")
        .node()
    );
}

function onchange(d) {
  var data = d.obj,
    type = data.type,
    path = data.path;
  if (githubAPI)
    filename
      .text(path ? path : "unsaved")
      .classed("deemphasize", context.data.dirty);
  if (githubAPI)
    filetype.attr("href", data.url).attr("class", sourceIcon(type));
  saveNoun(type == "github" ? "Commit" : "Save");
}

function onImport(err, gj, warning) {
  if (err) {
    if (err.message) {
      flash(context.container, err.message).classed("error", "true");
    }
    return;
  }
  gj = geojsonNormalize(gj);
  if (gj) {
    context.data.mergeFeatures(gj.features);
    if (warning) {
      flash(context.container, warning.message);
    } else {
      flash(
        context.container,
        "Imported " + gj.features.length + " features."
      ).classed("success", "true");
    }
    zoomextent(context);
  }
}
