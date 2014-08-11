!function(){
  var d3 = {version: "3.4.11"}; // semver
d3.entries = function(map) {
  var entries = [];
  for (var key in map) entries.push({key: key, value: map[key]});
  return entries;
};
function d3_class(ctor, properties) {
  try {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  } catch (e) {
    ctor.prototype = properties;
  }
}

d3.map = function(object) {
  var map = new d3_Map;
  if (object instanceof d3_Map) object.forEach(function(key, value) { map.set(key, value); });
  else for (var key in object) map.set(key, object[key]);
  return map;
};

function d3_Map() {}

d3_class(d3_Map, {
  has: d3_map_has,
  get: function(key) {
    return this[d3_map_prefix + key];
  },
  set: function(key, value) {
    return this[d3_map_prefix + key] = value;
  },
  remove: d3_map_remove,
  keys: d3_map_keys,
  values: function() {
    var values = [];
    this.forEach(function(key, value) { values.push(value); });
    return values;
  },
  entries: function() {
    var entries = [];
    this.forEach(function(key, value) { entries.push({key: key, value: value}); });
    return entries;
  },
  size: d3_map_size,
  empty: d3_map_empty,
  forEach: function(f) {
    for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) f.call(this, key.substring(1), this[key]);
  }
});

var d3_map_prefix = "\0", // prevent collision with built-ins
    d3_map_prefixCode = d3_map_prefix.charCodeAt(0);

function d3_map_has(key) {
  return d3_map_prefix + key in this;
}

function d3_map_remove(key) {
  key = d3_map_prefix + key;
  return key in this && delete this[key];
}

function d3_map_keys() {
  var keys = [];
  this.forEach(function(key) { keys.push(key); });
  return keys;
}

function d3_map_size() {
  var size = 0;
  for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) ++size;
  return size;
}

function d3_map_empty() {
  for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) return false;
  return true;
}

d3.set = function(array) {
  var set = new d3_Set;
  if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
  return set;
};

function d3_Set() {}

d3_class(d3_Set, {
  has: d3_map_has,
  add: function(value) {
    this[d3_map_prefix + value] = true;
    return value;
  },
  remove: function(value) {
    value = d3_map_prefix + value;
    return value in this && delete this[value];
  },
  values: d3_map_keys,
  size: d3_map_size,
  empty: d3_map_empty,
  forEach: function(f) {
    for (var value in this) if (value.charCodeAt(0) === d3_map_prefixCode) f.call(this, value.substring(1));
  }
});
d3.pairs = function(array) {
  var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);
  while (i < n) pairs[i] = [p0 = p1, p1 = array[++i]];
  return pairs;
};
var abs = Math.abs;

d3.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step === Infinity) throw new Error("infinite range");
  var range = [],
       k = d3_range_integerScale(abs(step)),
       i = -1,
       j;
  start *= k, stop *= k, step *= k;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k);
  else while ((j = start + step * ++i) < stop) range.push(j / k);
  return range;
};

function d3_range_integerScale(x) {
  var k = 1;
  while (x * k % 1) k *= 10;
  return k;
}
var d3_arraySlice = [].slice,
    d3_array = function(list) { return d3_arraySlice.call(list); }; // conversion for NodeLists

var d3_document = document,
    d3_documentElement = d3_document.documentElement,
    d3_window = window;

// Redefine d3_array if the browser doesn’t support slice-based conversion.
try {
  d3_array(d3_documentElement.childNodes)[0].nodeType;
} catch(e) {
  d3_array = function(list) {
    var i = list.length, array = new Array(i);
    while (i--) array[i] = list[i];
    return array;
  };
}
// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}

function d3_vendorSymbol(object, name) {
  if (name in object) return name;
  name = name.charAt(0).toUpperCase() + name.substring(1);
  for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
    var prefixName = d3_vendorPrefixes[i] + name;
    if (prefixName in object) return prefixName;
  }
}

var d3_vendorPrefixes = ["webkit", "ms", "moz", "Moz", "o", "O"];
function d3_noop() {}

d3.dispatch = function() {
  var dispatch = new d3_dispatch,
      i = -1,
      n = arguments.length;
  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
  return dispatch;
};

function d3_dispatch() {}

d3_dispatch.prototype.on = function(type, listener) {
  var i = type.indexOf("."),
      name = "";

  // Extract optional namespace, e.g., "click.foo"
  if (i >= 0) {
    name = type.substring(i + 1);
    type = type.substring(0, i);
  }

  if (type) return arguments.length < 2
      ? this[type].on(name)
      : this[type].on(name, listener);

  if (arguments.length === 2) {
    if (listener == null) for (type in this) {
      if (this.hasOwnProperty(type)) this[type].on(name, null);
    }
    return this;
  }
};

function d3_dispatch_event(dispatch) {
  var listeners = [],
      listenerByName = new d3_Map;

  function event() {
    var z = listeners, // defensive reference
        i = -1,
        n = z.length,
        l;
    while (++i < n) if (l = z[i].on) l.apply(this, arguments);
    return dispatch;
  }

  event.on = function(name, listener) {
    var l = listenerByName.get(name),
        i;

    // return the current listener, if any
    if (arguments.length < 2) return l && l.on;

    // remove the old listener, if any (with copy-on-write)
    if (l) {
      l.on = null;
      listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
      listenerByName.remove(name);
    }

    // add the new listener, if any
    if (listener) listeners.push(listenerByName.set(name, {on: listener}));

    return dispatch;
  };

  return event;
}

d3.event = null;

function d3_eventPreventDefault() {
  d3.event.preventDefault();
}

function d3_eventSource() {
  var e = d3.event, s;
  while (s = e.sourceEvent) e = s;
  return e;
}

// Like d3.dispatch, but for custom events abstracting native UI events. These
// events have a target component (such as a brush), a target element (such as
// the svg:g element containing the brush) and the standard arguments `d` (the
// target element's data) and `i` (the selection index of the target element).
function d3_eventDispatch(target) {
  var dispatch = new d3_dispatch,
      i = 0,
      n = arguments.length;

  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);

  // Creates a dispatch context for the specified `thiz` (typically, the target
  // DOM element that received the source event) and `argumentz` (typically, the
  // data `d` and index `i` of the target element). The returned function can be
  // used to dispatch an event to any registered listeners; the function takes a
  // single argument as input, being the event to dispatch. The event must have
  // a "type" attribute which corresponds to a type registered in the
  // constructor. This context will automatically populate the "sourceEvent" and
  // "target" attributes of the event, as well as setting the `d3.event` global
  // for the duration of the notification.
  dispatch.of = function(thiz, argumentz) {
    return function(e1) {
      try {
        var e0 =
        e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        dispatch[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };

  return dispatch;
}
d3.requote = function(s) {
  return s.replace(d3_requote_re, "\\$&");
};

var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
var d3_subclass = {}.__proto__?

// Until ECMAScript supports array subclassing, prototype injection works well.
function(object, prototype) {
  object.__proto__ = prototype;
}:

// And if your browser doesn't support __proto__, we'll use direct extension.
function(object, prototype) {
  for (var property in prototype) object[property] = prototype[property];
};

function d3_selection(groups) {
  d3_subclass(groups, d3_selectionPrototype);
  return groups;
}

var d3_select = function(s, n) { return n.querySelector(s); },
    d3_selectAll = function(s, n) { return n.querySelectorAll(s); },
    d3_selectMatcher = d3_documentElement.matches || d3_documentElement[d3_vendorSymbol(d3_documentElement, "matchesSelector")],
    d3_selectMatches = function(n, s) { return d3_selectMatcher.call(n, s); };

// Prefer Sizzle, if available.
if (typeof Sizzle === "function") {
  d3_select = function(s, n) { return Sizzle(s, n)[0] || null; };
  d3_selectAll = Sizzle;
  d3_selectMatches = Sizzle.matchesSelector;
}

d3.selection = function() {
  return d3_selectionRoot;
};

var d3_selectionPrototype = d3.selection.prototype = [];


d3_selectionPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      group,
      node;

  selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(subnode = selector.call(node, node.__data__, i, j));
        if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selector(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_select(selector, this);
  };
}

d3_selectionPrototype.selectAll = function(selector) {
  var subgroups = [],
      subgroup,
      node;

  selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
        subgroup.parentNode = node;
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selectorAll(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_selectAll(selector, this);
  };
}
var d3_nsPrefix = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: "http://www.w3.org/1999/xhtml",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

d3.ns = {
  prefix: d3_nsPrefix,
  qualify: function(name) {
    var i = name.indexOf(":"),
        prefix = name;
    if (i >= 0) {
      prefix = name.substring(0, i);
      name = name.substring(i + 1);
    }
    return d3_nsPrefix.hasOwnProperty(prefix)
        ? {space: d3_nsPrefix[prefix], local: name}
        : name;
  }
};

d3_selectionPrototype.attr = function(name, value) {
  if (arguments.length < 2) {

    // For attr(string), return the attribute value for the first node.
    if (typeof name === "string") {
      var node = this.node();
      name = d3.ns.qualify(name);
      return name.local
          ? node.getAttributeNS(name.space, name.local)
          : node.getAttribute(name);
    }

    // For attr(object), the object specifies the names and values of the
    // attributes to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_attr(value, name[value]));
    return this;
  }

  return this.each(d3_selection_attr(name, value));
};

function d3_selection_attr(name, value) {
  name = d3.ns.qualify(name);

  // For attr(string, null), remove the attribute with the specified name.
  function attrNull() {
    this.removeAttribute(name);
  }
  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  // For attr(string, string), set the attribute with the specified name.
  function attrConstant() {
    this.setAttribute(name, value);
  }
  function attrConstantNS() {
    this.setAttributeNS(name.space, name.local, value);
  }

  // For attr(string, function), evaluate the function for each element, and set
  // or remove the attribute as appropriate.
  function attrFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttribute(name);
    else this.setAttribute(name, x);
  }
  function attrFunctionNS() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttributeNS(name.space, name.local);
    else this.setAttributeNS(name.space, name.local, x);
  }

  return value == null
      ? (name.local ? attrNullNS : attrNull) : (typeof value === "function"
      ? (name.local ? attrFunctionNS : attrFunction)
      : (name.local ? attrConstantNS : attrConstant));
}
function d3_collapse(s) {
  return s.trim().replace(/\s+/g, " ");
}

d3_selectionPrototype.classed = function(name, value) {
  if (arguments.length < 2) {

    // For classed(string), return true only if the first node has the specified
    // class or classes. Note that even if the browser supports DOMTokenList, it
    // probably doesn't support it on SVG elements (which can be animated).
    if (typeof name === "string") {
      var node = this.node(),
          n = (name = d3_selection_classes(name)).length,
          i = -1;
      if (value = node.classList) {
        while (++i < n) if (!value.contains(name[i])) return false;
      } else {
        value = node.getAttribute("class");
        while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
      }
      return true;
    }

    // For classed(object), the object specifies the names of classes to add or
    // remove. The values may be functions that are evaluated for each element.
    for (value in name) this.each(d3_selection_classed(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_classed(name, value));
};

function d3_selection_classedRe(name) {
  return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
}

function d3_selection_classes(name) {
  return (name + "").trim().split(/^|\s+/);
}

// Multiple class names are allowed (e.g., "foo bar").
function d3_selection_classed(name, value) {
  name = d3_selection_classes(name).map(d3_selection_classedName);
  var n = name.length;

  function classedConstant() {
    var i = -1;
    while (++i < n) name[i](this, value);
  }

  // When the value is a function, the function is still evaluated only once per
  // element even if there are multiple class names.
  function classedFunction() {
    var i = -1, x = value.apply(this, arguments);
    while (++i < n) name[i](this, x);
  }

  return typeof value === "function"
      ? classedFunction
      : classedConstant;
}

function d3_selection_classedName(name) {
  var re = d3_selection_classedRe(name);
  return function(node, value) {
    if (c = node.classList) return value ? c.add(name) : c.remove(name);
    var c = node.getAttribute("class") || "";
    if (value) {
      re.lastIndex = 0;
      if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
    } else {
      node.setAttribute("class", d3_collapse(c.replace(re, " ")));
    }
  };
}

d3_selectionPrototype.style = function(name, value, priority) {
  var n = arguments.length;
  if (n < 3) {

    // For style(object) or style(object, string), the object specifies the
    // names and values of the attributes to set or remove. The values may be
    // functions that are evaluated for each element. The optional string
    // specifies the priority.
    if (typeof name !== "string") {
      if (n < 2) value = "";
      for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
      return this;
    }

    // For style(string), return the computed style value for the first node.
    if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);

    // For style(string, string) or style(string, function), use the default
    // priority. The priority is ignored for style(string, null).
    priority = "";
  }

  // Otherwise, a name, value and priority are specified, and handled as below.
  return this.each(d3_selection_style(name, value, priority));
};

function d3_selection_style(name, value, priority) {

  // For style(name, null) or style(name, null, priority), remove the style
  // property with the specified name. The priority is ignored.
  function styleNull() {
    this.style.removeProperty(name);
  }

  // For style(name, string) or style(name, string, priority), set the style
  // property with the specified name, using the specified priority.
  function styleConstant() {
    this.style.setProperty(name, value, priority);
  }

  // For style(name, function) or style(name, function, priority), evaluate the
  // function for each element, and set or remove the style property as
  // appropriate. When setting, use the specified priority.
  function styleFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.style.removeProperty(name);
    else this.style.setProperty(name, x, priority);
  }

  return value == null
      ? styleNull : (typeof value === "function"
      ? styleFunction : styleConstant);
}

d3_selectionPrototype.property = function(name, value) {
  if (arguments.length < 2) {

    // For property(string), return the property value for the first node.
    if (typeof name === "string") return this.node()[name];

    // For property(object), the object specifies the names and values of the
    // properties to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_property(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_property(name, value));
};

function d3_selection_property(name, value) {

  // For property(name, null), remove the property with the specified name.
  function propertyNull() {
    delete this[name];
  }

  // For property(name, string), set the property with the specified name.
  function propertyConstant() {
    this[name] = value;
  }

  // For property(name, function), evaluate the function for each element, and
  // set or remove the property as appropriate.
  function propertyFunction() {
    var x = value.apply(this, arguments);
    if (x == null) delete this[name];
    else this[name] = x;
  }

  return value == null
      ? propertyNull : (typeof value === "function"
      ? propertyFunction : propertyConstant);
}

d3_selectionPrototype.text = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.textContent = v == null ? "" : v; } : value == null
      ? function() { this.textContent = ""; }
      : function() { this.textContent = value; })
      : this.node().textContent;
};

d3_selectionPrototype.html = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.innerHTML = v == null ? "" : v; } : value == null
      ? function() { this.innerHTML = ""; }
      : function() { this.innerHTML = value; })
      : this.node().innerHTML;
};

d3_selectionPrototype.append = function(name) {
  name = d3_selection_creator(name);
  return this.select(function() {
    return this.appendChild(name.apply(this, arguments));
  });
};

function d3_selection_creator(name) {
  return typeof name === "function" ? name
      : (name = d3.ns.qualify(name)).local ? function() { return this.ownerDocument.createElementNS(name.space, name.local); }
      : function() { return this.ownerDocument.createElementNS(this.namespaceURI, name); };
}

d3_selectionPrototype.insert = function(name, before) {
  name = d3_selection_creator(name);
  before = d3_selection_selector(before);
  return this.select(function() {
    return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
  });
};

// TODO remove(selector)?
// TODO remove(node)?
// TODO remove(function)?
d3_selectionPrototype.remove = function() {
  return this.each(function() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  });
};

d3_selectionPrototype.data = function(value, key) {
  var i = -1,
      n = this.length,
      group,
      node;

  // If no value is specified, return the first value.
  if (!arguments.length) {
    value = new Array(n = (group = this[0]).length);
    while (++i < n) {
      if (node = group[i]) {
        value[i] = node.__data__;
      }
    }
    return value;
  }

  function bind(group, groupData) {
    var i,
        n = group.length,
        m = groupData.length,
        n0 = Math.min(n, m),
        updateNodes = new Array(m),
        enterNodes = new Array(m),
        exitNodes = new Array(n),
        node,
        nodeData;

    if (key) {
      var nodeByKeyValue = new d3_Map,
          dataByKeyValue = new d3_Map,
          keyValues = [],
          keyValue;

      for (i = -1; ++i < n;) {
        keyValue = key.call(node = group[i], node.__data__, i);
        if (nodeByKeyValue.has(keyValue)) {
          exitNodes[i] = node; // duplicate selection key
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
        keyValues.push(keyValue);
      }

      for (i = -1; ++i < m;) {
        keyValue = key.call(groupData, nodeData = groupData[i], i);
        if (node = nodeByKeyValue.get(keyValue)) {
          updateNodes[i] = node;
          node.__data__ = nodeData;
        } else if (!dataByKeyValue.has(keyValue)) { // no duplicate data key
          enterNodes[i] = d3_selection_dataNode(nodeData);
        }
        dataByKeyValue.set(keyValue, nodeData);
        nodeByKeyValue.remove(keyValue);
      }

      for (i = -1; ++i < n;) {
        if (nodeByKeyValue.has(keyValues[i])) {
          exitNodes[i] = group[i];
        }
      }
    } else {
      for (i = -1; ++i < n0;) {
        node = group[i];
        nodeData = groupData[i];
        if (node) {
          node.__data__ = nodeData;
          updateNodes[i] = node;
        } else {
          enterNodes[i] = d3_selection_dataNode(nodeData);
        }
      }
      for (; i < m; ++i) {
        enterNodes[i] = d3_selection_dataNode(groupData[i]);
      }
      for (; i < n; ++i) {
        exitNodes[i] = group[i];
      }
    }

    enterNodes.update
        = updateNodes;

    enterNodes.parentNode
        = updateNodes.parentNode
        = exitNodes.parentNode
        = group.parentNode;

    enter.push(enterNodes);
    update.push(updateNodes);
    exit.push(exitNodes);
  }

  var enter = d3_selection_enter([]),
      update = d3_selection([]),
      exit = d3_selection([]);

  if (typeof value === "function") {
    while (++i < n) {
      bind(group = this[i], value.call(group, group.parentNode.__data__, i));
    }
  } else {
    while (++i < n) {
      bind(group = this[i], value);
    }
  }

  update.enter = function() { return enter; };
  update.exit = function() { return exit; };
  return update;
};

function d3_selection_dataNode(data) {
  return {__data__: data};
}

d3_selectionPrototype.datum = function(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.property("__data__");
};

d3_selectionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
        subgroup.push(node);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_filter(selector) {
  return function() {
    return d3_selectMatches(this, selector);
  };
}

d3_selectionPrototype.order = function() {
  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
};
d3.ascending = d3_ascending;

function d3_ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

d3_selectionPrototype.sort = function(comparator) {
  comparator = d3_selection_sortComparator.apply(this, arguments);
  for (var j = -1, m = this.length; ++j < m;) this[j].sort(comparator);
  return this.order();
};

function d3_selection_sortComparator(comparator) {
  if (!arguments.length) comparator = d3_ascending;
  return function(a, b) {
    return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
  };
}

d3_selectionPrototype.each = function(callback) {
  return d3_selection_each(this, function(node, i, j) {
    callback.call(node, node.__data__, i, j);
  });
};

function d3_selection_each(groups, callback) {
  for (var j = 0, m = groups.length; j < m; j++) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
      if (node = group[i]) callback(node, i, j);
    }
  }
  return groups;
}

d3_selectionPrototype.call = function(callback) {
  var args = d3_array(arguments);
  callback.apply(args[0] = this, args);
  return this;
};

d3_selectionPrototype.empty = function() {
  return !this.node();
};

d3_selectionPrototype.node = function() {
  for (var j = 0, m = this.length; j < m; j++) {
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
};

d3_selectionPrototype.size = function() {
  var n = 0;
  this.each(function() { ++n; });
  return n;
};

function d3_selection_enter(selection) {
  d3_subclass(selection, d3_selection_enterPrototype);
  return selection;
}

var d3_selection_enterPrototype = [];

d3.selection.enter = d3_selection_enter;
d3.selection.enter.prototype = d3_selection_enterPrototype;

d3_selection_enterPrototype.append = d3_selectionPrototype.append;
d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
d3_selection_enterPrototype.node = d3_selectionPrototype.node;
d3_selection_enterPrototype.call = d3_selectionPrototype.call;
d3_selection_enterPrototype.size = d3_selectionPrototype.size;


d3_selection_enterPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      upgroup,
      group,
      node;

  for (var j = -1, m = this.length; ++j < m;) {
    upgroup = (group = this[j]).update;
    subgroups.push(subgroup = []);
    subgroup.parentNode = group.parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
        subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

d3_selection_enterPrototype.insert = function(name, before) {
  if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
  return d3_selectionPrototype.insert.call(this, name, before);
};

function d3_selection_enterInsertBefore(enter) {
  var i0, j0;
  return function(d, i, j) {
    var group = enter[j].update,
        n = group.length,
        node;
    if (j != j0) j0 = j, i0 = 0;
    if (i >= i0) i0 = i + 1;
    while (!(node = group[i0]) && ++i0 < n);
    return node;
  };
}

// import "../transition/transition";

d3_selectionPrototype.transition = function() {
  var id = d3_transitionInheritId || ++d3_transitionId,
      subgroups = [],
      subgroup,
      node,
      transition = d3_transitionInherit || {time: Date.now(), ease: d3_ease_cubicInOut, delay: 0, duration: 250};

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) d3_transitionNode(node, i, id, transition);
      subgroup.push(node);
    }
  }

  return d3_transition(subgroups, id);
};
// import "../transition/transition";

d3_selectionPrototype.interrupt = function() {
  return this.each(d3_selection_interrupt);
};

function d3_selection_interrupt() {
  var lock = this.__transition__;
  if (lock) ++lock.active;
}

// TODO fast singleton implementation?
d3.select = function(node) {
  var group = [typeof node === "string" ? d3_select(node, d3_document) : node];
  group.parentNode = d3_documentElement;
  return d3_selection([group]);
};

d3.selectAll = function(nodes) {
  var group = d3_array(typeof nodes === "string" ? d3_selectAll(nodes, d3_document) : nodes);
  group.parentNode = d3_documentElement;
  return d3_selection([group]);
};

var d3_selectionRoot = d3.select(d3_documentElement);

d3_selectionPrototype.on = function(type, listener, capture) {
  var n = arguments.length;
  if (n < 3) {

    // For on(object) or on(object, boolean), the object specifies the event
    // types and listeners to add or remove. The optional boolean specifies
    // whether the listener captures events.
    if (typeof type !== "string") {
      if (n < 2) listener = false;
      for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
      return this;
    }

    // For on(string), return the listener for the first node.
    if (n < 2) return (n = this.node()["__on" + type]) && n._;

    // For on(string, function), use the default capture.
    capture = false;
  }

  // Otherwise, a type, listener and capture are specified, and handled as below.
  return this.each(d3_selection_on(type, listener, capture));
};

function d3_selection_on(type, listener, capture) {
  var name = "__on" + type,
      i = type.indexOf("."),
      wrap = d3_selection_onListener;

  if (i > 0) type = type.substring(0, i);
  var filter = d3_selection_onFilters.get(type);
  if (filter) type = filter, wrap = d3_selection_onFilter;

  function onRemove() {
    var l = this[name];
    if (l) {
      this.removeEventListener(type, l, l.$);
      delete this[name];
    }
  }

  function onAdd() {
    var l = wrap(listener, d3_array(arguments));
    onRemove.call(this);
    this.addEventListener(type, this[name] = l, l.$ = capture);
    l._ = listener;
  }

  function removeAll() {
    var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"),
        match;
    for (var name in this) {
      if (match = name.match(re)) {
        var l = this[name];
        this.removeEventListener(match[1], l, l.$);
        delete this[name];
      }
    }
  }

  return i
      ? listener ? onAdd : onRemove
      : listener ? d3_noop : removeAll;
}

var d3_selection_onFilters = d3.map({
  mouseenter: "mouseover",
  mouseleave: "mouseout"
});

d3_selection_onFilters.forEach(function(k) {
  if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
});

function d3_selection_onListener(listener, argumentz) {
  return function(e) {
    var o = d3.event; // Events can be reentrant (e.g., focus).
    d3.event = e;
    argumentz[0] = this.__data__;
    try {
      listener.apply(this, argumentz);
    } finally {
      d3.event = o;
    }
  };
}

function d3_selection_onFilter(listener, argumentz) {
  var l = d3_selection_onListener(listener, argumentz);
  return function(e) {
    var target = this, related = e.relatedTarget;
    if (!related || (related !== target && !(related.compareDocumentPosition(target) & 8))) {
      l.call(target, e);
    }
  };
}

var d3_event_dragSelect = "onselectstart" in d3_document ? null : d3_vendorSymbol(d3_documentElement.style, "userSelect"),
    d3_event_dragId = 0;

function d3_event_dragSuppress() {
  var name = ".dragsuppress-" + ++d3_event_dragId,
      click = "click" + name,
      w = d3.select(d3_window)
          .on("touchmove" + name, d3_eventPreventDefault)
          .on("dragstart" + name, d3_eventPreventDefault)
          .on("selectstart" + name, d3_eventPreventDefault);
  if (d3_event_dragSelect) {
    var style = d3_documentElement.style,
        select = style[d3_event_dragSelect];
    style[d3_event_dragSelect] = "none";
  }
  return function(suppressClick) {
    w.on(name, null);
    if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
    if (suppressClick) { // suppress the next click, but only if it’s immediate
      function off() { w.on(click, null); }
      w.on(click, function() { d3_eventPreventDefault(); off(); }, true);
      setTimeout(off, 0);
    }
  };
}

d3.mouse = function(container) {
  return d3_mousePoint(container, d3_eventSource());
};

// https://bugs.webkit.org/show_bug.cgi?id=44083
var d3_mouse_bug44083 = /WebKit/.test(d3_window.navigator.userAgent) ? -1 : 0;

function d3_mousePoint(container, e) {
  if (e.changedTouches) e = e.changedTouches[0];
  var svg = container.ownerSVGElement || container;
  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    if (d3_mouse_bug44083 < 0 && (d3_window.scrollX || d3_window.scrollY)) {
      svg = d3.select("body").append("svg").style({
        position: "absolute",
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        border: "none"
      }, "important");
      var ctm = svg[0][0].getScreenCTM();
      d3_mouse_bug44083 = !(ctm.f || ctm.e);
      svg.remove();
    }
    if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY;
    else point.x = e.clientX, point.y = e.clientY;
    point = point.matrixTransform(container.getScreenCTM().inverse());
    return [point.x, point.y];
  }
  var rect = container.getBoundingClientRect();
  return [e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop];
};

d3.touches = function(container, touches) {
  if (arguments.length < 2) touches = d3_eventSource().touches;
  return touches ? d3_array(touches).map(function(touch) {
    var point = d3_mousePoint(container, touch);
    point.identifier = touch.identifier;
    return point;
  }) : [];
};
d3.behavior = {};

d3.behavior.drag = function() {
  var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"),
      origin = null,
      mousedown = dragstart(d3_noop, d3.mouse, d3_behavior_dragMouseSubject, "mousemove", "mouseup"),
      touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_behavior_dragTouchSubject, "touchmove", "touchend");

  function drag() {
    this.on("mousedown.drag", mousedown)
        .on("touchstart.drag", touchstart);
  }

  function dragstart(id, position, subject, move, end) {
    return function() {
      var that = this,
          target = d3.event.target,
          parent = that.parentNode,
          dispatch = event.of(that, arguments),
          dragged = 0,
          dragId = id(),
          dragName = ".drag" + (dragId == null ? "" : "-" + dragId),
          dragOffset,
          dragSubject = d3.select(subject()).on(move + dragName, moved).on(end + dragName, ended),
          dragRestore = d3_event_dragSuppress(),
          position0 = position(parent, dragId);

      if (origin) {
        dragOffset = origin.apply(that, arguments);
        dragOffset = [dragOffset.x - position0[0], dragOffset.y - position0[1]];
      } else {
        dragOffset = [0, 0];
      }

      dispatch({type: "dragstart"});

      function moved() {
        var position1 = position(parent, dragId), dx, dy;
        if (!position1) return; // this touch didn’t move

        dx = position1[0] - position0[0];
        dy = position1[1] - position0[1];
        dragged |= dx | dy;
        position0 = position1;

        dispatch({
          type: "drag",
          x: position1[0] + dragOffset[0],
          y: position1[1] + dragOffset[1],
          dx: dx,
          dy: dy
        });
      }

      function ended() {
        if (!position(parent, dragId)) return; // this touch didn’t end
        dragSubject.on(move + dragName, null).on(end + dragName, null);
        dragRestore(dragged && d3.event.target === target);
        dispatch({type: "dragend"});
      }
    };
  }

  drag.origin = function(x) {
    if (!arguments.length) return origin;
    origin = x;
    return drag;
  };

  return d3.rebind(drag, event, "on");
};

// While it is possible to receive a touchstart event with more than one changed
// touch, the event is only shared by touches on the same target; for new
// touches targetting different elements, multiple touchstart events are
// received even when the touches start simultaneously. Since multiple touches
// cannot move the same target to different locations concurrently without
// tearing the fabric of spacetime, we allow the first touch to win.
function d3_behavior_dragTouchId() {
  return d3.event.changedTouches[0].identifier;
}

function d3_behavior_dragTouchSubject() {
  return d3.event.target;
}

function d3_behavior_dragMouseSubject() {
  return d3_window;
}
function d3_functor(v) {
  return typeof v === "function" ? v : function() { return v; };
}

d3.functor = d3_functor;
function d3_true() {
  return true;
}

var d3_timer_queueHead,
    d3_timer_queueTail,
    d3_timer_interval, // is an interval (or frame) active?
    d3_timer_timeout, // is a timeout active?
    d3_timer_active, // active timer object
    d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")] || function(callback) { setTimeout(callback, 17); };

// The timer will continue to fire until callback returns true.
d3.timer = function(callback, delay, then) {
  var n = arguments.length;
  if (n < 2) delay = 0;
  if (n < 3) then = Date.now();

  // Add the callback to the tail of the queue.
  var time = then + delay, timer = {c: callback, t: time, f: false, n: null};
  if (d3_timer_queueTail) d3_timer_queueTail.n = timer;
  else d3_timer_queueHead = timer;
  d3_timer_queueTail = timer;

  // Start animatin'!
  if (!d3_timer_interval) {
    d3_timer_timeout = clearTimeout(d3_timer_timeout);
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
};

function d3_timer_step() {
  var now = d3_timer_mark(),
      delay = d3_timer_sweep() - now;
  if (delay > 24) {
    if (isFinite(delay)) {
      clearTimeout(d3_timer_timeout);
      d3_timer_timeout = setTimeout(d3_timer_step, delay);
    }
    d3_timer_interval = 0;
  } else {
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
}

d3.timer.flush = function() {
  d3_timer_mark();
  d3_timer_sweep();
};

function d3_timer_mark() {
  var now = Date.now();
  d3_timer_active = d3_timer_queueHead;
  while (d3_timer_active) {
    if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);
    d3_timer_active = d3_timer_active.n;
  }
  return now;
}

// Flush after callbacks to avoid concurrent queue modification.
// Returns the time of the earliest active timer, post-sweep.
function d3_timer_sweep() {
  var t0,
      t1 = d3_timer_queueHead,
      time = Infinity;
  while (t1) {
    if (t1.f) {
      t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
    } else {
      if (t1.t < time) time = t1.t;
      t1 = (t0 = t1).n;
    }
  }
  d3_timer_queueTail = t0;
  return time;
}
function d3_identity(d) {
  return d;
}
var π = Math.PI,
    τ = 2 * π,
    halfπ = π / 2,
    ε = 1e-6,
    ε2 = ε * ε,
    d3_radians = π / 180,
    d3_degrees = 180 / π;

function d3_sgn(x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

// Returns the 2D cross product of AB and AC vectors, i.e., the z-component of
// the 3D cross product in a quadrant I Cartesian coordinate system (+x is
// right, +y is up). Returns a positive value if ABC is counter-clockwise,
// negative if clockwise, and zero if the points are collinear.
function d3_cross2d(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function d3_acos(x) {
  return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
}

function d3_asin(x) {
  return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
}

function d3_sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function d3_cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function d3_tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

function d3_haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}

var d3_ease_default = function() { return d3_identity; };

var d3_ease = d3.map({
  linear: d3_ease_default,
  poly: d3_ease_poly,
  quad: function() { return d3_ease_quad; },
  cubic: function() { return d3_ease_cubic; },
  sin: function() { return d3_ease_sin; },
  exp: function() { return d3_ease_exp; },
  circle: function() { return d3_ease_circle; },
  elastic: d3_ease_elastic,
  back: d3_ease_back,
  bounce: function() { return d3_ease_bounce; }
});

var d3_ease_mode = d3.map({
  "in": d3_identity,
  "out": d3_ease_reverse,
  "in-out": d3_ease_reflect,
  "out-in": function(f) { return d3_ease_reflect(d3_ease_reverse(f)); }
});

d3.ease = function(name) {
  var i = name.indexOf("-"),
      t = i >= 0 ? name.substring(0, i) : name,
      m = i >= 0 ? name.substring(i + 1) : "in";
  t = d3_ease.get(t) || d3_ease_default;
  m = d3_ease_mode.get(m) || d3_identity;
  return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
};

function d3_ease_clamp(f) {
  return function(t) {
    return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
  };
}

function d3_ease_reverse(f) {
  return function(t) {
    return 1 - f(1 - t);
  };
}

function d3_ease_reflect(f) {
  return function(t) {
    return .5 * (t < .5 ? f(2 * t) : (2 - f(2 - 2 * t)));
  };
}

function d3_ease_quad(t) {
  return t * t;
}

function d3_ease_cubic(t) {
  return t * t * t;
}

// Optimized clamp(reflect(poly(3))).
function d3_ease_cubicInOut(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  var t2 = t * t, t3 = t2 * t;
  return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
}

function d3_ease_poly(e) {
  return function(t) {
    return Math.pow(t, e);
  };
}

function d3_ease_sin(t) {
  return 1 - Math.cos(t * halfπ);
}

function d3_ease_exp(t) {
  return Math.pow(2, 10 * (t - 1));
}

function d3_ease_circle(t) {
  return 1 - Math.sqrt(1 - t * t);
}

function d3_ease_elastic(a, p) {
  var s;
  if (arguments.length < 2) p = 0.45;
  if (arguments.length) s = p / τ * Math.asin(1 / a);
  else a = 1, s = p / 4;
  return function(t) {
    return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);
  };
}

function d3_ease_back(s) {
  if (!s) s = 1.70158;
  return function(t) {
    return t * t * ((s + 1) * t - s);
  };
}

function d3_ease_bounce(t) {
  return t < 1 / 2.75 ? 7.5625 * t * t
      : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75
      : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375
      : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
}

function d3_transition(groups, id) {
  d3_subclass(groups, d3_transitionPrototype);

  groups.id = id; // Note: read-only!

  return groups;
}

var d3_transitionPrototype = [],
    d3_transitionId = 0,
    d3_transitionInheritId,
    d3_transitionInherit;

d3_transitionPrototype.call = d3_selectionPrototype.call;
d3_transitionPrototype.empty = d3_selectionPrototype.empty;
d3_transitionPrototype.node = d3_selectionPrototype.node;
d3_transitionPrototype.size = d3_selectionPrototype.size;

d3.transition = function(selection) {
  return arguments.length
      ? (d3_transitionInheritId ? selection.transition() : selection)
      : d3_selectionRoot.transition();
};

d3.transition.prototype = d3_transitionPrototype;


d3_transitionPrototype.select = function(selector) {
  var id = this.id,
      subgroups = [],
      subgroup,
      subnode,
      node;

  selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        d3_transitionNode(subnode, i, id, node.__transition__[id]);
        subgroup.push(subnode);
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_transition(subgroups, id);
};

d3_transitionPrototype.selectAll = function(selector) {
  var id = this.id,
      subgroups = [],
      subgroup,
      subnodes,
      node,
      subnode,
      transition;

  selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        transition = node.__transition__[id];
        subnodes = selector.call(node, node.__data__, i, j);
        subgroups.push(subgroup = []);
        for (var k = -1, o = subnodes.length; ++k < o;) {
          if (subnode = subnodes[k]) d3_transitionNode(subnode, k, id, transition);
          subgroup.push(subnode);
        }
      }
    }
  }

  return d3_transition(subgroups, id);
};

d3_transitionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
        subgroup.push(node);
      }
    }
  }

  return d3_transition(subgroups, this.id);
};
d3.color = d3_color;

function d3_color() {}

d3_color.prototype.toString = function() {
  return this.rgb() + "";
};

d3.hsl = d3_hsl;

function d3_hsl(h, s, l) {
  return this instanceof d3_hsl ? void (this.h = +h, this.s = +s, this.l = +l)
      : arguments.length < 2 ? (h instanceof d3_hsl ? new d3_hsl(h.h, h.s, h.l)
      : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl))
      : new d3_hsl(h, s, l);
}

var d3_hslPrototype = d3_hsl.prototype = new d3_color;

d3_hslPrototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_hsl(this.h, this.s, this.l / k);
};

d3_hslPrototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_hsl(this.h, this.s, k * this.l);
};

d3_hslPrototype.rgb = function() {
  return d3_hsl_rgb(this.h, this.s, this.l);
};

function d3_hsl_rgb(h, s, l) {
  var m1,
      m2;

  /* Some simple corrections for h, s and l. */
  h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
  s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
  l = l < 0 ? 0 : l > 1 ? 1 : l;

  /* From FvD 13.37, CSS Color Module Level 3 */
  m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
  m1 = 2 * l - m2;

  function v(h) {
    if (h > 360) h -= 360;
    else if (h < 0) h += 360;
    if (h < 60) return m1 + (m2 - m1) * h / 60;
    if (h < 180) return m2;
    if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
    return m1;
  }

  function vv(h) {
    return Math.round(v(h) * 255);
  }

  return new d3_rgb(vv(h + 120), vv(h), vv(h - 120));
}

d3.hcl = d3_hcl;

function d3_hcl(h, c, l) {
  return this instanceof d3_hcl ? void (this.h = +h, this.c = +c, this.l = +l)
      : arguments.length < 2 ? (h instanceof d3_hcl ? new d3_hcl(h.h, h.c, h.l)
      : (h instanceof d3_lab ? d3_lab_hcl(h.l, h.a, h.b)
      : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b)))
      : new d3_hcl(h, c, l);
}

var d3_hclPrototype = d3_hcl.prototype = new d3_color;

d3_hclPrototype.brighter = function(k) {
  return new d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
};

d3_hclPrototype.darker = function(k) {
  return new d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
};

d3_hclPrototype.rgb = function() {
  return d3_hcl_lab(this.h, this.c, this.l).rgb();
};

function d3_hcl_lab(h, c, l) {
  if (isNaN(h)) h = 0;
  if (isNaN(c)) c = 0;
  return new d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
}

d3.lab = d3_lab;

function d3_lab(l, a, b) {
  return this instanceof d3_lab ? void (this.l = +l, this.a = +a, this.b = +b)
      : arguments.length < 2 ? (l instanceof d3_lab ? new d3_lab(l.l, l.a, l.b)
      : (l instanceof d3_hcl ? d3_hcl_lab(l.l, l.c, l.h)
      : d3_rgb_lab((l = d3_rgb(l)).r, l.g, l.b)))
      : new d3_lab(l, a, b);
}

// Corresponds roughly to RGB brighter/darker
var d3_lab_K = 18;

// D65 standard referent
var d3_lab_X = 0.950470,
    d3_lab_Y = 1,
    d3_lab_Z = 1.088830;

var d3_labPrototype = d3_lab.prototype = new d3_color;

d3_labPrototype.brighter = function(k) {
  return new d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
};

d3_labPrototype.darker = function(k) {
  return new d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
};

d3_labPrototype.rgb = function() {
  return d3_lab_rgb(this.l, this.a, this.b);
};

function d3_lab_rgb(l, a, b) {
  var y = (l + 16) / 116,
      x = y + a / 500,
      z = y - b / 200;
  x = d3_lab_xyz(x) * d3_lab_X;
  y = d3_lab_xyz(y) * d3_lab_Y;
  z = d3_lab_xyz(z) * d3_lab_Z;
  return new d3_rgb(
    d3_xyz_rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    d3_xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
    d3_xyz_rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z)
  );
}

function d3_lab_hcl(l, a, b) {
  return l > 0
      ? new d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l)
      : new d3_hcl(NaN, NaN, l);
}

function d3_lab_xyz(x) {
  return x > 0.206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
}
function d3_xyz_lab(x) {
  return x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
}

function d3_xyz_rgb(r) {
  return Math.round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055));
}

d3.rgb = d3_rgb;

function d3_rgb(r, g, b) {
  return this instanceof d3_rgb ? void (this.r = ~~r, this.g = ~~g, this.b = ~~b)
      : arguments.length < 2 ? (r instanceof d3_rgb ? new d3_rgb(r.r, r.g, r.b)
      : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb))
      : new d3_rgb(r, g, b);
}

function d3_rgbNumber(value) {
  return new d3_rgb(value >> 16, value >> 8 & 0xff, value & 0xff);
}

function d3_rgbString(value) {
  return d3_rgbNumber(value) + "";
}

var d3_rgbPrototype = d3_rgb.prototype = new d3_color;

d3_rgbPrototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  var r = this.r,
      g = this.g,
      b = this.b,
      i = 30;
  if (!r && !g && !b) return new d3_rgb(i, i, i);
  if (r && r < i) r = i;
  if (g && g < i) g = i;
  if (b && b < i) b = i;
  return new d3_rgb(Math.min(255, r / k), Math.min(255, g / k), Math.min(255, b / k));
};

d3_rgbPrototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_rgb(k * this.r, k * this.g, k * this.b);
};

d3_rgbPrototype.hsl = function() {
  return d3_rgb_hsl(this.r, this.g, this.b);
};

d3_rgbPrototype.toString = function() {
  return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
};

function d3_rgb_hex(v) {
  return v < 0x10
      ? "0" + Math.max(0, v).toString(16)
      : Math.min(255, v).toString(16);
}

function d3_rgb_parse(format, rgb, hsl) {
  var r = 0, // red channel; int in [0, 255]
      g = 0, // green channel; int in [0, 255]
      b = 0, // blue channel; int in [0, 255]
      m1, // CSS color specification match
      m2, // CSS color specification type (e.g., rgb)
      color;

  /* Handle hsl, rgb. */
  m1 = /([a-z]+)\((.*)\)/i.exec(format);
  if (m1) {
    m2 = m1[2].split(",");
    switch (m1[1]) {
      case "hsl": {
        return hsl(
          parseFloat(m2[0]), // degrees
          parseFloat(m2[1]) / 100, // percentage
          parseFloat(m2[2]) / 100 // percentage
        );
      }
      case "rgb": {
        return rgb(
          d3_rgb_parseNumber(m2[0]),
          d3_rgb_parseNumber(m2[1]),
          d3_rgb_parseNumber(m2[2])
        );
      }
    }
  }

  /* Named colors. */
  if (color = d3_rgb_names.get(format)) return rgb(color.r, color.g, color.b);

  /* Hexadecimal colors: #rgb and #rrggbb. */
  if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.substring(1), 16))) {
    if (format.length === 4) {
      r = (color & 0xf00) >> 4; r = (r >> 4) | r;
      g = (color & 0xf0); g = (g >> 4) | g;
      b = (color & 0xf); b = (b << 4) | b;
    } else if (format.length === 7) {
      r = (color & 0xff0000) >> 16;
      g = (color & 0xff00) >> 8;
      b = (color & 0xff);
    }
  }

  return rgb(r, g, b);
}

function d3_rgb_hsl(r, g, b) {
  var min = Math.min(r /= 255, g /= 255, b /= 255),
      max = Math.max(r, g, b),
      d = max - min,
      h,
      s,
      l = (max + min) / 2;
  if (d) {
    s = l < .5 ? d / (max + min) : d / (2 - max - min);
    if (r == max) h = (g - b) / d + (g < b ? 6 : 0);
    else if (g == max) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  } else {
    h = NaN;
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new d3_hsl(h, s, l);
}

function d3_rgb_lab(r, g, b) {
  r = d3_rgb_xyz(r);
  g = d3_rgb_xyz(g);
  b = d3_rgb_xyz(b);
  var x = d3_xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / d3_lab_X),
      y = d3_xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / d3_lab_Y),
      z = d3_xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / d3_lab_Z);
  return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
}

function d3_rgb_xyz(r) {
  return (r /= 255) <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
}

function d3_rgb_parseNumber(c) { // either integer or percentage
  var f = parseFloat(c);
  return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
}

var d3_rgb_names = d3.map({
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
});

d3_rgb_names.forEach(function(key, value) {
  d3_rgb_names.set(key, d3_rgbNumber(value));
});

d3.interpolateRgb = d3_interpolateRgb;

function d3_interpolateRgb(a, b) {
  a = d3.rgb(a);
  b = d3.rgb(b);
  var ar = a.r,
      ag = a.g,
      ab = a.b,
      br = b.r - ar,
      bg = b.g - ag,
      bb = b.b - ab;
  return function(t) {
    return "#"
        + d3_rgb_hex(Math.round(ar + br * t))
        + d3_rgb_hex(Math.round(ag + bg * t))
        + d3_rgb_hex(Math.round(ab + bb * t));
  };
}

d3.interpolateObject = d3_interpolateObject;

function d3_interpolateObject(a, b) {
  var i = {},
      c = {},
      k;
  for (k in a) {
    if (k in b) {
      i[k] = d3_interpolate(a[k], b[k]);
    } else {
      c[k] = a[k];
    }
  }
  for (k in b) {
    if (!(k in a)) {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

d3.interpolateArray = d3_interpolateArray;

function d3_interpolateArray(a, b) {
  var x = [],
      c = [],
      na = a.length,
      nb = b.length,
      n0 = Math.min(a.length, b.length),
      i;
  for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
  for (; i < na; ++i) c[i] = a[i];
  for (; i < nb; ++i) c[i] = b[i];
  return function(t) {
    for (i = 0; i < n0; ++i) c[i] = x[i](t);
    return c;
  };
}
d3.interpolateNumber = d3_interpolateNumber;

function d3_interpolateNumber(a, b) {
  b -= a = +a;
  return function(t) { return a + b * t; };
}

d3.interpolateString = d3_interpolateString;

function d3_interpolateString(a, b) {
  var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = d3_interpolate_numberA.exec(a))
      && (bm = d3_interpolate_numberB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.substring(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: d3_interpolateNumber(am, bm)});
    }
    bi = d3_interpolate_numberB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.substring(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2
      ? (q[0] ? (b = q[0].x, function(t) { return b(t) + ""; })
      : function() { return b; })
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");

d3.interpolate = d3_interpolate;

function d3_interpolate(a, b) {
  var i = d3.interpolators.length, f;
  while (--i >= 0 && !(f = d3.interpolators[i](a, b)));
  return f;
}

d3.interpolators = [
  function(a, b) {
    var t = typeof b;
    return (t === "string" ? (d3_rgb_names.has(b) || /^(#|rgb\(|hsl\()/.test(b) ? d3_interpolateRgb : d3_interpolateString)
        : b instanceof d3_color ? d3_interpolateRgb
        : Array.isArray(b) ? d3_interpolateArray
        : t === "object" && isNaN(b) ? d3_interpolateObject
        : d3_interpolateNumber)(a, b);
  }
];

d3.transform = function(string) {
  var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
  return (d3.transform = function(string) {
    if (string != null) {
      g.setAttribute("transform", string);
      var t = g.transform.baseVal.consolidate();
    }
    return new d3_transform(t ? t.matrix : d3_transformIdentity);
  })(string);
};

// Compute x-scale and normalize the first row.
// Compute shear and make second row orthogonal to first.
// Compute y-scale and normalize the second row.
// Finally, compute the rotation.
function d3_transform(m) {
  var r0 = [m.a, m.b],
      r1 = [m.c, m.d],
      kx = d3_transformNormalize(r0),
      kz = d3_transformDot(r0, r1),
      ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
  if (r0[0] * r1[1] < r1[0] * r0[1]) {
    r0[0] *= -1;
    r0[1] *= -1;
    kx *= -1;
    kz *= -1;
  }
  this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
  this.translate = [m.e, m.f];
  this.scale = [kx, ky];
  this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
};

d3_transform.prototype.toString = function() {
  return "translate(" + this.translate
      + ")rotate(" + this.rotate
      + ")skewX(" + this.skew
      + ")scale(" + this.scale
      + ")";
};

function d3_transformDot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function d3_transformNormalize(a) {
  var k = Math.sqrt(d3_transformDot(a, a));
  if (k) {
    a[0] /= k;
    a[1] /= k;
  }
  return k;
}

function d3_transformCombine(a, b, k) {
  a[0] += k * b[0];
  a[1] += k * b[1];
  return a;
}

var d3_transformIdentity = {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0};

d3.interpolateTransform = d3_interpolateTransform;

function d3_interpolateTransform(a, b) {
  var s = [], // string constants and placeholders
      q = [], // number interpolators
      n,
      A = d3.transform(a),
      B = d3.transform(b),
      ta = A.translate,
      tb = B.translate,
      ra = A.rotate,
      rb = B.rotate,
      wa = A.skew,
      wb = B.skew,
      ka = A.scale,
      kb = B.scale;

  if (ta[0] != tb[0] || ta[1] != tb[1]) {
    s.push("translate(", null, ",", null, ")");
    q.push({i: 1, x: d3_interpolateNumber(ta[0], tb[0])}, {i: 3, x: d3_interpolateNumber(ta[1], tb[1])});
  } else if (tb[0] || tb[1]) {
    s.push("translate(" + tb + ")");
  } else {
    s.push("");
  }

  if (ra != rb) {
    if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360; // shortest path
    q.push({i: s.push(s.pop() + "rotate(", null, ")") - 2, x: d3_interpolateNumber(ra, rb)});
  } else if (rb) {
    s.push(s.pop() + "rotate(" + rb + ")");
  }

  if (wa != wb) {
    q.push({i: s.push(s.pop() + "skewX(", null, ")") - 2, x: d3_interpolateNumber(wa, wb)});
  } else if (wb) {
    s.push(s.pop() + "skewX(" + wb + ")");
  }

  if (ka[0] != kb[0] || ka[1] != kb[1]) {
    n = s.push(s.pop() + "scale(", null, ",", null, ")");
    q.push({i: n - 4, x: d3_interpolateNumber(ka[0], kb[0])}, {i: n - 2, x: d3_interpolateNumber(ka[1], kb[1])});
  } else if (kb[0] != 1 || kb[1] != 1) {
    s.push(s.pop() + "scale(" + kb + ")");
  }

  n = q.length;
  return function(t) {
    var i = -1, o;
    while (++i < n) s[(o = q[i]).i] = o.x(t);
    return s.join("");
  };
}

d3_transitionPrototype.tween = function(name, tween) {
  var id = this.id;
  if (arguments.length < 2) return this.node().__transition__[id].tween.get(name);
  return d3_selection_each(this, tween == null
        ? function(node) { node.__transition__[id].tween.remove(name); }
        : function(node) { node.__transition__[id].tween.set(name, tween); });
};

function d3_transition_tween(groups, name, value, tween) {
  var id = groups.id;
  return d3_selection_each(groups, typeof value === "function"
      ? function(node, i, j) { node.__transition__[id].tween.set(name, tween(value.call(node, node.__data__, i, j))); }
      : (value = tween(value), function(node) { node.__transition__[id].tween.set(name, value); }));
}

d3_transitionPrototype.attr = function(nameNS, value) {
  if (arguments.length < 2) {

    // For attr(object), the object specifies the names and values of the
    // attributes to transition. The values may be functions that are
    // evaluated for each element.
    for (value in nameNS) this.attr(value, nameNS[value]);
    return this;
  }

  var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate,
      name = d3.ns.qualify(nameNS);

  // For attr(string, null), remove the attribute with the specified name.
  function attrNull() {
    this.removeAttribute(name);
  }
  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  // For attr(string, string), set the attribute with the specified name.
  function attrTween(b) {
    return b == null ? attrNull : (b += "", function() {
      var a = this.getAttribute(name), i;
      return a !== b && (i = interpolate(a, b), function(t) { this.setAttribute(name, i(t)); });
    });
  }
  function attrTweenNS(b) {
    return b == null ? attrNullNS : (b += "", function() {
      var a = this.getAttributeNS(name.space, name.local), i;
      return a !== b && (i = interpolate(a, b), function(t) { this.setAttributeNS(name.space, name.local, i(t)); });
    });
  }

  return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
};

d3_transitionPrototype.attrTween = function(nameNS, tween) {
  var name = d3.ns.qualify(nameNS);

  function attrTween(d, i) {
    var f = tween.call(this, d, i, this.getAttribute(name));
    return f && function(t) { this.setAttribute(name, f(t)); };
  }
  function attrTweenNS(d, i) {
    var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
    return f && function(t) { this.setAttributeNS(name.space, name.local, f(t)); };
  }

  return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
};

d3_transitionPrototype.style = function(name, value, priority) {
  var n = arguments.length;
  if (n < 3) {

    // For style(object) or style(object, string), the object specifies the
    // names and values of the attributes to set or remove. The values may be
    // functions that are evaluated for each element. The optional string
    // specifies the priority.
    if (typeof name !== "string") {
      if (n < 2) value = "";
      for (priority in name) this.style(priority, name[priority], value);
      return this;
    }

    // For style(string, string) or style(string, function), use the default
    // priority. The priority is ignored for style(string, null).
    priority = "";
  }

  // For style(name, null) or style(name, null, priority), remove the style
  // property with the specified name. The priority is ignored.
  function styleNull() {
    this.style.removeProperty(name);
  }

  // For style(name, string) or style(name, string, priority), set the style
  // property with the specified name, using the specified priority.
  // Otherwise, a name, value and priority are specified, and handled as below.
  function styleString(b) {
    return b == null ? styleNull : (b += "", function() {
      var a = d3_window.getComputedStyle(this, null).getPropertyValue(name), i;
      return a !== b && (i = d3_interpolate(a, b), function(t) { this.style.setProperty(name, i(t), priority); });
    });
  }

  return d3_transition_tween(this, "style." + name, value, styleString);
};

d3_transitionPrototype.styleTween = function(name, tween, priority) {
  if (arguments.length < 3) priority = "";

  function styleTween(d, i) {
    var f = tween.call(this, d, i, d3_window.getComputedStyle(this, null).getPropertyValue(name));
    return f && function(t) { this.style.setProperty(name, f(t), priority); };
  }

  return this.tween("style." + name, styleTween);
};

d3_transitionPrototype.text = function(value) {
  return d3_transition_tween(this, "text", value, d3_transition_text);
};

function d3_transition_text(b) {
  if (b == null) b = "";
  return function() { this.textContent = b; };
}

d3_transitionPrototype.remove = function() {
  return this.each("end.transition", function() {
    var p;
    if (this.__transition__.count < 2 && (p = this.parentNode)) p.removeChild(this);
  });
};

d3_transitionPrototype.ease = function(value) {
  var id = this.id;
  if (arguments.length < 1) return this.node().__transition__[id].ease;
  if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
  return d3_selection_each(this, function(node) { node.__transition__[id].ease = value; });
};

d3_transitionPrototype.delay = function(value) {
  var id = this.id;
  if (arguments.length < 1) return this.node().__transition__[id].delay;
  return d3_selection_each(this, typeof value === "function"
      ? function(node, i, j) { node.__transition__[id].delay = +value.call(node, node.__data__, i, j); }
      : (value = +value, function(node) { node.__transition__[id].delay = value; }));
};

d3_transitionPrototype.duration = function(value) {
  var id = this.id;
  if (arguments.length < 1) return this.node().__transition__[id].duration;
  return d3_selection_each(this, typeof value === "function"
      ? function(node, i, j) { node.__transition__[id].duration = Math.max(1, value.call(node, node.__data__, i, j)); }
      : (value = Math.max(1, value), function(node) { node.__transition__[id].duration = value; }));
};

d3_transitionPrototype.transition = function() {
  var id0 = this.id,
      id1 = ++d3_transitionId,
      subgroups = [],
      subgroup,
      group,
      node,
      transition;

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      if (node = group[i]) {
        transition = Object.create(node.__transition__[id0]);
        transition.delay += transition.duration;
        d3_transitionNode(node, i, id1, transition);
      }
      subgroup.push(node);
    }
  }

  return d3_transition(subgroups, id1);
};

function d3_transitionNode(node, i, id, inherit) {
  var lock = node.__transition__ || (node.__transition__ = {active: 0, count: 0}),
      transition = lock[id];

  if (!transition) {
    var time = inherit.time;

    transition = lock[id] = {
      tween: new d3_Map,
      time: time,
      ease: inherit.ease,
      delay: inherit.delay,
      duration: inherit.duration
    };

    ++lock.count;

    d3.timer(function(elapsed) {
      var d = node.__data__,
          ease = transition.ease,
          delay = transition.delay,
          duration = transition.duration,
          timer = d3_timer_active,
          tweened = [];

      timer.t = delay + time;
      if (delay <= elapsed) return start(elapsed - delay);
      timer.c = start;

      function start(elapsed) {
        if (lock.active > id) return stop();
        lock.active = id;
        transition.event && transition.event.start.call(node, d, i);

        transition.tween.forEach(function(key, value) {
          if (value = value.call(node, d, i)) {
            tweened.push(value);
          }
        });

        d3.timer(function() { // defer to end of current frame
          timer.c = tick(elapsed || 1) ? d3_true : tick;
          return 1;
        }, 0, time);
      }

      function tick(elapsed) {
        if (lock.active !== id) return stop();

        var t = elapsed / duration,
            e = ease(t),
            n = tweened.length;

        while (n > 0) {
          tweened[--n].call(node, e);
        }

        if (t >= 1) {
          transition.event && transition.event.end.call(node, d, i);
          return stop();
        }
      }

      function stop() {
        if (--lock.count) delete lock[id];
        else delete node.__transition__;
        return 1;
      }
    }, 0, time);
  }
}

d3_transitionPrototype.each = function(type, listener) {
  var id = this.id;
  if (arguments.length < 2) {
    var inherit = d3_transitionInherit,
        inheritId = d3_transitionInheritId;
    d3_transitionInheritId = id;
    d3_selection_each(this, function(node, i, j) {
      d3_transitionInherit = node.__transition__[id];
      type.call(node, node.__data__, i, j);
    });
    d3_transitionInherit = inherit;
    d3_transitionInheritId = inheritId;
  } else {
    d3_selection_each(this, function(node) {
      var transition = node.__transition__[id];
      (transition.event || (transition.event = d3.dispatch("start", "end"))).on(type, listener);
    });
  }
  return this;
};

d3.xhr = d3_xhrType(d3_identity);

function d3_xhrType(response) {
  return function(url, mimeType, callback) {
    if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, mimeType = null;
    return d3_xhr(url, mimeType, response, callback);
  };
}

function d3_xhr(url, mimeType, response, callback) {
  var xhr = {},
      dispatch = d3.dispatch("beforesend", "progress", "load", "error"),
      headers = {},
      request = new XMLHttpRequest,
      responseType = null;

  // If IE does not support CORS, use XDomainRequest.
  if (d3_window.XDomainRequest
      && !("withCredentials" in request)
      && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest;

  "onload" in request
      ? request.onload = request.onerror = respond
      : request.onreadystatechange = function() { request.readyState > 3 && respond(); };

  function respond() {
    var status = request.status, result;
    if (!status && request.responseText || status >= 200 && status < 300 || status === 304) {
      try {
        result = response.call(xhr, request);
      } catch (e) {
        dispatch.error.call(xhr, e);
        return;
      }
      dispatch.load.call(xhr, result);
    } else {
      dispatch.error.call(xhr, request);
    }
  }

  request.onprogress = function(event) {
    var o = d3.event;
    d3.event = event;
    try { dispatch.progress.call(xhr, request); }
    finally { d3.event = o; }
  };

  xhr.header = function(name, value) {
    name = (name + "").toLowerCase();
    if (arguments.length < 2) return headers[name];
    if (value == null) delete headers[name];
    else headers[name] = value + "";
    return xhr;
  };

  // If mimeType is non-null and no Accept header is set, a default is used.
  xhr.mimeType = function(value) {
    if (!arguments.length) return mimeType;
    mimeType = value == null ? null : value + "";
    return xhr;
  };

  // Specifies what type the response value should take;
  // for instance, arraybuffer, blob, document, or text.
  xhr.responseType = function(value) {
    if (!arguments.length) return responseType;
    responseType = value;
    return xhr;
  };

  // Specify how to convert the response content to a specific type;
  // changes the callback value on "load" events.
  xhr.response = function(value) {
    response = value;
    return xhr;
  };

  // Convenience methods.
  ["get", "post"].forEach(function(method) {
    xhr[method] = function() {
      return xhr.send.apply(xhr, [method].concat(d3_array(arguments)));
    };
  });

  // If callback is non-null, it will be used for error and load events.
  xhr.send = function(method, data, callback) {
    if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
    request.open(method, url, true);
    if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
    if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
    if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
    if (responseType != null) request.responseType = responseType;
    if (callback != null) xhr.on("error", callback).on("load", function(request) { callback(null, request); });
    dispatch.beforesend.call(xhr, request);
    request.send(data == null ? null : data);
    return xhr;
  };

  xhr.abort = function() {
    request.abort();
    return xhr;
  };

  d3.rebind(xhr, dispatch, "on");

  return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
};

function d3_xhr_fixCallback(callback) {
  return callback.length === 1
      ? function(error, request) { callback(error == null ? request : null); }
      : callback;
}

d3.json = function(url, callback) {
  return d3_xhr(url, "application/json", d3_json, callback);
};

function d3_json(request) {
  return JSON.parse(request.responseText);
}
var d3_time = d3.time = {},
    d3_date = Date;

function d3_date_utc() {
  this._ = new Date(arguments.length > 1
      ? Date.UTC.apply(this, arguments)
      : arguments[0]);
}

d3_date_utc.prototype = {
  getDate: function() { return this._.getUTCDate(); },
  getDay: function() { return this._.getUTCDay(); },
  getFullYear: function() { return this._.getUTCFullYear(); },
  getHours: function() { return this._.getUTCHours(); },
  getMilliseconds: function() { return this._.getUTCMilliseconds(); },
  getMinutes: function() { return this._.getUTCMinutes(); },
  getMonth: function() { return this._.getUTCMonth(); },
  getSeconds: function() { return this._.getUTCSeconds(); },
  getTime: function() { return this._.getTime(); },
  getTimezoneOffset: function() { return 0; },
  valueOf: function() { return this._.valueOf(); },
  setDate: function() { d3_time_prototype.setUTCDate.apply(this._, arguments); },
  setDay: function() { d3_time_prototype.setUTCDay.apply(this._, arguments); },
  setFullYear: function() { d3_time_prototype.setUTCFullYear.apply(this._, arguments); },
  setHours: function() { d3_time_prototype.setUTCHours.apply(this._, arguments); },
  setMilliseconds: function() { d3_time_prototype.setUTCMilliseconds.apply(this._, arguments); },
  setMinutes: function() { d3_time_prototype.setUTCMinutes.apply(this._, arguments); },
  setMonth: function() { d3_time_prototype.setUTCMonth.apply(this._, arguments); },
  setSeconds: function() { d3_time_prototype.setUTCSeconds.apply(this._, arguments); },
  setTime: function() { d3_time_prototype.setTime.apply(this._, arguments); }
};

var d3_time_prototype = Date.prototype;
function d3_format_precision(x, p) {
  return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
}
d3.round = function(x, n) {
  return n
      ? Math.round(x * (n = Math.pow(10, n))) / n
      : Math.round(x);
};

var d3_formatPrefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"].map(d3_formatPrefix);

d3.formatPrefix = function(value, precision) {
  var i = 0;
  if (value) {
    if (value < 0) value *= -1;
    if (precision) value = d3.round(value, d3_format_precision(value, precision));
    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
    i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
  }
  return d3_formatPrefixes[8 + i / 3];
};

function d3_formatPrefix(d, i) {
  var k = Math.pow(10, abs(8 - i) * 3);
  return {
    scale: i > 8 ? function(d) { return d / k; } : function(d) { return d * k; },
    symbol: d
  };
}

function d3_locale_numberFormat(locale) {
  var locale_decimal = locale.decimal,
      locale_thousands = locale.thousands,
      locale_grouping = locale.grouping,
      locale_currency = locale.currency,
      formatGroup = locale_grouping ? function(value) {
        var i = value.length,
            t = [],
            j = 0,
            g = locale_grouping[0];
        while (i > 0 && g > 0) {
          t.push(value.substring(i -= g, i + g));
          g = locale_grouping[j = (j + 1) % locale_grouping.length];
        }
        return t.reverse().join(locale_thousands);
      } : d3_identity;

  return function(specifier) {
    var match = d3_format_re.exec(specifier),
        fill = match[1] || " ",
        align = match[2] || ">",
        sign = match[3] || "",
        symbol = match[4] || "",
        zfill = match[5],
        width = +match[6],
        comma = match[7],
        precision = match[8],
        type = match[9],
        scale = 1,
        prefix = "",
        suffix = "",
        integer = false;

    if (precision) precision = +precision.substring(1);

    if (zfill || fill === "0" && align === "=") {
      zfill = fill = "0";
      align = "=";
      if (comma) width -= Math.floor((width - 1) / 4);
    }

    switch (type) {
      case "n": comma = true; type = "g"; break;
      case "%": scale = 100; suffix = "%"; type = "f"; break;
      case "p": scale = 100; suffix = "%"; type = "r"; break;
      case "b":
      case "o":
      case "x":
      case "X": if (symbol === "#") prefix = "0" + type.toLowerCase();
      case "c":
      case "d": integer = true; precision = 0; break;
      case "s": scale = -1; type = "r"; break;
    }

    if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];

    // If no precision is specified for r, fallback to general notation.
    if (type == "r" && !precision) type = "g";

    // Ensure that the requested precision is in the supported range.
    if (precision != null) {
      if (type == "g") precision = Math.max(1, Math.min(21, precision));
      else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
    }

    type = d3_format_types.get(type) || d3_format_typeDefault;

    var zcomma = zfill && comma;

    return function(value) {
      var fullSuffix = suffix;

      // Return the empty string for floats formatted as ints.
      if (integer && (value % 1)) return "";

      // Convert negative to positive, and record the sign prefix.
      var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign;

      // Apply the scale, computing it from the value's exponent for si format.
      // Preserve the existing suffix, if any, such as the currency symbol.
      if (scale < 0) {
        var unit = d3.formatPrefix(value, precision);
        value = unit.scale(value);
        fullSuffix = unit.symbol + suffix;
      } else {
        value *= scale;
      }

      // Convert to the desired precision.
      value = type(value, precision);

      // Break the value into the integer part (before) and decimal part (after).
      var i = value.lastIndexOf("."),
          before = i < 0 ? value : value.substring(0, i),
          after = i < 0 ? "" : locale_decimal + value.substring(i + 1);

       // If the fill character is not "0", grouping is applied before padding.
      if (!zfill && comma) before = formatGroup(before);

      var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length),
          padding = length < width ? new Array(length = width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (zcomma) before = formatGroup(padding + before);

      // Apply prefix.
      negative += prefix;

      // Rejoin integer and decimal parts.
      value = before + after;

      return (align === "<" ? negative + value + padding
            : align === ">" ? padding + negative + value
            : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length)
            : negative + (zcomma ? value : padding + value)) + fullSuffix;
    };
  };
}

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;

var d3_format_types = d3.map({
  b: function(x) { return x.toString(2); },
  c: function(x) { return String.fromCharCode(x); },
  o: function(x) { return x.toString(8); },
  x: function(x) { return x.toString(16); },
  X: function(x) { return x.toString(16).toUpperCase(); },
  g: function(x, p) { return x.toPrecision(p); },
  e: function(x, p) { return x.toExponential(p); },
  f: function(x, p) { return x.toFixed(p); },
  r: function(x, p) { return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p)))); }
});

function d3_format_typeDefault(x) {
  return x + "";
}

function d3_time_interval(local, step, number) {

  function round(date) {
    var d0 = local(date), d1 = offset(d0, 1);
    return date - d0 < d1 - date ? d0 : d1;
  }

  function ceil(date) {
    step(date = local(new d3_date(date - 1)), 1);
    return date;
  }

  function offset(date, k) {
    step(date = new d3_date(+date), k);
    return date;
  }

  function range(t0, t1, dt) {
    var time = ceil(t0), times = [];
    if (dt > 1) {
      while (time < t1) {
        if (!(number(time) % dt)) times.push(new Date(+time));
        step(time, 1);
      }
    } else {
      while (time < t1) times.push(new Date(+time)), step(time, 1);
    }
    return times;
  }

  function range_utc(t0, t1, dt) {
    try {
      d3_date = d3_date_utc;
      var utc = new d3_date_utc();
      utc._ = t0;
      return range(utc, t1, dt);
    } finally {
      d3_date = Date;
    }
  }

  local.floor = local;
  local.round = round;
  local.ceil = ceil;
  local.offset = offset;
  local.range = range;

  var utc = local.utc = d3_time_interval_utc(local);
  utc.floor = utc;
  utc.round = d3_time_interval_utc(round);
  utc.ceil = d3_time_interval_utc(ceil);
  utc.offset = d3_time_interval_utc(offset);
  utc.range = range_utc;

  return local;
}

function d3_time_interval_utc(method) {
  return function(date, k) {
    try {
      d3_date = d3_date_utc;
      var utc = new d3_date_utc();
      utc._ = date;
      return method(utc, k)._;
    } finally {
      d3_date = Date;
    }
  };
}

d3_time.year = d3_time_interval(function(date) {
  date = d3_time.day(date);
  date.setMonth(0, 1);
  return date;
}, function(date, offset) {
  date.setFullYear(date.getFullYear() + offset);
}, function(date) {
  return date.getFullYear();
});

d3_time.years = d3_time.year.range;
d3_time.years.utc = d3_time.year.utc.range;

d3_time.day = d3_time_interval(function(date) {
  var day = new d3_date(2000, 0);
  day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return day;
}, function(date, offset) {
  date.setDate(date.getDate() + offset);
}, function(date) {
  return date.getDate() - 1;
});

d3_time.days = d3_time.day.range;
d3_time.days.utc = d3_time.day.utc.range;

d3_time.dayOfYear = function(date) {
  var year = d3_time.year(date);
  return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
};

["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].forEach(function(day, i) {
  i = 7 - i;

  var interval = d3_time[day] = d3_time_interval(function(date) {
    (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
    return date;
  }, function(date, offset) {
    date.setDate(date.getDate() + Math.floor(offset) * 7);
  }, function(date) {
    var day = d3_time.year(date).getDay();
    return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
  });

  d3_time[day + "s"] = interval.range;
  d3_time[day + "s"].utc = interval.utc.range;

  d3_time[day + "OfYear"] = function(date) {
    var day = d3_time.year(date).getDay();
    return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
  };
});

d3_time.week = d3_time.sunday;
d3_time.weeks = d3_time.sunday.range;
d3_time.weeks.utc = d3_time.sunday.utc.range;
d3_time.weekOfYear = d3_time.sundayOfYear;

function d3_locale_timeFormat(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_days = locale.days,
      locale_shortDays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  function d3_time_format(template) {
    var n = template.length;

    function format(date) {
      var string = [],
          i = -1,
          j = 0,
          c,
          p,
          f;
      while (++i < n) {
        if (template.charCodeAt(i) === 37) {
          string.push(template.substring(j, i));
          if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
          if (f = d3_time_formats[c]) c = f(date, p == null ? (c === "e" ? " " : "0") : p);
          string.push(c);
          j = i + 1;
        }
      }
      string.push(template.substring(j, i));
      return string.join("");
    }

    format.parse = function(string) {
      var d = {y: 1900, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0, Z: null},
          i = d3_time_parse(d, template, string, 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // If a time zone is specified, it is always relative to UTC;
      // we need to use d3_date_utc if we aren’t already.
      var localZ = d.Z != null && d3_date !== d3_date_utc,
          date = new (localZ ? d3_date_utc : d3_date);

      // Set year, month, date.
      if ("j" in d) date.setFullYear(d.y, 0, d.j);
      else if ("w" in d && ("W" in d || "U" in d)) {
        date.setFullYear(d.y, 0, 1);
        date.setFullYear(d.y, 0, "W" in d
            ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7
            :  d.w          + d.U * 7 - (date.getDay() + 6) % 7);
      } else date.setFullYear(d.y, d.m, d.d);

      // Set hours, minutes, seconds and milliseconds.
      date.setHours(d.H + Math.floor(d.Z / 100), d.M + d.Z % 100, d.S, d.L);

      return localZ ? date._ : date;
    };

    format.toString = function() {
      return template;
    };

    return format;
  }

  function d3_time_parse(date, template, string, j) {
    var c,
        p,
        t,
        i = 0,
        n = template.length,
        m = string.length;
    while (i < n) {
      if (j >= m) return -1;
      c = template.charCodeAt(i++);
      if (c === 37) {
        t = template.charAt(i++);
        p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
        if (!p || ((j = p(date, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }
    return j;
  }

  d3_time_format.utc = function(template) {
    var local = d3_time_format(template);

    function format(date) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date();
        utc._ = date;
        return local(utc);
      } finally {
        d3_date = Date;
      }
    }

    format.parse = function(string) {
      try {
        d3_date = d3_date_utc;
        var date = local.parse(string);
        return date && date._;
      } finally {
        d3_date = Date;
      }
    };

    format.toString = local.toString;

    return format;
  };

  d3_time_format.multi =
  d3_time_format.utc.multi = d3_time_formatMulti;

  var d3_time_periodLookup = d3.map(),
      d3_time_dayRe = d3_time_formatRe(locale_days),
      d3_time_dayLookup = d3_time_formatLookup(locale_days),
      d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays),
      d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays),
      d3_time_monthRe = d3_time_formatRe(locale_months),
      d3_time_monthLookup = d3_time_formatLookup(locale_months),
      d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths),
      d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);

  locale_periods.forEach(function(p, i) {
    d3_time_periodLookup.set(p.toLowerCase(), i);
  });

  var d3_time_formats = {
    a: function(d) { return locale_shortDays[d.getDay()]; },
    A: function(d) { return locale_days[d.getDay()]; },
    b: function(d) { return locale_shortMonths[d.getMonth()]; },
    B: function(d) { return locale_months[d.getMonth()]; },
    c: d3_time_format(locale_dateTime),
    d: function(d, p) { return d3_time_formatPad(d.getDate(), p, 2); },
    e: function(d, p) { return d3_time_formatPad(d.getDate(), p, 2); },
    H: function(d, p) { return d3_time_formatPad(d.getHours(), p, 2); },
    I: function(d, p) { return d3_time_formatPad(d.getHours() % 12 || 12, p, 2); },
    j: function(d, p) { return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3); },
    L: function(d, p) { return d3_time_formatPad(d.getMilliseconds(), p, 3); },
    m: function(d, p) { return d3_time_formatPad(d.getMonth() + 1, p, 2); },
    M: function(d, p) { return d3_time_formatPad(d.getMinutes(), p, 2); },
    p: function(d) { return locale_periods[+(d.getHours() >= 12)]; },
    S: function(d, p) { return d3_time_formatPad(d.getSeconds(), p, 2); },
    U: function(d, p) { return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2); },
    w: function(d) { return d.getDay(); },
    W: function(d, p) { return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2); },
    x: d3_time_format(locale_date),
    X: d3_time_format(locale_time),
    y: function(d, p) { return d3_time_formatPad(d.getFullYear() % 100, p, 2); },
    Y: function(d, p) { return d3_time_formatPad(d.getFullYear() % 10000, p, 4); },
    Z: d3_time_zone,
    "%": function() { return "%"; }
  };

  var d3_time_parsers = {
    a: d3_time_parseWeekdayAbbrev,
    A: d3_time_parseWeekday,
    b: d3_time_parseMonthAbbrev,
    B: d3_time_parseMonth,
    c: d3_time_parseLocaleFull,
    d: d3_time_parseDay,
    e: d3_time_parseDay,
    H: d3_time_parseHour24,
    I: d3_time_parseHour24,
    j: d3_time_parseDayOfYear,
    L: d3_time_parseMilliseconds,
    m: d3_time_parseMonthNumber,
    M: d3_time_parseMinutes,
    p: d3_time_parseAmPm,
    S: d3_time_parseSeconds,
    U: d3_time_parseWeekNumberSunday,
    w: d3_time_parseWeekdayNumber,
    W: d3_time_parseWeekNumberMonday,
    x: d3_time_parseLocaleDate,
    X: d3_time_parseLocaleTime,
    y: d3_time_parseYear,
    Y: d3_time_parseFullYear,
    Z: d3_time_parseZone,
    "%": d3_time_parseLiteralPercent
  };

  function d3_time_parseWeekdayAbbrev(date, string, i) {
    d3_time_dayAbbrevRe.lastIndex = 0;
    var n = d3_time_dayAbbrevRe.exec(string.substring(i));
    return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseWeekday(date, string, i) {
    d3_time_dayRe.lastIndex = 0;
    var n = d3_time_dayRe.exec(string.substring(i));
    return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseMonthAbbrev(date, string, i) {
    d3_time_monthAbbrevRe.lastIndex = 0;
    var n = d3_time_monthAbbrevRe.exec(string.substring(i));
    return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseMonth(date, string, i) {
    d3_time_monthRe.lastIndex = 0;
    var n = d3_time_monthRe.exec(string.substring(i));
    return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseLocaleFull(date, string, i) {
    return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
  }

  function d3_time_parseLocaleDate(date, string, i) {
    return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
  }

  function d3_time_parseLocaleTime(date, string, i) {
    return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
  }

  function d3_time_parseAmPm(date, string, i) {
    var n = d3_time_periodLookup.get(string.substring(i, i += 2).toLowerCase());
    return n == null ? -1 : (date.p = n, i);
  }

  return d3_time_format;
}

var d3_time_formatPads = {"-": "", "_": " ", "0": "0"},
    d3_time_numberRe = /^\s*\d+/, // note: ignores next directive
    d3_time_percentRe = /^%/;

function d3_time_formatPad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function d3_time_formatRe(names) {
  return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
}

function d3_time_formatLookup(names) {
  var map = new d3_Map, i = -1, n = names.length;
  while (++i < n) map.set(names[i].toLowerCase(), i);
  return map;
}

function d3_time_parseWeekdayNumber(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 1));
  return n ? (date.w = +n[0], i + n[0].length) : -1;
}

function d3_time_parseWeekNumberSunday(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i));
  return n ? (date.U = +n[0], i + n[0].length) : -1;
}

function d3_time_parseWeekNumberMonday(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i));
  return n ? (date.W = +n[0], i + n[0].length) : -1;
}

function d3_time_parseFullYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 4));
  return n ? (date.y = +n[0], i + n[0].length) : -1;
}

function d3_time_parseYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
}

function d3_time_parseZone(date, string, i) {
  return /^[+-]\d{4}$/.test(string = string.substring(i, i + 5))
      ? (date.Z = -string, i + 5) // sign differs from getTimezoneOffset!
      : -1;
}

function d3_time_expandYear(d) {
  return d + (d > 68 ? 1900 : 2000);
}

function d3_time_parseMonthNumber(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
}

function d3_time_parseDay(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.d = +n[0], i + n[0].length) : -1;
}

function d3_time_parseDayOfYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 3));
  return n ? (date.j = +n[0], i + n[0].length) : -1;
}

// Note: we don't validate that the hour is in the range [0,23] or [1,12].
function d3_time_parseHour24(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.H = +n[0], i + n[0].length) : -1;
}

function d3_time_parseMinutes(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.M = +n[0], i + n[0].length) : -1;
}

function d3_time_parseSeconds(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.S = +n[0], i + n[0].length) : -1;
}

function d3_time_parseMilliseconds(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 3));
  return n ? (date.L = +n[0], i + n[0].length) : -1;
}

// TODO table of time zone offset names?
function d3_time_zone(d) {
  var z = d.getTimezoneOffset(),
      zs = z > 0 ? "-" : "+",
      zh = ~~(abs(z) / 60),
      zm = abs(z) % 60;
  return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
}

function d3_time_parseLiteralPercent(date, string, i) {
  d3_time_percentRe.lastIndex = 0;
  var n = d3_time_percentRe.exec(string.substring(i, i + 1));
  return n ? i + n[0].length : -1;
}

function d3_time_formatMulti(formats) {
  var n = formats.length, i = -1;
  while (++i < n) formats[i][0] = this(formats[i][0]);
  return function(date) {
    var i = 0, f = formats[i];
    while (!f[1](date)) f = formats[++i];
    return f[0](date);
  };
}

d3.locale = function(locale) {
  return {
    numberFormat: d3_locale_numberFormat(locale),
    timeFormat: d3_locale_timeFormat(locale)
  };
};

var d3_locale_enUS = d3.locale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""],
  dateTime: "%a %b %e %X %Y",
  date: "%m/%d/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;

d3.text = d3_xhrType(function(request) {
  return request.responseText;
});
d3.geo = {};
d3.merge = function(arrays) {
  var n = arrays.length,
      m,
      i = -1,
      j = 0,
      merged,
      array;

  while (++i < n) j += arrays[i].length;
  merged = new Array(j);

  while (--n >= 0) {
    array = arrays[n];
    m = array.length;
    while (--m >= 0) {
      merged[--j] = array[m];
    }
  }

  return merged;
};

function d3_geo_spherical(cartesian) {
  return [
    Math.atan2(cartesian[1], cartesian[0]),
    d3_asin(cartesian[2])
  ];
}

function d3_geo_sphericalEqual(a, b) {
  return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;
}

// General spherical polygon clipping algorithm: takes a polygon, cuts it into
// visible line segments and rejoins the segments by interpolating along the
// clip edge.
function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
  var subject = [],
      clip = [];

  segments.forEach(function(segment) {
    if ((n = segment.length - 1) <= 0) return;
    var n, p0 = segment[0], p1 = segment[n];

    // If the first and last points of a segment are coincident, then treat as
    // a closed ring.
    // TODO if all rings are closed, then the winding order of the exterior
    // ring should be checked.
    if (d3_geo_sphericalEqual(p0, p1)) {
      listener.lineStart();
      for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
      listener.lineEnd();
      return;
    }

    var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true),
        b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
    a.o = b;
    subject.push(a);
    clip.push(b);
    a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
    b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
    a.o = b;
    subject.push(a);
    clip.push(b);
  });
  clip.sort(compare);
  d3_geo_clipPolygonLinkCircular(subject);
  d3_geo_clipPolygonLinkCircular(clip);
  if (!subject.length) return;

  for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
    clip[i].e = entry = !entry;
  }

  var start = subject[0],
      points,
      point;
  while (1) {
    // Find first unvisited intersection.
    var current = start,
        isSubject = true;
    while (current.v) if ((current = current.n) === start) return;
    points = current.z;
    listener.lineStart();
    do {
      current.v = current.o.v = true;
      if (current.e) {
        if (isSubject) {
          for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.x, current.n.x, 1, listener);
        }
        current = current.n;
      } else {
        if (isSubject) {
          points = current.p.z;
          for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.x, current.p.x, -1, listener);
        }
        current = current.p;
      }
      current = current.o;
      points = current.z;
      isSubject = !isSubject;
    } while (!current.v);
    listener.lineEnd();
  }
}

function d3_geo_clipPolygonLinkCircular(array) {
  if (!(n = array.length)) return;
  var n,
      i = 0,
      a = array[0],
      b;
  while (++i < n) {
    a.n = b = array[i];
    b.p = a;
    a = b;
  }
  a.n = b = array[0];
  b.p = a;
}

function d3_geo_clipPolygonIntersection(point, points, other, entry) {
  this.x = point;
  this.z = points;
  this.o = other; // another intersection
  this.e = entry; // is an entry?
  this.v = false; // visited
  this.n = this.p = null; // next & previous
}

function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
  return function(rotate, listener) {
    var line = clipLine(listener),
        rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);

    var clip = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        clip.point = pointRing;
        clip.lineStart = ringStart;
        clip.lineEnd = ringEnd;
        segments = [];
        polygon = [];
      },
      polygonEnd: function() {
        clip.point = point;
        clip.lineStart = lineStart;
        clip.lineEnd = lineEnd;

        segments = d3.merge(segments);
        var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
        if (segments.length) {
          if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
          d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
        } else if (clipStartInside) {
          if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
        }
        if (polygonStarted) listener.polygonEnd(), polygonStarted = false;
        segments = polygon = null;
      },
      sphere: function() {
        listener.polygonStart();
        listener.lineStart();
        interpolate(null, null, 1, listener);
        listener.lineEnd();
        listener.polygonEnd();
      }
    };

    function point(λ, φ) {
      var point = rotate(λ, φ);
      if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);
    }
    function pointLine(λ, φ) {
      var point = rotate(λ, φ);
      line.point(point[0], point[1]);
    }
    function lineStart() { clip.point = pointLine; line.lineStart(); }
    function lineEnd() { clip.point = point; line.lineEnd(); }

    var segments;

    var buffer = d3_geo_clipBufferListener(),
        ringListener = clipLine(buffer),
        polygonStarted = false,
        polygon,
        ring;

    function pointRing(λ, φ) {
      ring.push([λ, φ]);
      var point = rotate(λ, φ);
      ringListener.point(point[0], point[1]);
    }

    function ringStart() {
      ringListener.lineStart();
      ring = [];
    }

    function ringEnd() {
      pointRing(ring[0][0], ring[0][1]);
      ringListener.lineEnd();

      var clean = ringListener.clean(),
          ringSegments = buffer.buffer(),
          segment,
          n = ringSegments.length;

      ring.pop();
      polygon.push(ring);
      ring = null;

      if (!n) return;

      // No intersections.
      if (clean & 1) {
        segment = ringSegments[0];
        var n = segment.length - 1,
            i = -1,
            point;
        if (n > 0) {
          if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
          listener.lineStart();
          while (++i < n) listener.point((point = segment[i])[0], point[1]);
          listener.lineEnd();
        }
        return;
      }

      // Rejoin connected segments.
      // TODO reuse bufferListener.rejoin()?
      if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

      segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
    }

    return clip;
  };
}

function d3_geo_clipSegmentLength1(segment) {
  return segment.length > 1;
}

function d3_geo_clipBufferListener() {
  var lines = [],
      line;
  return {
    lineStart: function() { lines.push(line = []); },
    point: function(λ, φ) { line.push([λ, φ]); },
    lineEnd: d3_noop,
    buffer: function() {
      var buffer = lines;
      lines = [];
      line = null;
      return buffer;
    },
    rejoin: function() {
      if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
    }
  };
}

// Intersection points are sorted along the clip edge. For both antimeridian
// cutting and circle clipping, the same comparison is used.
function d3_geo_clipSort(a, b) {
  return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1])
       - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
}
// Adds floating point numbers with twice the normal precision.
// Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
// Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
// 305–363 (1997).
// Code adapted from GeographicLib by Charles F. F. Karney,
// http://geographiclib.sourceforge.net/
// See lib/geographiclib/LICENSE for details.

function d3_adder() {}

d3_adder.prototype = {
  s: 0, // rounded value
  t: 0, // exact error
  add: function(y) {
    d3_adderSum(y, this.t, d3_adderTemp);
    d3_adderSum(d3_adderTemp.s, this.s, this);
    if (this.s) this.t += d3_adderTemp.t;
    else this.s = d3_adderTemp.t;
  },
  reset: function() {
    this.s = this.t = 0;
  },
  valueOf: function() {
    return this.s;
  }
};

var d3_adderTemp = new d3_adder;

function d3_adderSum(a, b, o) {
  var x = o.s = a + b, // a + b
      bv = x - a, av = x - bv; // b_virtual & a_virtual
  o.t = (a - av) + (b - bv); // a_roundoff + b_roundoff
}

d3.geo.stream = function(object, listener) {
  if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
    d3_geo_streamObjectType[object.type](object, listener);
  } else {
    d3_geo_streamGeometry(object, listener);
  }
};

function d3_geo_streamGeometry(geometry, listener) {
  if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
    d3_geo_streamGeometryType[geometry.type](geometry, listener);
  }
}

var d3_geo_streamObjectType = {
  Feature: function(feature, listener) {
    d3_geo_streamGeometry(feature.geometry, listener);
  },
  FeatureCollection: function(object, listener) {
    var features = object.features, i = -1, n = features.length;
    while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
  }
};

var d3_geo_streamGeometryType = {
  Sphere: function(object, listener) {
    listener.sphere();
  },
  Point: function(object, listener) {
    object = object.coordinates;
    listener.point(object[0], object[1], object[2]);
  },
  MultiPoint: function(object, listener) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
  },
  LineString: function(object, listener) {
    d3_geo_streamLine(object.coordinates, listener, 0);
  },
  MultiLineString: function(object, listener) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
  },
  Polygon: function(object, listener) {
    d3_geo_streamPolygon(object.coordinates, listener);
  },
  MultiPolygon: function(object, listener) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
  },
  GeometryCollection: function(object, listener) {
    var geometries = object.geometries, i = -1, n = geometries.length;
    while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
  }
};

function d3_geo_streamLine(coordinates, listener, closed) {
  var i = -1, n = coordinates.length - closed, coordinate;
  listener.lineStart();
  while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
  listener.lineEnd();
}

function d3_geo_streamPolygon(coordinates, listener) {
  var i = -1, n = coordinates.length;
  listener.polygonStart();
  while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
  listener.polygonEnd();
}

d3.geo.area = function(object) {
  d3_geo_areaSum = 0;
  d3.geo.stream(object, d3_geo_area);
  return d3_geo_areaSum;
};

var d3_geo_areaSum,
    d3_geo_areaRingSum = new d3_adder;

var d3_geo_area = {
  sphere: function() { d3_geo_areaSum += 4 * π; },
  point: d3_noop,
  lineStart: d3_noop,
  lineEnd: d3_noop,

  // Only count area for polygon rings.
  polygonStart: function() {
    d3_geo_areaRingSum.reset();
    d3_geo_area.lineStart = d3_geo_areaRingStart;
  },
  polygonEnd: function() {
    var area = 2 * d3_geo_areaRingSum;
    d3_geo_areaSum += area < 0 ? 4 * π + area : area;
    d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
  }
};

function d3_geo_areaRingStart() {
  var λ00, φ00, λ0, cosφ0, sinφ0; // start point and previous point

  // For the first point, …
  d3_geo_area.point = function(λ, φ) {
    d3_geo_area.point = nextPoint;
    λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), sinφ0 = Math.sin(φ);
  };

  // For subsequent points, …
  function nextPoint(λ, φ) {
    λ *= d3_radians;
    φ = φ * d3_radians / 2 + π / 4; // half the angular distance from south pole

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dλ = λ - λ0,
        sdλ = dλ >= 0 ? 1 : -1,
        adλ = sdλ * dλ,
        cosφ = Math.cos(φ),
        sinφ = Math.sin(φ),
        k = sinφ0 * sinφ,
        u = cosφ0 * cosφ + k * Math.cos(adλ),
        v = k * sdλ * Math.sin(adλ);
    d3_geo_areaRingSum.add(Math.atan2(v, u));

    // Advance the previous points.
    λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
  }

  // For the last point, return to the start.
  d3_geo_area.lineEnd = function() {
    nextPoint(λ00, φ00);
  };
}
// TODO
// cross and scale return new vectors,
// whereas add and normalize operate in-place

function d3_geo_cartesian(spherical) {
  var λ = spherical[0],
      φ = spherical[1],
      cosφ = Math.cos(φ);
  return [
    cosφ * Math.cos(λ),
    cosφ * Math.sin(λ),
    Math.sin(φ)
  ];
}

function d3_geo_cartesianDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function d3_geo_cartesianCross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function d3_geo_cartesianAdd(a, b) {
  a[0] += b[0];
  a[1] += b[1];
  a[2] += b[2];
}

function d3_geo_cartesianScale(vector, k) {
  return [
    vector[0] * k,
    vector[1] * k,
    vector[2] * k
  ];
}

function d3_geo_cartesianNormalize(d) {
  var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  d[0] /= l;
  d[1] /= l;
  d[2] /= l;
}

function d3_geo_pointInPolygon(point, polygon) {
  var meridian = point[0],
      parallel = point[1],
      meridianNormal = [Math.sin(meridian), -Math.cos(meridian), 0],
      polarAngle = 0,
      winding = 0;
  d3_geo_areaRingSum.reset();

  for (var i = 0, n = polygon.length; i < n; ++i) {
    var ring = polygon[i],
        m = ring.length;
    if (!m) continue;
    var point0 = ring[0],
        λ0 = point0[0],
        φ0 = point0[1] / 2 + π / 4,
        sinφ0 = Math.sin(φ0),
        cosφ0 = Math.cos(φ0),
        j = 1;

    while (true) {
      if (j === m) j = 0;
      point = ring[j];
      var λ = point[0],
          φ = point[1] / 2 + π / 4,
          sinφ = Math.sin(φ),
          cosφ = Math.cos(φ),
          dλ = λ - λ0,
          sdλ = dλ >= 0 ? 1 : -1,
          adλ = sdλ * dλ,
          antimeridian = adλ > π,
          k = sinφ0 * sinφ;
      d3_geo_areaRingSum.add(Math.atan2(k * sdλ * Math.sin(adλ), cosφ0 * cosφ + k * Math.cos(adλ)));

      polarAngle += antimeridian ? dλ + sdλ * τ : dλ;

      // Are the longitudes either side of the point's meridian, and are the
      // latitudes smaller than the parallel?
      if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
        var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
        d3_geo_cartesianNormalize(arc);
        var intersection = d3_geo_cartesianCross(meridianNormal, arc);
        d3_geo_cartesianNormalize(intersection);
        var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
        if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {
          winding += antimeridian ^ dλ >= 0 ? 1 : -1;
        }
      }
      if (!j++) break;
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
    }
  }

  // First, determine whether the South pole is inside or outside:
  //
  // It is inside if:
  // * the polygon winds around it in a clockwise direction.
  // * the polygon does not (cumulatively) wind around it, but has a negative
  //   (counter-clockwise) area.
  //
  // Second, count the (signed) number of times a segment crosses a meridian
  // from the point to the South pole.  If it is zero, then the point is the
  // same side as the South pole.

  return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < 0) ^ (winding & 1);
}

var d3_geo_clipAntimeridian = d3_geo_clip(
    d3_true,
    d3_geo_clipAntimeridianLine,
    d3_geo_clipAntimeridianInterpolate,
    [-π, -π / 2]);

// Takes a line and cuts into visible segments. Return values:
//   0: there were intersections or the line was empty.
//   1: no intersections.
//   2: there were intersections, and the first and last segments should be
//      rejoined.
function d3_geo_clipAntimeridianLine(listener) {
  var λ0 = NaN,
      φ0 = NaN,
      sλ0 = NaN,
      clean; // no intersections

  return {
    lineStart: function() {
      listener.lineStart();
      clean = 1;
    },
    point: function(λ1, φ1) {
      var sλ1 = λ1 > 0 ? π : -π,
          dλ = abs(λ1 - λ0);
      if (abs(dλ - π) < ε) { // line crosses a pole
        listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
        listener.point(sλ0, φ0);
        listener.lineEnd();
        listener.lineStart();
        listener.point(sλ1, φ0);
        listener.point(λ1, φ0);
        clean = 0;
      } else if (sλ0 !== sλ1 && dλ >= π) { // line crosses antimeridian
        // handle degeneracies
        if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
        if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
        φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
        listener.point(sλ0, φ0);
        listener.lineEnd();
        listener.lineStart();
        listener.point(sλ1, φ0);
        clean = 0;
      }
      listener.point(λ0 = λ1, φ0 = φ1);
      sλ0 = sλ1;
    },
    lineEnd: function() {
      listener.lineEnd();
      λ0 = φ0 = NaN;
    },
    // if there are intersections, we always rejoin the first and last segments.
    clean: function() { return 2 - clean; }
  };
}

function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
  var cosφ0,
      cosφ1,
      sinλ0_λ1 = Math.sin(λ0 - λ1);
  return abs(sinλ0_λ1) > ε
      ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1)
                 - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0))
                 / (cosφ0 * cosφ1 * sinλ0_λ1))
      : (φ0 + φ1) / 2;
}

function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
  var φ;
  if (from == null) {
    φ = direction * halfπ;
    listener.point(-π,  φ);
    listener.point( 0,  φ);
    listener.point( π,  φ);
    listener.point( π,  0);
    listener.point( π, -φ);
    listener.point( 0, -φ);
    listener.point(-π, -φ);
    listener.point(-π,  0);
    listener.point(-π,  φ);
  } else if (abs(from[0] - to[0]) > ε) {
    var s = from[0] < to[0] ? π : -π;
    φ = direction * s / 2;
    listener.point(-s, φ);
    listener.point( 0, φ);
    listener.point( s, φ);
  } else {
    listener.point(to[0], to[1]);
  }
}

function d3_geo_equirectangular(λ, φ) {
  return [λ, φ];
}

(d3.geo.equirectangular = function() {
  return d3_geo_projection(d3_geo_equirectangular);
}).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;

d3.geo.rotation = function(rotate) {
  rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);

  function forward(coordinates) {
    coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
    return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
  }

  forward.invert = function(coordinates) {
    coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
    return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
  };

  return forward;
};

function d3_geo_identityRotation(λ, φ) {
  return [λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ];
}

d3_geo_identityRotation.invert = d3_geo_equirectangular;

// Note: |δλ| must be < 2π
function d3_geo_rotation(δλ, δφ, δγ) {
  return δλ ? (δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ))
    : d3_geo_rotationλ(δλ))
    : (δφ || δγ ? d3_geo_rotationφγ(δφ, δγ)
    : d3_geo_identityRotation);
}

function d3_geo_forwardRotationλ(δλ) {
  return function(λ, φ) {
    return λ += δλ, [λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ];
  };
}

function d3_geo_rotationλ(δλ) {
  var rotation = d3_geo_forwardRotationλ(δλ);
  rotation.invert = d3_geo_forwardRotationλ(-δλ);
  return rotation;
}

function d3_geo_rotationφγ(δφ, δγ) {
  var cosδφ = Math.cos(δφ),
      sinδφ = Math.sin(δφ),
      cosδγ = Math.cos(δγ),
      sinδγ = Math.sin(δγ);

  function rotation(λ, φ) {
    var cosφ = Math.cos(φ),
        x = Math.cos(λ) * cosφ,
        y = Math.sin(λ) * cosφ,
        z = Math.sin(φ),
        k = z * cosδφ + x * sinδφ;
    return [
      Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ),
      d3_asin(k * cosδγ + y * sinδγ)
    ];
  }

  rotation.invert = function(λ, φ) {
    var cosφ = Math.cos(φ),
        x = Math.cos(λ) * cosφ,
        y = Math.sin(λ) * cosφ,
        z = Math.sin(φ),
        k = z * cosδγ - y * sinδγ;
    return [
      Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ),
      d3_asin(k * cosδφ - x * sinδφ)
    ];
  };

  return rotation;
}

d3.geo.circle = function() {
  var origin = [0, 0],
      angle,
      precision = 6,
      interpolate;

  function circle() {
    var center = typeof origin === "function" ? origin.apply(this, arguments) : origin,
        rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert,
        ring = [];

    interpolate(null, null, 1, {
      point: function(x, y) {
        ring.push(x = rotate(x, y));
        x[0] *= d3_degrees, x[1] *= d3_degrees;
      }
    });

    return {type: "Polygon", coordinates: [ring]};
  }

  circle.origin = function(x) {
    if (!arguments.length) return origin;
    origin = x;
    return circle;
  };

  circle.angle = function(x) {
    if (!arguments.length) return angle;
    interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
    return circle;
  };

  circle.precision = function(_) {
    if (!arguments.length) return precision;
    interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
    return circle;
  };

  return circle.angle(90);
};

// Interpolates along a circle centered at [0°, 0°], with a given radius and
// precision.
function d3_geo_circleInterpolate(radius, precision) {
  var cr = Math.cos(radius),
      sr = Math.sin(radius);
  return function(from, to, direction, listener) {
    var step = direction * precision;
    if (from != null) {
      from = d3_geo_circleAngle(cr, from);
      to = d3_geo_circleAngle(cr, to);
      if (direction > 0 ? from < to: from > to) from += direction * τ;
    } else {
      from = radius + direction * τ;
      to = radius - .5 * step;
    }
    for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
      listener.point((point = d3_geo_spherical([
        cr,
        -sr * Math.cos(t),
        -sr * Math.sin(t)
      ]))[0], point[1]);
    }
  };
}

// Signed angle of a cartesian point relative to [cr, 0, 0].
function d3_geo_circleAngle(cr, point) {
  var a = d3_geo_cartesian(point);
  a[0] -= cr;
  d3_geo_cartesianNormalize(a);
  var angle = d3_acos(-a[1]);
  return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
}

// Clip features against a small circle centered at [0°, 0°].
function d3_geo_clipCircle(radius) {
  var cr = Math.cos(radius),
      smallRadius = cr > 0,
      notHemisphere = abs(cr) > ε, // TODO optimise for this common case
      interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);

  return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-π, radius - π]);

  function visible(λ, φ) {
    return Math.cos(λ) * Math.cos(φ) > cr;
  }

  // Takes a line and cuts into visible segments. Return values used for
  // polygon clipping:
  //   0: there were intersections or the line was empty.
  //   1: no intersections.
  //   2: there were intersections, and the first and last segments should be
  //      rejoined.
  function clipLine(listener) {
    var point0, // previous point
        c0, // code for previous point
        v0, // visibility of previous point
        v00, // visibility of first point
        clean; // no intersections
    return {
      lineStart: function() {
        v00 = v0 = false;
        clean = 1;
      },
      point: function(λ, φ) {
        var point1 = [λ, φ],
            point2,
            v = visible(λ, φ),
            c = smallRadius
              ? v ? 0 : code(λ, φ)
              : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
        if (!point0 && (v00 = v0 = v)) listener.lineStart();
        // Handle degeneracies.
        // TODO ignore if not clipping polygons.
        if (v !== v0) {
          point2 = intersect(point0, point1);
          if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
            point1[0] += ε;
            point1[1] += ε;
            v = visible(point1[0], point1[1]);
          }
        }
        if (v !== v0) {
          clean = 0;
          if (v) {
            // outside going in
            listener.lineStart();
            point2 = intersect(point1, point0);
            listener.point(point2[0], point2[1]);
          } else {
            // inside going out
            point2 = intersect(point0, point1);
            listener.point(point2[0], point2[1]);
            listener.lineEnd();
          }
          point0 = point2;
        } else if (notHemisphere && point0 && smallRadius ^ v) {
          var t;
          // If the codes for two points are different, or are both zero,
          // and there this segment intersects with the small circle.
          if (!(c & c0) && (t = intersect(point1, point0, true))) {
            clean = 0;
            if (smallRadius) {
              listener.lineStart();
              listener.point(t[0][0], t[0][1]);
              listener.point(t[1][0], t[1][1]);
              listener.lineEnd();
            } else {
              listener.point(t[1][0], t[1][1]);
              listener.lineEnd();
              listener.lineStart();
              listener.point(t[0][0], t[0][1]);
            }
          }
        }
        if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
          listener.point(point1[0], point1[1]);
        }
        point0 = point1, v0 = v, c0 = c;
      },
      lineEnd: function() {
        if (v0) listener.lineEnd();
        point0 = null;
      },
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function() { return clean | ((v00 && v0) << 1); }
    };
  }

  // Intersects the great circle between a and b with the clip circle.
  function intersect(a, b, two) {
    var pa = d3_geo_cartesian(a),
        pb = d3_geo_cartesian(b);

    // We have two planes, n1.p = d1 and n2.p = d2.
    // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
    var n1 = [1, 0, 0], // normal
        n2 = d3_geo_cartesianCross(pa, pb),
        n2n2 = d3_geo_cartesianDot(n2, n2),
        n1n2 = n2[0], // d3_geo_cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2;

    // Two polar points.
    if (!determinant) return !two && a;

    var c1 =  cr * n2n2 / determinant,
        c2 = -cr * n1n2 / determinant,
        n1xn2 = d3_geo_cartesianCross(n1, n2),
        A = d3_geo_cartesianScale(n1, c1),
        B = d3_geo_cartesianScale(n2, c2);
    d3_geo_cartesianAdd(A, B);

    // Solve |p(t)|^2 = 1.
    var u = n1xn2,
        w = d3_geo_cartesianDot(A, u),
        uu = d3_geo_cartesianDot(u, u),
        t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);

    if (t2 < 0) return;

    var t = Math.sqrt(t2),
        q = d3_geo_cartesianScale(u, (-w - t) / uu);
    d3_geo_cartesianAdd(q, A);
    q = d3_geo_spherical(q);
    if (!two) return q;

    // Two intersection points.
    var λ0 = a[0],
        λ1 = b[0],
        φ0 = a[1],
        φ1 = b[1],
        z;
    if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
    var δλ = λ1 - λ0,
        polar = abs(δλ - π) < ε,
        meridian = polar || δλ < ε;

    if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;

    // Check that the first point is between a and b.
    if (meridian
        ? polar
          ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1)
          : φ0 <= q[1] && q[1] <= φ1
        : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
      var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
      d3_geo_cartesianAdd(q1, A);
      return [q, d3_geo_spherical(q1)];
    }
  }

  // Generates a 4-bit vector representing the location of a point relative to
  // the small circle's bounding box.
  function code(λ, φ) {
    var r = smallRadius ? radius : π - radius,
        code = 0;
    if (λ < -r) code |= 1; // left
    else if (λ > r) code |= 2; // right
    if (φ < -r) code |= 4; // below
    else if (φ > r) code |= 8; // above
    return code;
  }
}

// Liang–Barsky line clipping.
function d3_geom_clipLine(x0, y0, x1, y1) {
  return function(line) {
    var a = line.a,
        b = line.b,
        ax = a.x,
        ay = a.y,
        bx = b.x,
        by = b.y,
        t0 = 0,
        t1 = 1,
        dx = bx - ax,
        dy = by - ay,
        r;

    r = x0 - ax;
    if (!dx && r > 0) return;
    r /= dx;
    if (dx < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dx > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = x1 - ax;
    if (!dx && r < 0) return;
    r /= dx;
    if (dx < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dx > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    r = y0 - ay;
    if (!dy && r > 0) return;
    r /= dy;
    if (dy < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dy > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = y1 - ay;
    if (!dy && r < 0) return;
    r /= dy;
    if (dy < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dy > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    if (t0 > 0) line.a = {x: ax + t0 * dx, y: ay + t0 * dy};
    if (t1 < 1) line.b = {x: ax + t1 * dx, y: ay + t1 * dy};
    return line;
  };
}

var d3_geo_clipExtentMAX = 1e9;

d3.geo.clipExtent = function() {
  var x0, y0, x1, y1,
      stream,
      clip,
      clipExtent = {
        stream: function(output) {
          if (stream) stream.valid = false;
          stream = clip(output);
          stream.valid = true; // allow caching by d3.geo.path
          return stream;
        },
        extent: function(_) {
          if (!arguments.length) return [[x0, y0], [x1, y1]];
          clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
          if (stream) stream.valid = false, stream = null;
          return clipExtent;
        }
      };
  return clipExtent.extent([[0, 0], [960, 500]]);
};

function d3_geo_clipExtent(x0, y0, x1, y1) {
  return function(listener) {
    var listener_ = listener,
        bufferListener = d3_geo_clipBufferListener(),
        clipLine = d3_geom_clipLine(x0, y0, x1, y1),
        segments,
        polygon,
        ring;

    var clip = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        listener = bufferListener;
        segments = [];
        polygon = [];
        clean = true;
      },
      polygonEnd: function() {
        listener = listener_;
        segments = d3.merge(segments);
        var clipStartInside = insidePolygon([x0, y1]),
            inside = clean && clipStartInside,
            visible = segments.length;
        if (inside || visible) {
          listener.polygonStart();
          if (inside) {
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          if (visible) {
            d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
          }
          listener.polygonEnd();
        }
        segments = polygon = ring = null;
      }
    };

    function insidePolygon(p) {
      var wn = 0, // the winding number counter
          n = polygon.length,
          y = p[1];

      for (var i = 0; i < n; ++i) {
        for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
          b = v[j];
          if (a[1] <= y) {
            if (b[1] >  y && d3_cross2d(a, b, p) > 0) ++wn;
          } else {
            if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
          }
          a = b;
        }
      }
      return wn !== 0;
    }

    function interpolate(from, to, direction, listener) {
      var a = 0, a1 = 0;
      if (from == null ||
          (a = corner(from, direction)) !== (a1 = corner(to, direction)) ||
          comparePoints(from, to) < 0 ^ direction > 0) {
        do {
          listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
        } while ((a = (a + direction + 4) % 4) !== a1);
      } else {
        listener.point(to[0], to[1]);
      }
    }

    function pointVisible(x, y) {
      return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    function point(x, y) {
      if (pointVisible(x, y)) listener.point(x, y);
    }

    var x__, y__, v__, // first point
        x_, y_, v_, // previous point
        first,
        clean;

    function lineStart() {
      clip.point = linePoint;
      if (polygon) polygon.push(ring = []);
      first = true;
      v_ = false;
      x_ = y_ = NaN;
    }

    function lineEnd() {
      // TODO rather than special-case polygons, simply handle them separately.
      // Ideally, coincident intersection points should be jittered to avoid
      // clipping issues.
      if (segments) {
        linePoint(x__, y__);
        if (v__ && v_) bufferListener.rejoin();
        segments.push(bufferListener.buffer());
      }
      clip.point = point;
      if (v_) listener.lineEnd();
    }

    function linePoint(x, y) {
      x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
      y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
      var v = pointVisible(x, y);
      if (polygon) ring.push([x, y]);
      if (first) {
        x__ = x, y__ = y, v__ = v;
        first = false;
        if (v) {
          listener.lineStart();
          listener.point(x, y);
        }
      } else {
        if (v && v_) listener.point(x, y);
        else {
          var l = {a: {x: x_, y: y_}, b: {x: x, y: y}};
          if (clipLine(l)) {
            if (!v_) {
              listener.lineStart();
              listener.point(l.a.x, l.a.y);
            }
            listener.point(l.b.x, l.b.y);
            if (!v) listener.lineEnd();
            clean = false;
          } else if (v) {
            listener.lineStart();
            listener.point(x, y);
            clean = false;
          }
        }
      }
      x_ = x, y_ = y, v_ = v;
    }

    return clip;
  };

  function corner(p, direction) {
    return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3
        : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1
        : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0
        : direction > 0 ? 3 : 2; // abs(p[1] - y1) < ε
  }

  function compare(a, b) {
    return comparePoints(a.x, b.x);
  }

  function comparePoints(a, b) {
    var ca = corner(a, 1),
        cb = corner(b, 1);
    return ca !== cb ? ca - cb
        : ca === 0 ? b[1] - a[1]
        : ca === 1 ? a[0] - b[0]
        : ca === 2 ? a[1] - b[1]
        : b[0] - a[0];
  }
}
function d3_geo_compose(a, b) {

  function compose(x, y) {
    return x = a(x, y), b(x[0], x[1]);
  }

  if (a.invert && b.invert) compose.invert = function(x, y) {
    return x = b.invert(x, y), x && a.invert(x[0], x[1]);
  };

  return compose;
}

function d3_geo_conic(projectAt) {
  var φ0 = 0,
      φ1 = π / 3,
      m = d3_geo_projectionMutator(projectAt),
      p = m(φ0, φ1);

  p.parallels = function(_) {
    if (!arguments.length) return [φ0 / π * 180, φ1 / π * 180];
    return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
  };

  return p;
}

function d3_geo_conicEqualArea(φ0, φ1) {
  var sinφ0 = Math.sin(φ0),
      n = (sinφ0 + Math.sin(φ1)) / 2,
      C = 1 + sinφ0 * (2 * n - sinφ0),
      ρ0 = Math.sqrt(C) / n;

  function forward(λ, φ) {
    var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
    return [
      ρ * Math.sin(λ *= n),
      ρ0 - ρ * Math.cos(λ)
    ];
  }

  forward.invert = function(x, y) {
    var ρ0_y = ρ0 - y;
    return [
      Math.atan2(x, ρ0_y) / n,
      d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n))
    ];
  };

  return forward;
}

(d3.geo.conicEqualArea = function() {
  return d3_geo_conic(d3_geo_conicEqualArea);
}).raw = d3_geo_conicEqualArea;

// ESRI:102003
d3.geo.albers = function() {
  return d3.geo.conicEqualArea()
      .rotate([96, 0])
      .center([-.6, 38.7])
      .parallels([29.5, 45.5])
      .scale(1070);
};

// A composite projection for the United States, configured by default for
// 960×500. Also works quite well at 960×600 with scale 1285. The set of
// standard parallels for each region comes from USGS, which is published here:
// http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
d3.geo.albersUsa = function() {
  var lower48 = d3.geo.albers();

  // EPSG:3338
  var alaska = d3.geo.conicEqualArea()
      .rotate([154, 0])
      .center([-2, 58.5])
      .parallels([55, 65]);

  // ESRI:102007
  var hawaii = d3.geo.conicEqualArea()
      .rotate([157, 0])
      .center([-3, 19.9])
      .parallels([8, 18]);

  var point,
      pointStream = {point: function(x, y) { point = [x, y]; }},
      lower48Point,
      alaskaPoint,
      hawaiiPoint;

  function albersUsa(coordinates) {
    var x = coordinates[0], y = coordinates[1];
    point = null;
    (lower48Point(x, y), point)
        || (alaskaPoint(x, y), point)
        || hawaiiPoint(x, y);
    return point;
  }

  albersUsa.invert = function(coordinates) {
    var k = lower48.scale(),
        t = lower48.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k;
    return (y >= .120 && y < .234 && x >= -.425 && x < -.214 ? alaska
        : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii
        : lower48).invert(coordinates);
  };

  // A naïve multi-projection stream.
  // The projections must have mutually exclusive clip regions on the sphere,
  // as this will avoid emitting interleaving lines and polygons.
  albersUsa.stream = function(stream) {
    var lower48Stream = lower48.stream(stream),
        alaskaStream = alaska.stream(stream),
        hawaiiStream = hawaii.stream(stream);
    return {
      point: function(x, y) {
        lower48Stream.point(x, y);
        alaskaStream.point(x, y);
        hawaiiStream.point(x, y);
      },
      sphere: function() {
        lower48Stream.sphere();
        alaskaStream.sphere();
        hawaiiStream.sphere();
      },
      lineStart: function() {
        lower48Stream.lineStart();
        alaskaStream.lineStart();
        hawaiiStream.lineStart();
      },
      lineEnd: function() {
        lower48Stream.lineEnd();
        alaskaStream.lineEnd();
        hawaiiStream.lineEnd();
      },
      polygonStart: function() {
        lower48Stream.polygonStart();
        alaskaStream.polygonStart();
        hawaiiStream.polygonStart();
      },
      polygonEnd: function() {
        lower48Stream.polygonEnd();
        alaskaStream.polygonEnd();
        hawaiiStream.polygonEnd();
      }
    };
  };

  albersUsa.precision = function(_) {
    if (!arguments.length) return lower48.precision();
    lower48.precision(_);
    alaska.precision(_);
    hawaii.precision(_);
    return albersUsa;
  };

  albersUsa.scale = function(_) {
    if (!arguments.length) return lower48.scale();
    lower48.scale(_);
    alaska.scale(_ * .35);
    hawaii.scale(_);
    return albersUsa.translate(lower48.translate());
  };

  albersUsa.translate = function(_) {
    if (!arguments.length) return lower48.translate();
    var k = lower48.scale(), x = +_[0], y = +_[1];

    lower48Point = lower48
        .translate(_)
        .clipExtent([[x - .455 * k, y - .238 * k], [x + .455 * k, y + .238 * k]])
        .stream(pointStream).point;

    alaskaPoint = alaska
        .translate([x - .307 * k, y + .201 * k])
        .clipExtent([[x - .425 * k + ε, y + .120 * k + ε], [x - .214 * k - ε, y + .234 * k - ε]])
        .stream(pointStream).point;

    hawaiiPoint = hawaii
        .translate([x - .205 * k, y + .212 * k])
        .clipExtent([[x - .214 * k + ε, y + .166 * k + ε], [x - .115 * k - ε, y + .234 * k - ε]])
        .stream(pointStream).point;

    return albersUsa;
  };

  return albersUsa.scale(1070);
};

d3.geo.bounds = (function() {
  var λ0, φ0, λ1, φ1, // bounds
      λ_, // previous λ-coordinate
      λ__, φ__, // first point
      p0, // previous 3D point
      dλSum,
      ranges,
      range;

  var bound = {
    point: point,
    lineStart: lineStart,
    lineEnd: lineEnd,

    polygonStart: function() {
      bound.point = ringPoint;
      bound.lineStart = ringStart;
      bound.lineEnd = ringEnd;
      dλSum = 0;
      d3_geo_area.polygonStart();
    },
    polygonEnd: function() {
      d3_geo_area.polygonEnd();
      bound.point = point;
      bound.lineStart = lineStart;
      bound.lineEnd = lineEnd;
      if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90);
      else if (dλSum > ε) φ1 = 90;
      else if (dλSum < -ε) φ0 = -90;
      range[0] = λ0, range[1] = λ1;
    }
  };

  function point(λ, φ) {
    ranges.push(range = [λ0 = λ, λ1 = λ]);
    if (φ < φ0) φ0 = φ;
    if (φ > φ1) φ1 = φ;
  }

  function linePoint(λ, φ) {
    var p = d3_geo_cartesian([λ * d3_radians, φ * d3_radians]);
    if (p0) {
      var normal = d3_geo_cartesianCross(p0, p),
          equatorial = [normal[1], -normal[0], 0],
          inflection = d3_geo_cartesianCross(equatorial, normal);
      d3_geo_cartesianNormalize(inflection);
      inflection = d3_geo_spherical(inflection);
      var dλ = λ - λ_,
          s = dλ > 0 ? 1 : -1,
          λi = inflection[0] * d3_degrees * s,
          antimeridian = abs(dλ) > 180;
      if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
        var φi = inflection[1] * d3_degrees;
        if (φi > φ1) φ1 = φi;
      } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
        var φi = -inflection[1] * d3_degrees;
        if (φi < φ0) φ0 = φi;
      } else {
        if (φ < φ0) φ0 = φ;
        if (φ > φ1) φ1 = φ;
      }
      if (antimeridian) {
        if (λ < λ_) {
          if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
        } else {
          if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
        }
      } else {
        if (λ1 >= λ0) {
          if (λ < λ0) λ0 = λ;
          if (λ > λ1) λ1 = λ;
        } else {
          if (λ > λ_) {
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
          } else {
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
          }
        }
      }
    } else {
      point(λ, φ);
    }
    p0 = p, λ_ = λ;
  }

  function lineStart() { bound.point = linePoint; }
  function lineEnd() {
    range[0] = λ0, range[1] = λ1;
    bound.point = point;
    p0 = null;
  }

  function ringPoint(λ, φ) {
    if (p0) {
      var dλ = λ - λ_;
      dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
    } else λ__ = λ, φ__ = φ;
    d3_geo_area.point(λ, φ);
    linePoint(λ, φ);
  }

  function ringStart() {
    d3_geo_area.lineStart();
  }

  function ringEnd() {
    ringPoint(λ__, φ__);
    d3_geo_area.lineEnd();
    if (abs(dλSum) > ε) λ0 = -(λ1 = 180);
    range[0] = λ0, range[1] = λ1;
    p0 = null;
  }

  // Finds the left-right distance between two longitudes.
  // This is almost the same as (λ1 - λ0 + 360°) % 360°, except that we want
  // the distance between ±180° to be 360°.
  function angle(λ0, λ1) { return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1; }

  function compareRanges(a, b) { return a[0] - b[0]; }

  function withinRange(x, range) {
    return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
  }

  return function(feature) {
    φ1 = λ1 = -(λ0 = φ0 = Infinity);
    ranges = [];

    d3.geo.stream(feature, bound);

    var n = ranges.length;
    if (n) {
      // First, sort ranges by their minimum longitudes.
      ranges.sort(compareRanges);

      // Then, merge any ranges that overlap.
      for (var i = 1, a = ranges[0], b, merged = [a]; i < n; ++i) {
        b = ranges[i];
        if (withinRange(b[0], a) || withinRange(b[1], a)) {
          if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
          if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
        } else {
          merged.push(a = b);
        }
      }

      // Finally, find the largest gap between the merged ranges.
      // The final bounding box will be the inverse of this gap.
      var best = -Infinity, dλ;
      for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
        b = merged[i];
        if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
      }
    }
    ranges = range = null;

    return λ0 === Infinity || φ0 === Infinity
        ? [[NaN, NaN], [NaN, NaN]]
        : [[λ0, φ0], [λ1, φ1]];
  };
})();

d3.geo.centroid = function(object) {
  d3_geo_centroidW0 = d3_geo_centroidW1 =
  d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 =
  d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 =
  d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
  d3.geo.stream(object, d3_geo_centroid);

  var x = d3_geo_centroidX2,
      y = d3_geo_centroidY2,
      z = d3_geo_centroidZ2,
      m = x * x + y * y + z * z;

  // If the area-weighted centroid is undefined, fall back to length-weighted centroid.
  if (m < ε2) {
    x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
    // If the feature has zero length, fall back to arithmetic mean of point vectors.
    if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
    m = x * x + y * y + z * z;
    // If the feature still has an undefined centroid, then return.
    if (m < ε2) return [NaN, NaN];
  }

  return [Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees];
};

var d3_geo_centroidW0,
    d3_geo_centroidW1,
    d3_geo_centroidX0,
    d3_geo_centroidY0,
    d3_geo_centroidZ0,
    d3_geo_centroidX1,
    d3_geo_centroidY1,
    d3_geo_centroidZ1,
    d3_geo_centroidX2,
    d3_geo_centroidY2,
    d3_geo_centroidZ2;

var d3_geo_centroid = {
  sphere: d3_noop,
  point: d3_geo_centroidPoint,
  lineStart: d3_geo_centroidLineStart,
  lineEnd: d3_geo_centroidLineEnd,
  polygonStart: function() {
    d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
  },
  polygonEnd: function() {
    d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
  }
};

// Arithmetic mean of Cartesian vectors.
function d3_geo_centroidPoint(λ, φ) {
  λ *= d3_radians;
  var cosφ = Math.cos(φ *= d3_radians);
  d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
}

function d3_geo_centroidPointXYZ(x, y, z) {
  ++d3_geo_centroidW0;
  d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
  d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
  d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
}

function d3_geo_centroidLineStart() {
  var x0, y0, z0; // previous point

  d3_geo_centroid.point = function(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    x0 = cosφ * Math.cos(λ);
    y0 = cosφ * Math.sin(λ);
    z0 = Math.sin(φ);
    d3_geo_centroid.point = nextPoint;
    d3_geo_centroidPointXYZ(x0, y0, z0);
  };

  function nextPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians),
        x = cosφ * Math.cos(λ),
        y = cosφ * Math.sin(λ),
        z = Math.sin(φ),
        w = Math.atan2(
          Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w),
          x0 * x + y0 * y + z0 * z);
    d3_geo_centroidW1 += w;
    d3_geo_centroidX1 += w * (x0 + (x0 = x));
    d3_geo_centroidY1 += w * (y0 + (y0 = y));
    d3_geo_centroidZ1 += w * (z0 + (z0 = z));
    d3_geo_centroidPointXYZ(x0, y0, z0);
  }
}

function d3_geo_centroidLineEnd() {
  d3_geo_centroid.point = d3_geo_centroidPoint;
}

// See J. E. Brock, The Inertia Tensor for a Spherical Triangle,
// J. Applied Mechanics 42, 239 (1975).
function d3_geo_centroidRingStart() {
  var λ00, φ00, // first point
      x0, y0, z0; // previous point

  d3_geo_centroid.point = function(λ, φ) {
    λ00 = λ, φ00 = φ;
    d3_geo_centroid.point = nextPoint;
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    x0 = cosφ * Math.cos(λ);
    y0 = cosφ * Math.sin(λ);
    z0 = Math.sin(φ);
    d3_geo_centroidPointXYZ(x0, y0, z0);
  };

  d3_geo_centroid.lineEnd = function() {
    nextPoint(λ00, φ00);
    d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
    d3_geo_centroid.point = d3_geo_centroidPoint;
  };

  function nextPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians),
        x = cosφ * Math.cos(λ),
        y = cosφ * Math.sin(λ),
        z = Math.sin(φ),
        cx = y0 * z - z0 * y,
        cy = z0 * x - x0 * z,
        cz = x0 * y - y0 * x,
        m = Math.sqrt(cx * cx + cy * cy + cz * cz),
        u = x0 * x + y0 * y + z0 * z,
        v = m && -d3_acos(u) / m, // area weight
        w = Math.atan2(m, u); // line weight
    d3_geo_centroidX2 += v * cx;
    d3_geo_centroidY2 += v * cy;
    d3_geo_centroidZ2 += v * cz;
    d3_geo_centroidW1 += w;
    d3_geo_centroidX1 += w * (x0 + (x0 = x));
    d3_geo_centroidY1 += w * (y0 + (y0 = y));
    d3_geo_centroidZ1 += w * (z0 + (z0 = z));
    d3_geo_centroidPointXYZ(x0, y0, z0);
  }
}

// TODO Unify this code with d3.geom.polygon area?

var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
  point: d3_noop,
  lineStart: d3_noop,
  lineEnd: d3_noop,

  // Only count area for polygon rings.
  polygonStart: function() {
    d3_geo_pathAreaPolygon = 0;
    d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
  },
  polygonEnd: function() {
    d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
    d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
  }
};

function d3_geo_pathAreaRingStart() {
  var x00, y00, x0, y0;

  // For the first point, …
  d3_geo_pathArea.point = function(x, y) {
    d3_geo_pathArea.point = nextPoint;
    x00 = x0 = x, y00 = y0 = y;
  };

  // For subsequent points, …
  function nextPoint(x, y) {
    d3_geo_pathAreaPolygon += y0 * x - x0 * y;
    x0 = x, y0 = y;
  }

  // For the last point, return to the start.
  d3_geo_pathArea.lineEnd = function() {
    nextPoint(x00, y00);
  };
}

var d3_geo_pathBoundsX0,
    d3_geo_pathBoundsY0,
    d3_geo_pathBoundsX1,
    d3_geo_pathBoundsY1;

var d3_geo_pathBounds = {
  point: d3_geo_pathBoundsPoint,
  lineStart: d3_noop,
  lineEnd: d3_noop,
  polygonStart: d3_noop,
  polygonEnd: d3_noop
};

function d3_geo_pathBoundsPoint(x, y) {
  if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
  if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
  if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
  if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
}
function d3_geo_pathBuffer() {
  var pointCircle = d3_geo_pathBufferCircle(4.5),
      buffer = [];

  var stream = {
    point: point,

    // While inside a line, override point to moveTo then lineTo.
    lineStart: function() { stream.point = pointLineStart; },
    lineEnd: lineEnd,

    // While inside a polygon, override lineEnd to closePath.
    polygonStart: function() { stream.lineEnd = lineEndPolygon; },
    polygonEnd: function() { stream.lineEnd = lineEnd; stream.point = point; },

    pointRadius: function(_) {
      pointCircle = d3_geo_pathBufferCircle(_);
      return stream;
    },

    result: function() {
      if (buffer.length) {
        var result = buffer.join("");
        buffer = [];
        return result;
      }
    }
  };

  function point(x, y) {
    buffer.push("M", x, ",", y, pointCircle);
  }

  function pointLineStart(x, y) {
    buffer.push("M", x, ",", y);
    stream.point = pointLine;
  }

  function pointLine(x, y) {
    buffer.push("L", x, ",", y);
  }

  function lineEnd() {
    stream.point = point;
  }

  function lineEndPolygon() {
    buffer.push("Z");
  }

  return stream;
}

function d3_geo_pathBufferCircle(radius) {
  return "m0," + radius
      + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
      + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
      + "z";
}

// TODO Unify this code with d3.geom.polygon centroid?
// TODO Enforce positive area for exterior, negative area for interior?

var d3_geo_pathCentroid = {
  point: d3_geo_pathCentroidPoint,

  // For lines, weight by length.
  lineStart: d3_geo_pathCentroidLineStart,
  lineEnd: d3_geo_pathCentroidLineEnd,

  // For polygons, weight by area.
  polygonStart: function() {
    d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
  },
  polygonEnd: function() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
    d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
    d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
  }
};

function d3_geo_pathCentroidPoint(x, y) {
  d3_geo_centroidX0 += x;
  d3_geo_centroidY0 += y;
  ++d3_geo_centroidZ0;
}

function d3_geo_pathCentroidLineStart() {
  var x0, y0;

  d3_geo_pathCentroid.point = function(x, y) {
    d3_geo_pathCentroid.point = nextPoint;
    d3_geo_pathCentroidPoint(x0 = x, y0 = y);
  };

  function nextPoint(x, y) {
    var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
    d3_geo_centroidX1 += z * (x0 + x) / 2;
    d3_geo_centroidY1 += z * (y0 + y) / 2;
    d3_geo_centroidZ1 += z;
    d3_geo_pathCentroidPoint(x0 = x, y0 = y);
  }
}

function d3_geo_pathCentroidLineEnd() {
  d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
}

function d3_geo_pathCentroidRingStart() {
  var x00, y00, x0, y0;

  // For the first point, …
  d3_geo_pathCentroid.point = function(x, y) {
    d3_geo_pathCentroid.point = nextPoint;
    d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
  };

  // For subsequent points, …
  function nextPoint(x, y) {
    var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
    d3_geo_centroidX1 += z * (x0 + x) / 2;
    d3_geo_centroidY1 += z * (y0 + y) / 2;
    d3_geo_centroidZ1 += z;

    z = y0 * x - x0 * y;
    d3_geo_centroidX2 += z * (x0 + x);
    d3_geo_centroidY2 += z * (y0 + y);
    d3_geo_centroidZ2 += z * 3;
    d3_geo_pathCentroidPoint(x0 = x, y0 = y);
  }

  // For the last point, return to the start.
  d3_geo_pathCentroid.lineEnd = function() {
    nextPoint(x00, y00);
  };
}

function d3_geo_pathContext(context) {
  var pointRadius = 4.5;

  var stream = {
    point: point,

    // While inside a line, override point to moveTo then lineTo.
    lineStart: function() { stream.point = pointLineStart; },
    lineEnd: lineEnd,

    // While inside a polygon, override lineEnd to closePath.
    polygonStart: function() { stream.lineEnd = lineEndPolygon; },
    polygonEnd: function() { stream.lineEnd = lineEnd; stream.point = point; },

    pointRadius: function(_) {
      pointRadius = _;
      return stream;
    },

    result: d3_noop
  };

  function point(x, y) {
    context.moveTo(x, y);
    context.arc(x, y, pointRadius, 0, τ);
  }

  function pointLineStart(x, y) {
    context.moveTo(x, y);
    stream.point = pointLine;
  }

  function pointLine(x, y) {
    context.lineTo(x, y);
  }

  function lineEnd() {
    stream.point = point;
  }

  function lineEndPolygon() {
    context.closePath();
  }

  return stream;
}

function d3_geo_resample(project) {
  var δ2 = .5, // precision, px²
      cosMinDistance = Math.cos(30 * d3_radians), // cos(minimum angular distance)
      maxDepth = 16;

  function resample(stream) {
    return (maxDepth ? resampleRecursive : resampleNone)(stream);
  }

  function resampleNone(stream) {
    return d3_geo_transformPoint(stream, function(x, y) {
      x = project(x, y);
      stream.point(x[0], x[1]);
    });
  }

  function resampleRecursive(stream) {
    var λ00, φ00, x00, y00, a00, b00, c00, // first point
        λ0, x0, y0, a0, b0, c0; // previous point

    var resample = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() { stream.polygonStart(); resample.lineStart = ringStart; },
      polygonEnd: function() { stream.polygonEnd(); resample.lineStart = lineStart; }
    };

    function point(x, y) {
      x = project(x, y);
      stream.point(x[0], x[1]);
    }

    function lineStart() {
      x0 = NaN;
      resample.point = linePoint;
      stream.lineStart();
    }

    function linePoint(λ, φ) {
      var c = d3_geo_cartesian([λ, φ]), p = project(λ, φ);
      resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
      stream.point(x0, y0);
    }

    function lineEnd() {
      resample.point = point;
      stream.lineEnd();
    }

    function ringStart() {
      lineStart();
      resample.point = ringPoint;
      resample.lineEnd = ringEnd;
    }

    function ringPoint(λ, φ) {
      linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
      resample.point = linePoint;
    }

    function ringEnd() {
      resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
      resample.lineEnd = lineEnd;
      lineEnd();
    }

    return resample;
  }

  function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
    var dx = x1 - x0,
        dy = y1 - y0,
        d2 = dx * dx + dy * dy;
    if (d2 > 4 * δ2 && depth--) {
      var a = a0 + a1,
          b = b0 + b1,
          c = c0 + c1,
          m = Math.sqrt(a * a + b * b + c * c),
          φ2 = Math.asin(c /= m),
          λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a),
          p = project(λ2, φ2),
          x2 = p[0],
          y2 = p[1],
          dx2 = x2 - x0,
          dy2 = y2 - y0,
          dz = dy * dx2 - dx * dy2;
      if (dz * dz / d2 > δ2 // perpendicular projected distance
          || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 // midpoint close to an end
          || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
        stream.point(x2, y2);
        resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
      }
    }
  }

  resample.precision = function(_) {
    if (!arguments.length) return Math.sqrt(δ2);
    maxDepth = (δ2 = _ * _) > 0 && 16;
    return resample;
  };

  return resample;
}

d3.geo.path = function() {
  var pointRadius = 4.5,
      projection,
      context,
      projectStream,
      contextStream,
      cacheStream;

  function path(object) {
    if (object) {
      if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
      if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
      d3.geo.stream(object, cacheStream);
    }
    return contextStream.result();
  }

  path.area = function(object) {
    d3_geo_pathAreaSum = 0;
    d3.geo.stream(object, projectStream(d3_geo_pathArea));
    return d3_geo_pathAreaSum;
  };

  path.centroid = function(object) {
    d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 =
    d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 =
    d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
    return d3_geo_centroidZ2 ? [d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2]
        : d3_geo_centroidZ1 ? [d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1]
        : d3_geo_centroidZ0 ? [d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0]
        : [NaN, NaN];
  };

  path.bounds = function(object) {
    d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
    d3.geo.stream(object, projectStream(d3_geo_pathBounds));
    return [[d3_geo_pathBoundsX0, d3_geo_pathBoundsY0], [d3_geo_pathBoundsX1, d3_geo_pathBoundsY1]];
  };

  path.projection = function(_) {
    if (!arguments.length) return projection;
    projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
    return reset();
  };

  path.context = function(_) {
    if (!arguments.length) return context;
    contextStream = (context = _) == null ? new d3_geo_pathBuffer : new d3_geo_pathContext(_);
    if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
    return reset();
  };

  path.pointRadius = function(_) {
    if (!arguments.length) return pointRadius;
    pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
    return path;
  };

  function reset() {
    cacheStream = null;
    return path;
  }

  return path.projection(d3.geo.albersUsa()).context(null);
};

function d3_geo_pathProjectStream(project) {
  var resample = d3_geo_resample(function(x, y) { return project([x * d3_degrees, y * d3_degrees]); });
  return function(stream) { return d3_geo_projectionRadians(resample(stream)); };
}

d3.geo.transform = function(methods) {
  return {
    stream: function(stream) {
      var transform = new d3_geo_transform(stream);
      for (var k in methods) transform[k] = methods[k];
      return transform;
    }
  };
};

function d3_geo_transform(stream) {
  this.stream = stream;
}

d3_geo_transform.prototype = {
  point: function(x, y) { this.stream.point(x, y); },
  sphere: function() { this.stream.sphere(); },
  lineStart: function() { this.stream.lineStart(); },
  lineEnd: function() { this.stream.lineEnd(); },
  polygonStart: function() { this.stream.polygonStart(); },
  polygonEnd: function() { this.stream.polygonEnd(); }
};

function d3_geo_transformPoint(stream, point) {
  return {
    point: point,
    sphere: function() { stream.sphere(); },
    lineStart: function() { stream.lineStart(); },
    lineEnd: function() { stream.lineEnd(); },
    polygonStart: function() { stream.polygonStart(); },
    polygonEnd: function() { stream.polygonEnd(); },
  };
}

d3.geo.projection = d3_geo_projection;
d3.geo.projectionMutator = d3_geo_projectionMutator;

function d3_geo_projection(project) {
  return d3_geo_projectionMutator(function() { return project; })();
}

function d3_geo_projectionMutator(projectAt) {
  var project,
      rotate,
      projectRotate,
      projectResample = d3_geo_resample(function(x, y) { x = project(x, y); return [x[0] * k + δx, δy - x[1] * k]; }),
      k = 150, // scale
      x = 480, y = 250, // translate
      λ = 0, φ = 0, // center
      δλ = 0, δφ = 0, δγ = 0, // rotate
      δx, δy, // center
      preclip = d3_geo_clipAntimeridian,
      postclip = d3_identity,
      clipAngle = null,
      clipExtent = null,
      stream;

  function projection(point) {
    point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
    return [point[0] * k + δx, δy - point[1] * k];
  }

  function invert(point) {
    point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
    return point && [point[0] * d3_degrees, point[1] * d3_degrees];
  }

  projection.stream = function(output) {
    if (stream) stream.valid = false;
    stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
    stream.valid = true; // allow caching by d3.geo.path
    return stream;
  };

  projection.clipAngle = function(_) {
    if (!arguments.length) return clipAngle;
    preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
    return invalidate();
  };

  projection.clipExtent = function(_) {
    if (!arguments.length) return clipExtent;
    clipExtent = _;
    postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
    return invalidate();
  };

  projection.scale = function(_) {
    if (!arguments.length) return k;
    k = +_;
    return reset();
  };

  projection.translate = function(_) {
    if (!arguments.length) return [x, y];
    x = +_[0];
    y = +_[1];
    return reset();
  };

  projection.center = function(_) {
    if (!arguments.length) return [λ * d3_degrees, φ * d3_degrees];
    λ = _[0] % 360 * d3_radians;
    φ = _[1] % 360 * d3_radians;
    return reset();
  };

  projection.rotate = function(_) {
    if (!arguments.length) return [δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees];
    δλ = _[0] % 360 * d3_radians;
    δφ = _[1] % 360 * d3_radians;
    δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
    return reset();
  };

  d3.rebind(projection, projectResample, "precision");

  function reset() {
    projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
    var center = project(λ, φ);
    δx = x - center[0] * k;
    δy = y + center[1] * k;
    return invalidate();
  }

  function invalidate() {
    if (stream) stream.valid = false, stream = null;
    return projection;
  }

  return function() {
    project = projectAt.apply(this, arguments);
    projection.invert = project.invert && invert;
    return reset();
  };
}

function d3_geo_projectionRadians(stream) {
  return d3_geo_transformPoint(stream, function(x, y) {
    stream.point(x * d3_radians, y * d3_radians);
  });
}

function d3_geo_mercator(λ, φ) {
  return [λ, Math.log(Math.tan(π / 4 + φ / 2))];
}

d3_geo_mercator.invert = function(x, y) {
  return [x, 2 * Math.atan(Math.exp(y)) - halfπ];
};

function d3_geo_mercatorProjection(project) {
  var m = d3_geo_projection(project),
      scale = m.scale,
      translate = m.translate,
      clipExtent = m.clipExtent,
      clipAuto;

  m.scale = function() {
    var v = scale.apply(m, arguments);
    return v === m ? (clipAuto ? m.clipExtent(null) : m) : v;
  };

  m.translate = function() {
    var v = translate.apply(m, arguments);
    return v === m ? (clipAuto ? m.clipExtent(null) : m) : v;
  };

  m.clipExtent = function(_) {
    var v = clipExtent.apply(m, arguments);
    if (v === m) {
      if (clipAuto = _ == null) {
        var k = π * scale(), t = translate();
        clipExtent([[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]]);
      }
    } else if (clipAuto) {
      v = null;
    }
    return v;
  };

  return m.clipExtent(null);
}

(d3.geo.mercator = function() {
  return d3_geo_mercatorProjection(d3_geo_mercator);
}).raw = d3_geo_mercator;
  if (typeof define === "function" && define.amd) define(d3);
  else if (typeof module === "object" && module.exports) module.exports = d3;
  this.d3 = d3;
}();
/**
 * Hashchange Event Polyfill
 */

(function() {

	window.HashChangeEvent = (function() {
		var ret = function(oldURL, newURL) {
			this.oldURL = oldURL;
			this.newURL = newURL;
			this.timeStamp = (new Date()).getTime();
		};
		ret.prototype = {
			bubbles: false,
			cancelable: false,
			currentTarget: null,
			defaultPrevented: false,
			returnValue: true,
			srcElement: null,
			target: null,
			timeStamp: null,
			type: 'hashchange'
		};
		return ret;
	}());

	var fix = {

		// Bound event listeners
		listeners: {
			funcs: [ ],
			remove: function(func) {
				var arr = [ ];
				for (var i = 0, c = fix.listeners.funcs.length; i < c; i++) {
					if (fix.listeners.funcs[i] !== func) {
						arr.push(fix.listeners.funcs[i]);
					}
				}
				fix.listeners.funcs = arr;
			}
		},

		// Start the poller
		init: function() {
			// Get the starting hash
			fix.lastHash = fix.getHash();
			fix.lastLocation = String(location);
			// Patch addEventListener
			if (window.addEventListener) {
				var nativeAEL = window.addEventListener;
				window.addEventListener = function(evt, func) {
					if (evt === 'hashchange') {
						fix.listeners.funcs.push(func);
					} else {
						return nativeAEL.apply(window, arguments);
					}
				};
			}
			// Patch attachEvent
			if (window.attachEvent) {
				var nativeAE = window.attachEvent;
				window.attachEvent = function(evt, func) {
					if (evt === 'onhashchange') {
						fix.listeners.funcs.push(func);
					} else {
						return nativeAE.apply(window, arguments);
					}
				};
			}
			// Start polling
			fix.setTimeout();
		},

		// The previous hash value
		lastHash: null,
		lastLocation: null,

		// The number of miliseconds between pollings
		pollerRate: 50,

		// Read the hash value from the URL
		getHash: function() {
			return location.hash.slice(1);
		},

		// Sets the next interval for the timer
		setTimeout: function() {
			window.setTimeout(fix.pollerInterval, fix.pollerRate);
		},

		// Creates a new hashchange event object
		createEventObject: function(oldURL, newURL) {
			return new window.HashChangeEvent(oldURL, newURL);
		},

		// Runs on an interval testing the hash
		pollerInterval: function() {
			var hash = fix.getHash();
			if (hash !== fix.lastHash) {
				var funcs = fix.listeners.funcs.slice(0);
				if (typeof window.onhashchange === 'function') {
					funcs.push(window.onhashchange);
				}
				for (var i = 0, c = funcs.length; i < c; i++) {
					var evt = fix.createEventObject({
						oldURL: fix.lastLocation,
						newURL: String(location)
					});
				}
				fix.lastHash = fix.getHash();
				fix.lastLocation = String(location);
			}
			fix.setTimeout();
		}

	};

	fix.init();

}());
/* Blob.js
 * A Blob implementation.
 * 2013-06-20
 * 
 * By Eli Grey, http://eligrey.com
 * By Devin Samarin, https://github.com/eboyjr
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/Blob.js/blob/master/Blob.js */

if (typeof Blob !== "function" || typeof URL === "undefined")
if (typeof Blob === "function" && typeof webkitURL !== "undefined") self.URL = webkitURL;
else var Blob = (function (view) {
	"use strict";

	var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || view.MSBlobBuilder || (function(view) {
		var
			  get_class = function(object) {
				return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
			}
			, FakeBlobBuilder = function BlobBuilder() {
				this.data = [];
			}
			, FakeBlob = function Blob(data, type, encoding) {
				this.data = data;
				this.size = data.length;
				this.type = type;
				this.encoding = encoding;
			}
			, FBB_proto = FakeBlobBuilder.prototype
			, FB_proto = FakeBlob.prototype
			, FileReaderSync = view.FileReaderSync
			, FileException = function(type) {
				this.code = this[this.name = type];
			}
			, file_ex_codes = (
				  "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
				+ "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
			).split(" ")
			, file_ex_code = file_ex_codes.length
			, real_URL = view.URL || view.webkitURL || view
			, real_create_object_URL = real_URL.createObjectURL
			, real_revoke_object_URL = real_URL.revokeObjectURL
			, URL = real_URL
			, btoa = view.btoa
			, atob = view.atob
			
			, ArrayBuffer = view.ArrayBuffer
			, Uint8Array = view.Uint8Array
		;
		FakeBlob.fake = FB_proto.fake = true;
		while (file_ex_code--) {
			FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
		}
		if (!real_URL.createObjectURL) {
			URL = view.URL = {};
		}
		URL.createObjectURL = function(blob) {
			var
				  type = blob.type
				, data_URI_header
			;
			if (type === null) {
				type = "application/octet-stream";
			}
			if (blob instanceof FakeBlob) {
				data_URI_header = "data:" + type;
				if (blob.encoding === "base64") {
					return data_URI_header + ";base64," + blob.data;
				} else if (blob.encoding === "URI") {
					return data_URI_header + "," + decodeURIComponent(blob.data);
				} if (btoa) {
					return data_URI_header + ";base64," + btoa(blob.data);
				} else {
					return data_URI_header + "," + encodeURIComponent(blob.data);
				}
			} else if (real_create_object_URL) {
				return real_create_object_URL.call(real_URL, blob);
			}
		};
		URL.revokeObjectURL = function(object_URL) {
			if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
				real_revoke_object_URL.call(real_URL, object_URL);
			}
		};
		FBB_proto.append = function(data/*, endings*/) {
			var bb = this.data;
			// decode data to a binary string
			if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
				var
					  str = ""
					, buf = new Uint8Array(data)
					, i = 0
					, buf_len = buf.length
				;
				for (; i < buf_len; i++) {
					str += String.fromCharCode(buf[i]);
				}
				bb.push(str);
			} else if (get_class(data) === "Blob" || get_class(data) === "File") {
				if (FileReaderSync) {
					var fr = new FileReaderSync;
					bb.push(fr.readAsBinaryString(data));
				} else {
					// async FileReader won't work as BlobBuilder is sync
					throw new FileException("NOT_READABLE_ERR");
				}
			} else if (data instanceof FakeBlob) {
				if (data.encoding === "base64" && atob) {
					bb.push(atob(data.data));
				} else if (data.encoding === "URI") {
					bb.push(decodeURIComponent(data.data));
				} else if (data.encoding === "raw") {
					bb.push(data.data);
				}
			} else {
				if (typeof data !== "string") {
					data += ""; // convert unsupported types to strings
				}
				// decode UTF-16 to binary string
				bb.push(unescape(encodeURIComponent(data)));
			}
		};
		FBB_proto.getBlob = function(type) {
			if (!arguments.length) {
				type = null;
			}
			return new FakeBlob(this.data.join(""), type, "raw");
		};
		FBB_proto.toString = function() {
			return "[object BlobBuilder]";
		};
		FB_proto.slice = function(start, end, type) {
			var args = arguments.length;
			if (args < 3) {
				type = null;
			}
			return new FakeBlob(
				  this.data.slice(start, args > 1 ? end : this.data.length)
				, type
				, this.encoding
			);
		};
		FB_proto.toString = function() {
			return "[object Blob]";
		};
		return FakeBlobBuilder;
	}(view));

	return function Blob(blobParts, options) {
		var type = options ? (options.type || "") : "";
		var builder = new BlobBuilder();
		if (blobParts) {
			for (var i = 0, len = blobParts.length; i < len; i++) {
				builder.append(blobParts[i]);
			}
		}
		return builder.getBlob(type);
	};
}(self));
/*
 * $Id: base64.js,v 2.12 2013/05/06 07:54:20 dankogai Exp dankogai $
 *
 *  Licensed under the MIT license.
 *    http://opensource.org/licenses/mit-license
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */

(function(global) {
    'use strict';
    if (global.Base64) return;
    var version = "2.1.2";
    // if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        buffer = require('buffer').Buffer;
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                + fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                   + fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                    + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                    + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                    + fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
            b64chars.charAt( ord >>> 18),
            b64chars.charAt((ord >>> 12) & 63),
            padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
            padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
        return chars.join('');
    };
    var btoa = global.btoa || function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer
        ? function (u) { return (new buffer(u)).toString('base64') } 
    : function (u) { return btoa(utob(u)) }
    ;
    var encode = function(u, urisafe) {
        return !urisafe 
            ? _encode(u)
            : _encode(u).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true) };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
            return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
        case 3:
            return fromCharCode(
                ((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
            );
        default:
            return  fromCharCode(
                ((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
            );
        }
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
        chars = [
            fromCharCode( n >>> 16),
            fromCharCode((n >>>  8) & 0xff),
            fromCharCode( n         & 0xff)
        ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob || function(a){
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer
        ? function(a) { return (new buffer(a, 'base64')).toString() }
    : function(a) { return btou(atob(a)) };
    var decode = function(a){
        return _decode(
            a.replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true)
                }));
        };
    }
    // that's it!
})(this);
function bucket() {

    var event = d3.dispatch('chosen'),
        deposits;

    return {
        deposit: deposit,
        store: store
    };

    function deposit() {
        return function(selection) {
            deposits = selection;
            selection.each(function() {
                var sel = d3.select(this);
                sel.attr('data-text', sel.text());
            });
        };
    }

    function store() {
        var clone, dropped, dims;
        function change() {
            event.chosen(
            deposits.filter(function() {
                return d3.select(this).classed('filled');
            })
            .map(function(elems) {
                return elems.map(function(e) {
                    return d3.select(e).text();
                });
            })[0]);
        }
        var drag = d3.behavior.drag()
            .origin(function() {
                // return { x: d3.event.pageX, y: d3.event.pageY };
                return { x: this.offsetLeft, y: this.offsetTop };
            })
            .on('dragstart', function() {
                clone = d3.select(this.parentNode.insertBefore(this.cloneNode(true), this));
                d3.select(this)
                    .style('position', 'absolute')
                    .style('pointer-events', 'none');
                dims = [this.offsetWidth, this.offsetHeight];
            })
            .on('drag', function() {
                d3.select(this)
                    .style('left', d3.event.x - (dims[0] / 2) + 'px')
                    .style('top', d3.event.y - (dims[1] / 2) + 'px');
            })
            .on('dragend', function() {
                var self = d3.select(this);
                var target = d3.select(d3.event.sourceEvent.target);
                if (target.classed('bucket')) {
                    target
                        .text(self.text())
                        .classed('filled', true);
                    target
                        .append('span')
                        .classed('remove-button', true)
                        .on('click', function() {
                            target
                                .text(target.attr('data-text'))
                                .classed('filled', false);
                            change();
                        });
                    self.remove();
                    clone.call(drag);
                    change();
                } else {
                    self.remove();
                    clone.call(drag);
                }
            });

        return d3.rebind(function(selection) {
            selection.each(function() {
                var sel = d3.select(this).call(drag);
                sel.attr('data-text', sel.text());
            });
        }, event, 'on');
    }
}
(function() {
  if (typeof module === "undefined") self.queue = queue;
  else module.exports = queue;
  queue.version = "1.0.4";

  var slice = [].slice;

  function queue(parallelism) {
    var q,
        tasks = [],
        started = 0, // number of tasks that have been started (and perhaps finished)
        active = 0, // number of tasks currently being executed (started but not finished)
        remaining = 0, // number of tasks not yet finished
        popping, // inside a synchronous task callback?
        error = null,
        await = noop,
        all;

    if (!parallelism) parallelism = Infinity;

    function pop() {
      while (popping = started < tasks.length && active < parallelism) {
        var i = started++,
            t = tasks[i],
            a = slice.call(t, 1);
        a.push(callback(i));
        ++active;
        t[0].apply(null, a);
      }
    }

    function callback(i) {
      return function(e, r) {
        --active;
        if (error != null) return;
        if (e != null) {
          error = e; // ignore new tasks and squelch active callbacks
          started = remaining = NaN; // stop queued tasks from starting
          notify();
        } else {
          tasks[i] = r;
          if (--remaining) popping || pop();
          else notify();
        }
      };
    }

    function notify() {
      if (error != null) await(error);
      else if (all) await(error, tasks);
      else await.apply(null, [error].concat(tasks));
    }

    return q = {
      defer: function() {
        if (!error) {
          tasks.push(arguments);
          ++remaining;
          pop();
        }
        return q;
      },
      await: function(f) {
        await = f;
        all = false;
        if (!remaining) notify();
        return q;
      },
      awaitAll: function(f) {
        await = f;
        all = true;
        if (!remaining) notify();
        return q;
      }
    };
  }

  function noop() {}
})();
/*
 * This code is licensed under the MIT license.
 *
 * Copyright © 2013, iD authors.
 *
 * Portions copyright © 2011, Keith Cirkel
 * See https://github.com/keithamus/jwerty
 *
 */
d3.keybinding = function(namespace) {
    var bindings = [];

    function matches(binding, event) {
        for (var p in binding.event) {
            if (event[p] != binding.event[p])
                return false;
        }

        return (!binding.capture) === (event.eventPhase !== Event.CAPTURING_PHASE);
    }

    function capture() {
        for (var i = 0; i < bindings.length; i++) {
            var binding = bindings[i];
            if (matches(binding, d3.event)) {
                binding.callback();
            }
        }
    }

    function bubble() {
        var tagName = d3.select(d3.event.target).node().tagName;
        if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
            return;
        }
        capture();
    }

    function keybinding(selection) {
        selection = selection || d3.select(document);
        selection.on('keydown.capture' + namespace, capture, true);
        selection.on('keydown.bubble' + namespace, bubble, false);
        return keybinding;
    }

    keybinding.off = function(selection) {
        selection = selection || d3.select(document);
        selection.on('keydown.capture' + namespace, null);
        selection.on('keydown.bubble' + namespace, null);
        return keybinding;
    };

    keybinding.on = function(code, callback, capture) {
        var binding = {
            event: {
                keyCode: 0,
                shiftKey: false,
                ctrlKey: false,
                altKey: false,
                metaKey: false
            },
            capture: capture,
            callback: callback
        };

        code = code.toLowerCase().match(/(?:(?:[^+⇧⌃⌥⌘])+|[⇧⌃⌥⌘]|\+\+|^\+$)/g);

        for (var i = 0; i < code.length; i++) {
            // Normalise matching errors
            if (code[i] === '++') code[i] = '+';

            if (code[i] in d3.keybinding.modifierCodes) {
                binding.event[d3.keybinding.modifierProperties[d3.keybinding.modifierCodes[code[i]]]] = true;
            } else if (code[i] in d3.keybinding.keyCodes) {
                binding.event.keyCode = d3.keybinding.keyCodes[code[i]];
            }
        }

        bindings.push(binding);

        return keybinding;
    };

    return keybinding;
};

(function () {
    d3.keybinding.modifierCodes = {
        // Shift key, ⇧
        '⇧': 16, shift: 16,
        // CTRL key, on Mac: ⌃
        '⌃': 17, ctrl: 17,
        // ALT key, on Mac: ⌥ (Alt)
        '⌥': 18, alt: 18, option: 18,
        // META, on Mac: ⌘ (CMD), on Windows (Win), on Linux (Super)
        '⌘': 91, meta: 91, cmd: 91, 'super': 91, win: 91
    };

    d3.keybinding.modifierProperties = {
        16: 'shiftKey',
        17: 'ctrlKey',
        18: 'altKey',
        91: 'metaKey'
    };

    d3.keybinding.keyCodes = {
        // Backspace key, on Mac: ⌫ (Backspace)
        '⌫': 8, backspace: 8,
        // Tab Key, on Mac: ⇥ (Tab), on Windows ⇥⇥
        '⇥': 9, '⇆': 9, tab: 9,
        // Return key, ↩
        '↩': 13, 'return': 13, enter: 13, '⌅': 13,
        // Pause/Break key
        'pause': 19, 'pause-break': 19,
        // Caps Lock key, ⇪
        '⇪': 20, caps: 20, 'caps-lock': 20,
        // Escape key, on Mac: ⎋, on Windows: Esc
        '⎋': 27, escape: 27, esc: 27,
        // Space key
        space: 32,
        // Page-Up key, or pgup, on Mac: ↖
        '↖': 33, pgup: 33, 'page-up': 33,
        // Page-Down key, or pgdown, on Mac: ↘
        '↘': 34, pgdown: 34, 'page-down': 34,
        // END key, on Mac: ⇟
        '⇟': 35, end: 35,
        // HOME key, on Mac: ⇞
        '⇞': 36, home: 36,
        // Insert key, or ins
        ins: 45, insert: 45,
        // Delete key, on Mac: ⌦ (Delete)
        '⌦': 46, del: 46, 'delete': 46,
        // Left Arrow Key, or ←
        '←': 37, left: 37, 'arrow-left': 37,
        // Up Arrow Key, or ↑
        '↑': 38, up: 38, 'arrow-up': 38,
        // Right Arrow Key, or →
        '→': 39, right: 39, 'arrow-right': 39,
        // Up Arrow Key, or ↓
        '↓': 40, down: 40, 'arrow-down': 40,
        // odities, printing characters that come out wrong:
        // Num-Multiply, or *
        '*': 106, star: 106, asterisk: 106, multiply: 106,
        // Num-Plus or +
        '+': 107, 'plus': 107,
        // Num-Subtract, or -
        '-': 109, subtract: 109,
        // Semicolon
        ';': 186, semicolon:186,
        // = or equals
        '=': 187, 'equals': 187,
        // Comma, or ,
        ',': 188, comma: 188,
        'dash': 189, //???
        // Period, or ., or full-stop
        '.': 190, period: 190, 'full-stop': 190,
        // Slash, or /, or forward-slash
        '/': 191, slash: 191, 'forward-slash': 191,
        // Tick, or `, or back-quote
        '`': 192, tick: 192, 'back-quote': 192,
        // Open bracket, or [
        '[': 219, 'open-bracket': 219,
        // Back slash, or \
        '\\': 220, 'back-slash': 220,
        // Close backet, or ]
        ']': 221, 'close-bracket': 221,
        // Apostrophe, or Quote, or '
        '\'': 222, quote: 222, apostrophe: 222
    };

    // NUMPAD 0-9
    var i = 95, n = 0;
    while (++i < 106) {
        d3.keybinding.keyCodes['num-' + n] = i;
        ++n;
    }

    // 0-9
    i = 47; n = 0;
    while (++i < 58) {
        d3.keybinding.keyCodes[n] = i;
        ++n;
    }

    // F1-F25
    i = 111; n = 1;
    while (++i < 136) {
        d3.keybinding.keyCodes['f' + n] = i;
        ++n;
    }

    // a-z
    i = 64;
    while (++i < 91) {
        d3.keybinding.keyCodes[String.fromCharCode(i).toLowerCase()] = i;
    }
})();
d3.selection.prototype.trigger = function (type) {
    this.each(function() {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent(type, true, true);
        this.dispatchEvent(evt);
    });
};
(function() {

  // get a reference to the d3.selection prototype,
  // and keep a reference to the old d3.selection.on
  var d3_selectionPrototype = d3.selection.prototype,
      d3_on = d3_selectionPrototype.on;

  // our shims are organized by event:
  // "desired-event": ["shimmed-event", wrapperFunction]
  var shims = {
    "mouseenter": ["mouseover", relatedTarget],
    "mouseleave": ["mouseout", relatedTarget]
  };

  // rewrite the d3.selection.on function to shim the events with wrapped
  // callbacks
  d3_selectionPrototype.on = function(evt, callback, useCapture) {
    var bits = evt.split("."),
        type = bits.shift(),
        shim = shims[type];
    if (shim) {
      evt = bits.length ? [shim[0], bits].join(".") : shim[0];
      if (typeof callback === "function") {
        callback = shim[1](callback);
      }
      return d3_on.call(this, evt, callback, useCapture);
    } else {
      return d3_on.apply(this, arguments);
    } 
  };

  function relatedTarget(callback) {
    return function() {
      var related = d3.event.relatedTarget;
      if (this === related || childOf(this, related)) {
        return undefined;
      }
      return callback.apply(this, arguments);
    };
  }

  function childOf(p, c) {
    if (p === c) return false;
    while (c && c !== p) c = c.parentNode;
    return c === p;
  }

})();
/*
	Leaflet.draw, a plugin that adds drawing and editing tools to Leaflet powered maps.
	(c) 2012-2013, Jacob Toye, Smartrak

	https://github.com/Leaflet/Leaflet.draw
	http://leafletjs.com
	https://github.com/jacobtoye
*/
(function (window, document, undefined) {/*
 * Leaflet.draw assumes that you have already included the Leaflet library.
 */

L.drawVersion = '0.2.3';

L.drawLocal = {
	draw: {
		toolbar: {
			actions: {
				title: 'Cancel drawing',
				text: 'Cancel'
			},
			undo: {
				title: 'Delete last point drawn',
				text: 'Delete last point'
			},
			buttons: {
				polyline: 'Draw a polyline',
				polygon: 'Draw a polygon',
				rectangle: 'Draw a rectangle',
				circle: 'Draw a circle',
				marker: 'Draw a marker'
			}
		},
		handlers: {
			circle: {
				tooltip: {
					start: 'Click and drag to draw circle.'
				}
			},
			marker: {
				tooltip: {
					start: 'Click map to place marker.'
				}
			},
			polygon: {
				tooltip: {
					start: 'Click to start drawing shape.',
					cont: 'Click to continue drawing shape.',
					end: 'Click first point to close this shape.'
				}
			},
			polyline: {
				error: '<strong>Error:</strong> shape edges cannot cross!',
				tooltip: {
					start: 'Click to start drawing line.',
					cont: 'Click to continue drawing line.',
					end: 'Click last point to finish line.'
				}
			},
			rectangle: {
				tooltip: {
					start: 'Click and drag to draw rectangle.'
				}
			},
			simpleshape: {
				tooltip: {
					end: 'Release mouse to finish drawing.'
				}
			}
		}
	},
	edit: {
		toolbar: {
			actions: {
				save: {
					title: 'Save changes.',
					text: 'Save'
				},
				cancel: {
					title: 'Cancel editing, discards all changes.',
					text: 'Cancel'
				}
			},
			buttons: {
				edit: 'Edit layers.',
				editDisabled: 'No layers to edit.',
				remove: 'Delete layers.',
				removeDisabled: 'No layers to delete.'
			}
		},
		handlers: {
			edit: {
				tooltip: {
					text: 'Drag handles, or marker to edit feature.',
					subtext: 'Click cancel to undo changes.'
				}
			},
			remove: {
				tooltip: {
					text: 'Click on a feature to remove'
				}
			}
		}
	}
};


L.Draw = {};

L.Draw.Feature = L.Handler.extend({
	includes: L.Mixin.Events,

	initialize: function (map, options) {
		this._map = map;
		this._container = map._container;
		this._overlayPane = map._panes.overlayPane;
		this._popupPane = map._panes.popupPane;

		// Merge default shapeOptions options with custom shapeOptions
		if (options && options.shapeOptions) {
			options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions);
		}
		L.setOptions(this, options);
	},

	enable: function () {
		if (this._enabled) { return; }

		this.fire('enabled', { handler: this.type });

		this._map.fire('draw:drawstart', { layerType: this.type });

		L.Handler.prototype.enable.call(this);
	},

	disable: function () {
		if (!this._enabled) { return; }

		L.Handler.prototype.disable.call(this);

		this._map.fire('draw:drawstop', { layerType: this.type });

		this.fire('disabled', { handler: this.type });
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			L.DomUtil.disableTextSelection();

			map.getContainer().focus();

			this._tooltip = new L.Tooltip(this._map);

			L.DomEvent.on(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			L.DomUtil.enableTextSelection();

			this._tooltip.dispose();
			this._tooltip = null;

			L.DomEvent.off(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	setOptions: function (options) {
		L.setOptions(this, options);
	},

	_fireCreatedEvent: function (layer) {
		this._map.fire('draw:created', { layer: layer, layerType: this.type });
	},

	// Cancel drawing when the escape key is pressed
	_cancelDrawing: function (e) {
		if (e.keyCode === 27) {
			this.disable();
		}
	}
});

L.Draw.Polyline = L.Draw.Feature.extend({
	statics: {
		TYPE: 'polyline'
	},

	Poly: L.Polyline,

	options: {
		allowIntersection: true,
		repeatMode: false,
		drawError: {
			color: '#b00b00',
			timeout: 2500
		},
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		guidelineDistance: 20,
		maxGuideLineLength: 4000,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: false,
			clickable: true
		},
		metric: true, // Whether to use the metric meaurement system or imperial
		showLength: true, // Whether to display distance in the tooltip
		zIndexOffset: 2000 // This should be > than the highest z-index any map layers
	},

	initialize: function (map, options) {
		// Need to set this here to ensure the correct message is used.
		this.options.drawError.message = L.drawLocal.draw.handlers.polyline.error;

		// Merge default drawError options with custom options
		if (options && options.drawError) {
			options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Polyline.TYPE;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._markers = [];

			this._markerGroup = new L.LayerGroup();
			this._map.addLayer(this._markerGroup);

			this._poly = new L.Polyline([], this.options.shapeOptions);

			this._tooltip.updateContent(this._getTooltipText());

			// Make a transparent marker that will used to catch click events. These click
			// events will create the vertices. We need to do this so we can ensure that
			// we can create vertices over other map layers (markers, vector layers). We
			// also do not want to trigger any click handlers of objects we are clicking on
			// while drawing.
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseMarker
				.on('mousedown', this._onMouseDown, this)
				.addTo(this._map);

			this._map
				.on('mousemove', this._onMouseMove, this)
				.on('mouseup', this._onMouseUp, this)
				.on('zoomend', this._onZoomEnd, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		this._clearHideErrorTimeout();

		this._cleanUpShape();

		// remove markers from map
		this._map.removeLayer(this._markerGroup);
		delete this._markerGroup;
		delete this._markers;

		this._map.removeLayer(this._poly);
		delete this._poly;

		this._mouseMarker
			.off('mousedown', this._onMouseDown, this)
			.off('mouseup', this._onMouseUp, this);
		this._map.removeLayer(this._mouseMarker);
		delete this._mouseMarker;

		// clean up DOM
		this._clearGuides();

		this._map
			.off('mousemove', this._onMouseMove, this)
			.off('zoomend', this._onZoomEnd, this);
	},

	deleteLastVertex: function () {
		if (this._markers.length <= 1) {
			return;
		}

		var lastMarker = this._markers.pop(),
			poly = this._poly,
			latlng = this._poly.spliceLatLngs(poly.getLatLngs().length - 1, 1)[0];

		this._markerGroup.removeLayer(lastMarker);

		if (poly.getLatLngs().length < 2) {
			this._map.removeLayer(poly);
		}

		this._vertexChanged(latlng, false);
	},

	addVertex: function (latlng) {
		var markersLength = this._markers.length;

		if (markersLength > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
			this._showErrorTooltip();
			return;
		}
		else if (this._errorShown) {
			this._hideErrorTooltip();
		}

		this._markers.push(this._createMarker(latlng));

		this._poly.addLatLng(latlng);

		if (this._poly.getLatLngs().length === 2) {
			this._map.addLayer(this._poly);
		}

		this._vertexChanged(latlng, true);
	},

	_finishShape: function () {
		var intersects = this._poly.newLatLngIntersects(this._poly.getLatLngs()[0], true);

		if ((!this.options.allowIntersection && intersects) || !this._shapeIsValid()) {
			this._showErrorTooltip();
			return;
		}

		this._fireCreatedEvent();
		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	//Called to verify the shape is valid when the user tries to finish it
	//Return false if the shape is not valid
	_shapeIsValid: function () {
		return true;
	},

	_onZoomEnd: function () {
		this._updateGuide();
	},

	_onMouseMove: function (e) {
		var newPos = e.layerPoint,
			latlng = e.latlng;

		// Save latlng
		// should this be moved to _updateGuide() ?
		this._currentLatLng = latlng;

		this._updateTooltip(latlng);

		// Update the guide line
		this._updateGuide(newPos);

		// Update the mouse marker position
		this._mouseMarker.setLatLng(latlng);

		L.DomEvent.preventDefault(e.originalEvent);
	},

	_vertexChanged: function (latlng, added) {
		this._updateFinishHandler();

		this._updateRunningMeasure(latlng, added);

		this._clearGuides();

		this._updateTooltip();
	},

	_onMouseDown: function (e) {
		var originalEvent = e.originalEvent;
		this._mouseDownOrigin = L.point(originalEvent.clientX, originalEvent.clientY);
	},

	_onMouseUp: function (e) {
		if (this._mouseDownOrigin) {
			// We detect clicks within a certain tolerance, otherwise let it
			// be interpreted as a drag by the map
			var distance = L.point(e.originalEvent.clientX, e.originalEvent.clientY)
				.distanceTo(this._mouseDownOrigin);
			if (Math.abs(distance) < 9 * (window.devicePixelRatio || 1)) {
				this.addVertex(e.latlng);
			}
		}
		this._mouseDownOrigin = null;
	},

	_updateFinishHandler: function () {
		var markerCount = this._markers.length;
		// The last marker should have a click handler to close the polyline
		if (markerCount > 1) {
			this._markers[markerCount - 1].on('click', this._finishShape, this);
		}

		// Remove the old marker click handler (as only the last point should close the polyline)
		if (markerCount > 2) {
			this._markers[markerCount - 2].off('click', this._finishShape, this);
		}
	},

	_createMarker: function (latlng) {
		var marker = new L.Marker(latlng, {
			icon: this.options.icon,
			zIndexOffset: this.options.zIndexOffset * 2
		});

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_updateGuide: function (newPos) {
		var markerCount = this._markers.length;

		if (markerCount > 0) {
			newPos = newPos || this._map.latLngToLayerPoint(this._currentLatLng);

			// draw the guide line
			this._clearGuides();
			this._drawGuide(
				this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
				newPos
			);
		}
	},

	_updateTooltip: function (latLng) {
		var text = this._getTooltipText();

		if (latLng) {
			this._tooltip.updatePosition(latLng);
		}

		if (!this._errorShown) {
			this._tooltip.updateContent(text);
		}
	},

	_drawGuide: function (pointA, pointB) {
		var length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2))),
			guidelineDistance = this.options.guidelineDistance,
			maxGuideLineLength = this.options.maxGuideLineLength,
			// Only draw a guideline with a max length
			i = length > maxGuideLineLength ? length - maxGuideLineLength : guidelineDistance,
			fraction,
			dashPoint,
			dash;

		//create the guides container if we haven't yet
		if (!this._guidesContainer) {
			this._guidesContainer = L.DomUtil.create('div', 'leaflet-draw-guides', this._overlayPane);
		}

		//draw a dash every GuildeLineDistance
		for (; i < length; i += this.options.guidelineDistance) {
			//work out fraction along line we are
			fraction = i / length;

			//calculate new x,y point
			dashPoint = {
				x: Math.floor((pointA.x * (1 - fraction)) + (fraction * pointB.x)),
				y: Math.floor((pointA.y * (1 - fraction)) + (fraction * pointB.y))
			};

			//add guide dash to guide container
			dash = L.DomUtil.create('div', 'leaflet-draw-guide-dash', this._guidesContainer);
			dash.style.backgroundColor =
				!this._errorShown ? this.options.shapeOptions.color : this.options.drawError.color;

			L.DomUtil.setPosition(dash, dashPoint);
		}
	},

	_updateGuideColor: function (color) {
		if (this._guidesContainer) {
			for (var i = 0, l = this._guidesContainer.childNodes.length; i < l; i++) {
				this._guidesContainer.childNodes[i].style.backgroundColor = color;
			}
		}
	},

	// removes all child elements (guide dashes) from the guides container
	_clearGuides: function () {
		if (this._guidesContainer) {
			while (this._guidesContainer.firstChild) {
				this._guidesContainer.removeChild(this._guidesContainer.firstChild);
			}
		}
	},

	_getTooltipText: function () {
		var showLength = this.options.showLength,
			labelText, distanceStr;

		if (this._markers.length === 0) {
			labelText = {
				text: L.drawLocal.draw.handlers.polyline.tooltip.start
			};
		} else {
			distanceStr = showLength ? this._getMeasurementString() : '';

			if (this._markers.length === 1) {
				labelText = {
					text: L.drawLocal.draw.handlers.polyline.tooltip.cont,
					subtext: distanceStr
				};
			} else {
				labelText = {
					text: L.drawLocal.draw.handlers.polyline.tooltip.end,
					subtext: distanceStr
				};
			}
		}
		return labelText;
	},

	_updateRunningMeasure: function (latlng, added) {
		var markersLength = this._markers.length,
			previousMarkerIndex, distance;

		if (this._markers.length === 1) {
			this._measurementRunningTotal = 0;
		} else {
			previousMarkerIndex = markersLength - (added ? 2 : 1);
			distance = latlng.distanceTo(this._markers[previousMarkerIndex].getLatLng());

			this._measurementRunningTotal += distance * (added ? 1 : -1);
		}
	},

	_getMeasurementString: function () {
		var currentLatLng = this._currentLatLng,
			previousLatLng = this._markers[this._markers.length - 1].getLatLng(),
			distance;

		// calculate the distance from the last fixed point to the mouse position
		distance = this._measurementRunningTotal + currentLatLng.distanceTo(previousLatLng);

		return L.GeometryUtil.readableDistance(distance, this.options.metric);
	},

	_showErrorTooltip: function () {
		this._errorShown = true;

		// Update tooltip
		this._tooltip
			.showAsError()
			.updateContent({ text: this.options.drawError.message });

		// Update shape
		this._updateGuideColor(this.options.drawError.color);
		this._poly.setStyle({ color: this.options.drawError.color });

		// Hide the error after 2 seconds
		this._clearHideErrorTimeout();
		this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorTooltip, this), this.options.drawError.timeout);
	},

	_hideErrorTooltip: function () {
		this._errorShown = false;

		this._clearHideErrorTimeout();

		// Revert tooltip
		this._tooltip
			.removeError()
			.updateContent(this._getTooltipText());

		// Revert shape
		this._updateGuideColor(this.options.shapeOptions.color);
		this._poly.setStyle({ color: this.options.shapeOptions.color });
	},

	_clearHideErrorTimeout: function () {
		if (this._hideErrorTimeout) {
			clearTimeout(this._hideErrorTimeout);
			this._hideErrorTimeout = null;
		}
	},

	_cleanUpShape: function () {
		if (this._markers.length > 1) {
			this._markers[this._markers.length - 1].off('click', this._finishShape, this);
		}
	},

	_fireCreatedEvent: function () {
		var poly = new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions);
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
	}
});


L.Draw.Polygon = L.Draw.Polyline.extend({
	statics: {
		TYPE: 'polygon'
	},

	Poly: L.Polygon,

	options: {
		showArea: false,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},

	initialize: function (map, options) {
		L.Draw.Polyline.prototype.initialize.call(this, map, options);

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Polygon.TYPE;
	},

	_updateFinishHandler: function () {
		var markerCount = this._markers.length;

		// The first marker should have a click handler to close the polygon
		if (markerCount === 1) {
			this._markers[0].on('click', this._finishShape, this);
		}

		// Add and update the double click handler
		if (markerCount > 2) {
			this._markers[markerCount - 1].on('dblclick', this._finishShape, this);
			// Only need to remove handler if has been added before
			if (markerCount > 3) {
				this._markers[markerCount - 2].off('dblclick', this._finishShape, this);
			}
		}
	},

	_getTooltipText: function () {
		var text, subtext;

		if (this._markers.length === 0) {
			text = L.drawLocal.draw.handlers.polygon.tooltip.start;
		} else if (this._markers.length < 3) {
			text = L.drawLocal.draw.handlers.polygon.tooltip.cont;
		} else {
			text = L.drawLocal.draw.handlers.polygon.tooltip.end;
			subtext = this._getMeasurementString();
		}

		return {
			text: text,
			subtext: subtext
		};
	},

	_getMeasurementString: function () {
		var area = this._area;

		if (!area) {
			return null;
		}

		return L.GeometryUtil.readableArea(area, this.options.metric);
	},

	_shapeIsValid: function () {
		return this._markers.length >= 3;
	},

	_vertexAdded: function () {
		// Check to see if we should show the area
		if (this.options.allowIntersection || !this.options.showArea) {
			return;
		}

		var latLngs = this._poly.getLatLngs();

		this._area = L.GeometryUtil.geodesicArea(latLngs);
	},

	_cleanUpShape: function () {
		var markerCount = this._markers.length;

		if (markerCount > 0) {
			this._markers[0].off('click', this._finishShape, this);

			if (markerCount > 2) {
				this._markers[markerCount - 1].off('dblclick', this._finishShape, this);
			}
		}
	}
});


L.SimpleShape = {};

L.Draw.SimpleShape = L.Draw.Feature.extend({
	options: {
		repeatMode: false
	},

	initialize: function (map, options) {
		this._endLabelText = L.drawLocal.draw.handlers.simpleshape.tooltip.end;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._mapDraggable = this._map.dragging.enabled();

			if (this._mapDraggable) {
				this._map.dragging.disable();
			}

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._tooltip.updateContent({ text: this._initialLabelText });

			this._map
				.on('mousedown', this._onMouseDown, this)
				.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);
		if (this._map) {
			if (this._mapDraggable) {
				this._map.dragging.enable();
			}

			//TODO refactor: move cursor to styles
			this._container.style.cursor = '';

			this._map
				.off('mousedown', this._onMouseDown, this)
				.off('mousemove', this._onMouseMove, this);

			L.DomEvent.off(document, 'mouseup', this._onMouseUp, this);

			// If the box element doesn't exist they must not have moved the mouse, so don't need to destroy/return
			if (this._shape) {
				this._map.removeLayer(this._shape);
				delete this._shape;
			}
		}
		this._isDrawing = false;
	},

	_onMouseDown: function (e) {
		this._isDrawing = true;
		this._startLatLng = e.latlng;

		L.DomEvent
			.on(document, 'mouseup', this._onMouseUp, this)
			.preventDefault(e.originalEvent);
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._tooltip.updateContent({ text: this._endLabelText });
			this._drawShape(latlng);
		}
	},

	_onMouseUp: function () {
		if (this._shape) {
			this._fireCreatedEvent();
		}

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	}
});

L.Draw.Rectangle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'rectangle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		}
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Rectangle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.rectangle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new L.Rectangle(new L.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setBounds(new L.LatLngBounds(this._startLatLng, latlng));
		}
	},

	_fireCreatedEvent: function () {
		var rectangle = new L.Rectangle(this._shape.getBounds(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, rectangle);
	}
});


L.Draw.Circle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'circle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		showRadius: true,
		metric: true // Whether to use the metric meaurement system or imperial
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Circle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.circle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new L.Circle(this._startLatLng, this._startLatLng.distanceTo(latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setRadius(this._startLatLng.distanceTo(latlng));
		}
	},

	_fireCreatedEvent: function () {
		var circle = new L.Circle(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, circle);
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng,
			showRadius = this.options.showRadius,
			useMetric = this.options.metric,
			radius;

		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._drawShape(latlng);

			// Get the new radius (rounded to 1 dp)
			radius = this._shape.getRadius().toFixed(1);

			this._tooltip.updateContent({
				text: this._endLabelText,
				subtext: showRadius ? 'Radius: ' + L.GeometryUtil.readableDistance(radius, useMetric) : ''
			});
		}
	}
});


L.Draw.Marker = L.Draw.Feature.extend({
	statics: {
		TYPE: 'marker'
	},

	options: {
		icon: new L.Icon.Default(),
		repeatMode: false,
		zIndexOffset: 2000 // This should be > than the highest z-index any markers
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Marker.TYPE;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);

		if (this._map) {
			this._tooltip.updateContent({ text: L.drawLocal.draw.handlers.marker.tooltip.start });

			// Same mouseMarker as in Draw.Polyline
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseMarker
				.on('click', this._onClick, this)
				.addTo(this._map);

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		if (this._map) {
			if (this._marker) {
				this._marker.off('click', this._onClick, this);
				this._map
					.off('click', this._onClick, this)
					.removeLayer(this._marker);
				delete this._marker;
			}

			this._mouseMarker.off('click', this._onClick, this);
			this._map.removeLayer(this._mouseMarker);
			delete this._mouseMarker;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		this._mouseMarker.setLatLng(latlng);

		if (!this._marker) {
			this._marker = new L.Marker(latlng, {
				icon: this.options.icon,
				zIndexOffset: this.options.zIndexOffset
			});
			// Bind to both marker and map to make sure we get the click event.
			this._marker.on('click', this._onClick, this);
			this._map
				.on('click', this._onClick, this)
				.addLayer(this._marker);
		}
		else {
			latlng = this._mouseMarker.getLatLng();
			this._marker.setLatLng(latlng);
		}
	},

	_onClick: function () {
		this._fireCreatedEvent();

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_fireCreatedEvent: function () {
		var marker = new L.Marker(this._marker.getLatLng(), { icon: this.options.icon });
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, marker);
	}
});


L.Edit = L.Edit || {};

/*
 * L.Edit.Poly is an editing handler for polylines and polygons.
 */

L.Edit.Poly = L.Handler.extend({
	options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		})
	},

	initialize: function (poly, options) {
		this._poly = poly;
		L.setOptions(this, options);
	},

	addHooks: function () {
		if (this._poly._map) {
			if (!this._markerGroup) {
				this._initMarkers();
			}
			this._poly._map.addLayer(this._markerGroup);
		}
	},

	removeHooks: function () {
		if (this._poly._map) {
			this._poly._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
			delete this._markers;
		}
	},

	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}
		this._markers = [];

		var latlngs = this._poly._latlngs,
			i, j, len, marker;

		// TODO refactor holes implementation in Polygon to support it here

		for (i = 0, len = latlngs.length; i < len; i++) {

			marker = this._createMarker(latlngs[i], i);
			marker.on('click', this._onMarkerClick, this);
			this._markers.push(marker);
		}

		var markerLeft, markerRight;

		for (i = 0, j = len - 1; i < len; j = i++) {
			if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
				continue;
			}

			markerLeft = this._markers[j];
			markerRight = this._markers[i];

			this._createMiddleMarker(markerLeft, markerRight);
			this._updatePrevNext(markerLeft, markerRight);
		}
	},

	_createMarker: function (latlng, index) {
		var marker = new L.Marker(latlng, {
			draggable: true,
			icon: this.options.icon
		});

		marker._origLatLng = latlng;
		marker._index = index;

		marker.on('drag', this._onMarkerDrag, this);
		marker.on('dragend', this._fireEdit, this);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_removeMarker: function (marker) {
		var i = marker._index;

		this._markerGroup.removeLayer(marker);
		this._markers.splice(i, 1);
		this._poly.spliceLatLngs(i, 1);
		this._updateIndexes(i, -1);

		marker
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._fireEdit, this)
			.off('click', this._onMarkerClick, this);
	},

	_fireEdit: function () {
		this._poly.edited = true;
		this._poly.fire('edit');
	},

	_onMarkerDrag: function (e) {
		var marker = e.target;

		L.extend(marker._origLatLng, marker._latlng);

		if (marker._middleLeft) {
			marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
		}
		if (marker._middleRight) {
			marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
		}

		this._poly.redraw();
	},

	_onMarkerClick: function (e) {
		var minPoints = L.Polygon && (this._poly instanceof L.Polygon) ? 4 : 3,
			marker = e.target;

		// If removing this point would create an invalid polyline/polygon don't remove
		if (this._poly._latlngs.length < minPoints) {
			return;
		}

		// remove the marker
		this._removeMarker(marker);

		// update prev/next links of adjacent markers
		this._updatePrevNext(marker._prev, marker._next);

		// remove ghost markers near the removed marker
		if (marker._middleLeft) {
			this._markerGroup.removeLayer(marker._middleLeft);
		}
		if (marker._middleRight) {
			this._markerGroup.removeLayer(marker._middleRight);
		}

		// create a ghost marker in place of the removed one
		if (marker._prev && marker._next) {
			this._createMiddleMarker(marker._prev, marker._next);

		} else if (!marker._prev) {
			marker._next._middleLeft = null;

		} else if (!marker._next) {
			marker._prev._middleRight = null;
		}

		this._fireEdit();
	},

	_updateIndexes: function (index, delta) {
		this._markerGroup.eachLayer(function (marker) {
			if (marker._index > index) {
				marker._index += delta;
			}
		});
	},

	_createMiddleMarker: function (marker1, marker2) {
		var latlng = this._getMiddleLatLng(marker1, marker2),
		    marker = this._createMarker(latlng),
		    onClick,
		    onDragStart,
		    onDragEnd;

		marker.setOpacity(0.6);

		marker1._middleRight = marker2._middleLeft = marker;

		onDragStart = function () {
			var i = marker2._index;

			marker._index = i;

			marker
			    .off('click', onClick, this)
			    .on('click', this._onMarkerClick, this);

			latlng.lat = marker.getLatLng().lat;
			latlng.lng = marker.getLatLng().lng;
			this._poly.spliceLatLngs(i, 0, latlng);
			this._markers.splice(i, 0, marker);

			marker.setOpacity(1);

			this._updateIndexes(i, 1);
			marker2._index++;
			this._updatePrevNext(marker1, marker);
			this._updatePrevNext(marker, marker2);

			this._poly.fire('editstart');
		};

		onDragEnd = function () {
			marker.off('dragstart', onDragStart, this);
			marker.off('dragend', onDragEnd, this);

			this._createMiddleMarker(marker1, marker);
			this._createMiddleMarker(marker, marker2);
		};

		onClick = function () {
			onDragStart.call(this);
			onDragEnd.call(this);
			this._fireEdit();
		};

		marker
		    .on('click', onClick, this)
		    .on('dragstart', onDragStart, this)
		    .on('dragend', onDragEnd, this);

		this._markerGroup.addLayer(marker);
	},

	_updatePrevNext: function (marker1, marker2) {
		if (marker1) {
			marker1._next = marker2;
		}
		if (marker2) {
			marker2._prev = marker1;
		}
	},

	_getMiddleLatLng: function (marker1, marker2) {
		var map = this._poly._map,
		    p1 = map.project(marker1.getLatLng()),
		    p2 = map.project(marker2.getLatLng());

		return map.unproject(p1._add(p2)._divideBy(2));
	}
});

L.Polyline.addInitHook(function () {

	// Check to see if handler has already been initialized. This is to support versions of Leaflet that still have L.Handler.PolyEdit
	if (this.editing) {
		return;
	}

	if (L.Edit.Poly) {
		this.editing = new L.Edit.Poly(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});


L.Edit = L.Edit || {};

L.Edit.SimpleShape = L.Handler.extend({
	options: {
		moveIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
		}),
		resizeIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
		})
	},

	initialize: function (shape, options) {
		this._shape = shape;
		L.Util.setOptions(this, options);
	},

	addHooks: function () {
		if (this._shape._map) {
			this._map = this._shape._map;

			if (!this._markerGroup) {
				this._initMarkers();
			}
			this._map.addLayer(this._markerGroup);
		}
	},

	removeHooks: function () {
		if (this._shape._map) {
			this._unbindMarker(this._moveMarker);

			for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
				this._unbindMarker(this._resizeMarkers[i]);
			}
			this._resizeMarkers = null;

			this._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
		}

		this._map = null;
	},

	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}

		// Create center marker
		this._createMoveMarker();

		// Create edge marker
		this._createResizeMarker();
	},

	_createMoveMarker: function () {
		// Children override
	},

	_createResizeMarker: function () {
		// Children override
	},

	_createMarker: function (latlng, icon) {
		var marker = new L.Marker(latlng, {
			draggable: true,
			icon: icon,
			zIndexOffset: 10
		});

		this._bindMarker(marker);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_bindMarker: function (marker) {
		marker
			.on('dragstart', this._onMarkerDragStart, this)
			.on('drag', this._onMarkerDrag, this)
			.on('dragend', this._onMarkerDragEnd, this);
	},

	_unbindMarker: function (marker) {
		marker
			.off('dragstart', this._onMarkerDragStart, this)
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._onMarkerDragEnd, this);
	},

	_onMarkerDragStart: function (e) {
		var marker = e.target;
		marker.setOpacity(0);

		this._shape.fire('editstart');
	},

	_fireEdit: function () {
		this._shape.edited = true;
		this._shape.fire('edit');
	},

	_onMarkerDrag: function (e) {
		var marker = e.target,
			latlng = marker.getLatLng();

		if (marker === this._moveMarker) {
			this._move(latlng);
		} else {
			this._resize(latlng);
		}

		this._shape.redraw();
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target;
		marker.setOpacity(1);

		this._fireEdit();
	},

	_move: function () {
		// Children override
	},

	_resize: function () {
		// Children override
	}
});


L.Edit = L.Edit || {};

L.Edit.Rectangle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var bounds = this._shape.getBounds(),
			center = bounds.getCenter();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var corners = this._getCorners();

		this._resizeMarkers = [];

		for (var i = 0, l = corners.length; i < l; i++) {
			this._resizeMarkers.push(this._createMarker(corners[i], this.options.resizeIcon));
			// Monkey in the corner index as we will need to know this for dragging
			this._resizeMarkers[i]._cornerIndex = i;
		}
	},

	_onMarkerDragStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		// Save a reference to the opposite point
		var corners = this._getCorners(),
			marker = e.target,
			currentCornerIndex = marker._cornerIndex;

		this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];

		this._toggleCornerMarkers(0, currentCornerIndex);
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target,
			bounds, center;

		// Reset move marker position to the center
		if (marker === this._moveMarker) {
			bounds = this._shape.getBounds();
			center = bounds.getCenter();

			marker.setLatLng(center);
		}

		this._toggleCornerMarkers(1);

		this._repositionCornerMarkers();

		L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
	},

	_move: function (newCenter) {
		var latlngs = this._shape.getLatLngs(),
			bounds = this._shape.getBounds(),
			center = bounds.getCenter(),
			offset, newLatLngs = [];

		// Offset the latlngs to the new center
		for (var i = 0, l = latlngs.length; i < l; i++) {
			offset = [latlngs[i].lat - center.lat, latlngs[i].lng - center.lng];
			newLatLngs.push([newCenter.lat + offset[0], newCenter.lng + offset[1]]);
		}

		this._shape.setLatLngs(newLatLngs);

		// Reposition the resize markers
		this._repositionCornerMarkers();
	},

	_resize: function (latlng) {
		var bounds;

		// Update the shape based on the current position of this corner and the opposite point
		this._shape.setBounds(L.latLngBounds(latlng, this._oppositeCorner));

		// Reposition the move marker
		bounds = this._shape.getBounds();
		this._moveMarker.setLatLng(bounds.getCenter());
	},

	_getCorners: function () {
		var bounds = this._shape.getBounds(),
			nw = bounds.getNorthWest(),
			ne = bounds.getNorthEast(),
			se = bounds.getSouthEast(),
			sw = bounds.getSouthWest();

		return [nw, ne, se, sw];
	},

	_toggleCornerMarkers: function (opacity) {
		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setOpacity(opacity);
		}
	},

	_repositionCornerMarkers: function () {
		var corners = this._getCorners();

		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setLatLng(corners[i]);
		}
	}
});

L.Rectangle.addInitHook(function () {
	if (L.Edit.Rectangle) {
		this.editing = new L.Edit.Rectangle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});


L.Edit = L.Edit || {};

L.Edit.Circle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var center = this._shape.getLatLng();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var center = this._shape.getLatLng(),
			resizemarkerPoint = this._getResizeMarkerPoint(center);

		this._resizeMarkers = [];
		this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
	},

	_getResizeMarkerPoint: function (latlng) {
		// From L.shape.getBounds()
		var delta = this._shape._radius * Math.cos(Math.PI / 4),
			point = this._map.project(latlng);
		return this._map.unproject([point.x + delta, point.y - delta]);
	},

	_move: function (latlng) {
		var resizemarkerPoint = this._getResizeMarkerPoint(latlng);

		// Move the resize marker
		this._resizeMarkers[0].setLatLng(resizemarkerPoint);

		// Move the circle
		this._shape.setLatLng(latlng);
	},

	_resize: function (latlng) {
		var moveLatLng = this._moveMarker.getLatLng(),
			radius = moveLatLng.distanceTo(latlng);

		this._shape.setRadius(radius);
	}
});

L.Circle.addInitHook(function () {
	if (L.Edit.Circle) {
		this.editing = new L.Edit.Circle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});

/*
 * L.LatLngUtil contains different utility functions for LatLngs.
 */

L.LatLngUtil = {
	// Clones a LatLngs[], returns [][]
	cloneLatLngs: function (latlngs) {
		var clone = [];
		for (var i = 0, l = latlngs.length; i < l; i++) {
			clone.push(this.cloneLatLng(latlngs[i]));
		}
		return clone;
	},

	cloneLatLng: function (latlng) {
		return L.latLng(latlng.lat, latlng.lng);
	}
};

L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
	// Ported from the OpenLayers implementation. See https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Geometry/LinearRing.js#L270
	geodesicArea: function (latLngs) {
		var pointsCount = latLngs.length,
			area = 0.0,
			d2r = L.LatLng.DEG_TO_RAD,
			p1, p2;

		if (pointsCount > 2) {
			for (var i = 0; i < pointsCount; i++) {
				p1 = latLngs[i];
				p2 = latLngs[(i + 1) % pointsCount];
				area += ((p2.lng - p1.lng) * d2r) *
						(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
			}
			area = area * 6378137.0 * 6378137.0 / 2.0;
		}

		return Math.abs(area);
	},

	readableArea: function (area, isMetric) {
		var areaStr;

		if (isMetric) {
			if (area >= 10000) {
				areaStr = (area * 0.0001).toFixed(2) + ' ha';
			} else {
				areaStr = area.toFixed(2) + ' m&sup2;';
			}
		} else {
			area *= 0.836127; // Square yards in 1 meter

			if (area >= 3097600) { //3097600 square yards in 1 square mile
				areaStr = (area / 3097600).toFixed(2) + ' mi&sup2;';
			} else if (area >= 4840) {//48040 square yards in 1 acre
				areaStr = (area / 4840).toFixed(2) + ' acres';
			} else {
				areaStr = Math.ceil(area) + ' yd&sup2;';
			}
		}

		return areaStr;
	},

	readableDistance: function (distance, isMetric) {
		var distanceStr;

		if (isMetric) {
			// show metres when distance is < 1km, then show km
			if (distance > 1000) {
				distanceStr = (distance  / 1000).toFixed(2) + ' km';
			} else {
				distanceStr = Math.ceil(distance) + ' m';
			}
		} else {
			distance *= 1.09361;

			if (distance > 1760) {
				distanceStr = (distance / 1760).toFixed(2) + ' miles';
			} else {
				distanceStr = Math.ceil(distance) + ' yd';
			}
		}

		return distanceStr;
	}
});

L.Util.extend(L.LineUtil, {
	// Checks to see if two line segments intersect. Does not handle degenerate cases.
	// http://compgeom.cs.uiuc.edu/~jeffe/teaching/373/notes/x06-sweepline.pdf
	segmentsIntersect: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2, /*Point*/ p3) {
		return	this._checkCounterclockwise(p, p2, p3) !==
				this._checkCounterclockwise(p1, p2, p3) &&
				this._checkCounterclockwise(p, p1, p2) !==
				this._checkCounterclockwise(p, p1, p3);
	},

	// check to see if points are in counterclockwise order
	_checkCounterclockwise: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return (p2.y - p.y) * (p1.x - p.x) > (p1.y - p.y) * (p2.x - p.x);
	}
});

L.Polyline.include({
	// Check to see if this polyline has any linesegments that intersect.
	// NOTE: does not support detecting intersection for degenerate cases.
	intersects: function () {
		var points = this._originalPoints,
			len = points ? points.length : 0,
			i, p, p1;

		if (this._tooFewPointsForIntersection()) {
			return false;
		}

		for (i = len - 1; i >= 3; i--) {
			p = points[i - 1];
			p1 = points[i];


			if (this._lineSegmentsIntersectsRange(p, p1, i - 2)) {
				return true;
			}
		}

		return false;
	},

	// Check for intersection if new latlng was added to this polyline.
	// NOTE: does not support detecting intersection for degenerate cases.
	newLatLngIntersects: function (latlng, skipFirst) {
		// Cannot check a polyline for intersecting lats/lngs when not added to the map
		if (!this._map) {
			return false;
		}

		return this.newPointIntersects(this._map.latLngToLayerPoint(latlng), skipFirst);
	},

	// Check for intersection if new point was added to this polyline.
	// newPoint must be a layer point.
	// NOTE: does not support detecting intersection for degenerate cases.
	newPointIntersects: function (newPoint, skipFirst) {
		var points = this._originalPoints,
			len = points ? points.length : 0,
			lastPoint = points ? points[len - 1] : null,
			// The previous previous line segment. Previous line segment doesn't need testing.
			maxIndex = len - 2;

		if (this._tooFewPointsForIntersection(1)) {
			return false;
		}

		return this._lineSegmentsIntersectsRange(lastPoint, newPoint, maxIndex, skipFirst ? 1 : 0);
	},

	// Polylines with 2 sides can only intersect in cases where points are collinear (we don't support detecting these).
	// Cannot have intersection when < 3 line segments (< 4 points)
	_tooFewPointsForIntersection: function (extraPoints) {
		var points = this._originalPoints,
			len = points ? points.length : 0;
		// Increment length by extraPoints if present
		len += extraPoints || 0;

		return !this._originalPoints || len <= 3;
	},

	// Checks a line segment intersections with any line segments before its predecessor.
	// Don't need to check the predecessor as will never intersect.
	_lineSegmentsIntersectsRange: function (p, p1, maxIndex, minIndex) {
		var points = this._originalPoints,
			p2, p3;

		minIndex = minIndex || 0;

		// Check all previous line segments (beside the immediately previous) for intersections
		for (var j = maxIndex; j > minIndex; j--) {
			p2 = points[j - 1];
			p3 = points[j];

			if (L.LineUtil.segmentsIntersect(p, p1, p2, p3)) {
				return true;
			}
		}

		return false;
	}
});


L.Polygon.include({
	// Checks a polygon for any intersecting line segments. Ignores holes.
	intersects: function () {
		var polylineIntersects,
			points = this._originalPoints,
			len, firstPoint, lastPoint, maxIndex;

		if (this._tooFewPointsForIntersection()) {
			return false;
		}

		polylineIntersects = L.Polyline.prototype.intersects.call(this);

		// If already found an intersection don't need to check for any more.
		if (polylineIntersects) {
			return true;
		}

		len = points.length;
		firstPoint = points[0];
		lastPoint = points[len - 1];
		maxIndex = len - 2;

		// Check the line segment between last and first point. Don't need to check the first line segment (minIndex = 1)
		return this._lineSegmentsIntersectsRange(lastPoint, firstPoint, maxIndex, 1);
	}
});

L.Control.Draw = L.Control.extend({

	options: {
		position: 'topleft',
		draw: {},
		edit: false
	},

	initialize: function (options) {
		if (L.version < '0.7') {
			throw new Error('Leaflet.draw 0.2.3+ requires Leaflet 0.7.0+. Download latest from https://github.com/Leaflet/Leaflet/');
		}

		L.Control.prototype.initialize.call(this, options);

		var id, toolbar;

		this._toolbars = {};

		// Initialize toolbars
		if (L.DrawToolbar && this.options.draw) {
			toolbar = new L.DrawToolbar(this.options.draw);
			id = L.stamp(toolbar);
			this._toolbars[id] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[id].on('enable', this._toolbarEnabled, this);
		}

		if (L.EditToolbar && this.options.edit) {
			toolbar = new L.EditToolbar(this.options.edit);
			id = L.stamp(toolbar);
			this._toolbars[id] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[id].on('enable', this._toolbarEnabled, this);
		}
	},

	onAdd: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw'),
			addedTopClass = false,
			topClassName = 'leaflet-draw-toolbar-top',
			toolbarContainer;

		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				toolbarContainer = this._toolbars[toolbarId].addToolbar(map);

				if (toolbarContainer) {
					// Add class to the first toolbar to remove the margin
					if (!addedTopClass) {
						if (!L.DomUtil.hasClass(toolbarContainer, topClassName)) {
							L.DomUtil.addClass(toolbarContainer.childNodes[0], topClassName);
						}
						addedTopClass = true;
					}

					container.appendChild(toolbarContainer);
				}
			}
		}

		return container;
	},

	onRemove: function () {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				this._toolbars[toolbarId].removeToolbar();
			}
		}
	},

	setDrawingOptions: function (options) {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars[toolbarId] instanceof L.DrawToolbar) {
				this._toolbars[toolbarId].setOptions(options);
			}
		}
	},

	_toolbarEnabled: function (e) {
		var id = '' + L.stamp(e.target);

		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId) && toolbarId !== id) {
				this._toolbars[toolbarId].disable();
			}
		}
	}
});

L.Map.mergeOptions({
	drawControlTooltips: true,
	drawControl: false
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});


L.Toolbar = L.Class.extend({
	includes: [L.Mixin.Events],

	initialize: function (options) {
		L.setOptions(this, options);

		this._modes = {};
		this._actionButtons = [];
		this._activeMode = null;
	},

	enabled: function () {
		return this._activeMode !== null;
	},

	disable: function () {
		if (!this.enabled()) { return; }

		this._activeMode.handler.disable();
	},

	addToolbar: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw-section'),
			buttonIndex = 0,
			buttonClassPrefix = this._toolbarClass || '',
			modeHandlers = this.getModeHandlers(map),
			i;

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
		this._map = map;

		for (i = 0; i < modeHandlers.length; i++) {
			if (modeHandlers[i].enabled) {
				this._initModeHandler(
					modeHandlers[i].handler,
					this._toolbarContainer,
					buttonIndex++,
					buttonClassPrefix,
					modeHandlers[i].title
				);
			}
		}

		// if no buttons were added, do not add the toolbar
		if (!buttonIndex) {
			return;
		}

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create empty actions part of the toolbar
		this._actionsContainer = L.DomUtil.create('ul', 'leaflet-draw-actions');

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		return container;
	},

	removeToolbar: function () {
		// Dispose each handler
		for (var handlerId in this._modes) {
			if (this._modes.hasOwnProperty(handlerId)) {
				// Unbind handler button
				this._disposeButton(
					this._modes[handlerId].button,
					this._modes[handlerId].handler.enable,
					this._modes[handlerId].handler
				);

				// Make sure is disabled
				this._modes[handlerId].handler.disable();

				// Unbind handler
				this._modes[handlerId].handler
					.off('enabled', this._handlerActivated, this)
					.off('disabled', this._handlerDeactivated, this);
			}
		}
		this._modes = {};

		// Dispose the actions toolbar
		for (var i = 0, l = this._actionButtons.length; i < l; i++) {
			this._disposeButton(
				this._actionButtons[i].button,
				this._actionButtons[i].callback,
				this
			);
		}
		this._actionButtons = [];
		this._actionsContainer = null;
	},

	_initModeHandler: function (handler, container, buttonIndex, classNamePredix, buttonTitle) {
		var type = handler.type;

		this._modes[type] = {};

		this._modes[type].handler = handler;

		this._modes[type].button = this._createButton({
			title: buttonTitle,
			className: classNamePredix + '-' + type,
			container: container,
			callback: this._modes[type].handler.enable,
			context: this._modes[type].handler
		});

		this._modes[type].buttonIndex = buttonIndex;

		this._modes[type].handler
			.on('enabled', this._handlerActivated, this)
			.on('disabled', this._handlerDeactivated, this);
	},

	_createButton: function (options) {
		var link = L.DomUtil.create('a', options.className || '', options.container);
		link.href = '#';

		if (options.text) {
			link.innerHTML = options.text;
		}

		if (options.title) {
			link.title = options.title;
		}

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'mousedown', L.DomEvent.stopPropagation)
			.on(link, 'dblclick', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', options.callback, options.context);

		return link;
	},

	_disposeButton: function (button, callback) {
		L.DomEvent
			.off(button, 'click', L.DomEvent.stopPropagation)
			.off(button, 'mousedown', L.DomEvent.stopPropagation)
			.off(button, 'dblclick', L.DomEvent.stopPropagation)
			.off(button, 'click', L.DomEvent.preventDefault)
			.off(button, 'click', callback);
	},

	_handlerActivated: function (e) {
		// Disable active mode (if present)
		this.disable();

		// Cache new active feature
		this._activeMode = this._modes[e.handler];

		L.DomUtil.addClass(this._activeMode.button, 'leaflet-draw-toolbar-button-enabled');

		this._showActionsToolbar();

		this.fire('enable');
	},

	_handlerDeactivated: function () {
		this._hideActionsToolbar();

		L.DomUtil.removeClass(this._activeMode.button, 'leaflet-draw-toolbar-button-enabled');

		this._activeMode = null;

		this.fire('disable');
	},

	_createActions: function (handler) {
		var container = this._actionsContainer,
			buttons = this.getActions(handler),
			l = buttons.length,
			li, di, dl, button;

		// Dispose the actions toolbar (todo: dispose only not used buttons)
		for (di = 0, dl = this._actionButtons.length; di < dl; di++) {
			this._disposeButton(this._actionButtons[di].button, this._actionButtons[di].callback);
		}
		this._actionButtons = [];

		// Remove all old buttons
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		for (var i = 0; i < l; i++) {
			if ('enabled' in buttons[i] && !buttons[i].enabled) {
				continue;
			}

			li = L.DomUtil.create('li', '', container);

			button = this._createButton({
				title: buttons[i].title,
				text: buttons[i].text,
				container: li,
				callback: buttons[i].callback,
				context: buttons[i].context
			});

			this._actionButtons.push({
				button: button,
				callback: buttons[i].callback
			});
		}
	},

	_showActionsToolbar: function () {
		var buttonIndex = this._activeMode.buttonIndex,
			lastButtonIndex = this._lastButtonIndex,
			toolbarPosition = this._activeMode.button.offsetTop - 1;

		// Recreate action buttons on every click
		this._createActions(this._activeMode.handler);

		// Correctly position the cancel button
		this._actionsContainer.style.top = toolbarPosition + 'px';

		if (buttonIndex === 0) {
			L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
			L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-top');
		}

		if (buttonIndex === lastButtonIndex) {
			L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
			L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-bottom');
		}

		this._actionsContainer.style.display = 'block';
	},

	_hideActionsToolbar: function () {
		this._actionsContainer.style.display = 'none';

		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
		L.DomUtil.removeClass(this._actionsContainer, 'leaflet-draw-actions-top');
		L.DomUtil.removeClass(this._actionsContainer, 'leaflet-draw-actions-bottom');
	}
});


L.Tooltip = L.Class.extend({
	initialize: function (map) {
		this._map = map;
		this._popupPane = map._panes.popupPane;

		this._container = map.options.drawControlTooltips ? L.DomUtil.create('div', 'leaflet-draw-tooltip', this._popupPane) : null;
		this._singleLineLabel = false;
	},

	dispose: function () {
		if (this._container) {
			this._popupPane.removeChild(this._container);
			this._container = null;
		}
	},

	updateContent: function (labelText) {
		if (!this._container) {
			return this;
		}
		labelText.subtext = labelText.subtext || '';

		// update the vertical position (only if changed)
		if (labelText.subtext.length === 0 && !this._singleLineLabel) {
			L.DomUtil.addClass(this._container, 'leaflet-draw-tooltip-single');
			this._singleLineLabel = true;
		}
		else if (labelText.subtext.length > 0 && this._singleLineLabel) {
			L.DomUtil.removeClass(this._container, 'leaflet-draw-tooltip-single');
			this._singleLineLabel = false;
		}

		this._container.innerHTML =
			(labelText.subtext.length > 0 ? '<span class="leaflet-draw-tooltip-subtext">' + labelText.subtext + '</span>' + '<br />' : '') +
			'<span>' + labelText.text + '</span>';

		return this;
	},

	updatePosition: function (latlng) {
		var pos = this._map.latLngToLayerPoint(latlng),
			tooltipContainer = this._container;

		if (this._container) {
			tooltipContainer.style.visibility = 'inherit';
			L.DomUtil.setPosition(tooltipContainer, pos);
		}

		return this;
	},

	showAsError: function () {
		if (this._container) {
			L.DomUtil.addClass(this._container, 'leaflet-error-draw-tooltip');
		}
		return this;
	},

	removeError: function () {
		if (this._container) {
			L.DomUtil.removeClass(this._container, 'leaflet-error-draw-tooltip');
		}
		return this;
	}
});

L.DrawToolbar = L.Toolbar.extend({

	options: {
		polyline: {},
		polygon: {},
		rectangle: {},
		circle: {},
		marker: {}
	},

	initialize: function (options) {
		// Ensure that the options are merged correctly since L.extend is only shallow
		for (var type in this.options) {
			if (this.options.hasOwnProperty(type)) {
				if (options[type]) {
					options[type] = L.extend({}, this.options[type], options[type]);
				}
			}
		}

		this._toolbarClass = 'leaflet-draw-draw';
		L.Toolbar.prototype.initialize.call(this, options);
	},

	getModeHandlers: function (map) {
		return [
			{
				enabled: this.options.polyline,
				handler: new L.Draw.Polyline(map, this.options.polyline),
				title: L.drawLocal.draw.toolbar.buttons.polyline
			},
			{
				enabled: this.options.polygon,
				handler: new L.Draw.Polygon(map, this.options.polygon),
				title: L.drawLocal.draw.toolbar.buttons.polygon
			},
			{
				enabled: this.options.rectangle,
				handler: new L.Draw.Rectangle(map, this.options.rectangle),
				title: L.drawLocal.draw.toolbar.buttons.rectangle
			},
			{
				enabled: this.options.circle,
				handler: new L.Draw.Circle(map, this.options.circle),
				title: L.drawLocal.draw.toolbar.buttons.circle
			},
			{
				enabled: this.options.marker,
				handler: new L.Draw.Marker(map, this.options.marker),
				title: L.drawLocal.draw.toolbar.buttons.marker
			}
		];
	},

	// Get the actions part of the toolbar
	getActions: function (handler) {
		return [
			{
				enabled: handler.deleteLastVertex,
				title: L.drawLocal.draw.toolbar.undo.title,
				text: L.drawLocal.draw.toolbar.undo.text,
				callback: handler.deleteLastVertex,
				context: handler
			},
			{
				title: L.drawLocal.draw.toolbar.actions.title,
				text: L.drawLocal.draw.toolbar.actions.text,
				callback: this.disable,
				context: this
			}
		];
	},

	setOptions: function (options) {
		L.setOptions(this, options);

		for (var type in this._modes) {
			if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
				this._modes[type].handler.setOptions(options[type]);
			}
		}
	}
});


/*L.Map.mergeOptions({
	editControl: true
});*/

L.EditToolbar = L.Toolbar.extend({
	options: {
		edit: {
			selectedPathOptions: {
				color: '#fe57a1', /* Hot pink all the things! */
				opacity: 0.6,
				dashArray: '10, 10',

				fill: true,
				fillColor: '#fe57a1',
				fillOpacity: 0.1
			}
		},
		remove: {},
		featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	initialize: function (options) {
		// Need to set this manually since null is an acceptable value here
		if (options.edit) {
			if (typeof options.edit.selectedPathOptions === 'undefined') {
				options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
			}
			options.edit = L.extend({}, this.options.edit, options.edit);
		}

		if (options.remove) {
			options.remove = L.extend({}, this.options.remove, options.remove);
		}

		this._toolbarClass = 'leaflet-draw-edit';
		L.Toolbar.prototype.initialize.call(this, options);

		this._selectedFeatureCount = 0;
	},

	getModeHandlers: function (map) {
		var featureGroup = this.options.featureGroup;
		return [
			{
				enabled: this.options.edit,
				handler: new L.EditToolbar.Edit(map, {
					featureGroup: featureGroup,
					selectedPathOptions: this.options.edit.selectedPathOptions
				}),
				title: L.drawLocal.edit.toolbar.buttons.edit
			},
			{
				enabled: this.options.remove,
				handler: new L.EditToolbar.Delete(map, {
					featureGroup: featureGroup
				}),
				title: L.drawLocal.edit.toolbar.buttons.remove
			}
		];
	},

	getActions: function () {
		return [
			{
				title: L.drawLocal.edit.toolbar.actions.save.title,
				text: L.drawLocal.edit.toolbar.actions.save.text,
				callback: this._save,
				context: this
			},
			{
				title: L.drawLocal.edit.toolbar.actions.cancel.title,
				text: L.drawLocal.edit.toolbar.actions.cancel.text,
				callback: this.disable,
				context: this
			}
		];
	},

	addToolbar: function (map) {
		var container = L.Toolbar.prototype.addToolbar.call(this, map);

		this._checkDisabled();

		this.options.featureGroup.on('layeradd layerremove', this._checkDisabled, this);

		return container;
	},

	removeToolbar: function () {
		this.options.featureGroup.off('layeradd layerremove', this._checkDisabled, this);

		L.Toolbar.prototype.removeToolbar.call(this);
	},

	disable: function () {
		if (!this.enabled()) { return; }

		this._activeMode.handler.revertLayers();

		L.Toolbar.prototype.disable.call(this);
	},

	_save: function () {
		this._activeMode.handler.save();
		this._activeMode.handler.disable();
	},

	_checkDisabled: function () {
		var featureGroup = this.options.featureGroup,
			hasLayers = featureGroup.getLayers().length !== 0,
			button;

		if (this.options.edit) {
			button = this._modes[L.EditToolbar.Edit.TYPE].button;

			if (hasLayers) {
				L.DomUtil.removeClass(button, 'leaflet-disabled');
			} else {
				L.DomUtil.addClass(button, 'leaflet-disabled');
			}

			button.setAttribute(
				'title',
				hasLayers ?
				L.drawLocal.edit.toolbar.buttons.edit
				: L.drawLocal.edit.toolbar.buttons.editDisabled
			);
		}

		if (this.options.remove) {
			button = this._modes[L.EditToolbar.Delete.TYPE].button;

			if (hasLayers) {
				L.DomUtil.removeClass(button, 'leaflet-disabled');
			} else {
				L.DomUtil.addClass(button, 'leaflet-disabled');
			}

			button.setAttribute(
				'title',
				hasLayers ?
				L.drawLocal.edit.toolbar.buttons.remove
				: L.drawLocal.edit.toolbar.buttons.removeDisabled
			);
		}
	}
});


L.EditToolbar.Edit = L.Handler.extend({
	statics: {
		TYPE: 'edit'
	},

	includes: L.Mixin.Events,

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		// Set options to the default unless already set
		this._selectedPathOptions = options.selectedPathOptions;

		// Store the selectable layer group for ease of access
		this._featureGroup = options.featureGroup;

		if (!(this._featureGroup instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		this._uneditedLayerProps = {};

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Edit.TYPE;
	},

	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', {handler: this.type});
			//this disable other handlers

		this._map.fire('draw:editstart', { handler: this.type });
			//allow drawLayer to be updated before beginning edition.

		L.Handler.prototype.enable.call(this);
		this._featureGroup
			.on('layeradd', this._enableLayerEdit, this)
			.on('layerremove', this._disableLayerEdit, this);
	},

	disable: function () {
		if (!this._enabled) { return; }
		this._featureGroup
			.off('layeradd', this._enableLayerEdit, this)
			.off('layerremove', this._disableLayerEdit, this);
		L.Handler.prototype.disable.call(this);
		this._map.fire('draw:editstop', { handler: this.type });
		this.fire('disabled', {handler: this.type});
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._featureGroup.eachLayer(this._enableLayerEdit, this);

			this._tooltip = new L.Tooltip(this._map);
			this._tooltip.updateContent({
				text: L.drawLocal.edit.handlers.edit.tooltip.text,
				subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
			});

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			// Clean up selected layers.
			this._featureGroup.eachLayer(this._disableLayerEdit, this);

			// Clear the backups of the original layers
			this._uneditedLayerProps = {};

			this._tooltip.dispose();
			this._tooltip = null;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	revertLayers: function () {
		this._featureGroup.eachLayer(function (layer) {
			this._revertLayer(layer);
		}, this);
	},

	save: function () {
		var editedLayers = new L.LayerGroup();
		this._featureGroup.eachLayer(function (layer) {
			if (layer.edited) {
				editedLayers.addLayer(layer);
				layer.edited = false;
			}
		});
		this._map.fire('draw:edited', {layers: editedLayers});
	},

	_backupLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (!this._uneditedLayerProps[id]) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				this._uneditedLayerProps[id] = {
					latlngs: L.LatLngUtil.cloneLatLngs(layer.getLatLngs())
				};
			} else if (layer instanceof L.Circle) {
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng()),
					radius: layer.getRadius()
				};
			} else if (layer instanceof L.Marker) { // Marker
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng())
				};
			}
		}
	},

	_revertLayer: function (layer) {
		var id = L.Util.stamp(layer);
		layer.edited = false;
		if (this._uneditedLayerProps.hasOwnProperty(id)) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				layer.setLatLngs(this._uneditedLayerProps[id].latlngs);
			} else if (layer instanceof L.Circle) {
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
				layer.setRadius(this._uneditedLayerProps[id].radius);
			} else if (layer instanceof L.Marker) { // Marker
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
			}
		}
	},

	_toggleMarkerHighlight: function (marker) {
		if (!marker._icon) {
			return;
		}
		// This is quite naughty, but I don't see another way of doing it. (short of setting a new icon)
		var icon = marker._icon;

		icon.style.display = 'none';

		if (L.DomUtil.hasClass(icon, 'leaflet-edit-marker-selected')) {
			L.DomUtil.removeClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, -4);

		} else {
			L.DomUtil.addClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, 4);
		}

		icon.style.display = '';
	},

	_offsetMarker: function (icon, offset) {
		var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset,
			iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;

		icon.style.marginTop = iconMarginTop + 'px';
		icon.style.marginLeft = iconMarginLeft + 'px';
	},

	_enableLayerEdit: function (e) {
		var layer = e.layer || e.target || e,
			isMarker = layer instanceof L.Marker,
			pathOptions;

		// Don't do anything if this layer is a marker but doesn't have an icon. Markers
		// should usually have icons. If using Leaflet.draw with Leafler.markercluster there
		// is a chance that a marker doesn't.
		if (isMarker && !layer._icon) {
			return;
		}

		// Back up this layer (if haven't before)
		this._backupLayer(layer);

		// Update layer style so appears editable
		if (this._selectedPathOptions) {
			pathOptions = L.Util.extend({}, this._selectedPathOptions);

			if (isMarker) {
				this._toggleMarkerHighlight(layer);
			} else {
				layer.options.previousOptions = L.Util.extend({ dashArray: null }, layer.options);

				// Make sure that Polylines are not filled
				if (!(layer instanceof L.Circle) && !(layer instanceof L.Polygon) && !(layer instanceof L.Rectangle)) {
					pathOptions.fill = false;
				}

				layer.setStyle(pathOptions);
			}
		}

		if (isMarker) {
			layer.dragging.enable();
			layer.on('dragend', this._onMarkerDragEnd);
		} else {
			layer.editing.enable();
		}
	},

	_disableLayerEdit: function (e) {
		var layer = e.layer || e.target || e;
		layer.edited = false;

		// Reset layer styles to that of before select
		if (this._selectedPathOptions) {
			if (layer instanceof L.Marker) {
				this._toggleMarkerHighlight(layer);
			} else {
				// reset the layer style to what is was before being selected
				layer.setStyle(layer.options.previousOptions);
				// remove the cached options for the layer object
				delete layer.options.previousOptions;
			}
		}

		if (layer instanceof L.Marker) {
			layer.dragging.disable();
			layer.off('dragend', this._onMarkerDragEnd, this);
		} else {
			layer.editing.disable();
		}
	},

	_onMarkerDragEnd: function (e) {
		var layer = e.target;
		layer.edited = true;
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_hasAvailableLayers: function () {
		return this._featureGroup.getLayers().length !== 0;
	}
});


L.EditToolbar.Delete = L.Handler.extend({
	statics: {
		TYPE: 'remove' // not delete as delete is reserved in js
	},

	includes: L.Mixin.Events,

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		L.Util.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._deletableLayers = this.options.featureGroup;

		if (!(this._deletableLayers instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Delete.TYPE;
	},

	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', { handler: this.type});

		this._map.fire('draw:deletestart', { handler: this.type });

		L.Handler.prototype.enable.call(this);

		this._deletableLayers
			.on('layeradd', this._enableLayerDelete, this)
			.on('layerremove', this._disableLayerDelete, this);
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._deletableLayers
			.off('layeradd', this._enableLayerDelete, this)
			.off('layerremove', this._disableLayerDelete, this);

		L.Handler.prototype.disable.call(this);

		this._map.fire('draw:deletestop', { handler: this.type });

		this.fire('disabled', { handler: this.type});
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._deletableLayers.eachLayer(this._enableLayerDelete, this);
			this._deletedLayers = new L.layerGroup();

			this._tooltip = new L.Tooltip(this._map);
			this._tooltip.updateContent({ text: L.drawLocal.edit.handlers.remove.tooltip.text });

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			this._deletableLayers.eachLayer(this._disableLayerDelete, this);
			this._deletedLayers = null;

			this._tooltip.dispose();
			this._tooltip = null;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	revertLayers: function () {
		// Iterate of the deleted layers and add them back into the featureGroup
		this._deletedLayers.eachLayer(function (layer) {
			this._deletableLayers.addLayer(layer);
		}, this);
	},

	save: function () {
		this._map.fire('draw:deleted', { layers: this._deletedLayers });
	},

	_enableLayerDelete: function (e) {
		var layer = e.layer || e.target || e;

		layer.on('click', this._removeLayer, this);
	},

	_disableLayerDelete: function (e) {
		var layer = e.layer || e.target || e;

		layer.off('click', this._removeLayer, this);

		// Remove from the deleted layers so we can't accidently revert if the user presses cancel
		this._deletedLayers.removeLayer(layer);
	},

	_removeLayer: function (e) {
		var layer = e.layer || e.target || e;

		this._deletableLayers.removeLayer(layer);

		this._deletedLayers.addLayer(layer);
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_hasAvailableLayers: function () {
		return this._deletableLayers.getLayers().length !== 0;
	}
});


}(window, document));// CodeMirror version 3.14
//
// CodeMirror is the only global var we claim
window.CodeMirror = (function() {
  "use strict";

  // BROWSER SNIFFING

  // Crude, but necessary to handle a number of hard-to-feature-detect
  // bugs and behavior differences.
  var gecko = /gecko\/\d/i.test(navigator.userAgent);
  var ie = /MSIE \d/.test(navigator.userAgent);
  var ie_lt8 = ie && (document.documentMode == null || document.documentMode < 8);
  var ie_lt9 = ie && (document.documentMode == null || document.documentMode < 9);
  var webkit = /WebKit\//.test(navigator.userAgent);
  var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(navigator.userAgent);
  var chrome = /Chrome\//.test(navigator.userAgent);
  var opera = /Opera\//.test(navigator.userAgent);
  var safari = /Apple Computer/.test(navigator.vendor);
  var khtml = /KHTML\//.test(navigator.userAgent);
  var mac_geLion = /Mac OS X 1\d\D([7-9]|\d\d)\D/.test(navigator.userAgent);
  var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(navigator.userAgent);
  var phantom = /PhantomJS/.test(navigator.userAgent);

  var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
  // This is woefully incomplete. Suggestions for alternative methods welcome.
  var mobile = ios || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(navigator.userAgent);
  var mac = ios || /Mac/.test(navigator.platform);
  var windows = /windows/i.test(navigator.platform);

  var opera_version = opera && navigator.userAgent.match(/Version\/(\d*\.\d*)/);
  if (opera_version) opera_version = Number(opera_version[1]);
  // Some browsers use the wrong event properties to signal cmd/ctrl on OS X
  var flipCtrlCmd = mac && (qtwebkit || opera && (opera_version == null || opera_version < 12.11));
  var captureMiddleClick = gecko || (ie && !ie_lt9);

  // Optimize some code when these features are not used
  var sawReadOnlySpans = false, sawCollapsedSpans = false;

  // CONSTRUCTOR

  function CodeMirror(place, options) {
    if (!(this instanceof CodeMirror)) return new CodeMirror(place, options);

    this.options = options = options || {};
    // Determine effective options based on given values and defaults.
    for (var opt in defaults) if (!options.hasOwnProperty(opt) && defaults.hasOwnProperty(opt))
      options[opt] = defaults[opt];
    setGuttersForLineNumbers(options);

    var docStart = typeof options.value == "string" ? 0 : options.value.first;
    var display = this.display = makeDisplay(place, docStart);
    display.wrapper.CodeMirror = this;
    updateGutters(this);
    if (options.autofocus && !mobile) focusInput(this);

    this.state = {keyMaps: [],
                  overlays: [],
                  modeGen: 0,
                  overwrite: false, focused: false,
                  suppressEdits: false, pasteIncoming: false,
                  draggingText: false,
                  highlight: new Delayed()};

    themeChanged(this);
    if (options.lineWrapping)
      this.display.wrapper.className += " CodeMirror-wrap";

    var doc = options.value;
    if (typeof doc == "string") doc = new Doc(options.value, options.mode);
    operation(this, attachDoc)(this, doc);

    // Override magic textarea content restore that IE sometimes does
    // on our hidden textarea on reload
    if (ie) setTimeout(bind(resetInput, this, true), 20);

    registerEventHandlers(this);
    // IE throws unspecified error in certain cases, when
    // trying to access activeElement before onload
    var hasFocus; try { hasFocus = (document.activeElement == display.input); } catch(e) { }
    if (hasFocus || (options.autofocus && !mobile)) setTimeout(bind(onFocus, this), 20);
    else onBlur(this);

    operation(this, function() {
      for (var opt in optionHandlers)
        if (optionHandlers.propertyIsEnumerable(opt))
          optionHandlers[opt](this, options[opt], Init);
      for (var i = 0; i < initHooks.length; ++i) initHooks[i](this);
    })();
  }

  // DISPLAY CONSTRUCTOR

  function makeDisplay(place, docStart) {
    var d = {};

    var input = d.input = elt("textarea", null, null, "position: absolute; padding: 0; width: 1px; height: 1em; outline: none; font-size: 4px;");
    if (webkit) input.style.width = "1000px";
    else input.setAttribute("wrap", "off");
    // if border: 0; -- iOS fails to open keyboard (issue #1287)
    if (ios) input.style.border = "1px solid black";
    input.setAttribute("autocorrect", "off"); input.setAttribute("autocapitalize", "off"); input.setAttribute("spellcheck", "false");

    // Wraps and hides input textarea
    d.inputDiv = elt("div", [input], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
    // The actual fake scrollbars.
    d.scrollbarH = elt("div", [elt("div", null, null, "height: 1px")], "CodeMirror-hscrollbar");
    d.scrollbarV = elt("div", [elt("div", null, null, "width: 1px")], "CodeMirror-vscrollbar");
    d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler");
    d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler");
    // DIVs containing the selection and the actual code
    d.lineDiv = elt("div", null, "CodeMirror-code");
    d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1");
    // Blinky cursor, and element used to ensure cursor fits at the end of a line
    d.cursor = elt("div", "\u00a0", "CodeMirror-cursor");
    // Secondary cursor, shown when on a 'jump' in bi-directional text
    d.otherCursor = elt("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor");
    // Used to measure text size
    d.measure = elt("div", null, "CodeMirror-measure");
    // Wraps everything that needs to exist inside the vertically-padded coordinate system
    d.lineSpace = elt("div", [d.measure, d.selectionDiv, d.lineDiv, d.cursor, d.otherCursor],
                         null, "position: relative; outline: none");
    // Moved around its parent to cover visible view
    d.mover = elt("div", [elt("div", [d.lineSpace], "CodeMirror-lines")], null, "position: relative");
    // Set to the height of the text, causes scrolling
    d.sizer = elt("div", [d.mover], "CodeMirror-sizer");
    // D is needed because behavior of elts with overflow: auto and padding is inconsistent across browsers
    d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerCutOff + "px; width: 1px;");
    // Will contain the gutters, if any
    d.gutters = elt("div", null, "CodeMirror-gutters");
    d.lineGutter = null;
    // Provides scrolling
    d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll");
    d.scroller.setAttribute("tabIndex", "-1");
    // The element in which the editor lives.
    d.wrapper = elt("div", [d.inputDiv, d.scrollbarH, d.scrollbarV,
                            d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror");
    // Work around IE7 z-index bug
    if (ie_lt8) { d.gutters.style.zIndex = -1; d.scroller.style.paddingRight = 0; }
    if (place.appendChild) place.appendChild(d.wrapper); else place(d.wrapper);

    // Needed to hide big blue blinking cursor on Mobile Safari
    if (ios) input.style.width = "0px";
    if (!webkit) d.scroller.draggable = true;
    // Needed to handle Tab key in KHTML
    if (khtml) { d.inputDiv.style.height = "1px"; d.inputDiv.style.position = "absolute"; }
    // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
    else if (ie_lt8) d.scrollbarH.style.minWidth = d.scrollbarV.style.minWidth = "18px";

    // Current visible range (may be bigger than the view window).
    d.viewOffset = d.lastSizeC = 0;
    d.showingFrom = d.showingTo = docStart;

    // Used to only resize the line number gutter when necessary (when
    // the amount of lines crosses a boundary that makes its width change)
    d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;
    // See readInput and resetInput
    d.prevInput = "";
    // Set to true when a non-horizontal-scrolling widget is added. As
    // an optimization, widget aligning is skipped when d is false.
    d.alignWidgets = false;
    // Flag that indicates whether we currently expect input to appear
    // (after some event like 'keypress' or 'input') and are polling
    // intensively.
    d.pollingFast = false;
    // Self-resetting timeout for the poller
    d.poll = new Delayed();

    d.cachedCharWidth = d.cachedTextHeight = null;
    d.measureLineCache = [];
    d.measureLineCachePos = 0;

    // Tracks when resetInput has punted to just putting a short
    // string instead of the (large) selection.
    d.inaccurateSelection = false;

    // Tracks the maximum line length so that the horizontal scrollbar
    // can be kept static when scrolling.
    d.maxLine = null;
    d.maxLineLength = 0;
    d.maxLineChanged = false;

    // Used for measuring wheel scrolling granularity
    d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;

    return d;
  }

  // STATE UPDATES

  // Used to get the editor into a consistent state again when options change.

  function loadMode(cm) {
    cm.doc.mode = CodeMirror.getMode(cm.options, cm.doc.modeOption);
    cm.doc.iter(function(line) {
      if (line.stateAfter) line.stateAfter = null;
      if (line.styles) line.styles = null;
    });
    cm.doc.frontier = cm.doc.first;
    startWorker(cm, 100);
    cm.state.modeGen++;
    if (cm.curOp) regChange(cm);
  }

  function wrappingChanged(cm) {
    if (cm.options.lineWrapping) {
      cm.display.wrapper.className += " CodeMirror-wrap";
      cm.display.sizer.style.minWidth = "";
    } else {
      cm.display.wrapper.className = cm.display.wrapper.className.replace(" CodeMirror-wrap", "");
      computeMaxLength(cm);
    }
    estimateLineHeights(cm);
    regChange(cm);
    clearCaches(cm);
    setTimeout(function(){updateScrollbars(cm);}, 100);
  }

  function estimateHeight(cm) {
    var th = textHeight(cm.display), wrapping = cm.options.lineWrapping;
    var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
    return function(line) {
      if (lineIsHidden(cm.doc, line))
        return 0;
      else if (wrapping)
        return (Math.ceil(line.text.length / perLine) || 1) * th;
      else
        return th;
    };
  }

  function estimateLineHeights(cm) {
    var doc = cm.doc, est = estimateHeight(cm);
    doc.iter(function(line) {
      var estHeight = est(line);
      if (estHeight != line.height) updateLineHeight(line, estHeight);
    });
  }

  function keyMapChanged(cm) {
    var map = keyMap[cm.options.keyMap], style = map.style;
    cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-keymap-\S+/g, "") +
      (style ? " cm-keymap-" + style : "");
    cm.state.disableInput = map.disableInput;
  }

  function themeChanged(cm) {
    cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
      cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
    clearCaches(cm);
  }

  function guttersChanged(cm) {
    updateGutters(cm);
    regChange(cm);
    setTimeout(function(){alignHorizontally(cm);}, 20);
  }

  function updateGutters(cm) {
    var gutters = cm.display.gutters, specs = cm.options.gutters;
    removeChildren(gutters);
    for (var i = 0; i < specs.length; ++i) {
      var gutterClass = specs[i];
      var gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + gutterClass));
      if (gutterClass == "CodeMirror-linenumbers") {
        cm.display.lineGutter = gElt;
        gElt.style.width = (cm.display.lineNumWidth || 1) + "px";
      }
    }
    gutters.style.display = i ? "" : "none";
  }

  function lineLength(doc, line) {
    if (line.height == 0) return 0;
    var len = line.text.length, merged, cur = line;
    while (merged = collapsedSpanAtStart(cur)) {
      var found = merged.find();
      cur = getLine(doc, found.from.line);
      len += found.from.ch - found.to.ch;
    }
    cur = line;
    while (merged = collapsedSpanAtEnd(cur)) {
      var found = merged.find();
      len -= cur.text.length - found.from.ch;
      cur = getLine(doc, found.to.line);
      len += cur.text.length - found.to.ch;
    }
    return len;
  }

  function computeMaxLength(cm) {
    var d = cm.display, doc = cm.doc;
    d.maxLine = getLine(doc, doc.first);
    d.maxLineLength = lineLength(doc, d.maxLine);
    d.maxLineChanged = true;
    doc.iter(function(line) {
      var len = lineLength(doc, line);
      if (len > d.maxLineLength) {
        d.maxLineLength = len;
        d.maxLine = line;
      }
    });
  }

  // Make sure the gutters options contains the element
  // "CodeMirror-linenumbers" when the lineNumbers option is true.
  function setGuttersForLineNumbers(options) {
    var found = false;
    for (var i = 0; i < options.gutters.length; ++i) {
      if (options.gutters[i] == "CodeMirror-linenumbers") {
        if (options.lineNumbers) found = true;
        else options.gutters.splice(i--, 1);
      }
    }
    if (!found && options.lineNumbers)
      options.gutters.push("CodeMirror-linenumbers");
  }

  // SCROLLBARS

  // Re-synchronize the fake scrollbars with the actual size of the
  // content. Optionally force a scrollTop.
  function updateScrollbars(cm) {
    var d = cm.display, docHeight = cm.doc.height;
    var totalHeight = docHeight + paddingVert(d);
    d.sizer.style.minHeight = d.heightForcer.style.top = totalHeight + "px";
    d.gutters.style.height = Math.max(totalHeight, d.scroller.clientHeight - scrollerCutOff) + "px";
    var scrollHeight = Math.max(totalHeight, d.scroller.scrollHeight);
    var needsH = d.scroller.scrollWidth > (d.scroller.clientWidth + 1);
    var needsV = scrollHeight > (d.scroller.clientHeight + 1);
    if (needsV) {
      d.scrollbarV.style.display = "block";
      d.scrollbarV.style.bottom = needsH ? scrollbarWidth(d.measure) + "px" : "0";
      d.scrollbarV.firstChild.style.height =
        (scrollHeight - d.scroller.clientHeight + d.scrollbarV.clientHeight) + "px";
    } else d.scrollbarV.style.display = "";
    if (needsH) {
      d.scrollbarH.style.display = "block";
      d.scrollbarH.style.right = needsV ? scrollbarWidth(d.measure) + "px" : "0";
      d.scrollbarH.firstChild.style.width =
        (d.scroller.scrollWidth - d.scroller.clientWidth + d.scrollbarH.clientWidth) + "px";
    } else d.scrollbarH.style.display = "";
    if (needsH && needsV) {
      d.scrollbarFiller.style.display = "block";
      d.scrollbarFiller.style.height = d.scrollbarFiller.style.width = scrollbarWidth(d.measure) + "px";
    } else d.scrollbarFiller.style.display = "";
    if (needsH && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
      d.gutterFiller.style.display = "block";
      d.gutterFiller.style.height = scrollbarWidth(d.measure) + "px";
      d.gutterFiller.style.width = d.gutters.offsetWidth + "px";
    } else d.gutterFiller.style.display = "";

    if (mac_geLion && scrollbarWidth(d.measure) === 0)
      d.scrollbarV.style.minWidth = d.scrollbarH.style.minHeight = mac_geMountainLion ? "18px" : "12px";
  }

  function visibleLines(display, doc, viewPort) {
    var top = display.scroller.scrollTop, height = display.wrapper.clientHeight;
    if (typeof viewPort == "number") top = viewPort;
    else if (viewPort) {top = viewPort.top; height = viewPort.bottom - viewPort.top;}
    top = Math.floor(top - paddingTop(display));
    var bottom = Math.ceil(top + height);
    return {from: lineAtHeight(doc, top), to: lineAtHeight(doc, bottom)};
  }

  // LINE NUMBERS

  function alignHorizontally(cm) {
    var display = cm.display;
    if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) return;
    var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
    var gutterW = display.gutters.offsetWidth, l = comp + "px";
    for (var n = display.lineDiv.firstChild; n; n = n.nextSibling) if (n.alignable) {
      for (var i = 0, a = n.alignable; i < a.length; ++i) a[i].style.left = l;
    }
    if (cm.options.fixedGutter)
      display.gutters.style.left = (comp + gutterW) + "px";
  }

  function maybeUpdateLineNumberWidth(cm) {
    if (!cm.options.lineNumbers) return false;
    var doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display;
    if (last.length != display.lineNumChars) {
      var test = display.measure.appendChild(elt("div", [elt("div", last)],
                                                 "CodeMirror-linenumber CodeMirror-gutter-elt"));
      var innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;
      display.lineGutter.style.width = "";
      display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding);
      display.lineNumWidth = display.lineNumInnerWidth + padding;
      display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
      display.lineGutter.style.width = display.lineNumWidth + "px";
      return true;
    }
    return false;
  }

  function lineNumberFor(options, i) {
    return String(options.lineNumberFormatter(i + options.firstLineNumber));
  }
  function compensateForHScroll(display) {
    return getRect(display.scroller).left - getRect(display.sizer).left;
  }

  // DISPLAY DRAWING

  function updateDisplay(cm, changes, viewPort) {
    var oldFrom = cm.display.showingFrom, oldTo = cm.display.showingTo, updated;
    var visible = visibleLines(cm.display, cm.doc, viewPort);
    for (;;) {
      if (!updateDisplayInner(cm, changes, visible)) break;
      updated = true;
      updateSelection(cm);
      updateScrollbars(cm);

      // Clip forced viewport to actual scrollable area
      if (viewPort)
        viewPort = Math.min(cm.display.scroller.scrollHeight - cm.display.scroller.clientHeight,
                            typeof viewPort == "number" ? viewPort : viewPort.top);
      visible = visibleLines(cm.display, cm.doc, viewPort);
      if (visible.from >= cm.display.showingFrom && visible.to <= cm.display.showingTo)
        break;
      changes = [];
    }

    if (updated) {
      signalLater(cm, "update", cm);
      if (cm.display.showingFrom != oldFrom || cm.display.showingTo != oldTo)
        signalLater(cm, "viewportChange", cm, cm.display.showingFrom, cm.display.showingTo);
    }
    return updated;
  }

  // Uses a set of changes plus the current scroll position to
  // determine which DOM updates have to be made, and makes the
  // updates.
  function updateDisplayInner(cm, changes, visible) {
    var display = cm.display, doc = cm.doc;
    if (!display.wrapper.clientWidth) {
      display.showingFrom = display.showingTo = doc.first;
      display.viewOffset = 0;
      return;
    }

    // Bail out if the visible area is already rendered and nothing changed.
    if (changes.length == 0 &&
        visible.from > display.showingFrom && visible.to < display.showingTo)
      return;

    if (maybeUpdateLineNumberWidth(cm))
      changes = [{from: doc.first, to: doc.first + doc.size}];
    var gutterW = display.sizer.style.marginLeft = display.gutters.offsetWidth + "px";
    display.scrollbarH.style.left = cm.options.fixedGutter ? gutterW : "0";

    // Used to determine which lines need their line numbers updated
    var positionsChangedFrom = Infinity;
    if (cm.options.lineNumbers)
      for (var i = 0; i < changes.length; ++i)
        if (changes[i].diff) { positionsChangedFrom = changes[i].from; break; }

    var end = doc.first + doc.size;
    var from = Math.max(visible.from - cm.options.viewportMargin, doc.first);
    var to = Math.min(end, visible.to + cm.options.viewportMargin);
    if (display.showingFrom < from && from - display.showingFrom < 20) from = Math.max(doc.first, display.showingFrom);
    if (display.showingTo > to && display.showingTo - to < 20) to = Math.min(end, display.showingTo);
    if (sawCollapsedSpans) {
      from = lineNo(visualLine(doc, getLine(doc, from)));
      while (to < end && lineIsHidden(doc, getLine(doc, to))) ++to;
    }

    // Create a range of theoretically intact lines, and punch holes
    // in that using the change info.
    var intact = [{from: Math.max(display.showingFrom, doc.first),
                   to: Math.min(display.showingTo, end)}];
    if (intact[0].from >= intact[0].to) intact = [];
    else intact = computeIntact(intact, changes);
    // When merged lines are present, we might have to reduce the
    // intact ranges because changes in continued fragments of the
    // intact lines do require the lines to be redrawn.
    if (sawCollapsedSpans)
      for (var i = 0; i < intact.length; ++i) {
        var range = intact[i], merged;
        while (merged = collapsedSpanAtEnd(getLine(doc, range.to - 1))) {
          var newTo = merged.find().from.line;
          if (newTo > range.from) range.to = newTo;
          else { intact.splice(i--, 1); break; }
        }
      }

    // Clip off the parts that won't be visible
    var intactLines = 0;
    for (var i = 0; i < intact.length; ++i) {
      var range = intact[i];
      if (range.from < from) range.from = from;
      if (range.to > to) range.to = to;
      if (range.from >= range.to) intact.splice(i--, 1);
      else intactLines += range.to - range.from;
    }
    if (intactLines == to - from && from == display.showingFrom && to == display.showingTo) {
      updateViewOffset(cm);
      return;
    }
    intact.sort(function(a, b) {return a.from - b.from;});

    // Avoid crashing on IE's "unspecified error" when in iframes
    try {
      var focused = document.activeElement;
    } catch(e) {}
    if (intactLines < (to - from) * .7) display.lineDiv.style.display = "none";
    patchDisplay(cm, from, to, intact, positionsChangedFrom);
    display.lineDiv.style.display = "";
    if (focused && document.activeElement != focused && focused.offsetHeight) focused.focus();

    var different = from != display.showingFrom || to != display.showingTo ||
      display.lastSizeC != display.wrapper.clientHeight;
    // This is just a bogus formula that detects when the editor is
    // resized or the font size changes.
    if (different) {
      display.lastSizeC = display.wrapper.clientHeight;
      startWorker(cm, 400);
    }
    display.showingFrom = from; display.showingTo = to;

    var prevBottom = display.lineDiv.offsetTop;
    for (var node = display.lineDiv.firstChild, height; node; node = node.nextSibling) if (node.lineObj) {
      if (ie_lt8) {
        var bot = node.offsetTop + node.offsetHeight;
        height = bot - prevBottom;
        prevBottom = bot;
      } else {
        var box = getRect(node);
        height = box.bottom - box.top;
      }
      var diff = node.lineObj.height - height;
      if (height < 2) height = textHeight(display);
      if (diff > .001 || diff < -.001) {
        updateLineHeight(node.lineObj, height);
        var widgets = node.lineObj.widgets;
        if (widgets) for (var i = 0; i < widgets.length; ++i)
          widgets[i].height = widgets[i].node.offsetHeight;
      }
    }
    updateViewOffset(cm);

    return true;
  }

  function updateViewOffset(cm) {
    var off = cm.display.viewOffset = heightAtLine(cm, getLine(cm.doc, cm.display.showingFrom));
    // Position the mover div to align with the current virtual scroll position
    cm.display.mover.style.top = off + "px";
  }

  function computeIntact(intact, changes) {
    for (var i = 0, l = changes.length || 0; i < l; ++i) {
      var change = changes[i], intact2 = [], diff = change.diff || 0;
      for (var j = 0, l2 = intact.length; j < l2; ++j) {
        var range = intact[j];
        if (change.to <= range.from && change.diff) {
          intact2.push({from: range.from + diff, to: range.to + diff});
        } else if (change.to <= range.from || change.from >= range.to) {
          intact2.push(range);
        } else {
          if (change.from > range.from)
            intact2.push({from: range.from, to: change.from});
          if (change.to < range.to)
            intact2.push({from: change.to + diff, to: range.to + diff});
        }
      }
      intact = intact2;
    }
    return intact;
  }

  function getDimensions(cm) {
    var d = cm.display, left = {}, width = {};
    for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
      left[cm.options.gutters[i]] = n.offsetLeft;
      width[cm.options.gutters[i]] = n.offsetWidth;
    }
    return {fixedPos: compensateForHScroll(d),
            gutterTotalWidth: d.gutters.offsetWidth,
            gutterLeft: left,
            gutterWidth: width,
            wrapperWidth: d.wrapper.clientWidth};
  }

  function patchDisplay(cm, from, to, intact, updateNumbersFrom) {
    var dims = getDimensions(cm);
    var display = cm.display, lineNumbers = cm.options.lineNumbers;
    if (!intact.length && (!webkit || !cm.display.currentWheelTarget))
      removeChildren(display.lineDiv);
    var container = display.lineDiv, cur = container.firstChild;

    function rm(node) {
      var next = node.nextSibling;
      if (webkit && mac && cm.display.currentWheelTarget == node) {
        node.style.display = "none";
        node.lineObj = null;
      } else {
        node.parentNode.removeChild(node);
      }
      return next;
    }

    var nextIntact = intact.shift(), lineN = from;
    cm.doc.iter(from, to, function(line) {
      if (nextIntact && nextIntact.to == lineN) nextIntact = intact.shift();
      if (lineIsHidden(cm.doc, line)) {
        if (line.height != 0) updateLineHeight(line, 0);
        if (line.widgets && cur.previousSibling) for (var i = 0; i < line.widgets.length; ++i) {
          var w = line.widgets[i];
          if (w.showIfHidden) {
            var prev = cur.previousSibling;
            if (/pre/i.test(prev.nodeName)) {
              var wrap = elt("div", null, null, "position: relative");
              prev.parentNode.replaceChild(wrap, prev);
              wrap.appendChild(prev);
              prev = wrap;
            }
            var wnode = prev.appendChild(elt("div", [w.node], "CodeMirror-linewidget"));
            if (!w.handleMouseEvents) wnode.ignoreEvents = true;
            positionLineWidget(w, wnode, prev, dims);
          }
        }
      } else if (nextIntact && nextIntact.from <= lineN && nextIntact.to > lineN) {
        // This line is intact. Skip to the actual node. Update its
        // line number if needed.
        while (cur.lineObj != line) cur = rm(cur);
        if (lineNumbers && updateNumbersFrom <= lineN && cur.lineNumber)
          setTextContent(cur.lineNumber, lineNumberFor(cm.options, lineN));
        cur = cur.nextSibling;
      } else {
        // For lines with widgets, make an attempt to find and reuse
        // the existing element, so that widgets aren't needlessly
        // removed and re-inserted into the dom
        if (line.widgets) for (var j = 0, search = cur, reuse; search && j < 20; ++j, search = search.nextSibling)
          if (search.lineObj == line && /div/i.test(search.nodeName)) { reuse = search; break; }
        // This line needs to be generated.
        var lineNode = buildLineElement(cm, line, lineN, dims, reuse);
        if (lineNode != reuse) {
          container.insertBefore(lineNode, cur);
        } else {
          while (cur != reuse) cur = rm(cur);
          cur = cur.nextSibling;
        }

        lineNode.lineObj = line;
      }
      ++lineN;
    });
    while (cur) cur = rm(cur);
  }

  function buildLineElement(cm, line, lineNo, dims, reuse) {
    var lineElement = lineContent(cm, line);
    var markers = line.gutterMarkers, display = cm.display, wrap;

    if (!cm.options.lineNumbers && !markers && !line.bgClass && !line.wrapClass && !line.widgets)
      return lineElement;

    // Lines with gutter elements, widgets or a background class need
    // to be wrapped again, and have the extra elements added to the
    // wrapper div

    if (reuse) {
      reuse.alignable = null;
      var isOk = true, widgetsSeen = 0, insertBefore = null;
      for (var n = reuse.firstChild, next; n; n = next) {
        next = n.nextSibling;
        if (!/\bCodeMirror-linewidget\b/.test(n.className)) {
          reuse.removeChild(n);
        } else {
          for (var i = 0, first = true; i < line.widgets.length; ++i) {
            var widget = line.widgets[i];
            if (!widget.above) { insertBefore = n; first = false; }
            if (widget.node == n.firstChild) {
              positionLineWidget(widget, n, reuse, dims);
              ++widgetsSeen;
              break;
            }
          }
          if (i == line.widgets.length) { isOk = false; break; }
        }
      }
      reuse.insertBefore(lineElement, insertBefore);
      if (isOk && widgetsSeen == line.widgets.length) {
        wrap = reuse;
        reuse.className = line.wrapClass || "";
      }
    }
    if (!wrap) {
      wrap = elt("div", null, line.wrapClass, "position: relative");
      wrap.appendChild(lineElement);
    }
    // Kludge to make sure the styled element lies behind the selection (by z-index)
    if (line.bgClass)
      wrap.insertBefore(elt("div", null, line.bgClass + " CodeMirror-linebackground"), wrap.firstChild);
    if (cm.options.lineNumbers || markers) {
      var gutterWrap = wrap.insertBefore(elt("div", null, null, "position: absolute; left: " +
                                             (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px"),
                                         wrap.firstChild);
      if (cm.options.fixedGutter) (wrap.alignable || (wrap.alignable = [])).push(gutterWrap);
      if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))
        wrap.lineNumber = gutterWrap.appendChild(
          elt("div", lineNumberFor(cm.options, lineNo),
              "CodeMirror-linenumber CodeMirror-gutter-elt",
              "left: " + dims.gutterLeft["CodeMirror-linenumbers"] + "px; width: "
              + display.lineNumInnerWidth + "px"));
      if (markers)
        for (var k = 0; k < cm.options.gutters.length; ++k) {
          var id = cm.options.gutters[k], found = markers.hasOwnProperty(id) && markers[id];
          if (found)
            gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt", "left: " +
                                       dims.gutterLeft[id] + "px; width: " + dims.gutterWidth[id] + "px"));
        }
    }
    if (ie_lt8) wrap.style.zIndex = 2;
    if (line.widgets && wrap != reuse) for (var i = 0, ws = line.widgets; i < ws.length; ++i) {
      var widget = ws[i], node = elt("div", [widget.node], "CodeMirror-linewidget");
      if (!widget.handleMouseEvents) node.ignoreEvents = true;
      positionLineWidget(widget, node, wrap, dims);
      if (widget.above)
        wrap.insertBefore(node, cm.options.lineNumbers && line.height != 0 ? gutterWrap : lineElement);
      else
        wrap.appendChild(node);
      signalLater(widget, "redraw");
    }
    return wrap;
  }

  function positionLineWidget(widget, node, wrap, dims) {
    if (widget.noHScroll) {
      (wrap.alignable || (wrap.alignable = [])).push(node);
      var width = dims.wrapperWidth;
      node.style.left = dims.fixedPos + "px";
      if (!widget.coverGutter) {
        width -= dims.gutterTotalWidth;
        node.style.paddingLeft = dims.gutterTotalWidth + "px";
      }
      node.style.width = width + "px";
    }
    if (widget.coverGutter) {
      node.style.zIndex = 5;
      node.style.position = "relative";
      if (!widget.noHScroll) node.style.marginLeft = -dims.gutterTotalWidth + "px";
    }
  }

  // SELECTION / CURSOR

  function updateSelection(cm) {
    var display = cm.display;
    var collapsed = posEq(cm.doc.sel.from, cm.doc.sel.to);
    if (collapsed || cm.options.showCursorWhenSelecting)
      updateSelectionCursor(cm);
    else
      display.cursor.style.display = display.otherCursor.style.display = "none";
    if (!collapsed)
      updateSelectionRange(cm);
    else
      display.selectionDiv.style.display = "none";

    // Move the hidden textarea near the cursor to prevent scrolling artifacts
    if (cm.options.moveInputWithCursor) {
      var headPos = cursorCoords(cm, cm.doc.sel.head, "div");
      var wrapOff = getRect(display.wrapper), lineOff = getRect(display.lineDiv);
      display.inputDiv.style.top = Math.max(0, Math.min(display.wrapper.clientHeight - 10,
                                                        headPos.top + lineOff.top - wrapOff.top)) + "px";
      display.inputDiv.style.left = Math.max(0, Math.min(display.wrapper.clientWidth - 10,
                                                         headPos.left + lineOff.left - wrapOff.left)) + "px";
    }
  }

  // No selection, plain cursor
  function updateSelectionCursor(cm) {
    var display = cm.display, pos = cursorCoords(cm, cm.doc.sel.head, "div");
    display.cursor.style.left = pos.left + "px";
    display.cursor.style.top = pos.top + "px";
    display.cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";
    display.cursor.style.display = "";

    if (pos.other) {
      display.otherCursor.style.display = "";
      display.otherCursor.style.left = pos.other.left + "px";
      display.otherCursor.style.top = pos.other.top + "px";
      display.otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px";
    } else { display.otherCursor.style.display = "none"; }
  }

  // Highlight selection
  function updateSelectionRange(cm) {
    var display = cm.display, doc = cm.doc, sel = cm.doc.sel;
    var fragment = document.createDocumentFragment();
    var clientWidth = display.lineSpace.offsetWidth, pl = paddingLeft(cm.display);

    function add(left, top, width, bottom) {
      if (top < 0) top = 0;
      fragment.appendChild(elt("div", null, "CodeMirror-selected", "position: absolute; left: " + left +
                               "px; top: " + top + "px; width: " + (width == null ? clientWidth - left : width) +
                               "px; height: " + (bottom - top) + "px"));
    }

    function drawForLine(line, fromArg, toArg) {
      var lineObj = getLine(doc, line);
      var lineLen = lineObj.text.length;
      var start, end;
      function coords(ch, bias) {
        return charCoords(cm, Pos(line, ch), "div", lineObj, bias);
      }

      iterateBidiSections(getOrder(lineObj), fromArg || 0, toArg == null ? lineLen : toArg, function(from, to, dir) {
        var leftPos = coords(from, "left"), rightPos, left, right;
        if (from == to) {
          rightPos = leftPos;
          left = right = leftPos.left;
        } else {
          rightPos = coords(to - 1, "right");
          if (dir == "rtl") { var tmp = leftPos; leftPos = rightPos; rightPos = tmp; }
          left = leftPos.left;
          right = rightPos.right;
        }
        if (fromArg == null && from == 0) left = pl;
        if (rightPos.top - leftPos.top > 3) { // Different lines, draw top part
          add(left, leftPos.top, null, leftPos.bottom);
          left = pl;
          if (leftPos.bottom < rightPos.top) add(left, leftPos.bottom, null, rightPos.top);
        }
        if (toArg == null && to == lineLen) right = clientWidth;
        if (!start || leftPos.top < start.top || leftPos.top == start.top && leftPos.left < start.left)
          start = leftPos;
        if (!end || rightPos.bottom > end.bottom || rightPos.bottom == end.bottom && rightPos.right > end.right)
          end = rightPos;
        if (left < pl + 1) left = pl;
        add(left, rightPos.top, right - left, rightPos.bottom);
      });
      return {start: start, end: end};
    }

    if (sel.from.line == sel.to.line) {
      drawForLine(sel.from.line, sel.from.ch, sel.to.ch);
    } else {
      var fromLine = getLine(doc, sel.from.line), toLine = getLine(doc, sel.to.line);
      var singleVLine = visualLine(doc, fromLine) == visualLine(doc, toLine);
      var leftEnd = drawForLine(sel.from.line, sel.from.ch, singleVLine ? fromLine.text.length : null).end;
      var rightStart = drawForLine(sel.to.line, singleVLine ? 0 : null, sel.to.ch).start;
      if (singleVLine) {
        if (leftEnd.top < rightStart.top - 2) {
          add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
          add(pl, rightStart.top, rightStart.left, rightStart.bottom);
        } else {
          add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
        }
      }
      if (leftEnd.bottom < rightStart.top)
        add(pl, leftEnd.bottom, null, rightStart.top);
    }

    removeChildrenAndAdd(display.selectionDiv, fragment);
    display.selectionDiv.style.display = "";
  }

  // Cursor-blinking
  function restartBlink(cm) {
    if (!cm.state.focused) return;
    var display = cm.display;
    clearInterval(display.blinker);
    var on = true;
    display.cursor.style.visibility = display.otherCursor.style.visibility = "";
    display.blinker = setInterval(function() {
      display.cursor.style.visibility = display.otherCursor.style.visibility = (on = !on) ? "" : "hidden";
    }, cm.options.cursorBlinkRate);
  }

  // HIGHLIGHT WORKER

  function startWorker(cm, time) {
    if (cm.doc.mode.startState && cm.doc.frontier < cm.display.showingTo)
      cm.state.highlight.set(time, bind(highlightWorker, cm));
  }

  function highlightWorker(cm) {
    var doc = cm.doc;
    if (doc.frontier < doc.first) doc.frontier = doc.first;
    if (doc.frontier >= cm.display.showingTo) return;
    var end = +new Date + cm.options.workTime;
    var state = copyState(doc.mode, getStateBefore(cm, doc.frontier));
    var changed = [], prevChange;
    doc.iter(doc.frontier, Math.min(doc.first + doc.size, cm.display.showingTo + 500), function(line) {
      if (doc.frontier >= cm.display.showingFrom) { // Visible
        var oldStyles = line.styles;
        line.styles = highlightLine(cm, line, state);
        var ischange = !oldStyles || oldStyles.length != line.styles.length;
        for (var i = 0; !ischange && i < oldStyles.length; ++i) ischange = oldStyles[i] != line.styles[i];
        if (ischange) {
          if (prevChange && prevChange.end == doc.frontier) prevChange.end++;
          else changed.push(prevChange = {start: doc.frontier, end: doc.frontier + 1});
        }
        line.stateAfter = copyState(doc.mode, state);
      } else {
        processLine(cm, line, state);
        line.stateAfter = doc.frontier % 5 == 0 ? copyState(doc.mode, state) : null;
      }
      ++doc.frontier;
      if (+new Date > end) {
        startWorker(cm, cm.options.workDelay);
        return true;
      }
    });
    if (changed.length)
      operation(cm, function() {
        for (var i = 0; i < changed.length; ++i)
          regChange(this, changed[i].start, changed[i].end);
      })();
  }

  // Finds the line to start with when starting a parse. Tries to
  // find a line with a stateAfter, so that it can start with a
  // valid state. If that fails, it returns the line with the
  // smallest indentation, which tends to need the least context to
  // parse correctly.
  function findStartLine(cm, n, precise) {
    var minindent, minline, doc = cm.doc;
    for (var search = n, lim = n - 100; search > lim; --search) {
      if (search <= doc.first) return doc.first;
      var line = getLine(doc, search - 1);
      if (line.stateAfter && (!precise || search <= doc.frontier)) return search;
      var indented = countColumn(line.text, null, cm.options.tabSize);
      if (minline == null || minindent > indented) {
        minline = search - 1;
        minindent = indented;
      }
    }
    return minline;
  }

  function getStateBefore(cm, n, precise) {
    var doc = cm.doc, display = cm.display;
      if (!doc.mode.startState) return true;
    var pos = findStartLine(cm, n, precise), state = pos > doc.first && getLine(doc, pos-1).stateAfter;
    if (!state) state = startState(doc.mode);
    else state = copyState(doc.mode, state);
    doc.iter(pos, n, function(line) {
      processLine(cm, line, state);
      var save = pos == n - 1 || pos % 5 == 0 || pos >= display.showingFrom && pos < display.showingTo;
      line.stateAfter = save ? copyState(doc.mode, state) : null;
      ++pos;
    });
    return state;
  }

  // POSITION MEASUREMENT

  function paddingTop(display) {return display.lineSpace.offsetTop;}
  function paddingVert(display) {return display.mover.offsetHeight - display.lineSpace.offsetHeight;}
  function paddingLeft(display) {
    var e = removeChildrenAndAdd(display.measure, elt("pre", null, null, "text-align: left")).appendChild(elt("span", "x"));
    return e.offsetLeft;
  }

  function measureChar(cm, line, ch, data, bias) {
    var dir = -1;
    data = data || measureLine(cm, line);

    for (var pos = ch;; pos += dir) {
      var r = data[pos];
      if (r) break;
      if (dir < 0 && pos == 0) dir = 1;
    }
    var rightV = (pos < ch || bias == "right") && r.topRight != null;
    return {left: pos < ch ? r.right : r.left,
            right: pos > ch ? r.left : r.right,
            top: rightV ? r.topRight : r.top,
            bottom: rightV ? r.bottomRight : r.bottom};
  }

  function findCachedMeasurement(cm, line) {
    var cache = cm.display.measureLineCache;
    for (var i = 0; i < cache.length; ++i) {
      var memo = cache[i];
      if (memo.text == line.text && memo.markedSpans == line.markedSpans &&
          cm.display.scroller.clientWidth == memo.width &&
          memo.classes == line.textClass + "|" + line.bgClass + "|" + line.wrapClass)
        return memo;
    }
  }

  function clearCachedMeasurement(cm, line) {
    var exists = findCachedMeasurement(cm, line);
    if (exists) exists.text = exists.measure = exists.markedSpans = null;
  }

  function measureLine(cm, line) {
    // First look in the cache
    var cached = findCachedMeasurement(cm, line);
    if (cached) return cached.measure;

    // Failing that, recompute and store result in cache
    var measure = measureLineInner(cm, line);
    var cache = cm.display.measureLineCache;
    var memo = {text: line.text, width: cm.display.scroller.clientWidth,
                markedSpans: line.markedSpans, measure: measure,
                classes: line.textClass + "|" + line.bgClass + "|" + line.wrapClass};
    if (cache.length == 16) cache[++cm.display.measureLineCachePos % 16] = memo;
    else cache.push(memo);
    return measure;
  }

  function measureLineInner(cm, line) {
    var display = cm.display, measure = emptyArray(line.text.length);
    var pre = lineContent(cm, line, measure);

    // IE does not cache element positions of inline elements between
    // calls to getBoundingClientRect. This makes the loop below,
    // which gathers the positions of all the characters on the line,
    // do an amount of layout work quadratic to the number of
    // characters. When line wrapping is off, we try to improve things
    // by first subdividing the line into a bunch of inline blocks, so
    // that IE can reuse most of the layout information from caches
    // for those blocks. This does interfere with line wrapping, so it
    // doesn't work when wrapping is on, but in that case the
    // situation is slightly better, since IE does cache line-wrapping
    // information and only recomputes per-line.
    if (ie && !ie_lt8 && !cm.options.lineWrapping && pre.childNodes.length > 100) {
      var fragment = document.createDocumentFragment();
      var chunk = 10, n = pre.childNodes.length;
      for (var i = 0, chunks = Math.ceil(n / chunk); i < chunks; ++i) {
        var wrap = elt("div", null, null, "display: inline-block");
        for (var j = 0; j < chunk && n; ++j) {
          wrap.appendChild(pre.firstChild);
          --n;
        }
        fragment.appendChild(wrap);
      }
      pre.appendChild(fragment);
    }

    removeChildrenAndAdd(display.measure, pre);

    var outer = getRect(display.lineDiv);
    var vranges = [], data = emptyArray(line.text.length), maxBot = pre.offsetHeight;
    // Work around an IE7/8 bug where it will sometimes have randomly
    // replaced our pre with a clone at this point.
    if (ie_lt9 && display.measure.first != pre)
      removeChildrenAndAdd(display.measure, pre);

    function categorizeVSpan(top, bot) {
      if (bot > maxBot) bot = maxBot;
      if (top < 0) top = 0;
      for (var j = 0; j < vranges.length; j += 2) {
        var rtop = vranges[j], rbot = vranges[j+1];
        if (rtop > bot || rbot < top) continue;
        if (rtop <= top && rbot >= bot ||
            top <= rtop && bot >= rbot ||
            Math.min(bot, rbot) - Math.max(top, rtop) >= (bot - top) >> 1) {
          vranges[j] = Math.min(top, rtop);
          vranges[j+1] = Math.max(bot, rbot);
          return j;
        }
      }
      vranges.push(top, bot);
      return j;
    }

    for (var i = 0, cur; i < measure.length; ++i) if (cur = measure[i]) {
      var size, node = cur;
      // A widget might wrap, needs special care
      if (/\bCodeMirror-widget\b/.test(cur.className) && cur.getClientRects) {
        if (cur.firstChild.nodeType == 1) node = cur.firstChild;
        var rects = node.getClientRects(), rLeft = rects[0], rRight = rects[rects.length - 1];
        if (rects.length > 1) {
          var vCatLeft = categorizeVSpan(rLeft.top - outer.top, rLeft.bottom - outer.top);
          var vCatRight = categorizeVSpan(rRight.top - outer.top, rRight.bottom - outer.top);
          data[i] = {left: rLeft.left - outer.left, right: rRight.right - outer.left,
                     top: vCatLeft, topRight: vCatRight};
          continue;
        }
      }
      size = getRect(node);
      var vCat = categorizeVSpan(size.top - outer.top, size.bottom - outer.top);
      var right = size.right;
      if (cur.measureRight) right = getRect(cur.measureRight).left;
      data[i] = {left: size.left - outer.left, right: right - outer.left, top: vCat};
    }
    for (var i = 0, cur; i < data.length; ++i) if (cur = data[i]) {
      var vr = cur.top, vrRight = cur.topRight;
      cur.top = vranges[vr]; cur.bottom = vranges[vr+1];
      if (vrRight != null) { cur.topRight = vranges[vrRight]; cur.bottomRight = vranges[vrRight+1]; }
    }
    return data;
  }

  function measureLineWidth(cm, line) {
    var hasBadSpan = false;
    if (line.markedSpans) for (var i = 0; i < line.markedSpans; ++i) {
      var sp = line.markedSpans[i];
      if (sp.collapsed && (sp.to == null || sp.to == line.text.length)) hasBadSpan = true;
    }
    var cached = !hasBadSpan && findCachedMeasurement(cm, line);
    if (cached) return measureChar(cm, line, line.text.length, cached.measure, "right").right;

    var pre = lineContent(cm, line);
    var end = pre.appendChild(zeroWidthElement(cm.display.measure));
    removeChildrenAndAdd(cm.display.measure, pre);
    return getRect(end).right - getRect(cm.display.lineDiv).left;
  }

  function clearCaches(cm) {
    cm.display.measureLineCache.length = cm.display.measureLineCachePos = 0;
    cm.display.cachedCharWidth = cm.display.cachedTextHeight = null;
    if (!cm.options.lineWrapping) cm.display.maxLineChanged = true;
    cm.display.lineNumChars = null;
  }

  function pageScrollX() { return window.pageXOffset || (document.documentElement || document.body).scrollLeft; }
  function pageScrollY() { return window.pageYOffset || (document.documentElement || document.body).scrollTop; }

  // Context is one of "line", "div" (display.lineDiv), "local"/null (editor), or "page"
  function intoCoordSystem(cm, lineObj, rect, context) {
    if (lineObj.widgets) for (var i = 0; i < lineObj.widgets.length; ++i) if (lineObj.widgets[i].above) {
      var size = widgetHeight(lineObj.widgets[i]);
      rect.top += size; rect.bottom += size;
    }
    if (context == "line") return rect;
    if (!context) context = "local";
    var yOff = heightAtLine(cm, lineObj);
    if (context == "local") yOff += paddingTop(cm.display);
    else yOff -= cm.display.viewOffset;
    if (context == "page" || context == "window") {
      var lOff = getRect(cm.display.lineSpace);
      yOff += lOff.top + (context == "window" ? 0 : pageScrollY());
      var xOff = lOff.left + (context == "window" ? 0 : pageScrollX());
      rect.left += xOff; rect.right += xOff;
    }
    rect.top += yOff; rect.bottom += yOff;
    return rect;
  }

  // Context may be "window", "page", "div", or "local"/null
  // Result is in "div" coords
  function fromCoordSystem(cm, coords, context) {
    if (context == "div") return coords;
    var left = coords.left, top = coords.top;
    // First move into "page" coordinate system
    if (context == "page") {
      left -= pageScrollX();
      top -= pageScrollY();
    } else if (context == "local" || !context) {
      var localBox = getRect(cm.display.sizer);
      left += localBox.left;
      top += localBox.top;
    }

    var lineSpaceBox = getRect(cm.display.lineSpace);
    return {left: left - lineSpaceBox.left, top: top - lineSpaceBox.top};
  }

  function charCoords(cm, pos, context, lineObj, bias) {
    if (!lineObj) lineObj = getLine(cm.doc, pos.line);
    return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, null, bias), context);
  }

  function cursorCoords(cm, pos, context, lineObj, measurement) {
    lineObj = lineObj || getLine(cm.doc, pos.line);
    if (!measurement) measurement = measureLine(cm, lineObj);
    function get(ch, right) {
      var m = measureChar(cm, lineObj, ch, measurement, right ? "right" : "left");
      if (right) m.left = m.right; else m.right = m.left;
      return intoCoordSystem(cm, lineObj, m, context);
    }
    function getBidi(ch, partPos) {
      var part = order[partPos], right = part.level % 2;
      if (ch == bidiLeft(part) && partPos && part.level < order[partPos - 1].level) {
        part = order[--partPos];
        ch = bidiRight(part) - (part.level % 2 ? 0 : 1);
        right = true;
      } else if (ch == bidiRight(part) && partPos < order.length - 1 && part.level < order[partPos + 1].level) {
        part = order[++partPos];
        ch = bidiLeft(part) - part.level % 2;
        right = false;
      }
      if (right && ch == part.to && ch > part.from) return get(ch - 1);
      return get(ch, right);
    }
    var order = getOrder(lineObj), ch = pos.ch;
    if (!order) return get(ch);
    var partPos = getBidiPartAt(order, ch);
    var val = getBidi(ch, partPos);
    if (bidiOther != null) val.other = getBidi(ch, bidiOther);
    return val;
  }

  function PosWithInfo(line, ch, outside, xRel) {
    var pos = new Pos(line, ch);
    pos.xRel = xRel;
    if (outside) pos.outside = true;
    return pos;
  }

  // Coords must be lineSpace-local
  function coordsChar(cm, x, y) {
    var doc = cm.doc;
    y += cm.display.viewOffset;
    if (y < 0) return PosWithInfo(doc.first, 0, true, -1);
    var lineNo = lineAtHeight(doc, y), last = doc.first + doc.size - 1;
    if (lineNo > last)
      return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, true, 1);
    if (x < 0) x = 0;

    for (;;) {
      var lineObj = getLine(doc, lineNo);
      var found = coordsCharInner(cm, lineObj, lineNo, x, y);
      var merged = collapsedSpanAtEnd(lineObj);
      var mergedPos = merged && merged.find();
      if (merged && (found.ch > mergedPos.from.ch || found.ch == mergedPos.from.ch && found.xRel > 0))
        lineNo = mergedPos.to.line;
      else
        return found;
    }
  }

  function coordsCharInner(cm, lineObj, lineNo, x, y) {
    var innerOff = y - heightAtLine(cm, lineObj);
    var wrongLine = false, adjust = 2 * cm.display.wrapper.clientWidth;
    var measurement = measureLine(cm, lineObj);

    function getX(ch) {
      var sp = cursorCoords(cm, Pos(lineNo, ch), "line",
                            lineObj, measurement);
      wrongLine = true;
      if (innerOff > sp.bottom) return sp.left - adjust;
      else if (innerOff < sp.top) return sp.left + adjust;
      else wrongLine = false;
      return sp.left;
    }

    var bidi = getOrder(lineObj), dist = lineObj.text.length;
    var from = lineLeft(lineObj), to = lineRight(lineObj);
    var fromX = getX(from), fromOutside = wrongLine, toX = getX(to), toOutside = wrongLine;

    if (x > toX) return PosWithInfo(lineNo, to, toOutside, 1);
    // Do a binary search between these bounds.
    for (;;) {
      if (bidi ? to == from || to == moveVisually(lineObj, from, 1) : to - from <= 1) {
        var ch = x < fromX || x - fromX <= toX - x ? from : to;
        var xDiff = x - (ch == from ? fromX : toX);
        while (isExtendingChar.test(lineObj.text.charAt(ch))) ++ch;
        var pos = PosWithInfo(lineNo, ch, ch == from ? fromOutside : toOutside,
                              xDiff < 0 ? -1 : xDiff ? 1 : 0);
        return pos;
      }
      var step = Math.ceil(dist / 2), middle = from + step;
      if (bidi) {
        middle = from;
        for (var i = 0; i < step; ++i) middle = moveVisually(lineObj, middle, 1);
      }
      var middleX = getX(middle);
      if (middleX > x) {to = middle; toX = middleX; if (toOutside = wrongLine) toX += 1000; dist = step;}
      else {from = middle; fromX = middleX; fromOutside = wrongLine; dist -= step;}
    }
  }

  var measureText;
  function textHeight(display) {
    if (display.cachedTextHeight != null) return display.cachedTextHeight;
    if (measureText == null) {
      measureText = elt("pre");
      // Measure a bunch of lines, for browsers that compute
      // fractional heights.
      for (var i = 0; i < 49; ++i) {
        measureText.appendChild(document.createTextNode("x"));
        measureText.appendChild(elt("br"));
      }
      measureText.appendChild(document.createTextNode("x"));
    }
    removeChildrenAndAdd(display.measure, measureText);
    var height = measureText.offsetHeight / 50;
    if (height > 3) display.cachedTextHeight = height;
    removeChildren(display.measure);
    return height || 1;
  }

  function charWidth(display) {
    if (display.cachedCharWidth != null) return display.cachedCharWidth;
    var anchor = elt("span", "x");
    var pre = elt("pre", [anchor]);
    removeChildrenAndAdd(display.measure, pre);
    var width = anchor.offsetWidth;
    if (width > 2) display.cachedCharWidth = width;
    return width || 10;
  }

  // OPERATIONS

  // Operations are used to wrap changes in such a way that each
  // change won't have to update the cursor and display (which would
  // be awkward, slow, and error-prone), but instead updates are
  // batched and then all combined and executed at once.

  var nextOpId = 0;
  function startOperation(cm) {
    cm.curOp = {
      // An array of ranges of lines that have to be updated. See
      // updateDisplay.
      changes: [],
      updateInput: null,
      userSelChange: null,
      textChanged: null,
      selectionChanged: false,
      cursorActivity: false,
      updateMaxLine: false,
      updateScrollPos: false,
      id: ++nextOpId
    };
    if (!delayedCallbackDepth++) delayedCallbacks = [];
  }

  function endOperation(cm) {
    var op = cm.curOp, doc = cm.doc, display = cm.display;
    cm.curOp = null;

    if (op.updateMaxLine) computeMaxLength(cm);
    if (display.maxLineChanged && !cm.options.lineWrapping && display.maxLine) {
      var width = measureLineWidth(cm, display.maxLine);
      display.sizer.style.minWidth = Math.max(0, width + 3 + scrollerCutOff) + "px";
      display.maxLineChanged = false;
      var maxScrollLeft = Math.max(0, display.sizer.offsetLeft + display.sizer.offsetWidth - display.scroller.clientWidth);
      if (maxScrollLeft < doc.scrollLeft && !op.updateScrollPos)
        setScrollLeft(cm, Math.min(display.scroller.scrollLeft, maxScrollLeft), true);
    }
    var newScrollPos, updated;
    if (op.updateScrollPos) {
      newScrollPos = op.updateScrollPos;
    } else if (op.selectionChanged && display.scroller.clientHeight) { // don't rescroll if not visible
      var coords = cursorCoords(cm, doc.sel.head);
      newScrollPos = calculateScrollPos(cm, coords.left, coords.top, coords.left, coords.bottom);
    }
    if (op.changes.length || newScrollPos && newScrollPos.scrollTop != null) {
      updated = updateDisplay(cm, op.changes, newScrollPos && newScrollPos.scrollTop);
      if (cm.display.scroller.offsetHeight) cm.doc.scrollTop = cm.display.scroller.scrollTop;
    }
    if (!updated && op.selectionChanged) updateSelection(cm);
    if (op.updateScrollPos) {
      display.scroller.scrollTop = display.scrollbarV.scrollTop = doc.scrollTop = newScrollPos.scrollTop;
      display.scroller.scrollLeft = display.scrollbarH.scrollLeft = doc.scrollLeft = newScrollPos.scrollLeft;
      alignHorizontally(cm);
      if (op.scrollToPos)
        scrollPosIntoView(cm, clipPos(cm.doc, op.scrollToPos), op.scrollToPosMargin);
    } else if (newScrollPos) {
      scrollCursorIntoView(cm);
    }
    if (op.selectionChanged) restartBlink(cm);

    if (cm.state.focused && op.updateInput)
      resetInput(cm, op.userSelChange);

    var hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;
    if (hidden) for (var i = 0; i < hidden.length; ++i)
      if (!hidden[i].lines.length) signal(hidden[i], "hide");
    if (unhidden) for (var i = 0; i < unhidden.length; ++i)
      if (unhidden[i].lines.length) signal(unhidden[i], "unhide");

    var delayed;
    if (!--delayedCallbackDepth) {
      delayed = delayedCallbacks;
      delayedCallbacks = null;
    }
    if (op.textChanged)
      signal(cm, "change", cm, op.textChanged);
    if (op.cursorActivity) signal(cm, "cursorActivity", cm);
    if (delayed) for (var i = 0; i < delayed.length; ++i) delayed[i]();
  }

  // Wraps a function in an operation. Returns the wrapped function.
  function operation(cm1, f) {
    return function() {
      var cm = cm1 || this, withOp = !cm.curOp;
      if (withOp) startOperation(cm);
      try { var result = f.apply(cm, arguments); }
      finally { if (withOp) endOperation(cm); }
      return result;
    };
  }
  function docOperation(f) {
    return function() {
      var withOp = this.cm && !this.cm.curOp, result;
      if (withOp) startOperation(this.cm);
      try { result = f.apply(this, arguments); }
      finally { if (withOp) endOperation(this.cm); }
      return result;
    };
  }
  function runInOp(cm, f) {
    var withOp = !cm.curOp, result;
    if (withOp) startOperation(cm);
    try { result = f(); }
    finally { if (withOp) endOperation(cm); }
    return result;
  }

  function regChange(cm, from, to, lendiff) {
    if (from == null) from = cm.doc.first;
    if (to == null) to = cm.doc.first + cm.doc.size;
    cm.curOp.changes.push({from: from, to: to, diff: lendiff});
  }

  // INPUT HANDLING

  function slowPoll(cm) {
    if (cm.display.pollingFast) return;
    cm.display.poll.set(cm.options.pollInterval, function() {
      readInput(cm);
      if (cm.state.focused) slowPoll(cm);
    });
  }

  function fastPoll(cm) {
    var missed = false;
    cm.display.pollingFast = true;
    function p() {
      var changed = readInput(cm);
      if (!changed && !missed) {missed = true; cm.display.poll.set(60, p);}
      else {cm.display.pollingFast = false; slowPoll(cm);}
    }
    cm.display.poll.set(20, p);
  }

  // prevInput is a hack to work with IME. If we reset the textarea
  // on every change, that breaks IME. So we look for changes
  // compared to the previous content instead. (Modern browsers have
  // events that indicate IME taking place, but these are not widely
  // supported or compatible enough yet to rely on.)
  function readInput(cm) {
    var input = cm.display.input, prevInput = cm.display.prevInput, doc = cm.doc, sel = doc.sel;
    if (!cm.state.focused || hasSelection(input) || isReadOnly(cm) || cm.state.disableInput) return false;
    var text = input.value;
    if (text == prevInput && posEq(sel.from, sel.to)) return false;
    if (ie && !ie_lt9 && cm.display.inputHasSelection === text) {
      resetInput(cm, true);
      return false;
    }

    var withOp = !cm.curOp;
    if (withOp) startOperation(cm);
    sel.shift = false;
    var same = 0, l = Math.min(prevInput.length, text.length);
    while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) ++same;
    var from = sel.from, to = sel.to;
    if (same < prevInput.length)
      from = Pos(from.line, from.ch - (prevInput.length - same));
    else if (cm.state.overwrite && posEq(from, to) && !cm.state.pasteIncoming)
      to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + (text.length - same)));

    var updateInput = cm.curOp.updateInput;
    var changeEvent = {from: from, to: to, text: splitLines(text.slice(same)),
                       origin: cm.state.pasteIncoming ? "paste" : "+input"};
    makeChange(cm.doc, changeEvent, "end");
    cm.curOp.updateInput = updateInput;
    signalLater(cm, "inputRead", cm, changeEvent);

    if (text.length > 1000 || text.indexOf("\n") > -1) input.value = cm.display.prevInput = "";
    else cm.display.prevInput = text;
    if (withOp) endOperation(cm);
    cm.state.pasteIncoming = false;
    return true;
  }

  function resetInput(cm, user) {
    var minimal, selected, doc = cm.doc;
    if (!posEq(doc.sel.from, doc.sel.to)) {
      cm.display.prevInput = "";
      minimal = hasCopyEvent &&
        (doc.sel.to.line - doc.sel.from.line > 100 || (selected = cm.getSelection()).length > 1000);
      var content = minimal ? "-" : selected || cm.getSelection();
      cm.display.input.value = content;
      if (cm.state.focused) selectInput(cm.display.input);
      if (ie && !ie_lt9) cm.display.inputHasSelection = content;
    } else if (user) {
      cm.display.prevInput = cm.display.input.value = "";
      if (ie && !ie_lt9) cm.display.inputHasSelection = null;
    }
    cm.display.inaccurateSelection = minimal;
  }

  function focusInput(cm) {
    if (cm.options.readOnly != "nocursor" && (!mobile || document.activeElement != cm.display.input))
      cm.display.input.focus();
  }

  function isReadOnly(cm) {
    return cm.options.readOnly || cm.doc.cantEdit;
  }

  // EVENT HANDLERS

  function registerEventHandlers(cm) {
    var d = cm.display;
    on(d.scroller, "mousedown", operation(cm, onMouseDown));
    if (ie)
      on(d.scroller, "dblclick", operation(cm, function(e) {
        if (signalDOMEvent(cm, e)) return;
        var pos = posFromMouse(cm, e);
        if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) return;
        e_preventDefault(e);
        var word = findWordAt(getLine(cm.doc, pos.line).text, pos);
        extendSelection(cm.doc, word.from, word.to);
      }));
    else
      on(d.scroller, "dblclick", function(e) { signalDOMEvent(cm, e) || e_preventDefault(e); });
    on(d.lineSpace, "selectstart", function(e) {
      if (!eventInWidget(d, e)) e_preventDefault(e);
    });
    // Gecko browsers fire contextmenu *after* opening the menu, at
    // which point we can't mess with it anymore. Context menu is
    // handled in onMouseDown for Gecko.
    if (!captureMiddleClick) on(d.scroller, "contextmenu", function(e) {onContextMenu(cm, e);});

    on(d.scroller, "scroll", function() {
      if (d.scroller.clientHeight) {
        setScrollTop(cm, d.scroller.scrollTop);
        setScrollLeft(cm, d.scroller.scrollLeft, true);
        signal(cm, "scroll", cm);
      }
    });
    on(d.scrollbarV, "scroll", function() {
      if (d.scroller.clientHeight) setScrollTop(cm, d.scrollbarV.scrollTop);
    });
    on(d.scrollbarH, "scroll", function() {
      if (d.scroller.clientHeight) setScrollLeft(cm, d.scrollbarH.scrollLeft);
    });

    on(d.scroller, "mousewheel", function(e){onScrollWheel(cm, e);});
    on(d.scroller, "DOMMouseScroll", function(e){onScrollWheel(cm, e);});

    function reFocus() { if (cm.state.focused) setTimeout(bind(focusInput, cm), 0); }
    on(d.scrollbarH, "mousedown", reFocus);
    on(d.scrollbarV, "mousedown", reFocus);
    // Prevent wrapper from ever scrolling
    on(d.wrapper, "scroll", function() { d.wrapper.scrollTop = d.wrapper.scrollLeft = 0; });

    var resizeTimer;
    function onResize() {
      if (resizeTimer == null) resizeTimer = setTimeout(function() {
        resizeTimer = null;
        // Might be a text scaling operation, clear size caches.
        d.cachedCharWidth = d.cachedTextHeight = knownScrollbarWidth = null;
        clearCaches(cm);
        runInOp(cm, bind(regChange, cm));
      }, 100);
    }
    on(window, "resize", onResize);
    // Above handler holds on to the editor and its data structures.
    // Here we poll to unregister it when the editor is no longer in
    // the document, so that it can be garbage-collected.
    function unregister() {
      for (var p = d.wrapper.parentNode; p && p != document.body; p = p.parentNode) {}
      if (p) setTimeout(unregister, 5000);
      else off(window, "resize", onResize);
    }
    setTimeout(unregister, 5000);

    on(d.input, "keyup", operation(cm, function(e) {
      if (signalDOMEvent(cm, e) || cm.options.onKeyEvent && cm.options.onKeyEvent(cm, addStop(e))) return;
      if (e.keyCode == 16) cm.doc.sel.shift = false;
    }));
    on(d.input, "input", bind(fastPoll, cm));
    on(d.input, "keydown", operation(cm, onKeyDown));
    on(d.input, "keypress", operation(cm, onKeyPress));
    on(d.input, "focus", bind(onFocus, cm));
    on(d.input, "blur", bind(onBlur, cm));

    function drag_(e) {
      if (signalDOMEvent(cm, e) || cm.options.onDragEvent && cm.options.onDragEvent(cm, addStop(e))) return;
      e_stop(e);
    }
    if (cm.options.dragDrop) {
      on(d.scroller, "dragstart", function(e){onDragStart(cm, e);});
      on(d.scroller, "dragenter", drag_);
      on(d.scroller, "dragover", drag_);
      on(d.scroller, "drop", operation(cm, onDrop));
    }
    on(d.scroller, "paste", function(e){
      if (eventInWidget(d, e)) return;
      focusInput(cm);
      fastPoll(cm);
    });
    on(d.input, "paste", function() {
      cm.state.pasteIncoming = true;
      fastPoll(cm);
    });

    function prepareCopy() {
      if (d.inaccurateSelection) {
        d.prevInput = "";
        d.inaccurateSelection = false;
        d.input.value = cm.getSelection();
        selectInput(d.input);
      }
    }
    on(d.input, "cut", prepareCopy);
    on(d.input, "copy", prepareCopy);

    // Needed to handle Tab key in KHTML
    if (khtml) on(d.sizer, "mouseup", function() {
        if (document.activeElement == d.input) d.input.blur();
        focusInput(cm);
    });
  }

  function eventInWidget(display, e) {
    for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {
      if (!n || n.ignoreEvents || n.parentNode == display.sizer && n != display.mover) return true;
    }
  }

  function posFromMouse(cm, e, liberal) {
    var display = cm.display;
    if (!liberal) {
      var target = e_target(e);
      if (target == display.scrollbarH || target == display.scrollbarH.firstChild ||
          target == display.scrollbarV || target == display.scrollbarV.firstChild ||
          target == display.scrollbarFiller || target == display.gutterFiller) return null;
    }
    var x, y, space = getRect(display.lineSpace);
    // Fails unpredictably on IE[67] when mouse is dragged around quickly.
    try { x = e.clientX; y = e.clientY; } catch (e) { return null; }
    return coordsChar(cm, x - space.left, y - space.top);
  }

  var lastClick, lastDoubleClick;
  function onMouseDown(e) {
    if (signalDOMEvent(this, e)) return;
    var cm = this, display = cm.display, doc = cm.doc, sel = doc.sel;
    sel.shift = e.shiftKey;

    if (eventInWidget(display, e)) {
      if (!webkit) {
        display.scroller.draggable = false;
        setTimeout(function(){display.scroller.draggable = true;}, 100);
      }
      return;
    }
    if (clickInGutter(cm, e)) return;
    var start = posFromMouse(cm, e);

    switch (e_button(e)) {
    case 3:
      if (captureMiddleClick) onContextMenu.call(cm, cm, e);
      return;
    case 2:
      if (start) extendSelection(cm.doc, start);
      setTimeout(bind(focusInput, cm), 20);
      e_preventDefault(e);
      return;
    }
    // For button 1, if it was clicked inside the editor
    // (posFromMouse returning non-null), we have to adjust the
    // selection.
    if (!start) {if (e_target(e) == display.scroller) e_preventDefault(e); return;}

    if (!cm.state.focused) onFocus(cm);

    var now = +new Date, type = "single";
    if (lastDoubleClick && lastDoubleClick.time > now - 400 && posEq(lastDoubleClick.pos, start)) {
      type = "triple";
      e_preventDefault(e);
      setTimeout(bind(focusInput, cm), 20);
      selectLine(cm, start.line);
    } else if (lastClick && lastClick.time > now - 400 && posEq(lastClick.pos, start)) {
      type = "double";
      lastDoubleClick = {time: now, pos: start};
      e_preventDefault(e);
      var word = findWordAt(getLine(doc, start.line).text, start);
      extendSelection(cm.doc, word.from, word.to);
    } else { lastClick = {time: now, pos: start}; }

    var last = start;
    if (cm.options.dragDrop && dragAndDrop && !isReadOnly(cm) && !posEq(sel.from, sel.to) &&
        !posLess(start, sel.from) && !posLess(sel.to, start) && type == "single") {
      var dragEnd = operation(cm, function(e2) {
        if (webkit) display.scroller.draggable = false;
        cm.state.draggingText = false;
        off(document, "mouseup", dragEnd);
        off(display.scroller, "drop", dragEnd);
        if (Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10) {
          e_preventDefault(e2);
          extendSelection(cm.doc, start);
          focusInput(cm);
        }
      });
      // Let the drag handler handle this.
      if (webkit) display.scroller.draggable = true;
      cm.state.draggingText = dragEnd;
      // IE's approach to draggable
      if (display.scroller.dragDrop) display.scroller.dragDrop();
      on(document, "mouseup", dragEnd);
      on(display.scroller, "drop", dragEnd);
      return;
    }
    e_preventDefault(e);
    if (type == "single") extendSelection(cm.doc, clipPos(doc, start));

    var startstart = sel.from, startend = sel.to, lastPos = start;

    function doSelect(cur) {
      if (posEq(lastPos, cur)) return;
      lastPos = cur;

      if (type == "single") {
        extendSelection(cm.doc, clipPos(doc, start), cur);
        return;
      }

      startstart = clipPos(doc, startstart);
      startend = clipPos(doc, startend);
      if (type == "double") {
        var word = findWordAt(getLine(doc, cur.line).text, cur);
        if (posLess(cur, startstart)) extendSelection(cm.doc, word.from, startend);
        else extendSelection(cm.doc, startstart, word.to);
      } else if (type == "triple") {
        if (posLess(cur, startstart)) extendSelection(cm.doc, startend, clipPos(doc, Pos(cur.line, 0)));
        else extendSelection(cm.doc, startstart, clipPos(doc, Pos(cur.line + 1, 0)));
      }
    }

    var editorSize = getRect(display.wrapper);
    // Used to ensure timeout re-tries don't fire when another extend
    // happened in the meantime (clearTimeout isn't reliable -- at
    // least on Chrome, the timeouts still happen even when cleared,
    // if the clear happens after their scheduled firing time).
    var counter = 0;

    function extend(e) {
      var curCount = ++counter;
      var cur = posFromMouse(cm, e, true);
      if (!cur) return;
      if (!posEq(cur, last)) {
        if (!cm.state.focused) onFocus(cm);
        last = cur;
        doSelect(cur);
        var visible = visibleLines(display, doc);
        if (cur.line >= visible.to || cur.line < visible.from)
          setTimeout(operation(cm, function(){if (counter == curCount) extend(e);}), 150);
      } else {
        var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
        if (outside) setTimeout(operation(cm, function() {
          if (counter != curCount) return;
          display.scroller.scrollTop += outside;
          extend(e);
        }), 50);
      }
    }

    function done(e) {
      counter = Infinity;
      e_preventDefault(e);
      focusInput(cm);
      off(document, "mousemove", move);
      off(document, "mouseup", up);
    }

    var move = operation(cm, function(e) {
      if (!ie && !e_button(e)) done(e);
      else extend(e);
    });
    var up = operation(cm, done);
    on(document, "mousemove", move);
    on(document, "mouseup", up);
  }

  function clickInGutter(cm, e) {
    var display = cm.display;
    try { var mX = e.clientX, mY = e.clientY; }
    catch(e) { return false; }

    if (mX >= Math.floor(getRect(display.gutters).right)) return false;
    e_preventDefault(e);
    if (!hasHandler(cm, "gutterClick")) return true;

    var lineBox = getRect(display.lineDiv);
    if (mY > lineBox.bottom) return true;
    mY -= lineBox.top - display.viewOffset;

    for (var i = 0; i < cm.options.gutters.length; ++i) {
      var g = display.gutters.childNodes[i];
      if (g && getRect(g).right >= mX) {
        var line = lineAtHeight(cm.doc, mY);
        var gutter = cm.options.gutters[i];
        signalLater(cm, "gutterClick", cm, line, gutter, e);
        break;
      }
    }
    return true;
  }

  // Kludge to work around strange IE behavior where it'll sometimes
  // re-fire a series of drag-related events right after the drop (#1551)
  var lastDrop = 0;

  function onDrop(e) {
    var cm = this;
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e) || (cm.options.onDragEvent && cm.options.onDragEvent(cm, addStop(e))))
      return;
    e_preventDefault(e);
    if (ie) lastDrop = +new Date;
    var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files;
    if (!pos || isReadOnly(cm)) return;
    if (files && files.length && window.FileReader && window.File) {
      var n = files.length, text = Array(n), read = 0;
      var loadFile = function(file, i) {
        var reader = new FileReader;
        reader.onload = function() {
          text[i] = reader.result;
          if (++read == n) {
            pos = clipPos(cm.doc, pos);
            makeChange(cm.doc, {from: pos, to: pos, text: splitLines(text.join("\n")), origin: "paste"}, "around");
          }
        };
        reader.readAsText(file);
      };
      for (var i = 0; i < n; ++i) loadFile(files[i], i);
    } else {
      // Don't do a replace if the drop happened inside of the selected text.
      if (cm.state.draggingText && !(posLess(pos, cm.doc.sel.from) || posLess(cm.doc.sel.to, pos))) {
        cm.state.draggingText(e);
        // Ensure the editor is re-focused
        setTimeout(bind(focusInput, cm), 20);
        return;
      }
      try {
        var text = e.dataTransfer.getData("Text");
        if (text) {
          var curFrom = cm.doc.sel.from, curTo = cm.doc.sel.to;
          setSelection(cm.doc, pos, pos);
          if (cm.state.draggingText) replaceRange(cm.doc, "", curFrom, curTo, "paste");
          cm.replaceSelection(text, null, "paste");
          focusInput(cm);
          onFocus(cm);
        }
      }
      catch(e){}
    }
  }

  function onDragStart(cm, e) {
    if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) { e_stop(e); return; }
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) return;

    var txt = cm.getSelection();
    e.dataTransfer.setData("Text", txt);

    // Use dummy image instead of default browsers image.
    // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
    if (e.dataTransfer.setDragImage && !safari) {
      var img = elt("img", null, null, "position: fixed; left: 0; top: 0;");
      if (opera) {
        img.width = img.height = 1;
        cm.display.wrapper.appendChild(img);
        // Force a relayout, or Opera won't use our image for some obscure reason
        img._top = img.offsetTop;
      }
      e.dataTransfer.setDragImage(img, 0, 0);
      if (opera) img.parentNode.removeChild(img);
    }
  }

  function setScrollTop(cm, val) {
    if (Math.abs(cm.doc.scrollTop - val) < 2) return;
    cm.doc.scrollTop = val;
    if (!gecko) updateDisplay(cm, [], val);
    if (cm.display.scroller.scrollTop != val) cm.display.scroller.scrollTop = val;
    if (cm.display.scrollbarV.scrollTop != val) cm.display.scrollbarV.scrollTop = val;
    if (gecko) updateDisplay(cm, []);
    startWorker(cm, 100);
  }
  function setScrollLeft(cm, val, isScroller) {
    if (isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) return;
    val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);
    cm.doc.scrollLeft = val;
    alignHorizontally(cm);
    if (cm.display.scroller.scrollLeft != val) cm.display.scroller.scrollLeft = val;
    if (cm.display.scrollbarH.scrollLeft != val) cm.display.scrollbarH.scrollLeft = val;
  }

  // Since the delta values reported on mouse wheel events are
  // unstandardized between browsers and even browser versions, and
  // generally horribly unpredictable, this code starts by measuring
  // the scroll effect that the first few mouse wheel events have,
  // and, from that, detects the way it can convert deltas to pixel
  // offsets afterwards.
  //
  // The reason we want to know the amount a wheel event will scroll
  // is that it gives us a chance to update the display before the
  // actual scrolling happens, reducing flickering.

  var wheelSamples = 0, wheelPixelsPerUnit = null;
  // Fill in a browser-detected starting value on browsers where we
  // know one. These don't have to be accurate -- the result of them
  // being wrong would just be a slight flicker on the first wheel
  // scroll (if it is large enough).
  if (ie) wheelPixelsPerUnit = -.53;
  else if (gecko) wheelPixelsPerUnit = 15;
  else if (chrome) wheelPixelsPerUnit = -.7;
  else if (safari) wheelPixelsPerUnit = -1/3;

  function onScrollWheel(cm, e) {
    var dx = e.wheelDeltaX, dy = e.wheelDeltaY;
    if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) dx = e.detail;
    if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) dy = e.detail;
    else if (dy == null) dy = e.wheelDelta;

    var display = cm.display, scroll = display.scroller;
    // Quit if there's nothing to scroll here
    if (!(dx && scroll.scrollWidth > scroll.clientWidth ||
          dy && scroll.scrollHeight > scroll.clientHeight)) return;

    // Webkit browsers on OS X abort momentum scrolls when the target
    // of the scroll event is removed from the scrollable element.
    // This hack (see related code in patchDisplay) makes sure the
    // element is kept around.
    if (dy && mac && webkit) {
      for (var cur = e.target; cur != scroll; cur = cur.parentNode) {
        if (cur.lineObj) {
          cm.display.currentWheelTarget = cur;
          break;
        }
      }
    }

    // On some browsers, horizontal scrolling will cause redraws to
    // happen before the gutter has been realigned, causing it to
    // wriggle around in a most unseemly way. When we have an
    // estimated pixels/delta value, we just handle horizontal
    // scrolling entirely here. It'll be slightly off from native, but
    // better than glitching out.
    if (dx && !gecko && !opera && wheelPixelsPerUnit != null) {
      if (dy)
        setScrollTop(cm, Math.max(0, Math.min(scroll.scrollTop + dy * wheelPixelsPerUnit, scroll.scrollHeight - scroll.clientHeight)));
      setScrollLeft(cm, Math.max(0, Math.min(scroll.scrollLeft + dx * wheelPixelsPerUnit, scroll.scrollWidth - scroll.clientWidth)));
      e_preventDefault(e);
      display.wheelStartX = null; // Abort measurement, if in progress
      return;
    }

    if (dy && wheelPixelsPerUnit != null) {
      var pixels = dy * wheelPixelsPerUnit;
      var top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight;
      if (pixels < 0) top = Math.max(0, top + pixels - 50);
      else bot = Math.min(cm.doc.height, bot + pixels + 50);
      updateDisplay(cm, [], {top: top, bottom: bot});
    }

    if (wheelSamples < 20) {
      if (display.wheelStartX == null) {
        display.wheelStartX = scroll.scrollLeft; display.wheelStartY = scroll.scrollTop;
        display.wheelDX = dx; display.wheelDY = dy;
        setTimeout(function() {
          if (display.wheelStartX == null) return;
          var movedX = scroll.scrollLeft - display.wheelStartX;
          var movedY = scroll.scrollTop - display.wheelStartY;
          var sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||
            (movedX && display.wheelDX && movedX / display.wheelDX);
          display.wheelStartX = display.wheelStartY = null;
          if (!sample) return;
          wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);
          ++wheelSamples;
        }, 200);
      } else {
        display.wheelDX += dx; display.wheelDY += dy;
      }
    }
  }

  function doHandleBinding(cm, bound, dropShift) {
    if (typeof bound == "string") {
      bound = commands[bound];
      if (!bound) return false;
    }
    // Ensure previous input has been read, so that the handler sees a
    // consistent view of the document
    if (cm.display.pollingFast && readInput(cm)) cm.display.pollingFast = false;
    var doc = cm.doc, prevShift = doc.sel.shift, done = false;
    try {
      if (isReadOnly(cm)) cm.state.suppressEdits = true;
      if (dropShift) doc.sel.shift = false;
      done = bound(cm) != Pass;
    } finally {
      doc.sel.shift = prevShift;
      cm.state.suppressEdits = false;
    }
    return done;
  }

  function allKeyMaps(cm) {
    var maps = cm.state.keyMaps.slice(0);
    if (cm.options.extraKeys) maps.push(cm.options.extraKeys);
    maps.push(cm.options.keyMap);
    return maps;
  }

  var maybeTransition;
  function handleKeyBinding(cm, e) {
    // Handle auto keymap transitions
    var startMap = getKeyMap(cm.options.keyMap), next = startMap.auto;
    clearTimeout(maybeTransition);
    if (next && !isModifierKey(e)) maybeTransition = setTimeout(function() {
      if (getKeyMap(cm.options.keyMap) == startMap) {
        cm.options.keyMap = (next.call ? next.call(null, cm) : next);
        keyMapChanged(cm);
      }
    }, 50);

    var name = keyName(e, true), handled = false;
    if (!name) return false;
    var keymaps = allKeyMaps(cm);

    if (e.shiftKey) {
      // First try to resolve full name (including 'Shift-'). Failing
      // that, see if there is a cursor-motion command (starting with
      // 'go') bound to the keyname without 'Shift-'.
      handled = lookupKey("Shift-" + name, keymaps, function(b) {return doHandleBinding(cm, b, true);})
             || lookupKey(name, keymaps, function(b) {
                  if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion)
                    return doHandleBinding(cm, b);
                });
    } else {
      handled = lookupKey(name, keymaps, function(b) { return doHandleBinding(cm, b); });
    }

    if (handled) {
      e_preventDefault(e);
      restartBlink(cm);
      if (ie_lt9) { e.oldKeyCode = e.keyCode; e.keyCode = 0; }
      signalLater(cm, "keyHandled", cm, name, e);
    }
    return handled;
  }

  function handleCharBinding(cm, e, ch) {
    var handled = lookupKey("'" + ch + "'", allKeyMaps(cm),
                            function(b) { return doHandleBinding(cm, b, true); });
    if (handled) {
      e_preventDefault(e);
      restartBlink(cm);
      signalLater(cm, "keyHandled", cm, "'" + ch + "'", e);
    }
    return handled;
  }

  var lastStoppedKey = null;
  function onKeyDown(e) {
    var cm = this;
    if (!cm.state.focused) onFocus(cm);
    if (ie && e.keyCode == 27) { e.returnValue = false; }
    if (signalDOMEvent(cm, e) || cm.options.onKeyEvent && cm.options.onKeyEvent(cm, addStop(e))) return;
    var code = e.keyCode;
    // IE does strange things with escape.
    cm.doc.sel.shift = code == 16 || e.shiftKey;
    // First give onKeyEvent option a chance to handle this.
    var handled = handleKeyBinding(cm, e);
    if (opera) {
      lastStoppedKey = handled ? code : null;
      // Opera has no cut event... we try to at least catch the key combo
      if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))
        cm.replaceSelection("");
    }
  }

  function onKeyPress(e) {
    var cm = this;
    if (signalDOMEvent(cm, e) || cm.options.onKeyEvent && cm.options.onKeyEvent(cm, addStop(e))) return;
    var keyCode = e.keyCode, charCode = e.charCode;
    if (opera && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return;}
    if (((opera && (!e.which || e.which < 10)) || khtml) && handleKeyBinding(cm, e)) return;
    var ch = String.fromCharCode(charCode == null ? keyCode : charCode);
    if (this.options.electricChars && this.doc.mode.electricChars &&
        this.options.smartIndent && !isReadOnly(this) &&
        this.doc.mode.electricChars.indexOf(ch) > -1)
      setTimeout(operation(cm, function() {indentLine(cm, cm.doc.sel.to.line, "smart");}), 75);
    if (handleCharBinding(cm, e, ch)) return;
    if (ie && !ie_lt9) cm.display.inputHasSelection = null;
    fastPoll(cm);
  }

  function onFocus(cm) {
    if (cm.options.readOnly == "nocursor") return;
    if (!cm.state.focused) {
      signal(cm, "focus", cm);
      cm.state.focused = true;
      if (cm.display.wrapper.className.search(/\bCodeMirror-focused\b/) == -1)
        cm.display.wrapper.className += " CodeMirror-focused";
      resetInput(cm, true);
    }
    slowPoll(cm);
    restartBlink(cm);
  }
  function onBlur(cm) {
    if (cm.state.focused) {
      signal(cm, "blur", cm);
      cm.state.focused = false;
      cm.display.wrapper.className = cm.display.wrapper.className.replace(" CodeMirror-focused", "");
    }
    clearInterval(cm.display.blinker);
    setTimeout(function() {if (!cm.state.focused) cm.doc.sel.shift = false;}, 150);
  }

  var detectingSelectAll;
  function onContextMenu(cm, e) {
    var display = cm.display, sel = cm.doc.sel;
    if (eventInWidget(display, e)) return;

    var pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop;
    if (!pos || opera) return; // Opera is difficult.
    if (posEq(sel.from, sel.to) || posLess(pos, sel.from) || !posLess(pos, sel.to))
      operation(cm, setSelection)(cm.doc, pos, pos);

    var oldCSS = display.input.style.cssText;
    display.inputDiv.style.position = "absolute";
    display.input.style.cssText = "position: fixed; width: 30px; height: 30px; top: " + (e.clientY - 5) +
      "px; left: " + (e.clientX - 5) + "px; z-index: 1000; background: white; outline: none;" +
      "border-width: 0; outline: none; overflow: hidden; opacity: .05; -ms-opacity: .05; filter: alpha(opacity=5);";
    focusInput(cm);
    resetInput(cm, true);
    // Adds "Select all" to context menu in FF
    if (posEq(sel.from, sel.to)) display.input.value = display.prevInput = " ";

    function prepareSelectAllHack() {
      if (display.input.selectionStart != null) {
        var extval = display.input.value = " " + (posEq(sel.from, sel.to) ? "" : display.input.value);
        display.prevInput = " ";
        display.input.selectionStart = 1; display.input.selectionEnd = extval.length;
      }
    }
    function rehide() {
      display.inputDiv.style.position = "relative";
      display.input.style.cssText = oldCSS;
      if (ie_lt9) display.scrollbarV.scrollTop = display.scroller.scrollTop = scrollPos;
      slowPoll(cm);

      // Try to detect the user choosing select-all
      if (display.input.selectionStart != null) {
        if (!ie || ie_lt9) prepareSelectAllHack();
        clearTimeout(detectingSelectAll);
        var i = 0, poll = function(){
          if (display.prevInput == " " && display.input.selectionStart == 0)
            operation(cm, commands.selectAll)(cm);
          else if (i++ < 10) detectingSelectAll = setTimeout(poll, 500);
          else resetInput(cm);
        };
        detectingSelectAll = setTimeout(poll, 200);
      }
    }

    if (ie && !ie_lt9) prepareSelectAllHack();
    if (captureMiddleClick) {
      e_stop(e);
      var mouseup = function() {
        off(window, "mouseup", mouseup);
        setTimeout(rehide, 20);
      };
      on(window, "mouseup", mouseup);
    } else {
      setTimeout(rehide, 50);
    }
  }

  // UPDATING

  var changeEnd = CodeMirror.changeEnd = function(change) {
    if (!change.text) return change.to;
    return Pos(change.from.line + change.text.length - 1,
               lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0));
  };

  // Make sure a position will be valid after the given change.
  function clipPostChange(doc, change, pos) {
    if (!posLess(change.from, pos)) return clipPos(doc, pos);
    var diff = (change.text.length - 1) - (change.to.line - change.from.line);
    if (pos.line > change.to.line + diff) {
      var preLine = pos.line - diff, lastLine = doc.first + doc.size - 1;
      if (preLine > lastLine) return Pos(lastLine, getLine(doc, lastLine).text.length);
      return clipToLen(pos, getLine(doc, preLine).text.length);
    }
    if (pos.line == change.to.line + diff)
      return clipToLen(pos, lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0) +
                       getLine(doc, change.to.line).text.length - change.to.ch);
    var inside = pos.line - change.from.line;
    return clipToLen(pos, change.text[inside].length + (inside ? 0 : change.from.ch));
  }

  // Hint can be null|"end"|"start"|"around"|{anchor,head}
  function computeSelAfterChange(doc, change, hint) {
    if (hint && typeof hint == "object") // Assumed to be {anchor, head} object
      return {anchor: clipPostChange(doc, change, hint.anchor),
              head: clipPostChange(doc, change, hint.head)};

    if (hint == "start") return {anchor: change.from, head: change.from};

    var end = changeEnd(change);
    if (hint == "around") return {anchor: change.from, head: end};
    if (hint == "end") return {anchor: end, head: end};

    // hint is null, leave the selection alone as much as possible
    var adjustPos = function(pos) {
      if (posLess(pos, change.from)) return pos;
      if (!posLess(change.to, pos)) return end;

      var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;
      if (pos.line == change.to.line) ch += end.ch - change.to.ch;
      return Pos(line, ch);
    };
    return {anchor: adjustPos(doc.sel.anchor), head: adjustPos(doc.sel.head)};
  }

  function filterChange(doc, change, update) {
    var obj = {
      canceled: false,
      from: change.from,
      to: change.to,
      text: change.text,
      origin: change.origin,
      cancel: function() { this.canceled = true; }
    };
    if (update) obj.update = function(from, to, text, origin) {
      if (from) this.from = clipPos(doc, from);
      if (to) this.to = clipPos(doc, to);
      if (text) this.text = text;
      if (origin !== undefined) this.origin = origin;
    };
    signal(doc, "beforeChange", doc, obj);
    if (doc.cm) signal(doc.cm, "beforeChange", doc.cm, obj);

    if (obj.canceled) return null;
    return {from: obj.from, to: obj.to, text: obj.text, origin: obj.origin};
  }

  // Replace the range from from to to by the strings in replacement.
  // change is a {from, to, text [, origin]} object
  function makeChange(doc, change, selUpdate, ignoreReadOnly) {
    if (doc.cm) {
      if (!doc.cm.curOp) return operation(doc.cm, makeChange)(doc, change, selUpdate, ignoreReadOnly);
      if (doc.cm.state.suppressEdits) return;
    }

    if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
      change = filterChange(doc, change, true);
      if (!change) return;
    }

    // Possibly split or suppress the update based on the presence
    // of read-only spans in its range.
    var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);
    if (split) {
      for (var i = split.length - 1; i >= 1; --i)
        makeChangeNoReadonly(doc, {from: split[i].from, to: split[i].to, text: [""]});
      if (split.length)
        makeChangeNoReadonly(doc, {from: split[0].from, to: split[0].to, text: change.text}, selUpdate);
    } else {
      makeChangeNoReadonly(doc, change, selUpdate);
    }
  }

  function makeChangeNoReadonly(doc, change, selUpdate) {
    var selAfter = computeSelAfterChange(doc, change, selUpdate);
    addToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);

    makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));
    var rebased = [];

    linkedDocs(doc, function(doc, sharedHist) {
      if (!sharedHist && indexOf(rebased, doc.history) == -1) {
        rebaseHist(doc.history, change);
        rebased.push(doc.history);
      }
      makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change));
    });
  }

  function makeChangeFromHistory(doc, type) {
    if (doc.cm && doc.cm.state.suppressEdits) return;

    var hist = doc.history;
    var event = (type == "undo" ? hist.done : hist.undone).pop();
    if (!event) return;

    var anti = {changes: [], anchorBefore: event.anchorAfter, headBefore: event.headAfter,
                anchorAfter: event.anchorBefore, headAfter: event.headBefore,
                generation: hist.generation};
    (type == "undo" ? hist.undone : hist.done).push(anti);
    hist.generation = event.generation || ++hist.maxGeneration;

    var filter = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange");

    for (var i = event.changes.length - 1; i >= 0; --i) {
      var change = event.changes[i];
      change.origin = type;
      if (filter && !filterChange(doc, change, false)) {
        (type == "undo" ? hist.done : hist.undone).length = 0;
        return;
      }

      anti.changes.push(historyChangeFromChange(doc, change));

      var after = i ? computeSelAfterChange(doc, change, null)
                    : {anchor: event.anchorBefore, head: event.headBefore};
      makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));
      var rebased = [];

      linkedDocs(doc, function(doc, sharedHist) {
        if (!sharedHist && indexOf(rebased, doc.history) == -1) {
          rebaseHist(doc.history, change);
          rebased.push(doc.history);
        }
        makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));
      });
    }
  }

  function shiftDoc(doc, distance) {
    function shiftPos(pos) {return Pos(pos.line + distance, pos.ch);}
    doc.first += distance;
    if (doc.cm) regChange(doc.cm, doc.first, doc.first, distance);
    doc.sel.head = shiftPos(doc.sel.head); doc.sel.anchor = shiftPos(doc.sel.anchor);
    doc.sel.from = shiftPos(doc.sel.from); doc.sel.to = shiftPos(doc.sel.to);
  }

  function makeChangeSingleDoc(doc, change, selAfter, spans) {
    if (doc.cm && !doc.cm.curOp)
      return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans);

    if (change.to.line < doc.first) {
      shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));
      return;
    }
    if (change.from.line > doc.lastLine()) return;

    // Clip the change to the size of this doc
    if (change.from.line < doc.first) {
      var shift = change.text.length - 1 - (doc.first - change.from.line);
      shiftDoc(doc, shift);
      change = {from: Pos(doc.first, 0), to: Pos(change.to.line + shift, change.to.ch),
                text: [lst(change.text)], origin: change.origin};
    }
    var last = doc.lastLine();
    if (change.to.line > last) {
      change = {from: change.from, to: Pos(last, getLine(doc, last).text.length),
                text: [change.text[0]], origin: change.origin};
    }

    change.removed = getBetween(doc, change.from, change.to);

    if (!selAfter) selAfter = computeSelAfterChange(doc, change, null);
    if (doc.cm) makeChangeSingleDocInEditor(doc.cm, change, spans, selAfter);
    else updateDoc(doc, change, spans, selAfter);
  }

  function makeChangeSingleDocInEditor(cm, change, spans, selAfter) {
    var doc = cm.doc, display = cm.display, from = change.from, to = change.to;

    var recomputeMaxLength = false, checkWidthStart = from.line;
    if (!cm.options.lineWrapping) {
      checkWidthStart = lineNo(visualLine(doc, getLine(doc, from.line)));
      doc.iter(checkWidthStart, to.line + 1, function(line) {
        if (line == display.maxLine) {
          recomputeMaxLength = true;
          return true;
        }
      });
    }

    if (!posLess(doc.sel.head, change.from) && !posLess(change.to, doc.sel.head))
      cm.curOp.cursorActivity = true;

    updateDoc(doc, change, spans, selAfter, estimateHeight(cm));

    if (!cm.options.lineWrapping) {
      doc.iter(checkWidthStart, from.line + change.text.length, function(line) {
        var len = lineLength(doc, line);
        if (len > display.maxLineLength) {
          display.maxLine = line;
          display.maxLineLength = len;
          display.maxLineChanged = true;
          recomputeMaxLength = false;
        }
      });
      if (recomputeMaxLength) cm.curOp.updateMaxLine = true;
    }

    // Adjust frontier, schedule worker
    doc.frontier = Math.min(doc.frontier, from.line);
    startWorker(cm, 400);

    var lendiff = change.text.length - (to.line - from.line) - 1;
    // Remember that these lines changed, for updating the display
    regChange(cm, from.line, to.line + 1, lendiff);

    if (hasHandler(cm, "change")) {
      var changeObj = {from: from, to: to,
                       text: change.text,
                       removed: change.removed,
                       origin: change.origin};
      if (cm.curOp.textChanged) {
        for (var cur = cm.curOp.textChanged; cur.next; cur = cur.next) {}
        cur.next = changeObj;
      } else cm.curOp.textChanged = changeObj;
    }
  }

  function replaceRange(doc, code, from, to, origin) {
    if (!to) to = from;
    if (posLess(to, from)) { var tmp = to; to = from; from = tmp; }
    if (typeof code == "string") code = splitLines(code);
    makeChange(doc, {from: from, to: to, text: code, origin: origin}, null);
  }

  // POSITION OBJECT

  function Pos(line, ch) {
    if (!(this instanceof Pos)) return new Pos(line, ch);
    this.line = line; this.ch = ch;
  }
  CodeMirror.Pos = Pos;

  function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
  function posLess(a, b) {return a.line < b.line || (a.line == b.line && a.ch < b.ch);}
  function copyPos(x) {return Pos(x.line, x.ch);}

  // SELECTION

  function clipLine(doc, n) {return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1));}
  function clipPos(doc, pos) {
    if (pos.line < doc.first) return Pos(doc.first, 0);
    var last = doc.first + doc.size - 1;
    if (pos.line > last) return Pos(last, getLine(doc, last).text.length);
    return clipToLen(pos, getLine(doc, pos.line).text.length);
  }
  function clipToLen(pos, linelen) {
    var ch = pos.ch;
    if (ch == null || ch > linelen) return Pos(pos.line, linelen);
    else if (ch < 0) return Pos(pos.line, 0);
    else return pos;
  }
  function isLine(doc, l) {return l >= doc.first && l < doc.first + doc.size;}

  // If shift is held, this will move the selection anchor. Otherwise,
  // it'll set the whole selection.
  function extendSelection(doc, pos, other, bias) {
    if (doc.sel.shift || doc.sel.extend) {
      var anchor = doc.sel.anchor;
      if (other) {
        var posBefore = posLess(pos, anchor);
        if (posBefore != posLess(other, anchor)) {
          anchor = pos;
          pos = other;
        } else if (posBefore != posLess(pos, other)) {
          pos = other;
        }
      }
      setSelection(doc, anchor, pos, bias);
    } else {
      setSelection(doc, pos, other || pos, bias);
    }
    if (doc.cm) doc.cm.curOp.userSelChange = true;
  }

  function filterSelectionChange(doc, anchor, head) {
    var obj = {anchor: anchor, head: head};
    signal(doc, "beforeSelectionChange", doc, obj);
    if (doc.cm) signal(doc.cm, "beforeSelectionChange", doc.cm, obj);
    obj.anchor = clipPos(doc, obj.anchor); obj.head = clipPos(doc, obj.head);
    return obj;
  }

  // Update the selection. Last two args are only used by
  // updateDoc, since they have to be expressed in the line
  // numbers before the update.
  function setSelection(doc, anchor, head, bias, checkAtomic) {
    if (!checkAtomic && hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange")) {
      var filtered = filterSelectionChange(doc, anchor, head);
      head = filtered.head;
      anchor = filtered.anchor;
    }

    var sel = doc.sel;
    sel.goalColumn = null;
    // Skip over atomic spans.
    if (checkAtomic || !posEq(anchor, sel.anchor))
      anchor = skipAtomic(doc, anchor, bias, checkAtomic != "push");
    if (checkAtomic || !posEq(head, sel.head))
      head = skipAtomic(doc, head, bias, checkAtomic != "push");

    if (posEq(sel.anchor, anchor) && posEq(sel.head, head)) return;

    sel.anchor = anchor; sel.head = head;
    var inv = posLess(head, anchor);
    sel.from = inv ? head : anchor;
    sel.to = inv ? anchor : head;

    if (doc.cm)
      doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged =
        doc.cm.curOp.cursorActivity = true;

    signalLater(doc, "cursorActivity", doc);
  }

  function reCheckSelection(cm) {
    setSelection(cm.doc, cm.doc.sel.from, cm.doc.sel.to, null, "push");
  }

  function skipAtomic(doc, pos, bias, mayClear) {
    var flipped = false, curPos = pos;
    var dir = bias || 1;
    doc.cantEdit = false;
    search: for (;;) {
      var line = getLine(doc, curPos.line);
      if (line.markedSpans) {
        for (var i = 0; i < line.markedSpans.length; ++i) {
          var sp = line.markedSpans[i], m = sp.marker;
          if ((sp.from == null || (m.inclusiveLeft ? sp.from <= curPos.ch : sp.from < curPos.ch)) &&
              (sp.to == null || (m.inclusiveRight ? sp.to >= curPos.ch : sp.to > curPos.ch))) {
            if (mayClear) {
              signal(m, "beforeCursorEnter");
              if (m.explicitlyCleared) {
                if (!line.markedSpans) break;
                else {--i; continue;}
              }
            }
            if (!m.atomic) continue;
            var newPos = m.find()[dir < 0 ? "from" : "to"];
            if (posEq(newPos, curPos)) {
              newPos.ch += dir;
              if (newPos.ch < 0) {
                if (newPos.line > doc.first) newPos = clipPos(doc, Pos(newPos.line - 1));
                else newPos = null;
              } else if (newPos.ch > line.text.length) {
                if (newPos.line < doc.first + doc.size - 1) newPos = Pos(newPos.line + 1, 0);
                else newPos = null;
              }
              if (!newPos) {
                if (flipped) {
                  // Driven in a corner -- no valid cursor position found at all
                  // -- try again *with* clearing, if we didn't already
                  if (!mayClear) return skipAtomic(doc, pos, bias, true);
                  // Otherwise, turn off editing until further notice, and return the start of the doc
                  doc.cantEdit = true;
                  return Pos(doc.first, 0);
                }
                flipped = true; newPos = pos; dir = -dir;
              }
            }
            curPos = newPos;
            continue search;
          }
        }
      }
      return curPos;
    }
  }

  // SCROLLING

  function scrollCursorIntoView(cm) {
    var coords = scrollPosIntoView(cm, cm.doc.sel.head, cm.options.cursorScrollMargin);
    if (!cm.state.focused) return;
    var display = cm.display, box = getRect(display.sizer), doScroll = null;
    if (coords.top + box.top < 0) doScroll = true;
    else if (coords.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) doScroll = false;
    if (doScroll != null && !phantom) {
      var hidden = display.cursor.style.display == "none";
      if (hidden) {
        display.cursor.style.display = "";
        display.cursor.style.left = coords.left + "px";
        display.cursor.style.top = (coords.top - display.viewOffset) + "px";
      }
      display.cursor.scrollIntoView(doScroll);
      if (hidden) display.cursor.style.display = "none";
    }
  }

  function scrollPosIntoView(cm, pos, margin) {
    if (margin == null) margin = 0;
    for (;;) {
      var changed = false, coords = cursorCoords(cm, pos);
      var scrollPos = calculateScrollPos(cm, coords.left, coords.top - margin, coords.left, coords.bottom + margin);
      var startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft;
      if (scrollPos.scrollTop != null) {
        setScrollTop(cm, scrollPos.scrollTop);
        if (Math.abs(cm.doc.scrollTop - startTop) > 1) changed = true;
      }
      if (scrollPos.scrollLeft != null) {
        setScrollLeft(cm, scrollPos.scrollLeft);
        if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) changed = true;
      }
      if (!changed) return coords;
    }
  }

  function scrollIntoView(cm, x1, y1, x2, y2) {
    var scrollPos = calculateScrollPos(cm, x1, y1, x2, y2);
    if (scrollPos.scrollTop != null) setScrollTop(cm, scrollPos.scrollTop);
    if (scrollPos.scrollLeft != null) setScrollLeft(cm, scrollPos.scrollLeft);
  }

  function calculateScrollPos(cm, x1, y1, x2, y2) {
    var display = cm.display, snapMargin = textHeight(cm.display);
    if (y1 < 0) y1 = 0;
    var screen = display.scroller.clientHeight - scrollerCutOff, screentop = display.scroller.scrollTop, result = {};
    var docBottom = cm.doc.height + paddingVert(display);
    var atTop = y1 < snapMargin, atBottom = y2 > docBottom - snapMargin;
    if (y1 < screentop) {
      result.scrollTop = atTop ? 0 : y1;
    } else if (y2 > screentop + screen) {
      var newTop = Math.min(y1, (atBottom ? docBottom : y2) - screen);
      if (newTop != screentop) result.scrollTop = newTop;
    }

    var screenw = display.scroller.clientWidth - scrollerCutOff, screenleft = display.scroller.scrollLeft;
    x1 += display.gutters.offsetWidth; x2 += display.gutters.offsetWidth;
    var gutterw = display.gutters.offsetWidth;
    var atLeft = x1 < gutterw + 10;
    if (x1 < screenleft + gutterw || atLeft) {
      if (atLeft) x1 = 0;
      result.scrollLeft = Math.max(0, x1 - 10 - gutterw);
    } else if (x2 > screenw + screenleft - 3) {
      result.scrollLeft = x2 + 10 - screenw;
    }
    return result;
  }

  function updateScrollPos(cm, left, top) {
    cm.curOp.updateScrollPos = {scrollLeft: left == null ? cm.doc.scrollLeft : left,
                                scrollTop: top == null ? cm.doc.scrollTop : top};
  }

  function addToScrollPos(cm, left, top) {
    var pos = cm.curOp.updateScrollPos || (cm.curOp.updateScrollPos = {scrollLeft: cm.doc.scrollLeft, scrollTop: cm.doc.scrollTop});
    var scroll = cm.display.scroller;
    pos.scrollTop = Math.max(0, Math.min(scroll.scrollHeight - scroll.clientHeight, pos.scrollTop + top));
    pos.scrollLeft = Math.max(0, Math.min(scroll.scrollWidth - scroll.clientWidth, pos.scrollLeft + left));
  }

  // API UTILITIES

  function indentLine(cm, n, how, aggressive) {
    var doc = cm.doc;
    if (how == null) how = "add";
    if (how == "smart") {
      if (!cm.doc.mode.indent) how = "prev";
      else var state = getStateBefore(cm, n);
    }

    var tabSize = cm.options.tabSize;
    var line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize);
    var curSpaceString = line.text.match(/^\s*/)[0], indentation;
    if (how == "smart") {
      indentation = cm.doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);
      if (indentation == Pass) {
        if (!aggressive) return;
        how = "prev";
      }
    }
    if (how == "prev") {
      if (n > doc.first) indentation = countColumn(getLine(doc, n-1).text, null, tabSize);
      else indentation = 0;
    } else if (how == "add") {
      indentation = curSpace + cm.options.indentUnit;
    } else if (how == "subtract") {
      indentation = curSpace - cm.options.indentUnit;
    } else if (typeof how == "number") {
      indentation = curSpace + how;
    }
    indentation = Math.max(0, indentation);

    var indentString = "", pos = 0;
    if (cm.options.indentWithTabs)
      for (var i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += "\t";}
    if (pos < indentation) indentString += spaceStr(indentation - pos);

    if (indentString != curSpaceString)
      replaceRange(cm.doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input");
    line.stateAfter = null;
  }

  function changeLine(cm, handle, op) {
    var no = handle, line = handle, doc = cm.doc;
    if (typeof handle == "number") line = getLine(doc, clipLine(doc, handle));
    else no = lineNo(handle);
    if (no == null) return null;
    if (op(line, no)) regChange(cm, no, no + 1);
    else return null;
    return line;
  }

  function findPosH(doc, pos, dir, unit, visually) {
    var line = pos.line, ch = pos.ch, origDir = dir;
    var lineObj = getLine(doc, line);
    var possible = true;
    function findNextLine() {
      var l = line + dir;
      if (l < doc.first || l >= doc.first + doc.size) return (possible = false);
      line = l;
      return lineObj = getLine(doc, l);
    }
    function moveOnce(boundToLine) {
      var next = (visually ? moveVisually : moveLogically)(lineObj, ch, dir, true);
      if (next == null) {
        if (!boundToLine && findNextLine()) {
          if (visually) ch = (dir < 0 ? lineRight : lineLeft)(lineObj);
          else ch = dir < 0 ? lineObj.text.length : 0;
        } else return (possible = false);
      } else ch = next;
      return true;
    }

    if (unit == "char") moveOnce();
    else if (unit == "column") moveOnce(true);
    else if (unit == "word" || unit == "group") {
      var sawType = null, group = unit == "group";
      for (var first = true;; first = false) {
        if (dir < 0 && !moveOnce(!first)) break;
        var cur = lineObj.text.charAt(ch) || "\n";
        var type = isWordChar(cur) ? "w"
          : !group ? null
          : /\s/.test(cur) ? null
          : "p";
        if (sawType && sawType != type) {
          if (dir < 0) {dir = 1; moveOnce();}
          break;
        }
        if (type) sawType = type;
        if (dir > 0 && !moveOnce(!first)) break;
      }
    }
    var result = skipAtomic(doc, Pos(line, ch), origDir, true);
    if (!possible) result.hitSide = true;
    return result;
  }

  function findPosV(cm, pos, dir, unit) {
    var doc = cm.doc, x = pos.left, y;
    if (unit == "page") {
      var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
      y = pos.top + dir * (pageSize - (dir < 0 ? 1.5 : .5) * textHeight(cm.display));
    } else if (unit == "line") {
      y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
    }
    for (;;) {
      var target = coordsChar(cm, x, y);
      if (!target.outside) break;
      if (dir < 0 ? y <= 0 : y >= doc.height) { target.hitSide = true; break; }
      y += dir * 5;
    }
    return target;
  }

  function findWordAt(line, pos) {
    var start = pos.ch, end = pos.ch;
    if (line) {
      if (pos.xRel < 0 || end == line.length) --start; else ++end;
      var startChar = line.charAt(start);
      var check = isWordChar(startChar) ? isWordChar
        : /\s/.test(startChar) ? function(ch) {return /\s/.test(ch);}
        : function(ch) {return !/\s/.test(ch) && !isWordChar(ch);};
      while (start > 0 && check(line.charAt(start - 1))) --start;
      while (end < line.length && check(line.charAt(end))) ++end;
    }
    return {from: Pos(pos.line, start), to: Pos(pos.line, end)};
  }

  function selectLine(cm, line) {
    extendSelection(cm.doc, Pos(line, 0), clipPos(cm.doc, Pos(line + 1, 0)));
  }

  // PROTOTYPE

  // The publicly visible API. Note that operation(null, f) means
  // 'wrap f in an operation, performed on its `this` parameter'

  CodeMirror.prototype = {
    constructor: CodeMirror,
    focus: function(){window.focus(); focusInput(this); onFocus(this); fastPoll(this);},

    setOption: function(option, value) {
      var options = this.options, old = options[option];
      if (options[option] == value && option != "mode") return;
      options[option] = value;
      if (optionHandlers.hasOwnProperty(option))
        operation(this, optionHandlers[option])(this, value, old);
    },

    getOption: function(option) {return this.options[option];},
    getDoc: function() {return this.doc;},

    addKeyMap: function(map, bottom) {
      this.state.keyMaps[bottom ? "push" : "unshift"](map);
    },
    removeKeyMap: function(map) {
      var maps = this.state.keyMaps;
      for (var i = 0; i < maps.length; ++i)
        if ((typeof map == "string" ? maps[i].name : maps[i]) == map) {
          maps.splice(i, 1);
          return true;
        }
    },

    addOverlay: operation(null, function(spec, options) {
      var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);
      if (mode.startState) throw new Error("Overlays may not be stateful.");
      this.state.overlays.push({mode: mode, modeSpec: spec, opaque: options && options.opaque});
      this.state.modeGen++;
      regChange(this);
    }),
    removeOverlay: operation(null, function(spec) {
      var overlays = this.state.overlays;
      for (var i = 0; i < overlays.length; ++i) {
        var cur = overlays[i].modeSpec;
        if (cur == spec || typeof spec == "string" && cur.name == spec) {
          overlays.splice(i, 1);
          this.state.modeGen++;
          regChange(this);
          return;
        }
      }
    }),

    indentLine: operation(null, function(n, dir, aggressive) {
      if (typeof dir != "string" && typeof dir != "number") {
        if (dir == null) dir = this.options.smartIndent ? "smart" : "prev";
        else dir = dir ? "add" : "subtract";
      }
      if (isLine(this.doc, n)) indentLine(this, n, dir, aggressive);
    }),
    indentSelection: operation(null, function(how) {
      var sel = this.doc.sel;
      if (posEq(sel.from, sel.to)) return indentLine(this, sel.from.line, how);
      var e = sel.to.line - (sel.to.ch ? 0 : 1);
      for (var i = sel.from.line; i <= e; ++i) indentLine(this, i, how);
    }),

    // Fetch the parser token for a given character. Useful for hacks
    // that want to inspect the mode state (say, for completion).
    getTokenAt: function(pos, precise) {
      var doc = this.doc;
      pos = clipPos(doc, pos);
      var state = getStateBefore(this, pos.line, precise), mode = this.doc.mode;
      var line = getLine(doc, pos.line);
      var stream = new StringStream(line.text, this.options.tabSize);
      while (stream.pos < pos.ch && !stream.eol()) {
        stream.start = stream.pos;
        var style = mode.token(stream, state);
      }
      return {start: stream.start,
              end: stream.pos,
              string: stream.current(),
              className: style || null, // Deprecated, use 'type' instead
              type: style || null,
              state: state};
    },

    getTokenTypeAt: function(pos) {
      pos = clipPos(this.doc, pos);
      var styles = getLineStyles(this, getLine(this.doc, pos.line));
      var before = 0, after = (styles.length - 1) / 2, ch = pos.ch;
      for (;;) {
        var mid = (before + after) >> 1;
        if ((mid ? styles[mid * 2 - 1] : 0) >= ch) after = mid;
        else if (styles[mid * 2 + 1] < ch) before = mid + 1;
        else return styles[mid * 2 + 2];
      }
    },

    getStateAfter: function(line, precise) {
      var doc = this.doc;
      line = clipLine(doc, line == null ? doc.first + doc.size - 1: line);
      return getStateBefore(this, line + 1, precise);
    },

    cursorCoords: function(start, mode) {
      var pos, sel = this.doc.sel;
      if (start == null) pos = sel.head;
      else if (typeof start == "object") pos = clipPos(this.doc, start);
      else pos = start ? sel.from : sel.to;
      return cursorCoords(this, pos, mode || "page");
    },

    charCoords: function(pos, mode) {
      return charCoords(this, clipPos(this.doc, pos), mode || "page");
    },

    coordsChar: function(coords, mode) {
      coords = fromCoordSystem(this, coords, mode || "page");
      return coordsChar(this, coords.left, coords.top);
    },

    lineAtHeight: function(height, mode) {
      height = fromCoordSystem(this, {top: height, left: 0}, mode || "page").top;
      return lineAtHeight(this.doc, height + this.display.viewOffset);
    },
    heightAtLine: function(line, mode) {
      var end = false, last = this.doc.first + this.doc.size - 1;
      if (line < this.doc.first) line = this.doc.first;
      else if (line > last) { line = last; end = true; }
      var lineObj = getLine(this.doc, line);
      return intoCoordSystem(this, getLine(this.doc, line), {top: 0, left: 0}, mode || "page").top +
        (end ? lineObj.height : 0);
    },

    defaultTextHeight: function() { return textHeight(this.display); },
    defaultCharWidth: function() { return charWidth(this.display); },

    setGutterMarker: operation(null, function(line, gutterID, value) {
      return changeLine(this, line, function(line) {
        var markers = line.gutterMarkers || (line.gutterMarkers = {});
        markers[gutterID] = value;
        if (!value && isEmpty(markers)) line.gutterMarkers = null;
        return true;
      });
    }),

    clearGutter: operation(null, function(gutterID) {
      var cm = this, doc = cm.doc, i = doc.first;
      doc.iter(function(line) {
        if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
          line.gutterMarkers[gutterID] = null;
          regChange(cm, i, i + 1);
          if (isEmpty(line.gutterMarkers)) line.gutterMarkers = null;
        }
        ++i;
      });
    }),

    addLineClass: operation(null, function(handle, where, cls) {
      return changeLine(this, handle, function(line) {
        var prop = where == "text" ? "textClass" : where == "background" ? "bgClass" : "wrapClass";
        if (!line[prop]) line[prop] = cls;
        else if (new RegExp("(?:^|\\s)" + cls + "(?:$|\\s)").test(line[prop])) return false;
        else line[prop] += " " + cls;
        return true;
      });
    }),

    removeLineClass: operation(null, function(handle, where, cls) {
      return changeLine(this, handle, function(line) {
        var prop = where == "text" ? "textClass" : where == "background" ? "bgClass" : "wrapClass";
        var cur = line[prop];
        if (!cur) return false;
        else if (cls == null) line[prop] = null;
        else {
          var found = cur.match(new RegExp("(?:^|\\s+)" + cls + "(?:$|\\s+)"));
          if (!found) return false;
          var end = found.index + found[0].length;
          line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null;
        }
        return true;
      });
    }),

    addLineWidget: operation(null, function(handle, node, options) {
      return addLineWidget(this, handle, node, options);
    }),

    removeLineWidget: function(widget) { widget.clear(); },

    lineInfo: function(line) {
      if (typeof line == "number") {
        if (!isLine(this.doc, line)) return null;
        var n = line;
        line = getLine(this.doc, line);
        if (!line) return null;
      } else {
        var n = lineNo(line);
        if (n == null) return null;
      }
      return {line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,
              textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,
              widgets: line.widgets};
    },

    getViewport: function() { return {from: this.display.showingFrom, to: this.display.showingTo};},

    addWidget: function(pos, node, scroll, vert, horiz) {
      var display = this.display;
      pos = cursorCoords(this, clipPos(this.doc, pos));
      var top = pos.bottom, left = pos.left;
      node.style.position = "absolute";
      display.sizer.appendChild(node);
      if (vert == "over") {
        top = pos.top;
      } else if (vert == "above" || vert == "near") {
        var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),
        hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
        // Default to positioning above (if specified and possible); otherwise default to positioning below
        if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
          top = pos.top - node.offsetHeight;
        else if (pos.bottom + node.offsetHeight <= vspace)
          top = pos.bottom;
        if (left + node.offsetWidth > hspace)
          left = hspace - node.offsetWidth;
      }
      node.style.top = top + "px";
      node.style.left = node.style.right = "";
      if (horiz == "right") {
        left = display.sizer.clientWidth - node.offsetWidth;
        node.style.right = "0px";
      } else {
        if (horiz == "left") left = 0;
        else if (horiz == "middle") left = (display.sizer.clientWidth - node.offsetWidth) / 2;
        node.style.left = left + "px";
      }
      if (scroll)
        scrollIntoView(this, left, top, left + node.offsetWidth, top + node.offsetHeight);
    },

    triggerOnKeyDown: operation(null, onKeyDown),

    execCommand: function(cmd) {return commands[cmd](this);},

    findPosH: function(from, amount, unit, visually) {
      var dir = 1;
      if (amount < 0) { dir = -1; amount = -amount; }
      for (var i = 0, cur = clipPos(this.doc, from); i < amount; ++i) {
        cur = findPosH(this.doc, cur, dir, unit, visually);
        if (cur.hitSide) break;
      }
      return cur;
    },

    moveH: operation(null, function(dir, unit) {
      var sel = this.doc.sel, pos;
      if (sel.shift || sel.extend || posEq(sel.from, sel.to))
        pos = findPosH(this.doc, sel.head, dir, unit, this.options.rtlMoveVisually);
      else
        pos = dir < 0 ? sel.from : sel.to;
      extendSelection(this.doc, pos, pos, dir);
    }),

    deleteH: operation(null, function(dir, unit) {
      var sel = this.doc.sel;
      if (!posEq(sel.from, sel.to)) replaceRange(this.doc, "", sel.from, sel.to, "+delete");
      else replaceRange(this.doc, "", sel.from, findPosH(this.doc, sel.head, dir, unit, false), "+delete");
      this.curOp.userSelChange = true;
    }),

    findPosV: function(from, amount, unit, goalColumn) {
      var dir = 1, x = goalColumn;
      if (amount < 0) { dir = -1; amount = -amount; }
      for (var i = 0, cur = clipPos(this.doc, from); i < amount; ++i) {
        var coords = cursorCoords(this, cur, "div");
        if (x == null) x = coords.left;
        else coords.left = x;
        cur = findPosV(this, coords, dir, unit);
        if (cur.hitSide) break;
      }
      return cur;
    },

    moveV: operation(null, function(dir, unit) {
      var sel = this.doc.sel;
      var pos = cursorCoords(this, sel.head, "div");
      if (sel.goalColumn != null) pos.left = sel.goalColumn;
      var target = findPosV(this, pos, dir, unit);

      if (unit == "page") addToScrollPos(this, 0, charCoords(this, target, "div").top - pos.top);
      extendSelection(this.doc, target, target, dir);
      sel.goalColumn = pos.left;
    }),

    toggleOverwrite: function(value) {
      if (value != null && value == this.state.overwrite) return;
      if (this.state.overwrite = !this.state.overwrite)
        this.display.cursor.className += " CodeMirror-overwrite";
      else
        this.display.cursor.className = this.display.cursor.className.replace(" CodeMirror-overwrite", "");
    },
    hasFocus: function() { return this.state.focused; },

    scrollTo: operation(null, function(x, y) {
      updateScrollPos(this, x, y);
    }),
    getScrollInfo: function() {
      var scroller = this.display.scroller, co = scrollerCutOff;
      return {left: scroller.scrollLeft, top: scroller.scrollTop,
              height: scroller.scrollHeight - co, width: scroller.scrollWidth - co,
              clientHeight: scroller.clientHeight - co, clientWidth: scroller.clientWidth - co};
    },

    scrollIntoView: operation(null, function(pos, margin) {
      if (typeof pos == "number") pos = Pos(pos, 0);
      if (!margin) margin = 0;
      var coords = pos;

      if (!pos || pos.line != null) {
        this.curOp.scrollToPos = pos ? clipPos(this.doc, pos) : this.doc.sel.head;
        this.curOp.scrollToPosMargin = margin;
        coords = cursorCoords(this, this.curOp.scrollToPos);
      }
      var sPos = calculateScrollPos(this, coords.left, coords.top - margin, coords.right, coords.bottom + margin);
      updateScrollPos(this, sPos.scrollLeft, sPos.scrollTop);
    }),

    setSize: function(width, height) {
      function interpret(val) {
        return typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val;
      }
      if (width != null) this.display.wrapper.style.width = interpret(width);
      if (height != null) this.display.wrapper.style.height = interpret(height);
      this.refresh();
    },

    on: function(type, f) {on(this, type, f);},
    off: function(type, f) {off(this, type, f);},

    operation: function(f){return runInOp(this, f);},

    refresh: operation(null, function() {
      clearCaches(this);
      updateScrollPos(this, this.doc.scrollLeft, this.doc.scrollTop);
      regChange(this);
    }),

    swapDoc: operation(null, function(doc) {
      var old = this.doc;
      old.cm = null;
      attachDoc(this, doc);
      clearCaches(this);
      resetInput(this, true);
      updateScrollPos(this, doc.scrollLeft, doc.scrollTop);
      return old;
    }),

    getInputField: function(){return this.display.input;},
    getWrapperElement: function(){return this.display.wrapper;},
    getScrollerElement: function(){return this.display.scroller;},
    getGutterElement: function(){return this.display.gutters;}
  };

  // OPTION DEFAULTS

  var optionHandlers = CodeMirror.optionHandlers = {};

  // The default configuration options.
  var defaults = CodeMirror.defaults = {};

  function option(name, deflt, handle, notOnInit) {
    CodeMirror.defaults[name] = deflt;
    if (handle) optionHandlers[name] =
      notOnInit ? function(cm, val, old) {if (old != Init) handle(cm, val, old);} : handle;
  }

  var Init = CodeMirror.Init = {toString: function(){return "CodeMirror.Init";}};

  // These two are, on init, called from the constructor because they
  // have to be initialized before the editor can start at all.
  option("value", "", function(cm, val) {
    cm.setValue(val);
  }, true);
  option("mode", null, function(cm, val) {
    cm.doc.modeOption = val;
    loadMode(cm);
  }, true);

  option("indentUnit", 2, loadMode, true);
  option("indentWithTabs", false);
  option("smartIndent", true);
  option("tabSize", 4, function(cm) {
    loadMode(cm);
    clearCaches(cm);
    regChange(cm);
  }, true);
  option("electricChars", true);
  option("rtlMoveVisually", !windows);

  option("theme", "default", function(cm) {
    themeChanged(cm);
    guttersChanged(cm);
  }, true);
  option("keyMap", "default", keyMapChanged);
  option("extraKeys", null);

  option("onKeyEvent", null);
  option("onDragEvent", null);

  option("lineWrapping", false, wrappingChanged, true);
  option("gutters", [], function(cm) {
    setGuttersForLineNumbers(cm.options);
    guttersChanged(cm);
  }, true);
  option("fixedGutter", true, function(cm, val) {
    cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0";
    cm.refresh();
  }, true);
  option("coverGutterNextToScrollbar", false, updateScrollbars, true);
  option("lineNumbers", false, function(cm) {
    setGuttersForLineNumbers(cm.options);
    guttersChanged(cm);
  }, true);
  option("firstLineNumber", 1, guttersChanged, true);
  option("lineNumberFormatter", function(integer) {return integer;}, guttersChanged, true);
  option("showCursorWhenSelecting", false, updateSelection, true);

  option("readOnly", false, function(cm, val) {
    if (val == "nocursor") {onBlur(cm); cm.display.input.blur();}
    else if (!val) resetInput(cm, true);
  });
  option("dragDrop", true);

  option("cursorBlinkRate", 530);
  option("cursorScrollMargin", 0);
  option("cursorHeight", 1);
  option("workTime", 100);
  option("workDelay", 100);
  option("flattenSpans", true);
  option("pollInterval", 100);
  option("undoDepth", 40, function(cm, val){cm.doc.history.undoDepth = val;});
  option("historyEventDelay", 500);
  option("viewportMargin", 10, function(cm){cm.refresh();}, true);
  option("maxHighlightLength", 10000, function(cm){loadMode(cm); cm.refresh();}, true);
  option("moveInputWithCursor", true, function(cm, val) {
    if (!val) cm.display.inputDiv.style.top = cm.display.inputDiv.style.left = 0;
  });

  option("tabindex", null, function(cm, val) {
    cm.display.input.tabIndex = val || "";
  });
  option("autofocus", null);

  // MODE DEFINITION AND QUERYING

  // Known modes, by name and by MIME
  var modes = CodeMirror.modes = {}, mimeModes = CodeMirror.mimeModes = {};

  CodeMirror.defineMode = function(name, mode) {
    if (!CodeMirror.defaults.mode && name != "null") CodeMirror.defaults.mode = name;
    if (arguments.length > 2) {
      mode.dependencies = [];
      for (var i = 2; i < arguments.length; ++i) mode.dependencies.push(arguments[i]);
    }
    modes[name] = mode;
  };

  CodeMirror.defineMIME = function(mime, spec) {
    mimeModes[mime] = spec;
  };

  CodeMirror.resolveMode = function(spec) {
    if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
      spec = mimeModes[spec];
    } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
      var found = mimeModes[spec.name];
      spec = createObj(found, spec);
      spec.name = found.name;
    } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
      return CodeMirror.resolveMode("application/xml");
    }
    if (typeof spec == "string") return {name: spec};
    else return spec || {name: "null"};
  };

  CodeMirror.getMode = function(options, spec) {
    spec = CodeMirror.resolveMode(spec);
    var mfactory = modes[spec.name];
    if (!mfactory) return CodeMirror.getMode(options, "text/plain");
    var modeObj = mfactory(options, spec);
    if (modeExtensions.hasOwnProperty(spec.name)) {
      var exts = modeExtensions[spec.name];
      for (var prop in exts) {
        if (!exts.hasOwnProperty(prop)) continue;
        if (modeObj.hasOwnProperty(prop)) modeObj["_" + prop] = modeObj[prop];
        modeObj[prop] = exts[prop];
      }
    }
    modeObj.name = spec.name;
    return modeObj;
  };

  CodeMirror.defineMode("null", function() {
    return {token: function(stream) {stream.skipToEnd();}};
  });
  CodeMirror.defineMIME("text/plain", "null");

  var modeExtensions = CodeMirror.modeExtensions = {};
  CodeMirror.extendMode = function(mode, properties) {
    var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {});
    copyObj(properties, exts);
  };

  // EXTENSIONS

  CodeMirror.defineExtension = function(name, func) {
    CodeMirror.prototype[name] = func;
  };
  CodeMirror.defineDocExtension = function(name, func) {
    Doc.prototype[name] = func;
  };
  CodeMirror.defineOption = option;

  var initHooks = [];
  CodeMirror.defineInitHook = function(f) {initHooks.push(f);};

  // MODE STATE HANDLING

  // Utility functions for working with state. Exported because modes
  // sometimes need to do this.
  function copyState(mode, state) {
    if (state === true) return state;
    if (mode.copyState) return mode.copyState(state);
    var nstate = {};
    for (var n in state) {
      var val = state[n];
      if (val instanceof Array) val = val.concat([]);
      nstate[n] = val;
    }
    return nstate;
  }
  CodeMirror.copyState = copyState;

  function startState(mode, a1, a2) {
    return mode.startState ? mode.startState(a1, a2) : true;
  }
  CodeMirror.startState = startState;

  CodeMirror.innerMode = function(mode, state) {
    while (mode.innerMode) {
      var info = mode.innerMode(state);
      state = info.state;
      mode = info.mode;
    }
    return info || {mode: mode, state: state};
  };

  // STANDARD COMMANDS

  var commands = CodeMirror.commands = {
    selectAll: function(cm) {cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()));},
    killLine: function(cm) {
      var from = cm.getCursor(true), to = cm.getCursor(false), sel = !posEq(from, to);
      if (!sel && cm.getLine(from.line).length == from.ch)
        cm.replaceRange("", from, Pos(from.line + 1, 0), "+delete");
      else cm.replaceRange("", from, sel ? to : Pos(from.line), "+delete");
    },
    deleteLine: function(cm) {
      var l = cm.getCursor().line;
      cm.replaceRange("", Pos(l, 0), Pos(l), "+delete");
    },
    delLineLeft: function(cm) {
      var cur = cm.getCursor();
      cm.replaceRange("", Pos(cur.line, 0), cur, "+delete");
    },
    undo: function(cm) {cm.undo();},
    redo: function(cm) {cm.redo();},
    goDocStart: function(cm) {cm.extendSelection(Pos(cm.firstLine(), 0));},
    goDocEnd: function(cm) {cm.extendSelection(Pos(cm.lastLine()));},
    goLineStart: function(cm) {
      cm.extendSelection(lineStart(cm, cm.getCursor().line));
    },
    goLineStartSmart: function(cm) {
      var cur = cm.getCursor(), start = lineStart(cm, cur.line);
      var line = cm.getLineHandle(start.line);
      var order = getOrder(line);
      if (!order || order[0].level == 0) {
        var firstNonWS = Math.max(0, line.text.search(/\S/));
        var inWS = cur.line == start.line && cur.ch <= firstNonWS && cur.ch;
        cm.extendSelection(Pos(start.line, inWS ? 0 : firstNonWS));
      } else cm.extendSelection(start);
    },
    goLineEnd: function(cm) {
      cm.extendSelection(lineEnd(cm, cm.getCursor().line));
    },
    goLineRight: function(cm) {
      var top = cm.charCoords(cm.getCursor(), "div").top + 5;
      cm.extendSelection(cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div"));
    },
    goLineLeft: function(cm) {
      var top = cm.charCoords(cm.getCursor(), "div").top + 5;
      cm.extendSelection(cm.coordsChar({left: 0, top: top}, "div"));
    },
    goLineUp: function(cm) {cm.moveV(-1, "line");},
    goLineDown: function(cm) {cm.moveV(1, "line");},
    goPageUp: function(cm) {cm.moveV(-1, "page");},
    goPageDown: function(cm) {cm.moveV(1, "page");},
    goCharLeft: function(cm) {cm.moveH(-1, "char");},
    goCharRight: function(cm) {cm.moveH(1, "char");},
    goColumnLeft: function(cm) {cm.moveH(-1, "column");},
    goColumnRight: function(cm) {cm.moveH(1, "column");},
    goWordLeft: function(cm) {cm.moveH(-1, "word");},
    goGroupRight: function(cm) {cm.moveH(1, "group");},
    goGroupLeft: function(cm) {cm.moveH(-1, "group");},
    goWordRight: function(cm) {cm.moveH(1, "word");},
    delCharBefore: function(cm) {cm.deleteH(-1, "char");},
    delCharAfter: function(cm) {cm.deleteH(1, "char");},
    delWordBefore: function(cm) {cm.deleteH(-1, "word");},
    delWordAfter: function(cm) {cm.deleteH(1, "word");},
    delGroupBefore: function(cm) {cm.deleteH(-1, "group");},
    delGroupAfter: function(cm) {cm.deleteH(1, "group");},
    indentAuto: function(cm) {cm.indentSelection("smart");},
    indentMore: function(cm) {cm.indentSelection("add");},
    indentLess: function(cm) {cm.indentSelection("subtract");},
    insertTab: function(cm) {cm.replaceSelection("\t", "end", "+input");},
    defaultTab: function(cm) {
      if (cm.somethingSelected()) cm.indentSelection("add");
      else cm.replaceSelection("\t", "end", "+input");
    },
    transposeChars: function(cm) {
      var cur = cm.getCursor(), line = cm.getLine(cur.line);
      if (cur.ch > 0 && cur.ch < line.length - 1)
        cm.replaceRange(line.charAt(cur.ch) + line.charAt(cur.ch - 1),
                        Pos(cur.line, cur.ch - 1), Pos(cur.line, cur.ch + 1));
    },
    newlineAndIndent: function(cm) {
      operation(cm, function() {
        cm.replaceSelection("\n", "end", "+input");
        cm.indentLine(cm.getCursor().line, null, true);
      })();
    },
    toggleOverwrite: function(cm) {cm.toggleOverwrite();}
  };

  // STANDARD KEYMAPS

  var keyMap = CodeMirror.keyMap = {};
  keyMap.basic = {
    "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
    "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
    "Delete": "delCharAfter", "Backspace": "delCharBefore", "Tab": "defaultTab", "Shift-Tab": "indentAuto",
    "Enter": "newlineAndIndent", "Insert": "toggleOverwrite"
  };
  // Note that the save and find-related commands aren't defined by
  // default. Unknown commands are simply ignored.
  keyMap.pcDefault = {
    "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
    "Ctrl-Home": "goDocStart", "Alt-Up": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Down": "goDocEnd",
    "Ctrl-Left": "goGroupLeft", "Ctrl-Right": "goGroupRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
    "Ctrl-Backspace": "delGroupBefore", "Ctrl-Delete": "delGroupAfter", "Ctrl-S": "save", "Ctrl-F": "find",
    "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
    "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
    fallthrough: "basic"
  };
  keyMap.macDefault = {
    "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
    "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goGroupLeft",
    "Alt-Right": "goGroupRight", "Cmd-Left": "goLineStart", "Cmd-Right": "goLineEnd", "Alt-Backspace": "delGroupBefore",
    "Ctrl-Alt-Backspace": "delGroupAfter", "Alt-Delete": "delGroupAfter", "Cmd-S": "save", "Cmd-F": "find",
    "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
    "Cmd-[": "indentLess", "Cmd-]": "indentMore", "Cmd-Backspace": "delLineLeft",
    fallthrough: ["basic", "emacsy"]
  };
  keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;
  keyMap.emacsy = {
    "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
    "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
    "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharAfter", "Ctrl-H": "delCharBefore",
    "Alt-D": "delWordAfter", "Alt-Backspace": "delWordBefore", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars"
  };

  // KEYMAP DISPATCH

  function getKeyMap(val) {
    if (typeof val == "string") return keyMap[val];
    else return val;
  }

  function lookupKey(name, maps, handle) {
    function lookup(map) {
      map = getKeyMap(map);
      var found = map[name];
      if (found === false) return "stop";
      if (found != null && handle(found)) return true;
      if (map.nofallthrough) return "stop";

      var fallthrough = map.fallthrough;
      if (fallthrough == null) return false;
      if (Object.prototype.toString.call(fallthrough) != "[object Array]")
        return lookup(fallthrough);
      for (var i = 0, e = fallthrough.length; i < e; ++i) {
        var done = lookup(fallthrough[i]);
        if (done) return done;
      }
      return false;
    }

    for (var i = 0; i < maps.length; ++i) {
      var done = lookup(maps[i]);
      if (done) return done != "stop";
    }
  }
  function isModifierKey(event) {
    var name = keyNames[event.keyCode];
    return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";
  }
  function keyName(event, noShift) {
    if (opera && event.keyCode == 34 && event["char"]) return false;
    var name = keyNames[event.keyCode];
    if (name == null || event.altGraphKey) return false;
    if (event.altKey) name = "Alt-" + name;
    if (flipCtrlCmd ? event.metaKey : event.ctrlKey) name = "Ctrl-" + name;
    if (flipCtrlCmd ? event.ctrlKey : event.metaKey) name = "Cmd-" + name;
    if (!noShift && event.shiftKey) name = "Shift-" + name;
    return name;
  }
  CodeMirror.lookupKey = lookupKey;
  CodeMirror.isModifierKey = isModifierKey;
  CodeMirror.keyName = keyName;

  // FROMTEXTAREA

  CodeMirror.fromTextArea = function(textarea, options) {
    if (!options) options = {};
    options.value = textarea.value;
    if (!options.tabindex && textarea.tabindex)
      options.tabindex = textarea.tabindex;
    if (!options.placeholder && textarea.placeholder)
      options.placeholder = textarea.placeholder;
    // Set autofocus to true if this textarea is focused, or if it has
    // autofocus and no other element is focused.
    if (options.autofocus == null) {
      var hasFocus = document.body;
      // doc.activeElement occasionally throws on IE
      try { hasFocus = document.activeElement; } catch(e) {}
      options.autofocus = hasFocus == textarea ||
        textarea.getAttribute("autofocus") != null && hasFocus == document.body;
    }

    function save() {textarea.value = cm.getValue();}
    if (textarea.form) {
      on(textarea.form, "submit", save);
      // Deplorable hack to make the submit method do the right thing.
      if (!options.leaveSubmitMethodAlone) {
        var form = textarea.form, realSubmit = form.submit;
        try {
          var wrappedSubmit = form.submit = function() {
            save();
            form.submit = realSubmit;
            form.submit();
            form.submit = wrappedSubmit;
          };
        } catch(e) {}
      }
    }

    textarea.style.display = "none";
    var cm = CodeMirror(function(node) {
      textarea.parentNode.insertBefore(node, textarea.nextSibling);
    }, options);
    cm.save = save;
    cm.getTextArea = function() { return textarea; };
    cm.toTextArea = function() {
      save();
      textarea.parentNode.removeChild(cm.getWrapperElement());
      textarea.style.display = "";
      if (textarea.form) {
        off(textarea.form, "submit", save);
        if (typeof textarea.form.submit == "function")
          textarea.form.submit = realSubmit;
      }
    };
    return cm;
  };

  // STRING STREAM

  // Fed to the mode parsers, provides helper functions to make
  // parsers more succinct.

  // The character stream used by a mode's parser.
  function StringStream(string, tabSize) {
    this.pos = this.start = 0;
    this.string = string;
    this.tabSize = tabSize || 8;
    this.lastColumnPos = this.lastColumnValue = 0;
  }

  StringStream.prototype = {
    eol: function() {return this.pos >= this.string.length;},
    sol: function() {return this.pos == 0;},
    peek: function() {return this.string.charAt(this.pos) || undefined;},
    next: function() {
      if (this.pos < this.string.length)
        return this.string.charAt(this.pos++);
    },
    eat: function(match) {
      var ch = this.string.charAt(this.pos);
      if (typeof match == "string") var ok = ch == match;
      else var ok = ch && (match.test ? match.test(ch) : match(ch));
      if (ok) {++this.pos; return ch;}
    },
    eatWhile: function(match) {
      var start = this.pos;
      while (this.eat(match)){}
      return this.pos > start;
    },
    eatSpace: function() {
      var start = this.pos;
      while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
      return this.pos > start;
    },
    skipToEnd: function() {this.pos = this.string.length;},
    skipTo: function(ch) {
      var found = this.string.indexOf(ch, this.pos);
      if (found > -1) {this.pos = found; return true;}
    },
    backUp: function(n) {this.pos -= n;},
    column: function() {
      if (this.lastColumnPos < this.start) {
        this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
        this.lastColumnPos = this.start;
      }
      return this.lastColumnValue;
    },
    indentation: function() {return countColumn(this.string, null, this.tabSize);},
    match: function(pattern, consume, caseInsensitive) {
      if (typeof pattern == "string") {
        var cased = function(str) {return caseInsensitive ? str.toLowerCase() : str;};
        var substr = this.string.substr(this.pos, pattern.length);
        if (cased(substr) == cased(pattern)) {
          if (consume !== false) this.pos += pattern.length;
          return true;
        }
      } else {
        var match = this.string.slice(this.pos).match(pattern);
        if (match && match.index > 0) return null;
        if (match && consume !== false) this.pos += match[0].length;
        return match;
      }
    },
    current: function(){return this.string.slice(this.start, this.pos);}
  };
  CodeMirror.StringStream = StringStream;

  // TEXTMARKERS

  function TextMarker(doc, type) {
    this.lines = [];
    this.type = type;
    this.doc = doc;
  }
  CodeMirror.TextMarker = TextMarker;

  TextMarker.prototype.clear = function() {
    if (this.explicitlyCleared) return;
    var cm = this.doc.cm, withOp = cm && !cm.curOp;
    if (withOp) startOperation(cm);
    var min = null, max = null;
    for (var i = 0; i < this.lines.length; ++i) {
      var line = this.lines[i];
      var span = getMarkedSpanFor(line.markedSpans, this);
      if (span.to != null) max = lineNo(line);
      line.markedSpans = removeMarkedSpan(line.markedSpans, span);
      if (span.from != null)
        min = lineNo(line);
      else if (this.collapsed && !lineIsHidden(this.doc, line) && cm)
        updateLineHeight(line, textHeight(cm.display));
    }
    if (cm && this.collapsed && !cm.options.lineWrapping) for (var i = 0; i < this.lines.length; ++i) {
      var visual = visualLine(cm.doc, this.lines[i]), len = lineLength(cm.doc, visual);
      if (len > cm.display.maxLineLength) {
        cm.display.maxLine = visual;
        cm.display.maxLineLength = len;
        cm.display.maxLineChanged = true;
      }
    }

    if (min != null && cm) regChange(cm, min, max + 1);
    this.lines.length = 0;
    this.explicitlyCleared = true;
    if (this.atomic && this.doc.cantEdit) {
      this.doc.cantEdit = false;
      if (cm) reCheckSelection(cm);
    }
    if (withOp) endOperation(cm);
    signalLater(this, "clear");
  };

  TextMarker.prototype.find = function() {
    var from, to;
    for (var i = 0; i < this.lines.length; ++i) {
      var line = this.lines[i];
      var span = getMarkedSpanFor(line.markedSpans, this);
      if (span.from != null || span.to != null) {
        var found = lineNo(line);
        if (span.from != null) from = Pos(found, span.from);
        if (span.to != null) to = Pos(found, span.to);
      }
    }
    if (this.type == "bookmark") return from;
    return from && {from: from, to: to};
  };

  TextMarker.prototype.changed = function() {
    var pos = this.find(), cm = this.doc.cm;
    if (!pos || !cm) return;
    var line = getLine(this.doc, pos.from.line);
    clearCachedMeasurement(cm, line);
    if (pos.from.line >= cm.display.showingFrom && pos.from.line < cm.display.showingTo) {
      for (var node = cm.display.lineDiv.firstChild; node; node = node.nextSibling) if (node.lineObj == line) {
        if (node.offsetHeight != line.height) updateLineHeight(line, node.offsetHeight);
        break;
      }
      runInOp(cm, function() { cm.curOp.selectionChanged = true; });
    }
  };

  TextMarker.prototype.attachLine = function(line) {
    if (!this.lines.length && this.doc.cm) {
      var op = this.doc.cm.curOp;
      if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)
        (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);
    }
    this.lines.push(line);
  };
  TextMarker.prototype.detachLine = function(line) {
    this.lines.splice(indexOf(this.lines, line), 1);
    if (!this.lines.length && this.doc.cm) {
      var op = this.doc.cm.curOp;
      (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
    }
  };

  function markText(doc, from, to, options, type) {
    if (options && options.shared) return markTextShared(doc, from, to, options, type);
    if (doc.cm && !doc.cm.curOp) return operation(doc.cm, markText)(doc, from, to, options, type);

    var marker = new TextMarker(doc, type);
    if (type == "range" && !posLess(from, to)) return marker;
    if (options) copyObj(options, marker);
    if (marker.replacedWith) {
      marker.collapsed = true;
      marker.replacedWith = elt("span", [marker.replacedWith], "CodeMirror-widget");
      if (!options.handleMouseEvents) marker.replacedWith.ignoreEvents = true;
    }
    if (marker.collapsed) sawCollapsedSpans = true;

    if (marker.addToHistory)
      addToHistory(doc, {from: from, to: to, origin: "markText"},
                   {head: doc.sel.head, anchor: doc.sel.anchor}, NaN);

    var curLine = from.line, size = 0, collapsedAtStart, collapsedAtEnd, cm = doc.cm, updateMaxLine;
    doc.iter(curLine, to.line + 1, function(line) {
      if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(doc, line) == cm.display.maxLine)
        updateMaxLine = true;
      var span = {from: null, to: null, marker: marker};
      size += line.text.length;
      if (curLine == from.line) {span.from = from.ch; size -= from.ch;}
      if (curLine == to.line) {span.to = to.ch; size -= line.text.length - to.ch;}
      if (marker.collapsed) {
        if (curLine == to.line) collapsedAtEnd = collapsedSpanAt(line, to.ch);
        if (curLine == from.line) collapsedAtStart = collapsedSpanAt(line, from.ch);
        else updateLineHeight(line, 0);
      }
      addMarkedSpan(line, span);
      ++curLine;
    });
    if (marker.collapsed) doc.iter(from.line, to.line + 1, function(line) {
      if (lineIsHidden(doc, line)) updateLineHeight(line, 0);
    });

    if (marker.clearOnEnter) on(marker, "beforeCursorEnter", function() { marker.clear(); });

    if (marker.readOnly) {
      sawReadOnlySpans = true;
      if (doc.history.done.length || doc.history.undone.length)
        doc.clearHistory();
    }
    if (marker.collapsed) {
      if (collapsedAtStart != collapsedAtEnd)
        throw new Error("Inserting collapsed marker overlapping an existing one");
      marker.size = size;
      marker.atomic = true;
    }
    if (cm) {
      if (updateMaxLine) cm.curOp.updateMaxLine = true;
      if (marker.className || marker.startStyle || marker.endStyle || marker.collapsed)
        regChange(cm, from.line, to.line + 1);
      if (marker.atomic) reCheckSelection(cm);
    }
    return marker;
  }

  // SHARED TEXTMARKERS

  function SharedTextMarker(markers, primary) {
    this.markers = markers;
    this.primary = primary;
    for (var i = 0, me = this; i < markers.length; ++i) {
      markers[i].parent = this;
      on(markers[i], "clear", function(){me.clear();});
    }
  }
  CodeMirror.SharedTextMarker = SharedTextMarker;

  SharedTextMarker.prototype.clear = function() {
    if (this.explicitlyCleared) return;
    this.explicitlyCleared = true;
    for (var i = 0; i < this.markers.length; ++i)
      this.markers[i].clear();
    signalLater(this, "clear");
  };
  SharedTextMarker.prototype.find = function() {
    return this.primary.find();
  };

  function markTextShared(doc, from, to, options, type) {
    options = copyObj(options);
    options.shared = false;
    var markers = [markText(doc, from, to, options, type)], primary = markers[0];
    var widget = options.replacedWith;
    linkedDocs(doc, function(doc) {
      if (widget) options.replacedWith = widget.cloneNode(true);
      markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type));
      for (var i = 0; i < doc.linked.length; ++i)
        if (doc.linked[i].isParent) return;
      primary = lst(markers);
    });
    return new SharedTextMarker(markers, primary);
  }

  // TEXTMARKER SPANS

  function getMarkedSpanFor(spans, marker) {
    if (spans) for (var i = 0; i < spans.length; ++i) {
      var span = spans[i];
      if (span.marker == marker) return span;
    }
  }
  function removeMarkedSpan(spans, span) {
    for (var r, i = 0; i < spans.length; ++i)
      if (spans[i] != span) (r || (r = [])).push(spans[i]);
    return r;
  }
  function addMarkedSpan(line, span) {
    line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];
    span.marker.attachLine(line);
  }

  function markedSpansBefore(old, startCh, isInsert) {
    if (old) for (var i = 0, nw; i < old.length; ++i) {
      var span = old[i], marker = span.marker;
      var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
      if (startsBefore || marker.type == "bookmark" && span.from == startCh && (!isInsert || !span.marker.insertLeft)) {
        var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh);
        (nw || (nw = [])).push({from: span.from,
                                to: endsAfter ? null : span.to,
                                marker: marker});
      }
    }
    return nw;
  }

  function markedSpansAfter(old, endCh, isInsert) {
    if (old) for (var i = 0, nw; i < old.length; ++i) {
      var span = old[i], marker = span.marker;
      var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
      if (endsAfter || marker.type == "bookmark" && span.from == endCh && (!isInsert || span.marker.insertLeft)) {
        var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh);
        (nw || (nw = [])).push({from: startsBefore ? null : span.from - endCh,
                                to: span.to == null ? null : span.to - endCh,
                                marker: marker});
      }
    }
    return nw;
  }

  function stretchSpansOverChange(doc, change) {
    var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;
    var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;
    if (!oldFirst && !oldLast) return null;

    var startCh = change.from.ch, endCh = change.to.ch, isInsert = posEq(change.from, change.to);
    // Get the spans that 'stick out' on both sides
    var first = markedSpansBefore(oldFirst, startCh, isInsert);
    var last = markedSpansAfter(oldLast, endCh, isInsert);

    // Next, merge those two ends
    var sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0);
    if (first) {
      // Fix up .to properties of first
      for (var i = 0; i < first.length; ++i) {
        var span = first[i];
        if (span.to == null) {
          var found = getMarkedSpanFor(last, span.marker);
          if (!found) span.to = startCh;
          else if (sameLine) span.to = found.to == null ? null : found.to + offset;
        }
      }
    }
    if (last) {
      // Fix up .from in last (or move them into first in case of sameLine)
      for (var i = 0; i < last.length; ++i) {
        var span = last[i];
        if (span.to != null) span.to += offset;
        if (span.from == null) {
          var found = getMarkedSpanFor(first, span.marker);
          if (!found) {
            span.from = offset;
            if (sameLine) (first || (first = [])).push(span);
          }
        } else {
          span.from += offset;
          if (sameLine) (first || (first = [])).push(span);
        }
      }
    }
    if (sameLine && first) {
      // Make sure we didn't create any zero-length spans
      for (var i = 0; i < first.length; ++i)
        if (first[i].from != null && first[i].from == first[i].to && first[i].marker.type != "bookmark")
          first.splice(i--, 1);
      if (!first.length) first = null;
    }

    var newMarkers = [first];
    if (!sameLine) {
      // Fill gap with whole-line-spans
      var gap = change.text.length - 2, gapMarkers;
      if (gap > 0 && first)
        for (var i = 0; i < first.length; ++i)
          if (first[i].to == null)
            (gapMarkers || (gapMarkers = [])).push({from: null, to: null, marker: first[i].marker});
      for (var i = 0; i < gap; ++i)
        newMarkers.push(gapMarkers);
      newMarkers.push(last);
    }
    return newMarkers;
  }

  function mergeOldSpans(doc, change) {
    var old = getOldSpans(doc, change);
    var stretched = stretchSpansOverChange(doc, change);
    if (!old) return stretched;
    if (!stretched) return old;

    for (var i = 0; i < old.length; ++i) {
      var oldCur = old[i], stretchCur = stretched[i];
      if (oldCur && stretchCur) {
        spans: for (var j = 0; j < stretchCur.length; ++j) {
          var span = stretchCur[j];
          for (var k = 0; k < oldCur.length; ++k)
            if (oldCur[k].marker == span.marker) continue spans;
          oldCur.push(span);
        }
      } else if (stretchCur) {
        old[i] = stretchCur;
      }
    }
    return old;
  }

  function removeReadOnlyRanges(doc, from, to) {
    var markers = null;
    doc.iter(from.line, to.line + 1, function(line) {
      if (line.markedSpans) for (var i = 0; i < line.markedSpans.length; ++i) {
        var mark = line.markedSpans[i].marker;
        if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))
          (markers || (markers = [])).push(mark);
      }
    });
    if (!markers) return null;
    var parts = [{from: from, to: to}];
    for (var i = 0; i < markers.length; ++i) {
      var mk = markers[i], m = mk.find();
      for (var j = 0; j < parts.length; ++j) {
        var p = parts[j];
        if (posLess(p.to, m.from) || posLess(m.to, p.from)) continue;
        var newParts = [j, 1];
        if (posLess(p.from, m.from) || !mk.inclusiveLeft && posEq(p.from, m.from))
          newParts.push({from: p.from, to: m.from});
        if (posLess(m.to, p.to) || !mk.inclusiveRight && posEq(p.to, m.to))
          newParts.push({from: m.to, to: p.to});
        parts.splice.apply(parts, newParts);
        j += newParts.length - 1;
      }
    }
    return parts;
  }

  function collapsedSpanAt(line, ch) {
    var sps = sawCollapsedSpans && line.markedSpans, found;
    if (sps) for (var sp, i = 0; i < sps.length; ++i) {
      sp = sps[i];
      if (!sp.marker.collapsed) continue;
      if ((sp.from == null || sp.from < ch) &&
          (sp.to == null || sp.to > ch) &&
          (!found || found.width < sp.marker.width))
        found = sp.marker;
    }
    return found;
  }
  function collapsedSpanAtStart(line) { return collapsedSpanAt(line, -1); }
  function collapsedSpanAtEnd(line) { return collapsedSpanAt(line, line.text.length + 1); }

  function visualLine(doc, line) {
    var merged;
    while (merged = collapsedSpanAtStart(line))
      line = getLine(doc, merged.find().from.line);
    return line;
  }

  function lineIsHidden(doc, line) {
    var sps = sawCollapsedSpans && line.markedSpans;
    if (sps) for (var sp, i = 0; i < sps.length; ++i) {
      sp = sps[i];
      if (!sp.marker.collapsed) continue;
      if (sp.from == null) return true;
      if (sp.marker.replacedWith) continue;
      if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))
        return true;
    }
  }
  function lineIsHiddenInner(doc, line, span) {
    if (span.to == null) {
      var end = span.marker.find().to, endLine = getLine(doc, end.line);
      return lineIsHiddenInner(doc, endLine, getMarkedSpanFor(endLine.markedSpans, span.marker));
    }
    if (span.marker.inclusiveRight && span.to == line.text.length)
      return true;
    for (var sp, i = 0; i < line.markedSpans.length; ++i) {
      sp = line.markedSpans[i];
      if (sp.marker.collapsed && !sp.marker.replacedWith && sp.from == span.to &&
          (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&
          lineIsHiddenInner(doc, line, sp)) return true;
    }
  }

  function detachMarkedSpans(line) {
    var spans = line.markedSpans;
    if (!spans) return;
    for (var i = 0; i < spans.length; ++i)
      spans[i].marker.detachLine(line);
    line.markedSpans = null;
  }

  function attachMarkedSpans(line, spans) {
    if (!spans) return;
    for (var i = 0; i < spans.length; ++i)
      spans[i].marker.attachLine(line);
    line.markedSpans = spans;
  }

  // LINE WIDGETS

  var LineWidget = CodeMirror.LineWidget = function(cm, node, options) {
    for (var opt in options) if (options.hasOwnProperty(opt))
      this[opt] = options[opt];
    this.cm = cm;
    this.node = node;
  };
  function widgetOperation(f) {
    return function() {
      var withOp = !this.cm.curOp;
      if (withOp) startOperation(this.cm);
      try {var result = f.apply(this, arguments);}
      finally {if (withOp) endOperation(this.cm);}
      return result;
    };
  }
  LineWidget.prototype.clear = widgetOperation(function() {
    var ws = this.line.widgets, no = lineNo(this.line);
    if (no == null || !ws) return;
    for (var i = 0; i < ws.length; ++i) if (ws[i] == this) ws.splice(i--, 1);
    if (!ws.length) this.line.widgets = null;
    updateLineHeight(this.line, Math.max(0, this.line.height - widgetHeight(this)));
    regChange(this.cm, no, no + 1);
  });
  LineWidget.prototype.changed = widgetOperation(function() {
    var oldH = this.height;
    this.height = null;
    var diff = widgetHeight(this) - oldH;
    if (!diff) return;
    updateLineHeight(this.line, this.line.height + diff);
    var no = lineNo(this.line);
    regChange(this.cm, no, no + 1);
  });

  function widgetHeight(widget) {
    if (widget.height != null) return widget.height;
    if (!widget.node.parentNode || widget.node.parentNode.nodeType != 1)
      removeChildrenAndAdd(widget.cm.display.measure, elt("div", [widget.node], null, "position: relative"));
    return widget.height = widget.node.offsetHeight;
  }

  function addLineWidget(cm, handle, node, options) {
    var widget = new LineWidget(cm, node, options);
    if (widget.noHScroll) cm.display.alignWidgets = true;
    changeLine(cm, handle, function(line) {
      (line.widgets || (line.widgets = [])).push(widget);
      widget.line = line;
      if (!lineIsHidden(cm.doc, line) || widget.showIfHidden) {
        var aboveVisible = heightAtLine(cm, line) < cm.display.scroller.scrollTop;
        updateLineHeight(line, line.height + widgetHeight(widget));
        if (aboveVisible) addToScrollPos(cm, 0, widget.height);
      }
      return true;
    });
    return widget;
  }

  // LINE DATA STRUCTURE

  // Line objects. These hold state related to a line, including
  // highlighting info (the styles array).
  function makeLine(text, markedSpans, estimateHeight) {
    var line = {text: text};
    attachMarkedSpans(line, markedSpans);
    line.height = estimateHeight ? estimateHeight(line) : 1;
    return line;
  }

  function updateLine(line, text, markedSpans, estimateHeight) {
    line.text = text;
    if (line.stateAfter) line.stateAfter = null;
    if (line.styles) line.styles = null;
    if (line.order != null) line.order = null;
    detachMarkedSpans(line);
    attachMarkedSpans(line, markedSpans);
    var estHeight = estimateHeight ? estimateHeight(line) : 1;
    if (estHeight != line.height) updateLineHeight(line, estHeight);
  }

  function cleanUpLine(line) {
    line.parent = null;
    detachMarkedSpans(line);
  }

  // Run the given mode's parser over a line, update the styles
  // array, which contains alternating fragments of text and CSS
  // classes.
  function runMode(cm, text, mode, state, f) {
    var flattenSpans = mode.flattenSpans;
    if (flattenSpans == null) flattenSpans = cm.options.flattenSpans;
    var curStart = 0, curStyle = null;
    var stream = new StringStream(text, cm.options.tabSize), style;
    if (text == "" && mode.blankLine) mode.blankLine(state);
    while (!stream.eol()) {
      if (stream.pos > cm.options.maxHighlightLength) {
        flattenSpans = false;
        // Webkit seems to refuse to render text nodes longer than 57444 characters
        stream.pos = Math.min(text.length, stream.start + 50000);
        style = null;
      } else {
        style = mode.token(stream, state);
      }
      if (!flattenSpans || curStyle != style) {
        if (curStart < stream.start) f(stream.start, curStyle);
        curStart = stream.start; curStyle = style;
      }
      stream.start = stream.pos;
    }
    if (curStart < stream.pos) f(stream.pos, curStyle);
  }

  function highlightLine(cm, line, state) {
    // A styles array always starts with a number identifying the
    // mode/overlays that it is based on (for easy invalidation).
    var st = [cm.state.modeGen];
    // Compute the base array of styles
    runMode(cm, line.text, cm.doc.mode, state, function(end, style) {st.push(end, style);});

    // Run overlays, adjust style array.
    for (var o = 0; o < cm.state.overlays.length; ++o) {
      var overlay = cm.state.overlays[o], i = 1, at = 0;
      runMode(cm, line.text, overlay.mode, true, function(end, style) {
        var start = i;
        // Ensure there's a token end at the current position, and that i points at it
        while (at < end) {
          var i_end = st[i];
          if (i_end > end)
            st.splice(i, 1, end, st[i+1], i_end);
          i += 2;
          at = Math.min(end, i_end);
        }
        if (!style) return;
        if (overlay.opaque) {
          st.splice(start, i - start, end, style);
          i = start + 2;
        } else {
          for (; start < i; start += 2) {
            var cur = st[start+1];
            st[start+1] = cur ? cur + " " + style : style;
          }
        }
      });
    }

    return st;
  }

  function getLineStyles(cm, line) {
    if (!line.styles || line.styles[0] != cm.state.modeGen)
      line.styles = highlightLine(cm, line, line.stateAfter = getStateBefore(cm, lineNo(line)));
    return line.styles;
  }

  // Lightweight form of highlight -- proceed over this line and
  // update state, but don't save a style array.
  function processLine(cm, line, state) {
    var mode = cm.doc.mode;
    var stream = new StringStream(line.text, cm.options.tabSize);
    if (line.text == "" && mode.blankLine) mode.blankLine(state);
    while (!stream.eol() && stream.pos <= cm.options.maxHighlightLength) {
      mode.token(stream, state);
      stream.start = stream.pos;
    }
  }

  var styleToClassCache = {};
  function styleToClass(style) {
    if (!style) return null;
    return styleToClassCache[style] ||
      (styleToClassCache[style] = "cm-" + style.replace(/ +/g, " cm-"));
  }

  function lineContent(cm, realLine, measure) {
    var merged, line = realLine, empty = true;
    while (merged = collapsedSpanAtStart(line))
      line = getLine(cm.doc, merged.find().from.line);

    var builder = {pre: elt("pre"), col: 0, pos: 0, display: !measure,
                   measure: null, measuredSomething: false, cm: cm};
    if (line.textClass) builder.pre.className = line.textClass;

    do {
      if (line.text) empty = false;
      builder.measure = line == realLine && measure;
      builder.pos = 0;
      builder.addToken = builder.measure ? buildTokenMeasure : buildToken;
      if ((ie || webkit) && cm.getOption("lineWrapping"))
        builder.addToken = buildTokenSplitSpaces(builder.addToken);
      var next = insertLineContent(line, builder, getLineStyles(cm, line));
      if (measure && line == realLine && !builder.measuredSomething) {
        measure[0] = builder.pre.appendChild(zeroWidthElement(cm.display.measure));
        builder.measuredSomething = true;
      }
      if (next) line = getLine(cm.doc, next.to.line);
    } while (next);

    if (measure && !builder.measuredSomething && !measure[0])
      measure[0] = builder.pre.appendChild(empty ? elt("span", "\u00a0") : zeroWidthElement(cm.display.measure));
    if (!builder.pre.firstChild && !lineIsHidden(cm.doc, realLine))
      builder.pre.appendChild(document.createTextNode("\u00a0"));

    var order;
    // Work around problem with the reported dimensions of single-char
    // direction spans on IE (issue #1129). See also the comment in
    // cursorCoords.
    if (measure && ie && (order = getOrder(line))) {
      var l = order.length - 1;
      if (order[l].from == order[l].to) --l;
      var last = order[l], prev = order[l - 1];
      if (last.from + 1 == last.to && prev && last.level < prev.level) {
        var span = measure[builder.pos - 1];
        if (span) span.parentNode.insertBefore(span.measureRight = zeroWidthElement(cm.display.measure),
                                               span.nextSibling);
      }
    }

    signal(cm, "renderLine", cm, realLine, builder.pre);
    return builder.pre;
  }

  var tokenSpecialChars = /[\t\u0000-\u0019\u00ad\u200b\u2028\u2029\uFEFF]/g;
  function buildToken(builder, text, style, startStyle, endStyle) {
    if (!text) return;
    if (!tokenSpecialChars.test(text)) {
      builder.col += text.length;
      var content = document.createTextNode(text);
    } else {
      var content = document.createDocumentFragment(), pos = 0;
      while (true) {
        tokenSpecialChars.lastIndex = pos;
        var m = tokenSpecialChars.exec(text);
        var skipped = m ? m.index - pos : text.length - pos;
        if (skipped) {
          content.appendChild(document.createTextNode(text.slice(pos, pos + skipped)));
          builder.col += skipped;
        }
        if (!m) break;
        pos += skipped + 1;
        if (m[0] == "\t") {
          var tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize;
          content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));
          builder.col += tabWidth;
        } else {
          var token = elt("span", "\u2022", "cm-invalidchar");
          token.title = "\\u" + m[0].charCodeAt(0).toString(16);
          content.appendChild(token);
          builder.col += 1;
        }
      }
    }
    if (style || startStyle || endStyle || builder.measure) {
      var fullStyle = style || "";
      if (startStyle) fullStyle += startStyle;
      if (endStyle) fullStyle += endStyle;
      return builder.pre.appendChild(elt("span", [content], fullStyle));
    }
    builder.pre.appendChild(content);
  }

  function buildTokenMeasure(builder, text, style, startStyle, endStyle) {
    var wrapping = builder.cm.options.lineWrapping;
    for (var i = 0; i < text.length; ++i) {
      var ch = text.charAt(i), start = i == 0;
      if (ch >= "\ud800" && ch < "\udbff" && i < text.length - 1) {
        ch = text.slice(i, i + 2);
        ++i;
      } else if (i && wrapping && spanAffectsWrapping(text, i)) {
        builder.pre.appendChild(elt("wbr"));
      }
      var span = builder.measure[builder.pos] =
        buildToken(builder, ch, style,
                   start && startStyle, i == text.length - 1 && endStyle);
      // In IE single-space nodes wrap differently than spaces
      // embedded in larger text nodes, except when set to
      // white-space: normal (issue #1268).
      if (ie && wrapping && ch == " " && i && !/\s/.test(text.charAt(i - 1)) &&
          i < text.length - 1 && !/\s/.test(text.charAt(i + 1)))
        span.style.whiteSpace = "normal";
      builder.pos += ch.length;
    }
    if (text.length) builder.measuredSomething = true;
  }

  function buildTokenSplitSpaces(inner) {
    function split(old) {
      var out = " ";
      for (var i = 0; i < old.length - 2; ++i) out += i % 2 ? " " : "\u00a0";
      out += " ";
      return out;
    }
    return function(builder, text, style, startStyle, endStyle) {
      return inner(builder, text.replace(/ {3,}/, split), style, startStyle, endStyle);
    };
  }

  function buildCollapsedSpan(builder, size, widget) {
    if (widget) {
      if (!builder.display) widget = widget.cloneNode(true);
      if (builder.measure) {
        builder.measure[builder.pos] = size ? widget
          : builder.pre.appendChild(zeroWidthElement(builder.cm.display.measure));
        builder.measuredSomething = true;
      }
      builder.pre.appendChild(widget);
    }
    builder.pos += size;
  }

  // Outputs a number of spans to make up a line, taking highlighting
  // and marked text into account.
  function insertLineContent(line, builder, styles) {
    var spans = line.markedSpans, allText = line.text, at = 0;
    if (!spans) {
      for (var i = 1; i < styles.length; i+=2)
        builder.addToken(builder, allText.slice(at, at = styles[i]), styleToClass(styles[i+1]));
      return;
    }

    var len = allText.length, pos = 0, i = 1, text = "", style;
    var nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, collapsed;
    for (;;) {
      if (nextChange == pos) { // Update current marker set
        spanStyle = spanEndStyle = spanStartStyle = "";
        collapsed = null; nextChange = Infinity;
        var foundBookmark = null;
        for (var j = 0; j < spans.length; ++j) {
          var sp = spans[j], m = sp.marker;
          if (sp.from <= pos && (sp.to == null || sp.to > pos)) {
            if (sp.to != null && nextChange > sp.to) { nextChange = sp.to; spanEndStyle = ""; }
            if (m.className) spanStyle += " " + m.className;
            if (m.startStyle && sp.from == pos) spanStartStyle += " " + m.startStyle;
            if (m.endStyle && sp.to == nextChange) spanEndStyle += " " + m.endStyle;
            if (m.collapsed && (!collapsed || collapsed.marker.size < m.size))
              collapsed = sp;
          } else if (sp.from > pos && nextChange > sp.from) {
            nextChange = sp.from;
          }
          if (m.type == "bookmark" && sp.from == pos && m.replacedWith)
            foundBookmark = m.replacedWith;
        }
        if (collapsed && (collapsed.from || 0) == pos) {
          buildCollapsedSpan(builder, (collapsed.to == null ? len : collapsed.to) - pos,
                             collapsed.from != null && collapsed.marker.replacedWith);
          if (collapsed.to == null) return collapsed.marker.find();
        }
        if (foundBookmark && !collapsed) buildCollapsedSpan(builder, 0, foundBookmark);
      }
      if (pos >= len) break;

      var upto = Math.min(len, nextChange);
      while (true) {
        if (text) {
          var end = pos + text.length;
          if (!collapsed) {
            var tokenText = end > upto ? text.slice(0, upto - pos) : text;
            builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle,
                             spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "");
          }
          if (end >= upto) {text = text.slice(upto - pos); pos = upto; break;}
          pos = end;
          spanStartStyle = "";
        }
        text = allText.slice(at, at = styles[i++]);
        style = styleToClass(styles[i++]);
      }
    }
  }

  // DOCUMENT DATA STRUCTURE

  function updateDoc(doc, change, markedSpans, selAfter, estimateHeight) {
    function spansFor(n) {return markedSpans ? markedSpans[n] : null;}
    function update(line, text, spans) {
      updateLine(line, text, spans, estimateHeight);
      signalLater(line, "change", line, change);
    }

    var from = change.from, to = change.to, text = change.text;
    var firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line);
    var lastText = lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line;

    // First adjust the line structure
    if (from.ch == 0 && to.ch == 0 && lastText == "") {
      // This is a whole-line replace. Treated specially to make
      // sure line objects move the way they are supposed to.
      for (var i = 0, e = text.length - 1, added = []; i < e; ++i)
        added.push(makeLine(text[i], spansFor(i), estimateHeight));
      update(lastLine, lastLine.text, lastSpans);
      if (nlines) doc.remove(from.line, nlines);
      if (added.length) doc.insert(from.line, added);
    } else if (firstLine == lastLine) {
      if (text.length == 1) {
        update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
      } else {
        for (var added = [], i = 1, e = text.length - 1; i < e; ++i)
          added.push(makeLine(text[i], spansFor(i), estimateHeight));
        added.push(makeLine(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight));
        update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
        doc.insert(from.line + 1, added);
      }
    } else if (text.length == 1) {
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));
      doc.remove(from.line + 1, nlines);
    } else {
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
      update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
      for (var i = 1, e = text.length - 1, added = []; i < e; ++i)
        added.push(makeLine(text[i], spansFor(i), estimateHeight));
      if (nlines > 1) doc.remove(from.line + 1, nlines - 1);
      doc.insert(from.line + 1, added);
    }

    signalLater(doc, "change", doc, change);
    setSelection(doc, selAfter.anchor, selAfter.head, null, true);
  }

  function LeafChunk(lines) {
    this.lines = lines;
    this.parent = null;
    for (var i = 0, e = lines.length, height = 0; i < e; ++i) {
      lines[i].parent = this;
      height += lines[i].height;
    }
    this.height = height;
  }

  LeafChunk.prototype = {
    chunkSize: function() { return this.lines.length; },
    removeInner: function(at, n) {
      for (var i = at, e = at + n; i < e; ++i) {
        var line = this.lines[i];
        this.height -= line.height;
        cleanUpLine(line);
        signalLater(line, "delete");
      }
      this.lines.splice(at, n);
    },
    collapse: function(lines) {
      lines.splice.apply(lines, [lines.length, 0].concat(this.lines));
    },
    insertInner: function(at, lines, height) {
      this.height += height;
      this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
      for (var i = 0, e = lines.length; i < e; ++i) lines[i].parent = this;
    },
    iterN: function(at, n, op) {
      for (var e = at + n; at < e; ++at)
        if (op(this.lines[at])) return true;
    }
  };

  function BranchChunk(children) {
    this.children = children;
    var size = 0, height = 0;
    for (var i = 0, e = children.length; i < e; ++i) {
      var ch = children[i];
      size += ch.chunkSize(); height += ch.height;
      ch.parent = this;
    }
    this.size = size;
    this.height = height;
    this.parent = null;
  }

  BranchChunk.prototype = {
    chunkSize: function() { return this.size; },
    removeInner: function(at, n) {
      this.size -= n;
      for (var i = 0; i < this.children.length; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at < sz) {
          var rm = Math.min(n, sz - at), oldHeight = child.height;
          child.removeInner(at, rm);
          this.height -= oldHeight - child.height;
          if (sz == rm) { this.children.splice(i--, 1); child.parent = null; }
          if ((n -= rm) == 0) break;
          at = 0;
        } else at -= sz;
      }
      if (this.size - n < 25) {
        var lines = [];
        this.collapse(lines);
        this.children = [new LeafChunk(lines)];
        this.children[0].parent = this;
      }
    },
    collapse: function(lines) {
      for (var i = 0, e = this.children.length; i < e; ++i) this.children[i].collapse(lines);
    },
    insertInner: function(at, lines, height) {
      this.size += lines.length;
      this.height += height;
      for (var i = 0, e = this.children.length; i < e; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at <= sz) {
          child.insertInner(at, lines, height);
          if (child.lines && child.lines.length > 50) {
            while (child.lines.length > 50) {
              var spilled = child.lines.splice(child.lines.length - 25, 25);
              var newleaf = new LeafChunk(spilled);
              child.height -= newleaf.height;
              this.children.splice(i + 1, 0, newleaf);
              newleaf.parent = this;
            }
            this.maybeSpill();
          }
          break;
        }
        at -= sz;
      }
    },
    maybeSpill: function() {
      if (this.children.length <= 10) return;
      var me = this;
      do {
        var spilled = me.children.splice(me.children.length - 5, 5);
        var sibling = new BranchChunk(spilled);
        if (!me.parent) { // Become the parent node
          var copy = new BranchChunk(me.children);
          copy.parent = me;
          me.children = [copy, sibling];
          me = copy;
        } else {
          me.size -= sibling.size;
          me.height -= sibling.height;
          var myIndex = indexOf(me.parent.children, me);
          me.parent.children.splice(myIndex + 1, 0, sibling);
        }
        sibling.parent = me.parent;
      } while (me.children.length > 10);
      me.parent.maybeSpill();
    },
    iterN: function(at, n, op) {
      for (var i = 0, e = this.children.length; i < e; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at < sz) {
          var used = Math.min(n, sz - at);
          if (child.iterN(at, used, op)) return true;
          if ((n -= used) == 0) break;
          at = 0;
        } else at -= sz;
      }
    }
  };

  var nextDocId = 0;
  var Doc = CodeMirror.Doc = function(text, mode, firstLine) {
    if (!(this instanceof Doc)) return new Doc(text, mode, firstLine);
    if (firstLine == null) firstLine = 0;

    BranchChunk.call(this, [new LeafChunk([makeLine("", null)])]);
    this.first = firstLine;
    this.scrollTop = this.scrollLeft = 0;
    this.cantEdit = false;
    this.history = makeHistory();
    this.cleanGeneration = 1;
    this.frontier = firstLine;
    var start = Pos(firstLine, 0);
    this.sel = {from: start, to: start, head: start, anchor: start, shift: false, extend: false, goalColumn: null};
    this.id = ++nextDocId;
    this.modeOption = mode;

    if (typeof text == "string") text = splitLines(text);
    updateDoc(this, {from: start, to: start, text: text}, null, {head: start, anchor: start});
  };

  Doc.prototype = createObj(BranchChunk.prototype, {
    constructor: Doc,
    iter: function(from, to, op) {
      if (op) this.iterN(from - this.first, to - from, op);
      else this.iterN(this.first, this.first + this.size, from);
    },

    insert: function(at, lines) {
      var height = 0;
      for (var i = 0, e = lines.length; i < e; ++i) height += lines[i].height;
      this.insertInner(at - this.first, lines, height);
    },
    remove: function(at, n) { this.removeInner(at - this.first, n); },

    getValue: function(lineSep) {
      var lines = getLines(this, this.first, this.first + this.size);
      if (lineSep === false) return lines;
      return lines.join(lineSep || "\n");
    },
    setValue: function(code) {
      var top = Pos(this.first, 0), last = this.first + this.size - 1;
      makeChange(this, {from: top, to: Pos(last, getLine(this, last).text.length),
                        text: splitLines(code), origin: "setValue"},
                 {head: top, anchor: top}, true);
    },
    replaceRange: function(code, from, to, origin) {
      from = clipPos(this, from);
      to = to ? clipPos(this, to) : from;
      replaceRange(this, code, from, to, origin);
    },
    getRange: function(from, to, lineSep) {
      var lines = getBetween(this, clipPos(this, from), clipPos(this, to));
      if (lineSep === false) return lines;
      return lines.join(lineSep || "\n");
    },

    getLine: function(line) {var l = this.getLineHandle(line); return l && l.text;},
    setLine: function(line, text) {
      if (isLine(this, line))
        replaceRange(this, text, Pos(line, 0), clipPos(this, Pos(line)));
    },
    removeLine: function(line) {
      if (line) replaceRange(this, "", clipPos(this, Pos(line - 1)), clipPos(this, Pos(line)));
      else replaceRange(this, "", Pos(0, 0), clipPos(this, Pos(1, 0)));
    },

    getLineHandle: function(line) {if (isLine(this, line)) return getLine(this, line);},
    getLineNumber: function(line) {return lineNo(line);},

    lineCount: function() {return this.size;},
    firstLine: function() {return this.first;},
    lastLine: function() {return this.first + this.size - 1;},

    clipPos: function(pos) {return clipPos(this, pos);},

    getCursor: function(start) {
      var sel = this.sel, pos;
      if (start == null || start == "head") pos = sel.head;
      else if (start == "anchor") pos = sel.anchor;
      else if (start == "end" || start === false) pos = sel.to;
      else pos = sel.from;
      return copyPos(pos);
    },
    somethingSelected: function() {return !posEq(this.sel.head, this.sel.anchor);},

    setCursor: docOperation(function(line, ch, extend) {
      var pos = clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line);
      if (extend) extendSelection(this, pos);
      else setSelection(this, pos, pos);
    }),
    setSelection: docOperation(function(anchor, head) {
      setSelection(this, clipPos(this, anchor), clipPos(this, head || anchor));
    }),
    extendSelection: docOperation(function(from, to) {
      extendSelection(this, clipPos(this, from), to && clipPos(this, to));
    }),

    getSelection: function(lineSep) {return this.getRange(this.sel.from, this.sel.to, lineSep);},
    replaceSelection: function(code, collapse, origin) {
      makeChange(this, {from: this.sel.from, to: this.sel.to, text: splitLines(code), origin: origin}, collapse || "around");
    },
    undo: docOperation(function() {makeChangeFromHistory(this, "undo");}),
    redo: docOperation(function() {makeChangeFromHistory(this, "redo");}),

    setExtending: function(val) {this.sel.extend = val;},

    historySize: function() {
      var hist = this.history;
      return {undo: hist.done.length, redo: hist.undone.length};
    },
    clearHistory: function() {this.history = makeHistory(this.history.maxGeneration);},

    markClean: function() {
      this.cleanGeneration = this.changeGeneration();
    },
    changeGeneration: function() {
      this.history.lastOp = this.history.lastOrigin = null;
      return this.history.generation;
    },
    isClean: function (gen) {
      return this.history.generation == (gen || this.cleanGeneration);
    },

    getHistory: function() {
      return {done: copyHistoryArray(this.history.done),
              undone: copyHistoryArray(this.history.undone)};
    },
    setHistory: function(histData) {
      var hist = this.history = makeHistory(this.history.maxGeneration);
      hist.done = histData.done.slice(0);
      hist.undone = histData.undone.slice(0);
    },

    markText: function(from, to, options) {
      return markText(this, clipPos(this, from), clipPos(this, to), options, "range");
    },
    setBookmark: function(pos, options) {
      var realOpts = {replacedWith: options && (options.nodeType == null ? options.widget : options),
                      insertLeft: options && options.insertLeft};
      pos = clipPos(this, pos);
      return markText(this, pos, pos, realOpts, "bookmark");
    },
    findMarksAt: function(pos) {
      pos = clipPos(this, pos);
      var markers = [], spans = getLine(this, pos.line).markedSpans;
      if (spans) for (var i = 0; i < spans.length; ++i) {
        var span = spans[i];
        if ((span.from == null || span.from <= pos.ch) &&
            (span.to == null || span.to >= pos.ch))
          markers.push(span.marker.parent || span.marker);
      }
      return markers;
    },
    getAllMarks: function() {
      var markers = [];
      this.iter(function(line) {
        var sps = line.markedSpans;
        if (sps) for (var i = 0; i < sps.length; ++i)
          if (sps[i].from != null) markers.push(sps[i].marker);
      });
      return markers;
    },

    posFromIndex: function(off) {
      var ch, lineNo = this.first;
      this.iter(function(line) {
        var sz = line.text.length + 1;
        if (sz > off) { ch = off; return true; }
        off -= sz;
        ++lineNo;
      });
      return clipPos(this, Pos(lineNo, ch));
    },
    indexFromPos: function (coords) {
      coords = clipPos(this, coords);
      var index = coords.ch;
      if (coords.line < this.first || coords.ch < 0) return 0;
      this.iter(this.first, coords.line, function (line) {
        index += line.text.length + 1;
      });
      return index;
    },

    copy: function(copyHistory) {
      var doc = new Doc(getLines(this, this.first, this.first + this.size), this.modeOption, this.first);
      doc.scrollTop = this.scrollTop; doc.scrollLeft = this.scrollLeft;
      doc.sel = {from: this.sel.from, to: this.sel.to, head: this.sel.head, anchor: this.sel.anchor,
                 shift: this.sel.shift, extend: false, goalColumn: this.sel.goalColumn};
      if (copyHistory) {
        doc.history.undoDepth = this.history.undoDepth;
        doc.setHistory(this.getHistory());
      }
      return doc;
    },

    linkedDoc: function(options) {
      if (!options) options = {};
      var from = this.first, to = this.first + this.size;
      if (options.from != null && options.from > from) from = options.from;
      if (options.to != null && options.to < to) to = options.to;
      var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from);
      if (options.sharedHist) copy.history = this.history;
      (this.linked || (this.linked = [])).push({doc: copy, sharedHist: options.sharedHist});
      copy.linked = [{doc: this, isParent: true, sharedHist: options.sharedHist}];
      return copy;
    },
    unlinkDoc: function(other) {
      if (other instanceof CodeMirror) other = other.doc;
      if (this.linked) for (var i = 0; i < this.linked.length; ++i) {
        var link = this.linked[i];
        if (link.doc != other) continue;
        this.linked.splice(i, 1);
        other.unlinkDoc(this);
        break;
      }
      // If the histories were shared, split them again
      if (other.history == this.history) {
        var splitIds = [other.id];
        linkedDocs(other, function(doc) {splitIds.push(doc.id);}, true);
        other.history = makeHistory();
        other.history.done = copyHistoryArray(this.history.done, splitIds);
        other.history.undone = copyHistoryArray(this.history.undone, splitIds);
      }
    },
    iterLinkedDocs: function(f) {linkedDocs(this, f);},

    getMode: function() {return this.mode;},
    getEditor: function() {return this.cm;}
  });

  Doc.prototype.eachLine = Doc.prototype.iter;

  // The Doc methods that should be available on CodeMirror instances
  var dontDelegate = "iter insert remove copy getEditor".split(" ");
  for (var prop in Doc.prototype) if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)
    CodeMirror.prototype[prop] = (function(method) {
      return function() {return method.apply(this.doc, arguments);};
    })(Doc.prototype[prop]);

  function linkedDocs(doc, f, sharedHistOnly) {
    function propagate(doc, skip, sharedHist) {
      if (doc.linked) for (var i = 0; i < doc.linked.length; ++i) {
        var rel = doc.linked[i];
        if (rel.doc == skip) continue;
        var shared = sharedHist && rel.sharedHist;
        if (sharedHistOnly && !shared) continue;
        f(rel.doc, shared);
        propagate(rel.doc, doc, shared);
      }
    }
    propagate(doc, null, true);
  }

  function attachDoc(cm, doc) {
    if (doc.cm) throw new Error("This document is already in use.");
    cm.doc = doc;
    doc.cm = cm;
    estimateLineHeights(cm);
    loadMode(cm);
    if (!cm.options.lineWrapping) computeMaxLength(cm);
    cm.options.mode = doc.modeOption;
    regChange(cm);
  }

  // LINE UTILITIES

  function getLine(chunk, n) {
    n -= chunk.first;
    while (!chunk.lines) {
      for (var i = 0;; ++i) {
        var child = chunk.children[i], sz = child.chunkSize();
        if (n < sz) { chunk = child; break; }
        n -= sz;
      }
    }
    return chunk.lines[n];
  }

  function getBetween(doc, start, end) {
    var out = [], n = start.line;
    doc.iter(start.line, end.line + 1, function(line) {
      var text = line.text;
      if (n == end.line) text = text.slice(0, end.ch);
      if (n == start.line) text = text.slice(start.ch);
      out.push(text);
      ++n;
    });
    return out;
  }
  function getLines(doc, from, to) {
    var out = [];
    doc.iter(from, to, function(line) { out.push(line.text); });
    return out;
  }

  function updateLineHeight(line, height) {
    var diff = height - line.height;
    for (var n = line; n; n = n.parent) n.height += diff;
  }

  function lineNo(line) {
    if (line.parent == null) return null;
    var cur = line.parent, no = indexOf(cur.lines, line);
    for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
      for (var i = 0;; ++i) {
        if (chunk.children[i] == cur) break;
        no += chunk.children[i].chunkSize();
      }
    }
    return no + cur.first;
  }

  function lineAtHeight(chunk, h) {
    var n = chunk.first;
    outer: do {
      for (var i = 0, e = chunk.children.length; i < e; ++i) {
        var child = chunk.children[i], ch = child.height;
        if (h < ch) { chunk = child; continue outer; }
        h -= ch;
        n += child.chunkSize();
      }
      return n;
    } while (!chunk.lines);
    for (var i = 0, e = chunk.lines.length; i < e; ++i) {
      var line = chunk.lines[i], lh = line.height;
      if (h < lh) break;
      h -= lh;
    }
    return n + i;
  }

  function heightAtLine(cm, lineObj) {
    lineObj = visualLine(cm.doc, lineObj);

    var h = 0, chunk = lineObj.parent;
    for (var i = 0; i < chunk.lines.length; ++i) {
      var line = chunk.lines[i];
      if (line == lineObj) break;
      else h += line.height;
    }
    for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {
      for (var i = 0; i < p.children.length; ++i) {
        var cur = p.children[i];
        if (cur == chunk) break;
        else h += cur.height;
      }
    }
    return h;
  }

  function getOrder(line) {
    var order = line.order;
    if (order == null) order = line.order = bidiOrdering(line.text);
    return order;
  }

  // HISTORY

  function makeHistory(startGen) {
    return {
      // Arrays of history events. Doing something adds an event to
      // done and clears undo. Undoing moves events from done to
      // undone, redoing moves them in the other direction.
      done: [], undone: [], undoDepth: Infinity,
      // Used to track when changes can be merged into a single undo
      // event
      lastTime: 0, lastOp: null, lastOrigin: null,
      // Used by the isClean() method
      generation: startGen || 1, maxGeneration: startGen || 1
    };
  }

  function attachLocalSpans(doc, change, from, to) {
    var existing = change["spans_" + doc.id], n = 0;
    doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function(line) {
      if (line.markedSpans)
        (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans;
      ++n;
    });
  }

  function historyChangeFromChange(doc, change) {
    var histChange = {from: change.from, to: changeEnd(change), text: getBetween(doc, change.from, change.to)};
    attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
    linkedDocs(doc, function(doc) {attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);}, true);
    return histChange;
  }

  function addToHistory(doc, change, selAfter, opId) {
    var hist = doc.history;
    hist.undone.length = 0;
    var time = +new Date, cur = lst(hist.done);

    if (cur &&
        (hist.lastOp == opId ||
         hist.lastOrigin == change.origin && change.origin &&
         ((change.origin.charAt(0) == "+" && doc.cm && hist.lastTime > time - doc.cm.options.historyEventDelay) ||
          change.origin.charAt(0) == "*"))) {
      // Merge this change into the last event
      var last = lst(cur.changes);
      if (posEq(change.from, change.to) && posEq(change.from, last.to)) {
        // Optimized case for simple insertion -- don't want to add
        // new changesets for every character typed
        last.to = changeEnd(change);
      } else {
        // Add new sub-event
        cur.changes.push(historyChangeFromChange(doc, change));
      }
      cur.anchorAfter = selAfter.anchor; cur.headAfter = selAfter.head;
    } else {
      // Can not be merged, start a new event.
      cur = {changes: [historyChangeFromChange(doc, change)],
             generation: hist.generation,
             anchorBefore: doc.sel.anchor, headBefore: doc.sel.head,
             anchorAfter: selAfter.anchor, headAfter: selAfter.head};
      hist.done.push(cur);
      hist.generation = ++hist.maxGeneration;
      while (hist.done.length > hist.undoDepth)
        hist.done.shift();
    }
    hist.lastTime = time;
    hist.lastOp = opId;
    hist.lastOrigin = change.origin;
  }

  function removeClearedSpans(spans) {
    if (!spans) return null;
    for (var i = 0, out; i < spans.length; ++i) {
      if (spans[i].marker.explicitlyCleared) { if (!out) out = spans.slice(0, i); }
      else if (out) out.push(spans[i]);
    }
    return !out ? spans : out.length ? out : null;
  }

  function getOldSpans(doc, change) {
    var found = change["spans_" + doc.id];
    if (!found) return null;
    for (var i = 0, nw = []; i < change.text.length; ++i)
      nw.push(removeClearedSpans(found[i]));
    return nw;
  }

  // Used both to provide a JSON-safe object in .getHistory, and, when
  // detaching a document, to split the history in two
  function copyHistoryArray(events, newGroup) {
    for (var i = 0, copy = []; i < events.length; ++i) {
      var event = events[i], changes = event.changes, newChanges = [];
      copy.push({changes: newChanges, anchorBefore: event.anchorBefore, headBefore: event.headBefore,
                 anchorAfter: event.anchorAfter, headAfter: event.headAfter});
      for (var j = 0; j < changes.length; ++j) {
        var change = changes[j], m;
        newChanges.push({from: change.from, to: change.to, text: change.text});
        if (newGroup) for (var prop in change) if (m = prop.match(/^spans_(\d+)$/)) {
          if (indexOf(newGroup, Number(m[1])) > -1) {
            lst(newChanges)[prop] = change[prop];
            delete change[prop];
          }
        }
      }
    }
    return copy;
  }

  // Rebasing/resetting history to deal with externally-sourced changes

  function rebaseHistSel(pos, from, to, diff) {
    if (to < pos.line) {
      pos.line += diff;
    } else if (from < pos.line) {
      pos.line = from;
      pos.ch = 0;
    }
  }

  // Tries to rebase an array of history events given a change in the
  // document. If the change touches the same lines as the event, the
  // event, and everything 'behind' it, is discarded. If the change is
  // before the event, the event's positions are updated. Uses a
  // copy-on-write scheme for the positions, to avoid having to
  // reallocate them all on every rebase, but also avoid problems with
  // shared position objects being unsafely updated.
  function rebaseHistArray(array, from, to, diff) {
    for (var i = 0; i < array.length; ++i) {
      var sub = array[i], ok = true;
      for (var j = 0; j < sub.changes.length; ++j) {
        var cur = sub.changes[j];
        if (!sub.copied) { cur.from = copyPos(cur.from); cur.to = copyPos(cur.to); }
        if (to < cur.from.line) {
          cur.from.line += diff;
          cur.to.line += diff;
        } else if (from <= cur.to.line) {
          ok = false;
          break;
        }
      }
      if (!sub.copied) {
        sub.anchorBefore = copyPos(sub.anchorBefore); sub.headBefore = copyPos(sub.headBefore);
        sub.anchorAfter = copyPos(sub.anchorAfter); sub.readAfter = copyPos(sub.headAfter);
        sub.copied = true;
      }
      if (!ok) {
        array.splice(0, i + 1);
        i = 0;
      } else {
        rebaseHistSel(sub.anchorBefore); rebaseHistSel(sub.headBefore);
        rebaseHistSel(sub.anchorAfter); rebaseHistSel(sub.headAfter);
      }
    }
  }

  function rebaseHist(hist, change) {
    var from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1;
    rebaseHistArray(hist.done, from, to, diff);
    rebaseHistArray(hist.undone, from, to, diff);
  }

  // EVENT OPERATORS

  function stopMethod() {e_stop(this);}
  // Ensure an event has a stop method.
  function addStop(event) {
    if (!event.stop) event.stop = stopMethod;
    return event;
  }

  function e_preventDefault(e) {
    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;
  }
  function e_stopPropagation(e) {
    if (e.stopPropagation) e.stopPropagation();
    else e.cancelBubble = true;
  }
  function e_defaultPrevented(e) {
    return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false;
  }
  function e_stop(e) {e_preventDefault(e); e_stopPropagation(e);}
  CodeMirror.e_stop = e_stop;
  CodeMirror.e_preventDefault = e_preventDefault;
  CodeMirror.e_stopPropagation = e_stopPropagation;

  function e_target(e) {return e.target || e.srcElement;}
  function e_button(e) {
    var b = e.which;
    if (b == null) {
      if (e.button & 1) b = 1;
      else if (e.button & 2) b = 3;
      else if (e.button & 4) b = 2;
    }
    if (mac && e.ctrlKey && b == 1) b = 3;
    return b;
  }

  // EVENT HANDLING

  function on(emitter, type, f) {
    if (emitter.addEventListener)
      emitter.addEventListener(type, f, false);
    else if (emitter.attachEvent)
      emitter.attachEvent("on" + type, f);
    else {
      var map = emitter._handlers || (emitter._handlers = {});
      var arr = map[type] || (map[type] = []);
      arr.push(f);
    }
  }

  function off(emitter, type, f) {
    if (emitter.removeEventListener)
      emitter.removeEventListener(type, f, false);
    else if (emitter.detachEvent)
      emitter.detachEvent("on" + type, f);
    else {
      var arr = emitter._handlers && emitter._handlers[type];
      if (!arr) return;
      for (var i = 0; i < arr.length; ++i)
        if (arr[i] == f) { arr.splice(i, 1); break; }
    }
  }

  function signal(emitter, type /*, values...*/) {
    var arr = emitter._handlers && emitter._handlers[type];
    if (!arr) return;
    var args = Array.prototype.slice.call(arguments, 2);
    for (var i = 0; i < arr.length; ++i) arr[i].apply(null, args);
  }

  var delayedCallbacks, delayedCallbackDepth = 0;
  function signalLater(emitter, type /*, values...*/) {
    var arr = emitter._handlers && emitter._handlers[type];
    if (!arr) return;
    var args = Array.prototype.slice.call(arguments, 2);
    if (!delayedCallbacks) {
      ++delayedCallbackDepth;
      delayedCallbacks = [];
      setTimeout(fireDelayed, 0);
    }
    function bnd(f) {return function(){f.apply(null, args);};};
    for (var i = 0; i < arr.length; ++i)
      delayedCallbacks.push(bnd(arr[i]));
  }

  function signalDOMEvent(cm, e) {
    signal(cm, e.type, cm, e);
    return e_defaultPrevented(e);
  }

  function fireDelayed() {
    --delayedCallbackDepth;
    var delayed = delayedCallbacks;
    delayedCallbacks = null;
    for (var i = 0; i < delayed.length; ++i) delayed[i]();
  }

  function hasHandler(emitter, type) {
    var arr = emitter._handlers && emitter._handlers[type];
    return arr && arr.length > 0;
  }

  CodeMirror.on = on; CodeMirror.off = off; CodeMirror.signal = signal;

  // MISC UTILITIES

  // Number of pixels added to scroller and sizer to hide scrollbar
  var scrollerCutOff = 30;

  // Returned or thrown by various protocols to signal 'I'm not
  // handling this'.
  var Pass = CodeMirror.Pass = {toString: function(){return "CodeMirror.Pass";}};

  function Delayed() {this.id = null;}
  Delayed.prototype = {set: function(ms, f) {clearTimeout(this.id); this.id = setTimeout(f, ms);}};

  // Counts the column offset in a string, taking tabs into account.
  // Used mostly to find indentation.
  function countColumn(string, end, tabSize, startIndex, startValue) {
    if (end == null) {
      end = string.search(/[^\s\u00a0]/);
      if (end == -1) end = string.length;
    }
    for (var i = startIndex || 0, n = startValue || 0; i < end; ++i) {
      if (string.charAt(i) == "\t") n += tabSize - (n % tabSize);
      else ++n;
    }
    return n;
  }
  CodeMirror.countColumn = countColumn;

  var spaceStrs = [""];
  function spaceStr(n) {
    while (spaceStrs.length <= n)
      spaceStrs.push(lst(spaceStrs) + " ");
    return spaceStrs[n];
  }

  function lst(arr) { return arr[arr.length-1]; }

  function selectInput(node) {
    if (ios) { // Mobile Safari apparently has a bug where select() is broken.
      node.selectionStart = 0;
      node.selectionEnd = node.value.length;
    } else {
      // Suppress mysterious IE10 errors
      try { node.select(); }
      catch(_e) {}
    }
  }

  function indexOf(collection, elt) {
    if (collection.indexOf) return collection.indexOf(elt);
    for (var i = 0, e = collection.length; i < e; ++i)
      if (collection[i] == elt) return i;
    return -1;
  }

  function createObj(base, props) {
    function Obj() {}
    Obj.prototype = base;
    var inst = new Obj();
    if (props) copyObj(props, inst);
    return inst;
  }

  function copyObj(obj, target) {
    if (!target) target = {};
    for (var prop in obj) if (obj.hasOwnProperty(prop)) target[prop] = obj[prop];
    return target;
  }

  function emptyArray(size) {
    for (var a = [], i = 0; i < size; ++i) a.push(undefined);
    return a;
  }

  function bind(f) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function(){return f.apply(null, args);};
  }

  var nonASCIISingleCaseWordChar = /[\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
  function isWordChar(ch) {
    return /\w/.test(ch) || ch > "\x80" &&
      (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));
  }

  function isEmpty(obj) {
    for (var n in obj) if (obj.hasOwnProperty(n) && obj[n]) return false;
    return true;
  }

  var isExtendingChar = /[\u0300-\u036F\u0483-\u0487\u0488-\u0489\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\uA66F\uA670-\uA672\uA674-\uA67D\uA69F\udc00-\udfff]/;

  // DOM UTILITIES

  function elt(tag, content, className, style) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (style) e.style.cssText = style;
    if (typeof content == "string") setTextContent(e, content);
    else if (content) for (var i = 0; i < content.length; ++i) e.appendChild(content[i]);
    return e;
  }

  function removeChildren(e) {
    for (var count = e.childNodes.length; count > 0; --count)
      e.removeChild(e.firstChild);
    return e;
  }

  function removeChildrenAndAdd(parent, e) {
    return removeChildren(parent).appendChild(e);
  }

  function setTextContent(e, str) {
    if (ie_lt9) {
      e.innerHTML = "";
      e.appendChild(document.createTextNode(str));
    } else e.textContent = str;
  }

  function getRect(node) {
    return node.getBoundingClientRect();
  }
  CodeMirror.replaceGetRect = function(f) { getRect = f; };

  // FEATURE DETECTION

  // Detect drag-and-drop
  var dragAndDrop = function() {
    // There is *some* kind of drag-and-drop support in IE6-8, but I
    // couldn't get it to work yet.
    if (ie_lt9) return false;
    var div = elt('div');
    return "draggable" in div || "dragDrop" in div;
  }();

  // For a reason I have yet to figure out, some browsers disallow
  // word wrapping between certain characters *only* if a new inline
  // element is started between them. This makes it hard to reliably
  // measure the position of things, since that requires inserting an
  // extra span. This terribly fragile set of tests matches the
  // character combinations that suffer from this phenomenon on the
  // various browsers.
  function spanAffectsWrapping() { return false; }
  if (gecko) // Only for "$'"
    spanAffectsWrapping = function(str, i) {
      return str.charCodeAt(i - 1) == 36 && str.charCodeAt(i) == 39;
    };
  else if (safari && !/Version\/([6-9]|\d\d)\b/.test(navigator.userAgent))
    spanAffectsWrapping = function(str, i) {
      return /\-[^ \-?]|\?[^ !\'\"\),.\-\/:;\?\]\}]/.test(str.slice(i - 1, i + 1));
    };
  else if (webkit)
    spanAffectsWrapping = function(str, i) {
      if (i > 1 && str.charCodeAt(i - 1) == 45 && /\w/.test(str.charAt(i - 2)) && /[^\-?\.]/.test(str.charAt(i)))
        return true;
      return /[~!#%&*)=+}\]|\"\.>,:;][({[<]|-[^\-?\.\u2010-\u201f\u2026]|\?[\w~`@#$%\^&*(_=+{[|><]|…[\w~`@#$%\^&*(_=+{[><]/.test(str.slice(i - 1, i + 1));
    };

  var knownScrollbarWidth;
  function scrollbarWidth(measure) {
    if (knownScrollbarWidth != null) return knownScrollbarWidth;
    var test = elt("div", null, null, "width: 50px; height: 50px; overflow-x: scroll");
    removeChildrenAndAdd(measure, test);
    if (test.offsetWidth)
      knownScrollbarWidth = test.offsetHeight - test.clientHeight;
    return knownScrollbarWidth || 0;
  }

  var zwspSupported;
  function zeroWidthElement(measure) {
    if (zwspSupported == null) {
      var test = elt("span", "\u200b");
      removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));
      if (measure.firstChild.offsetHeight != 0)
        zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !ie_lt8;
    }
    if (zwspSupported) return elt("span", "\u200b");
    else return elt("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px");
  }

  // See if "".split is the broken IE version, if so, provide an
  // alternative way to split lines.
  var splitLines = "\n\nb".split(/\n/).length != 3 ? function(string) {
    var pos = 0, result = [], l = string.length;
    while (pos <= l) {
      var nl = string.indexOf("\n", pos);
      if (nl == -1) nl = string.length;
      var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
      var rt = line.indexOf("\r");
      if (rt != -1) {
        result.push(line.slice(0, rt));
        pos += rt + 1;
      } else {
        result.push(line);
        pos = nl + 1;
      }
    }
    return result;
  } : function(string){return string.split(/\r\n?|\n/);};
  CodeMirror.splitLines = splitLines;

  var hasSelection = window.getSelection ? function(te) {
    try { return te.selectionStart != te.selectionEnd; }
    catch(e) { return false; }
  } : function(te) {
    try {var range = te.ownerDocument.selection.createRange();}
    catch(e) {}
    if (!range || range.parentElement() != te) return false;
    return range.compareEndPoints("StartToEnd", range) != 0;
  };

  var hasCopyEvent = (function() {
    var e = elt("div");
    if ("oncopy" in e) return true;
    e.setAttribute("oncopy", "return;");
    return typeof e.oncopy == 'function';
  })();

  // KEY NAMING

  var keyNames = {3: "Enter", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
                  19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
                  36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
                  46: "Delete", 59: ";", 91: "Mod", 92: "Mod", 93: "Mod", 109: "-", 107: "=", 127: "Delete",
                  186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
                  221: "]", 222: "'", 63276: "PageUp", 63277: "PageDown", 63275: "End", 63273: "Home",
                  63234: "Left", 63232: "Up", 63235: "Right", 63233: "Down", 63302: "Insert", 63272: "Delete"};
  CodeMirror.keyNames = keyNames;
  (function() {
    // Number keys
    for (var i = 0; i < 10; i++) keyNames[i + 48] = String(i);
    // Alphabetic keys
    for (var i = 65; i <= 90; i++) keyNames[i] = String.fromCharCode(i);
    // Function keys
    for (var i = 1; i <= 12; i++) keyNames[i + 111] = keyNames[i + 63235] = "F" + i;
  })();

  // BIDI HELPERS

  function iterateBidiSections(order, from, to, f) {
    if (!order) return f(from, to, "ltr");
    for (var i = 0; i < order.length; ++i) {
      var part = order[i];
      if (part.from < to && part.to > from || from == to && part.to == from)
        f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr");
    }
  }

  function bidiLeft(part) { return part.level % 2 ? part.to : part.from; }
  function bidiRight(part) { return part.level % 2 ? part.from : part.to; }

  function lineLeft(line) { var order = getOrder(line); return order ? bidiLeft(order[0]) : 0; }
  function lineRight(line) {
    var order = getOrder(line);
    if (!order) return line.text.length;
    return bidiRight(lst(order));
  }

  function lineStart(cm, lineN) {
    var line = getLine(cm.doc, lineN);
    var visual = visualLine(cm.doc, line);
    if (visual != line) lineN = lineNo(visual);
    var order = getOrder(visual);
    var ch = !order ? 0 : order[0].level % 2 ? lineRight(visual) : lineLeft(visual);
    return Pos(lineN, ch);
  }
  function lineEnd(cm, lineN) {
    var merged, line;
    while (merged = collapsedSpanAtEnd(line = getLine(cm.doc, lineN)))
      lineN = merged.find().to.line;
    var order = getOrder(line);
    var ch = !order ? line.text.length : order[0].level % 2 ? lineLeft(line) : lineRight(line);
    return Pos(lineN, ch);
  }

  function compareBidiLevel(order, a, b) {
    var linedir = order[0].level;
    if (a == linedir) return true;
    if (b == linedir) return false;
    return a < b;
  }
  var bidiOther;
  function getBidiPartAt(order, pos) {
    for (var i = 0, found; i < order.length; ++i) {
      var cur = order[i];
      if (cur.from < pos && cur.to > pos) { bidiOther = null; return i; }
      if (cur.from == pos || cur.to == pos) {
        if (found == null) {
          found = i;
        } else if (compareBidiLevel(order, cur.level, order[found].level)) {
          bidiOther = found;
          return i;
        } else {
          bidiOther = i;
          return found;
        }
      }
    }
    bidiOther = null;
    return found;
  }

  function moveInLine(line, pos, dir, byUnit) {
    if (!byUnit) return pos + dir;
    do pos += dir;
    while (pos > 0 && isExtendingChar.test(line.text.charAt(pos)));
    return pos;
  }

  // This is somewhat involved. It is needed in order to move
  // 'visually' through bi-directional text -- i.e., pressing left
  // should make the cursor go left, even when in RTL text. The
  // tricky part is the 'jumps', where RTL and LTR text touch each
  // other. This often requires the cursor offset to move more than
  // one unit, in order to visually move one unit.
  function moveVisually(line, start, dir, byUnit) {
    var bidi = getOrder(line);
    if (!bidi) return moveLogically(line, start, dir, byUnit);
    var pos = getBidiPartAt(bidi, start), part = bidi[pos];
    var target = moveInLine(line, start, part.level % 2 ? -dir : dir, byUnit);

    for (;;) {
      if (target > part.from && target < part.to) return target;
      if (target == part.from || target == part.to) {
        if (getBidiPartAt(bidi, target) == pos) return target;
        part = bidi[pos += dir];
        return (dir > 0) == part.level % 2 ? part.to : part.from;
      } else {
        part = bidi[pos += dir];
        if (!part) return null;
        if ((dir > 0) == part.level % 2)
          target = moveInLine(line, part.to, -1, byUnit);
        else
          target = moveInLine(line, part.from, 1, byUnit);
      }
    }
  }

  function moveLogically(line, start, dir, byUnit) {
    var target = start + dir;
    if (byUnit) while (target > 0 && isExtendingChar.test(line.text.charAt(target))) target += dir;
    return target < 0 || target > line.text.length ? null : target;
  }

  // Bidirectional ordering algorithm
  // See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
  // that this (partially) implements.

  // One-char codes used for character types:
  // L (L):   Left-to-Right
  // R (R):   Right-to-Left
  // r (AL):  Right-to-Left Arabic
  // 1 (EN):  European Number
  // + (ES):  European Number Separator
  // % (ET):  European Number Terminator
  // n (AN):  Arabic Number
  // , (CS):  Common Number Separator
  // m (NSM): Non-Spacing Mark
  // b (BN):  Boundary Neutral
  // s (B):   Paragraph Separator
  // t (S):   Segment Separator
  // w (WS):  Whitespace
  // N (ON):  Other Neutrals

  // Returns null if characters are ordered as they appear
  // (left-to-right), or an array of sections ({from, to, level}
  // objects) in the order in which they occur visually.
  var bidiOrdering = (function() {
    // Character types for codepoints 0 to 0xff
    var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLL";
    // Character types for codepoints 0x600 to 0x6ff
    var arabicTypes = "rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmmrrrrrrrrrrrrrrrrrr";
    function charType(code) {
      if (code <= 0xff) return lowTypes.charAt(code);
      else if (0x590 <= code && code <= 0x5f4) return "R";
      else if (0x600 <= code && code <= 0x6ff) return arabicTypes.charAt(code - 0x600);
      else if (0x700 <= code && code <= 0x8ac) return "r";
      else return "L";
    }

    var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
    var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;
    // Browsers seem to always treat the boundaries of block elements as being L.
    var outerType = "L";

    return function(str) {
      if (!bidiRE.test(str)) return false;
      var len = str.length, types = [];
      for (var i = 0, type; i < len; ++i)
        types.push(type = charType(str.charCodeAt(i)));

      // W1. Examine each non-spacing mark (NSM) in the level run, and
      // change the type of the NSM to the type of the previous
      // character. If the NSM is at the start of the level run, it will
      // get the type of sor.
      for (var i = 0, prev = outerType; i < len; ++i) {
        var type = types[i];
        if (type == "m") types[i] = prev;
        else prev = type;
      }

      // W2. Search backwards from each instance of a European number
      // until the first strong type (R, L, AL, or sor) is found. If an
      // AL is found, change the type of the European number to Arabic
      // number.
      // W3. Change all ALs to R.
      for (var i = 0, cur = outerType; i < len; ++i) {
        var type = types[i];
        if (type == "1" && cur == "r") types[i] = "n";
        else if (isStrong.test(type)) { cur = type; if (type == "r") types[i] = "R"; }
      }

      // W4. A single European separator between two European numbers
      // changes to a European number. A single common separator between
      // two numbers of the same type changes to that type.
      for (var i = 1, prev = types[0]; i < len - 1; ++i) {
        var type = types[i];
        if (type == "+" && prev == "1" && types[i+1] == "1") types[i] = "1";
        else if (type == "," && prev == types[i+1] &&
                 (prev == "1" || prev == "n")) types[i] = prev;
        prev = type;
      }

      // W5. A sequence of European terminators adjacent to European
      // numbers changes to all European numbers.
      // W6. Otherwise, separators and terminators change to Other
      // Neutral.
      for (var i = 0; i < len; ++i) {
        var type = types[i];
        if (type == ",") types[i] = "N";
        else if (type == "%") {
          for (var end = i + 1; end < len && types[end] == "%"; ++end) {}
          var replace = (i && types[i-1] == "!") || (end < len - 1 && types[end] == "1") ? "1" : "N";
          for (var j = i; j < end; ++j) types[j] = replace;
          i = end - 1;
        }
      }

      // W7. Search backwards from each instance of a European number
      // until the first strong type (R, L, or sor) is found. If an L is
      // found, then change the type of the European number to L.
      for (var i = 0, cur = outerType; i < len; ++i) {
        var type = types[i];
        if (cur == "L" && type == "1") types[i] = "L";
        else if (isStrong.test(type)) cur = type;
      }

      // N1. A sequence of neutrals takes the direction of the
      // surrounding strong text if the text on both sides has the same
      // direction. European and Arabic numbers act as if they were R in
      // terms of their influence on neutrals. Start-of-level-run (sor)
      // and end-of-level-run (eor) are used at level run boundaries.
      // N2. Any remaining neutrals take the embedding direction.
      for (var i = 0; i < len; ++i) {
        if (isNeutral.test(types[i])) {
          for (var end = i + 1; end < len && isNeutral.test(types[end]); ++end) {}
          var before = (i ? types[i-1] : outerType) == "L";
          var after = (end < len - 1 ? types[end] : outerType) == "L";
          var replace = before || after ? "L" : "R";
          for (var j = i; j < end; ++j) types[j] = replace;
          i = end - 1;
        }
      }

      // Here we depart from the documented algorithm, in order to avoid
      // building up an actual levels array. Since there are only three
      // levels (0, 1, 2) in an implementation that doesn't take
      // explicit embedding into account, we can build up the order on
      // the fly, without following the level-based algorithm.
      var order = [], m;
      for (var i = 0; i < len;) {
        if (countsAsLeft.test(types[i])) {
          var start = i;
          for (++i; i < len && countsAsLeft.test(types[i]); ++i) {}
          order.push({from: start, to: i, level: 0});
        } else {
          var pos = i, at = order.length;
          for (++i; i < len && types[i] != "L"; ++i) {}
          for (var j = pos; j < i;) {
            if (countsAsNum.test(types[j])) {
              if (pos < j) order.splice(at, 0, {from: pos, to: j, level: 1});
              var nstart = j;
              for (++j; j < i && countsAsNum.test(types[j]); ++j) {}
              order.splice(at, 0, {from: nstart, to: j, level: 2});
              pos = j;
            } else ++j;
          }
          if (pos < i) order.splice(at, 0, {from: pos, to: i, level: 1});
        }
      }
      if (order[0].level == 1 && (m = str.match(/^\s+/))) {
        order[0].from = m[0].length;
        order.unshift({from: 0, to: m[0].length, level: 0});
      }
      if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
        lst(order).to -= m[0].length;
        order.push({from: len - m[0].length, to: len, level: 0});
      }
      if (order[0].level != lst(order).level)
        order.push({from: len, to: len, level: order[0].level});

      return order;
    };
  })();

  // THE END

  CodeMirror.version = "3.14.0";

  return CodeMirror;
})();
// TODO actually recognize syntax of TypeScript constructs

CodeMirror.defineMode("javascript", function(config, parserConfig) {
  var indentUnit = config.indentUnit;
  var statementIndent = parserConfig.statementIndent;
  var jsonMode = parserConfig.json;
  var isTS = parserConfig.typescript;

  // Tokenizer

  var keywords = function(){
    function kw(type) {return {type: type, style: "keyword"};}
    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c");
    var operator = kw("operator"), atom = {type: "atom", style: "atom"};

    var jsKeywords = {
      "if": kw("if"), "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
      "return": C, "break": C, "continue": C, "new": C, "delete": C, "throw": C,
      "var": kw("var"), "const": kw("var"), "let": kw("var"),
      "function": kw("function"), "catch": kw("catch"),
      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
      "in": operator, "typeof": operator, "instanceof": operator,
      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom,
      "this": kw("this")
    };

    // Extend the 'normal' keywords with the TypeScript language extensions
    if (isTS) {
      var type = {type: "variable", style: "variable-3"};
      var tsKeywords = {
        // object-like things
        "interface": kw("interface"),
        "class": kw("class"),
        "extends": kw("extends"),
        "constructor": kw("constructor"),

        // scope modifiers
        "public": kw("public"),
        "private": kw("private"),
        "protected": kw("protected"),
        "static": kw("static"),

        "super": kw("super"),

        // types
        "string": type, "number": type, "bool": type, "any": type
      };

      for (var attr in tsKeywords) {
        jsKeywords[attr] = tsKeywords[attr];
      }
    }

    return jsKeywords;
  }();

  var isOperatorChar = /[+\-*&%=<>!?|~^]/;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  function nextUntilUnescaped(stream, end) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (next == end && !escaped)
        return false;
      escaped = !escaped && next == "\\";
    }
    return escaped;
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }

  function jsTokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'")
      return chain(stream, state, jsTokenString(ch));
    else if (/[\[\]{}\(\),;\:\.]/.test(ch))
      return ret(ch);
    else if (ch == "0" && stream.eat(/x/i)) {
      stream.eatWhile(/[\da-f]/i);
      return ret("number", "number");
    }
    else if (/\d/.test(ch) || ch == "-" && stream.eat(/\d/)) {
      stream.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/);
      return ret("number", "number");
    }
    else if (ch == "/") {
      if (stream.eat("*")) {
        return chain(stream, state, jsTokenComment);
      }
      else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      }
      else if (state.lastType == "operator" || state.lastType == "keyword c" ||
               /^[\[{}\(,;:]$/.test(state.lastType)) {
        nextUntilUnescaped(stream, "/");
        stream.eatWhile(/[gimy]/); // 'y' is "sticky" option in Mozilla
        return ret("regexp", "string-2");
      }
      else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", null, stream.current());
      }
    }
    else if (ch == "#") {
      stream.skipToEnd();
      return ret("error", "error");
    }
    else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator", null, stream.current());
    }
    else {
      stream.eatWhile(/[\w\$_]/);
      var word = stream.current(), known = keywords.propertyIsEnumerable(word) && keywords[word];
      return (known && state.lastType != ".") ? ret(known.type, known.style, word) :
                     ret("variable", "variable", word);
    }
  }

  function jsTokenString(quote) {
    return function(stream, state) {
      if (!nextUntilUnescaped(stream, quote))
        state.tokenize = jsTokenBase;
      return ret("string", "string");
    };
  }

  function jsTokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = jsTokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true, "this": true};

  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true;
  }

  function parseJS(state, style, type, content, stream) {
    var cc = state.cc;
    // Communicate our context to the combinators.
    // (Less wasteful than consing up a hundred closures on every call.)
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc;

    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
      if (combinator(type, content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
        return style;
      }
    }
  }

  // Combinator utils

  var cx = {state: null, column: null, marked: null, cc: null};
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function register(varname) {
    function inList(list) {
      for (var v = list; v; v = v.next)
        if (v.name == varname) return true;
      return false;
    }
    var state = cx.state;
    if (state.context) {
      cx.marked = "def";
      if (inList(state.localVars)) return;
      state.localVars = {name: varname, next: state.localVars};
    } else {
      if (inList(state.globalVars)) return;
      state.globalVars = {name: varname, next: state.globalVars};
    }
  }

  // Combinators

  var defaultVars = {name: "this", next: {name: "arguments"}};
  function pushcontext() {
    cx.state.context = {prev: cx.state.context, vars: cx.state.localVars};
    cx.state.localVars = defaultVars;
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars;
    cx.state.context = cx.state.context.prev;
  }
  function pushlex(type, info) {
    var result = function() {
      var state = cx.state, indent = state.indented;
      if (state.lexical.type == "stat") indent = state.lexical.indented;
      state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")")
        state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;

  function expect(wanted) {
    return function(type) {
      if (type == wanted) return cont();
      else if (wanted == ";") return pass();
      else return cont(arguments.callee);
    };
  }

  function statement(type) {
    if (type == "var") return cont(pushlex("vardef"), vardef1, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), expression, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "{") return cont(pushlex("}"), block, poplex);
    if (type == ";") return cont();
    if (type == "if") return cont(pushlex("form"), expression, statement, poplex, maybeelse(cx.state.indented));
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), expect("("), pushlex(")"), forspec1, expect(")"),
                                      poplex, statement, poplex);
    if (type == "variable") return cont(pushlex("stat"), maybelabel);
    if (type == "switch") return cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"),
                                         block, poplex, poplex);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"),
                                        statement, poplex, popcontext);
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function expression(type) {
    return expressionInner(type, false);
  }
  function expressionNoComma(type) {
    return expressionInner(type, true);
  }
  function expressionInner(type, noComma) {
    var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeop);
    if (type == "function") return cont(functiondef);
    if (type == "keyword c") return cont(noComma ? maybeexpressionNoComma : maybeexpression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeop);
    if (type == "operator") return cont(noComma ? expressionNoComma : expression);
    if (type == "[") return cont(pushlex("]"), commasep(expressionNoComma, "]"), poplex, maybeop);
    if (type == "{") return cont(pushlex("}"), commasep(objprop, "}"), poplex, maybeop);
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }
  function maybeexpressionNoComma(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expressionNoComma);
  }

  function maybeoperatorComma(type, value) {
    if (type == ",") return cont(expression);
    return maybeoperatorNoComma(type, value, maybeoperatorComma);
  }
  function maybeoperatorNoComma(type, value, me) {
    if (!me) me = maybeoperatorNoComma;
    if (type == "operator") {
      if (/\+\+|--/.test(value)) return cont(me);
      if (value == "?") return cont(expression, expect(":"), expression);
      return cont(expression);
    }
    if (type == ";") return;
    if (type == "(") return cont(pushlex(")", "call"), commasep(expressionNoComma, ")"), poplex, me);
    if (type == ".") return cont(property, me);
    if (type == "[") return cont(pushlex("]"), expression, expect("]"), poplex, me);
  }
  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperatorComma, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {cx.marked = "property"; return cont();}
  }
  function objprop(type, value) {
    if (type == "variable") {
      cx.marked = "property";
      if (value == "get" || value == "set") return cont(getterSetter);
    } else if (type == "number" || type == "string") {
      cx.marked = type + " property";
    }
    if (atomicTypes.hasOwnProperty(type)) return cont(expect(":"), expressionNoComma);
  }
  function getterSetter(type) {
    if (type == ":") return cont(expression);
    if (type != "variable") return cont(expect(":"), expression);
    cx.marked = "property";
    return cont(functiondef);
  }
  function commasep(what, end) {
    function proceed(type) {
      if (type == ",") {
        var lex = cx.state.lexical;
        if (lex.info == "call") lex.pos = (lex.pos || 0) + 1;
        return cont(what, proceed);
      }
      if (type == end) return cont();
      return cont(expect(end));
    }
    return function(type) {
      if (type == end) return cont();
      else return pass(what, proceed);
    };
  }
  function block(type) {
    if (type == "}") return cont();
    return pass(statement, block);
  }
  function maybetype(type) {
    if (type == ":") return cont(typedef);
    return pass();
  }
  function typedef(type) {
    if (type == "variable"){cx.marked = "variable-3"; return cont();}
    return pass();
  }
  function vardef1(type, value) {
    if (type == "variable") {
      register(value);
      return isTS ? cont(maybetype, vardef2) : cont(vardef2);
    }
    return pass();
  }
  function vardef2(type, value) {
    if (value == "=") return cont(expressionNoComma, vardef2);
    if (type == ",") return cont(vardef1);
  }
  function maybeelse(indent) {
    return function(type, value) {
      if (type == "keyword b" && value == "else") {
        cx.state.lexical = new JSLexical(indent, 0, "form", null, cx.state.lexical);
        return cont(statement, poplex);
      }
      return pass();
    };
  }
  function forspec1(type) {
    if (type == "var") return cont(vardef1, expect(";"), forspec2);
    if (type == ";") return cont(forspec2);
    if (type == "variable") return cont(formaybein);
    return pass(expression, expect(";"), forspec2);
  }
  function formaybein(_type, value) {
    if (value == "in") return cont(expression);
    return cont(maybeoperatorComma, forspec2);
  }
  function forspec2(type, value) {
    if (type == ";") return cont(forspec3);
    if (value == "in") return cont(expression);
    return pass(expression, expect(";"), forspec3);
  }
  function forspec3(type) {
    if (type != ")") cont(expression);
  }
  function functiondef(type, value) {
    if (type == "variable") {register(value); return cont(functiondef);}
    if (type == "(") return cont(pushlex(")"), pushcontext, commasep(funarg, ")"), poplex, statement, popcontext);
  }
  function funarg(type, value) {
    if (type == "variable") {register(value); return isTS ? cont(maybetype) : cont();}
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: jsTokenBase,
        lastType: null,
        cc: [],
        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
        localVars: parserConfig.localVars,
        globalVars: parserConfig.globalVars,
        context: parserConfig.localVars && {vars: parserConfig.localVars},
        indented: 0
      };
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty("align"))
          state.lexical.align = false;
        state.indented = stream.indentation();
      }
      if (state.tokenize != jsTokenComment && stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
      return parseJS(state, style, type, content, stream);
    },

    indent: function(state, textAfter) {
      if (state.tokenize == jsTokenComment) return CodeMirror.Pass;
      if (state.tokenize != jsTokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical;
      if (lexical.type == "stat" && firstChar == "}") lexical = lexical.prev;
      if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat")
        lexical = lexical.prev;
      var type = lexical.type, closing = firstChar == type;

      if (type == "vardef") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? 4 : 0);
      else if (type == "form" && firstChar == "{") return lexical.indented;
      else if (type == "form") return lexical.indented + indentUnit;
      else if (type == "stat")
        return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? statementIndent || indentUnit : 0);
      else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false)
        return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);
      else if (lexical.align) return lexical.column + (closing ? 0 : 1);
      else return lexical.indented + (closing ? 0 : indentUnit);
    },

    electricChars: ":{}",
    blockCommentStart: jsonMode ? null : "/*",
    blockCommentEnd: jsonMode ? null : "*/",
    lineComment: jsonMode ? null : "//",

    jsonMode: jsonMode
  };
});

CodeMirror.defineMIME("text/javascript", "javascript");
CodeMirror.defineMIME("text/ecmascript", "javascript");
CodeMirror.defineMIME("application/javascript", "javascript");
CodeMirror.defineMIME("application/ecmascript", "javascript");
CodeMirror.defineMIME("application/json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/x-json", {name: "javascript", json: true});
CodeMirror.defineMIME("text/typescript", { name: "javascript", typescript: true });
CodeMirror.defineMIME("application/typescript", { name: "javascript", typescript: true });
