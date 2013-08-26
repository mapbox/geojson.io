require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],"PBmiWO":[function(require,module,exports){
var fs = require("fs");

var topojson = module.exports = new Function("topojson", "return " + "topojson = (function() {\n\n  function merge(topology, arcs) {\n    var fragmentByStart = {},\n        fragmentByEnd = {};\n\n    arcs.forEach(function(i) {\n      var e = ends(i),\n          start = e[0],\n          end = e[1],\n          f, g;\n\n      if (f = fragmentByEnd[start]) {\n        delete fragmentByEnd[f.end];\n        f.push(i);\n        f.end = end;\n        if (g = fragmentByStart[end]) {\n          delete fragmentByStart[g.start];\n          var fg = g === f ? f : f.concat(g);\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;\n        } else if (g = fragmentByEnd[end]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByStart[end]) {\n        delete fragmentByStart[f.start];\n        f.unshift(i);\n        f.start = start;\n        if (g = fragmentByEnd[start]) {\n          delete fragmentByEnd[g.end];\n          var gf = g === f ? f : g.concat(f);\n          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;\n        } else if (g = fragmentByStart[start]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);\n          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByStart[start]) {\n        delete fragmentByStart[f.start];\n        f.unshift(~i);\n        f.start = end;\n        if (g = fragmentByEnd[end]) {\n          delete fragmentByEnd[g.end];\n          var gf = g === f ? f : g.concat(f);\n          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;\n        } else if (g = fragmentByStart[end]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);\n          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByEnd[end]) {\n        delete fragmentByEnd[f.end];\n        f.push(~i);\n        f.end = start;\n        if (g = fragmentByEnd[start]) {\n          delete fragmentByStart[g.start];\n          var fg = g === f ? f : f.concat(g);\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;\n        } else if (g = fragmentByStart[start]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else {\n        f = [i];\n        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;\n      }\n    });\n\n    function ends(i) {\n      var arc = topology.arcs[i], p0 = arc[0], p1 = [0, 0];\n      arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });\n      return [p0, p1];\n    }\n\n    var fragments = [];\n    for (var k in fragmentByEnd) fragments.push(fragmentByEnd[k]);\n    return fragments;\n  }\n\n  function mesh(topology, o, filter) {\n    var arcs = [];\n\n    if (arguments.length > 1) {\n      var geomsByArc = [],\n          geom;\n\n      function arc(i) {\n        if (i < 0) i = ~i;\n        (geomsByArc[i] || (geomsByArc[i] = [])).push(geom);\n      }\n\n      function line(arcs) {\n        arcs.forEach(arc);\n      }\n\n      function polygon(arcs) {\n        arcs.forEach(line);\n      }\n\n      function geometry(o) {\n        if (o.type === \"GeometryCollection\") o.geometries.forEach(geometry);\n        else if (o.type in geometryType) {\n          geom = o;\n          geometryType[o.type](o.arcs);\n        }\n      }\n\n      var geometryType = {\n        LineString: line,\n        MultiLineString: polygon,\n        Polygon: polygon,\n        MultiPolygon: function(arcs) { arcs.forEach(polygon); }\n      };\n\n      geometry(o);\n\n      geomsByArc.forEach(arguments.length < 3\n          ? function(geoms, i) { arcs.push(i); }\n          : function(geoms, i) { if (filter(geoms[0], geoms[geoms.length - 1])) arcs.push(i); });\n    } else {\n      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);\n    }\n\n    return object(topology, {type: \"MultiLineString\", arcs: merge(topology, arcs)});\n  }\n\n  function featureOrCollection(topology, o) {\n    return o.type === \"GeometryCollection\" ? {\n      type: \"FeatureCollection\",\n      features: o.geometries.map(function(o) { return feature(topology, o); })\n    } : feature(topology, o);\n  }\n\n  function feature(topology, o) {\n    var f = {\n      type: \"Feature\",\n      id: o.id,\n      properties: o.properties || {},\n      geometry: object(topology, o)\n    };\n    if (o.id == null) delete f.id;\n    return f;\n  }\n\n  function object(topology, o) {\n    var tf = topology.transform,\n        kx = tf.scale[0],\n        ky = tf.scale[1],\n        dx = tf.translate[0],\n        dy = tf.translate[1],\n        arcs = topology.arcs;\n\n    function arc(i, points) {\n      if (points.length) points.pop();\n      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, x = 0, y = 0, p; k < n; ++k) points.push([\n        (x += (p = a[k])[0]) * kx + dx,\n        (y += p[1]) * ky + dy\n      ]);\n      if (i < 0) reverse(points, n);\n    }\n\n    function point(coordinates) {\n      return [coordinates[0] * kx + dx, coordinates[1] * ky + dy];\n    }\n\n    function line(arcs) {\n      var points = [];\n      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);\n      if (points.length < 2) points.push(points[0].slice());\n      return points;\n    }\n\n    function ring(arcs) {\n      var points = line(arcs);\n      while (points.length < 4) points.push(points[0].slice());\n      return points;\n    }\n\n    function polygon(arcs) {\n      return arcs.map(ring);\n    }\n\n    function geometry(o) {\n      var t = o.type;\n      return t === \"GeometryCollection\" ? {type: t, geometries: o.geometries.map(geometry)}\n          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}\n          : null;\n    }\n\n    var geometryType = {\n      Point: function(o) { return point(o.coordinates); },\n      MultiPoint: function(o) { return o.coordinates.map(point); },\n      LineString: function(o) { return line(o.arcs); },\n      MultiLineString: function(o) { return o.arcs.map(line); },\n      Polygon: function(o) { return polygon(o.arcs); },\n      MultiPolygon: function(o) { return o.arcs.map(polygon); }\n    };\n\n    return geometry(o);\n  }\n\n  function reverse(array, n) {\n    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;\n  }\n\n  function bisect(a, x) {\n    var lo = 0, hi = a.length;\n    while (lo < hi) {\n      var mid = lo + hi >>> 1;\n      if (a[mid] < x) lo = mid + 1;\n      else hi = mid;\n    }\n    return lo;\n  }\n\n  function neighbors(objects) {\n    var indexesByArc = {}, // arc index -> array of object indexes\n        neighbors = objects.map(function() { return []; });\n\n    function line(arcs, i) {\n      arcs.forEach(function(a) {\n        if (a < 0) a = ~a;\n        var o = indexesByArc[a];\n        if (o) o.push(i);\n        else indexesByArc[a] = [i];\n      });\n    }\n\n    function polygon(arcs, i) {\n      arcs.forEach(function(arc) { line(arc, i); });\n    }\n\n    function geometry(o, i) {\n      if (o.type === \"GeometryCollection\") o.geometries.forEach(function(o) { geometry(o, i); });\n      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);\n    }\n\n    var geometryType = {\n      LineString: line,\n      MultiLineString: polygon,\n      Polygon: polygon,\n      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }\n    };\n\n    objects.forEach(geometry);\n\n    for (var i in indexesByArc) {\n      for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {\n        for (var k = j + 1; k < m; ++k) {\n          var ij = indexes[j], ik = indexes[k], n;\n          if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);\n          if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);\n        }\n      }\n    }\n\n    return neighbors;\n  }\n\n  return {\n    version: \"1.2.3\",\n    mesh: mesh,\n    feature: featureOrCollection,\n    neighbors: neighbors\n  };\n})();\n")();
topojson.topology = require("./lib/topojson/topology");
topojson.simplify = require("./lib/topojson/simplify");
topojson.clockwise = require("./lib/topojson/clockwise");
topojson.filter = require("./lib/topojson/filter");
topojson.prune = require("./lib/topojson/prune");
topojson.bind = require("./lib/topojson/bind");

},{"./lib/topojson/bind":3,"./lib/topojson/clockwise":5,"./lib/topojson/filter":7,"./lib/topojson/prune":11,"./lib/topojson/simplify":12,"./lib/topojson/topology":15,"fs":1}],3:[function(require,module,exports){
var type = require("./type"),
    topojson = require("../../");

module.exports = function(topology, propertiesById) {
  var bind = type({
    geometry: function(geometry) {
      var properties0 = geometry.properties,
          properties1 = propertiesById[geometry.id];
      if (properties1) {
        if (properties0) for (var k in properties1) properties0[k] = properties1[k];
        else for (var k in properties1) { geometry.properties = properties1; break; }
      }
      this.defaults.geometry.call(this, geometry);
    },
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: noop,
    MultiPolygon: noop
  });

  for (var key in topology.objects) {
    bind.object(topology.objects[key]);
  }
};

function noop() {}

},{"../../":"PBmiWO","./type":16}],4:[function(require,module,exports){
exports.name = "cartesian";
exports.formatDistance = formatDistance;
exports.ringArea = ringArea;
exports.absoluteArea = Math.abs;
exports.triangleArea = triangleArea;
exports.distance = distance;

function formatDistance(d) {
  return d.toString();
}

function ringArea(ring) {
  var i = 0,
      n = ring.length,
      area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) {
    area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  }
  return area * .5;
}

function triangleArea(triangle) {
  return Math.abs(
    (triangle[0][0] - triangle[2][0]) * (triangle[1][1] - triangle[0][1])
    - (triangle[0][0] - triangle[1][0]) * (triangle[2][1] - triangle[0][1])
  );
}

function distance(x0, y0, x1, y1) {
  var dx = x0 - x1, dy = y0 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

},{}],5:[function(require,module,exports){
var type = require("./type"),
    systems = require("./coordinate-systems"),
    topojson = require("../../");

module.exports = function(object, options) {
  if (object.type === "Topology") clockwiseTopology(object, options);
  else clockwiseGeometry(object, options);
};

function clockwiseGeometry(object, options) {
  var system = null;

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]);

  type({
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) { clockwisePolygon(polygon.coordinates); },
    MultiPolygon: function(multiPolygon) { multiPolygon.coordinates.forEach(clockwisePolygon); }
  }).object(object);

  function clockwisePolygon(rings) {
    if (rings.length && system.ringArea(r = rings[0]) < 0) r.reverse();
    for (var i = 1, n = rings.length, r; i < n; ++i) {
      if (system.ringArea(r = rings[i]) > 0) r.reverse();
    }
  }
}

function clockwiseTopology(topology, options) {
  var system = null;

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]);

  var clockwise = type({
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) { clockwisePolygon(polygon.arcs); },
    MultiPolygon: function(multiPolygon) { multiPolygon.arcs.forEach(clockwisePolygon); }
  });

  for (var key in topology.objects) {
    clockwise.object(topology.objects[key]);
  }

  function clockwisePolygon(rings) {
    if (rings.length && ringArea(r = rings[0]) < 0) reverse(r);
    for (var i = 1, n = rings.length, r; i < n; ++i) {
      if (ringArea(r = rings[i]) > 0) reverse(r);
    }
  }

  function ringArea(ring) {
    return system.ringArea(topojson.feature(topology, {type: "Polygon", arcs: [ring]}).geometry.coordinates[0]);
  }

  // TODO It might be slightly more compact to reverse the arc.
  function reverse(ring) {
    var i = -1, n = ring.length;
    ring.reverse();
    while (++i < n) ring[i] = ~ring[i];
  }
};

function noop() {}

},{"../../":"PBmiWO","./coordinate-systems":6,"./type":16}],6:[function(require,module,exports){
module.exports = {
  cartesian: require("./cartesian"),
  spherical: require("./spherical")
};

},{"./cartesian":4,"./spherical":13}],7:[function(require,module,exports){
var type = require("./type"),
    prune = require("./prune"),
    clockwise = require("./clockwise"),
    systems = require("./coordinate-systems"),
    topojson = require("../../");

module.exports = function(topology, options) {
  var system = null,
      forceClockwise = true; // force exterior rings to be clockwise?

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "force-clockwise" in options && (forceClockwise = !!options["force-clockwise"]);

  if (forceClockwise) clockwise(topology, options); // deprecated; for backwards-compatibility

  var filter = type({
    LineString: noop, // TODO remove empty lines
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) {
      polygon.arcs = polygon.arcs.filter(ringArea);
      if (!polygon.arcs.length) {
        polygon.type = null;
        delete polygon.arcs;
      }
    },
    MultiPolygon: function(multiPolygon) {
      multiPolygon.arcs = multiPolygon.arcs.map(function(polygon) {
        return polygon.filter(ringArea);
      }).filter(function(polygon) {
        return polygon.length;
      });
      if (!multiPolygon.arcs.length) {
        multiPolygon.type = null;
        delete multiPolygon.arcs;
      }
    },
    GeometryCollection: function(collection) {
      this.defaults.GeometryCollection.call(this, collection);
      collection.geometries = collection.geometries.filter(function(geometry) { return geometry.type != null; });
      if (!collection.geometries.length) {
        collection.type = null;
        delete collection.geometries;
      }
    }
  });

  for (var key in topology.objects) {
    filter.object(topology.objects[key]);
  }

  prune(topology, options);

  function ringArea(ring) {
    return system.absoluteArea(system.ringArea(topojson.feature(topology, {type: "Polygon", arcs: [ring]}).geometry.coordinates[0]));
  }
};

// TODO It might be slightly more compact to reverse the arc.
function reverse(ring) {
  var i = -1, n = ring.length;
  ring.reverse();
  while (++i < n) ring[i] = ~ring[i];
}

function noop() {}

},{"../../":"PBmiWO","./clockwise":5,"./coordinate-systems":6,"./prune":11,"./type":16}],8:[function(require,module,exports){
// Note: requires that size is a power of two!
module.exports = function(size) {
  var mask = size - 1;
  return function(point) {
    var key = (point[0] + 31 * point[1]) | 0;
    return (key < 0 ? ~key : key) & mask;
  };
};

},{}],9:[function(require,module,exports){
var hasher = require("./hash");

module.exports = function(size) {
  var hashtable = new Array(size = 1 << Math.ceil(Math.log(size) / Math.LN2)),
      hash = hasher(size);
  return {
    size: size,
    peek: function(key) {
      var matches = hashtable[hash(key)];

      if (matches) {
        var i = -1,
            n = matches.length,
            match;
        while (++i < n) {
          match = matches[i];
          if (equal(match.key, key)) {
            return match.values;
          }
        }
      }

      return null;
    },
    get: function(key) {
      var index = hash(key),
          matches = hashtable[index];

      if (matches) {
        var i = -1,
            n = matches.length,
            match;
        while (++i < n) {
          match = matches[i];
          if (equal(match.key, key)) {
            return match.values;
          }
        }
      } else {
        matches = hashtable[index] = [];
      }

      var values = [];
      matches.push({key: key, values: values});
      return values;
    }
  };
};

function equal(keyA, keyB) {
  return keyA[0] === keyB[0]
      && keyA[1] === keyB[1];
}

},{"./hash":8}],10:[function(require,module,exports){
module.exports = function() {
  var heap = {},
      array = [];

  heap.push = function() {
    for (var i = 0, n = arguments.length; i < n; ++i) {
      var object = arguments[i];
      up(object.index = array.push(object) - 1);
    }
    return array.length;
  };

  heap.pop = function() {
    var removed = array[0],
        object = array.pop();
    if (array.length) {
      array[object.index = 0] = object;
      down(0);
    }
    return removed;
  };

  heap.remove = function(removed) {
    var i = removed.index,
        object = array.pop();
    if (i !== array.length) {
      array[object.index = i] = object;
      (compare(object, removed) < 0 ? up : down)(i);
    }
    return i;
  };

  function up(i) {
    var object = array[i];
    while (i > 0) {
      var up = ((i + 1) >> 1) - 1,
          parent = array[up];
      if (compare(object, parent) >= 0) break;
      array[parent.index = i] = parent;
      array[object.index = i = up] = object;
    }
  }

  function down(i) {
    var object = array[i];
    while (true) {
      var right = (i + 1) << 1,
          left = right - 1,
          down = i,
          child = array[down];
      if (left < array.length && compare(array[left], child) < 0) child = array[down = left];
      if (right < array.length && compare(array[right], child) < 0) child = array[down = right];
      if (down === i) break;
      array[child.index = i] = child;
      array[object.index = i = down] = object;
    }
  }

  return heap;
};

function compare(a, b) {
  return a[1].area - b[1].area;
}

},{}],11:[function(require,module,exports){
var type = require("./type"),
    topojson = require("../../");

module.exports = function(topology, options) {
  var verbose = false,
      retained = [],
      j = -1,
      n = topology.arcs.length;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]);

  var prune = type({
    LineString: function(lineString) {
      this.line(lineString.arcs);
    },
    MultiLineString: function(multiLineString) {
      var arcs = multiLineString.arcs, i = -1, n = arcs.length;
      while (++i < n) this.line(arcs[i]);
    },
    MultiPoint: noop,
    MultiPolygon: function(multiPolygon) {
      var arcs = multiPolygon.arcs, i = -1, n = arcs.length;
      while (++i < n) this.polygon(arcs[i]);
    },
    Point: noop,
    Polygon: function(polygon) {
      this.polygon(polygon.arcs);
    },
    line: function(arcs) {
      var i = -1, n = arcs.length, arc, reversed;
      while (++i < n) {
        arc = arcs[i];
        if (reversed = arc < 0) arc = ~arc;
        if (retained[arc] == null) retained[arc] = ++j, arc = j;
        else arc = retained[arc];
        arcs[i] = reversed ? ~arc : arc;
      }
    },
    polygon: function(arcs) {
      var i = -1, n = arcs.length;
      while (++i < n) this.line(arcs[i]);
    }
  });

  for (var key in topology.objects) {
    prune.object(topology.objects[key]);
  }

  if (verbose) console.warn("prune: retained " + (j + 1) + " / " + n + " arcs (" + Math.round((j + 1) / n * 100) + "%)");

  var arcs = [];
  retained.forEach(function(i, j) { arcs[i] = topology.arcs[j]; });
  topology.arcs = arcs;
};

function noop() {}

},{"../../":"PBmiWO","./type":16}],12:[function(require,module,exports){
var minHeap = require("./min-heap"),
    systems = require("./coordinate-systems");

module.exports = function(topology, options) {
  var mininumArea = 0,
      retainProportion,
      verbose = false,
      heap = minHeap(),
      maxArea = 0,
      system = null,
      triangle,
      N = 0,
      M = 0;

  if (options)
    "minimum-area" in options && (mininumArea = +options["minimum-area"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "retain-proportion" in options && (retainProportion = +options["retain-proportion"]),
    "verbose" in options && (verbose = !!options["verbose"]);

  topology.arcs.forEach(function(arc) {
    var triangles = [];

    arc.forEach(transformAbsolute(topology.transform));

    for (var i = 1, n = arc.length - 1; i < n; ++i) {
      triangle = arc.slice(i - 1, i + 2);
      triangle[1].area = system.triangleArea(triangle);
      triangles.push(triangle);
      heap.push(triangle);
    }

    // Always keep the arc endpoints!
    arc[0].area = arc[n].area = Infinity;

    N += n + 1;

    for (var i = 0, n = triangles.length; i < n; ++i) {
      triangle = triangles[i];
      triangle.previous = triangles[i - 1];
      triangle.next = triangles[i + 1];
    }
  });

  while (triangle = heap.pop()) {
    var previous = triangle.previous,
        next = triangle.next;

    // If the area of the current point is less than that of the previous point
    // to be eliminated, use the latter's area instead. This ensures that the
    // current point cannot be eliminated without eliminating previously-
    // eliminated points.
    if (triangle[1].area < maxArea) triangle[1].area = maxArea;
    else maxArea = triangle[1].area;

    if (previous) {
      previous.next = next;
      previous[2] = triangle[2];
      update(previous);
    }

    if (next) {
      next.previous = previous;
      next[0] = triangle[0];
      update(next);
    }
  }

  if (retainProportion) {
    var areas = [];
    topology.arcs.forEach(function(arc) {
      arc.forEach(function(point) {
        areas.push(point.area);
      });
    });
    mininumArea = areas.sort(function(a, b) { return b - a; })[Math.ceil((N - 1) * retainProportion)];
    if (verbose) console.warn("simplification: effective minimum area " + mininumArea.toPrecision(3));
  }

  topology.arcs = topology.arcs.map(function(arc) {
    return arc.filter(function(point) {
      return point.area >= mininumArea;
    });
  });

  topology.arcs.forEach(function(arc) {
    arc.forEach(transformRelative(topology.transform));
    M += arc.length;
  });

  function update(triangle) {
    heap.remove(triangle);
    triangle[1].area = system.triangleArea(triangle);
    heap.push(triangle);
  }

  if (verbose) console.warn("simplification: retained " + M + " / " + N + " points (" + Math.round((M / N) * 100) + "%)");

  return topology;
};

function transformAbsolute(transform) {
  var x0 = 0,
      y0 = 0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point) {
    point[0] = (x0 += point[0]) * kx + dx;
    point[1] = (y0 += point[1]) * ky + dy;
  };
}

function transformRelative(transform) {
  var x0 = 0,
      y0 = 0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point) {
    var x1 = (point[0] - dx) / kx | 0,
        y1 = (point[1] - dy) / ky | 0;
    point[0] = x1 - x0;
    point[1] = y1 - y0;
    x0 = x1;
    y0 = y1;
  };
}

},{"./coordinate-systems":6,"./min-heap":10}],13:[function(require,module,exports){
var π = Math.PI,
    π_4 = π / 4,
    radians = π / 180;

exports.name = "spherical";
exports.formatDistance = formatDistance;
exports.ringArea = ringArea;
exports.absoluteArea = absoluteArea;
exports.triangleArea = triangleArea;
exports.distance = haversinDistance; // XXX why two implementations?

function formatDistance(radians) {
  var km = radians * 6371;
  return (km > 1 ? km.toFixed(3) + "km" : (km * 1000).toPrecision(3) + "m")
      + " (" + (radians * 180 / Math.PI).toPrecision(3) + "°)";
}

function ringArea(ring) {
  if (!ring.length) return 0;
  var area = 0,
      p = ring[0],
      λ = p[0] * radians,
      φ = p[1] * radians / 2 + π_4,
      λ0 = λ,
      cosφ0 = Math.cos(φ),
      sinφ0 = Math.sin(φ);

  for (var i = 1, n = ring.length; i < n; ++i) {
    p = ring[i], λ = p[0] * radians, φ = p[1] * radians / 2 + π_4;

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dλ = λ - λ0,
        cosφ = Math.cos(φ),
        sinφ = Math.sin(φ),
        k = sinφ0 * sinφ,
        u = cosφ0 * cosφ + k * Math.cos(dλ),
        v = k * Math.sin(dλ);
    area += Math.atan2(v, u);

    // Advance the previous point.
    λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
  }

  return 2 * area;
}

function absoluteArea(a) {
  return a < 0 ? a + 4 * π : a;
}

function triangleArea(t) {
  var a = distance(t[0], t[1]),
      b = distance(t[1], t[2]),
      c = distance(t[2], t[0]),
      s = (a + b + c) / 2;
  return 4 * Math.atan(Math.sqrt(Math.max(0, Math.tan(s / 2) * Math.tan((s - a) / 2) * Math.tan((s - b) / 2) * Math.tan((s - c) / 2))));
}

function distance(a, b) {
  var Δλ = (b[0] - a[0]) * radians,
      sinΔλ = Math.sin(Δλ),
      cosΔλ = Math.cos(Δλ),
      sinφ0 = Math.sin(a[1] * radians),
      cosφ0 = Math.cos(a[1] * radians),
      sinφ1 = Math.sin(b[1] * radians),
      cosφ1 = Math.cos(b[1] * radians),
      _;
  return Math.atan2(Math.sqrt((_ = cosφ1 * sinΔλ) * _ + (_ = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * _), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
}

function haversinDistance(x0, y0, x1, y1) {
  x0 *= radians, y0 *= radians, x1 *= radians, y1 *= radians;
  return 2 * Math.asin(Math.sqrt(haversin(y1 - y0) + Math.cos(y0) * Math.cos(y1) * haversin(x1 - x0)));
}

function haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}

},{}],14:[function(require,module,exports){
var type = require("./type");

module.exports = function(objects, options) {
  var verbose = false;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]);

  var stitch = type({
    polygon: function(polygon) {
      for (var j = 0, m = polygon.length; j < m; ++j) {
        var line = polygon[j],
            i = -1,
            n = line.length,
            a = false,
            b = false,
            c = false,
            i0 = -1;
        for (i = 0; i < n; ++i) {
          var point = line[i],
              antimeridian = Math.abs(Math.abs(point[0]) - 180) < 1e-2,
              polar = Math.abs(Math.abs(point[1]) - 90) < 1e-2;
          if (antimeridian || polar) {
            if (!(a || b || c)) i0 = i;
            if (antimeridian) {
              if (a) c = true;
              else a = true;
            }
            if (polar) b = true;
          }
          if (!antimeridian && !polar || i === n - 1) {
            if (a && b && c) {
              if (verbose) console.warn("stitch: removed polar cut [" + line[i0] + "] … [" + line[i] + "]");
              line.splice(i0, i - i0);
              n -= i - i0;
              i = i0;
            }
            a = b = c = false;
          }
        }
      }
    }
  });

  for (var key in objects) {
    stitch.object(objects[key]);
  }
};

},{"./type":16}],15:[function(require,module,exports){
var type = require("./type"),
    stitch = require("./stitch-poles"),
    hashtable = require("./hashtable"),
    systems = require("./coordinate-systems");

var ε = 1e-6;

module.exports = function(objects, options) {
  var Q = 1e4, // precision of quantization
      id = function(d) { return d.id; }, // function to compute object id
      propertyTransform = function() {}, // function to transform properties
      stitchPoles = true,
      verbose = false,
      x0, y0, x1, y1,
      kx, ky,
      εmax = 0,
      coincidences,
      system = null,
      arcs = [],
      arcsByPoint,
      pointsByPoint;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]),
    "stitch-poles" in options && (stitchPoles = !!options["stitch-poles"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "quantization" in options && (Q = +options["quantization"]),
    "id" in options && (id = options["id"]),
    "property-transform" in options && (propertyTransform = options["property-transform"]);

  coincidences = hashtable(Q * 10);
  arcsByPoint = hashtable(Q * 10);
  pointsByPoint = hashtable(Q * 10);

  function each(callback) {
    var t = type(callback), o = {};
    for (var k in objects) o[k] = t.object(objects[k]) || {};
    return o;
  }

  // Compute bounding box.
  function bound() {
    x1 = y1 = -(x0 = y0 = Infinity);
    each({
      point: function(point) {
        var x = point[0],
            y = point[1];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    });
  }

  bound();

  // For automatic coordinate system determination, consider the bounding box.
  var oversize = x0 < -180 - ε || x1 > 180 + ε || y0 < -90 - ε || y1 > 90 + ε;
  if (!system) {
    system = systems[oversize ? "cartesian" : "spherical"];
    if (options) options["coordinate-system"] = system.name;
  }

  if (system === systems.spherical) {
    if (oversize) throw new Error("spherical coordinates outside of [±180°, ±90°]");
    if (stitchPoles) stitch(objects), bound();

    // When near the spherical coordinate limits, clamp to nice round values.
    // This avoids quantized coordinates that are slightly outside the limits.
    if (x0 < -180 + ε) x0 = -180;
    if (x1 > 180 - ε) x1 = 180;
    if (y0 < -90 + ε) y0 = -90;
    if (y1 > 90 - ε) y1 = 90;
  }

  if (!isFinite(x0)) x0 = 0;
  if (!isFinite(x1)) x1 = 0;
  if (!isFinite(y0)) y0 = 0;
  if (!isFinite(y1)) y1 = 0;

  // Compute quantization scaling factors.
  if (Q) {
    kx = x1 - x0 ? (Q - 1) / (x1 - x0) : 1;
    ky = y1 - y0 ? (Q - 1) / (y1 - y0) : 1;
  } else {
    console.warn("quantization: disabled; assuming inputs already quantized");
    Q = x1 + 1;
    kx = ky = 1;
    x0 = y0 = 0;
  }

  if (verbose) {
    var qx0 = Math.round((x0 - x0) * kx) * (1 / kx) + x0,
        qx1 = Math.round((x1 - x0) * kx) * (1 / kx) + x0,
        qy0 = Math.round((y0 - y0) * ky) * (1 / ky) + y0,
        qy1 = Math.round((y1 - y0) * ky) * (1 / ky) + y0;
    console.warn("quantization: bounds " + [qx0, qy0, qx1, qy1].join(" ") + " (" + system.name + ")");
  }

  // Quantize coordinates.
  each({
    point: function(point) {
      var x1 = point[0],
          y1 = point[1],
          x = Math.round((x1 - x0) * kx),
          y = Math.round((y1 - y0) * ky),
          ε = system.distance(x1, y1, x / kx + x0, y / ky + y0);
      if (ε > εmax) εmax = ε;
      point[0] = x;
      point[1] = y;
    }
  });

  if (verbose) console.warn("quantization: maximum error "  + system.formatDistance(εmax));

  // Compute the line strings that go through each unique point.
  // If the line string goes through the same point more than once,
  // only record that point once.
  each({
    line: function(line) {
      var i = -1,
          n = line.length,
          lines;
      while (++i < n) {
        lines = coincidences.get(line[i]);
        if (lines.indexOf(line) < 0) lines.push(line);
      }
    }
  });

  // Convert features to geometries, and stitch together arcs.
  objects = each({
    Feature: function(feature) {
      var geometry = feature.geometry;
      if (feature.geometry == null) geometry = {};
      if ("id" in feature) geometry.id = feature.id;
      if ("properties" in feature) geometry.properties = feature.properties;
      return this.geometry(geometry);
    },

    FeatureCollection: function(collection) {
      collection.type = "GeometryCollection";
      collection.geometries = collection.features.map(this.Feature, this);
      delete collection.features;
      return collection;
    },

    GeometryCollection: function(collection) {
      collection.geometries = collection.geometries.map(this.geometry, this);
    },

    MultiPolygon: function(multiPolygon) {
      multiPolygon.arcs = multiPolygon.coordinates.map(polygon);
    },

    Polygon: function(polygon) {
      polygon.arcs = polygon.coordinates.map(lineClosed);
    },

    MultiLineString: function(multiLineString) {
      multiLineString.arcs = multiLineString.coordinates.map(lineOpen);
    },

    LineString: function(lineString) {
      lineString.arcs = lineOpen(lineString.coordinates);
    },

    geometry: function(geometry) {
      if (geometry == null) geometry = {};
      else this.defaults.geometry.call(this, geometry);

      geometry.id = id(geometry);
      if (geometry.id == null) delete geometry.id;

      if (properties0 = geometry.properties) {
        var properties0, properties1 = {};
        delete geometry.properties;
        for (var key0 in properties0) {
          if (propertyTransform(properties1, key0, properties0[key0])) {
            geometry.properties = properties1;
          }
        }
      }

      if (geometry.arcs) delete geometry.coordinates;
      return geometry;
    }
  });

  coincidences = arcsByPoint = pointsByPoint = null;

  function polygon(polygon) {
    return polygon.map(lineClosed);
  }

  function lineClosed(points) {
    return line(points, false);
  }

  function lineOpen(points) {
    return line(points, true);
  }

  function line(points, open) {
    var lineArcs = [],
        n = points.length,
        a = [],
        k = 0,
        p;

    if (!open) points.pop(), --n;

    // For closed lines, rotate to find a suitable shared starting point.
    for (; k < n; ++k) {
      var t = coincidences.peek(points[k]);
      if (open) break;
      if (p && !linesEqual(p, t)) {
        var tInP = t.every(function(line) { return p.indexOf(line) >= 0; }),
            pInT = p.every(function(line) { return t.indexOf(line) >= 0; });
        if (tInP && !pInT) --k;
        break;
      }
      p = t;
    }

    // If no shared starting point is found for closed lines, rotate to minimum.
    if (k === n && p.length > 1) {
      var point0 = points[0];
      for (k = 0, i = 1; i < n; ++i) {
        var point = points[i];
        if (pointCompare(point0, point) > 0) point0 = point, k = i;
      }
    }

    for (var i = 0, m = open ? n : n + 1; i < m; ++i) {
      var point = points[(i + k) % n],
          p = coincidences.peek(point);
      if (!linesEqual(p, t)) {
        var tInP = t.every(function(line) { return p.indexOf(line) >= 0; }),
            pInT = p.every(function(line) { return t.indexOf(line) >= 0; });
        if (tInP) a.push(point);
        arc(a);
        if (!tInP && !pInT) arc([a[a.length - 1], point]);
        if (pInT) a = [a[a.length - 1]];
        else a = [];
      }
      if (!a.length || pointCompare(a[a.length - 1], point)) a.push(point); // skip duplicate points
      t = p;
    }

    arc(a, true);

    function arc(a, last) {
      var n = a.length;

      if (last && !lineArcs.length && n === 1) {
        var point = a[0],
            index = pointsByPoint.get(point);
        if (index.length) {
          lineArcs.push(index[0]);
        } else {
          lineArcs.push(index[0] = arcs.length);
          arcs.push(a);
        }
      } else if (n > 1) {
        var a0 = a[0],
            a1 = a[n - 1],
            point = pointCompare(a0, a1) < 0 ? a0 : a1,
            pointArcs = arcsByPoint.get(point);
        if (pointArcs.some(matchForward)) return;
        if (pointArcs.some(matchBackward)) return;
        pointArcs.push(a);
        lineArcs.push(a.index = arcs.length);
        arcs.push(a);
      }

      function matchForward(b) {
        var i = -1;
        if (b.length !== n) return false;
        while (++i < n) if (pointCompare(a[i], b[i])) return false;
        lineArcs.push(b.index);
        return true;
      }

      function matchBackward(b) {
        var i = -1;
        if (b.length !== n) return false;
        while (++i < n) if (pointCompare(a[i], b[n - i - 1])) return false;
        lineArcs.push(~b.index);
        return true;
      }
    }

    return lineArcs;
  }

  return {
    type: "Topology",
    bbox: [x0, y0, x1, y1],
    transform: {
      scale: [1 / kx, 1 / ky],
      translate: [x0, y0]
    },
    objects: objects,
    arcs: arcs.map(function(arc) {
      var i = 0,
          n = arc.length,
          point = arc[0],
          x1 = point[0], x2, dx,
          y1 = point[1], y2, dy,
          points = [[x1, y1]];
      while (++i < n) {
        point = arc[i];
        x2 = point[0];
        y2 = point[1];
        dx = x2 - x1;
        dy = y2 - y1;
        if (dx || dy) {
          points.push([dx, dy]);
          x1 = x2, y1 = y2;
        }
      }
      return points;
    })
  };
};

function linesEqual(a, b) {
  var n = a.length, i = -1;
  if (b.length !== n) return false;
  while (++i < n) if (a[i] !== b[i]) return false;
  return true;
}

function pointCompare(a, b) {
  return a[0] - b[0] || a[1] - b[1];
}

function noop() {}

},{"./coordinate-systems":6,"./hashtable":9,"./stitch-poles":14,"./type":16}],16:[function(require,module,exports){
module.exports = function(types) {
  for (var type in typeDefaults) {
    if (!(type in types)) {
      types[type] = typeDefaults[type];
    }
  }
  types.defaults = typeDefaults;
  return types;
};

var typeDefaults = {

  Feature: function(feature) {
    if (feature.geometry) this.geometry(feature.geometry);
  },

  FeatureCollection: function(collection) {
    var features = collection.features, i = -1, n = features.length;
    while (++i < n) this.Feature(features[i]);
  },

  GeometryCollection: function(collection) {
    var geometries = collection.geometries, i = -1, n = geometries.length;
    while (++i < n) this.geometry(geometries[i]);
  },

  LineString: function(lineString) {
    this.line(lineString.coordinates);
  },

  MultiLineString: function(multiLineString) {
    var coordinates = multiLineString.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.line(coordinates[i]);
  },

  MultiPoint: function(multiPoint) {
    var coordinates = multiPoint.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.point(coordinates[i]);
  },

  MultiPolygon: function(multiPolygon) {
    var coordinates = multiPolygon.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.polygon(coordinates[i]);
  },

  Point: function(point) {
    this.point(point.coordinates);
  },

  Polygon: function(polygon) {
    this.polygon(polygon.coordinates);
  },

  object: function(object) {
    return object == null ? null
        : typeObjects.hasOwnProperty(object.type) ? this[object.type](object)
        : this.geometry(object);
  },

  geometry: function(geometry) {
    return geometry == null ? null
        : typeGeometries.hasOwnProperty(geometry.type) ? this[geometry.type](geometry)
        : null;
  },

  point: function() {},

  line: function(coordinates) {
    var i = -1, n = coordinates.length;
    while (++i < n) this.point(coordinates[i]);
  },

  polygon: function(coordinates) {
    var i = -1, n = coordinates.length;
    while (++i < n) this.line(coordinates[i]);
  }
};

var typeGeometries = {
  LineString: 1,
  MultiLineString: 1,
  MultiPoint: 1,
  MultiPolygon: 1,
  Point: 1,
  Polygon: 1,
  GeometryCollection: 1
};

var typeObjects = {
  Feature: 1,
  FeatureCollection: 1
};

},{}],17:[function(require,module,exports){
module.exports.showProperties = showProperties;
module.exports.setupMap = setupMap;
module.exports.geoify = geoify;

function setupMap(container) {
    'use strict';

    var mapDiv = container.append('div')
        .attr('id', 'map');

    var map = L.mapbox.map(mapDiv.node())
        .setView([20, 0], 2);

    var layers = [{
        title: 'MapBox',
        layer: L.mapbox.tileLayer('tmcw.map-7s15q36b', {
            retinaVersion: 'tmcw.map-u4ca5hnt',
            detectRetina: true
        })
    }, {
        title: 'Satellite',
        layer: L.mapbox.tileLayer('tmcw.map-j5fsp01s', {
            retinaVersion: 'tmcw.map-ujx9se0r',
            detectRetina: true
        })
    }, {
        title: 'OSM',
        layer: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        })
    }];

    var layerButtons = container.append('div')
        .attr('id', 'layer-switch')
        .selectAll('button')
        .data(layers)
        .enter()
        .append('button')
        .on('click', function(d) {
            var clicked = this;
            layerButtons.classed('active', function() {
                return clicked === this;
            });
            layers.forEach(swap);
            function swap(l) {
                if (l.layer == d.layer) map.addLayer(d.layer);
                else if (map.hasLayer(l.layer)) map.removeLayer(l.layer);
            }
        })
        .text(function(d) { return d.title; });

    layerButtons.filter(function(d, i) { return i === 0; }).trigger('click');

    L.mapbox.geocoderControl('tmcw.map-u4ca5hnt').addTo(map);

    return map;
}

function isEmpty(o) {
    for (var i in o) { return false; }
    return true;
}

function showProperties(l) {
    var properties = l.toGeoJSON().properties, table = '';
    if (isEmpty(properties)) properties = { '': '' };

    for (var key in properties) {
        table += '<tr><th><input type="text" value="' + key + '" /></th>' +
            '<td><input type="text" value="' + properties[key] + '" /></td></tr>';
    }

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent('<div class="clearfix"><div class="marker-properties-limit"><table class="marker-properties">' + table + '</table></div>' +
        '<div class="clearfix col12 drop">' +
            '<div class="buttons-joined fl"><button class="save positive">save</button>' +
            '<button class="cancel">cancel</button></div>' +
            '<div class="fr clear-buttons"><button class="delete-invert"><span class="icon-remove-sign"></span> remove</button></div>' +
        '</div></div>'));
}

function geoify(layer) {
    var features = [];
    layer.eachLayer(function(l) {
        if ('toGeoJSON' in l) features.push(l.toGeoJSON());
    });
    layer.clearLayers();
    L.geoJson({ type: 'FeatureCollection', features: features }).eachLayer(function(l) {
        l.addTo(layer);
    });
}

},{}],18:[function(require,module,exports){
var map = require('./map')();
var gist = require('./source/gist'),
    source = require('./source.js'),
    github = require('./source/github');

var drawnItems = L.featureGroup().addTo(map);

var s = source();

if (!s) { window.location.hash = ''; }
else if (s.type == 'gist') gist.loadGist(s.id, onGistLoad);
else if (s.type == 'github') github.loadGitHub(s.id, onGitHubLoad);

function mapFile(gist) {
    var f;
    for (f in gist.files) if (f.indexOf('.geojson') !== -1) return JSON.parse(gist.files[f].content);
    for (f in gist.files) if (f.indexOf('.json') !== -1) return JSON.parse(gist.files[f].content);
}

function loadToMap(gj) {
    drawnItems.clearLayers();
    L.geoJson(gj).eachLayer(function(l) {
        showProperties(l);
        l.addTo(drawnItems);
    });
}

function onGistLoad(err, json) {
    if (err) return alert('Gist API limit exceeded, come back in a bit.');
    var first = !drawnItems.getBounds().isValid();

    try {
        var file = mapFile(json);
        loadToMap(file);
        if (first && drawnItems.getBounds().isValid()) {
            map.fitBounds(drawnItems.getBounds());
        }
    } catch(e) {
    }
}

function onGitHubLoad(err, file) {
    if (err) return alert('GitHub API limit exceeded, come back in a bit.');

    try {
        var json = JSON.parse(Base64.fromBase64(file.content));
        loadToMap(json);
        if (drawnItems.getBounds().isValid()) {
            map.fitBounds(drawnItems.getBounds());
        }
    } catch(e) {
        alert('Loading a file from GitHub failed');
    }
}

function isEmpty(o) {
    for (var i in o) { return false; }
    return true;
}

function showProperties(l) {
    var properties = l.toGeoJSON().properties, table = '';
    if (isEmpty(properties)) properties = { '': '' };

    for (var key in properties) {
        table += '<tr><th>' + key + '</th>' +
            '<td>' + properties[key] + '</td></tr>';
    }

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent('<table class="marker-properties display">' + table + '</table>'));
}

},{"./map":17,"./source.js":19,"./source/gist":20,"./source/github":21}],19:[function(require,module,exports){
'use strict';

module.exports = function source() {

    if (!window.location.hash) return null;

    var txt = window.location.hash.substring(1);

    if (!isNaN(parseInt(txt, 10))) {
        // legacy gist
        return {
            type: 'gist',
            id: parseInt(txt, 10)
        };
    } else if (txt.indexOf('gist:') === 0) {
        var clean = txt.replace(/^gist:/, '');
        if (clean.indexOf('/') !== -1) {
            return {
                type: 'gist',
                login: clean.split('/')[0],
                id: parseInt(clean.split('/')[1], 10)
            };
        } else {
            return {
                type: 'gist',
                id: parseInt(clean, 10)
            };
        }
    } else if (txt.indexOf('github:') === 0) {
        return {
            type: 'github',
            id: txt.replace(/^github:\/?/, '')
        };
    }
};

},{}],20:[function(require,module,exports){
var source = require('../source.js');
var fs = require('fs');
var tmpl = "<!DOCTYPE html>\n<html>\n<head>\n  <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' />\n  <style>\n  body { margin:0; padding:0; }\n  #map { position:absolute; top:0; bottom:0; width:100%; }\n  .marker-properties {\n    border-collapse:collapse;\n    font-size:11px;\n    border:1px solid #eee;\n    margin:0;\n}\n.marker-properties th {\n    white-space:nowrap;\n    border:1px solid #eee;\n    padding:5px 10px;\n}\n.marker-properties td {\n    border:1px solid #eee;\n    padding:5px 10px;\n}\n.marker-properties tr:last-child td,\n.marker-properties tr:last-child th {\n    border-bottom:none;\n}\n.marker-properties tr:nth-child(even) th,\n.marker-properties tr:nth-child(even) td {\n    background-color:#f7f7f7;\n}\n  </style>\n  <script src='//api.tiles.mapbox.com/mapbox.js/v1.3.1/mapbox.js'></script>\n  <script src=\"//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js\" ></script>\n  <link href='//api.tiles.mapbox.com/mapbox.js/v1.3.1/mapbox.css' rel='stylesheet' />\n  <!--[if lte IE 8]>\n    <link href='//api.tiles.mapbox.com/mapbox.js/v1.3.1/mapbox.ie.css' rel='stylesheet' >\n  <![endif]-->\n</head>\n<body>\n<div id='map'></div>\n<script type='text/javascript'>\nvar map = L.mapbox.map('map');\n\nL.mapbox.tileLayer('tmcw.map-ajwqaq7t', {\n    retinaVersion: 'tmcw.map-u8vb5w83',\n    detectRetina: true\n}).addTo(map);\n\nmap.attributionControl.addAttribution('<a href=\"http://geojson.io/\">geojson.io</a>');\n$.getJSON('map.geojson', function(geojson) {\n    var geojsonLayer = L.geoJson(geojson).addTo(map);\n    map.fitBounds(geojsonLayer.getBounds());\n    geojsonLayer.eachLayer(function(l) {\n        showProperties(l);\n    });\n});\nfunction showProperties(l) {\n    var properties = l.toGeoJSON().properties, table = '';\n    for (var key in properties) {\n        table += '<tr><th>' + key + '</th>' +\n            '<td>' + properties[key] + '</td></tr>';\n    }\n    if (table) l.bindPopup('<table class=\"marker-properties display\">' + table + '</table>');\n}\n</script>\n</body>\n</html>\n";

module.exports.saveAsGist = saveAsGist;
module.exports.saveBlocks = saveBlocks;
module.exports.loadGist = loadGist;
module.exports.urlHash = urlHash;

function loggedin() {
    return !!localStorage.github_token;
}

function authorize(xhr) {
    return localStorage.github_token ?
        xhr.header('Authorization', 'token ' + localStorage.github_token) :
        xhr;
}

function saveBlocks(content, callback) {
    var endpoint = 'https://api.github.com/gists';

    d3.json(endpoint)
        .on('load', function(data) {
            callback(null, data);
        })
        .on('error', function(err) {
            callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
        })
        .send('POST', JSON.stringify({
            description: 'via:geojson.io',
            public: true,
            files: {
                'index.html': {
                    content: tmpl
                },
                'map.geojson': {
                    content: content
                }
            }
        }));
}

function saveAsGist(content, callback) {
    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
    }

    var user = localStorage.github_user ?
        JSON.parse(localStorage.github_user) : {};

    var endpoint,
        method = 'POST';

    if (loggedin() && (source() && source().id)) {
        if (user && source().login == user.login) {
            endpoint = 'https://api.github.com/gists/' + source().id;
            method = 'PATCH';
        } else {
            endpoint = 'https://api.github.com/gists/' + source().id + '/forks';
        }
    } else {
        endpoint = 'https://api.github.com/gists';
    }

    authorize(d3.json(endpoint))
        .on('load', function(data) {
            callback(null, data);
        })
        .on('error', function(err) {
            callback('Gist API limit exceeded; saving to GitHub temporarily disabled: ' + err);
        })
        .send(method, JSON.stringify({
            description: 'via:geojson.io',
            public: true,
            files: {
                'map.geojson': {
                    content: content
                }
            }
        }));
}

function loadGist(id, callback) {
    d3.json('https://api.github.com/gists/' + id)
        .on('load', onLoad)
        .on('error', onError).get();

    function onLoad(json) { callback(null, json); }
    function onError(err) { callback(err, null); }
}

function urlHash(data) {
    var login = (data.user && data.user.login) || 'anonymous';
    if (source() && source().id == data.id && !source().login) {
        return {
            url: '#gist:' + login + '/' + data.id,
            redirect: true
        };
    } else {
        return {
            url: '#gist:' + login + '/' + data.id
        };
    }
}

},{"../source.js":19,"fs":1}],21:[function(require,module,exports){
var source = require('../source.js');

module.exports.saveAsGitHub = saveAsGitHub;
module.exports.loadGitHub = loadGitHub;
module.exports.loadGitHubRaw = loadGitHubRaw;
module.exports.urlHash = urlHash;

function authorize(xhr) {
    return localStorage.github_token ?
        xhr.header('Authorization', 'token ' + localStorage.github_token) :
        xhr;
}

function githubFileUrl() {
    var pts = parseGitHubId(source().id);

    return 'https://api.github.com/repos/' + pts.user +
            '/' + pts.repo +
            '/contents/' + pts.file + '?ref=' + pts.branch;
}

function saveAsGitHub(content, message, callback) {
    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
    }

    if (!localStorage.github_token) {
        return alert('You need to log in with GitHub to commit changes');
    }

    var commitMessage = message || prompt('Commit message:');
    if (!commitMessage) return;

    loadGitHub(source().id, function(err, file) {
        if (err) {
            return alert('Failed to load file before saving');
        }
        authorize(d3.json(githubFileUrl()))
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(err) {
                callback('GitHub API limit exceeded; saving to GitHub temporarily disabled: ' + err);
            })
            .send('PUT', JSON.stringify({
                message: commitMessage,
                sha: file.sha,
                branch: file.branch,
                content: Base64.toBase64(content)
            }));
    });
}

function parseGitHubId(id) {
    var parts = id.split('/');
    return {
        user: parts[0],
        repo: parts[1],
        mode: parts[2],
        branch: parts[3],
        file: parts.slice(4).join('/')
    };
}

function loadGitHub(id, callback) {
    var pts = parseGitHubId(id);
    authorize(d3.json('https://api.github.com/repos/' + pts.user +
        '/' + pts.repo +
        '/contents/' + pts.file + '?ref=' + pts.branch))
        .on('load', onLoad)
        .on('error', onError)
        .get();

    function onLoad(file) {
        callback(null, file);
    }
    function onError(err) { callback(err, null); }
}

function loadGitHubRaw(id, callback) {
    var pts = parseGitHubId(id);
    authorize(d3.text('https://api.github.com/repos/' + pts.user +
        '/' + pts.repo +
        '/contents/' + pts.file + '?ref=' + pts.branch))
        .on('load', onLoad)
        .on('error', onError)
        .header('Accept', 'application/vnd.github.raw').get();

    function onLoad(file) {
        callback(null, file);
    }
    function onError(err) { callback(err, null); }
}

function urlHash(d) {
    var prefix = '';

    if (d.parents && d.parents.length) {
        prefix = d.parents.map(function(p) {
            return p.path;
        }).join('/') + '/';
    }

    return {
        url: 'github:/' + d.parent.full_name + '/' + d.type + '/' + d.parent.default_branch + '/' + prefix + d.path
    };
}

},{"../source.js":19}],"topojson":[function(require,module,exports){
module.exports=require('PBmiWO');
},{}]},{},[18])
;