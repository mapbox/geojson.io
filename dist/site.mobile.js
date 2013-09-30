require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){


//
// The shims in this file are not fully implemented shims for the ES5
// features, but do work for the particular usecases there is in
// the other modules.
//

var toString = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

// Array.isArray is supported in IE9
function isArray(xs) {
  return toString.call(xs) === '[object Array]';
}
exports.isArray = typeof Array.isArray === 'function' ? Array.isArray : isArray;

// Array.prototype.indexOf is supported in IE9
exports.indexOf = function indexOf(xs, x) {
  if (xs.indexOf) return xs.indexOf(x);
  for (var i = 0; i < xs.length; i++) {
    if (x === xs[i]) return i;
  }
  return -1;
};

// Array.prototype.filter is supported in IE9
exports.filter = function filter(xs, fn) {
  if (xs.filter) return xs.filter(fn);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    if (fn(xs[i], i, xs)) res.push(xs[i]);
  }
  return res;
};

// Array.prototype.forEach is supported in IE9
exports.forEach = function forEach(xs, fn, self) {
  if (xs.forEach) return xs.forEach(fn, self);
  for (var i = 0; i < xs.length; i++) {
    fn.call(self, xs[i], i, xs);
  }
};

// Array.prototype.map is supported in IE9
exports.map = function map(xs, fn) {
  if (xs.map) return xs.map(fn);
  var out = new Array(xs.length);
  for (var i = 0; i < xs.length; i++) {
    out[i] = fn(xs[i], i, xs);
  }
  return out;
};

// Array.prototype.reduce is supported in IE9
exports.reduce = function reduce(array, callback, opt_initialValue) {
  if (array.reduce) return array.reduce(callback, opt_initialValue);
  var value, isValueSet = false;

  if (2 < arguments.length) {
    value = opt_initialValue;
    isValueSet = true;
  }
  for (var i = 0, l = array.length; l > i; ++i) {
    if (array.hasOwnProperty(i)) {
      if (isValueSet) {
        value = callback(value, array[i], i, array);
      }
      else {
        value = array[i];
        isValueSet = true;
      }
    }
  }

  return value;
};

// String.prototype.substr - negative index don't work in IE8
if ('ab'.substr(-1) !== 'b') {
  exports.substr = function (str, start, length) {
    // did we get a negative start, calculate how much it is from the beginning of the string
    if (start < 0) start = str.length + start;

    // call the original function
    return str.substr(start, length);
  };
} else {
  exports.substr = function (str, start, length) {
    return str.substr(start, length);
  };
}

// String.prototype.trim is supported in IE9
exports.trim = function (str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, '');
};

// Function.prototype.bind is supported in IE9
exports.bind = function () {
  var args = Array.prototype.slice.call(arguments);
  var fn = args.shift();
  if (fn.bind) return fn.bind.apply(fn, args);
  var self = args.shift();
  return function () {
    fn.apply(self, args.concat([Array.prototype.slice.call(arguments)]));
  };
};

// Object.create is supported in IE9
function create(prototype, properties) {
  var object;
  if (prototype === null) {
    object = { '__proto__' : null };
  }
  else {
    if (typeof prototype !== 'object') {
      throw new TypeError(
        'typeof prototype[' + (typeof prototype) + '] != \'object\''
      );
    }
    var Type = function () {};
    Type.prototype = prototype;
    object = new Type();
    object.__proto__ = prototype;
  }
  if (typeof properties !== 'undefined' && Object.defineProperties) {
    Object.defineProperties(object, properties);
  }
  return object;
}
exports.create = typeof Object.create === 'function' ? Object.create : create;

// Object.keys and Object.getOwnPropertyNames is supported in IE9 however
// they do show a description and number property on Error objects
function notObject(object) {
  return ((typeof object != "object" && typeof object != "function") || object === null);
}

function keysShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.keys called on a non-object");
  }

  var result = [];
  for (var name in object) {
    if (hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// getOwnPropertyNames is almost the same as Object.keys one key feature
//  is that it returns hidden properties, since that can't be implemented,
//  this feature gets reduced so it just shows the length property on arrays
function propertyShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.getOwnPropertyNames called on a non-object");
  }

  var result = keysShim(object);
  if (exports.isArray(object) && exports.indexOf(object, 'length') === -1) {
    result.push('length');
  }
  return result;
}

var keys = typeof Object.keys === 'function' ? Object.keys : keysShim;
var getOwnPropertyNames = typeof Object.getOwnPropertyNames === 'function' ?
  Object.getOwnPropertyNames : propertyShim;

if (new Error().hasOwnProperty('description')) {
  var ERROR_PROPERTY_FILTER = function (obj, array) {
    if (toString.call(obj) === '[object Error]') {
      array = exports.filter(array, function (name) {
        return name !== 'description' && name !== 'number' && name !== 'message';
      });
    }
    return array;
  };

  exports.keys = function (object) {
    return ERROR_PROPERTY_FILTER(object, keys(object));
  };
  exports.getOwnPropertyNames = function (object) {
    return ERROR_PROPERTY_FILTER(object, getOwnPropertyNames(object));
  };
} else {
  exports.keys = keys;
  exports.getOwnPropertyNames = getOwnPropertyNames;
}

// Object.getOwnPropertyDescriptor - supported in IE8 but only on dom elements
function valueObject(value, key) {
  return { value: value[key] };
}

if (typeof Object.getOwnPropertyDescriptor === 'function') {
  try {
    Object.getOwnPropertyDescriptor({'a': 1}, 'a');
    exports.getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  } catch (e) {
    // IE8 dom element issue - use a try catch and default to valueObject
    exports.getOwnPropertyDescriptor = function (value, key) {
      try {
        return Object.getOwnPropertyDescriptor(value, key);
      } catch (e) {
        return valueObject(value, key);
      }
    };
  }
} else {
  exports.getOwnPropertyDescriptor = valueObject;
}

},{}],2:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}],3:[function(require,module,exports){
var process=require("__browserify_process");// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util');
var shims = require('_shims');

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (!util.isString(path)) {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(shims.filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = shims.substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(shims.filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(shims.filter(paths, function(p, index) {
    if (!util.isString(p)) {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

},{"__browserify_process":6,"_shims":1,"util":4}],4:[function(require,module,exports){
var Buffer=require("__browserify_Buffer").Buffer;// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var shims = require('_shims');

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  shims.forEach(array, function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = shims.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = shims.getOwnPropertyNames(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }

  shims.forEach(keys, function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = shims.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }

  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (shims.indexOf(ctx.seen, desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = shims.reduce(output, function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return shims.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) && objectToString(e) === '[object Error]';
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return arg instanceof Buffer;
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = shims.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = shims.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"__browserify_Buffer":5,"_shims":1}],5:[function(require,module,exports){
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],"q9TxCC":[function(require,module,exports){
var assert;
exports.Buffer = Buffer;
exports.SlowBuffer = Buffer;
Buffer.poolSize = 8192;
exports.INSPECT_MAX_BYTES = 50;

function stringtrim(str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, '');
}

function Buffer(subject, encoding, offset) {
  if(!assert) assert= require('assert');
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }
  this.parent = this;
  this.offset = 0;

  // Work-around: node's base64 implementation
  // allows for non-padded strings while base64-js
  // does not..
  if (encoding == "base64" && typeof subject == "string") {
    subject = stringtrim(subject);
    while (subject.length % 4 != 0) {
      subject = subject + "="; 
    }
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    // slicing works, with limitations (no parent tracking/update)
    // check https://github.com/toots/buffer-browserify/issues/19
    for (var i = 0; i < this.length; i++) {
        this[i] = subject.get(i+offset);
    }
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        if (subject instanceof Buffer) {
          this[i] = subject.readUInt8(i);
        }
        else {
          this[i] = subject[i];
        }
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    } else if (type === 'number') {
      for (var i = 0; i < this.length; i++) {
        this[i] = 0;
      }
    }
  }
}

Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this[i];
};

Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this[i] = v;
};

Buffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
    case 'binary':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

Buffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

Buffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

Buffer.prototype.binaryWrite = Buffer.prototype.asciiWrite;

Buffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

Buffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
};

Buffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

Buffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

Buffer.prototype.binarySlice = Buffer.prototype.asciiSlice;

Buffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


Buffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  Buffer._charsWritten = i * 2;
  return i;
};


Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};

// slice(start, end)
function clamp(index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue;
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len;
  if (index >= 0) return index;
  index += len;
  if (index >= 0) return index;
  return 0;
}

Buffer.prototype.slice = function(start, end) {
  var len = this.length;
  start = clamp(start, len, 0);
  end = clamp(end, len, len);
  return new Buffer(this, end - start, +start);
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  if (end === undefined || isNaN(end)) {
    end = this.length;
  }
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  var temp = [];
  for (var i=start; i<end; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=target_start; i<target_start+temp.length; i++) {
    target[i] = temp[i-target_start];
  }
};

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  for (var i = start; i < end; i++) {
    this[i] = value;
  }
}

// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof Buffer;
};

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

Buffer.isEncoding = function(encoding) {
  switch ((encoding + '').toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
    case 'raw':
      return true;

    default:
      return false;
  }
};

// helpers

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}

function isArray(subject) {
  return (Array.isArray ||
    function(subject){
      return {}.toString.apply(subject) == '[object Array]'
    })
    (subject)
}

function isArrayIsh(subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

// read/write bit-twiddling

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  return buffer[offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    val = buffer[offset] << 8;
    if (offset + 1 < buffer.length) {
      val |= buffer[offset + 1];
    }
  } else {
    val = buffer[offset];
    if (offset + 1 < buffer.length) {
      val |= buffer[offset + 1] << 8;
    }
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    if (offset + 1 < buffer.length)
      val = buffer[offset + 1] << 16;
    if (offset + 2 < buffer.length)
      val |= buffer[offset + 2] << 8;
    if (offset + 3 < buffer.length)
      val |= buffer[offset + 3];
    val = val + (buffer[offset] << 24 >>> 0);
  } else {
    if (offset + 2 < buffer.length)
      val = buffer[offset + 2] << 16;
    if (offset + 1 < buffer.length)
      val |= buffer[offset + 1] << 8;
    val |= buffer[offset];
    if (offset + 3 < buffer.length)
      val = val + (buffer[offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  neg = buffer[offset] & 0x80;
  if (!neg) {
    return (buffer[offset]);
  }

  return ((0xff - buffer[offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  if (offset < buffer.length) {
    buffer[offset] = value;
  }
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {
    buffer[offset + i] =
        (value & (0xff << (8 * (isBigEndian ? 1 - i : i)))) >>>
            (isBigEndian ? 1 - i : i) * 8;
  }

}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {
    buffer[offset + i] =
        (value >>> (isBigEndian ? 3 - i : i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

},{"./buffer_ieee754":1,"assert":6,"base64-js":4}],"buffer-browserify":[function(require,module,exports){
module.exports=require('q9TxCC');
},{}],4:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}],5:[function(require,module,exports){


//
// The shims in this file are not fully implemented shims for the ES5
// features, but do work for the particular usecases there is in
// the other modules.
//

var toString = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

// Array.isArray is supported in IE9
function isArray(xs) {
  return toString.call(xs) === '[object Array]';
}
exports.isArray = typeof Array.isArray === 'function' ? Array.isArray : isArray;

// Array.prototype.indexOf is supported in IE9
exports.indexOf = function indexOf(xs, x) {
  if (xs.indexOf) return xs.indexOf(x);
  for (var i = 0; i < xs.length; i++) {
    if (x === xs[i]) return i;
  }
  return -1;
};

// Array.prototype.filter is supported in IE9
exports.filter = function filter(xs, fn) {
  if (xs.filter) return xs.filter(fn);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    if (fn(xs[i], i, xs)) res.push(xs[i]);
  }
  return res;
};

// Array.prototype.forEach is supported in IE9
exports.forEach = function forEach(xs, fn, self) {
  if (xs.forEach) return xs.forEach(fn, self);
  for (var i = 0; i < xs.length; i++) {
    fn.call(self, xs[i], i, xs);
  }
};

// Array.prototype.map is supported in IE9
exports.map = function map(xs, fn) {
  if (xs.map) return xs.map(fn);
  var out = new Array(xs.length);
  for (var i = 0; i < xs.length; i++) {
    out[i] = fn(xs[i], i, xs);
  }
  return out;
};

// Array.prototype.reduce is supported in IE9
exports.reduce = function reduce(array, callback, opt_initialValue) {
  if (array.reduce) return array.reduce(callback, opt_initialValue);
  var value, isValueSet = false;

  if (2 < arguments.length) {
    value = opt_initialValue;
    isValueSet = true;
  }
  for (var i = 0, l = array.length; l > i; ++i) {
    if (array.hasOwnProperty(i)) {
      if (isValueSet) {
        value = callback(value, array[i], i, array);
      }
      else {
        value = array[i];
        isValueSet = true;
      }
    }
  }

  return value;
};

// String.prototype.substr - negative index don't work in IE8
if ('ab'.substr(-1) !== 'b') {
  exports.substr = function (str, start, length) {
    // did we get a negative start, calculate how much it is from the beginning of the string
    if (start < 0) start = str.length + start;

    // call the original function
    return str.substr(start, length);
  };
} else {
  exports.substr = function (str, start, length) {
    return str.substr(start, length);
  };
}

// String.prototype.trim is supported in IE9
exports.trim = function (str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, '');
};

// Function.prototype.bind is supported in IE9
exports.bind = function () {
  var args = Array.prototype.slice.call(arguments);
  var fn = args.shift();
  if (fn.bind) return fn.bind.apply(fn, args);
  var self = args.shift();
  return function () {
    fn.apply(self, args.concat([Array.prototype.slice.call(arguments)]));
  };
};

// Object.create is supported in IE9
function create(prototype, properties) {
  var object;
  if (prototype === null) {
    object = { '__proto__' : null };
  }
  else {
    if (typeof prototype !== 'object') {
      throw new TypeError(
        'typeof prototype[' + (typeof prototype) + '] != \'object\''
      );
    }
    var Type = function () {};
    Type.prototype = prototype;
    object = new Type();
    object.__proto__ = prototype;
  }
  if (typeof properties !== 'undefined' && Object.defineProperties) {
    Object.defineProperties(object, properties);
  }
  return object;
}
exports.create = typeof Object.create === 'function' ? Object.create : create;

// Object.keys and Object.getOwnPropertyNames is supported in IE9 however
// they do show a description and number property on Error objects
function notObject(object) {
  return ((typeof object != "object" && typeof object != "function") || object === null);
}

function keysShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.keys called on a non-object");
  }

  var result = [];
  for (var name in object) {
    if (hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// getOwnPropertyNames is almost the same as Object.keys one key feature
//  is that it returns hidden properties, since that can't be implemented,
//  this feature gets reduced so it just shows the length property on arrays
function propertyShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.getOwnPropertyNames called on a non-object");
  }

  var result = keysShim(object);
  if (exports.isArray(object) && exports.indexOf(object, 'length') === -1) {
    result.push('length');
  }
  return result;
}

var keys = typeof Object.keys === 'function' ? Object.keys : keysShim;
var getOwnPropertyNames = typeof Object.getOwnPropertyNames === 'function' ?
  Object.getOwnPropertyNames : propertyShim;

if (new Error().hasOwnProperty('description')) {
  var ERROR_PROPERTY_FILTER = function (obj, array) {
    if (toString.call(obj) === '[object Error]') {
      array = exports.filter(array, function (name) {
        return name !== 'description' && name !== 'number' && name !== 'message';
      });
    }
    return array;
  };

  exports.keys = function (object) {
    return ERROR_PROPERTY_FILTER(object, keys(object));
  };
  exports.getOwnPropertyNames = function (object) {
    return ERROR_PROPERTY_FILTER(object, getOwnPropertyNames(object));
  };
} else {
  exports.keys = keys;
  exports.getOwnPropertyNames = getOwnPropertyNames;
}

// Object.getOwnPropertyDescriptor - supported in IE8 but only on dom elements
function valueObject(value, key) {
  return { value: value[key] };
}

if (typeof Object.getOwnPropertyDescriptor === 'function') {
  try {
    Object.getOwnPropertyDescriptor({'a': 1}, 'a');
    exports.getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  } catch (e) {
    // IE8 dom element issue - use a try catch and default to valueObject
    exports.getOwnPropertyDescriptor = function (value, key) {
      try {
        return Object.getOwnPropertyDescriptor(value, key);
      } catch (e) {
        return valueObject(value, key);
      }
    };
  }
} else {
  exports.getOwnPropertyDescriptor = valueObject;
}

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// UTILITY
var util = require('util');
var shims = require('_shims');
var pSlice = Array.prototype.slice;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  this.message = options.message || getMessage(this);
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = shims.keys(a),
        kb = shims.keys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};
},{"_shims":5,"util":7}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var shims = require('_shims');

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  shims.forEach(array, function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = shims.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = shims.getOwnPropertyNames(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }

  shims.forEach(keys, function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = shims.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }

  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (shims.indexOf(ctx.seen, desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = shims.reduce(output, function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return shims.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) && objectToString(e) === '[object Error]';
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return arg instanceof Buffer;
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = shims.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = shims.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"_shims":5}]},{},[])
;;module.exports=require("buffer-browserify")

},{}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],7:[function(require,module,exports){
var Buffer=require("__browserify_Buffer").Buffer;"use strict";
function objectToString(o) {
  return Object.prototype.toString.call(o);
}

var util = {
  isArray: function (ar) {
    return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
  },
  isDate: function (d) {
    return typeof d === 'object' && objectToString(d) === '[object Date]';
  },
  isRegExp: function (re) {
    return typeof re === 'object' && objectToString(re) === '[object RegExp]';
  },
  getRegExpFlags: function (re) {
    var flags = '';
    re.global && (flags += 'g');
    re.ignoreCase && (flags += 'i');
    re.multiline && (flags += 'm');
    return flags;
  }
};

module.exports = clone;

/**
 * Clones (copies) an Object using deep copying.
 *
 * This function supports circular references by default, but if you are certain
 * there are no circular references in your object, you can save some CPU time
 * by calling clone(obj, false).
 *
 * Caution: if `circular` is false and `parent` contains circular references,
 * your program may enter an infinite loop and crash.
 *
 * @param `parent` - the object to be cloned
 * @param `circular` - set to true if the object to be cloned may contain
 *    circular references. (optional - true by default)
*/
function clone(parent, circular) {
  if (typeof circular == 'undefined')
    circular = true;

  var useBuffer = typeof Buffer != 'undefined';

  var circularParent = {};
  var circularResolved = {};
  var circularReplace = [];

  function _clone(parent, context, child, cIndex) {
    var i; // Use local context within this function
    // Deep clone all properties of parent into child
    if (typeof parent == 'object') {
      if (parent == null)
        return parent;
      // Check for circular references
      for(i in circularParent)
        if (circularParent[i] === parent) {
          // We found a circular reference
          circularReplace.push({'resolveTo': i, 'child': child, 'i': cIndex});
          return null; //Just return null for now...
          // we will resolve circular references later
        }

      // Add to list of all parent objects
      circularParent[context] = parent;
      // Now continue cloning...
      if (util.isArray(parent)) {
        child = [];
        for(i in parent)
          child[i] = _clone(parent[i], context + '[' + i + ']', child, i);
      }
      else if (util.isDate(parent))
        child = new Date(parent.getTime());
      else if (util.isRegExp(parent)) {
        child = new RegExp(parent.source, util.getRegExpFlags(parent));
        if (parent.lastIndex) child.lastIndex = parent.lastIndex;
      } else if (useBuffer && Buffer.isBuffer(parent))
      {
        child = new Buffer(parent.length);
        parent.copy(child);
      }
      else {
        child = {};

        // Also copy prototype over to new cloned object
        child.__proto__ = parent.__proto__;
        for(i in parent)
          child[i] = _clone(parent[i], context + '[' + i + ']', child, i);
      }

      // Add to list of all cloned objects
      circularResolved[context] = child;
    }
    else
      child = parent; //Just a simple shallow copy will do
    return child;
  }

  var i;
  if (circular) {
    var cloned = _clone(parent, '*');

    // Now this object has been cloned. Let's check to see if there are any
    // circular references for it
    for(i in circularReplace) {
      var c = circularReplace[i];
      if (c && c.child && c.i in c.child) {
        c.child[c.i] = circularResolved[c.resolveTo];
      }
    }
    return cloned;
  } else {
    // Deep clone all properties of parent into child
    var child;
    if (typeof parent == 'object') {
      if (parent == null)
        return parent;
      if (parent.constructor.name === 'Array') {
        child = [];
        for(i in parent)
          child[i] = clone(parent[i], circular);
      }
      else if (util.isDate(parent))
        child = new Date(parent.getTime() );
      else if (util.isRegExp(parent)) {
        child = new RegExp(parent.source, util.getRegExpFlags(parent));
        if (parent.lastIndex) child.lastIndex = parent.lastIndex;
      } else {
        child = {};
        child.__proto__ = parent.__proto__;
        for(i in parent)
          child[i] = clone(parent[i], circular);
      }
    }
    else
      child = parent; // Just a simple shallow clone will do
    return child;
  }
}

/**
 * Simple flat clone using prototype, accepts only objects, usefull for property
 * override on FLAT configuration object (no nested props).
 *
 * USE WITH CAUTION! This may not behave as you wish if you do not know how this
 * works.
 */
clone.clonePrototype = function(parent) {
  if (parent === null)
    return null;

  var c = function () {};
  c.prototype = parent;
  return new c();
};

},{"__browserify_Buffer":5}],8:[function(require,module,exports){
var dsv = require('dsv'),
    sexagesimal = require('sexagesimal');

function isLat(f) { return !!f.match(/(Lat)(itude)?/gi); }
function isLon(f) { return !!f.match(/(L)(on|ng)(gitude)?/i); }

function keyCount(o) {
    return (typeof o == 'object') ? Object.keys(o).length : 0;
}

function autoDelimiter(x) {
    var delimiters = [',', ';', '\t', '|'];
    var results = [];

    delimiters.forEach(function(delimiter) {
        var res = dsv(delimiter).parse(x);
        if (res.length >= 1) {
            var count = keyCount(res[0]);
            for (var i = 0; i < res.length; i++) {
                if (keyCount(res[i]) !== count) return;
            }
        }
        results.push({
            delimiter: delimiter,
            arity: Object.keys(res[0]).length,
        });
    });

    if (results.length) {
        return results.sort(function(a, b) {
            return b.arity - a.arity;
        })[0].delimiter;
    } else {
        return null;
    }
}

function auto(x) {
    var delimiter = autoDelimiter(x);
    if (!delimiter) return null;
    return dsv(delimiter).parse(x);
}

function csv2geojson(x, options, callback) {

    if (!callback) {
        callback = options;
        options = {};
    }

    options.delimiter = options.delimiter || ',';

    var latfield = options.latfield || '',
        lonfield = options.lonfield || '';

    var features = [],
        featurecollection = { type: 'FeatureCollection', features: features };

    if (options.delimiter === 'auto' && typeof x == 'string') {
        options.delimiter = autoDelimiter(x);
        if (!options.delimiter) return callback({
            type: 'Error',
            message: 'Could not autodetect delimiter'
        });
    }

    var parsed = (typeof x == 'string') ? dsv(options.delimiter).parse(x) : x;

    if (!parsed.length) return callback(null, featurecollection);

    if (!latfield || !lonfield) {
        for (var f in parsed[0]) {
            if (!latfield && isLat(f)) latfield = f;
            if (!lonfield && isLon(f)) lonfield = f;
        }
        if (!latfield || !lonfield) {
            var fields = [];
            for (var k in parsed[0]) fields.push(k);
            return callback({
                type: 'Error',
                message: 'Latitude and longitude fields not present',
                data: parsed,
                fields: fields
            });
        }
    }

    var errors = [];

    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i][lonfield] !== undefined &&
            parsed[i][lonfield] !== undefined) {

            var lonk = parsed[i][lonfield],
                latk = parsed[i][latfield],
                lonf, latf,
                a;

            a = sexagesimal(lonk, 'EW');
            if (a) lonk = a;
            a = sexagesimal(latk, 'NS');
            if (a) latk = a;

            lonf = parseFloat(lonk);
            latf = parseFloat(latk);

            if (isNaN(lonf) ||
                isNaN(latf)) {
                errors.push({
                    message: 'A row contained an invalid value for latitude or longitude',
                    row: parsed[i]
                });
            } else {
                if (!options.includeLatLon) {
                    delete parsed[i][lonfield];
                    delete parsed[i][latfield];
                }

                features.push({
                    type: 'Feature',
                    properties: parsed[i],
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            parseFloat(lonf),
                            parseFloat(latf)
                        ]
                    }
                });
            }
        }
    }

    callback(errors.length ? errors: null, featurecollection);
}

function toLine(gj) {
    var features = gj.features;
    var line = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: []
        }
    };
    for (var i = 0; i < features.length; i++) {
        line.geometry.coordinates.push(features[i].geometry.coordinates);
    }
    line.properties = features[0].properties;
    return {
        type: 'FeatureSet',
        features: [line]
    };
}

function toPolygon(gj) {
    var features = gj.features;
    var poly = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[]]
        }
    };
    for (var i = 0; i < features.length; i++) {
        poly.geometry.coordinates[0].push(features[i].geometry.coordinates);
    }
    poly.properties = features[0].properties;
    return {
        type: 'FeatureSet',
        features: [poly]
    };
}

module.exports = {
    isLon: isLon,
    isLat: isLat,
    csv: dsv.csv.parse,
    tsv: dsv.tsv.parse,
    dsv: dsv,
    auto: auto,
    csv2geojson: csv2geojson,
    toLine: toLine,
    toPolygon: toPolygon
};

},{"dsv":9,"sexagesimal":10}],9:[function(require,module,exports){
var fs = require("fs");

module.exports = new Function("dsv.version = \"0.0.3\";\n\ndsv.tsv = dsv(\"\\t\");\ndsv.csv = dsv(\",\");\n\nfunction dsv(delimiter) {\n  var dsv = {},\n      reFormat = new RegExp(\"[\\\"\" + delimiter + \"\\n]\"),\n      delimiterCode = delimiter.charCodeAt(0);\n\n  dsv.parse = function(text, f) {\n    var o;\n    return dsv.parseRows(text, function(row, i) {\n      if (o) return o(row, i - 1);\n      var a = new Function(\"d\", \"return {\" + row.map(function(name, i) {\n        return JSON.stringify(name) + \": d[\" + i + \"]\";\n      }).join(\",\") + \"}\");\n      o = f ? function(row, i) { return f(a(row), i); } : a;\n    });\n  };\n\n  dsv.parseRows = function(text, f) {\n    var EOL = {}, // sentinel value for end-of-line\n        EOF = {}, // sentinel value for end-of-file\n        rows = [], // output rows\n        N = text.length,\n        I = 0, // current character index\n        n = 0, // the current line number\n        t, // the current token\n        eol; // is the current token followed by EOL?\n\n    function token() {\n      if (I >= N) return EOF; // special case: end of file\n      if (eol) return eol = false, EOL; // special case: end of line\n\n      // special case: quotes\n      var j = I;\n      if (text.charCodeAt(j) === 34) {\n        var i = j;\n        while (i++ < N) {\n          if (text.charCodeAt(i) === 34) {\n            if (text.charCodeAt(i + 1) !== 34) break;\n            ++i;\n          }\n        }\n        I = i + 2;\n        var c = text.charCodeAt(i + 1);\n        if (c === 13) {\n          eol = true;\n          if (text.charCodeAt(i + 2) === 10) ++I;\n        } else if (c === 10) {\n          eol = true;\n        }\n        return text.substring(j + 1, i).replace(/\"\"/g, \"\\\"\");\n      }\n\n      // common case: find next delimiter or newline\n      while (I < N) {\n        var c = text.charCodeAt(I++), k = 1;\n        if (c === 10) eol = true; // \\n\n        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \\r|\\r\\n\n        else if (c !== delimiterCode) continue;\n        return text.substring(j, I - k);\n      }\n\n      // special case: last token before EOF\n      return text.substring(j);\n    }\n\n    while ((t = token()) !== EOF) {\n      var a = [];\n      while (t !== EOL && t !== EOF) {\n        a.push(t);\n        t = token();\n      }\n      if (f && !(a = f(a, n++))) continue;\n      rows.push(a);\n    }\n\n    return rows;\n  };\n\n  dsv.format = function(rows) {\n    if (Array.isArray(rows[0])) return dsv.formatRows(rows); // deprecated; use formatRows\n    var fieldSet = {}, fields = [];\n\n    // Compute unique fields in order of discovery.\n    rows.forEach(function(row) {\n      for (var field in row) {\n        if (!(field in fieldSet)) {\n          fields.push(fieldSet[field] = field);\n        }\n      }\n    });\n\n    return [fields.map(formatValue).join(delimiter)].concat(rows.map(function(row) {\n      return fields.map(function(field) {\n        return formatValue(row[field]);\n      }).join(delimiter);\n    })).join(\"\\n\");\n  };\n\n  dsv.formatRows = function(rows) {\n    return rows.map(formatRow).join(\"\\n\");\n  };\n\n  function formatRow(row) {\n    return row.map(formatValue).join(delimiter);\n  }\n\n  function formatValue(text) {\n    return reFormat.test(text) ? \"\\\"\" + text.replace(/\\\"/g, \"\\\"\\\"\") + \"\\\"\" : text;\n  }\n\n  return dsv;\n}\n" + ";return dsv")();

},{"fs":2}],10:[function(require,module,exports){
module.exports = function(x, dims) {
    if (!dims) dims = 'NSEW';
    if (typeof x !== 'string') return null;
    var r = /^([0-9.]+)°? *(?:([0-9.]+)['’′‘] *)?(?:([0-9.]+)(?:''|"|”|″) *)?([NSEW])?/,
        m = x.match(r);
    if (!m) return null;
    else if (m[4] && dims.indexOf(m[4]) === -1) return null;
    else return (((m[1]) ? parseFloat(m[1]) : 0) +
        ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
        ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
        ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1);
};

},{}],11:[function(require,module,exports){
if (typeof module !== 'undefined') {
    module.exports = function(d3) {
        return metatable;
    };
}

function metatable() {
    var event = d3.dispatch('change', 'rowfocus');

    function table(selection) {
        selection.each(function(d) {
            var sel = d3.select(this),
                table;

            var keyset = d3.set();
            d.map(Object.keys).forEach(function(k) {
                k.forEach(function(_) {
                    keyset.add(_);
                });
            });

            bootstrap();
            paint();

            function bootstrap() {

                var controls = sel.selectAll('.controls')
                    .data([d])
                    .enter()
                    .append('div')
                    .attr('class', 'controls');

                var colbutton = controls.append('button')
                    .on('click', function() {
                        var name = prompt('column name');
                        if (name) {
                            keyset.add(name);
                            paint();
                        }
                    });
                colbutton.append('span').attr('class', 'icon-plus');
                colbutton.append('span').text(' new column');

                var enter = sel.selectAll('table').data([d]).enter().append('table');
                var thead = enter.append('thead');
                var tbody = enter.append('tbody');
                var tr = thead.append('tr');

                table = sel.select('table');
            }

            function paint() {

                var keys = keyset.values();

                var th = table
                    .select('thead')
                    .select('tr')
                    .selectAll('th')
                    .data(keys, function(d) { return d; });

                var delbutton = th.enter().append('th')
                    .append('span')
                    .text(String)
                    .append('button');

                th.exit().remove();

                var tr = table.select('tbody').selectAll('tr')
                    .data(function(d) { return d; });

                tr.enter()
                    .append('tr');

                tr.exit().remove();

                var td = tr.selectAll('td')
                    .data(keys, function(d) { return d; });

                td.enter()
                    .append('td')
                    .append('input')
                    .attr('field', String);

                td.exit().remove();

                delbutton.on('click', function(d) {
                        var name = d;
                        if (confirm('Delete column ' + name + '?')) {
                            keyset.remove(name);
                            tr.selectAll('input')
                                .data(function(d, i) {
                                    var map = d3.map(d);
                                    map.remove(name);
                                    var reduced = mapToObject(map);
                                    event.change(reduced, i);
                                    return {
                                        data: reduced,
                                        index: i
                                    };
                                });
                            paint();
                        }
                    });
                delbutton.append('span').attr('class', 'icon-minus');
                delbutton.append('span').text(' delete');

                function coerceNum(x) {
                    var fl = parseFloat(x);
                    if (fl.toString() === x) return fl;
                    else return x;
                }

                function write(d) {
                    d.data[d3.select(this).attr('field')] = coerceNum(this.value);
                    event.change(d.data, d.index);
                }

                function mapToObject(map) {
                    return map.entries()
                        .reduce(function(memo, d) {
                            memo[d.key] = d.value;
                            return memo;
                        }, {});
                }

                tr.selectAll('input')
                    .data(function(d, i) {
                        return d3.range(keys.length).map(function() {
                            return {
                                data: d,
                                index: i
                            };
                        });
                    })
                    .classed('disabled', function(d) {
                        return d.data[d3.select(this).attr('field')] === undefined;
                    })
                    .property('value', function(d) {
                        var value = d.data[d3.select(this).attr('field')];
                        return !isNaN(value) ? value : value || '';
                    })
                    .on('keyup', write)
                    .on('change', write)
                    .on('click', function(d) {
                        if (d.data[d3.select(this).attr('field')] === undefined) {
                            d.data[d3.select(this).attr('field')] = '';
                            paint();
                        }
                    })
                    .on('focus', function(d) {
                        event.rowfocus(d.data, d.index);
                    });
            }
        });
    }

    return d3.rebind(table, event, 'on');
}

},{}],12:[function(require,module,exports){
module.exports = function(_, def) {
    def = def === undefined ? 4 : def;
    if (_ === '{}') return '    ';
    var lines = _.split('\n');
    if (lines.length < 2) return null;
    var space = lines[1].match(/^(\s*)/);
    return space[0];
};

},{}],13:[function(require,module,exports){
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2013-01-23
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs
  || (navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
  || (function(view) {
	"use strict";
	var
		  doc = view.document
		  // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, URL = view.URL || view.webkitURL || view
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link =  !view.externalHost && "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			node.dispatchEvent(event);
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function (ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		, deletion_queue = []
		, process_deletion_queue = function() {
			var i = deletion_queue.length;
			while (i--) {
				var file = deletion_queue[i];
				if (typeof file === "string") { // file is an object URL
					URL.revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			}
			deletion_queue.length = 0; // clear queue
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, FileSaver = function(blob, name) {
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, get_object_url = function() {
					var object_url = get_URL().createObjectURL(blob);
					deletion_queue.push(object_url);
					return object_url;
				}
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_object_url(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
                        window.open(object_url, "_blank");
                    }
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_object_url(blob);
				save_link.href = object_url;
				save_link.download = name;
				click(save_link);
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									deletion_queue.push(file);
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	view.addEventListener("unload", process_deletion_queue, false);
	return saveAs;
}(self));

if (typeof module !== 'undefined') module.exports = saveAs;

},{}],14:[function(require,module,exports){
var jsonlint = require('jsonlint-lines');

function hint(str) {

    var errors = [], gj;

    function root(_) {
        if (!_.type) {
            errors.push({
                message: 'The type property is required and was not found',
                line: _.__line__
            });
        } else if (!types[_.type]) {
            errors.push({
                message: 'The type ' + _.type + ' is unknown',
                line: _.__line__
            });
        } else if (_) {
            types[_.type](_);
        }
    }

    function everyIs(_, type) {
        // make a single exception because typeof null === 'object'
        return _.every(function(x) { return (x !== null) && (typeof x === type); });
    }

    function requiredProperty(_, name, type) {
        if (typeof _[name] == 'undefined') {
            return errors.push({
                message: '"' + name + '" property required',
                line: _.__line__
            });
        } else if (type === 'array') {
            if (!Array.isArray(_[name])) {
                return errors.push({
                    message: '"' + name +
                        '" property should be an array, but is an ' +
                        (typeof _[name]) + ' instead',
                    line: _.__line__
                });
            }
        } else if (type && typeof _[name] !== type) {
            return errors.push({
                message: '"' + name +
                    '" property should be ' + (type) +
                    ', but is an ' + (typeof _[name]) + ' instead',
                line: _.__line__
            });
        }
    }

    // http://geojson.org/geojson-spec.html#feature-collection-objects
    function FeatureCollection(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'features', 'array')) {
            if (!everyIs(_.features, 'object')) {
                return errors.push({
                    message: 'Every feature must be an object',
                    line: _.__line__
                });
            }
            _.features.forEach(Feature);
        }
    }

    // http://geojson.org/geojson-spec.html#positions
    function position(_, line) {
        if (!Array.isArray(_)) {
            return errors.push({
                message: 'position should be an array, is a ' + (typeof _) +
                    ' instead',
                line: _.__line__ || line
            });
        } else {
            if (_.length < 2) {
                return errors.push({
                    message: 'position must have 2 or more elements',
                    line: _.__line__ || line
                });
            }
            if (!everyIs(_, 'number')) {
                return errors.push({
                    message: 'each element in a position must be a number',
                    line: _.__line__ || line
                });
            }
        }
    }

    function positionArray(coords, depth, line) {
        if (line === undefined && coords.__line__ !== undefined) {
            line = coords.__line__;
        }
        if (depth === 0) {
            return position(coords, line);
        } else {
            if (!Array.isArray(coords)) {
                return errors.push({
                    message: 'coordinates should be an array, are an ' + (typeof coords) +
                        'instead',
                    line: line
                });
            }
            coords.forEach(function(c) {
                positionArray(c, depth - 1, c.__line__ || line);
            });
        }
    }

    function crs(_) {
        if (!_.crs) return;
        if (typeof _.crs === 'object') {
            var strErr = requiredProperty(_.crs, 'type', 'string'),
                propErr = requiredProperty(_.crs, 'properties', 'object');
            if (!strErr && !propErr) {
                // http://geojson.org/geojson-spec.html#named-crs
                if (_.crs.type == 'name') {
                    requiredProperty(_.crs.properties, 'name', 'string');
                } else if (_.crs.type == 'link') {
                    requiredProperty(_.crs.properties, 'href', 'string');
                }
            }
        }
    }

    function bbox(_) {
        if (!_.bbox) return;
        if (Array.isArray(_.bbox)) {
            if (!everyIs(_.bbox, 'number')) {
                return errors.push({
                    message: 'each element in a bbox property must be a number',
                    line: _.bbox.__line__
                });
            }
        } else {
            errors.push({
                message: 'bbox property must be an array of numbers, but is a ' + (typeof _.bbox),
                line: _.__line__
            });
        }
    }

    // http://geojson.org/geojson-spec.html#point
    function Point(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            position(_.coordinates);
        }
    }

    // http://geojson.org/geojson-spec.html#polygon
    function Polygon(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 2);
        }
    }

    // http://geojson.org/geojson-spec.html#multipolygon
    function MultiPolygon(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 3);
        }
    }

    // http://geojson.org/geojson-spec.html#linestring
    function LineString(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 1);
        }
    }

    // http://geojson.org/geojson-spec.html#multilinestring
    function MultiLineString(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 2);
        }
    }

    // http://geojson.org/geojson-spec.html#multipoint
    function MultiPoint(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 1);
        }
    }

    function GeometryCollection(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'geometries', 'array')) {
            _.geometries.forEach(function(geometry) {
                if (geometry) root(geometry);
            });
        }
    }

    function Feature(_) {
        crs(_);
        bbox(_);
        if (_.type !== 'Feature') {
            errors.push({
                message: 'GeoJSON features must have a type=feature property',
                line: _.__line__
            });
        }
        requiredProperty(_, 'properties', 'object');
        if (!requiredProperty(_, 'geometry', 'object')) {
            // http://geojson.org/geojson-spec.html#feature-objects
            // tolerate null geometry
            if (_.geometry) root(_.geometry);
        }
    }

    var types = {
        Point: Point,
        Feature: Feature,
        MultiPoint: MultiPoint,
        LineString: LineString,
        MultiLineString: MultiLineString,
        FeatureCollection: FeatureCollection,
        GeometryCollection: GeometryCollection,
        Polygon: Polygon,
        MultiPolygon: MultiPolygon
    };

    if (typeof str !== 'string') {
        return [{
            message: 'Expected string input',
            line: 0
        }];
    }

    try {
        gj = jsonlint.parse(str);
    } catch(e) {
        return e;
    }

    root(gj);

    return errors;
}

module.exports.hint = hint;

},{"jsonlint-lines":15}],15:[function(require,module,exports){
var process=require("__browserify_process");/* parser generated by jison 0.4.6 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var jsonlint = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"JSONString":3,"STRING":4,"JSONNumber":5,"NUMBER":6,"JSONNullLiteral":7,"NULL":8,"JSONBooleanLiteral":9,"TRUE":10,"FALSE":11,"JSONText":12,"JSONValue":13,"EOF":14,"JSONObject":15,"JSONArray":16,"{":17,"}":18,"JSONMemberList":19,"JSONMember":20,":":21,",":22,"[":23,"]":24,"JSONElementList":25,"$accept":0,"$end":1},
terminals_: {2:"error",4:"STRING",6:"NUMBER",8:"NULL",10:"TRUE",11:"FALSE",14:"EOF",17:"{",18:"}",21:":",22:",",23:"[",24:"]"},
productions_: [0,[3,1],[5,1],[7,1],[9,1],[9,1],[12,2],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[15,2],[15,3],[20,3],[19,1],[19,3],[16,2],[16,3],[25,1],[25,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: // replace escaped characters with actual character
          this.$ = yytext.replace(/\\(\\|")/g, "$"+"1")
                     .replace(/\\n/g,'\n')
                     .replace(/\\r/g,'\r')
                     .replace(/\\t/g,'\t')
                     .replace(/\\v/g,'\v')
                     .replace(/\\f/g,'\f')
                     .replace(/\\b/g,'\b');
        
break;
case 2:this.$ = Number(yytext);
break;
case 3:this.$ = null;
break;
case 4:this.$ = true;
break;
case 5:this.$ = false;
break;
case 6:return this.$ = $$[$0-1];
break;
case 13:this.$ = {}; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 14:this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 15:this.$ = [$$[$0-2], $$[$0]];
break;
case 16:this.$ = {}; this.$[$$[$0][0]] = $$[$0][1];
break;
case 17:this.$ = $$[$0-2]; $$[$0-2][$$[$0][0]] = $$[$0][1];
break;
case 18:this.$ = []; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 19:this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 20:this.$ = [$$[$0]];
break;
case 21:this.$ = $$[$0-2]; $$[$0-2].push($$[$0]);
break;
}
},
table: [{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],12:1,13:2,15:7,16:8,17:[1,14],23:[1,15]},{1:[3]},{14:[1,16]},{14:[2,7],18:[2,7],22:[2,7],24:[2,7]},{14:[2,8],18:[2,8],22:[2,8],24:[2,8]},{14:[2,9],18:[2,9],22:[2,9],24:[2,9]},{14:[2,10],18:[2,10],22:[2,10],24:[2,10]},{14:[2,11],18:[2,11],22:[2,11],24:[2,11]},{14:[2,12],18:[2,12],22:[2,12],24:[2,12]},{14:[2,3],18:[2,3],22:[2,3],24:[2,3]},{14:[2,4],18:[2,4],22:[2,4],24:[2,4]},{14:[2,5],18:[2,5],22:[2,5],24:[2,5]},{14:[2,1],18:[2,1],21:[2,1],22:[2,1],24:[2,1]},{14:[2,2],18:[2,2],22:[2,2],24:[2,2]},{3:20,4:[1,12],18:[1,17],19:18,20:19},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:23,15:7,16:8,17:[1,14],23:[1,15],24:[1,21],25:22},{1:[2,6]},{14:[2,13],18:[2,13],22:[2,13],24:[2,13]},{18:[1,24],22:[1,25]},{18:[2,16],22:[2,16]},{21:[1,26]},{14:[2,18],18:[2,18],22:[2,18],24:[2,18]},{22:[1,28],24:[1,27]},{22:[2,20],24:[2,20]},{14:[2,14],18:[2,14],22:[2,14],24:[2,14]},{3:20,4:[1,12],20:29},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:30,15:7,16:8,17:[1,14],23:[1,15]},{14:[2,19],18:[2,19],22:[2,19],24:[2,19]},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:31,15:7,16:8,17:[1,14],23:[1,15]},{18:[2,17],22:[2,17]},{18:[2,15],22:[2,15]},{22:[2,21],24:[2,21]}],
defaultActions: {16:[2,6]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 6
break;
case 2:yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2); return 4
break;
case 3:return 17
break;
case 4:return 18
break;
case 5:return 23
break;
case 6:return 24
break;
case 7:return 22
break;
case 8:return 21
break;
case 9:return 10
break;
case 10:return 11
break;
case 11:return 8
break;
case 12:return 14
break;
case 13:return 'INVALID'
break;
}
},
rules: [/^(?:\s+)/,/^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,/^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:,)/,/^(?::)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:$)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = jsonlint;
exports.Parser = jsonlint.Parser;
exports.parse = function () { return jsonlint.parse.apply(jsonlint, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
},{"__browserify_process":6,"fs":2,"path":3}],16:[function(require,module,exports){
module.exports = function(d3) {
    var preview = require('static-map-preview')(d3, 'tmcw.map-dsejpecw');

    function gitHubBrowse(d3) {

        return function(token, options) {
            options = options || {};

            var event = d3.dispatch('chosen');

            function filter(d) {
                if (d.type === 'blob') {
                    return d.path.match(/json$/);
                }
                return true;
            }

            function browse(selection) {
                req('/user', token, onuser);

                function onuser(err, user) {
                    reqList('/user/orgs', token, function(err, orgs) {
                        var base = [user];
                        if (orgs && orgs.length) {
                            base = base.concat(orgs);
                        }
                        render({
                            columns: [base],
                            path: [{name:'home'}]
                        });
                    });
                }

                function navigateTo(d, data) {
                    var url;
                    if (d.type && d.type === 'User') {
                        // user
                        url = '/user/repos';
                    } else if (d.login) {
                        // organization
                        url = '/orgs/' + d.login + '/repos';
                    } else if (d.forks !== undefined) {
                        // repository
                        url = '/repos/' + d.full_name + '/branches';
                    } else if (d.type ===  'tree') {
                        url = '/repos/' + data.path[2].full_name + '/git/trees/' + d.sha;
                    } else if (d.name && d.commit) {
                        // branch
                        url = '/repos/' + data.path[2].full_name + '/git/trees/' + d.commit.sha;
                    }
                    selection.classed('loading', true);
                    reqList(url, token, onlist);
                    function onlist(err, repos) {
                        selection.classed('loading', false);
                        if (repos.length === 1 && repos[0].tree) {
                            repos = repos[0].tree.filter(filter);
                        }

                        if (options.sort) {
                            repos.sort(options.sort);
                        }

                        data.path.push(d);
                        data.columns = data.columns.concat([repos]);
                        render(data);
                    }
                }

                var header = selection.append('div')
                    .attr('class', 'header');

                var back = header.append('a')
                    .attr('class', 'back')
                    .text('<');

                var breadcrumbs = header.append('div')
                    .attr('class', 'breadcrumbs');

                var columnsel = selection.append('div')
                    .attr('class', 'column-wrap');

                var mask = selection.append('div')
                    .attr('class', 'mask');

                function render(data) {

                    back.on('click', function(d, i) {
                        if (data.path.length > 1) {
                            data.path.pop();
                            data.columns.pop();
                            render(data);
                        }
                    });

                    var crumbs = breadcrumbs
                        .selectAll('a')
                        .data(data.path);

                    crumbs.exit().remove();

                    crumbs.enter()
                        .append('a')
                        .text(name);

                    var columns = columnsel
                        .selectAll('div.column')
                        .data(data.columns, function(d, i) {
                            return i;
                        });

                    columns.exit().remove();

                    columns
                        .enter()
                        .append('div')
                        .attr('class', 'column');

                    columns
                        .style('transform', transformX)
                        .style('-webkit-transform', transformX);

                    function transformX(d, i) {
                        return 'translateX(' + (i - data.columns.length + 1) * this.offsetWidth + 'px)';
                    }

                    var items = columns
                        .selectAll('a.item')
                        .filter(filter)
                        .data(function(d) { return d; });
                    items.exit().remove();
                    var newitems = items.enter()
                        .append('a')
                        .attr('class', 'item')
                        .text(name)
                        .on('click', function(d) {
                            if (d.type !== 'blob') navigateTo(d, data);
                            else choose(d)();
                        });

                    newitems
                        .filter(function(d) {
                            return d.type === 'blob';
                        })
                        .each(function(d) {
                            var parent = d3.select(this);
                            d3.select(this).append('div')
                                .attr('class', 'fr')
                                .each(function(d) {
                                    var sel = d3.select(this);
                                    sel.selectAll('button')
                                        .data([{
                                            title: 'Preview',
                                            action: quickpreview(d, parent)
                                        }, {
                                            title: 'Open',
                                            action: choose(d)
                                        }])
                                        .enter()
                                        .append('button')
                                        .text(function(d) { return d.title; })
                                        .on('click', function(d) { return d.action(); });
                                });
                        });

                    function quickpreview(d, sel) {
                        return function() {
                            if (!sel.select('.preview').empty()) {
                                return sel.select('.preview').remove();
                            }
                            var mapcontainer = sel.append('div').attr('class', 'preview');
                            reqRaw('/repos/' + data.path[2].full_name + '/git/blobs/' + d.sha, token, onfile);
                            function onfile(err, res) {
                                preview(res, [mapcontainer.node().offsetWidth, 150], function(err, uri) {
                                    if (err) return;
                                    mapcontainer.append('img')
                                        .attr('width', mapcontainer.node().offsetWidth + 'px')
                                        .attr('height', '150px')
                                        .attr('src', uri);
                                });
                            }
                        };
                    }

                    function choose(d) {
                        return function() {
                            event.chosen(d, data);
                        };
                    }

                    (selection.node().parentNode || {}).scrollTop = 0;
                }

                function name(d) {
                    return d.login || d.name || d.path;
                }
            }

            return d3.rebind(browse, event, 'on');
        };
    }

    function gistBrowse(d3) {
        return function(token, options) {
            options = options || {};

            var event = d3.dispatch('chosen');
            var time_format = d3.time.format('%Y/%m/%d');

            function browse(selection) {
                var width = Math.min(640, selection.node().offsetWidth);
                req('/gists', token, function(err, gists) {
                    gists = gists.filter(hasMapFile);

                    if (options.sort) {
                        gists.sort(options.sort);
                    }

                    var item = selection.selectAll('div.item')
                        .data(gists)
                        .enter()
                        .append('div')
                        .attr('class', 'fl item')
                        .style('width', width + 'px')
                        .style('height', 200 + 'px')
                        .on('click', function(d) {
                            event.chosen(d);
                        })
                        .call(mapPreview(token, width));

                    var overlay = item.append('div')
                        .attr('class', 'overlay')
                        .text(function(d) {
                            return d.id + ' | ' + (d.description || 'untitled') +
                                ' | ' + time_format(new Date(d.updated_at));
                        });

                    overlay.append('span')
                        .attr('class', 'files')
                        .selectAll('small')
                        .data(function(d) {
                            return d3.entries(d.files);
                        })
                        .enter()
                        .append('small')
                        .attr('class', 'deemphasize')
                        .text(function(d) {
                            return d.key + ' ';
                        })
                        .attr('title', function(d) {
                            return d.value.type + ', ' + d.value.size + ' bytes';
                        });
                });
            }

            return d3.rebind(browse, event, 'on');
        };
    }

    var base = 'https://api.github.com';

    function reqList(postfix, token, callback, l, url, count) {
        l = l || [];
        count = count || 0;
        authorize(d3.xhr(url || (base + postfix)), token)
            .on('load', function(data) {
                l = l.concat(data.list);
                if (data.next && ++count < 8) {
                    return reqList(postfix, token, callback, l, data.next, count);
                }
                callback(null, l);
            })
            .on('error', function(error) {
                callback(error, null);
            })
            .response(function(request) {
                var nextLink = (request.getResponseHeader('Link') || '').match(/\<([^\>]+)\>\; rel="next"/);
                nextLink = nextLink ? nextLink[1] : null;
                return {
                    list: JSON.parse(request.responseText),
                    next: nextLink
                };
            })
            .get();
    }

    function req(postfix, token, callback) {
        authorize(d3.json((base + postfix)), token)
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(error) {
                callback(error, null);
            })
            .get();
    }

    function reqRaw(postfix, token, callback) {
        authorize(d3.json((base + postfix)), token)
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(error) {
                callback(error, null);
            })
            .header('Accept', 'application/vnd.github.raw')
            .get();
    }

    function mapPreview(token, width) {
        return function(selection) {
            selection.each(function(d) {
                var sel = d3.select(this);
                req('/gists/' + d.id, token, function(err, data) {
                    var geojson = mapFile(data);
                    if (geojson) {
                        preview(geojson, [width, 200], function(err, res) {
                            if (err) return;
                            sel
                                .style('background-image', 'url(' + res + ')')
                                .style('background-size', width + 'px 200px');
                        });
                    }
                });
            });
        };
    }

    return {
        gitHubBrowse: gitHubBrowse(d3),
        gistBrowse: gistBrowse(d3)
    };
};

function authorize(xhr, token) {
    return token ?
        xhr.header('Authorization', 'token ' + token) :
        xhr;
}

function hasMapFile(data) {
    for (var f in data.files) {
        if (f.match(/\.geojson$/)) return true;
    }
}

function mapFile(data) {
    try {
        for (var f in data.files) {
            if (f.match(/\.geojson$/)) return JSON.parse(data.files[f].content);
        }
    } catch(e) {
        return null;
    }
}

},{"static-map-preview":17}],17:[function(require,module,exports){
var scaleCanvas = require('autoscale-canvas');

module.exports = function(d3, mapid) {
    var ratio = window.devicePixelRatio || 1,
        retina = ratio !== 1;

    function staticUrl(cz, wh) {
        var size = retina ? [wh[0] * 2, wh[1] * 2] : wh;
        return 'http://a.tiles.mapbox.com/v3/' + [
            mapid, cz.join(','), size.join('x')].join('/') + '.png';
    }

    return function(geojson, wh, callback) {
        var projection = d3.geo.mercator()
            .precision(0)
            .translate([wh[0]/2, wh[1]/2]);

        path = d3.geo.path().projection(projection);

        var image = d3.select(document.createElement('img')),
            canvas = d3.select(document.createElement('canvas')),
            z = 19;

        canvas.attr('width', wh[0]).attr('height', wh[1]);
        projection.center(projection.invert(path.centroid(geojson)));
        projection.scale((1 << z) / 2 / Math.PI);

        var bounds = path.bounds(geojson);

        while (bounds[1][0] - bounds[0][0] > wh[0] ||
               bounds[1][1] - bounds[0][1] > wh[1]) {
            projection.scale((1 << z) / 2 / Math.PI);
            bounds = path.bounds(geojson);
            z--;
        }

        var ctx = scaleCanvas(canvas.node()).getContext('2d'),
        painter = path.context(ctx);

        ctx.strokeStyle = '#E000F5';
        ctx.lineWidth = 2;

        image.node().crossOrigin = '*';
        image
            .on('load', imageload)
            .on('error', imageerror)
            .attr('src', staticUrl(projection.center().concat([z-6]).map(filterNan), wh));

        function imageload() {
            ctx.drawImage(this, 0, 0, wh[0], wh[1]);
            painter(geojson);
            ctx.stroke();
            callback(null, canvas.node().toDataURL());
        }

        function imageerror(err) {
            callback(err);
        }
    };

    function filterNan(_) { return isNaN(_) ? 0 : _; }
};

},{"autoscale-canvas":18}],18:[function(require,module,exports){

/**
 * Retina-enable the given `canvas`.
 *
 * @param {Canvas} canvas
 * @return {Canvas}
 * @api public
 */

module.exports = function(canvas){
  var ctx = canvas.getContext('2d');
  var ratio = window.devicePixelRatio || 1;
  if (1 != ratio) {
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width *= ratio;
    canvas.height *= ratio;
    ctx.scale(ratio, ratio);
  }
  return canvas;
};
},{}],19:[function(require,module,exports){
(function(window) {
	var HAS_HASHCHANGE = (function() {
		var doc_mode = window.documentMode;
		return ('onhashchange' in window) &&
			(doc_mode === undefined || doc_mode > 7);
	})();

	L.Hash = function(map) {
		this.onHashChange = L.Util.bind(this.onHashChange, this);

		if (map) {
			this.init(map);
		}
	};

	L.Hash.parseHash = function(hash) {
		if(hash.indexOf('#') === 0) {
			hash = hash.substr(1);
		}
		var args = hash.split("/");
		if (args.length == 3) {
			var zoom = parseInt(args[0], 10),
			lat = parseFloat(args[1]),
			lon = parseFloat(args[2]);
			if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
				return false;
			} else {
				return {
					center: new L.LatLng(lat, lon),
					zoom: zoom
				};
			}
		} else {
			return false;
		}
	};

	L.Hash.formatHash = function(map) {
		var center = map.getCenter(),
		    zoom = map.getZoom(),
		    precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

		return "#" + [zoom,
			center.lat.toFixed(precision),
			center.lng.toFixed(precision)
		].join("/");
	},

	L.Hash.prototype = {
		map: null,
		lastHash: null,

		parseHash: L.Hash.parseHash,
		formatHash: L.Hash.formatHash,

		init: function(map) {
			this.map = map;

			// reset the hash
			this.lastHash = null;
			this.onHashChange();

			if (!this.isListening) {
				this.startListening();
			}
		},

		remove: function() {
			if (this.changeTimeout) {
				clearTimeout(this.changeTimeout);
			}

			if (this.isListening) {
				this.stopListening();
			}

			this.map = null;
		},

		onMapMove: function() {
			// bail if we're moving the map (updating from a hash),
			// or if the map is not yet loaded

			if (this.movingMap || !this.map._loaded) {
				return false;
			}

			var hash = this.formatHash(this.map);
			if (this.lastHash != hash) {
				location.replace(hash);
				this.lastHash = hash;
			}
		},

		movingMap: false,
		update: function() {
			var hash = location.hash;
			if (hash === this.lastHash) {
				return;
			}
			var parsed = this.parseHash(hash);
			if (parsed) {
				this.movingMap = true;

				this.map.setView(parsed.center, parsed.zoom);

				this.movingMap = false;
			} else {
				this.onMapMove(this.map);
			}
		},

		// defer hash change updates every 100ms
		changeDefer: 100,
		changeTimeout: null,
		onHashChange: function() {
			// throttle calls to update() so that they only happen every
			// `changeDefer` ms
			if (!this.changeTimeout) {
				var that = this;
				this.changeTimeout = setTimeout(function() {
					that.update();
					that.changeTimeout = null;
				}, this.changeDefer);
			}
		},

		isListening: false,
		hashChangeInterval: null,
		startListening: function() {
			this.map.on("moveend", this.onMapMove, this);

			if (HAS_HASHCHANGE) {
				L.DomEvent.addListener(window, "hashchange", this.onHashChange);
			} else {
				clearInterval(this.hashChangeInterval);
				this.hashChangeInterval = setInterval(this.onHashChange, 50);
			}
			this.isListening = true;
		},

		stopListening: function() {
			this.map.off("moveend", this.onMapMove, this);

			if (HAS_HASHCHANGE) {
				L.DomEvent.removeListener(window, "hashchange", this.onHashChange);
			} else {
				clearInterval(this.hashChangeInterval);
			}
			this.isListening = false;
		}
	};
	L.hash = function(map) {
		return new L.Hash(map);
	};
	L.Map.prototype.addHash = function() {
		this._hash = L.hash(this);
	};
	L.Map.prototype.removeHash = function() {
		this._hash.remove();
	};
})(window);

},{}],20:[function(require,module,exports){
var osm_geojson = {};

osm_geojson.geojson2osm = function(geo, changeset) {
    function togeojson(geo, properties) {
        var nodes = '',
            ways = '',
            relations = '';
        properties = properties || {};

        switch (geo.type) {
            case 'Point':
                var coord = roundCoords([geo.coordinates]);
                nodes += '<node id="' + count + '" lat="' + coord[0][1] +
                '" lon="' + coord[0][0] + '">';
                nodes += propertiesToTags(properties);
                nodes += '</node>';
                count--;
                break;

            case 'MultiPoint':
                break;
            case 'LineString':
                break;
            case 'MultiLineString':
                break;
            case 'Polygon':
                append(polygon(geo, properties));
                break;

            case 'MultiPolygon':
                relations += '<relation id="' + count + '" changeset="' + changeset + '">';
                properties.type = 'multipolygon';
                count--;

                for (var i = 0; i < geo.coordinates.length; i++){

                    poly = polygon({
                        'coordinates': geo.coordinates[i]
                    }, undefined, true);

                    nodes += poly.nodes;
                    ways += poly.ways;
                    relations += poly.relations;
                }

                relations += propertiesToTags(properties);
                relations += '</relation>';
                break;
        }

        function append(obj) {
            nodes += obj.nodes;
            ways += obj.ways;
            relations += obj.relations;
        }

        osm = '<?xml version="1.0" encoding="UTF-8"?><osm version="0.6" generator="geo2osm.js">' +
        nodes + ways + relations + '</osm>';

        return {
            nodes: nodes,
            ways: ways,
            relations: relations,
            osm: osm
        };
    }

    function polygon(geo, properties, multipolygon) {
        var nodes = '',
            ways = '',
            relations = '',
            role = '';
        properties = properties || {};
        multipolygon = multipolygon || false;

        var coords = [];
        if (geo.coordinates.length > 1) {
            // polygon with holes -> multipolygon
            if (!multipolygon) relations += '<relation id="' + count + '" changeset="' + changeset +'">';
            count--;
            properties.type = 'multipolygon';

            for (var i = 0; i < geo.coordinates.length; i++) {

                role = ((i === 0) ? 'outer' : 'inner');

                relations += '<member type="way" ref="' + count + '" role="' + role + '"/>';
                ways += '<way id="' + count + '" changeset="' + changeset + '">';
                count--;
                for (var a = 0; a < geo.coordinates[i].length-1; a++) {
                    coords.push([geo.coordinates[i][a][1], geo.coordinates[i][a][0]]);
                }
                coords = createNodes(coords, true);
                nodes += coords.nodes;
                ways += coords.nds;
                ways += '</way>';
                coords = [];
            }

            if (!multipolygon) {
                relations += propertiesToTags(properties);
                relations += '</relation>';
            }
        } else {
            // polygon -> way
            ways += '<way id="' + count + '" changeset="' + changeset + '">';
            if (multipolygon) relations += '<member type="way" ref="' + count + '" role="outer"/>';
            count--;
            for (var j = 0; j < geo.coordinates[0].length-1; j++) {
                coords.push([geo.coordinates[0][j][1], geo.coordinates[0][j][0]]);
            }
            coords = createNodes(coords, true);
            nodes += coords.nodes;
            ways += coords.nds;
            ways += propertiesToTags(properties);
            ways += '</way>';
        }

        return {
            nodes: nodes,
            ways: ways,
            relations: relations
        };
    }

    function propertiesToTags(properties) {
        var tags = '';
        for (var tag in properties) {
            if (properties[tag] !== null) {
                tags += '<tag k="' + tag + '" v="' + properties[tag] + '"/>';
            }
        }
        return tags;
    }

    function roundCoords(coords){
        for (var a = 0; a < coords.length; a++) {
            coords[a][0] = Math.round(coords[a][0] * 1000000) / 1000000;
            coords[a][1] = Math.round(coords[a][1] * 1000000) / 1000000;
        }
        return coords;
    }

    function createNodes(coords, repeatLastND) {
        var nds = '',
            nodes = '',
            length = coords.length;
        repeatLastND = repeatLastND || false;
            // for polygons

        coords = roundCoords(coords);

        for (var a = 0; a < length; a++) {
            if (repeatLastND && a === 0) repeatLastND = count;

            nds += '<nd ref="' + count + '"/>';
            nodes += '<node id="' + count + '" lat="' + coords[a][0] +'" lon="' + coords[a][1] +
            '" changeset="' + changeset + '"/>';

            if (repeatLastND && a === length-1) nds += '<nd ref="' + repeatLastND + '"/>';
            count--;
        }
        return {'nds': nds, 'nodes': nodes};
    }

    var obj,
        count = -1;
    changeset = changeset || false;

    switch (geo.type) {
        case 'FeatureCollection':
            var temp = {
                nodes: '',
                ways: '',
                relations: ''
            };
            obj = [];
            for (var i = 0; i < geo.features.length; i++){
                obj.push(togeojson(geo.features[i].geometry, geo.features[i].properties));
            }
            temp.osm = '<?xml version="1.0" encoding="UTF-8"?><osm version="0.6" generator="geo2osm.js">';
            for (var n = 0; n < obj.length; n++) {
                temp.nodes += obj[n].nodes;
                temp.ways += obj[n].ways;
                temp.relations += obj[n].relations;
            }
            temp.osm += temp.nodes + temp.ways + temp.relations;
            temp.osm += '</osm>';
            obj = temp.osm;
            break;

        case 'GeometryCollection':
            obj = [];
            for (var j = 0; j < geo.geometries.length; j++){
                obj.push(togeojson(geo.geometries[j]));
            }
            break;

        case 'Feature':
            obj = togeojson(geo.geometry, geo.properties);
            obj = obj.osm;
            break;

        case 'Point':
        case 'MultiPoint':
        case 'LineString':
        case 'MultiLineString':
        case 'Polygon':
        case 'MultiPolygon':
            obj = togeojson(geo);
            obj = obj.osm;
            break;

        default:
            if (console) console.log('Invalid GeoJSON object: GeoJSON object must be one of \"Point\", \"LineString\",' +
                '\"Polygon\", \"MultiPolygon\", \"Feature\", \"FeatureCollection\" or \"GeometryCollection\".');
    }

    return obj;
};

osm_geojson.osm2geojson = function(osm, metaProperties) {

    var xml = parse(osm),
        nodeCache = cacheNodes(),
        wayCache = cacheWays();

    return Bounds({
        type : 'FeatureCollection',
        features : []
            .concat(Points(nodeCache))
            .concat(Ways(wayCache))
            .concat(Ways(Relations))
    }, xml);

    function parse(xml) {
        if (typeof xml !== 'string') return xml;
        return (new DOMParser()).parseFromString(
            new XMLSerializer().serializeToString(xml), 'text/xml');
    }

    function Bounds(geo, xml) {
        var bounds = getBy(xml, 'bounds');
        if (!bounds.length) return geo;
        geo.bbox = [
            attrf(bounds[0], 'minlon'),
            attrf(bounds[0], 'minlat'),
            attrf(bounds[0], 'maxlon'),
            attrf(bounds[0], 'maxlat')
        ];
        return geo;
    }

    function setProperties(element) {
        var props = {},
            tags = element.getElementsByTagName('tag'),
            tags_length = tags.length;

        for (var t = 0; t < tags_length; t++) {
            props[attr(tags[t], 'k')] = isNumber(attr(tags[t], 'v')) ?
                parseFloat(attr(tags[t], 'v')) : attr(tags[t], 'v');
        }

        if (metaProperties) {
            setIf(element, 'id', props, 'osm_id');
            setIf(element, 'user', props, 'osm_lastEditor');
            setIf(element, 'version', props, 'osm_version', true);
            setIf(element, 'changeset', props, 'osm_lastChangeset', true);
            setIf(element, 'timestamp', props, 'osm_lastEdited');
        }

        return sortObject(props);
    }

    function getFeature(element, type, coordinates) {
        return {
            geometry: {
                type: type,
                coordinates: coordinates || []
            },
            type: 'Feature',
            properties: setProperties(element)
        };
    }

    function cacheNodes() {
        var nodes = getBy(xml, 'node'),
            coords = {},
            withTags = [];

        for (var n = 0; n < nodes.length; n++) {
            var tags = getBy(nodes[n], 'tag');
            coords[attr(nodes[n], 'id')] = lonLat(nodes[n]);
            if (tags.length) withTags.push(nodes[n]);
        }

        return {
            coords: coords,
            withTags: withTags
        };
    }

    function Points(nodeCache) {
        var points = nodeCache.withTags,
            features = [];

        for (var p = 0, r = points.length; p < r; p++) {
            var feature = getFeature(points[p], 'Point', lonLat(points[p]));
            features.push(feature);
        }

        return features;
    }

    function cacheWays() {
        var ways = getBy(xml, 'way'),
            out = {};

        for (var w = 0; w < ways.length; w++) {
            var feature = {},
                nds = getBy(ways[w], 'nd');

            if (attr(nds[0], 'ref') === attr(nds[nds.length - 1], 'ref')) {
                feature = getFeature(ways[w], 'Polygon', [[]]);
            } else {
                feature = getFeature(ways[w], 'LineString');
            }

            for (var n = 0; n < nds.length; n++) {
                var cords = nodeCache.coords[attr(nds[n], 'ref')];
                if (feature.geometry.type === 'Polygon') {
                    feature.geometry.coordinates[0].push(cords);
                } else {
                    feature.geometry.coordinates.push(cords);
                }
            }

            out[attr(ways[w], 'id')] = feature;
        }

        return out;
    }

    function Relations() {
        var relations = getBy(xml, 'relation'),
            relations_length = relations.length,
            features = [];

        for (var r = 0; r < relations_length; r++) {
            var feature = getFeature(relations[r], 'MultiPolygon');

            if (feature.properties.type == 'multipolygon') {
                var members = getBy(relations[r], 'member');

                // osm doesn't keep roles in order, so we do this twice
                for (var m = 0; m < members.length; m++) {
                    if (attr(members[m], 'role') == 'outer') assignWay(members[m], feature);
                }

                for (var n = 0; n < members.length; n++) {
                    if (attr(members[n], 'role') == 'inner') assignWay(members[n], feature);
                }

                delete feature.properties.type;
            } else {
                // http://taginfo.openstreetmap.us/relations
            }

            if (feature.geometry.coordinates.length) features.push(feature);
        }

        return features;

        function assignWay(member, feature) {
            var ref = attr(member, 'ref'),
                way = wayCache[ref];

            if (way && way.geometry.type == 'Polygon') {
                if (way && attr(member, 'role') == 'outer') {
                    feature.geometry.coordinates.push(way.geometry.coordinates);
                    if (way.properties) {
                        // exterior polygon properties can move to the multipolygon
                        // but multipolygon (relation) tags take precedence
                        for (var prop in way.properties) {
                            if (!feature.properties[prop]) {
                                feature.properties[prop] = prop;
                            }
                        }
                    }
                } else if (way && attr(member, 'role') == 'inner'){
                    if (feature.geometry.coordinates.length > 1) {
                        // do a point in polygon against each outer
                        // this determines which outer the inner goes with
                        for (var a = 0; a < feature.geometry.coordinates.length; a++) {
                            if (pointInPolygon(
                                way.geometry.coordinates[0][0],
                                feature.geometry.coordinates[a][0])) {
                                feature.geometry.coordinates[a].push(way.geometry.coordinates[0]);
                                break;
                            }
                        }
                    } else {
                        if (feature.geometry.coordinates.length) {
                            feature.geometry.coordinates[0].push(way.geometry.coordinates[0]);
                        }
                    }
                }
            }

            wayCache[ref] = false;
        }
    }

    function Ways(wayCache) {
        var features = [];
        for (var w in wayCache) if (wayCache[w]) features.push(wayCache[w]);
        return features;
    }

    // https://github.com/substack/point-in-polygon/blob/master/index.js
    function pointInPolygon(point, vs) {
        var x = point[0], y = point[1];
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1],
                xj = vs[j][0], yj = vs[j][1],
                intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // http://stackoverflow.com/a/1359808
    function sortObject(o) {
        var sorted = {}, key, a = [];
        for (key in o) if (o.hasOwnProperty(key)) a.push(key);
        a.sort();
        for (key = 0; key < a.length; key++) sorted[a[key]] = o[a[key]];
        return sorted;
    }

    // http://stackoverflow.com/a/1830844
    function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(x.getAttribute(y)); }
    function getBy(x, y) { return x.getElementsByTagName(y); }
    function lonLat(elem) { return [attrf(elem, 'lon'), attrf(elem, 'lat')]; }
    function setIf(x, y, o, name, f) {
        if (attr(x, y)) o[name] = f ? parseFloat(attr(x, y)) : attr(x, y);
    }
};

if (typeof module !== 'undefined') module.exports = osm_geojson;

},{}],21:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};;(function(win){
	var store = {},
		doc = win.document,
		localStorageName = 'localStorage',
		storage

	store.disabled = false
	store.set = function(key, value) {}
	store.get = function(key) {}
	store.remove = function(key) {}
	store.clear = function() {}
	store.transact = function(key, defaultVal, transactionFn) {
		var val = store.get(key)
		if (transactionFn == null) {
			transactionFn = defaultVal
			defaultVal = null
		}
		if (typeof val == 'undefined') { val = defaultVal || {} }
		transactionFn(val)
		store.set(key, val)
	}
	store.getAll = function() {}
	store.forEach = function() {}

	store.serialize = function(value) {
		return JSON.stringify(value)
	}
	store.deserialize = function(value) {
		if (typeof value != 'string') { return undefined }
		try { return JSON.parse(value) }
		catch(e) { return value || undefined }
	}

	// Functions to encapsulate questionable FireFox 3.6.13 behavior
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try { return (localStorageName in win && win[localStorageName]) }
		catch(err) { return false }
	}

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName]
		store.set = function(key, val) {
			if (val === undefined) { return store.remove(key) }
			storage.setItem(key, store.serialize(val))
			return val
		}
		store.get = function(key) { return store.deserialize(storage.getItem(key)) }
		store.remove = function(key) { storage.removeItem(key) }
		store.clear = function() { storage.clear() }
		store.getAll = function() {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = function(callback) {
			for (var i=0; i<storage.length; i++) {
				var key = storage.key(i)
				callback(key, store.get(key))
			}
		}
	} else if (doc.documentElement.addBehavior) {
		var storageOwner,
			storageContainer
		// Since #userData storage applies only to specific paths, we need to
		// somehow link our data to a specific path.  We choose /favicon.ico
		// as a pretty safe option, since all browsers already make a request to
		// this URL anyway and being a 404 will not hurt us here.  We wrap an
		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
		// since the iframe access rules appear to allow direct access and
		// manipulation of the document element, even for a 404 page.  This
		// document can be used instead of the current document (which would
		// have been limited to the current path) to perform #userData storage.
		try {
			storageContainer = new ActiveXObject('htmlfile')
			storageContainer.open()
			storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></iframe>')
			storageContainer.close()
			storageOwner = storageContainer.w.frames[0].document
			storage = storageOwner.createElement('div')
		} catch(e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div')
			storageOwner = doc.body
		}
		function withIEStorage(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0)
				args.unshift(storage)
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				storageOwner.appendChild(storage)
				storage.addBehavior('#default#userData')
				storage.load(localStorageName)
				var result = storeFunction.apply(store, args)
				storageOwner.removeChild(storage)
				return result
			}
		}

		// In IE7, keys may not contain special chars. See all of https://github.com/marcuswestin/store.js/issues/40
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
		function ieKeyFix(key) {
			return key.replace(forbiddenCharsRegex, '___')
		}
		store.set = withIEStorage(function(storage, key, val) {
			key = ieKeyFix(key)
			if (val === undefined) { return store.remove(key) }
			storage.setAttribute(key, store.serialize(val))
			storage.save(localStorageName)
			return val
		})
		store.get = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			return store.deserialize(storage.getAttribute(key))
		})
		store.remove = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			storage.removeAttribute(key)
			storage.save(localStorageName)
		})
		store.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			storage.load(localStorageName)
			for (var i=0, attr; attr=attributes[i]; i++) {
				storage.removeAttribute(attr.name)
			}
			storage.save(localStorageName)
		})
		store.getAll = withIEStorage(function(storage) {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		})
		store.forEach = withIEStorage(function(storage, callback) {
			var attributes = storage.XMLDocument.documentElement.attributes
			for (var i=0, attr; attr=attributes[i]; ++i) {
				var key = ieKeyFix(attr.name)
				callback(ret[attr.name], store.deserialize(storage.getAttribute(key)))
			}
		})
	}

	try {
		var testKey = '__storejs__'
		store.set(testKey, testKey)
		if (store.get(testKey) != testKey) { store.disabled = true }
		store.remove(testKey)
	} catch(e) {
		store.disabled = true
	}
	store.enabled = !store.disabled
	
	if (typeof module != 'undefined' && module.exports) { module.exports = store }
	else if (typeof define === 'function' && define.amd) { define(store) }
	else { win.store = store }
	
})(this.window || global);

},{}],22:[function(require,module,exports){
toGeoJSON = (function() {
    'use strict';

    var removeSpace = (/\s*/g),
        trimSpace = (/^\s*|\s*$/g),
        splitSpace = (/\s+/);
    // generate a short, numeric hash of a string
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        } return h;
    }
    // all Y children of X
    function get(x, y) { return x.getElementsByTagName(y); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(attr(x, y)); }
    // one Y child of X, if any, otherwise null
    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
    // cast array x into numbers
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }
    function clean(x) {
        var o = {};
        for (var i in x) if (x[i]) o[i] = x[i];
        return o;
    }
    // get the content of a text node, if any
    function nodeVal(x) { if (x) {norm(x);} return x && x.firstChild && x.firstChild.nodeValue; }
    // get one coordinate from a coordinate array, if any
    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
    // get all coordinates from a coordinate array as [[],[]]
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace),
            o = [];
        for (var i = 0; i < coords.length; i++) {
            o.push(coord1(coords[i]));
        }
        return o;
    }
    function coordPair(x) { return [attrf(x, 'lon'), attrf(x, 'lat')]; }

    // create a new feature collection parent object
    function fc() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }

    var styleSupport = false;
    if (typeof XMLSerializer !== 'undefined') {
        var serializer = new XMLSerializer();
        styleSupport = true;
    }
    function xml2str(str) { return serializer.serializeToString(str); }

    var t = {
        kml: function(doc, o) {
            o = o || {};

            var gj = fc(),
                // styleindex keeps track of hashed styles in order to match features
                styleIndex = {},
                // atomic geospatial types supported by KML - MultiGeometry is
                // handled separately
                geotypes = ['Polygon', 'LineString', 'Point', 'Track'],
                // all root placemarks in the file
                placemarks = get(doc, 'Placemark'),
                styles = get(doc, 'Style');

            if (styleSupport) for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + attr(styles[k], 'id')] = okhash(xml2str(styles[k])).toString(16);
            }
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j]));
            }
            function gxCoord(v) { return numarray(v.split(' ')); }
            function gxCoords(root) {
                var elems = get(root, 'coord', 'gx'), coords = [];
                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                return coords;
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                if (get1(root, 'MultiTrack')) return getGeometry(get1(root, 'MultiTrack'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({
                                    type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'),
                                    coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({
                                    type: 'Polygon',
                                    coordinates: coords
                                });
                            } else if (geotypes[i] == 'Track') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: gxCoords(geomNode)
                                });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root) {
                var geoms = getGeometry(root), i, properties = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    description = nodeVal(get1(root, 'description')),
                    extendedData = get1(root, 'ExtendedData');

                if (!geoms.length) return [];
                if (name) properties.name = name;
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    properties.styleHash = styleIndex[styleUrl];
                }
                if (description) properties.description = description;
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');

                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                }
                return [{
                    type: 'Feature',
                    geometry: (geoms.length === 1) ? geoms[0] : {
                        type: 'GeometryCollection',
                        geometries: geoms
                    },
                    properties: properties
                }];
            }
            return gj;
        },
        gpx: function(doc, o) {
            var i,
                tracks = get(doc, 'trk'),
                routes = get(doc, 'rte'),
                waypoints = get(doc, 'wpt'),
                // a feature collection
                gj = fc();
            for (i = 0; i < tracks.length; i++) {
                gj.features.push(getLinestring(tracks[i], 'trkpt'));
            }
            for (i = 0; i < routes.length; i++) {
                gj.features.push(getLinestring(routes[i], 'rtept'));
            }
            for (i = 0; i < waypoints.length; i++) {
                gj.features.push(getPoint(waypoints[i]));
            }
            function getLinestring(node, pointname) {
                var j, pts = get(node, pointname), line = [];
                for (j = 0; j < pts.length; j++) {
                    line.push(coordPair(pts[j]));
                }
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: 'LineString',
                        coordinates: line
                    }
                };
            }
            function getPoint(node) {
                var prop = getProperties(node);
                prop.ele = nodeVal(get1(node, 'ele'));
                prop.sym = nodeVal(get1(node, 'sym'));
                return {
                    type: 'Feature',
                    properties: prop,
                    geometry: {
                        type: 'Point',
                        coordinates: coordPair(node)
                    }
                };
            }
            function getProperties(node) {
                var meta = ['name', 'desc', 'author', 'copyright', 'link',
                            'time', 'keywords'],
                    prop = {},
                    k;
                for (k = 0; k < meta.length; k++) {
                    prop[meta[k]] = nodeVal(get1(node, meta[k]));
                }
                return clean(prop);
            }
            return gj;
        }
    };
    return t;
})();

if (typeof module !== 'undefined') module.exports = toGeoJSON;

},{}],"topojson":[function(require,module,exports){
module.exports=require('g070js');
},{}],"g070js":[function(require,module,exports){
var fs = require("fs");

var topojson = module.exports = new Function("topojson", "return " + "topojson = (function() {\n\n  function merge(topology, arcs) {\n    var fragmentByStart = {},\n        fragmentByEnd = {};\n\n    arcs.forEach(function(i) {\n      var e = ends(i),\n          start = e[0],\n          end = e[1],\n          f, g;\n\n      if (f = fragmentByEnd[start]) {\n        delete fragmentByEnd[f.end];\n        f.push(i);\n        f.end = end;\n        if (g = fragmentByStart[end]) {\n          delete fragmentByStart[g.start];\n          var fg = g === f ? f : f.concat(g);\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;\n        } else if (g = fragmentByEnd[end]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByStart[end]) {\n        delete fragmentByStart[f.start];\n        f.unshift(i);\n        f.start = start;\n        if (g = fragmentByEnd[start]) {\n          delete fragmentByEnd[g.end];\n          var gf = g === f ? f : g.concat(f);\n          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;\n        } else if (g = fragmentByStart[start]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);\n          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByStart[start]) {\n        delete fragmentByStart[f.start];\n        f.unshift(~i);\n        f.start = end;\n        if (g = fragmentByEnd[end]) {\n          delete fragmentByEnd[g.end];\n          var gf = g === f ? f : g.concat(f);\n          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;\n        } else if (g = fragmentByStart[end]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);\n          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByEnd[end]) {\n        delete fragmentByEnd[f.end];\n        f.push(~i);\n        f.end = start;\n        if (g = fragmentByEnd[start]) {\n          delete fragmentByStart[g.start];\n          var fg = g === f ? f : f.concat(g);\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;\n        } else if (g = fragmentByStart[start]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else {\n        f = [i];\n        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;\n      }\n    });\n\n    function ends(i) {\n      var arc = topology.arcs[i], p0 = arc[0], p1 = [0, 0];\n      arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });\n      return [p0, p1];\n    }\n\n    var fragments = [];\n    for (var k in fragmentByEnd) fragments.push(fragmentByEnd[k]);\n    return fragments;\n  }\n\n  function mesh(topology, o, filter) {\n    var arcs = [];\n\n    if (arguments.length > 1) {\n      var geomsByArc = [],\n          geom;\n\n      function arc(i) {\n        if (i < 0) i = ~i;\n        (geomsByArc[i] || (geomsByArc[i] = [])).push(geom);\n      }\n\n      function line(arcs) {\n        arcs.forEach(arc);\n      }\n\n      function polygon(arcs) {\n        arcs.forEach(line);\n      }\n\n      function geometry(o) {\n        if (o.type === \"GeometryCollection\") o.geometries.forEach(geometry);\n        else if (o.type in geometryType) {\n          geom = o;\n          geometryType[o.type](o.arcs);\n        }\n      }\n\n      var geometryType = {\n        LineString: line,\n        MultiLineString: polygon,\n        Polygon: polygon,\n        MultiPolygon: function(arcs) { arcs.forEach(polygon); }\n      };\n\n      geometry(o);\n\n      geomsByArc.forEach(arguments.length < 3\n          ? function(geoms, i) { arcs.push(i); }\n          : function(geoms, i) { if (filter(geoms[0], geoms[geoms.length - 1])) arcs.push(i); });\n    } else {\n      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);\n    }\n\n    return object(topology, {type: \"MultiLineString\", arcs: merge(topology, arcs)});\n  }\n\n  function featureOrCollection(topology, o) {\n    return o.type === \"GeometryCollection\" ? {\n      type: \"FeatureCollection\",\n      features: o.geometries.map(function(o) { return feature(topology, o); })\n    } : feature(topology, o);\n  }\n\n  function feature(topology, o) {\n    var f = {\n      type: \"Feature\",\n      id: o.id,\n      properties: o.properties || {},\n      geometry: object(topology, o)\n    };\n    if (o.id == null) delete f.id;\n    return f;\n  }\n\n  function object(topology, o) {\n    var absolute = transformAbsolute(topology.transform),\n        arcs = topology.arcs;\n\n    function arc(i, points) {\n      if (points.length) points.pop();\n      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, p; k < n; ++k) {\n        points.push(p = a[k].slice());\n        absolute(p, k);\n      }\n      if (i < 0) reverse(points, n);\n    }\n\n    function point(p) {\n      p = p.slice();\n      absolute(p, 0);\n      return p;\n    }\n\n    function line(arcs) {\n      var points = [];\n      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);\n      if (points.length < 2) points.push(points[0].slice());\n      return points;\n    }\n\n    function ring(arcs) {\n      var points = line(arcs);\n      while (points.length < 4) points.push(points[0].slice());\n      return points;\n    }\n\n    function polygon(arcs) {\n      return arcs.map(ring);\n    }\n\n    function geometry(o) {\n      var t = o.type;\n      return t === \"GeometryCollection\" ? {type: t, geometries: o.geometries.map(geometry)}\n          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}\n          : null;\n    }\n\n    var geometryType = {\n      Point: function(o) { return point(o.coordinates); },\n      MultiPoint: function(o) { return o.coordinates.map(point); },\n      LineString: function(o) { return line(o.arcs); },\n      MultiLineString: function(o) { return o.arcs.map(line); },\n      Polygon: function(o) { return polygon(o.arcs); },\n      MultiPolygon: function(o) { return o.arcs.map(polygon); }\n    };\n\n    return geometry(o);\n  }\n\n  function reverse(array, n) {\n    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;\n  }\n\n  function bisect(a, x) {\n    var lo = 0, hi = a.length;\n    while (lo < hi) {\n      var mid = lo + hi >>> 1;\n      if (a[mid] < x) lo = mid + 1;\n      else hi = mid;\n    }\n    return lo;\n  }\n\n  function neighbors(objects) {\n    var indexesByArc = {}, // arc index -> array of object indexes\n        neighbors = objects.map(function() { return []; });\n\n    function line(arcs, i) {\n      arcs.forEach(function(a) {\n        if (a < 0) a = ~a;\n        var o = indexesByArc[a];\n        if (o) o.push(i);\n        else indexesByArc[a] = [i];\n      });\n    }\n\n    function polygon(arcs, i) {\n      arcs.forEach(function(arc) { line(arc, i); });\n    }\n\n    function geometry(o, i) {\n      if (o.type === \"GeometryCollection\") o.geometries.forEach(function(o) { geometry(o, i); });\n      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);\n    }\n\n    var geometryType = {\n      LineString: line,\n      MultiLineString: polygon,\n      Polygon: polygon,\n      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }\n    };\n\n    objects.forEach(geometry);\n\n    for (var i in indexesByArc) {\n      for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {\n        for (var k = j + 1; k < m; ++k) {\n          var ij = indexes[j], ik = indexes[k], n;\n          if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);\n          if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);\n        }\n      }\n    }\n\n    return neighbors;\n  }\n\n  function presimplify(topology, triangleArea) {\n    var absolute = transformAbsolute(topology.transform),\n        relative = transformRelative(topology.transform),\n        heap = minHeap(compareArea),\n        maxArea = 0,\n        triangle;\n\n    if (!triangleArea) triangleArea = cartesianArea;\n\n    topology.arcs.forEach(function(arc) {\n      var triangles = [];\n\n      arc.forEach(absolute);\n\n      for (var i = 1, n = arc.length - 1; i < n; ++i) {\n        triangle = arc.slice(i - 1, i + 2);\n        triangle[1][2] = triangleArea(triangle);\n        triangles.push(triangle);\n        heap.push(triangle);\n      }\n\n      // Always keep the arc endpoints!\n      arc[0][2] = arc[n][2] = Infinity;\n\n      for (var i = 0, n = triangles.length; i < n; ++i) {\n        triangle = triangles[i];\n        triangle.previous = triangles[i - 1];\n        triangle.next = triangles[i + 1];\n      }\n    });\n\n    while (triangle = heap.pop()) {\n      var previous = triangle.previous,\n          next = triangle.next;\n\n      // If the area of the current point is less than that of the previous point\n      // to be eliminated, use the latter's area instead. This ensures that the\n      // current point cannot be eliminated without eliminating previously-\n      // eliminated points.\n      if (triangle[1][2] < maxArea) triangle[1][2] = maxArea;\n      else maxArea = triangle[1][2];\n\n      if (previous) {\n        previous.next = next;\n        previous[2] = triangle[2];\n        update(previous);\n      }\n\n      if (next) {\n        next.previous = previous;\n        next[0] = triangle[0];\n        update(next);\n      }\n    }\n\n    topology.arcs.forEach(function(arc) {\n      arc.forEach(relative);\n    });\n\n    function update(triangle) {\n      heap.remove(triangle);\n      triangle[1][2] = triangleArea(triangle);\n      heap.push(triangle);\n    }\n\n    return topology;\n  };\n\n  function cartesianArea(triangle) {\n    return Math.abs(\n      (triangle[0][0] - triangle[2][0]) * (triangle[1][1] - triangle[0][1])\n      - (triangle[0][0] - triangle[1][0]) * (triangle[2][1] - triangle[0][1])\n    );\n  }\n\n  function compareArea(a, b) {\n    return a[1][2] - b[1][2];\n  }\n\n  function minHeap(compare) {\n    var heap = {},\n        array = [];\n\n    heap.push = function() {\n      for (var i = 0, n = arguments.length; i < n; ++i) {\n        var object = arguments[i];\n        up(object.index = array.push(object) - 1);\n      }\n      return array.length;\n    };\n\n    heap.pop = function() {\n      var removed = array[0],\n          object = array.pop();\n      if (array.length) {\n        array[object.index = 0] = object;\n        down(0);\n      }\n      return removed;\n    };\n\n    heap.remove = function(removed) {\n      var i = removed.index,\n          object = array.pop();\n      if (i !== array.length) {\n        array[object.index = i] = object;\n        (compare(object, removed) < 0 ? up : down)(i);\n      }\n      return i;\n    };\n\n    function up(i) {\n      var object = array[i];\n      while (i > 0) {\n        var up = ((i + 1) >> 1) - 1,\n            parent = array[up];\n        if (compare(object, parent) >= 0) break;\n        array[parent.index = i] = parent;\n        array[object.index = i = up] = object;\n      }\n    }\n\n    function down(i) {\n      var object = array[i];\n      while (true) {\n        var right = (i + 1) << 1,\n            left = right - 1,\n            down = i,\n            child = array[down];\n        if (left < array.length && compare(array[left], child) < 0) child = array[down = left];\n        if (right < array.length && compare(array[right], child) < 0) child = array[down = right];\n        if (down === i) break;\n        array[child.index = i] = child;\n        array[object.index = i = down] = object;\n      }\n    }\n\n    return heap;\n  }\n\n  function transformAbsolute(transform) {\n    if (!transform) return noop;\n    var x0,\n        y0,\n        kx = transform.scale[0],\n        ky = transform.scale[1],\n        dx = transform.translate[0],\n        dy = transform.translate[1];\n    return function(point, i) {\n      if (!i) x0 = y0 = 0;\n      point[0] = (x0 += point[0]) * kx + dx;\n      point[1] = (y0 += point[1]) * ky + dy;\n    };\n  }\n\n  function transformRelative(transform) {\n    if (!transform) return noop;\n    var x0,\n        y0,\n        kx = transform.scale[0],\n        ky = transform.scale[1],\n        dx = transform.translate[0],\n        dy = transform.translate[1];\n    return function(point, i) {\n      if (!i) x0 = y0 = 0;\n      var x1 = (point[0] - dx) / kx | 0,\n          y1 = (point[1] - dy) / ky | 0;\n      point[0] = x1 - x0;\n      point[1] = y1 - y0;\n      x0 = x1;\n      y0 = y1;\n    };\n  }\n\n  function noop() {}\n\n  return {\n    version: \"1.4.0\",\n    mesh: mesh,\n    feature: featureOrCollection,\n    neighbors: neighbors,\n    presimplify: presimplify\n  };\n})();\n")();
topojson.topology = require("./lib/topojson/topology");
topojson.simplify = require("./lib/topojson/simplify");
topojson.clockwise = require("./lib/topojson/clockwise");
topojson.filter = require("./lib/topojson/filter");
topojson.prune = require("./lib/topojson/prune");
topojson.bind = require("./lib/topojson/bind");

},{"./lib/topojson/bind":25,"./lib/topojson/clockwise":28,"./lib/topojson/filter":32,"./lib/topojson/prune":35,"./lib/topojson/simplify":37,"./lib/topojson/topology":40,"fs":2}],25:[function(require,module,exports){
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

},{"../../":"g070js","./type":50}],26:[function(require,module,exports){

// Computes the bounding box of the specified hash of GeoJSON objects.
module.exports = function(objects) {
  var x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  function boundGeometry(geometry) {
    if (geometry && boundGeometryType.hasOwnProperty(geometry.type)) boundGeometryType[geometry.type](geometry);
  }

  var boundGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(boundGeometry); },
    Point: function(o) { boundPoint(o.coordinates); },
    MultiPoint: function(o) { o.coordinates.forEach(boundPoint); },
    LineString: function(o) { boundLine(o.coordinates); },
    MultiLineString: function(o) { o.coordinates.forEach(boundLine); },
    Polygon: function(o) { o.coordinates.forEach(boundLine); },
    MultiPolygon: function(o) { o.coordinates.forEach(boundMultiLine); }
  };

  function boundPoint(coordinates) {
    var x = coordinates[0],
        y = coordinates[1];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  function boundLine(coordinates) {
    coordinates.forEach(boundPoint);
  }

  function boundMultiLine(coordinates) {
    coordinates.forEach(boundLine);
  }

  for (var key in objects) {
    boundGeometry(objects[key]);
  }

  return [x0, y0, x1, y1];
};

},{}],27:[function(require,module,exports){
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
  return -area * .5; // ensure clockwise pixel areas are positive
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

},{}],28:[function(require,module,exports){
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

},{"../../":"g070js","./coordinate-systems":30,"./type":50}],29:[function(require,module,exports){
// Given a hash of GeoJSON objects and an id function, invokes the id function
// to compute a new id for each object that is a feature. The function is passed
// the feature and is expected to return the new feature id, or null if the
// feature should not have an id.
module.exports = function(objects, id) {
  if (arguments.length < 2) id = function(d) { return d.id; };

  function idObject(object) {
    if (object && idObjectType.hasOwnProperty(object.type)) idObjectType[object.type](object);
  }

  function idFeature(feature) {
    var i = id(feature);
    if (i == null) delete feature.id;
    else feature.id = i;
  }

  var idObjectType = {
    Feature: idFeature,
    FeatureCollection: function(collection) { collection.features.forEach(idFeature); }
  };

  for (var key in objects) {
    idObject(objects[key]);
  }

  return objects;
};

},{}],30:[function(require,module,exports){
module.exports = {
  cartesian: require("./cartesian"),
  spherical: require("./spherical")
};

},{"./cartesian":27,"./spherical":38}],31:[function(require,module,exports){
// Given a TopoJSON topology in absolute (quantized) coordinates,
// converts to fixed-point delta encoding.
// This is a destructive operation that modifies the given topology!
module.exports = function(topology) {
  var arcs = topology.arcs,
      i = -1,
      n = arcs.length;

  while (++i < n) {
    var arc = arcs[i],
        j = 0,
        m = arc.length,
        point = arc[0],
        x0 = point[0],
        y0 = point[1],
        x1,
        y1;
    while (++j < m) {
      point = arc[j];
      x1 = point[0];
      y1 = point[1];
      arc[j] = [x1 - x0, y1 - y0];
      x0 = x1;
      y0 = y1;
    }
  }

  return topology;
};

},{}],32:[function(require,module,exports){
var type = require("./type"),
    prune = require("./prune"),
    clockwise = require("./clockwise"),
    systems = require("./coordinate-systems"),
    topojson = require("../../");

module.exports = function(topology, options) {
  var system = null,
      forceClockwise = true, // force exterior rings to be clockwise?
      minimumArea;

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "minimum-area" in options && (minimumArea = +options["minimum-area"]),
    "force-clockwise" in options && (forceClockwise = !!options["force-clockwise"]);

  if (forceClockwise) clockwise(topology, options); // deprecated; for backwards-compatibility

  if (!(minimumArea > 0)) minimumArea = Number.MIN_VALUE;

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
    var topopolygon = {type: "Polygon", arcs: [ring]},
        geopolygon = topojson.feature(topology, topopolygon),
        exterior = geopolygon.geometry.coordinates[0],
        exteriorArea = system.absoluteArea(system.ringArea(exterior));
    return exteriorArea >= minimumArea;
  }
};

function noop() {}

},{"../../":"g070js","./clockwise":28,"./coordinate-systems":30,"./prune":35,"./type":50}],33:[function(require,module,exports){
// Given a hash of GeoJSON objects, replaces Features with geometry objects.
// This is a destructive operation that modifies the input objects!
module.exports = function(objects) {

  function geomifyObject(object) {
    return (object && geomifyObjectType.hasOwnProperty(object.type)
        ? geomifyObjectType[object.type]
        : geomifyGeometry)(object);
  }

  function geomifyFeature(feature) {
    var geometry = feature.geometry;
    if (geometry == null) {
      feature.type = null;
    } else {
      geomifyGeometry(geometry);
      feature.type = geometry.type;
      if (geometry.geometries) feature.geometries = geometry.geometries;
      else if (geometry.coordinates) feature.coordinates = geometry.coordinates;
    }
    delete feature.geometry;
    return feature;
  }

  function geomifyGeometry(geometry) {
    if (!geometry) return {type: null};
    if (geomifyGeometryType.hasOwnProperty(geometry.type)) geomifyGeometryType[geometry.type](geometry);
    return geometry;
  }

  var geomifyObjectType = {
    Feature: geomifyFeature,
    FeatureCollection: function(collection) {
      collection.type = "GeometryCollection";
      collection.geometries = collection.features;
      collection.features.forEach(geomifyFeature);
      delete collection.features;
      return collection;
    }
  };

  var geomifyGeometryType = {
    GeometryCollection: function(o) {
      var geometries = o.geometries, i = -1, n = geometries.length;
      while (++i < n) geometries[i] = geomifyGeometry(geometries[i]);
    },
    MultiPoint: function(o) {
      if (!o.coordinates.length) {
        o.type = null;
        delete o.coordinates;
      } else if (o.coordinates.length < 2) {
        o.type = "Point";
        o.coordinates = o.coordinates[0];
      }
    },
    LineString: function(o) {
      if (!o.coordinates.length) {
        o.type = null;
        delete o.coordinates;
      }
    },
    MultiLineString: function(o) {
      for (var lines = o.coordinates, i = 0, N = 0, n = lines.length; i < n; ++i) {
        var line = lines[i];
        if (line.length) lines[N++] = line;
      }
      if (!N) {
        o.type = null;
        delete o.coordinates;
      } else if (N < 2) {
        o.type = "LineString";
        o.coordinates = lines[0];
      } else {
        o.coordinates.length = N;
      }
    },
    Polygon: function(o) {
      for (var rings = o.coordinates, i = 0, N = 0, n = rings.length; i < n; ++i) {
        var ring = rings[i];
        if (ring.length) rings[N++] = ring;
      }
      if (!N) {
        o.type = null;
        delete o.coordinates;
      } else {
        o.coordinates.length = N;
      }
    },
    MultiPolygon: function(o) {
      for (var polygons = o.coordinates, j = 0, M = 0, m = polygons.length; j < m; ++j) {
        for (var rings = polygons[j], i = 0, N = 0, n = rings.length; i < n; ++i) {
          var ring = rings[i];
          if (ring.length) rings[N++] = ring;
        }
        if (N) {
          rings.length = N;
          polygons[M++] = rings;
        }
      }
      if (!M) {
        o.type = null;
        delete o.coordinates;
      } else if (M < 2) {
        o.type = "Polygon";
        o.coordinates = polygons[0];
      } else {
        polygons.length = M;
      }
    }
  };

  for (var key in objects) {
    objects[key] = geomifyObject(objects[key]);
  }

  return objects;
};

},{}],34:[function(require,module,exports){
module.exports = function(objects, filter) {

  function prefilterGeometry(geometry) {
    if (!geometry) return {type: null};
    if (prefilterGeometryType.hasOwnProperty(geometry.type)) prefilterGeometryType[geometry.type](geometry);
    return geometry;
  }

  var prefilterGeometryType = {
    GeometryCollection: function(o) {
      var geometries = o.geometries, i = -1, n = geometries.length;
      while (++i < n) geometries[i] = prefilterGeometry(geometries[i]);
    },
    Polygon: function(o) {
      for (var rings = o.coordinates, i = 0, N = 0, n = rings.length; i < n; ++i) {
        var ring = rings[i];
        if (filter(ring)) rings[N++] = ring;
      }
      if (!N) {
        o.type = null;
        delete o.coordinates;
      } else {
        o.coordinates.length = N;
      }
    },
    MultiPolygon: function(o) {
      for (var polygons = o.coordinates, j = 0, M = 0, m = polygons.length; j < m; ++j) {
        for (var rings = polygons[j], i = 0, N = 0, n = rings.length; i < n; ++i) {
          var ring = rings[i];
          if (filter(ring)) rings[N++] = ring;
        }
        if (N) {
          rings.length = N;
          polygons[M++] = rings;
        }
      }
      if (!M) {
        o.type = null;
        delete o.coordinates;
      } else if (M < 2) {
        o.type = "Polygon";
        o.coordinates = polygons[0];
      } else {
        polygons.length = M;
      }
    }
  };

  for (var key in objects) {
    objects[key] = prefilterGeometry(objects[key]);
  }

  return objects;
};

},{}],35:[function(require,module,exports){
module.exports = function(topology, options) {
  var verbose = false,
      objects = topology.objects,
      oldArcs = topology.arcs,
      oldArcCount = oldArcs.length,
      newArcs = topology.arcs = [],
      newArcCount = 0,
      newIndexByOldIndex = new Array(oldArcs.length);

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]);

  function pruneGeometry(geometry) {
    if (geometry && pruneGeometryType.hasOwnProperty(geometry.type)) pruneGeometryType[geometry.type](geometry);
  }

  var pruneGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(pruneGeometry); },
    LineString: function(o) { pruneArcs(o.arcs); },
    MultiLineString: function(o) { o.arcs.forEach(pruneArcs); },
    Polygon: function(o) { o.arcs.forEach(pruneArcs); },
    MultiPolygon: function(o) { o.arcs.forEach(pruneMultiArcs); }
  };

  function pruneArcs(arcs) {
    for (var i = 0, m = 0, n = arcs.length; i < n; ++i) {
      var oldIndex = arcs[i],
          oldReverse = oldIndex < 0 && (oldIndex = ~oldIndex, true),
          oldArc = oldArcs[oldIndex],
          newIndex;

      // Skip collapsed arc segments.
      if (oldArc.length < 3 && !oldArc[1][0] && !oldArc[1][1]) continue;

      // If this is the first instance of this arc,
      // record it under its new index.
      if ((newIndex = newIndexByOldIndex[oldIndex]) == null) {
        newIndexByOldIndex[oldIndex] = newIndex = newArcCount++;
        newArcs[newIndex] = oldArcs[oldIndex];
      }

      arcs[m++] = oldReverse ? ~newIndex : newIndex;
    }

    // If all were collapsed, restore the last arc to avoid collapsing the line.
    if (!(arcs.length = m) && n) {

      // If this is the first instance of this arc,
      // record it under its new index.
      if ((newIndex = newIndexByOldIndex[oldIndex]) == null) {
        newIndexByOldIndex[oldIndex] = newIndex = newArcCount++;
        newArcs[newIndex] = oldArcs[oldIndex];
      }

      arcs[0] = oldReverse ? ~newIndex : newIndex;
    }
  }

  function pruneMultiArcs(arcs) {
    arcs.forEach(pruneArcs);
  }

  for (var key in objects) {
    pruneGeometry(objects[key]);
  }

  if (verbose) console.warn("prune: retained " + newArcCount + " / " + oldArcCount + " arcs (" + Math.round(newArcCount / oldArcCount * 100) + "%)");

  return topology;
};

function noop() {}

},{}],36:[function(require,module,exports){
module.exports = function(objects, bbox, Q) {
  var x0 = isFinite(bbox[0]) ? bbox[0] : 0,
      y0 = isFinite(bbox[1]) ? bbox[1] : 0,
      x1 = isFinite(bbox[2]) ? bbox[2] : 0,
      y1 = isFinite(bbox[3]) ? bbox[3] : 0,
      kx = x1 - x0 ? (Q - 1) / (x1 - x0) : 1,
      ky = y1 - y0 ? (Q - 1) / (y1 - y0) : 1;

  function quantizeGeometry(geometry) {
    if (geometry && quantizeGeometryType.hasOwnProperty(geometry.type)) quantizeGeometryType[geometry.type](geometry);
  }

  var quantizeGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(quantizeGeometry); },
    Point: function(o) { quantizePoint(o.coordinates); },
    MultiPoint: function(o) { o.coordinates.forEach(quantizePoint); },
    LineString: function(o) {
      var line = o.coordinates;
      quantizeLine(line);
      if (line.length < 2) line[1] = line[0]; // must have 2+
    },
    MultiLineString: function(o) {
      for (var lines = o.coordinates, i = 0, n = lines.length; i < n; ++i) {
        var line = lines[i];
        quantizeLine(line);
        if (line.length < 2) line[1] = line[0]; // must have 2+
      }
    },
    Polygon: function(o) {
      for (var rings = o.coordinates, i = 0, n = rings.length; i < n; ++i) {
        var ring = rings[i];
        quantizeLine(ring);
        while (ring.length < 4) ring.push(ring[0]); // must have 4+
      }
    },
    MultiPolygon: function(o) {
      for (var polygons = o.coordinates, i = 0, n = polygons.length; i < n; ++i) {
        for (var rings = polygons[i], j = 0, m = rings.length; j < m; ++j) {
          var ring = rings[j];
          quantizeLine(ring);
          while (ring.length < 4) ring.push(ring[0]); // must have 4+
        }
      }
    }
  };

  function quantizePoint(coordinates) {
    coordinates[0] = Math.round((coordinates[0] - x0) * kx);
    coordinates[1] = Math.round((coordinates[1] - y0) * ky);
  }

  function quantizeLine(coordinates) {
    var i = 0,
        j = 1,
        n = coordinates.length,
        pi = coordinates[0],
        pj,
        px = pi[0] = Math.round((pi[0] - x0) * kx),
        py = pi[1] = Math.round((pi[1] - y0) * ky),
        x,
        y;

    while (++i < n) {
      pi = coordinates[i];
      x = Math.round((pi[0] - x0) * kx);
      y = Math.round((pi[1] - y0) * ky);
      if (x !== px || y !== py) { // skip coincident points
        pj = coordinates[j++];
        pj[0] = px = x;
        pj[1] = py = y;
      }
    }

    coordinates.length = j;
  }

  for (var key in objects) {
    quantizeGeometry(objects[key]);
  }

  return {
    scale: [1 / kx, 1 / ky],
    translate: [x0, y0]
  };
};

},{}],37:[function(require,module,exports){
var topojson = require("../../"),
    systems = require("./coordinate-systems");

module.exports = function(topology, options) {
  var minimumArea = 0,
      retainProportion,
      verbose = false,
      system = null,
      N = topology.arcs.reduce(function(p, v) { return p + v.length; }, 0),
      M = 0;

  if (options)
    "minimum-area" in options && (minimumArea = +options["minimum-area"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "retain-proportion" in options && (retainProportion = +options["retain-proportion"]),
    "verbose" in options && (verbose = !!options["verbose"]);

  topojson.presimplify(topology, system.triangleArea);

  if (retainProportion) {
    var areas = [];
    topology.arcs.forEach(function(arc) {
      arc.forEach(function(point) {
        areas.push(point[2]);
      });
    });
    options["minimum-area"] = minimumArea = N ? areas.sort(function(a, b) { return b - a; })[Math.ceil((N - 1) * retainProportion)] : 0;
    if (verbose) console.warn("simplification: effective minimum area " + minimumArea.toPrecision(3));
  }

  topology.arcs.forEach(topology.transform ? function(arc) {
    var dx = 0,
        dy = 0, // accumulate removed points
        i = -1,
        j = -1,
        n = arc.length,
        source,
        target;

    while (++i < n) {
      source = arc[i];
      if (source[2] >= minimumArea) {
        target = arc[++j];
        target[0] = source[0] + dx;
        target[1] = source[1] + dy;
        dx = dy = 0;
      } else {
        dx += source[0];
        dy += source[1];
      }
    }

    arc.length = ++j;
  } : function(arc) {
    var i = -1,
        j = -1,
        n = arc.length,
        point;

    while (++i < n) {
      point = arc[i];
      if (point[2] >= minimumArea) {
        arc[++j] = point;
      }
    }

    arc.length = ++j;
  });

  // Remove computed area (z) for each point.
  // This is done as a separate pass because some coordinates may be shared
  // between arcs (such as the last point and first point of a cut line).
  topology.arcs.forEach(function(arc) {
    var i = -1, n = arc.length;
    while (++i < n) arc[i].length = 2;
    M += arc.length;
  });

  if (verbose) console.warn("simplification: retained " + M + " / " + N + " points (" + Math.round((M / N) * 100) + "%)");

  return topology;
};

},{"../../":"g070js","./coordinate-systems":30}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{"./type":50}],40:[function(require,module,exports){
var type = require("./type"),
    stitch = require("./stitch-poles"),
    systems = require("./coordinate-systems"),
    topologize = require("./topology/index"),
    delta = require("./delta"),
    geomify = require("./geomify"),
    prefilter = require("./prefilter"),
    quantize = require("./quantize"),
    bounds = require("./bounds"),
    computeId = require("./compute-id"),
    transformProperties = require("./transform-properties");

var ε = 1e-6;

module.exports = function(objects, options) {
  var Q = 1e4, // precision of quantization
      id = function(d) { return d.id; }, // function to compute object id
      propertyTransform = function() {}, // function to transform properties
      transform,
      minimumArea = 0,
      stitchPoles = true,
      verbose = false,
      system = null;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]),
    "stitch-poles" in options && (stitchPoles = !!options["stitch-poles"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "minimum-area" in options && (minimumArea = +options["minimum-area"]),
    "quantization" in options && (Q = +options["quantization"]),
    "id" in options && (id = options["id"]),
    "property-transform" in options && (propertyTransform = options["property-transform"]);

  // Compute the new feature id and transform properties.
  computeId(objects, id);
  transformProperties(objects, propertyTransform);

  // Convert to geometry objects.
  geomify(objects);

  // Compute initial bounding box.
  var bbox = bounds(objects);

  // For automatic coordinate system determination, consider the bounding box.
  var oversize = bbox[0] < -180 - ε
      || bbox[1] < -90 - ε
      || bbox[2] > 180 + ε
      || bbox[3] > 90 + ε;
  if (!system) {
    system = systems[oversize ? "cartesian" : "spherical"];
    if (options) options["coordinate-system"] = system.name;
  }

  if (system === systems.spherical) {
    if (oversize) throw new Error("spherical coordinates outside of [±180°, ±90°]");
    if (stitchPoles) stitch(objects), bbox = bounds(objects);

    // When near the spherical coordinate limits, clamp to nice round values.
    // This avoids quantized coordinates that are slightly outside the limits.
    if (bbox[0] < -180 + ε) bbox[0] = -180;
    if (bbox[1] < -90 + ε) bbox[1] = -90;
    if (bbox[2] > 180 - ε) bbox[2] = 180;
    if (bbox[3] > 90 - ε) bbox[3] = 90;
  }

  if (verbose) {
    console.warn("bounds: " + bbox.join(" ") + " (" + system.name + ")");
  }

  // Filter rings smaller than the minimum area.
  // This can produce a simpler topology.
  if (minimumArea) prefilter(objects, function(ring) {
    return system.absoluteArea(system.ringArea(ring)) >= minimumArea;
  });

  // Compute the quantization transform.
  if (Q) {
    transform = quantize(objects, bbox, Q);
    if (verbose) {
      console.warn("quantization: " + transform.scale.map(function(degrees) { return system.formatDistance(degrees / 180 * Math.PI); }).join(" "));
    }
  }

  // Compute the topology.
  var topology = topologize(objects);
  topology.bbox = bbox;

  if (verbose) {
    console.warn("topology: " + topology.arcs.length + " arcs, " + topology.arcs.reduce(function(p, v) { return p + v.length; }, 0) + " points");
  }

  // Convert to delta-encoding.
  if (Q) topology.transform = transform, delta(topology);

  return topology;
};

},{"./bounds":26,"./compute-id":29,"./coordinate-systems":30,"./delta":31,"./geomify":33,"./prefilter":34,"./quantize":36,"./stitch-poles":39,"./topology/index":45,"./transform-properties":49,"./type":50}],41:[function(require,module,exports){
var join = require("./join");

// Given an extracted (pre-)topology, cuts (or rotates) arcs so that all shared
// point sequences are identified. The topology can then be subsequently deduped
// to remove exact duplicate arcs.
module.exports = function(topology) {
  var junctionByPoint = join(topology),
      coordinates = topology.coordinates,
      lines = topology.lines,
      rings = topology.rings;

  for (var i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i],
        lineMid = line[0],
        lineEnd = line[1];
    while (++lineMid < lineEnd) {
      if (junctionByPoint.get(coordinates[lineMid])) {
        var next = {0: lineMid, 1: line[1]};
        line[1] = lineMid;
        line = line.next = next;
      }
    }
  }

  for (var i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i],
        ringStart = ring[0],
        ringMid = ringStart,
        ringEnd = ring[1],
        ringFixed = junctionByPoint.get(coordinates[ringStart]);
    while (++ringMid < ringEnd) {
      if (junctionByPoint.get(coordinates[ringMid])) {
        if (ringFixed) {
          var next = {0: ringMid, 1: ring[1]};
          ring[1] = ringMid;
          ring = ring.next = next;
        } else { // For the first junction, we can rotate rather than cut.
          rotateArray(coordinates, ringStart, ringEnd, ringEnd - ringMid);
          coordinates[ringEnd] = coordinates[ringStart];
          ringFixed = true;
          ringMid = ringStart; // restart; we may have skipped junctions
        }
      }
    }
  }

  return topology;
};

function rotateArray(array, start, end, offset) {
  reverse(array, start, end);
  reverse(array, start, start + offset);
  reverse(array, start + offset, end);
}

function reverse(array, start, end) {
  for (var mid = start + ((end-- - start) >> 1), t; start < mid; ++start, --end) {
    t = array[start], array[start] = array[end], array[end] = t;
  }
}

},{"./join":46}],42:[function(require,module,exports){
var join = require("./join"),
    hashtable = require("./hashtable"),
    hashPoint = require("./point-hash"),
    equalPoint = require("./point-equal");

// Given a cut topology, combines duplicate arcs.
module.exports = function(topology) {
  var coordinates = topology.coordinates,
      lines = topology.lines,
      rings = topology.rings,
      arcCount = lines.length + rings.length;

  delete topology.lines;
  delete topology.rings;

  // Count the number of (non-unique) arcs to initialize the hashtable safely.
  for (var i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i]; while (line = line.next) ++arcCount;
  }
  for (var i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i]; while (ring = ring.next) ++arcCount;
  }

  var arcsByEnd = hashtable(arcCount * 2, hashPoint, equalPoint),
      arcs = topology.arcs = [];

  for (var i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i];
    do {
      dedupLine(line);
    } while (line = line.next);
  }

  for (var i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i];
    if (ring.next) { // arc is no longer closed
      do {
        dedupLine(ring);
      } while (ring = ring.next);
    } else {
      dedupRing(ring);
    }
  }

  function dedupLine(arc) {
    var startPoint,
        endPoint,
        startArcs,
        endArcs;

    // Does this arc match an existing arc in order?
    if (startArcs = arcsByEnd.get(startPoint = coordinates[arc[0]])) {
      for (var i = 0, n = startArcs.length; i < n; ++i) {
        var startArc = startArcs[i];
        if (equalLine(startArc, arc)) {
          arc[0] = startArc[0];
          arc[1] = startArc[1];
          return;
        }
      }
    }

    // Does this arc match an existing arc in reverse order?
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[1]])) {
      for (var i = 0, n = endArcs.length; i < n; ++i) {
        var endArc = endArcs[i];
        if (reverseEqualLine(endArc, arc)) {
          arc[1] = endArc[0];
          arc[0] = endArc[1];
          return;
        }
      }
    }

    if (startArcs) startArcs.push(arc); else arcsByEnd.set(startPoint, [arc]);
    if (endArcs) endArcs.push(arc); else arcsByEnd.set(endPoint, [arc]);
    arcs.push(arc);
  }

  function dedupRing(arc) {
    var endPoint,
        endArcs;

    // Does this arc match an existing line in order, or reverse order?
    // Rings are closed, so their start point and end point is the same.
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[0]])) {
      for (var i = 0, n = endArcs.length; i < n; ++i) {
        var endArc = endArcs[i];
        if (equalRing(endArc, arc)) {
          arc[0] = endArc[0];
          arc[1] = endArc[1];
          return;
        }
        if (reverseEqualRing(endArc, arc)) {
          arc[0] = endArc[1];
          arc[1] = endArc[0];
          return;
        }
      }
    }

    // Otherwise, does this arc match an existing ring in order, or reverse order?
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[0] + findMinimumOffset(arc)])) {
      for (var i = 0, n = endArcs.length; i < n; ++i) {
        var endArc = endArcs[i];
        if (equalRing(endArc, arc)) {
          arc[0] = endArc[0];
          arc[1] = endArc[1];
          return;
        }
        if (reverseEqualRing(endArc, arc)) {
          arc[0] = endArc[1];
          arc[1] = endArc[0];
          return;
        }
      }
    }

    if (endArcs) endArcs.push(arc); else arcsByEnd.set(endPoint, [arc]);
    arcs.push(arc);
  }

  function equalLine(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1];
    if (ia - ja !== ib - jb) return false;
    for (; ia <= ja; ++ia, ++ib) if (!equalPoint(coordinates[ia], coordinates[ib])) return false;
    return true;
  }

  function reverseEqualLine(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1];
    if (ia - ja !== ib - jb) return false;
    for (; ia <= ja; ++ia, --jb) if (!equalPoint(coordinates[ia], coordinates[jb])) return false;
    return true;
  }

  function equalRing(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1],
        n = ja - ia;
    if (n !== jb - ib) return false;
    var ka = findMinimumOffset(arcA),
        kb = findMinimumOffset(arcB);
    for (var i = 0; i < n; ++i) {
      if (!equalPoint(coordinates[ia + (i + ka) % n], coordinates[ib + (i + kb) % n])) return false;
    }
    return true;
  }

  function reverseEqualRing(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1],
        n = ja - ia;
    if (n !== jb - ib) return false;
    var ka = findMinimumOffset(arcA),
        kb = n - findMinimumOffset(arcB);
    for (var i = 0; i < n; ++i) {
      if (!equalPoint(coordinates[ia + (i + ka) % n], coordinates[jb - (i + kb) % n])) return false;
    }
    return true;
  }

  // Rings are rotated to a consistent, but arbitrary, start point.
  // This is necessary to detect when a ring and a rotated copy are dupes.
  function findMinimumOffset(arc) {
    var start = arc[0],
        end = arc[1],
        mid = start,
        minimum = mid,
        minimumPoint = coordinates[mid];
    while (++mid < end) {
      var point = coordinates[mid];
      if (point[0] < minimumPoint[0] || point[0] === minimumPoint[0] && point[1] < minimumPoint[1]) {
        minimum = mid;
        minimumPoint = point;
      }
    }
    return minimum - start;
  }

  return topology;
};

},{"./hashtable":44,"./join":46,"./point-equal":47,"./point-hash":48}],43:[function(require,module,exports){
// Extracts the lines and rings from the specified hash of geometry objects.
//
// Returns an object with three properties:
//
// * coordinates - shared buffer of [x, y] coordinates
// * lines - lines extracted from the hash, of the form [start, end]
// * rings - rings extracted from the hash, of the form [start, end]
//
// For each ring or line, start and end represent inclusive indexes into the
// coordinates buffer. For rings (and closed lines), coordinates[start] equals
// coordinates[end].
//
// For each line or polygon geometry in the input hash, including nested
// geometries as in geometry collections, the `coordinates` array is replaced
// with an equivalent `arcs` array that, for each line (for line string
// geometries) or ring (for polygon geometries), points to one of the above
// lines or rings.
module.exports = function(objects) {
  var index = -1,
      lines = [],
      rings = [],
      coordinates = [];

  function extractGeometry(geometry) {
    if (geometry && extractGeometryType.hasOwnProperty(geometry.type)) extractGeometryType[geometry.type](geometry);
  }

  var extractGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(extractGeometry); },
    LineString: function(o) { o.arcs = extractLine(o.coordinates); delete o.coordinates; },
    MultiLineString: function(o) { o.arcs = o.coordinates.map(extractLine); delete o.coordinates; },
    Polygon: function(o) { o.arcs = o.coordinates.map(extractRing); delete o.coordinates; },
    MultiPolygon: function(o) { o.arcs = o.coordinates.map(extractMultiRing); delete o.coordinates; }
  };

  function extractLine(line) {
    for (var i = 0, n = line.length; i < n; ++i) coordinates[++index] = line[i];
    var arc = {0: index - n + 1, 1: index};
    lines.push(arc);
    return arc;
  }

  function extractRing(ring) {
    for (var i = 0, n = ring.length; i < n; ++i) coordinates[++index] = ring[i];
    var arc = {0: index - n + 1, 1: index};
    rings.push(arc);
    return arc;
  }

  function extractMultiRing(rings) {
    return rings.map(extractRing);
  }

  for (var key in objects) {
    extractGeometry(objects[key]);
  }

  return {
    type: "Topology",
    coordinates: coordinates,
    lines: lines,
    rings: rings,
    objects: objects
  };
};

},{}],44:[function(require,module,exports){
module.exports = function(size, hash, equal) {
  var hashtable = new Array(size = 1 << Math.ceil(Math.log(size) / Math.LN2)),
      mask = size - 1,
      free = size;

  function set(key, value) {
    var index = hash(key) & mask,
        match = hashtable[index],
        cycle = !index;
    while (match != null) {
      if (equal(match.key, key)) return match.value = value;
      match = hashtable[index = (index + 1) & mask];
      if (!index && cycle++) throw new Error("full hashtable");
    }
    hashtable[index] = {key: key, value: value};
    --free;
    return value;
  }

  function get(key, missingValue) {
    var index = hash(key) & mask,
        match = hashtable[index],
        cycle = !index;
    while (match != null) {
      if (equal(match.key, key)) return match.value;
      match = hashtable[index = (index + 1) & mask];
      if (!index && cycle++) break;
    }
    return missingValue;
  }

  function remove(key) {
    var index = hash(key) & mask,
        match = hashtable[index],
        cycle = !index;
    while (match != null) {
      if (equal(match.key, key)) {
        hashtable[index] = null;
        match = hashtable[index = (index + 1) & mask];
        if (match != null) { // delete and re-add
          ++free;
          hashtable[index] = null;
          set(match.key, match.value);
        }
        ++free;
        return true;
      }
      match = hashtable[index = (index + 1) & mask];
      if (!index && cycle++) break;
    }
    return false;
  }

  function keys() {
    var keys = [];
    for (var i = 0, n = hashtable.length; i < n; ++i) {
      var match = hashtable[i];
      if (match != null) keys.push(match.key);
    }
    return keys;
  }

  return {
    set: set,
    get: get,
    remove: remove,
    keys: keys
  };
};

},{}],45:[function(require,module,exports){
var hashtable = require("./hashtable"),
    extract = require("./extract"),
    cut = require("./cut"),
    dedup = require("./dedup");

// Constructs the TopoJSON Topology for the specified hash of geometries.
// Each object in the specified hash must be a GeoJSON object,
// meaning FeatureCollection, a Feature or a geometry object.
module.exports = function(objects) {
  var topology = dedup(cut(extract(objects))),
      coordinates = topology.coordinates,
      indexByArc = hashtable(topology.arcs.length, hashArc, equalArc);

  objects = topology.objects; // for garbage collection

  topology.arcs = topology.arcs.map(function(arc, i) {
    indexByArc.set(arc, i);
    return coordinates.slice(arc[0], arc[1] + 1);
  });

  delete topology.coordinates;
  coordinates = null;

  function indexGeometry(geometry) {
    if (geometry && indexGeometryType.hasOwnProperty(geometry.type)) indexGeometryType[geometry.type](geometry);
  }

  var indexGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(indexGeometry); },
    LineString: function(o) { o.arcs = indexArcs(o.arcs); },
    MultiLineString: function(o) { o.arcs = o.arcs.map(indexArcs); },
    Polygon: function(o) { o.arcs = o.arcs.map(indexArcs); },
    MultiPolygon: function(o) { o.arcs = o.arcs.map(indexMultiArcs); }
  };

  function indexArcs(arc) {
    var indexes = [];
    do {
      var index = indexByArc.get(arc);
      indexes.push(arc[0] < arc[1] ? index : ~index);
    } while (arc = arc.next);
    return indexes;
  }

  function indexMultiArcs(arcs) {
    return arcs.map(indexArcs);
  }

  for (var key in objects) {
    indexGeometry(objects[key]);
  }

  return topology;
};

function hashArc(arc) {
  var i = arc[0], j = arc[1], t;
  if (j < i) t = i, i = j, j = t;
  return i + 31 * j;
}

function equalArc(arcA, arcB) {
  var ia = arcA[0], ja = arcA[1],
      ib = arcB[0], jb = arcB[1], t;
  if (ja < ia) t = ia, ia = ja, ja = t;
  if (jb < ib) t = ib, ib = jb, jb = t;
  return ia === ib && ja === jb;
}

},{"./cut":41,"./dedup":42,"./extract":43,"./hashtable":44}],46:[function(require,module,exports){
var hashtable = require("./hashtable"),
    hashPoint = require("./point-hash"),
    equalPoint = require("./point-equal");

// Given an extracted (pre-)topology, identifies all of the junctions. These are
// the points at which arcs (lines or rings) will need to be cut so that each
// arc is represented uniquely.
//
// A junction is a point where at least one arc deviates from another arc going
// through the same point. For example, consider the point B. If there is a arc
// through ABC and another arc through CBA, then B is not a junction because in
// both cases the adjacent point pairs are {A,C}. However, if there is an
// additional arc ABD, then {A,D} != {A,C}, and thus B becomes a junction.
//
// For a closed ring ABCA, the first point A’s adjacent points are the second
// and last point {B,C}. For a line, the first and last point are always
// considered junctions, even if the line is closed; this ensures that a closed
// line is never rotated.
module.exports = function(topology) {
  var coordinates = topology.coordinates,
      lines = topology.lines,
      rings = topology.rings,
      visitedByPoint,
      neighborsByPoint = hashtable(coordinates.length, hashPoint, equalPoint),
      junctionByPoint = hashtable(coordinates.length, hashPoint, equalPoint);

  for (var i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i],
        lineStart = line[0],
        lineEnd = line[1],
        previousPoint = null,
        currentPoint = coordinates[lineStart],
        nextPoint = coordinates[++lineStart];
    visitedByPoint = hashtable(lineEnd - lineStart, hashPoint, equalPoint);
    junctionByPoint.set(currentPoint, true); // start
    while (++lineStart <= lineEnd) {
      sequence(previousPoint = currentPoint, currentPoint = nextPoint, nextPoint = coordinates[lineStart]);
    }
    junctionByPoint.set(nextPoint, true); // end
  }

  for (var i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i],
        ringStart = ring[0] + 1,
        ringEnd = ring[1],
        previousPoint = coordinates[ringEnd - 1],
        currentPoint = coordinates[ringStart - 1],
        nextPoint = coordinates[ringStart];
    visitedByPoint = hashtable(ringEnd - ringStart + 1, hashPoint, equalPoint);
    sequence(previousPoint, currentPoint, nextPoint);
    while (++ringStart <= ringEnd) {
      sequence(previousPoint = currentPoint, currentPoint = nextPoint, nextPoint = coordinates[ringStart]);
    }
  }

  function sequence(previousPoint, currentPoint, nextPoint) {
    if (visitedByPoint.get(currentPoint)) return; // ignore self-intersection
    visitedByPoint.set(currentPoint, true);
    var neighbors = neighborsByPoint.get(currentPoint);
    if (neighbors) {
      if (!(equalPoint(neighbors[0], previousPoint)
        && equalPoint(neighbors[1], nextPoint))
        && !(equalPoint(neighbors[0], nextPoint)
        && equalPoint(neighbors[1], previousPoint))) {
        junctionByPoint.set(currentPoint, true);
      }
    } else {
      neighborsByPoint.set(currentPoint, [previousPoint, nextPoint]);
    }
  }

  return junctionByPoint;
};

},{"./hashtable":44,"./point-equal":47,"./point-hash":48}],47:[function(require,module,exports){
module.exports = function(pointA, pointB) {
  return pointA[0] === pointB[0] && pointA[1] === pointB[1];
};

},{}],48:[function(require,module,exports){
// TODO if quantized, use simpler Int32 hashing?

var hashBuffer = new ArrayBuffer(8),
    hashFloats = new Float64Array(hashBuffer),
    hashInts = new Int32Array(hashBuffer);

function hashFloat(x) {
  hashFloats[0] = x;
  x = hashInts[1] ^ hashInts[0];
  x ^= (x >>> 20) ^ (x >>> 12);
  x ^= (x >>> 7) ^ (x >>> 4);
  return x;
}

module.exports = function(point) {
  var h = (hashFloat(point[0]) + 31 * hashFloat(point[1])) | 0;
  return h < 0 ? ~h : h;
};

},{}],49:[function(require,module,exports){
// Given a hash of GeoJSON objects, transforms any properties on features using
// the specified transform function. The function is invoked for each existing
// property on the current feature, being passed the new properties hash, the
// property name, and the property value. The function is then expected to
// assign a new value to the given property hash if the feature is to be
// retained and return true. Or, to skip the property, do nothing and return
// false. If no properties are propagated to the new properties hash, the
// properties hash will be deleted from the current feature.
module.exports = function(objects, propertyTransform) {
  if (arguments.length < 2) propertyTransform = function() {};

  function transformObject(object) {
    if (object && transformObjectType.hasOwnProperty(object.type)) transformObjectType[object.type](object);
  }

  function transformFeature(feature) {
    if (feature.properties) {
      var properties0 = feature.properties,
          properties1 = {},
          empty = true;

      for (var key0 in properties0) {
        if (propertyTransform(properties1, key0, properties0[key0])) {
          empty = false;
        }
      }

      if (empty) delete feature.properties;
      else feature.properties = properties1;
    }
  }

  var transformObjectType = {
    Feature: transformFeature,
    FeatureCollection: function(collection) { collection.features.forEach(transformFeature); }
  };

  for (var key in objects) {
    transformObject(objects[key]);
  }

  return objects;
};

},{}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
module.exports = hasKeys

function hasKeys(source) {
    return source !== null &&
        (typeof source === "object" ||
        typeof source === "function")
}

},{}],52:[function(require,module,exports){
var Keys = require("object-keys")
var hasKeys = require("./has-keys")

module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        if (!hasKeys(source)) {
            continue
        }

        var keys = Keys(source)

        for (var j = 0; j < keys.length; j++) {
            var name = keys[j]
            target[name] = source[name]
        }
    }

    return target
}

},{"./has-keys":51,"object-keys":54}],53:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

var isFunction = function (fn) {
	var isFunc = (typeof fn === 'function' && !(fn instanceof RegExp)) || toString.call(fn) === '[object Function]';
	if (!isFunc && typeof window !== 'undefined') {
		isFunc = fn === window.setTimeout || fn === window.alert || fn === window.confirm || fn === window.prompt;
	}
	return isFunc;
};

module.exports = function forEach(obj, fn) {
	if (!isFunction(fn)) {
		throw new TypeError('iterator must be a function');
	}
	var i, k,
		isString = typeof obj === 'string',
		l = obj.length,
		context = arguments.length > 2 ? arguments[2] : null;
	if (l === +l) {
		for (i = 0; i < l; i++) {
			if (context === null) {
				fn(isString ? obj.charAt(i) : obj[i], i, obj);
			} else {
				fn.call(context, isString ? obj.charAt(i) : obj[i], i, obj);
			}
		}
	} else {
		for (k in obj) {
			if (hasOwn.call(obj, k)) {
				if (context === null) {
					fn(obj[k], k, obj);
				} else {
					fn.call(context, obj[k], k, obj);
				}
			}
		}
	}
};


},{}],54:[function(require,module,exports){
module.exports = Object.keys || require('./shim');


},{"./shim":56}],55:[function(require,module,exports){
var toString = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toString.call(value);
	var isArguments = str === '[object Arguments]';
	if (!isArguments) {
		isArguments = str !== '[object Array]'
			&& value !== null
			&& typeof value === 'object'
			&& typeof value.length === 'number'
			&& value.length >= 0
			&& toString.call(value.callee) === '[object Function]';
	}
	return isArguments;
};


},{}],56:[function(require,module,exports){
(function () {
	"use strict";

	// modified from https://github.com/kriskowal/es5-shim
	var has = Object.prototype.hasOwnProperty,
		toString = Object.prototype.toString,
		forEach = require('./foreach'),
		isArgs = require('./isArguments'),
		hasDontEnumBug = !({'toString': null}).propertyIsEnumerable('toString'),
		hasProtoEnumBug = (function () {}).propertyIsEnumerable('prototype'),
		dontEnums = [
			"toString",
			"toLocaleString",
			"valueOf",
			"hasOwnProperty",
			"isPrototypeOf",
			"propertyIsEnumerable",
			"constructor"
		],
		keysShim;

	keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object',
			isFunction = toString.call(object) === '[object Function]',
			isArguments = isArgs(object),
			theKeys = [];

		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError("Object.keys called on a non-object");
		}

		if (isArguments) {
			forEach(object, function (value) {
				theKeys.push(value);
			});
		} else {
			var name,
				skipProto = hasProtoEnumBug && isFunction;

			for (name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(name);
				}
			}
		}

		if (hasDontEnumBug) {
			var ctor = object.constructor,
				skipConstructor = ctor && ctor.prototype === object;

			forEach(dontEnums, function (dontEnum) {
				if (!(skipConstructor && dontEnum === 'constructor') && has.call(object, dontEnum)) {
					theKeys.push(dontEnum);
				}
			});
		}
		return theKeys;
	};

	module.exports = keysShim;
}());


},{"./foreach":53,"./isArguments":55}],57:[function(require,module,exports){
module.exports = function(hostname) {
    var production = (hostname === 'geojson.io');

    return {
        client_id: production ?
            '62c753fd0faf18392d85' :
            'bb7bbe70bd1f707125bc',
        gatekeeper_url: production ?
            'https://geojsonioauth.herokuapp.com' :
            'https://localhostauth.herokuapp.com'
    };
};

},{}],58:[function(require,module,exports){
var clone = require('clone');
    xtend = require('xtend');
    source = {
        gist: require('../source/gist'),
        github: require('../source/github')
    };

module.exports = function(context) {

    var _data = {
        map: {
            type: 'FeatureCollection',
            features: []
        },
        dirty: false,
        source: null,
        meta: null,
        type: 'local'
    };

    function mapFile(gist) {
        var f;
        var content;

        for (f in gist.files) {
            content = gist.files[f].content;
            if (f.indexOf('.geojson') !== -1 && content) {
                return {
                    name: f,
                    content: JSON.parse(content)
                };
            }
        }

        for (f in gist.files) {
            content = gist.files[f].content;
            if (f.indexOf('.json') !== -1 && content) {
                return {
                    name: f,
                    file: JSON.parse(content)
                };
            }
        }
    }

    var data = {};

    data.hasFeatures = function() {
        return !!(_data.map && _data.map.features && _data.map.features.length);
    };

    data.set = function(obj, src) {
        for (var k in obj) {
            _data[k] = (typeof obj[k] === 'object') ? clone(obj[k], false) : obj[k];
        }
        if (obj.dirty !== false) data.dirty = true;
        context.dispatch.change({
            obj: obj,
            source: src
        });
        return data;
    };

    data.mergeFeatures = function(features, src) {
        function coerceNum(feature) {
            var props = feature.properties,
                keys = Object.keys(props),
                length = keys.length;

            for (var i = 0; i < length; i++) {
                key = keys[i];
                value = props[key];
                feature.properties[key] = !isNaN(parseFloat(value)) &&
                    /^(?!0.)/.test(value) ? Number(value) : value;
            }

            return feature;
        }

        _data.map.features = (_data.map.features || []).concat(features.map(coerceNum));
        return data.set({ map: _data.map }, src);
    };

    data.get = function(k) {
        return _data[k];
    };

    data.all = function() {
        return clone(_data, false);
    };

    data.fetch = function(q, cb) {
        var type = q.id.split(':')[0];

        switch(type) {
            case 'gist':
                var id = q.id.split(':')[1].split('/')[1];

                source.gist.load(id, context, function(err, d) {
                    return cb(err, d);
                });

                break;
            case 'github':
                var url = q.id.split('/');
                var parts = {
                    user: url[0].split(':')[1],
                    repo: url[1],
                    branch: url[3],
                    path: (url.slice(4) || []).join('/')
                };

                source.github.load(parts, context, function(err, meta) {
                    return source.github.loadRaw(parts, context, function(err, raw) {
                        return cb(err, xtend(meta, { content: JSON.parse(raw) }));
                    });
                });

                break;
        }
    };

    data.parse = function(d, browser) {
        var login,
            repo,
            branch,
            path,
            chunked,
            file;

        if (d.files) d.type = 'gist';

        switch(d.type) {
            case 'blob':
                login = browser.path[1].login;
                repo = browser.path[2].name;
                branch = browser.path[3].name;
                path = [browser.path[4].path, d.path].join('/');

                data.set({
                    type: 'github',
                    source: d,
                    meta: {
                        login: login,
                        repo: repo,
                        branch: branch,
                        name: d.path
                    },
                    map: d.content,
                    path: path,
                    route: 'github:' + [
                        login,
                        repo,
                        'blob',
                        branch,
                        path
                    ].join('/'),
                    url: [
                        'https://github.com',
                        login,
                        repo,
                        'blob',
                        branch,
                        [path, d.path].join('/')
                    ].join('/')
                });
                break;
            case 'file':
                chunked = d.html_url.split('/');
                login = chunked[3];
                repo = chunked[4];
                branch = chunked[6];

                data.set({
                    type: 'github',
                    source: d,
                    meta: {
                        login: login,
                        repo: repo,
                        branch: branch,
                        name: d.name
                    },
                    map: d.content,
                    path: d.path,
                    route: 'github:' + [
                        login,
                        repo,
                        'blob',
                        branch,
                        d.path
                    ].join('/'),
                    url: d.html_url
                });
                break;
            case 'gist':
                login = (d.user && d.user.login) || 'anonymous';
                path = [login, d.id].join('/');
                file = mapFile(d);

                data.set({
                    type: 'gist',
                    source: d,
                    meta: {
                        login: login,
                        name: file && file.name
                    },
                    map: file && file.content,
                    path: path,
                    route: 'gist:' + path,
                    url: d.html_url
                });
                break;
        }
    };

    data.save = function(cb) {
        var type = context.data.get('type');
        if (source[type] && source[type].save) source[type].save(context, cb);
        else source.gist.save(context, cb);
    };

    return data;
};

},{"../source/gist":75,"../source/github":76,"clone":7,"xtend":52}],59:[function(require,module,exports){
var qs = require('../lib/querystring'),
    zoomextent = require('../lib/zoomextent'),
    flash = require('../ui/flash');

module.exports = function(context) {

    function success(err, d) {
        context.container.select('.map').classed('loading', false);

        var message,
            url = /(http:\/\/\S*)/g;

        if (err) {
            message = JSON.parse(err.responseText).message
                .replace(url, '<a href="$&">$&</a>');
            return flash(context.container, message);
        }

        context.data.parse(d);
        zoomextent(context);
    }

    return function(query) {
        if (!query.id && !query.data) return;

        var oldRoute = d3.event ? qs.stringQs(d3.event.oldURL.split('#')[1]).id :
            context.data.get('route');

        if (query.data) {
            context.container.select('.map').classed('loading', true);
            try {
                context.data.set({ map: JSON.parse(query.data.replace('data:application/json,', '')) });
                context.container.select('.map').classed('loading', false);
                location.hash = '';
                zoomextent(context);
            } catch(e) {
                return flash(context.container, 'Could not parse JSON');
            }
        } else if (query.id !== oldRoute) {
            context.container.select('.map').classed('loading', true);
            context.data.fetch(query, success);
        }
    };
};

},{"../lib/querystring":66,"../lib/zoomextent":70,"../ui/flash":81}],60:[function(require,module,exports){
var config = require('../config.js')(location.hostname);

module.exports = function(context) {
    var repo = {};

    repo.details = function(callback) {
        var cached = context.storage.get('github_repo_details'),
            meta = context.data.get('meta'),
            login = meta.login,
            repo = meta.repo;

        if (cached && cached.login === login && cached.repo === repo &&
            cached.when > (+new Date() - 1000 * 60 * 60)) {
            callback(null, cached.data);
        } else {
            context.storage.remove('github_repo_details');

            d3.json('https://api.github.com/repos/' + [login, repo].join('/'))
                .header('Authorization', 'token ' + context.storage.get('github_token'))
                .on('load', onload)
                .on('error', onerror)
                .get();
        }

        function onload(repo) {
            context.storage.set('github_repo_details', {
                when: +new Date(),
                data: repo
            });
            context.storage.set('github_repo', repo);
            callback(null, repo);
        }

        function onerror(err) {
            context.storage.remove('github_repo_details');
            callback(new Error(err));
        }
    };

    return repo;
};

},{"../config.js":57}],61:[function(require,module,exports){
var qs = require('../lib/querystring'),
    xtend = require('xtend');

module.exports = function(context) {
    var router = {};

    router.on = function() {
        d3.select(window).on('hashchange.router', route);
        context.dispatch.on('change.route', unroute);
        context.dispatch.route(getQuery());
        return router;
    };

    router.off = function() {
        d3.select(window).on('hashchange.router', null);
        return router;
    };

    function route() {
        var oldHash = d3.event.oldURL.split('#')[1] || '',
            newHash = d3.event.newURL.split('#')[1] || '',
            oldQuery = qs.stringQs(oldHash),
            newQuery = qs.stringQs(newHash);

        if (isOld(oldHash)) return upgrade(oldHash);
        if (newQuery.id !== oldQuery.id) context.dispatch.route(newQuery);
    }

    function isOld(id) {
        return (id.indexOf('gist') === 0 || id.indexOf('github') === 0 || !isNaN(parseInt(id, 10)));
    }

    function upgrade(id) {
        var split;
        if (isNaN(parseInt(id, 10))) {
            split = id.split(':');
            location.hash = '#id=' + (split[1].indexOf('/') === 0 ?
                [split[0], split[1].substring(1)].join(':') : id);
        } else {
            location.hash = '#id=gist:/' + id;
        }
    }

    function unroute() {
        var query = getQuery();
        var rev = reverseRoute();
        if (rev.id && query.id !== rev.id) {
            location.hash = '#' + qs.qsString(rev);
        }
    }

    function getQuery() {
        return qs.stringQs(window.location.hash.substring(1));
    }

    function reverseRoute() {
        var query = getQuery();

        return xtend(query, {
            id: context.data.get('route')
        });
    }

    return router;
};

},{"../lib/querystring":66,"xtend":52}],62:[function(require,module,exports){
var config = require('../config.js')(location.hostname);

module.exports = function(context) {
    var user = {};

    user.details = function(callback) {
        if (!context.storage.get('github_token')) return callback('not logged in');

        var cached = context.storage.get('github_user_details');

        if (cached && cached.when > (+new Date() - 1000 * 60 * 60)) {
            callback(null, cached.data);
        } else {
            context.storage.remove('github_user_details');

            d3.json('https://api.github.com/user')
                .header('Authorization', 'token ' + context.storage.get('github_token'))
                .on('load', onload)
                .on('error', onerror)
                .get();
        }

        function onload(user) {
            context.storage.set('github_user_details', {
                when: +new Date(),
                data: user
            });
            context.storage.set('github_user', user);
            callback(null, user);
        }

        function onerror() {
            user.logout();
            context.storage.remove('github_user_details');
            callback(new Error('not logged in'));
        }
    };

    user.signXHR = function(xhr) {
        return user.token() ?
            xhr.header('Authorization', 'token ' + user.token()) : xhr;
    };

    user.authenticate = function() {
        window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + config.client_id + '&scope=gist,public_repo';
    };

    user.token = function(callback) {
        return context.storage.get('github_token');
    };

    user.logout = function() {
        context.storage.remove('github_token');
    };

    user.login = function() {
        context.storage.remove('github_token');
    };

    function killTokenUrl() {
        if (window.location.href.indexOf('?code') !== -1) {
            window.location.href = window.location.href.replace(/\?code=.*$/, '');
        }
    }

    if (window.location.search && window.location.search.indexOf('?code') === 0) {
        var code = window.location.search.replace('?code=', '');
        d3.select('.map').classed('loading', true);
        d3.json(config.gatekeeper_url + '/authenticate/' + code)
            .on('load', function(l) {
                d3.select('.map').classed('loading', false);
                if (l.token) window.localStorage.github_token = l.token;
                killTokenUrl();
            })
            .on('error', function() {
                d3.select('.map').classed('loading', false);
                alert('Authentication with GitHub failed');
            })
            .get();
    }

    return user;
};

},{"../config.js":57}],63:[function(require,module,exports){
var qs = require('../lib/querystring');
require('leaflet-hash');

L.Hash.prototype.parseHash = function(hash) {
    var query = qs.stringQs(hash.substring(1));
    var map = query.map || '';
    var args = map.split('/');
	if (args.length == 3) {
		var zoom = parseInt(args[0], 10),
            lat = parseFloat(args[1]),
            lon = parseFloat(args[2]);
		if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
			return false;
		} else {
			return {
				center: new L.LatLng(lat, lon),
				zoom: zoom
			};
		}
	} else {
		return false;
	}
};

L.Hash.prototype.formatHash = function(map) {
    var query = qs.stringQs(location.hash.substring(1)),
	    center = map.getCenter(),
	    zoom = map.getZoom(),
	    precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

    query.map = [zoom,
		center.lat.toFixed(precision),
		center.lng.toFixed(precision)
	].join('/');

	return "#" + qs.qsString(query);
};

},{"../lib/querystring":66,"leaflet-hash":19}],64:[function(require,module,exports){
module.exports = function(context) {
    return function(e) {
        var sel = d3.select(e.popup._contentNode);

        sel.selectAll('.cancel')
            .on('click', clickClose);

        sel.selectAll('.save')
            .on('click', saveFeature);

        sel.selectAll('.add')
            .on('click', addRow);

        sel.selectAll('.delete-invert')
            .on('click', removeFeature);

        function clickClose() {
            context.map.closePopup(e.popup);
        }

        function removeFeature() {
            if (e.popup._source && context.mapLayer.hasLayer(e.popup._source)) {
                context.mapLayer.removeLayer(e.popup._source);
                context.data.set({map: context.mapLayer.toGeoJSON()}, 'popup');
            }
        }

        function losslessNumber(x) {
            var fl = parseFloat(x);
            if (fl.toString() === x) return fl;
            else return x;
        }

        function saveFeature() {
            var obj = {};
            sel.selectAll('tr').each(collectRow);
            function collectRow() {
                if (d3.select(this).selectAll('input')[0][0].value) {
                    obj[d3.select(this).selectAll('input')[0][0].value] =
                        losslessNumber(d3.select(this).selectAll('input')[0][1].value);
                }
            }
            e.popup._source.feature.properties = obj;
            context.data.set({map: context.mapLayer.toGeoJSON()}, 'popup');
            context.map.closePopup(e.popup);
        }

        function addRow() {
            var tr = sel.select('tbody')
                .append('tr');

            tr.append('th')
                .append('input')
                .attr('type', 'text');

            tr.append('td')
                .append('input')
                .attr('type', 'text');
        }
    };
};

},{}],65:[function(require,module,exports){
module.exports = function(elem, w, h) {
    var c = elem.appendChild(document.createElement('canvas'));

    c.width = w;
    c.height = h;

    var ctx = c.getContext('2d'),
        gap,
        fill = {
            success: '#e3e4b8',
            error: '#E0A990'
        };

    return function(e) {
        if (!gap) gap = ((e.done) / e.todo * w) - ((e.done - 1) / e.todo * w);
        ctx.fillStyle = fill[e.status];
        ctx.fillRect((e.done - 1) / e.todo * w, 0, gap, h);
    };
};

},{}],66:[function(require,module,exports){
module.exports.stringQs = function(str) {
    return str.split('&').reduce(function(obj, pair){
        var parts = pair.split('=');
        if (parts.length === 2) {
            obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
        }
        return obj;
    }, {});
};

module.exports.qsString = function(obj, noencode) {
    noencode = true;
    function softEncode(s) { return s.replace('&', '%26'); }
    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '=' + (
            noencode ? softEncode(obj[key]) : encodeURIComponent(obj[key]));
    }).join('&');
};

},{}],67:[function(require,module,exports){
var topojson = require('topojson'),
    toGeoJSON = require('togeojson'),
    csv2geojson = require('csv2geojson'),
    osm2geojson = require('osm-and-geojson').osm2geojson;

module.exports.readDrop = readDrop;
module.exports.readAsText = readAsText;
module.exports.readFile = readFile;

function readDrop(callback) {
    return function() {
        var results = [];
        var errors = [];
        var warnings = [];
        if (d3.event.dataTransfer && d3.event.dataTransfer &&
           d3.event.dataTransfer.files && d3.event.dataTransfer.files.length) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            var remaining = d3.event.dataTransfer.files.length;
            [].forEach.call(d3.event.dataTransfer.files, function(f) {
                readAsText(f, function(err, text) {
                    if (err) {
                        errors.push(err);
                        if (!--remaining) finish(errors, results);
                    } else {
                        readFile(f, text, function(err, res, war) {
                            if (err) errors.push(err);
                            if (res) results.push(res);
                            if (war) results.push(war);
                            if (!--remaining) finish(errors, results, war);
                        });
                    }
                });
            });
        } else {
            return callback({
                message: 'No files were dropped'
            });
        }

        function finish(errors, results, war) {
            // if no conversions suceeded, return the first error
            if (!results.length && errors.length) return callback(errors[0], null, war);
            // otherwise combine results
            return callback(null, {
                type: 'FeatureCollection',
                features: results.reduce(function(memo, r) {
                    if (r.features) memo = memo.concat(r.features);
                    else if (r.type === 'Feature') memo.push(r);
                    return memo;
                }, [])
            }, war);
        }
    };
}

function readAsText(f, callback) {
    try {
        var reader = new FileReader();
        reader.readAsText(f);
        reader.onload = function(e) {
            if (e.target && e.target.result) callback(null, e.target.result);
            else callback({
                message: 'Dropped file could not be loaded'
            });
        };
        reader.onerror = function(e) {
            callback({
                message: 'Dropped file was unreadable'
            });
        };
    } catch (e) {
        callback({
            message: 'Dropped file was unreadable'
        });
    }
}

function readFile(f, text, callback) {

    var fileType = detectType(f);

    if (!fileType) {
        return callback({
            message: 'Could not detect file type'
        });
    } else if (fileType === 'kml') {
        var kmldom = toDom(text);
        if (!kmldom) {
            return callback({
                message: 'Invalid KML file: not valid XML'
            });
        }
        var warning;
        if (kmldom.getElementsByTagName('NetworkLink').length) {
            warning = {
                message: 'The KML file you uploaded included NetworkLinks: some content may not display. ' +
                  'Please export and upload KML without NetworkLinks for optimal performance'
            };
        }
        callback(null, toGeoJSON.kml(kmldom), warning);
    } else if (fileType === 'xml') {
        var xmldom = toDom(text);
        if (!xmldom) {
            return callback({
                message: 'Invalid XML file: not valid XML'
            });
        }
        callback(null, osm2geojson(xmldom));
    } else if (fileType === 'gpx') {
        callback(null, toGeoJSON.gpx(toDom(text)));
    } else if (fileType === 'geojson') {
        try {
            gj = JSON.parse(text);
            if (gj && gj.type === 'Topology' && gj.objects) {
                var collection = { type: 'FeatureCollection', features: [] };
                for (var o in gj.objects) {
                    var ft = topojson.feature(gj, gj.objects[o]);
                    if (ft.features) collection.features = collection.features.concat(ft.features);
                    else collection.features = collection.features.concat([ft]);
                }
                return callback(null, collection);
            } else {
                return callback(null, gj);
            }
        } catch(err) {
            alert('Invalid JSON file: ' + err);
            return;
        }
    } else if (fileType === 'dsv') {
        csv2geojson.csv2geojson(text, {
            delimiter: 'auto'
        }, function(err, result) {
            if (err) {
                return callback({
                    type: 'geocode',
                    result: result,
                    raw: text
                });
            } else {
                return callback(null, result);
            }
        });
    }


    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    function detectType(f) {
        var filename = f.name ? f.name.toLowerCase() : '';
        function ext(_) {
            return filename.indexOf(_) !== -1;
        }
        if (f.type === 'application/vnd.google-earth.kml+xml' || ext('.kml')) {
            return 'kml';
        }
        if (ext('.gpx')) return 'gpx';
        if (ext('.geojson') || ext('.json') || ext('.topojson')) return 'geojson';
        if (f.type === 'text/csv' || ext('.csv') || ext('.tsv') || ext('.dsv')) {
            return 'dsv';
        }
        if (ext('.xml') || ext('.osm')) return 'xml';
    }
}

},{"csv2geojson":8,"osm-and-geojson":20,"togeojson":22,"topojson":"g070js"}],68:[function(require,module,exports){
module.exports = function(map, feature, bounds) {
    var zoomLevel;

    if (feature instanceof L.Marker) {
        zoomLevel = bounds.isValid() ? map.getBoundsZoom(bounds) + 2 : 10;
        map.setView(feature.getLatLng(), zoomLevel);
    } else if ('getBounds' in feature && feature.getBounds().isValid()) {
        map.fitBounds(feature.getBounds());
    }
};

},{}],69:[function(require,module,exports){
var geojsonhint = require('geojsonhint');

module.exports = function(callback) {
    return function(editor, changeObj) {

        var err = geojsonhint.hint(editor.getValue());
        editor.clearGutter('error');

        if (err instanceof Error) {
            handleError(err.message);
            return callback({
                'class': 'icon-circle-blank',
                title: 'invalid JSON',
                message: 'invalid JSON'});
        } else if (err.length) {
            handleErrors(err);
            return callback({
                'class': 'icon-circle-blank',
                title: 'invalid GeoJSON',
                message: 'invalid GeoJSON'});
        } else {
            var zoom = changeObj.from.ch === 0 &&
                changeObj.from.line === 0 &&
                changeObj.origin == 'paste';

            var gj = JSON.parse(editor.getValue());

            try {
                return callback(null, gj, zoom);
            } catch(e) {
                return callback({
                    'class': 'icon-circle-blank',
                    title: 'invalid GeoJSON',
                    message: 'invalid GeoJSON'});
            }
        }

        function handleError(msg) {
            var match = msg.match(/line (\d+)/);
            if (match && match[1]) {
                editor.clearGutter('error');
                editor.setGutterMarker(parseInt(match[1], 10) - 1, 'error', makeMarker(msg));
            }
        }

        function handleErrors(errors) {
            editor.clearGutter('error');
            errors.forEach(function(e) {
                editor.setGutterMarker(e.line, 'error', makeMarker(e.message));
            });
        }

        function makeMarker(msg) {
            return d3.select(document.createElement('div'))
                .attr('class', 'error-marker')
                .attr('message', msg).node();
        }
    };
};

},{"geojsonhint":14}],70:[function(require,module,exports){
module.exports = function(context) {
    var bounds = context.mapLayer.getBounds();
    if (bounds.isValid()) context.map.fitBounds(bounds);
};

},{}],71:[function(require,module,exports){
var ui = require('./ui'),
    map = require('./ui/map'),
    data = require('./core/data'),
    loader = require('./core/loader'),
    router = require('./core/router'),
    repo = require('./core/repo'),
    user = require('./core/user'),
    store = require('store');

var gjIO = geojsonIO(),
    gjUI = ui(gjIO).read;

d3.select('.geojsonio').call(gjUI);

gjIO.router.on();

function geojsonIO() {
    var context = {};
    context.dispatch = d3.dispatch('change', 'route');
    context.storage = store;
    context.map = map(context, true);
    context.data = data(context);
    context.dispatch.on('route', loader(context));
    context.repo = repo(context);
    context.router = router(context);
    context.user = user(context);
    return context;
}

},{"./core/data":58,"./core/loader":59,"./core/repo":60,"./core/router":61,"./core/user":62,"./ui":77,"./ui/map":85,"store":21}],72:[function(require,module,exports){
var fs = require('fs');

module.exports = function(context) {

    function render(selection) {
        var area = selection
            .html('')
            .append('div')
            .attr('class', 'pad2 prose')
            .html("<h2>Help</h2>\n\n<p>New here? <strong>geojson.io</strong> is a quick, simple tool for creating,\nviewing, and sharing maps. geojson.io is named after <a href='http://geojson.org/' target='_blank'>GeoJSON</a>,\nan open source data format, and it supports GeoJSON in all ways - but also\naccepts KML, GPX, CSV, TopoJSON, and other formats.</p>\n\n<p>Need extra help or see a bug? <a target='_blank' href='https://github.com/mapbox/geojson.io/issues?state=open'>Open an issue\n    on geojson.io's issue tracker.</a>\n\n<h3>I've got data</h3>\n\n<p>If you have data, like a KML, GeoJSON, or CSV file, just drag &amp; drop\nit onto the page or click 'Open' and 'Import' - your data should appear on\nthe map!</p>\n\n<h3>I want to draw features</h3>\n\n<p>Click the drawing tools on the left-hand side to draw points, polygons,\nlines and rectangles. After you're done drawing the shapes, you can add\ninformation to each feature by clicking on it, editing the feature's properties,\nand clicking 'Save'.</p>\n\n<p>Properties in GeoJSON are stored as 'key value pairs' - so, for instance,\nif you wanted to add a name to each feature, type 'name' in the first table\nfield, and the name of the feature in the second.</p>\n\n<h3>I want to use my map everywhere</h3>\n\n<p>You can share maps in quite a few ways! If you save your map here, the URL\nof this page will update and you can link send friends the link to share\nthe map, or you can click 'Download' to grab the raw GeoJSON data and use\nit in other software, like TileMill or Leaflet.</p>\n\n<h3>I'm a coder</h3>\n\n<p><a href='https://github.com/mapbox/geojson.io#goes-great-with' target='_blank'>geojson.io has an array of cli tools</a>\nthat make it easy to go from a GeoJSON file on your computer to geojson.io.\n\n<h3>Protips?</h3>\n\n<ul>\n    <li><strong>cmd+s</strong>: save map to github gists\n    <li><strong>cmd+a</strong>: download map as geojson\n    <li><strong>arrow keys</strong>: navigate the map\n</ul>\n\n<h3>Privacy &amp; License Issues</h3>\n\n<ul>\n    <li><strong>Clicking save</strong> by default saves to a private\n    GitHub Gist - so it will only be accessible to people you share the URL\n    with, and creating it won't appear in your GitHub timeline.\n    <li><strong>The data you create and modify in geojson.io</strong> doesn't\n    acquire any additional license: if it's secret and copyrighted, it will remain\n    that way - it doesn't have to be public or open source.\n</ul>\n");
    }

    render.off = function() {
    };

    return render;
};

},{"fs":2}],73:[function(require,module,exports){
var validate = require('../lib/validate'),
    zoomextent = require('../lib/zoomextent'),
    saver = require('../ui/saver.js');

module.exports = function(context) {

    CodeMirror.keyMap.tabSpace = {
        Tab: function(cm) {
            var spaces = new Array(cm.getOption('indentUnit') + 1).join(' ');
            cm.replaceSelection(spaces, 'end', '+input');
        },
        'Ctrl-S': saveAction,
        'Cmd-S': saveAction,
        fallthrough: ['default']
    };

    function saveAction() {
        saver(context);
        return false;
    }

    function render(selection) {
        var textarea = selection
            .html('')
            .append('textarea');

        var editor = CodeMirror.fromTextArea(textarea.node(), {
            mode: 'application/json',
            matchBrackets: true,
            tabSize: 2,
            gutters: ['error'],
            theme: 'eclipse',
            autofocus: (window === window.top),
            keyMap: 'tabSpace',
            lineNumbers: true
        });

        editor.on('change', validate(changeValidated));

        function changeValidated(err, data, zoom) {
            if (!err) {
              context.data.set({map: data}, 'json');
              if (zoom) zoomextent(context);
            }
        }

        context.dispatch.on('change.json', function(event) {
            if (event.source !== 'json') {
                editor.setValue(JSON.stringify(context.data.get('map'), null, 2));
            }
        });

        editor.setValue(JSON.stringify(context.data.get('map'), null, 2));
    }

    render.off = function() {
        context.dispatch.on('change.json', null);
    };

    return render;
};

},{"../lib/validate":69,"../lib/zoomextent":70,"../ui/saver.js":88}],74:[function(require,module,exports){
var metatable = require('d3-metatable')(d3),
    smartZoom = require('../lib/smartzoom.js');

module.exports = function(context) {
    function render(selection) {

        selection.html('');

        function rerender() {
            var geojson = context.data.get('map');
            var props;

            if (!geojson || !geojson.geometry && 
                (!geojson.features || !geojson.features.length)) {
                selection
                    .html('')
                    .append('div')
                    .attr('class', 'blank-banner center')
                    .text('no features');
            } else {
                props = geojson.geometry ? [geojson.properties] :
                    geojson.features.map(getProperties);
                selection.select('.blank-banner').remove();
                selection
                    .data([props])
                    .call(metatable()
                        .on('change', function(row, i) {
                            var geojson = context.data.get('map');
                            if (geojson.geometry) {
                                geojson.properties = row;
                            } else {
                                geojson.features[i].properties = row;
                            }
                            context.data.set('map', geojson);
                        })
                        .on('rowfocus', function(row, i) {
                            var bounds = context.mapLayer.getBounds();
                            var j = 0;
                            context.mapLayer.eachLayer(function(l) {
                                if (i === j++) smartZoom(context.map, l, bounds);
                            });
                        })
                    );
            }

        }

        context.dispatch.on('change.table', function(evt) {
            rerender();
        });

        rerender();

        function getProperties(f) { return f.properties; }

        function zoomToMap(p) {
            var layer;
            layers.eachLayer(function(l) {
                if (p == l.feature.properties) layer = l;
            });
            return layer;
        }
    }

    render.off = function() {
        context.dispatch.on('change.table', null);
    };

    return render;
};

},{"../lib/smartzoom.js":68,"d3-metatable":11}],75:[function(require,module,exports){
var fs = require('fs'),
    tmpl = "<!DOCTYPE html>\n<html>\n<head>\n  <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' />\n  <style>\n  body { margin:0; padding:0; }\n  #map { position:absolute; top:0; bottom:0; width:100%; }\n  .marker-properties {\n    border-collapse:collapse;\n    font-size:11px;\n    border:1px solid #eee;\n    margin:0;\n}\n.marker-properties th {\n    white-space:nowrap;\n    border:1px solid #eee;\n    padding:5px 10px;\n}\n.marker-properties td {\n    border:1px solid #eee;\n    padding:5px 10px;\n}\n.marker-properties tr:last-child td,\n.marker-properties tr:last-child th {\n    border-bottom:none;\n}\n.marker-properties tr:nth-child(even) th,\n.marker-properties tr:nth-child(even) td {\n    background-color:#f7f7f7;\n}\n  </style>\n  <script src='//api.tiles.mapbox.com/mapbox.js/v1.3.1/mapbox.js'></script>\n  <script src=\"//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js\" ></script>\n  <link href='//api.tiles.mapbox.com/mapbox.js/v1.3.1/mapbox.css' rel='stylesheet' />\n  <!--[if lte IE 8]>\n    <link href='//api.tiles.mapbox.com/mapbox.js/v1.3.1/mapbox.ie.css' rel='stylesheet' >\n  <![endif]-->\n</head>\n<body>\n<div id='map'></div>\n<script type='text/javascript'>\nvar map = L.mapbox.map('map');\n\nL.mapbox.tileLayer('tmcw.map-ajwqaq7t', {\n    retinaVersion: 'tmcw.map-u8vb5w83',\n    detectRetina: true\n}).addTo(map);\n\nmap.attributionControl.addAttribution('<a href=\"http://geojson.io/\">geojson.io</a>');\n$.getJSON('map.geojson', function(geojson) {\n    var geojsonLayer = L.geoJson(geojson).addTo(map);\n    map.fitBounds(geojsonLayer.getBounds());\n    geojsonLayer.eachLayer(function(l) {\n        showProperties(l);\n    });\n});\nfunction showProperties(l) {\n    var properties = l.toGeoJSON().properties, table = '';\n    for (var key in properties) {\n        table += '<tr><th>' + key + '</th>' +\n            '<td>' + properties[key] + '</td></tr>';\n    }\n    if (table) l.bindPopup('<table class=\"marker-properties display\">' + table + '</table>');\n}\n</script>\n</body>\n</html>\n";

module.exports.save = save;
module.exports.saveBlocks = saveBlocks;
module.exports.load = load;

function saveBlocks(content, callback) {
    var endpoint = 'https://api.github.com/gists';

    d3.json(endpoint)
        .on('load', function(data) {
            callback(null, data);
        })
        .on('error', function(err) {
            var message,
                url = /(http:\/\/\S*)/g;

            message = JSON.parse(err.responseText).message
                .replace(url, '<a href="$&">$&</a>');

            callback(message);
        })
        .send('POST', JSON.stringify({
            description: 'via:geojson.io',
            public: false,
            files: {
                'index.html': { content: tmpl },
                'map.geojson': { content: content }
            }
        }));
}

function save(context, callback) {

    var source = context.data.get('source'),
        meta = context.data.get('meta'),
        name = (meta && meta.name) || 'map.geojson',
        map = context.data.get('map');

    var description = (source && source.description) || 'via:geojson.io',
        public = source ? !!source.public : false;

    context.user.details(onuser);

    function onuser(err, user) {
        var endpoint,
            method = 'POST',
            source = context.data.get('source'),
            files = {};

        if (!err && user && user.login && meta && meta.login && user.login === meta.login) {
            endpoint = 'https://api.github.com/gists/' + source.id;
            method = 'PATCH';
        } else if (!err && source && source.id) {
            endpoint = 'https://api.github.com/gists/' + source.id + '/forks';
        } else {
            endpoint = 'https://api.github.com/gists';
        }

        files[name] = {
            content: JSON.stringify(map, null, 2)
        };

        context.user.signXHR(d3.json(endpoint))
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(err) {
                var message,
                    url = /(http:\/\/\S*)/g;

                message = JSON.parse(err.responseText).message
                    .replace(url, '<a href="$&">$&</a>');

                callback(message);
            })
            .send(method, JSON.stringify({
                files: files
            }));
    }
}

function load(id, context, callback) {
    context.user.signXHR(d3.json('https://api.github.com/gists/' + id))
        .on('load', onLoad)
        .on('error', onError)
        .get();

    function onLoad(json) { callback(null, json); }
    function onError(err) { callback(err, null); }
}

},{"fs":2}],76:[function(require,module,exports){
module.exports.save = save;
module.exports.load = load;
module.exports.loadRaw = loadRaw;

function save(context, callback) {
    var source = context.data.get('source'),
        meta = context.data.get('meta'),
        name = (meta && meta.name) || 'map.geojson',
        map = context.data.get('map');

    if (navigator.appVersion.indexOf('MSIE 9') !== -1 || !window.XMLHttpRequest) {
        return alert('Sorry, saving and sharing is not supported in IE9 and lower. ' +
            'Please use a modern browser to enjoy the full featureset of geojson.io');
    }

    if (!localStorage.github_token) {
        return alert('You need to log in with GitHub to commit changes');
    }

    context.repo.details(onrepo);

    function onrepo(err, repo) {
        var commitMessage,
            endpoint,
            method = 'POST',
            files = {};

        if (!err && repo.permissions.push) {
            commitMessage = context.commitMessage || prompt('Commit message:');
            if (!commitMessage) return;

            endpoint = source.url;
            method = 'PUT';
            data = {
                message: commitMessage,
                sha: source.sha,
                branch: meta.branch,
                content: Base64.toBase64(JSON.stringify(map, null, 2))
            };
        } else {
            endpoint = 'https://api.github.com/gists';
            files[name] = { content: JSON.stringify(map, null, 2) };
            data = { files: files };
        }

        context.user.signXHR(d3.json(endpoint))
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(err) {
                var message,
                    url = /(http:\/\/\S*)/g;

                message = JSON.parse(err.responseText).message
                    .replace(url, '<a href="$&">$&</a>');

                callback(message);
            })
            .send(method, JSON.stringify(data));
    }
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

function load(parts, context, callback) {
    context.user.signXHR(d3.json(fileUrl(parts)))
        .on('load', onLoad)
        .on('error', onError)
        .get();

    function onLoad(file) {
        callback(null, file);
    }
    function onError(err) { callback(err, null); }
}

function loadRaw(parts, context, callback) {
    context.user.signXHR(d3.text(fileUrl(parts)))
        .on('load', onLoad)
        .on('error', onError)
        .header('Accept', 'application/vnd.github.raw')
        .get();

    function onLoad(file) {
        callback(null, file);
    }
    function onError(err) { callback(err, null); }
}

function fileUrl(parts) {
    return 'https://api.github.com/repos/' +
        parts.user +
        '/' + parts.repo +
        '/contents/' + parts.path +
        '?ref=' + parts.branch;
}

},{}],77:[function(require,module,exports){
var buttons = require('./ui/mode_buttons'),
    file_bar = require('./ui/file_bar'),
    dnd = require('./ui/dnd'),
    userUi = require('./ui/user'),
    layer_switch = require('./ui/layer_switch');

module.exports = ui;

function ui(context) {
    function init(selection) {

        var container = selection
            .append('div')
            .attr('class', 'container');

        var map = container
            .append('div')
            .attr('class', 'map')
            .call(context.map)
            .call(layer_switch(context));

        context.container = container;

        return container;
    }

    function render(selection) {

        var container = init(selection);

        var right = container
            .append('div')
            .attr('class', 'right');

        var top = right
            .append('div')
            .attr('class', 'top');

        top
            .append('button')
            .attr('class', 'collapse-button')
            .attr('title', 'Collapse')
            .on('click', function collapse() {
                d3.select('body').classed('fullscreen',
                    !d3.select('body').classed('fullscreen'));
                var full = d3.select('body').classed('fullscreen');
                d3.select(this)
                    .select('.icon')
                    .classed('icon-caret-up', !full)
                    .classed('icon-caret-down', full);
                context.map.invalidateSize();
            })
            .append('class', 'span')
            .attr('class', 'icon icon-caret-up');

        var pane = right
            .append('div')
            .attr('class', 'pane');

        top
            .append('div')
            .attr('class', 'user fr pad1 deemphasize')
            .call(userUi(context));

        top
            .append('div')
            .attr('class', 'buttons')
            .call(buttons(context, pane));

        container
            .append('div')
            .attr('class', 'file-bar')
            .call(file_bar(context));

        dnd(context);
    }


    return {
        read: init,
        write: render
    };
}

},{"./ui/dnd":79,"./ui/file_bar":80,"./ui/layer_switch":84,"./ui/mode_buttons":87,"./ui/user":91}],78:[function(require,module,exports){
var github = require('../source/github');

module.exports = commit;

function commit(context, callback) {
    context.container.select('.share').remove();
    context.container.select('.tooltip.in')
      .classed('in', false);

    var wrap = context.container.append('div')
        .attr('class', 'share pad1 center')
        .style('z-index', 10);

    var form = wrap.append('form')
        .on('submit', function() {
            d3.event.preventDefault();
            context.commitMessage = message.property('value');
            if (typeof callback === 'function') callback();
        });

    var message = form.append('input')
        .attr('placeholder', 'Commit message')
        .attr('type', 'text');

    var commitButton = form.append('input')
        .attr('type', 'submit')
        .property('value', 'Commit Changes')
        .attr('class', 'semimajor');

    message.node().focus();

    return wrap;
}

},{"../source/github":76}],79:[function(require,module,exports){
var readDrop = require('../lib/readfile.js').readDrop,
    geocoder = require('./geocode.js'),
    flash = require('./flash.js'),
    zoomextent = require('../lib/zoomextent');

module.exports = function(context) {
    d3.select('body')
        .attr('dropzone', 'copy')
        .on('drop.import', readDrop(function(err, gj, warning) {
            if (err && err.message) {
                flash(context.container, err.message)
                    .classed('error', 'true');
            }
            if (err && err.type === 'geocode') {
                context.container.select('.icon-folder-open-alt')
                    .trigger('click');
                flash(context.container, 'This file requires geocoding. Click Import to geocode it')
                    .classed('error', 'true');
            } else if (gj && gj.features) {
                context.data.mergeFeatures(gj.features);
                if (warning) {
                    flash(context.container, warning.message);
                } else {
                    flash(context.container, 'Imported ' + gj.features.length + ' features.')
                        .classed('success', 'true');
                }
                zoomextent(context);
            }
            d3.select('body').classed('dragover', false);
        }))
        .on('dragenter.import', over)
        .on('dragleave.import', exit)
        .on('dragover.import', over);

   function over() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        d3.select('body').classed('dragover', true);
    }

    function exit() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
        d3.select('body').classed('dragover', false);
    }
};

},{"../lib/readfile.js":67,"../lib/zoomextent":70,"./flash.js":81,"./geocode.js":82}],80:[function(require,module,exports){
var share = require('./share'),
    clone = require('clone'),
    topojson = require('topojson'),
    sourcepanel = require('./source.js'),
    saveAs = require('filesaver.js'),
    saver = require('../ui/saver.js');

module.exports = function fileBar(context) {

    function bar(selection) {

        var name = selection.append('div')
            .attr('class', 'name');

        var filetype = name.append('a')
            .attr('target', '_blank')
            .attr('class', 'icon-file-alt');

        var filename = name.append('span')
            .attr('class', 'filename')
            .text('unsaved');

        var actions = [{
            title: 'Save',
            icon: 'icon-save',
            action: saveAction
        }, {
            title: 'Open',
            icon: 'icon-folder-open-alt',
            action: function() {
                context.container.call(sourcepanel(context));
            }
        }, {
            title: 'New',
            icon: 'icon-plus',
            action: function() {
                window.open('/#new');
            }
        }, {
            title: 'Download',
            icon: 'icon-download',
            action: function() {
                download();
            }
        }, {
            title: 'Share',
            icon: 'icon-share-alt',
            action: function() {
                context.container.call(share(context));
            }
        }];

        function saveAction() {
            if (d3.event) d3.event.preventDefault();
            saver(context);
        }

        function download() {
            if (d3.event) d3.event.preventDefault();
            if (d3.event.shiftKey) return downloadTopo();

            var content = JSON.stringify(context.data.get('map'), null, 2);
            var meta = context.data.get('meta');
            saveAs(new Blob([content], {
                type: 'text/plain;charset=utf-8'
            }), (meta && meta.name) || 'map.geojson');
        }

        function downloadTopo() {
            var content = JSON.stringify(topojson.topology({
                collection: clone(context.data.get('map'))
            }, {'property-transform': allProperties}));

            saveAs(new Blob([content], {
                type: 'text/plain;charset=utf-8'
            }), 'map.topojson');
        }

        function allProperties(properties, key, value) {
            properties[key] = value;
            return true;
        }

        function sourceIcon(type) {
            if (type == 'github') return 'icon-github';
            else if (type == 'gist') return 'icon-github-alt';
            else return 'icon-file-alt';
        }

        function saveNoun(_) {
            buttons.filter(function(b) {
                return b.title === 'Save';
            }).select('span.title').text(_);
        }

        var buttons = selection.append('div')
            .attr('class', 'fr')
            .selectAll('button')
            .data(actions)
            .enter()
            .append('button')
            .on('click', function(d) {
                d.action.apply(this, d);
            })
            .attr('data-original-title', function(d) {
                return d.title;
            })
            .attr('class', function(d) {
                return d.icon + ' icon sq40';
            })
            .call(bootstrap.tooltip().placement('bottom'));

        context.dispatch.on('change.filebar', onchange);

        function onchange(d) {
            var data = d.obj,
                type = data.type,
                path = data.path;
            filename
                .text(path ? path : 'unsaved')
                .classed('deemphasize', context.data.dirty);
            filetype
                .attr('href', data.url)
                .attr('class', sourceIcon(type));
            saveNoun(type == 'github' ? 'Commit' : 'Save');
        }

        d3.select(document).call(
            d3.keybinding('file_bar')
                .on('⌘+a', download)
                .on('⌘+s', saveAction));
    }

    return bar;
};

},{"../ui/saver.js":88,"./share":89,"./source.js":90,"clone":7,"filesaver.js":13,"topojson":"g070js"}],81:[function(require,module,exports){
var message = require('./message');

module.exports = flash;

function flash(selection, txt) {
    'use strict';

    var msg = message(selection);

    if (txt) msg.select('.content').html(txt);

    setTimeout(function() {
        msg
            .transition()
            .style('opacity', 0)
            .remove();
    }, 5000);

    return msg;
}

},{"./message":86}],82:[function(require,module,exports){
var progressChart = require('../lib/progress_chart'),
    csv2geojson = require('csv2geojson');

module.exports = function(context) {
    return function(container, text) {

        var list = csv2geojson.auto(text);

        var button = container.append('div')
            .attr('class', 'bucket-actions')
            .append('button')
            .attr('class', 'major')
            .attr('disabled', true)
            .text('At least one field required to geocode');

        var join = container.append('div')
            .attr('class', 'bucket-deposit')
            .append('div')
            .attr('class', 'bucket-join');

        var buckets = join.selectAll('.bucket')
            .data(['City', 'State', 'ZIP', 'Country'])
            .enter()
            .append('div')
            .attr('class', 'bucket')
            .text(String);

        var example = container.append('div')
            .attr('class', 'example');

        var store = container.append('div')
           .attr('class', 'bucket-store');

        var sources = store.selectAll('bucket-source')
           .data(Object.keys(list[0]))
           .enter()
           .append('div')
           .attr('class', 'bucket-source')
           .text(String);

        function showExample(fields) {
            var i = 0;
            return function() {
                if (++i > list.length) i = 0;
                example.html('');
                example.text(transformRow(fields)(list[i]));
            };
        }

        var ti;
        var broker = bucket();
        buckets.call(broker.deposit());
        sources.call(broker.store().on('chosen', onChosen));

        function onChosen(fields) {
             if (ti) window.clearInterval(ti);
             if (fields.length) {
                 button.attr('disabled', null)
                    .text('Geocode');
                 button.on('click', function() {
                     runGeocode(container, list, transformRow(fields), context);
                 });
                 var se = showExample(fields);
                 se();
                 ti = window.setInterval(se, 2000);
             } else {
                 button.attr('disabled', true)
                    .text('At least one field required to geocode');
                 example.text('');
             }
         }
    };
};

function runGeocode(container, list, transform, context) {
    container.html('');

    var wrap = container
        .append('div')
        .attr('class', 'pad1');

    var doneBtn = wrap.append('div')
        .attr('class', 'pad1 center')
        .append('button')
        .attr('class', 'major')
        .text('Close')
        .on('click', function() {
            container.html('');
            if (task) task();
        });

    var chartDiv = wrap.append('div'),
        failedDiv = wrap.append('div'),
        geocode = geocodemany('tmcw.map-u4ca5hnt');

    var chart = progressChart(chartDiv.node(), chartDiv.node().offsetWidth, 50),
        task = geocode(list, transform, progress, done);

    function progress(e) {
        chart(e);
    }

    function done(failed, completed) {

        failedDiv
            .selectAll('pre')
            .data(failed)
            .enter()
            .append('pre')
            .text(failedMessage);

        function failedMessage(d) {
            return 'failed: ' + transform(d.data) + ' / ' + printObj(d.data);
        }

        csv2geojson.csv2geojson(completed, function(err, result) {
            if (result.features) {
                context.data.mergeFeatures(result.features);
            }
        });
    }
}

function transformRow(fields) {
    return function(obj) {
       return d3.entries(obj)
           .filter(function(_) { return fields.indexOf(_.key) !== -1; })
           .map(function(_) { return _.value; })
           .join(', ');
    };
}

function printObj(o) {
    return '(' + d3.entries(o)
        .map(function(_) { return _.key + ': ' + _.value; }).join(',') + ')';
}

},{"../lib/progress_chart":65,"csv2geojson":8}],83:[function(require,module,exports){
var importSupport = !!(window.FileReader),
    flash = require('./flash.js'),
    geocode = require('./geocode.js'),
    readFile = require('../lib/readfile.js'),
    zoomextent = require('../lib/zoomextent');

module.exports = function(context) {
    return function(selection) {
        selection.html('');

        var wrap = selection
            .append('div')
            .attr('class', 'pad1');

        wrap.append('div')
            .attr('class', 'modal-message')
            .text('Drop files to map!');

        if (importSupport) {

            var import_landing = wrap.append('div')
                .attr('class', 'pad fillL');

            var message = import_landing
                .append('div')
                .attr('class', 'center');

            var button = message.append('button')
                .on('click', function() {
                    fileInput.node().click();
                });
            button.append('span').attr('class', 'icon-arrow-down');
            button.append('span').text(' Import');
            message.append('p')
                .attr('class', 'deemphasize')
                .append('small')
                .text('GeoJSON, TopoJSON, KML, CSV, GPX and OSM XML supported. You can also drag & drop files.');

            var fileInput = message
                .append('input')
                .attr('type', 'file')
                .style('visibility', 'hidden')
                .style('position', 'absolute')
                .style('height', '0')
                .on('change', function() {
                    var files = this.files;
                    if (!(files && files[0])) return;
                    readFile.readAsText(files[0], function(err, text) {
                        readFile.readFile(files[0], text, onImport);
                    });
                });
        } else {
            wrap.append('p')
                .attr('class', 'blank-banner center')
                .text('Sorry, geojson.io supports importing GeoJSON, TopoJSON, KML, CSV, GPX, and OSM XML files, but ' +
                      'your browser isn\'t compatible. Please use Google Chrome, Safari 6, IE10, Firefox, or Opera for an optimal experience.');
        }

        function onImport(err, gj, warning) {
            if (err) {
                if (err.type === 'geocode') {
                    wrap.call(geocode(context), err.raw);
                } else if (err.message) {
                    flash(context.container, err.message)
                        .classed('error', 'true');
                }
            } else if (gj && gj.features) {
                context.data.mergeFeatures(gj.features);
                if (warning) {
                    flash(context.container, warning.message);
                } else {
                    flash(context.container, 'Imported ' + gj.features.length + ' features.')
                        .classed('success', 'true');
                }
                zoomextent(context);
            }
        }

        wrap.append('p')
            .attr('class', 'intro center deemphasize')
            .html('This is an open source project. <a target="_blank" href="http://tmcw.wufoo.com/forms/z7x4m1/">Submit feedback or get help</a>, and <a target="_blank" href="http://github.com/mapbox/geojson.io"><span class="icon-github"></span> fork on GitHub</a>');

        wrap.append('div')
            .attr('class', 'pad1');
    };
};

},{"../lib/readfile.js":67,"../lib/zoomextent":70,"./flash.js":81,"./geocode.js":82}],84:[function(require,module,exports){
module.exports = function(context) {

    return function(selection) {

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

        var layerSwap = function(d) {
            var clicked = this instanceof d3.selection ? this.node() : this;
            layerButtons.classed('active', function() {
                return clicked === this;
            });
            layers.forEach(swap);
            function swap(l) {
                var datum = d instanceof d3.selection ? d.datum() : d;
                if (l.layer == datum.layer) context.map.addLayer(datum.layer);
                else if (context.map.hasLayer(l.layer)) context.map.removeLayer(l.layer);
            }
        };
        
        var layerButtons = selection.append('div')
            .attr('class', 'layer-switch')
            .selectAll('button')
            .data(layers)
            .enter()
            .append('button')
            .attr('class', 'pad0')
            .on('click', layerSwap)
            .text(function(d) { return d.title; });

        layerButtons.filter(function(d, i) { return i === 0; }).call(layerSwap);

    };
};


},{}],85:[function(require,module,exports){
var popup = require('../lib/popup'),
    customHash = require('../lib/custom_hash.js'),
    qs = require('../lib/querystring.js');
    writable = false;


module.exports = function(context, readonly) {

    writable = !readonly;

    function map(selection) {

        context.map = L.mapbox.map(selection.node())
            .setView([20, 0], 2)
            .addControl(L.mapbox.geocoderControl('tmcw.map-u4ca5hnt'));

        L.hash(context.map);

        context.mapLayer = L.featureGroup().addTo(context.map);

        if (writable) {
          context.drawControl = new L.Control.Draw({
              edit: { featureGroup: context.mapLayer },
              draw: {
                  circle: false,
                  polyline: { metric: navigator.language !== 'en-US' },
                  polygon: { metric: navigator.language !== 'en-US' },
                  marker: {
                      icon: L.mapbox.marker.icon({})
                  }
              }
          }).addTo(context.map);

          context.map
            .on('draw:edited', update)
            .on('draw:deleted', update);
        }

        context.map
            .on('draw:created', created)
            .on('popupopen', popup(context));

        context.map.attributionControl.addAttribution('<a target="_blank" href="http://tmcw.wufoo.com/forms/z7x4m1/">Feedback</a>');
        context.map.attributionControl.addAttribution('<a target="_blank" href="https://github.com/mapbox/geojson.io/blob/gh-pages/CHANGELOG.md">Changelog</a>');
        context.map.attributionControl.addAttribution('<a target="_blank" href="http://geojson.io/about.html">About</a>');

        function update() {
            geojsonToLayer(context.mapLayer.toGeoJSON(), context.mapLayer);
            context.data.set({map: layerToGeoJSON(context.mapLayer)}, 'map');
        }

        context.dispatch.on('change.map', function() {
            geojsonToLayer(context.data.get('map'), context.mapLayer);
        });

        function created(e) {
            context.mapLayer.addLayer(e.layer);
            update();
        }
    }

    function layerToGeoJSON(layer) {
        var features = [];
        layer.eachLayer(collect);
        function collect(l) { if ('toGeoJSON' in l) features.push(l.toGeoJSON()); }
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    return map;
};

function geojsonToLayer(geojson, layer) {
    layer.clearLayers();
    L.geoJson(geojson, {
        pointToLayer: L.mapbox.marker.style
    }).eachLayer(add);
    function add(l) {
        bindPopup(l);
        l.addTo(layer);
    }
}

function bindPopup(l) {

    var properties = l.toGeoJSON().properties, table = '';

    if (!properties) return;

    if (!Object.keys(properties).length) properties = { '': '' };

    for (var key in properties) {
        table += '<tr><th><input type="text" value="' + key + '"' + (!writable ? ' readonly' : '') + ' /></th>' +
            '<td><input type="text" value="' + properties[key] + '"' + (!writable ? ' readonly' : '') + ' /></td></tr>';
    }

    var content = '<div class="clearfix">' +
        '<div class="marker-properties-limit"><table class="marker-properties">' + table + '</table></div>' +
        (writable ? '<br /><div class="clearfix col12">' +
            '<div class="buttons-joined fl"><button class="add major">add row</button> ' +
            '<button class="save major">save</button> ' +
            '<button class="major cancel">cancel</button></div>' +
            '<div class="fr clear-buttons"><button class="delete-invert"><span class="icon-remove-sign"></span> remove</button></div></div>' : '') +
        '</div>';

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent(content));
}

},{"../lib/custom_hash.js":63,"../lib/popup":64,"../lib/querystring.js":66}],86:[function(require,module,exports){
module.exports = message;

function message(selection) {
    'use strict';

    selection.select('div.message').remove();

    var sel = selection.append('div')
        .attr('class', 'message pad1');

    sel.append('a')
        .attr('class', 'icon-remove fr')
        .on('click', function() {
            sel.remove();
        });

    sel.append('div')
        .attr('class', 'content');

    sel
        .style('opacity', 0)
        .transition()
        .duration(200)
        .style('opacity', 1);

    sel.close = function() {
        sel
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();
        sel
            .transition()
            .duration(200)
            .style('top', '0px');
    };

    return sel;
}

},{}],87:[function(require,module,exports){
var table = require('../panel/table'),
    json = require('../panel/json'),
    help = require('../panel/help');

module.exports = function(context, pane) {
    return function(selection) {

        var mode = null;

        var buttonData = [{
            icon: 'table',
            title: ' Table',
            alt: 'Edit feature properties in a table',
            behavior: table
        }, {
            icon: 'code',
            title: ' JSON',
            alt: 'JSON Source',
            behavior: json
        }, {
            icon: 'question',
            title: ' Help',
            alt: 'Help',
            behavior: help
        }];

        var buttons = selection
            .selectAll('button')
            .data(buttonData, function(d) { return d.icon; });

        var enter = buttons.enter()
            .append('button')
            .attr('title', function(d) { return d.alt; })
            .on('click', buttonClick);
        enter.append('span')
            .attr('class', function(d) { return 'icon-' + d.icon; });
        enter
            .append('span')
            .text(function(d) { return d.title; });

        d3.select(buttons.node()).trigger('click');

        function buttonClick(d) {
            buttons.classed('active', function(_) { return d.icon == _.icon; });
            if (mode) mode.off();
            mode = d.behavior(context);
            pane.call(mode);
        }
    };
};

},{"../panel/help":72,"../panel/json":73,"../panel/table":74}],88:[function(require,module,exports){
var commit = require('./commit');
var flash = require('./flash');

module.exports = function(context) {
    if (d3.event) d3.event.preventDefault();

    function success(err, res) {
        if (err) return flash(context.container, err.toString());

        var message,
          url,
          path,
          commitMessage;

        if (!!res.files) {
            // Saved as Gist
            message = 'Changes to this map saved to Gist: ';
            url = res.html_url;
            path = res.id;
        } else {
            // Committed to GitHub
            message = 'Changes committed to GitHub: ';
            url = res.commit.html_url;
            path = res.commit.sha.substring(0,10);
        }

        flash(context.container, message + '<a href="' + url + '">' + path + '</a>');

        context.container.select('.map').classed('loading', false);
        context.data.parse(res);
    }

    var meta = context.data.get('meta'),
        map = context.data.get('map'),
        features = map && map.geometry || (map.features && map.features.length),
        type = context.data.get('type');

    if (!features) {
        return flash(context.container, 'Add a feature to the map to save it');
    }

    context.container.select('.map').classed('loading', true);

    if (type === 'github') {
        context.repo.details(onrepo);
    } else {
        context.data.save(success);
    }

    function onrepo(err, repo) {
        if (!err && repo.permissions.push) {
            var wrap = commit(context, function() {
                wrap.remove();
                context.data.save(success);
            });
        } else {
            context.data.save(success);
        }
    }
};

},{"./commit":78,"./flash":81}],89:[function(require,module,exports){
var gist = require('../source/gist');

module.exports = share;

function facebookUrl(_) {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(_);
}

function twitterUrl(_) {
    return 'https://twitter.com/intent/tweet?source=webclient&text=' + encodeURIComponent(_);
}

function emailUrl(_) {
    return 'mailto:?subject=' + encodeURIComponent('My Map on geojson.io') + '&body=Here\'s the link: ' + encodeURIComponent(_);
}

function share(context) {
    return function(selection) {

        selection.select('.share').remove();
        selection.select('.tooltip.in')
          .classed('in', false);

        var sel = selection.append('div')
            .attr('class', 'share pad1');

        var networks = [{
            icon: 'icon-facebook',
            title: 'Facebook',
            url: facebookUrl(location.href)
        }, {
            icon: 'icon-twitter',
            title: 'Twitter',
            url: twitterUrl(location.href)
        }, {
            icon: 'icon-envelope-alt',
            title: 'Email',
            url: emailUrl(location.href)
        }];

        var links = sel
            .selectAll('.network')
            .data(networks)
            .enter()
            .append('a')
            .attr('target', '_blank')
            .attr('class', 'network')
            .attr('href', function(d) { return d.url; });

        links.append('span')
            .attr('class', function(d) { return d.icon + ' pre-icon'; });

        links.append('span')
            .text(function(d) { return d.title; });

        var embed_html = sel
            .append('input')
            .attr('type', 'text')
            .attr('title', 'Embed HTML');

        sel.append('a')
            .attr('class', 'icon-remove')
            .on('click', function() { sel.remove(); });

        gist.saveBlocks(context.data.get('map'), function(err, res) {
            if (err) return;
            if (res) {
                embed_html.property('value',
                    '<iframe frameborder="0" width="100%" height="300" ' +
                    'src="http://bl.ocks.org/d/' + res.id + '"></iframe>');
                embed_html.node().select();
            }
        });
    };
}

},{"../source/gist":75}],90:[function(require,module,exports){
var importPanel = require('./import'),
    githubBrowser = require('github-file-browser')(d3),
    detectIndentationStyle = require('detect-json-indent');

module.exports = function(context) {

    function render(selection) {

        selection
            .select('.right.overlay').remove();

        var panel = selection
            .append('div')
            .attr('class', 'right overlay');

        var sources = [{
            title: 'Import',
            alt: 'CSV, KML, GPX, and other filetypes',
            icon: 'icon-cog',
            action: clickImport
        }, {
            title: 'GitHub',
            alt: 'GeoJSON files in GitHub Repositories',
            icon: 'icon-github',
            authenticated: true,
            action: clickGitHub
        }, {
            title: 'Gist',
            alt: 'GeoJSON files in GitHub Gists',
            icon: 'icon-github-alt',
            authenticated: true,
            action: clickGist
        }];

        var $top = panel
            .append('div')
            .attr('class', 'top');

       var $buttons = $top.append('div')
            .attr('class', 'buttons');

       var $sources = $buttons
           .selectAll('button.source')
            .data(sources)
            .enter()
            .append('button')
            .classed('deemphasize', function(d) {
                return d.authenticated && !context.user.token();
            })
            .attr('class', function(d) {
                return d.icon + ' icon-spaced pad1 source';
            })
            .text(function(d) {
                return ' ' + d.title;
            })
            .attr('title', function(d) { return d.alt; })
            .on('click', clickSource);

        function clickSource(d) {
            if (d.authenticated && !context.user.token()) {
                return alert('Log in to load GitHub files and Gists');
            }

            var that = this;
            $sources.classed('active', function() {
                return that === this;
            });

            d.action.apply(this, d);
        }

        $buttons.append('button')
            .on('click', hidePanel)
            .attr('class', function(d) {
                return 'icon-remove';
            });

        function hidePanel(d) {
            panel.remove();
        }

        var $subpane = panel.append('div')
            .attr('class', 'subpane');

        function clickGitHub() {
            $subpane
                .html('')
                .append('div')
                .attr('class', 'repos')
                .call(githubBrowser
                    .gitHubBrowse(context.user.token(), {
                        sort: function(a, b) {
                            return new Date(b.pushed_at) - new Date(a.pushed_at);
                        }
                    }).on('chosen', context.data.parse));
        }

        function clickImport() {
            $subpane
                .html('')
                .append('div')
                .call(importPanel(context));
        }

        function clickGist() {
            $subpane
                .html('')
                .append('div')
                .attr('class', 'browser pad1')
                .call(githubBrowser
                    .gistBrowse(context.user.token(), {
                        sort: function(a, b) {
                            return new Date(b.updated_at) - new Date(a.updated_at);
                        }
                    }).on('chosen', context.data.parse));
        }

        $sources.filter(function(d, i) { return !i; }).trigger('click');
    }

    return render;
};

},{"./import":83,"detect-json-indent":12,"github-file-browser":16}],91:[function(require,module,exports){
module.exports = function(context) {
    return function(selection) {
        var name = selection.append('a')
            .attr('target', '_blank');

        selection.append('span').text(' | ');

        var action = selection.append('a')
            .attr('href', '#');

        function nextLogin() {
            action.text('login').on('click', login);
            name
                .text('anon')
                .attr('href', '#')
                .on('click', function() { d3.event.preventDefault(); });
        }

        function nextLogout() {
            name.on('click', null);
            action.text('logout').on('click', logout);
        }

        function login() {
            d3.event.preventDefault();
            context.user.authenticate();
        }

        function logout() {
            d3.event.preventDefault();
            context.user.logout();
            nextLogin();
        }

        nextLogin();

        if (context.user.token()) {
            context.user.details(function(err, d) {
                if (err) return;
                name.text(d.login);
                name.attr('href', d.html_url);
                nextLogout();
            });
        }
    };
};

},{}]},{},[71])
;