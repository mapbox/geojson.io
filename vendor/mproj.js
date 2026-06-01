// add math.h functions to library scope
// (to make porting projection functions simpler)
var fabs = Math.abs,
  floor = Math.floor,
  sin = Math.sin,
  cos = Math.cos,
  tan = Math.tan,
  asin = Math.asin,
  acos = Math.acos,
  atan = Math.atan,
  atan2 = Math.atan2,
  sqrt = Math.sqrt,
  pow = Math.pow,
  exp = Math.exp,
  log = Math.log,
  hypot = Math.hypot,
  sinh = Math.sinh,
  cosh = Math.cosh,
  MIN = Math.min,
  MAX = Math.max;

// constants from math.h
var HUGE_VAL = Infinity,
  M_PI = Math.PI;

// from proj_api.h
var RAD_TO_DEG = 57.295779513082321,
  DEG_TO_RAD = 0.017453292519943296;

// from pj_transform.c
var SRS_WGS84_SEMIMAJOR = 6378137;
var SRS_WGS84_ESQUARED = 0.0066943799901413165;

// math constants from project.h
var M_FORTPI = M_PI / 4,
  M_HALFPI = M_PI / 2,
  M_PI_HALFPI = 1.5 * M_PI,
  M_TWOPI = 2 * M_PI,
  M_TWO_D_PI = 2 / M_PI,
  M_TWOPI_HALFPI = 2.5 * M_PI;

// datum types
var PJD_UNKNOWN = 0,
  PJD_3PARAM = 1,
  PJD_7PARAM = 2,
  PJD_GRIDSHIFT = 3,
  PJD_WGS84 = 4;

// named errors
var PJD_ERR_GEOCENTRIC = -45,
  PJD_ERR_AXIS = -47,
  PJD_ERR_GRID_AREA = -48,
  PJD_ERR_CATALOG = -49;

// common
var EPS10 = 1e-10;

var PJ_LOG_NONE = 0,
  PJ_LOG_ERROR = 1,
  PJ_LOG_DEBUG_MAJOR = 2,
  PJ_LOG_DEBUG_MINOR = 3;

// context of currently running projection function
// (Unlike Proj.4, we use a single ctx object)
var ctx = {
  last_errno: 0,
  debug_level: PJ_LOG_NONE,
  logger: null // TODO: implement
};

var pj_err_list = [
  'no arguments in initialization list' /*  -1 */,
  "no options found in 'init' file" /*  -2 */,
  'invalid init= string' /*  -3 */, // Proj.4 text: "no colon in init= string",
  'projection not named' /*  -4 */,
  'unknown projection id' /*  -5 */,
  'effective eccentricity = 1' /*  -6 */,
  'unknown unit conversion id' /*  -7 */,
  'invalid boolean param argument' /*  -8 */,
  'unknown elliptical parameter name' /*  -9 */,
  'reciprocal flattening (1/f) = 0' /* -10 */,
  '|radius reference latitude| > 90' /* -11 */,
  'squared eccentricity < 0' /* -12 */,
  'major axis or radius = 0 or not given' /* -13 */,
  'latitude or longitude exceeded limits' /* -14 */,
  'invalid x or y' /* -15 */,
  'improperly formed DMS value' /* -16 */,
  'non-convergent inverse meridional dist' /* -17 */,
  'non-convergent inverse phi2' /* -18 */,
  'acos/asin: |arg| >1+1e-14' /* -19 */,
  'tolerance condition error' /* -20 */,
  'conic lat_1 = -lat_2' /* -21 */,
  'lat_1 >= 90' /* -22 */,
  'lat_1 = 0' /* -23 */,
  'lat_ts >= 90' /* -24 */,
  'no distance between control points' /* -25 */,
  'projection not selected to be rotated' /* -26 */,
  'W <= 0 or M <= 0' /* -27 */,
  'lsat not in 1-5 range' /* -28 */,
  'path not in range' /* -29 */,
  'h <= 0' /* -30 */,
  'k <= 0' /* -31 */,
  'lat_0 = 0 or 90 or alpha = 90' /* -32 */,
  'lat_1=lat_2 or lat_1=0 or lat_2=90' /* -33 */,
  'elliptical usage required' /* -34 */,
  'invalid UTM zone number' /* -35 */,
  'arg(s) out of range for Tcheby eval' /* -36 */,
  'failed to find projection to be rotated' /* -37 */,
  'failed to load datum shift file' /* -38 */,
  "both n & m must be spec'd and > 0" /* -39 */,
  'n <= 0, n > 1 or not specified' /* -40 */,
  'lat_1 or lat_2 not specified' /* -41 */,
  '|lat_1| == |lat_2|' /* -42 */,
  'lat_0 is pi/2 from mean lat' /* -43 */,
  'unparseable coordinate system definition' /* -44 */,
  'geocentric transformation missing z or ellps' /* -45 */,
  'unknown prime meridian conversion id' /* -46 */,
  'illegal axis orientation combination' /* -47 */,
  'point not within available datum shift grids' /* -48 */,
  'invalid sweep axis, choose x or y'
];

// see pj_transform.c CHECK_RETURN()
function check_fatal_error() {
  var code = ctx.last_errno;
  if (!code) return;
  if (code > 0 || !is_transient_error(code)) {
    e_error(code);
  } else {
    // transient error
    // TODO: consider a strict mode that throws an error
  }
}

function is_transient_error(code) {
  return transient_error.indexOf(code) > -1;
}

var transient_error = [-14, -15, -17, -18, -19, -20, -27, -48];

function pj_ctx_set_errno(code) {
  ctx.last_errno = code;
}

function f_error() {
  pj_ctx_set_errno(-20);
}

function i_error() {
  pj_ctx_set_errno(-20);
}

function error_msg(code) {
  return pj_err_list[~code] || 'unknown error';
}

// alias for e_error()
function error(code) {
  e_error(code);
}

// a fatal error
// see projects.h E_ERROR macro
function e_error(code) {
  pj_ctx_set_errno(code);
  fatal();
}

function fatal(msg, o) {
  if (!o) o = {};
  if (!o.code) o.code = ctx.last_errno || 0;
  if (!msg) msg = error_msg(o.code);
  // reset error code, so processing can continue after this error is handled
  ctx.last_errno = 0;
  throw new ProjError(msg, o);
}

function ProjError(msg, o) {
  var err = new Error(msg);
  err.name = 'ProjError';
  Object.keys(o).forEach(function (k) {
    err[k] = o[k];
  });
  return err;
}

function dmstor(str) {
  return dmstod(str) * DEG_TO_RAD;
}

// Parse a formatted value in DMS DM or D to a numeric value
// Delimiters: D|d (degrees), ' (minutes), " (seconds)
function dmstod(str) {
  var match = /(-?[0-9.]+)d?([0-9.]*)'?([0-9.]*)"?([nsew]?)$/i.exec(str);
  var d = NaN;
  var deg, min, sec;
  if (match) {
    deg = match[1] || '0';
    min = match[2] || '0';
    sec = match[3] || '0';
    d = +deg + +min / 60 + +sec / 3600;
    if (/[ws]/i.test(match[4])) {
      d = -d;
    }
  }
  if (isNaN(d)) {
    // throw an exception instead of just setting an error code
    // (assumes this function is called by pj_init() or a cli program,
    // where an exception is more appropriate)
    e_error(-16);
    // pj_ctx_set_errno(-16);
    // d = HUGE_VAL;
  }
  return d;
}

function pj_atof(str) {
  return pj_strtod(str);
}

function pj_strtod(str) {
  return parseFloat(str);
}

/* types
  t  test for presence
  i  integer
  d  simple real
  r  dms or decimal degrees
  s  string
  b  boolean
*/

// see pj_param.c
// this implementation is slightly different
function pj_param(params, code) {
  var type = code[0],
    name = code.substr(1),
    obj = params[name],
    isset = obj !== void 0,
    val,
    param;

  if (type == 't') {
    val = isset;
  } else if (isset) {
    param = obj.param;
    obj.used = true;
    if (type == 'i') {
      val = parseInt(param);
    } else if (type == 'd') {
      // Proj.4 handles locale-specific decimal mark
      // TODO: what to do about NaNs
      val = pj_atof(param);
    } else if (type == 'r') {
      val = dmstor(param);
    } else if (type == 's') {
      val = String(param);
    } else if (type == 'b') {
      if (param == 'T' || param == 't' || param === true) {
        val = true;
      } else if (param == 'F' || param == 'f') {
        val = false;
      } else {
        pj_ctx_set_errno(-8);
        val = false;
      }
    }
  } else {
    // value is not set; use default
    val = {
      i: 0,
      b: false,
      d: 0,
      r: 0,
      s: ''
    }[type];
  }
  if (val === void 0) {
    fatal('invalid request to pj_param, fatal');
  }
  return val;
}

// convert arguments in a proj4 definition string into object properties
// (not in Proj.4)
function pj_get_params(args) {
  var rxp = /\+([a-z][a-z0-9_]*(?:=[^\s]*)?)/gi;
  var params = {};
  var match;
  while ((match = rxp.exec(args))) {
    pj_mkparam(params, match[1]);
  }
  return params;
}

// different from Proj.4
function pj_mkparam(params, token) {
  var parts = token.split('=');
  var name, val;
  if (parts.length == 1) {
    name = token;
    val = true;
  } else {
    name = parts[0];
    val = token.substr(parts[0].length + 1);
  }
  params[name] = { used: false, param: val };
}

var pj_list = {};

function pj_add(func, key, name, desc) {
  pj_list[key] = {
    init: func,
    name: name,
    description: desc
  };
}

/* @pj_param */

function pj_is_latlong(P) {
  return !P || P.is_latlong;
}

function pj_is_geocent(P) {
  return !P || P.is_geocent;
}

function get_geod_defn(P) {
  var got_datum = false,
    defn = '';
  if ('datum' in P.params) {
    got_datum = true;
    defn += get_param(P, 'datum');
  } else if ('ellps' in P.params) {
    defn += get_param(P, 'ellps');
  } else if ('a' in P.params) {
    defn += get_param(P, 'a');
    if ('b' in P.params) {
      defn += get_param(P, 'b');
    } else if ('es' in P.params) {
      defn += get_param(P, 'es');
    } else if ('f' in P.params) {
      defn += get_param(P, 'f');
    } else {
      defn += ' +es=' + P.es;
    }
  } else {
    error(-13);
  }
  if (!got_datum) {
    defn += get_param(P, 'towgs84');
    defn += get_param(P, 'nadgrids');
  }
  defn += get_param(P, 'R');
  defn += get_param(P, 'R_A');
  defn += get_param(P, 'R_V');
  defn += get_param(P, 'R_a');
  defn += get_param(P, 'R_lat_a');
  defn += get_param(P, 'R_lat_g');
  defn += get_param(P, 'pm');
  return defn;
}

// Convert an initialized proj object back to a Proj.4 string
function get_proj_defn(P) {
  // skip geodetic params and some initialization-related params
  var skip =
    'datum,ellps,a,b,es,rf,f,towgs84,nadgrids,R,R_A,R_V,R_a,R_lat_a,R_lat_g,pm,init,no_defs'.split(
      ','
    );
  var defn = '';
  Object.keys(P.params).forEach(function (name) {
    if (skip.indexOf(name) == -1) {
      defn += get_param(P, name);
    }
  });
  // add geodetic params
  defn += get_geod_defn(P);
  return defn.trim();
}

function get_param(P, name) {
  var param = '';
  if (name in P.params) {
    param = ' +' + name;
    if (P.params[name].param !== true) {
      param += '=' + pj_param(P.params, 's' + name);
    }
  }
  return param;
}

var pj_datums = [
  /* id defn ellipse_id comments */
  ['WGS84', 'towgs84=0,0,0', 'WGS84', 'WGS_1984'], // added comment for wkt creation
  [
    'GGRS87',
    'towgs84=-199.87,74.79,246.62',
    'GRS80',
    'Greek_Geodetic_Reference_System_1987'
  ],
  ['NAD83', 'towgs84=0,0,0', 'GRS80', 'North_American_Datum_1983'],
  // nadgrids not supported; NAD27 will trigger an error
  [
    'NAD27',
    'nadgrids=@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat',
    'clrk66',
    'North_American_Datum_1927'
  ],
  [
    'potsdam',
    'towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7',
    'bessel',
    'Potsdam Rauenberg 1950 DHDN'
  ],
  [
    'carthage',
    'towgs84=-263.0,6.0,431.0',
    'clrk80ign',
    'Carthage 1934 Tunisia'
  ],
  [
    'hermannskogel',
    'towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232',
    'bessel',
    'Hermannskogel'
  ],
  [
    'ire65',
    'towgs84=482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15',
    'mod_airy',
    'Ireland 1965'
  ],
  [
    'nzgd49',
    'towgs84=59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993',
    'intl',
    'New Zealand Geodetic Datum 1949'
  ],
  [
    'OSGB36',
    'towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894',
    'airy',
    'OSGB 1936'
  ],
  [null, null, null, null]
];

var pj_prime_meridians = [
  // id definition
  ['greenwich', '0dE'],
  ['lisbon', '9d07\'54.862"W'],
  ['paris', '2d20\'14.025"E'],
  ['bogota', '74d04\'51.3"W'],
  ['madrid', '3d41\'16.58"W'],
  ['rome', '12d27\'8.4"E'],
  ['bern', '7d26\'22.5"E'],
  ['jakarta', '106d48\'27.79"E'],
  ['ferro', "17d40'W"],
  ['brussels', '4d22\'4.71"E'],
  ['stockholm', '18d3\'29.8"E'],
  ['athens', '23d42\'58.815"E'],
  ['oslo', '10d43\'22.5"E'],
  [null, null]
];

function find_prime_meridian(id) {
  var defn = pj_prime_meridians.reduce(function (memo, arr) {
    return arr[0] === id ? arr : memo;
  }, null);
  return defn ? { id: defn[0], definition: defn[1] } : null;
}

function find_datum(id) {
  var defn = pj_datums.reduce(function (memo, arr) {
    return arr[0] === id ? arr : memo;
  }, null);
  return defn
    ? { id: defn[0], defn: defn[1], ellipse_id: defn[2], name: defn[3] }
    : null;
}

function pj_datum_set(P) {
  var SEC_TO_RAD = 4.84813681109535993589914102357e-6;
  var params = (P.datum_params = [0, 0, 0, 0, 0, 0, 0]);
  var name, datum, nadgrids, catalog, towgs84;

  P.datum_type = PJD_UNKNOWN;

  if ((name = pj_param(P.params, 'sdatum'))) {
    datum = find_datum(name);
    if (!datum) {
      error(-9);
    }
    if (datum.ellipse_id) {
      pj_mkparam(P.params, 'ellps=' + datum.ellipse_id);
    }
    if (datum.defn) {
      pj_mkparam(P.params, datum.defn);
    }
  }

  nadgrids = pj_param(P.params, 'snadgrids');
  if (nadgrids && nadgrids != '@null') {
    fatal('+nadgrids is not implemented');
  }
  if ((catalog = pj_param(P.params, 'scatalog'))) {
    fatal('+catalog is not implemented');
  }
  if ((towgs84 = pj_param(P.params, 'stowgs84'))) {
    towgs84.split(',').forEach(function (s, i) {
      params[i] = pj_atof(s) || 0;
    });
    if (params[3] != 0 || params[4] != 0 || params[5] != 0 || params[6] != 0) {
      P.datum_type = PJD_7PARAM;
      params[3] *= SEC_TO_RAD;
      params[4] *= SEC_TO_RAD;
      params[5] *= SEC_TO_RAD;
      params[6] = params[6] / 1e6 + 1;
    } else {
      P.datum_type = PJD_3PARAM;
      /* Note that pj_init() will later switch datum_type to
         PJD_WGS84 if shifts are all zero, and ellipsoid is WGS84 or GRS80 */
    }
  }
}

var pj_ellps = [
  // id major ell name
  ['MERIT', 'a=6378137.0', 'rf=298.257', 'MERIT 1983'],
  ['SGS85', 'a=6378136.0', 'rf=298.257', 'Soviet Geodetic System 85'],
  ['GRS80', 'a=6378137.0', 'rf=298.257222101', 'GRS 1980(IUGG, 1980)'],
  ['IAU76', 'a=6378140.0', 'rf=298.257', 'IAU 1976'],
  ['airy', 'a=6377563.396', 'b=6356256.910', 'Airy 1830'],
  ['APL4.9', 'a=6378137.0', 'rf=298.25', 'Appl. Physics. 1965'],
  ['NWL9D', 'a=6378145.0', 'rf=298.25', 'Naval Weapons Lab., 1965'],
  ['mod_airy', 'a=6377340.189', 'b=6356034.446', 'Modified Airy'],
  ['andrae', 'a=6377104.43', 'rf=300.0', 'Andrae 1876 (Den., Iclnd.)'],
  ['aust_SA', 'a=6378160.0', 'rf=298.25', 'Australian Natl & S. Amer. 1969'],
  ['GRS67', 'a=6378160.0', 'rf=298.2471674270', 'GRS 67(IUGG 1967)'],
  ['bessel', 'a=6377397.155', 'rf=299.1528128', 'Bessel 1841'],
  ['bess_nam', 'a=6377483.865', 'rf=299.1528128', 'Bessel 1841 (Namibia)'],
  ['clrk66', 'a=6378206.4', 'b=6356583.8', 'Clarke 1866'],
  ['clrk80', 'a=6378249.145', 'rf=293.4663', 'Clarke 1880 mod.'],
  ['clrk80ign', 'a=6378249.2', 'rf=293.4660212936269', 'Clarke 1880 (IGN).'],
  ['CPM', 'a=6375738.7', 'rf=334.29', 'Comm. des Poids et Mesures 1799'],
  ['delmbr', 'a=6376428', 'rf=311.5', 'Delambre 1810 (Belgium)'],
  ['engelis', 'a=6378136.05', 'rf=298.2566', 'Engelis 1985'],
  ['evrst30', 'a=6377276.345', 'rf=300.8017', 'Everest 1830'],
  ['evrst48', 'a=6377304.063', 'rf=300.8017', 'Everest 1948'],
  ['evrst56', 'a=6377301.243', 'rf=300.8017', 'Everest 1956'],
  ['evrst69', 'a=6377295.664', 'rf=300.8017', 'Everest 1969'],
  ['evrstSS', 'a=6377298.556', 'rf=300.8017', 'Everest (Sabah & Sarawak)'],
  ['fschr60', 'a=6378166', 'rf=298.3', 'Fischer (Mercury Datum) 1960'],
  ['fschr60m', 'a=6378155', 'rf=298.3', 'Modified Fischer 1960'],
  ['fschr68', 'a=6378150', 'rf=298.3', 'Fischer 1968'],
  ['helmert', 'a=6378200', 'rf=298.3', 'Helmert 1906'],
  ['hough', 'a=6378270.0', 'rf=297', 'Hough'],
  ['intl', 'a=6378388.0', 'rf=297', 'International 1909 (Hayford)'],
  ['krass', 'a=6378245.0', 'rf=298.3', 'Krasovsky 1940'], // Proj.4 has "Krassovsky, 1942"
  ['kaula', 'a=6378163', 'rf=298.24', 'Kaula 1961'],
  ['lerch', 'a=6378139', 'rf=298.257', 'Lerch 1979'],
  ['mprts', 'a=6397300', 'rf=191', 'Maupertius 1738'],
  ['new_intl', 'a=6378157.5', 'b=6356772.2', 'New International 1967'],
  ['plessis', 'a=6376523', 'b=6355863', 'Plessis 1817 (France)'],
  ['SEasia', 'a=6378155.0', 'b=6356773.3205', 'Southeast Asia'],
  ['walbeck', 'a=6376896.0', 'b=6355834.8467', 'Walbeck'],
  ['WGS60', 'a=6378165.0', 'rf=298.3', 'WGS 60'],
  ['WGS66', 'a=6378145.0', 'rf=298.25', 'WGS 66'],
  ['WGS72', 'a=6378135.0', 'rf=298.26', 'WGS 72'],
  ['WGS84', 'a=6378137.0', 'rf=298.257223563', 'WGS 84'],
  ['sphere', 'a=6370997.0', 'b=6370997.0', 'Normal Sphere (r=6370997)'],
  [null, null, null, null]
];

function find_ellps(id) {
  var defn = pj_ellps.reduce(function (memo, arr) {
    return arr[0] === id ? arr : memo;
  }, null);
  return defn
    ? { id: defn[0], major: defn[1], ell: defn[2], name: defn[3] }
    : null;
}

function pj_ell_set(P) {
  var SIXTH = 0.1666666666666666667 /* 1/6 */,
    RA4 = 0.04722222222222222222 /* 17/360 */,
    RA6 = 0.02215608465608465608 /* 67/3024 */,
    RV4 = 0.06944444444444444444 /* 5/72 */,
    RV6 = 0.0424382716049382716; /* 55/1296 */
  var params = P.params;
  var a = 0;
  var es = 0;
  var name, ellps, tmp, b, i;
  if (pj_param(params, 'tR')) {
    a = pj_param(params, 'dR');
  } else {
    if ((name = pj_param(params, 'sellps'))) {
      ellps = find_ellps(name);
      if (!ellps) {
        error(-9);
      }
      pj_mkparam(params, ellps.major);
      pj_mkparam(params, ellps.ell);
    }
    a = pj_param(params, 'da');
    if (pj_param(params, 'tes')) {
      es = pj_param(params, 'des');
    } else if (pj_param(params, 'te')) {
      tmp = pj_param(params, 'de');
      es = tmp * tmp;
    } else if (pj_param(params, 'trf')) {
      tmp = pj_param(params, 'drf');
      if (!tmp) {
        error(-10);
      }
      tmp = 1 / tmp;
      es = tmp * (2 - tmp);
    } else if (pj_param(params, 'tf')) {
      tmp = pj_param(params, 'df');
      es = tmp * (2 - tmp);
    } else if (pj_param(params, 'tb')) {
      b = pj_param(params, 'db');
      es = 1 - (b * b) / (a * a);
    }
    if (!b) {
      b = a * sqrt(1 - es);
    }

    if (pj_param(params, 'bR_A')) {
      a *= 1 - es * (SIXTH + es * (RA4 + es * RA6));
      es = 0;
    } else if (pj_param(params, 'bR_V')) {
      a *= 1 - es * (SIXTH + es * (RV4 + es * RV6));
    } else if (pj_param(params, 'bR_a')) {
      a = 0.5 * (a + b);
      es = 0;
    } else if (pj_param(params, 'bR_g')) {
      a = sqrt(a * b);
      es = 0;
    } else if (pj_param(params, 'bR_h')) {
      if (a + b === 0) {
        error(-20);
      }
      a = (2 * a * b) / (a + b);
      es = 0;
    } else if (
      (i = pj_param(params, 'tR_lat_a') || pj_param(params, 'tR_lat_g'))
    ) {
      tmp = sin(pj_param(params, i ? 'rR_lat_a' : 'rR_lat_g'));
      if (fabs(tmp) > M_HALFPI) {
        error(-11);
      }
      tmp = 1 - es * tmp * tmp;
      a *= i ? (0.5 * (1 - es + tmp)) / (tmp * sqrt(tmp)) : sqrt(1 - es) / tmp;
      es = 0;
    }
  }

  if (es < 0) error(-12);
  if (a <= 0) error(-13);
  P.es = es;
  P.a = a;
}

var pj_units = [
  // id to_meter name
  ['km', '1000', 'Kilometer'],
  ['m', '1', 'Meter'],
  ['dm', '1/10', 'Decimeter'],
  ['cm', '1/100', 'Centimeter'],
  ['mm', '1/1000', 'Millimeter'],
  ['kmi', '1852.0', 'International Nautical Mile'],
  ['in', '0.0254', 'International Inch'],
  ['ft', '0.3048', 'International Foot'],
  ['yd', '0.9144', 'International Yard'],
  ['mi', '1609.344', 'International Statute Mile'],
  ['fath', '1.8288', 'International Fathom'],
  ['ch', '20.1168', 'International Chain'],
  ['link', '0.201168', 'International Link'],
  ['us-in', '1/39.37', "U.S. Surveyor's Inch"],
  ['us-ft', '0.304800609601219', "U.S. Surveyor's Foot"],
  ['us-yd', '0.914401828803658', "U.S. Surveyor's Yard"],
  ['us-ch', '20.11684023368047', "U.S. Surveyor's Chain"],
  ['us-mi', '1609.347218694437', "U.S. Surveyor's Statute Mile"],
  ['ind-yd', '0.91439523', 'Indian Yard'],
  ['ind-ft', '0.30479841', 'Indian Foot'],
  ['ind-ch', '20.11669506', 'Indian Chain'],
  [null, null, null]
];

function find_units_by_value(val) {
  return pj_units.reduce(function (memo, defn) {
    if (val == +defn[1]) {
      memo = find_units(defn[0]);
    }
    return memo;
  }, null);
}

function find_units(id) {
  var arr = pj_units.reduce(function (memo, defn) {
    return id === defn[0] ? defn : memo;
  }, null);
  return arr ? { id: arr[0], to_meter: arr[1], name: arr[2] } : null;
}

var initcache = {};

function pj_search_initcache(key) {
  return initcache[key.toLowerCase()] || null;
}

function pj_insert_initcache(key, defn) {
  initcache[key.toLowerCase()] = defn;
}

// Replacement functions for Proj.4 pj_open_lib() (see pj_open_lib.c)
// and get_opt() (see pj_init.c)

var libcache = {};

// add a definition library without reading from a file (for use by web app)
function mproj_insert_libcache(libId, contents) {
  libcache[libId] = contents;
}

function mproj_search_libcache(libId) {
  return libcache[libId] || null;
}

function mproj_read_lib_anycase(libFile) {
  // var fs = require('fs'),
  //     path = require('path'),
  //     // path to library assumes mproj script is in the dist/ directory
  //     dir = path.join(path.dirname(__filename), '../nad'),
  //     pathUC = path.join(dir, libFile.toUpperCase()),
  //     pathLC = path.join(dir, libFile.toLowerCase()),
  //     contents;
  // if (fs.existsSync(pathUC)) {
  //   contents = fs.readFileSync(pathUC, 'utf8');
  // } else if (fs.existsSync(pathLC)) {
  //   contents = fs.readFileSync(pathLC, 'utf8');
  // } else {
  fatal("unable to read from 'init' file named " + libFile); // not in Proj.4
  // }
  return contents;
}

// Return opts from a section of a config file,
//   or null if not found or unable to read file
function pj_read_init_opts(initStr) {
  var parts = initStr.split(':'),
    libId = parts[0],
    crsId = parts[1],
    libStr,
    o;
  if (!crsId || !libId) {
    error(-3);
  }
  libId = libId.toLowerCase(); // not in Proj.4
  libStr = mproj_search_libcache(libId);
  if (!libStr) {
    libStr = mproj_read_lib_anycase(libId);
    libcache[libId] = libStr;
  }
  return libStr ? pj_find_opts(libStr, crsId) : null;
}

// Find params in contents of an init file
function pj_find_opts(contents, id) {
  var opts = '',
    comment = '',
    idx,
    idx2;
  // get requested parameters
  idx = contents.indexOf('<' + id + '>');
  if (idx > -1) {
    // get comment text
    idx2 = contents.lastIndexOf('#', idx);
    if (idx2 > -1) {
      comment = contents.substring(idx2 + 1, idx).trim();
      if (/\n/.test(comment)) {
        comment = '';
      }
    }
    // get projection params
    opts = contents.substr(idx + id.length + 2);
    opts = opts.substr(0, opts.indexOf('<'));
    // remove comments
    opts = opts.replace(/#.*/g, '');
    // convert all whitespace to single <sp>
    opts = opts.replace(/[\s]+/g, ' ');

    // if '+' is missing from args, add it
    // kludge: protect spaces in +title= opts
    opts = opts.replace(/\+title=[^+]*[^ +]/g, function (match) {
      return match.replace(/ /g, '\t');
    });
    opts = ' ' + opts;
    opts = opts.replace(/ (?=[a-z])/gi, ' +');
    opts = opts.replace(/\t/g, ' ').trim();
  }
  return opts ? { opts: opts, comment: comment } : null;
}

// Returns an initialized projection object
// @args a proj4 string
function pj_init(args) {
  var params = pj_get_params(args);
  var P = {
    params: params,
    is_latlong: false,
    is_geocent: false,
    is_long_wrap_set: false,
    long_wrap_center: 0,
    axis: 'enu',
    gridlist: null,
    gridlist_count: 0,
    vgridlist_geoid: null,
    vgridlist_geoid_count: 0
  };
  var name, defn;
  if (!Object.keys(params).length) {
    error(-1);
  }

  if (pj_param(params, 'tinit')) {
    get_init(params, pj_param(params, 'sinit'));
  }

  name = pj_param(params, 'sproj');
  if (!name) {
    error(-4);
  }

  defn = pj_list[name];
  if (!defn) {
    error(-5);
  }

  if (!pj_param(params, 'bno_defs')) {
    get_defaults(P.params, name);
  }

  pj_datum_set(P);
  pj_ell_set(P);

  P.a_orig = P.a;
  P.es_orig = P.es;
  P.e = sqrt(P.es);
  P.ra = 1 / P.a;
  P.one_es = 1 - P.es;
  if (!P.one_es) {
    error(-6);
  }
  P.rone_es = 1 / P.one_es;

  if (is_wgs84(P)) {
    P.datum_type = PJD_WGS84;
  }

  P.geoc = !!P.es && pj_param(params, 'bgeoc');
  P.over = pj_param(params, 'bover');
  P.has_geoid_vgrids = pj_param(params, 'tgeoidgrids');
  if (P.has_geoid_vgrids) {
    pj_param(params, 'sgeoidgrids'); // mark as used
  }

  P.is_long_wrap_set = pj_param(params, 'tlon_wrap');
  if (P.is_long_wrap_set) {
    P.long_wrap_center = pj_param(params, 'rlon_wrap');
    // Don't accept excessive values otherwise we might perform badly
    // when correcting longitudes around it
    // The test is written this way to error on long_wrap_center "=" NaN
    if (fabs(P.long_wrap_center) < 10 * M_TWOPI === false) {
      error(-14);
    }
  }

  if (pj_param(params, 'saxis')) {
    init_axis(P);
  }

  P.lam0 = pj_param(params, 'rlon_0');
  P.phi0 = pj_param(params, 'rlat_0');
  P.x0 = pj_param(params, 'dx_0');
  P.y0 = pj_param(params, 'dy_0');

  if (pj_param(params, 'tk_0')) {
    P.k0 = pj_param(params, 'dk_0');
  } else if (pj_param(params, 'tk')) {
    P.k0 = pj_param(params, 'dk');
  } else {
    P.k0 = 1;
  }
  if (P.k0 <= 0) {
    error(-31);
  }

  init_units(P);
  init_prime_meridian(P);
  defn.init(P);
  return P;
}

// Merge default params
// NOTE: Proj.4 loads defaults from the file nad/proj_def.dat
// This function applies the default ellipsoid from proj_def.dat but
//   ignores the other defaults, which could be considered undesirable
//   (see e.g. https://github.com/OSGeo/proj.4/issues/201)
function get_defaults(params, name) {
  get_opt(params, '+ellps=WGS84');
}

function get_init(params, initStr) {
  var defn = pj_search_initcache(initStr);
  if (!defn) {
    defn = pj_read_init_opts(initStr);
    pj_insert_initcache(initStr, defn);
  }
  if (!defn) {
    error(-2);
  }
  // merge init params
  get_opt(params, defn.opts);
}

// Merge params from a proj4 string
// (Slightly different interface from Proj.4 get_opts())
function get_opt(params, args) {
  var newParams = pj_get_params(args);
  var geoIsSet = ['datum', 'ellps', 'a', 'b', 'rf', 'f'].reduce(function (
    memo,
    key
  ) {
    return memo || key in params;
  },
  false);
  Object.keys(newParams).forEach(function (key) {
    // don't override existing params
    if (key in params) return;
    // don't set ellps if earth model info is set
    if (key == 'ellps' && geoIsSet) return;
    params[key] = newParams[key];
  });
}

function init_prime_meridian(P) {
  var params = P.params,
    name,
    pm,
    offs;
  name = pj_param(params, 'spm');
  if (name) {
    pm = find_prime_meridian(name);
    offs = dmstor(pm ? pm.definition : name);
    if (isNaN(offs)) {
      error(-46);
    }
    P.from_greenwich = offs;
  } else {
    P.from_greenwich = 0;
  }
}

function init_units(P) {
  var params = P.params;
  var name, s, units;
  if ((name = pj_param(params, 'sunits'))) {
    units = find_units(name);
    if (!units) {
      error(-7);
    }
    s = units.to_meter;
  }
  if (s || (s = pj_param(params, 'sto_meter'))) {
    P.to_meter = parse_to_meter(s);
    P.fr_meter = 1 / P.to_meter;
  } else {
    P.to_meter = P.fr_meter = 1;
  }

  // vertical units
  s = null;
  if ((name = pj_param(params, 'svunits'))) {
    units = find_units(name);
    if (!units) {
      error(-7);
    }
    s = units.to_meter;
  }
  if (s || pj_param(params, 'svto_meter')) {
    P.vto_meter = parse_to_meter(s);
    P.vfr_meter = 1 / P.vto_meter;
  } else {
    P.vto_meter = P.to_meter;
    P.vfr_meter = P.fr_meter;
  }
}

function parse_to_meter(s) {
  var parts = s.split('/');
  var val = pj_strtod(parts[0]);
  if (parts.length > 1) {
    val /= pj_strtod(parts[1]);
  }
  return val;
}

function init_axis(P) {
  var axis_legal = 'ewnsud';
  var axis = pj_param(P.params, 'saxis');
  if (axis.length != 3) {
    error(PJD_ERR_AXIS);
  }
  if (
    axis_legal.indexOf(axis[0]) == -1 ||
    axis_legal.indexOf(axis[1]) == -1 ||
    axis_legal.indexOf(axis[2]) == -1
  ) {
    error(PJD_ERR_AXIS);
  }
  P.axis = axis;
}

function is_wgs84(P) {
  return (
    P.datum_type == PJD_3PARAM &&
    ((P.datum_params[0] == P.datum_params[1]) == P.datum_params[2]) === 0 &&
    P.a == 6378137 &&
    Math.abs(P.es - 0.00669437999) < 0.00000000005
  );
}

// TODO: remove error codes (Proj.4 doesn't do anything with them)
var GEOCENT_NO_ERROR = 0x0000,
  GEOCENT_LAT_ERROR = 0x0001,
  GEOCENT_LON_ERROR = 0x0002,
  GEOCENT_A_ERROR = 0x0004,
  GEOCENT_B_ERROR = 0x0008,
  GEOCENT_A_LESS_B_ERROR = 0x0010;

// a: Semi-major axis, in meters.
// b: Semi-minor axis, in meters.
function pj_Set_Geocentric_Parameters(a, b) {
  var err = GEOCENT_NO_ERROR,
    a2 = a * a,
    b2 = b * b;
  if (a <= 0.0) err |= GEOCENT_A_ERROR;
  if (b <= 0.0) err |= GEOCENT_B_ERROR;
  if (a < b) err |= GEOCENT_A_LESS_B_ERROR;
  return err
    ? null
    : {
        a: a,
        b: b,
        a2: a2,
        b2: b2,
        e2: (a2 - b2) / a2,
        ep2: (a2 - b2) / b2
      };
}

function pj_Convert_Geodetic_To_Geocentric(gi, i, xx, yy, zz) {
  var err = GEOCENT_NO_ERROR,
    lng = xx[i],
    lat = yy[i],
    height = zz[i],
    x,
    y,
    z,
    rn,
    sinlat,
    sin2lat,
    coslat;
  if (lat < -M_HALFPI && lat > -1.001 * M_HALFPI) {
    lat = -M_HALFPI;
  } else if (lat > M_HALFPI && lat < 1.001 * M_HALFPI) {
    lat = M_HALFPI;
  } else if (lat < -M_HALFPI || lat > M_HALFPI) {
    err |= GEOCENT_LAT_ERROR;
  }

  if (!err) {
    if (lng > M_PI) lng -= 2 * M_PI;
    sinlat = sin(lat);
    coslat = cos(lat);
    sin2lat = sinlat * sinlat;
    rn = gi.a / sqrt(1 - gi.e2 * sin2lat);
    xx[i] = (rn + height) * coslat * cos(lng);
    yy[i] = (rn + height) * coslat * sin(lng);
    zz[i] = (rn * (1 - gi.e2) + height) * sinlat;
  }
  return err;
}

function pj_Convert_Geocentric_To_Geodetic(gi, i, xx, yy, zz) {
  var EPS = 1e-12,
    EPS2 = EPS * EPS,
    MAXITER = 30,
    x = xx[i],
    y = yy[i],
    z = zz[i],
    lat,
    lng,
    height,
    p,
    rr,
    ct,
    st,
    rx,
    rn,
    rk,
    cphi0,
    sphi0,
    cphi,
    sphi,
    sdphi,
    iter;

  p = sqrt(x * x + y * y);
  rr = sqrt(x * x + y * y + z * z);

  if (p / gi.a < EPS) {
    lng = 0;
    if (rr / gi.a < EPS) {
      xx[i] = 0;
      yy[i] = M_HALFPI;
      zz[i] = -gi.b;
      return 0;
    }
  } else {
    lng = atan2(y, x);
  }

  ct = z / rr;
  st = p / rr;
  rx = 1 / sqrt(1 - gi.e2 * (2 - gi.e2) * st * st);
  cphi0 = st * (1 - gi.e2) * rx;
  sphi0 = ct * rx;
  iter = 0;

  do {
    iter++;
    rn = gi.a / sqrt(1 - gi.e2 * sphi0 * sphi0);
    height = p * cphi0 + z * sphi0 - rn * (1 - gi.e2 * sphi0 * sphi0);
    rk = (gi.e2 * rn) / (rn + height);
    rx = 1 / sqrt(1 - rk * (2 - rk) * st * st);
    cphi = st * (1 - rk) * rx;
    sphi = ct * rx;
    sdphi = sphi * cphi0 - cphi * sphi0;
    cphi0 = cphi;
    sphi0 = sphi;
  } while (sdphi * sdphi > EPS2 && iter < MAXITER);
  lat = atan(sphi / fabs(cphi));
  xx[i] = lng;
  yy[i] = lat;
  zz[i] = height;
}

// A convenience function for transforming a single point (not in Proj.4)
// @p an array containing [x, y] or [x, y, z] coordinates
//     latlong coordinates are assumed to be in decimal degrees
function pj_transform_point(srcdefn, dstdefn, p) {
  var z = p.length > 2,
    xx = [p[0]],
    yy = [p[1]],
    zz = [z ? p[2] : 0];
  if (srcdefn.is_latlong) {
    xx[0] *= DEG_TO_RAD;
    yy[0] *= DEG_TO_RAD;
  }
  ctx.last_errno = 0;
  pj_transform(srcdefn, dstdefn, xx, yy, zz);
  if (ctx.last_errno || xx[0] == HUGE_VAL) {
    // throw error if translation fails
    fatal(null, { point: p });
  }
  if (dstdefn.is_latlong) {
    xx[0] *= RAD_TO_DEG;
    yy[0] *= RAD_TO_DEG;
  }
  p[0] = xx[0];
  p[1] = yy[0];
  if (z) p[2] = zz[0];
}

// Transform arrays of coordinates; latlong coords are in radians
// @xx, @yy[, @zz] coordinate arrays
//
function pj_transform(srcdefn, dstdefn, xx, yy, zz) {
  var point_count = xx.length;
  var lp = {};
  var xy = {};
  var err, i, tmp;

  if (srcdefn.axis != 'enu') {
    pj_adjust_axis(srcdefn.axis, false, xx, yy, zz);
  }

  if (srcdefn.vto_meter != 1 && zz) {
    for (i = 0; i < point_count; i++) zz[i] *= srcdefn.vto_meter;
  }

  // convert to lat/lng, if needed
  if (srcdefn.is_geocent) {
    if (!zz) {
      error(PJD_ERR_GEOCENTRIC);
    }
    if (srcdefn.to_meter != 1) {
      for (i = 0; i < point_count; i++) {
        if (xx[i] != HUGE_VAL) {
          xx[i] *= srcdefn.to_meter;
          yy[i] *= srcdefn.to_meter;
        }
      }
    }
    pj_geocentric_to_geodetic(srcdefn.a_orig, srcdefn.es_orig, xx, yy, zz);
  } else if (!srcdefn.is_latlong) {
    if (!srcdefn.inv3d && !srcdefn.inv) {
      // Proj.4 returns error code -17 (a bug?)
      fatal('source projection not invertible');
    }
    if (srcdefn.inv3d) {
      fatal('inverse 3d transformations not supported');
    } else {
      for (i = 0; i < point_count; i++) {
        xy.x = xx[i];
        xy.y = yy[i];
        tmp = pj_inv(xy, srcdefn);
        xx[i] = tmp.lam;
        yy[i] = tmp.phi;
        check_fatal_error(); // Proj.4 is a bit different
      }
    }
  }

  if (srcdefn.from_greenwich !== 0) {
    for (i = 0; i < point_count; i++) {
      if (xx[i] != HUGE_VAL) {
        xx[i] += srcdefn.from_greenwich;
      }
    }
  }

  if (srcdefn.has_geoid_vgrids && zz) {
    fatal('vgrid transformation not supported');
  }

  pj_datum_transform(srcdefn, dstdefn, xx, yy, zz);

  if (dstdefn.has_geoid_vgrids && zz) {
    fatal('vgrid transformation not supported');
  }

  if (dstdefn.from_greenwich !== 0) {
    for (i = 0; i < point_count; i++) {
      if (xx[i] != HUGE_VAL) {
        xx[i] -= dstdefn.from_greenwich;
      }
    }
  }

  if (dstdefn.is_geocent) {
    if (!zz) {
      error(PJD_ERR_GEOCENTRIC);
    }
    pj_geodetic_to_geocentric(dstdefn.a_orig, dstdefn.es_orig, xx, yy, zz);

    if (dstdefn.fr_meter != 1) {
      for (i = 0; i < point_count; i++) {
        if (xx[i] != HUGE_VAL) {
          xx[i] *= dstdefn.fr_meter;
          yy[i] *= dstdefn.fr_meter;
        }
      }
    }
  } else if (!dstdefn.is_latlong) {
    if (dstdefn.fwd3d) {
      fatal('3d transformation not supported');
    } else {
      for (i = 0; i < point_count; i++) {
        lp.lam = xx[i];
        lp.phi = yy[i];
        tmp = pj_fwd(lp, dstdefn);
        xx[i] = tmp.x;
        yy[i] = tmp.y;
        check_fatal_error(); // Proj.4 is a bit different
      }
    }
  } else if (dstdefn.is_latlong && dstdefn.is_long_wrap_set) {
    for (i = 0; i < point_count; i++) {
      if (xx[i] == HUGE_VAL) continue;
      while (xx[i] < dstdefn.long_wrap_center - M_PI) {
        xx[i] += M_TWOPI;
      }
      while (xx[i] > dstdefn.long_wrap_center + M_PI) {
        xx[i] -= M_TWOPI;
      }
    }
  }

  if (dstdefn.vto_meter != 1 && zz) {
    for (i = 0; i < point_count; i++) {
      zz[i] *= dstdefn.vfr_meter;
    }
  }
  if (dstdefn.axis != 'enu') {
    pj_adjust_axis(dstdefn.axis, true, xx, yy, zz);
  }

  return point_count == 1 ? ctx.last_errno : 0;
}

function pj_adjust_axis(axis, denormalize_flag, xx, yy, zz) {
  var point_count = xx.length;
  var x_in,
    y_in,
    z_in = 0;
  var i, i_axis, value, target;

  if (!denormalize_flag) {
    for (i = 0; i < point_count; i++) {
      x_in = xx[i];
      y_in = yy[i];
      if (x_in == HUGE_VAL) continue; // not in Proj.4
      if (zz) z_in = zz[i];

      for (i_axis = 0; i_axis < 3; i_axis++) {
        if (i_axis == 0) value = x_in;
        else if (i_axis == 1) value = y_in;
        else value = z_in;

        switch (axis[i_axis]) {
          case 'e':
            xx[i] = value;
            break;
          case 'w':
            xx[i] = -value;
            break;
          case 'n':
            yy[i] = value;
            break;
          case 's':
            yy[i] = -value;
            break;
          case 'u':
            if (zz) zz[i] = value;
            break;
          case 'd':
            if (zz) zz[i] = -value;
            break;
          default:
            error(PJD_ERR_AXIS);
        }
      } /* i_axis */
    } /* i (point) */
  } else {
    /* denormalize */
    for (i = 0; i < point_count; i++) {
      x_in = xx[i];
      y_in = yy[i];
      if (x_in == HUGE_VAL) continue; // not in Proj.4
      if (zz) z_in = zz[i];
      for (i_axis = 0; i_axis < 3; i_axis++) {
        if (i_axis == 2 && !zz) continue;
        if (i_axis == 0) target = xx;
        else if (i_axis == 1) target = yy;
        else target = zz;
        switch (axis[i_axis]) {
          case 'e':
            target[i] = x_in;
            break;
          case 'w':
            target[i] = -x_in;
            break;
          case 'n':
            target[i] = y_in;
            break;
          case 's':
            target[i] = -y_in;
            break;
          case 'u':
            target[i] = z_in;
            break;
          case 'd':
            target[i] = -z_in;
            break;
          default:
            error(PJD_ERR_AXIS);
        }
      } /* i_axis */
    } /* i (point) */
  }
}

function pj_datum_transform(srcdefn, dstdefn, xx, yy, zz) {
  var point_count = xx.length;
  var src_a, src_es, dst_a, dst_es;
  var z_is_temp = false;
  /*      We cannot do any meaningful datum transformation if either      */
  /*      the source or destination are of an unknown datum type          */
  /*      (ie. only a +ellps declaration, no +datum).  This is new        */
  /*      behavior for PROJ 4.6.0                                        */
  if (srcdefn.datum_type == PJD_UNKNOWN || dstdefn.datum_type == PJD_UNKNOWN) {
    return;
  }

  /*      Short cut if the datums are identical.                          */
  if (pj_compare_datums(srcdefn, dstdefn)) {
    return;
  }
  src_a = srcdefn.a_orig;
  src_es = srcdefn.es_orig;
  dst_a = dstdefn.a_orig;
  dst_es = dstdefn.es_orig;
  /*      Create a temporary Z array if one is not provided.              */
  if (!zz) {
    zz = new Float64Array(point_count);
    z_is_temp = true;
  }

  if (srcdefn.datum_type == PJD_GRIDSHIFT) {
    fatal('gridshift not implemented');
    // pj_apply_gridshift_2()
    src_a = SRS_WGS84_SEMIMAJOR;
    src_es = SRS_WGS84_ESQUARED;
  }

  if (dstdefn.datum_type == PJD_GRIDSHIFT) {
    dst_a = SRS_WGS84_SEMIMAJOR;
    dst_es = SRS_WGS84_ESQUARED;
  }

  /*      Do we need to go through geocentric coordinates?                */
  if (
    src_es != dst_es ||
    src_a != dst_a ||
    srcdefn.datum_type == PJD_3PARAM ||
    srcdefn.datum_type == PJD_7PARAM ||
    dstdefn.datum_type == PJD_3PARAM ||
    dstdefn.datum_type == PJD_7PARAM
  ) {
    pj_geodetic_to_geocentric(src_a, src_es, xx, yy, zz);

    if (srcdefn.datum_type == PJD_3PARAM || srcdefn.datum_type == PJD_7PARAM) {
      pj_geocentric_to_wgs84(srcdefn, xx, yy, zz);
    }

    if (dstdefn.datum_type == PJD_3PARAM || dstdefn.datum_type == PJD_7PARAM) {
      pj_geocentric_from_wgs84(dstdefn, xx, yy, zz);
    }

    /*      Convert back to geodetic coordinates.                           */
    pj_geocentric_to_geodetic(dst_a, dst_es, xx, yy, zz);

    /*      Apply grid shift to destination if required.                    */
    if (dstdefn.datum_type == PJD_GRIDSHIFT) {
      pj_apply_gridshift_2(dstdefn, 1, xx, yy, zz);
    }
  }
}

// returns true if datums are equivalent
function pj_compare_datums(srcdefn, dstdefn) {
  if (srcdefn.datum_type != dstdefn.datum_type) return false;
  if (
    srcdefn.a_orig != dstdefn.a_orig ||
    Math.abs(srcdefn.es_orig - dstdefn.es_orig) > 0.00000000005
  ) {
    /* the tolerance for es is to ensure that GRS80 and WGS84 are considered identical */
    return false;
  }
  if (srcdefn.datum_type == PJD_3PARAM) {
    return (
      srcdefn.datum_params[0] == dstdefn.datum_params[0] &&
      srcdefn.datum_params[1] == dstdefn.datum_params[1] &&
      srcdefn.datum_params[2] == dstdefn.datum_params[2]
    );
  }
  if (srcdefn.datum_type == PJD_7PARAM) {
    return (
      srcdefn.datum_params[0] == dstdefn.datum_params[0] &&
      srcdefn.datum_params[1] == dstdefn.datum_params[1] &&
      srcdefn.datum_params[2] == dstdefn.datum_params[2] &&
      srcdefn.datum_params[3] == dstdefn.datum_params[3] &&
      srcdefn.datum_params[4] == dstdefn.datum_params[4] &&
      srcdefn.datum_params[5] == dstdefn.datum_params[5] &&
      srcdefn.datum_params[6] == dstdefn.datum_params[6]
    );
  }
  if (srcdefn.datum_type == PJD_GRIDSHIFT) {
    return (
      pj_param(srcdefn.params, 'snadgrids') ==
      pj_param(dstdefn.params, 'snadgrids')
    );
  }
  return true;
}

function pj_geocentric_to_wgs84(defn, xx, yy, zz) {
  var point_count = xx.length,
    pp = defn.datum_params,
    Dx_BF = pp[0],
    Dy_BF = pp[1],
    Dz_BF = pp[2],
    x,
    y,
    z,
    Rx_BF,
    Ry_BF,
    Rz_BF,
    M_BF,
    i;

  if (defn.datum_type == PJD_3PARAM) {
    for (i = 0; i < point_count; i++) {
      if (xx[i] == HUGE_VAL) continue;
      xx[i] += Dx_BF;
      yy[i] += Dy_BF;
      zz[i] += Dz_BF;
    }
  } else if (defn.datum_type == PJD_7PARAM) {
    Rx_BF = pp[3];
    Ry_BF = pp[4];
    Rz_BF = pp[5];
    M_BF = pp[6];
    for (i = 0; i < point_count; i++) {
      if (xx[i] == HUGE_VAL) continue;
      x = M_BF * (xx[i] - Rz_BF * yy[i] + Ry_BF * zz[i]) + Dx_BF;
      y = M_BF * (Rz_BF * xx[i] + yy[i] - Rx_BF * zz[i]) + Dy_BF;
      z = M_BF * (-Ry_BF * xx[i] + Rx_BF * yy[i] + zz[i]) + Dz_BF;
      xx[i] = x;
      yy[i] = y;
      zz[i] = z;
    }
  }
}

function pj_geocentric_from_wgs84(defn, xx, yy, zz) {
  var point_count = xx.length,
    pp = defn.datum_params,
    Dx_BF = pp[0],
    Dy_BF = pp[1],
    Dz_BF = pp[2],
    x,
    y,
    z,
    Rx_BF,
    Ry_BF,
    Rz_BF,
    M_BF,
    i;

  if (defn.datum_type == PJD_3PARAM) {
    for (i = 0; i < point_count; i++) {
      if (xx[i] == HUGE_VAL) continue;
      xx[i] -= Dx_BF;
      yy[i] -= Dy_BF;
      zz[i] -= Dz_BF;
    }
  } else if (defn.datum_type == PJD_7PARAM) {
    Rx_BF = pp[3];
    Ry_BF = pp[4];
    Rz_BF = pp[5];
    M_BF = pp[6];
    for (i = 0; i < point_count; i++) {
      if (xx[i] == HUGE_VAL) continue;
      x = (xx[i] - Dx_BF) / M_BF;
      y = (yy[i] - Dy_BF) / M_BF;
      z = (zz[i] - Dz_BF) / M_BF;
      xx[i] = x + Rz_BF * y - Ry_BF * z;
      yy[i] = -Rz_BF * x + y + Rx_BF * z;
      zz[i] = Ry_BF * x - Rx_BF * y + z;
    }
  }
}

function pj_geocentric_to_geodetic(a, es, xx, yy, zz) {
  var point_count = xx.length;
  var b, i, gi;
  if (es == 0.0) b = a;
  else b = a * sqrt(1 - es);

  gi = pj_Set_Geocentric_Parameters(a, b);
  if (!gi) {
    error(PJD_ERR_GEOCENTRIC);
  }

  for (i = 0; i < point_count; i++) {
    if (xx[i] != HUGE_VAL) {
      pj_Convert_Geocentric_To_Geodetic(gi, i, xx, yy, zz);
    }
  }
}

function pj_geodetic_to_geocentric(a, es, xx, yy, zz) {
  var point_count = xx.length,
    b,
    i,
    gi;
  if (es === 0) {
    b = a;
  } else {
    b = a * sqrt(1 - es);
  }
  gi = pj_Set_Geocentric_Parameters(a, b);
  if (!gi) {
    error(PJD_ERR_GEOCENTRIC);
  }
  for (i = 0; i < point_count; i++) {
    if (xx[i] == HUGE_VAL) continue;
    if (pj_Convert_Geodetic_To_Geocentric(gi, i, xx, yy, zz)) {
      xx[i] = yy[i] = HUGE_VAL;
    }
  }
}

function adjlon(lon) {
  var SPI = 3.14159265359,
    TWOPI = 6.2831853071795864769,
    ONEPI = 3.14159265358979323846;

  if (fabs(lon) > SPI) {
    lon += ONEPI; /* adjust to 0.0.2pi rad */
    lon -= TWOPI * floor(lon / TWOPI); /* remove integral # of 'revolutions'*/
    lon -= ONEPI; /* adjust back to -pi..pi rad */
  }
  return lon;
}

function pj_fwd_deg(lp, P) {
  var lp2 = { lam: lp.lam * DEG_TO_RAD, phi: lp.phi * DEG_TO_RAD };
  return pj_fwd(lp2, P);
}

function pj_fwd(lp, P) {
  var xy = { x: 0, y: 0 };
  var EPS = 1e-12;
  var t = fabs(lp.phi) - M_HALFPI;

  // if (t > EPS || fabs(lp.lam) > 10) {
  if (!(t <= EPS && fabs(lp.lam) <= 10)) {
    // catch NaNs
    pj_ctx_set_errno(-14);
  } else {
    ctx.last_errno = 0; // clear a previous error
    if (fabs(t) <= EPS) {
      lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
    } else if (P.geoc) {
      lp.phi = atan(P.rone_es * tan(lp.phi));
    }
    lp.lam -= P.lam0;
    if (!P.over) {
      lp.lam = adjlon(lp.lam);
    }
    if (P.fwd) {
      P.fwd(lp, xy);
      xy.x = P.fr_meter * (P.a * xy.x + P.x0);
      xy.y = P.fr_meter * (P.a * xy.y + P.y0);
    } else {
      xy.x = xy.y = HUGE_VAL;
    }
  }
  if (ctx.last_errno || !isFinite(xy.x) || !isFinite(xy.y)) {
    // isFinite() catches NaN and +/- Infinity but not null
    xy.x = xy.y = HUGE_VAL;
  }
  return xy;
}

function pj_inv_deg(xy, P) {
  var lp = pj_inv(xy, P);
  return {
    lam: lp.lam * RAD_TO_DEG,
    phi: lp.phi * RAD_TO_DEG
  };
}

function pj_inv(xy, P) {
  var EPS = 1e-12;
  var lp = { lam: 0, phi: 0 };

  // if (xy.x == HUGE_VAL || xy.y == HUGE_VAL) {
  if (!(xy.x < HUGE_VAL && xy.y < HUGE_VAL)) {
    // catch NaNs
    pj_ctx_set_errno(-15);
  } else {
    ctx.last_errno = 0;
    if (P.inv) {
      xy.x = (xy.x * P.to_meter - P.x0) * P.ra;
      xy.y = (xy.y * P.to_meter - P.y0) * P.ra;
      P.inv(xy, lp);
      lp.lam += P.lam0;
      if (!P.over) {
        lp.lam = adjlon(lp.lam);
      }
      if (P.geoc && fabs(fabs(lp.phi) - M_HALFPI) > EPS) {
        lp.phi = atan(P.one_es * tan(lp.phi));
      }
    } else {
      lp.lam = lp.phi = HUGE_VAL;
    }
  }
  if (ctx.last_errno || !isFinite(lp.lam) || !isFinite(lp.phi)) {
    // isFinite() catches NaN and +/- Infinity but not null
    lp.lam = lp.phi = HUGE_VAL;
  }
  return lp;
}

function get_rtodms(decimals, fixedWidth, pos, neg) {
  var dtodms = get_dtodms(decimals, fixedWidth, pos, neg);
  return function (r) {
    return dtodms(r * RAD_TO_DEG);
  };
}

// returns function for formatting as DMS
// See Proj.4 rtodms.c
// @pos: 'N' or 'E'
// @neg: 'S' or 'W'
function get_dtodms(decimals, fixedWidth, pos, neg) {
  var RES, CONV, i;
  if (decimals < 0 || decimals >= 9) {
    decimals = 3;
  }
  RES = 1;
  for (i = 0; i < decimals; i++) {
    RES *= 10;
  }
  CONV = 3600 * RES;

  return function (r) {
    var sign = '',
      mstr = '',
      sstr = '',
      min,
      sec,
      suff,
      dstr;
    if (r === HUGE_VAL || isNaN(r)) return '';
    if (r < 0) {
      r = -r;
      suff = neg || '';
      if (!suff) {
        sign = '-';
      }
    } else {
      suff = pos || '';
    }
    r = floor(r * CONV + 0.5);
    sec = (r / RES) % 60;
    r = floor(r / (RES * 60));
    min = r % 60;
    dstr = floor(r / 60) + 'd';
    sstr = sec.toFixed(decimals);
    sec = parseFloat(sstr);
    if (sec) {
      sstr = (fixedWidth ? sstr : String(sec)) + '"';
    } else {
      sstr = '';
    }
    if (sec || min) {
      mstr = String(min) + "'";
      if (mstr.length == 2 && fixedWidth) {
        mstr = '0' + mstr;
      }
    }
    return sign + dstr + mstr + sstr + suff;
  };
}

// Support for the proj4js api:
//    proj4(fromProjection[, toProjection, coordinates])

function proj4js(arg1, arg2, arg3) {
  var p, fromStr, toStr, P1, P2, transform;
  if (typeof arg1 != 'string') {
    // E.g. Webpack's require function tries to initialize mproj by calling
    // the module function.
    return api;
  } else if (typeof arg2 != 'string') {
    fromStr = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'; // '+datum=WGS84 +proj=lonlat';
    toStr = arg1;
    p = arg2;
  } else {
    fromStr = arg1;
    toStr = arg2;
    p = arg3;
  }
  P1 = pj_init(fromStr);
  P2 = pj_init(toStr);
  transform = get_proj4js_transform(P1, P2);
  if (p) {
    return transform(p);
  } else {
    return { forward: transform, inverse: get_proj4js_transform(P2, P1) };
  }
}

proj4js.WGS84 = '+proj=longlat +datum=WGS84'; // for compatibility with proj4js tests

// for compatibility with proj4js tests
proj4js.toPoint = function (array) {
  var out = {
    x: array[0],
    y: array[1]
  };
  if (array.length > 2) {
    out.z = array[2];
  }
  if (array.length > 3) {
    out.m = array[3];
  }
  return out;
};

function get_proj4js_transform(P1, P2) {
  return function (p) {
    var useArray = Array.isArray(p);
    p = useArray ? p.concat() : [p.x, p.y];
    pj_transform_point(P1, P2, p);
    if (!useArray) {
      p = { x: p[0], y: p[1] };
    }
    return p;
  };
}

// Fallback WKT definitions include a Proj.4 string in an EXTENSION property.
// They should be readable by QGIS and gdal/ogr, but will not work
// with most other GIS software.

function get_fallback_wkt_maker(P) {
  // TODO: validate P?
  return make_fallback_wkt;
}

function make_fallback_wkt(P) {
  var projName = P.proj in pj_list ? pj_list[P.proj].name : '';
  var proj4 = get_proj_defn(P);
  var geogcs = wkt_make_geogcs(P);
  // GDAL seems to use "unnamed" all the time
  var name = projName ? geogcs.NAME + ' / ' + projName : 'unnamed';
  return {
    PROJCS: {
      NAME: name,
      GEOGCS: geogcs,
      PROJECTION: 'custom_proj4',
      PARAMETER: [],
      UNIT: wkt_make_unit(P),
      EXTENSION: ['PROJ4', proj4 + ' +wktext']
    }
  };
}

function get_fallback_wkt_parser(projcs) {
  var proj4 = get_proj4_from_extension(projcs);
  // TODO: try parsing proj4 string to validate?
  return proj4 ? get_proj4_from_extension : null;
}

function get_proj4_from_extension(projcs) {
  var ext = projcs.EXTENSION;
  if (ext && ext[0] == 'PROJ4') {
    return (ext[1] || '').replace(' +wktext', '');
  }
  return null;
}

// Global collections of WKT parsers and makers
// arr[0] is test function; arr[1] is conversion function
var wkt_makers = [];
var wkt_parsers = [];

// TODO: use utility library
function wkt_is_object(val) {
  return !!val && typeof val == 'object' && !Array.isArray(val);
}

function wkt_is_string(val) {
  return typeof val == 'string';
}

function find_wkt_parser(projcs) {
  var parser = find_wkt_conversion_function(projcs, wkt_parsers);
  if (!parser) {
    parser = get_fallback_wkt_parser(projcs);
  }
  if (!parser) {
    wkt_error('unsupported WKT definition: ' + get_wkt_label(projcs));
  }
  return parser;
}

function find_wkt_maker(P) {
  var maker = find_wkt_conversion_function(P, wkt_makers);
  if (!maker) {
    maker = get_fallback_wkt_maker(P);
  }
  if (!maker) {
    wkt_error('unsupported projection: ' + get_proj_label(P));
  }
  return maker;
}

function find_wkt_conversion_function(o, arr) {
  var is_match;
  for (var i = 0; i < arr.length; i++) {
    is_match = arr[i][0];
    if (is_match(o)) return arr[i][1];
  }
  return null;
}

function get_proj_label(P) {
  return get_proj_id(P) || '[unknown]';
}

function get_wkt_label(o) {
  return o.NAME || '[unknown]';
}

function get_proj_id(P) {
  return pj_param(P.params, 'sproj');
}

function wkt_name_to_slug(name) {
  return name.replace(/[-_ \/]+/g, '_').toLowerCase();
}

function wkt_split_names(names) {
  var arr;
  if (Array.isArray(names)) {
    arr = names;
  } else if (names && names.length > 0) {
    arr = names.split(',');
  }
  return arr;
}

function wkt_error(msg) {
  throw new Error(msg);
}

function wkt_warn(msg) {
  // TODO: consider option to inhibit logging
  //       consider strict mode to throw error
  console.error('[wkt] ' + msg);
}

function wkt_get_unit_defn(projcs) {
  // TODO: consider using unit names
  return {
    to_meter: projcs.UNIT[1]
  };
}

function wkt_convert_unit(PROJCS) {
  var defn = wkt_get_unit_defn(PROJCS);
  var proj4 = '';
  if (defn.to_meter != 1) {
    proj4 = '+to_meter=' + defn.to_meter;
  } else if (!WKT_OMIT_DEFAULTS) {
    proj4 = '+units=m';
  }
  return proj4;
}

function wkt_make_unit(P) {
  return ['Meter', P.to_meter || 1];
}

/*
// OLD -- merge into wkt_make_unit()
function wkt_get_unit(P) {
  var defn = pj_find_units_by_value(P.to_meter);
  var name = defn ? defn.name : 'Unknown';
  return ['UNIT', name, P.to_meter];
}
*/

function wkt_convert_geogcs(geogcs, opts) {
  var datum = geogcs.DATUM,
    spheroid = datum.SPHEROID,
    datumId = wkt_find_datum_id(datum),
    ellId = wkt_find_ellps_id(spheroid),
    aux_sphere = opts && opts.aux_sphere,
    a = spheroid[1],
    rf = spheroid[2],
    str,
    pm;

  wkt_check_units(geogcs.UNIT, 'degree');
  if (aux_sphere) {
    // TODO: in addition to semimajor, ESRI supports spheres based on
    //   semiminor and authalic radii; could support these
    str = '+a=' + spheroid[1];
  } else if (datumId) {
    str = '+datum=' + datumId;
  } else if (ellId) {
    str = '+ellps=' + ellId;
  } else {
    str = '+a=' + a;
    if (rf > 0) {
      str += ' +rf=' + rf;
    }
  }
  if (datum.TOWGS84 && !aux_sphere && !datumId) {
    str += ' +towgs84=' + datum.TOWGS84.join(',');
  }

  pm = geogcs.PRIMEM ? geogcs.PRIMEM[1] : 0;
  if (pm > 0 || pm < 0) {
    str += ' +pm=' + pm; // assuming degrees
  }
  return str;
}

function wkt_find_ellps_id(spheroid) {
  // TODO: match on ellipsoid parameters rather than name
  var aliases = {
    international1924: 'intl'
  };
  var key = wkt_harmonize_geo_name(spheroid[0]);
  var defn;
  if (key in aliases) {
    return aliases[key];
  }
  if (/^grs1980/.test(key)) {
    // handle cases like "GRS 1980(IUGG, 1980)")
    return 'GRS80';
  }
  if (key == 'sphere') {
    // not a well defined ellipsoid
    // TODO: if we check ellipsoid params, this test can go away
    return null;
  }
  for (var i = 0; i < pj_ellps.length; i++) {
    defn = pj_ellps[i];
    if (
      wkt_harmonize_geo_name(defn[3]) == key ||
      wkt_harmonize_geo_name(defn[0]) == key
    ) {
      break;
    }
  }
  return defn ? defn[0] : null;
}

function wkt_find_datum_id(datum) {
  var aliases = {
    // ESRI aliases
    northamerican1983: 'NAD83',
    newzealand1949: 'nzgd49'
  };
  var key = wkt_harmonize_geo_name(datum.NAME);
  var defn;
  if (key in aliases) {
    return aliases[key];
  }
  for (var i = 0; i < pj_datums.length; i++) {
    defn = pj_datums[i];
    if (
      wkt_harmonize_geo_name(defn[3]) == key ||
      wkt_harmonize_geo_name(defn[0]) == key
    ) {
      break;
    }
  }
  return defn ? defn[0] : null;
}

function wkt_harmonize_geo_name(name) {
  return (name || '')
    .replace(/^(GCS|D)_/i, '')
    .replace(/[ _]/g, '')
    .toLowerCase();
}

function wkt_check_units(UNIT, expect) {
  if (UNIT && UNIT[0].toLowerCase() != expect) {
    wkt_error('unexpected geographic units: ' + geogcs.UNIT[0]);
  }
}

// Converts a PROJCS WKT in object format to a Proj.4 string
// Throws an Error if unable to convert
function wkt_convert_projcs(projcs) {
  return find_wkt_parser(projcs)(projcs);
}

function wkt_simple_projcs_converter(projId, paramIds) {
  return wkt_projcs_converter({
    PROJECTION: wkt_simple_projection_converter(projId),
    PARAMETER: wkt_parameter_converter(paramIds)
  });
}

function wkt_simple_projection_converter(id) {
  return function () {
    return '+proj=' + id;
  };
}

function wkt_projcs_converter(o) {
  return function (projcs) {
    var projStr = o.PROJECTION(projcs);
    var paramStr = o.PARAMETER(projcs);
    var geogStr = o.GEOGCS
      ? o.GEOGCS(projcs)
      : wkt_convert_geogcs(projcs.GEOGCS);
    var unitStr = wkt_convert_unit(projcs);
    return [projStr, paramStr, geogStr, unitStr, '+no_defs']
      .filter(function (s) {
        return !!s;
      })
      .join(' ');
  };
}

// Functions for exporting a wkt GEOGCS definition

function wkt_make_geogcs(P) {
  var geogcs = {
    NAME: wkt_get_geogcs_name(P),
    DATUM: wkt_make_datum(P),
    PRIMEM: ['Greenwich', 0], // TODO: don't assume greenwich
    UNIT: ['degree', 0.017453292519943295] // TODO: support other units
  };
  return geogcs;
}

function wkt_make_datum(P) {
  var datum = {
    NAME: wkt_get_datum_name(P),
    SPHEROID: wkt_make_spheroid(P)
  };
  var towgs84 = pj_param(P.params, 'stowgs84');
  if (/[1-9]/.test(towgs84)) {
    // only adding TOWGS84 if transformation is non-zero
    datum.TOWGS84 = towgs84;
  }
  return datum;
}

function wkt_make_spheroid(P) {
  var rf;
  if (pj_param(P.params, 'trf')) {
    rf = pj_param(P.params, 'drf');
  } else if (P.es) {
    rf = 1 / (1 - Math.sqrt(1 - P.es));
  } else {
    rf = 0;
  }
  return [wkt_get_ellps_name(P), P.a, rf];
}

function wkt_get_geogcs_name(P) {
  var name;
  if (pj_is_latlong(P)) {
    name = wkt_get_init_name(P);
  }
  if (!name) {
    name = wkt_get_datum_id(P);
    if (/^[a-z]+$/.test(name)) {
      name = name[0].toUpperCase() + name.substr(1);
    } else {
      name = name.toUpperCase();
    }
  }
  return name || 'UNK';
}

function wkt_get_ellps_name(P) {
  var ellps = find_ellps(wkt_get_ellps_id(P));
  return ellps ? ellps.name : 'Unknown ellipsoid';
}

function wkt_get_datum_name(P) {
  var defn = find_datum(wkt_get_datum_id(P));
  return (defn && defn.name) || 'Unknown datum';
}

function wkt_get_datum_id(P) {
  return pj_param(P.params, 'sdatum');
}

function wkt_get_ellps_id(P) {
  var datumId = wkt_get_datum_id(P),
    datum = datumId ? find_datum(datumId) : null,
    ellpsId;
  if (datum) {
    ellpsId = datum.ellipse_id;
  } else {
    ellpsId = pj_param(P.params, 'sellps');
  }
  return ellpsId || '';
}

// Converts a Proj object to a WKT in object format
function wkt_make_projcs(P) {
  return find_wkt_maker(P)(P);
}

function wkt_simple_projcs_maker(wktProjection, paramIds) {
  return wkt_projcs_maker({
    PROJECTION: wktProjection,
    PARAMETER: wkt_parameter_maker(paramIds)
  });
}

function wkt_projcs_maker(o) {
  return function (P) {
    var projcs = {
      // if o.NAME GEOGCS exists and returns falsy value, use default function
      GEOGCS: (o.GEOGCS && o.GEOGCS(P)) || wkt_make_geogcs(P),
      PROJECTION: wkt_is_string(o.PROJECTION) ? o.PROJECTION : o.PROJECTION(P),
      PARAMETER: o.PARAMETER(P),
      UNIT: wkt_make_unit(P)
    };
    // if o.NAME function exists and returns falsy value, use default name
    projcs.NAME =
      (o.NAME && o.NAME(P, projcs)) || wkt_make_default_projcs_name(P, projcs);
    return { PROJCS: projcs };
  };
}

// Get CS name from comment in +init source (if +init param is present)
function wkt_get_init_name(P) {
  var o;
  if (pj_param(P.params, 'tinit')) {
    o = pj_read_init_opts(pj_param(P.params, 'sinit'));
  }
  return o ? o.comment : '';
}

function wkt_make_default_projcs_name(P, projcs) {
  var initName = wkt_get_init_name(P);
  return initName || projcs.GEOGCS.NAME + ' / ' + projcs.PROJECTION;
}

function add_simple_wkt_parser(projId, wktProjections, params) {
  var is_match = get_simple_parser_test(wktProjections);
  var convert = wkt_simple_projcs_converter(projId, params);
  add_wkt_parser(is_match, convert);
}

function add_simple_wkt_maker(projId, wktProjection, params) {
  var is_match = get_simple_maker_test(projId);
  var make = wkt_simple_projcs_maker(wktProjection, params);
  // add_wkt_maker(is_match, wkt_make_projcs);
  add_wkt_maker(is_match, make);
}

function get_simple_parser_test(wktNames) {
  var slugs = wkt_split_names(wktNames).map(wkt_name_to_slug);
  return function (obj) {
    var wktName = obj.PROJECTION[0]; // TODO: handle unexpected structure
    return slugs.indexOf(wkt_name_to_slug(wktName)) > -1;
  };
}

function get_simple_maker_test(projId) {
  return function (P) {
    var id = get_proj_id(P);
    return id && id == projId;
  };
}

function add_wkt_parser(is_match, parse) {
  if (typeof is_match != 'function') wkt_error('Missing WKT parser test');
  if (typeof parse != 'function') wkt_error('Missing WKT parse function');
  wkt_parsers.push([is_match, parse]);
}

function add_wkt_maker(is_match, make) {
  if (typeof is_match != 'function') wkt_error('Missing WKT maker test');
  if (typeof make != 'function') wkt_error('Missing WKT maker function');
  wkt_makers.push([is_match, make]);
}

add_wkt_parser(wkt_is_utm, wkt_to_utm);
add_wkt_parser(wkt_is_ups, wkt_to_ups);

add_wkt_maker(get_simple_maker_test('utm'), wkt_from_utm);
add_wkt_maker(get_simple_maker_test('ups'), wkt_from_ups);

var WKT_UTM = /UTM_zone_([0-9]{1,2})(N|S)/i;
var WKT_UPS = /UPS_(North|South)/i;

function wkt_is_utm(projcs) {
  return WKT_UTM.test(wkt_name_to_slug(projcs.NAME));
}

function wkt_is_ups(projcs) {
  return WKT_UPS.test(wkt_name_to_slug(projcs.NAME));
}

function wkt_to_utm(projcs) {
  return wkt_projcs_converter({
    PROJECTION: wkt_simple_projection_converter('utm'),
    PARAMETER: utm_params
  })(projcs);

  function utm_params(projcs) {
    var match = WKT_UTM.exec(wkt_name_to_slug(projcs.NAME));
    var params = '+zone=' + match[1];
    if (match[2].toLowerCase() == 's') params += ' +south';
    return params;
  }
}

function wkt_to_ups(projcs) {
  return wkt_projcs_converter({
    PROJECTION: wkt_simple_projection_converter('ups'),
    PARAMETER: ups_params
  })(projcs);

  function ups_params(projcs) {
    var match = WKT_UPS.exec(wkt_name_to_slug(projcs.NAME));
    return match[1].toLowerCase() == 'south' ? '+south' : '';
  }
}

function wkt_from_utm(P) {
  return wkt_projcs_maker({
    NAME: wkt_make_utm_name,
    PROJECTION: function () {
      return 'Transverse_Mercator';
    },
    PARAMETER: wkt_make_utm_params
  })(P);
}

function wkt_from_ups(P) {
  return wkt_projcs_maker({
    NAME: wkt_make_ups_name,
    PROJECTION: function () {
      return 'Polar_Stereographic';
    },
    PARAMETER: wkt_make_ups_params
  })(P);
}

function wkt_make_utm_name(P, projcs) {
  return (
    projcs.GEOGCS.NAME +
    ' / UTM zone ' +
    pj_param(P.params, 'szone') +
    (pj_param(P.params, 'tsouth') ? 'S' : 'N')
  );
}

function wkt_make_ups_name(P, projcs) {
  return (
    projcs.GEOGCS.NAME +
    ' / UPS ' +
    (pj_param(P.params, 'tsouth') ? 'South' : 'North')
  );
}

function wkt_make_utm_params(P) {
  var lon0 = (P.lam0 * 180) / M_PI;
  return [
    ['latitude_of_origin', 0],
    ['central_meridian', lon0],
    ['scale_factor', P.k0],
    ['false_easting', P.x0],
    ['false_northing', P.y0]
  ];
}

function wkt_make_ups_params(P) {
  return [
    ['latitude_of_origin', -90],
    ['central_meridian', 0],
    ['scale_factor', 0.994],
    ['false_easting', 2000000],
    ['false_northing', 2000000]
  ];
}

// Mercator_2SP references:
//    http://geotiff.maptools.org/proj_list/mercator_2sp.html
//    http://www.remotesensing.org/geotiff/proj_list/mercator_2sp.html
//    https://trac.osgeo.org/gdal/ticket/4861

add_wkt_parser(
  get_simple_parser_test(
    'Mercator_2SP,Mercator_1SP,Mercator,Mercator_Auxiliary_Sphere'
  ),
  wkt_projcs_converter({
    GEOGCS: wkt_convert_merc_geogcs,
    PROJECTION: wkt_simple_projection_converter('merc'),
    PARAMETER: wkt_convert_merc_params
  })
);

add_wkt_maker(
  get_simple_maker_test('merc'),
  wkt_projcs_maker({
    GEOGCS: wkt_make_merc_geogcs,
    PROJECTION: wkt_make_merc_projection,
    PARAMETER: wkt_make_merc_params,
    NAME: wkt_make_merc_name
  })
);

function wkt_make_merc_name(P) {
  return wkt_proj4_is_webmercator(P) ? 'WGS 84 / Pseudo-Mercator' : null;
}

function wkt_make_merc_geogcs(P) {
  // PROBLEM: no clear way to get geographic cs from proj4 string
  // ... so assuming WGS 84 (consider using spherical datum instead)
  if (wkt_proj4_is_webmercator(P)) {
    return wkt_make_geogcs(pj_init('+proj=longlat +datum=WGS84'));
  }
  return null;
}

function wkt_convert_merc_geogcs(projcs) {
  var opts = wkt_projcs_is_webmercator(projcs) ? { aux_sphere: true } : null;
  return wkt_convert_geogcs(projcs.GEOGCS, opts);
}

function wkt_make_merc_projection(P) {
  return wkt_proj4_is_merc_2sp(P) ? 'Mercator_2SP' : 'Mercator_1SP';
}

function wkt_convert_merc_params(projcs) {
  // TODO: handle (esri) standard_parallel_1 in 1sp version
  // 1sp version accepts latitude_of_origin (ogc) or standard_parallel_1 (esri)
  // var rules = wkt_projcs_is_merc_2sp(projcs) ? 'lat_ts,lat_0b' : 'lat_tsb,lat_ts';
  var rules = wkt_projcs_is_merc_2sp(projcs)
    ? 'lat_ts,lat_0b'
    : 'lat_tsb,lat_ts';
  return wkt_parameter_converter(rules)(projcs);
}

function wkt_make_merc_params(P) {
  var rules = wkt_proj4_is_merc_2sp(P) ? 'lat_ts,lat_0b' : 'lat_tsb';
  return wkt_parameter_maker(rules)(P);
}

function wkt_projcs_is_merc_2sp(projcs) {
  var param = wkt_find_parameter_by_name(projcs, 'standard_parallel_1');
  return param && param[1] != 0;
}

function wkt_proj4_is_merc_2sp(P) {
  return pj_param(P.params, 'tlat_ts') && pj_param(P.params, 'dlat_ts') != 0;
}

function wkt_projcs_is_webmercator(projcs) {
  return /(Web_Mercator|Pseudo_Mercator)/i.test(wkt_name_to_slug(projcs.NAME));
}

// TODO: support other spheroids (web mercator may be used for other planets)
function wkt_proj4_is_webmercator(P) {
  return P.es === 0 && P.a == 6378137;
}

// Reference:
// http://proj4.org/parameters.html

var wkt_common_params = [
  ['x_0', 'false_easting', 'm'],
  ['y_0', 'false_northing', 'm'],
  ['k_0', 'scale_factor', 'f'],
  ['lat_0', 'latitude_of_center'],
  ['lon_0', 'central_meridian']
];

var wkt_param_table = {
  lat_0b: ['lat_0', 'latitude_of_origin'],
  lat_0c: ['lat_0', null], // lcc 1sp, stere
  lat_0d: ['lat_0', 'standard_parallel_1'], // stere (esri), merc (esri)
  lat_1: ['lat_1', 'standard_parallel_1'],
  lat_1b: ['lat_1', 'latitude_of_point_1'], // omerc,tpeqd
  lat_1c: ['lat_1', 'latitude_of_origin'], // lcc
  lat_2: ['lat_2', 'standard_parallel_2'],
  lat_2b: ['lat_2', 'latitude_of_point_2'], // omerc,tpeqd
  lat_ts: ['lat_ts', 'standard_parallel_1'], // cea,eqc,merc,stere,wag3,wink1
  lat_tsb: ['lat_ts', 'latitude_of_origin'], // merc
  lonc: ['lonc', 'central_meridian'], // omerc,ocea
  lon_1: ['lon_1', 'longitude_of_point_1'], // omerc,tpeqd
  lon_2: ['lon_2', 'longitude_of_point_2'], // omerc,tpeqd
  alpha: ['alpha', 'azimuth'], // omerc,ocea
  gamma: ['gamma', 'rectified_grid_angle'], // omerc
  h: ['h', 'height', 'f'] // nsper
};

// non-standard name -> standard name
// TODO: consider accepting standard_parallel_1 as (esri) alias for latitude_of_center / latitude_of_origin
var wkt_param_aliases = {
  longitude_of_center: 'central_meridian',
  latitude_of_origin: 'latitude_of_center',
  latitude_of_center: 'latitude_of_origin',
  longitude_of_1st_point: 'longitude_of_point_1',
  longitude_of_2nd_point: 'longitude_of_point_2',
  latitude_of_1st_point: 'latitude_of_point_1',
  latitude_of_2nd_point: 'latitude_of_point_2',
  // proj4
  k: 'k_0'
};

// Convert a wkt PARAMETER name to a proj4 param id
function wkt_convert_param_name_old(wktName, proj) {
  var defn = wkt_find_param_defn_old(proj, function (defn) {
    return defn[1] == wktName;
  });
  return defn ? defn[0] : '';
}

// @proj Proj.4 projection id
function wkt_find_param_defn_old(proj, test) {
  var defn, projs;
  for (var i = 0; i < wkt_params.length; i++) {
    defn = wkt_params[i];
    projs = defn[3];
    if (projs && projs.split(',').indexOf(proj) == -1) continue;
    if (test(defn)) return defn;
  }
  return null;
}

function wkt_find_defn(name, idx, arr) {
  for (var i = 0; i < arr.length; i++) {
    // returns first match (additional matches -- aliases -- may be present)
    if (arr[i][idx] === name) return arr[i];
  }
  return null;
}

function wkt_find_parameter_defn(name, idx, rules) {
  var defn = null;
  name = name.toLowerCase();
  defn = wkt_find_defn(name, idx, rules);
  if (!defn && name in wkt_param_aliases) {
    defn = wkt_find_defn(wkt_param_aliases[name], idx, rules);
  }
  return defn;
}

function wkt_convert_parameter(defn, value, unitDefn) {
  var name = defn[0],
    type = defn[2];
  if (type == 'm') {
    value *= unitDefn.to_meter;
  }
  if (WKT_OMIT_DEFAULTS) {
    if (
      ('x_0,y_0,lat_0,lon_0'.indexOf(name) > -1 && value === 0) ||
      (name == 'k_0' && value == 1)
    ) {
      return;
    }
  }
  return '+' + name + '=' + value;
}

function wkt_make_parameter(defn, strVal, toMeter) {
  var type = defn[2],
    val;
  if (type == 'm') {
    val = parseFloat(strVal) / toMeter;
  } else if (type == 'f') {
    val = parseFloat(strVal);
  } else {
    val = dmstod(strVal); // default is decimal degrees or DMS
  }
  return [defn[1], val];
}

function wkt_find_parameter_by_name(projcs, name) {
  var params = projcs.PARAMETER || [];
  var paramName;
  for (var i = 0; i < params.length; i++) {
    paramName = params[i][0].toLowerCase();
    if (name === paramName || name === wkt_param_aliases[paramName]) {
      return params[i];
    }
  }
  return null;
}

function wkt_get_parameter_value(projcs, name) {
  var param = wkt_find_parameter_by_name(projcs, name);
  return param === null ? null : param[1];
}

function wkt_get_parameter_rules(ids) {
  var rules = null;
  if (ids) {
    rules = wkt_split_names(ids).reduce(function (memo, id) {
      var rule = wkt_param_table[id];
      if (!rule) wkt_error('missing parameter rule: ' + id);
      memo.push(rule);
      return memo;
    }, []);
  }
  return (rules || []).concat(wkt_common_params);
}

function wkt_parameter_converter(extraRules) {
  return function (projcs) {
    var parts = [];
    var rules = wkt_get_parameter_rules(extraRules);
    var unitDefn = wkt_get_unit_defn(projcs);
    (projcs.PARAMETER || []).forEach(function (param) {
      // handle no params
      var defn = wkt_find_parameter_defn(param[0], 1, rules);
      var proj4;
      if (!defn) {
        wkt_warn('unhandled parameter: ' + param[0]);
      } else {
        proj4 = wkt_convert_parameter(defn, param[1], unitDefn);
        if (proj4) parts.push(proj4);
      }
    });
    return parts.join(' ');
  };
}

function wkt_parameter_maker(extraRules) {
  return function (P) {
    var params = [];
    var rules = wkt_get_parameter_rules(extraRules);
    // TODO: think about how to add default params omitted from proj4 defn
    // TODO: think about detecting unused params in proj4 defn
    Object.keys(P.params).forEach(function (key) {
      var defn = wkt_find_parameter_defn(key, 0, rules);
      var sval;
      if (defn && defn[1]) {
        // handle dummy rules with null wkt param name (see wkt_lcc.js)
        sval = pj_param(P.params, 's' + key);
        params.push(wkt_make_parameter(defn, sval, P.to_meter));
      }
    });
    return params;
  };
}

add_wkt_parser(
  get_simple_parser_test(
    'Lambert_Conformal_Conic,Lambert_Conformal_Conic_1SP,Lambert_Conformal_Conic_2SP'
  ),
  wkt_projcs_converter({
    PROJECTION: wkt_simple_projection_converter('lcc'),
    PARAMETER: wkt_convert_lcc_params
  })
);

add_wkt_maker(
  get_simple_maker_test('lcc'),
  wkt_projcs_maker({
    PROJECTION: wkt_make_lcc_projection,
    PARAMETER: wkt_make_lcc_params
  })
);

function wkt_make_lcc_params(P) {
  var params = wkt_proj4_is_lcc_1sp(P) ? 'lat_1c,lat_0c' : 'lat_0b,lat_1,lat_2';
  return wkt_parameter_maker(params)(P);
}

function wkt_convert_lcc_params(projcs) {
  var params = wkt_projcs_is_lcc_1sp(projcs) ? 'lat_1c' : 'lat_0b,lat_1,lat_2';
  return wkt_parameter_converter(params)(projcs);
}

function wkt_make_lcc_projection(P) {
  return wkt_proj4_is_lcc_1sp(P)
    ? 'Lambert_Conformal_Conic_1SP'
    : 'Lambert_Conformal_Conic_2SP';
}

function wkt_projcs_is_lcc_1sp(projcs) {
  return !wkt_find_parameter_by_name(projcs, 'standard_parallel_2');
}

function wkt_proj4_is_lcc_1sp(P) {
  return !('lat_1' in P.params && 'lat_2' in P.params);
}

// Type A
add_wkt_parser(
  get_simple_parser_test(
    'Hotine_Oblique_Mercator,Hotine_Oblique_Mercator_Azimuth_Natural_Origin'
  ),
  wkt_projcs_converter({
    PROJECTION: wkt_simple_projection_converter('omerc'),
    PARAMETER: function (P) {
      return wkt_parameter_converter('alpha,gamma,lonc')(P) + ' +no_uoff';
    }
  })
);
add_wkt_maker(
  wkt_proj4_is_omerc_A,
  wkt_simple_projcs_maker('Hotine_Oblique_Mercator', 'alpha,gamma,lonc')
);

// Type B
add_simple_wkt_parser(
  'omerc',
  'Oblique_Mercator,Hotine_Oblique_Mercator_Azimuth_Center',
  'alpha,gamma,lonc'
);
add_wkt_maker(
  wkt_proj4_is_omerc_B,
  wkt_simple_projcs_maker('Oblique_Mercator', 'alpha,gamma,lonc')
);

// Two-point version
add_simple_wkt_parser(
  'omerc',
  'Hotine_Oblique_Mercator_Two_Point_Natural_Origin',
  'lat_1b,lat_2b,lon_1,lon_2'
);
add_wkt_maker(
  wkt_proj4_is_omerc_2pt,
  wkt_simple_projcs_maker(
    'Hotine_Oblique_Mercator_Two_Point_Natural_Origin',
    'lat_1b,lat_2b,lon_1,lon_2'
  )
);

function wkt_proj4_is_omerc_2pt(P) {
  return (
    get_proj_id(P) == 'omerc' && 'lat_2' in P.params && 'lon_2' in P.params
  );
}

function wkt_proj4_is_omerc(P) {
  return (
    get_proj_id(P) == 'omerc' && ('alpha' in P.params || 'gamma' in P.params)
  );
}

function wkt_proj4_is_omerc_A(P) {
  return (
    wkt_proj4_is_omerc(P) && ('no_uoff' in P.params || 'no_off' in P.params)
  );
}

function wkt_proj4_is_omerc_B(P) {
  return wkt_proj4_is_omerc(P) && !wkt_proj4_is_omerc_A(P);
}

// add_simple_wkt_parser('stere', ['Stereographic', 'Polar_Stereographic', 'Stereographic_North_Pole', 'Stereographic_South_Pole']);

/*
  Stereographic vs. Polar Stereographic from geotiff
  http://geotiff.maptools.org/proj_list/polar_stereographic.html
  http://geotiff.maptools.org/proj_list/stereographic.html
  http://geotiff.maptools.org/proj_list/random_issues.html#stereographic
*/

add_wkt_parser(
  get_simple_parser_test(
    'Stereographic,Polar_Stereographic,Stereographic_North_Pole,Stereographic_South_Pole'
  ),
  wkt_projcs_converter({
    PROJECTION: wkt_simple_projection_converter('stere'),
    PARAMETER: wkt_convert_stere_params
  })
);

add_wkt_maker(
  get_simple_maker_test('stere'),
  wkt_projcs_maker({
    PROJECTION: wkt_make_stere_projection,
    PARAMETER: wkt_make_stere_params
  })
);

function wkt_convert_stere_params(projcs) {
  // assuming not oblique; TOOD: verify not oblique
  var params = wkt_parameter_converter('lat_ts,lat_tsb')(projcs);
  var match = /lat_ts=([^ ]+)/.exec(params);
  if (match && params.indexOf('lat_0=') == -1) {
    // Add +lat_0=90 or +lat_0=-90
    params = '+lat_0=' + (parseFloat(match[1]) < 0 ? -90 : 90) + ' ' + params;
  }
  return params;
}

function wkt_make_stere_projection(P) {
  // switching to stere -> Stereographic, to match ogr2ogr output
  // return wkt_proj4_is_stere_polar(P) ? 'Polar_Stereographic' : 'Oblique_Stereographic';
  return wkt_proj4_is_stere_polar(P) ? 'Polar_Stereographic' : 'Stereographic';
}

function wkt_make_stere_params(P) {
  return wkt_proj4_is_stere_polar(P)
    ? wkt_parameter_maker('lat_tsb,lat_0c')(P) // lat_ts -> latitude_of_origin, lat_0 -> null
    : wkt_parameter_maker('lat_0b')(P); // lat_0 -> latitude_of_origin
}

function wkt_proj4_is_stere_polar(P) {
  return pj_param(P.params, 'tlat_ts');
}

add_simple_wkt_maker('vandg', 'VanDerGrinten');
add_wkt_parser(
  get_simple_parser_test('VanDerGrinten,Van_der_Grinten_I'),
  wkt_projcs_converter({
    PROJECTION: wkt_simple_projection_converter('vandg'),
    PARAMETER: function (P) {
      var params = wkt_parameter_converter('')(P);
      if (params) params += ' ';
      return params + '+R_A';
    }
  })
);

/*
// projections still missing WKT conversion
[
  ['airy', ''],
  ['boggs', ''],
  ['crast', 'Craster_Parabolic'],
  ['gn_sinu', ''],
  ['gstmerc', 'Gauss_Schreiber_Transverse_Mercator'], // https://trac.osgeo.org/gdal/ticket/2663
  ['geos', 'Geostationary_Satellite'],
  ['goode', 'Goode_Homolosine'],
  ['igh', 'Interrupted_Goode_Homolosine'],
  ['imw_p', 'International_Map_of_the_World_Polyconic'],
  ['kav7', ''],
  ['krovak', 'Krovak'],
  ['laborde', 'Laborde_Oblique_Mercator'],
  ['mbtfps', ''],
  ['nell_h', ''],
  ['ocea', ''], // see OneNote notes
  ['qua_aut', 'Quartic_Authalic'],
  ['', 'Swiss_Oblique_Cylindrical'], // http://www.remotesensing.org/geotiff/proj_list/swiss_oblique_cylindrical.html
  ['', 'Transverse_Mercator_South_Orientated'], // http://www.remotesensing.org/geotiff/proj_list/transverse_mercator_south_oriented.html
]
*/

// Add simple conversion functions
// optional third field gives alternate parameters (defined in wkt_parameters.js)
[
  ['aitoff', 'Aitoff', 'lat1'],
  ['aea', 'Albers_Conic_Equal_Area,Albers', 'lat_1,lat_2'],
  ['aeqd', 'Azimuthal_Equidistant'],
  ['bonne', 'Bonne', 'lat_1'],
  ['cass', 'Cassini_Soldner,Cassini'],
  ['cea', 'Cylindrical_Equal_Area', 'lat_ts'],
  ['eck1', 'Eckert_I'],
  ['eck2', 'Eckert_II'],
  ['eck3', 'Eckert_III'],
  ['eck4', 'Eckert_IV'],
  ['eck5', 'Eckert_V'],
  ['eck6', 'Eckert_VI'],
  ['eqdc', 'Equidistant_Conic', 'lat_1,lat_2'],
  ['eqc', 'Plate_Carree,Equirectangular,Equidistant_Cylindrical', 'lat_ts'],
  ['gall', 'Gall_Stereographic'],
  ['gnom', 'Gnomonic'],
  ['laea', 'Lambert_Azimuthal_Equal_Area'],
  ['loxim', 'Loximuthal', 'lat_1'],
  ['mill', 'Miller_Cylindrical'],
  ['moll', 'Mollweide'],
  ['nsper', 'Vertical_Near_Side_Perspective', 'h'],
  ['nzmg', 'New_Zealand_Map_Grid', 'lat_0b'],
  ['ortho', 'Orthographic', 'lat_0b'],
  ['poly', 'Polyconic'],
  ['robin', 'Robinson'],
  ['sinu', 'Sinusoidal'],
  ['sterea', 'Oblique_Stereographic,Double_Stereographic'], // http://geotiff.maptools.org/proj_list/oblique_stereographic.html
  ['tmerc', 'Transverse_Mercator,Gauss_Kruger', 'lat_0b'],
  ['tpeqd', 'Two_Point_Equidistant', 'lat_1b,lat_2b,lon_1,lon_2'],
  // ['vandg', 'VanDerGrinten,Van_der_Grinten_I'], // slight complication, see wkt_vandg.js
  ['wag1', 'Wagner_I'],
  ['wag2', 'Wagner_II'],
  ['wag3', 'Wagner_III', 'lat_ts'],
  ['wag4', 'Wagner_IV'],
  ['wag5', 'Wagner_V'],
  ['wag6', 'Wagner_VI'],
  ['wag7', 'Wagner_VII'],
  ['wink1', 'Winkel_I', 'lat_ts'],
  ['wink2', 'Winkel_II'],
  ['wintri', 'Winkel_Tripel', 'lat_1']
].forEach(function (arr) {
  var alternateParams = arr[2] || null;
  add_simple_wkt_parser(arr[0], arr[1], alternateParams);
  add_simple_wkt_maker(arr[0], arr[1].split(',')[0], alternateParams);
});

function wkt_stringify(o) {
  var str = JSON.stringify(wkt_stringify_reorder(o));
  str = str.replace(/\["([A-Z0-9]+)",/g, '$1['); // convert JSON arrays to WKT
  // remove quotes from AXIS values (not supported: UP|DOWN|OTHER etc.)
  // see (http://www.geoapi.org/apidocs/org/opengis/referencing/doc-files/WKT.html)
  str = str.replace(/"(EAST|NORTH|SOUTH|WEST)"/g, '$1');
  return str;
}

function wkt_sort_order(key) {
  // supported WKT names in sorted order
  var names =
    'NAME,PROJCS,GEOGCS,GEOCCS,DATUM,SPHEROID,PRIMEM,PROJECTION,PARAMETER,UNIT,AXIS';
  return names.indexOf(key) + 1 || 999;
}

function wkt_keys(o) {
  var keys = Object.keys(o);
  return keys.sort(function (a, b) {
    return wkt_sort_order(a) - wkt_sort_order(b);
  });
}

// Rearrange a generated WKT object for easier string conversion
// inverse of wkt_parse_reorder()
function wkt_stringify_reorder(o, depth) {
  var arr = [],
    e;
  depth = depth || 0;
  wkt_keys(o).forEach(function (name) {
    var val = o[name];
    if (wkt_is_object(val)) {
      arr.push([name].concat(wkt_stringify_reorder(val, depth + 1)));
    } else if (name == 'NAME') {
      arr.push(wkt_is_string(val) ? val : val[0]);
    } else if (name == 'PARAMETER' || name == 'AXIS') {
      val.forEach(function (param) {
        arr.push([name].concat(param));
      });
    } else if (wkt_is_string(val)) {
      arr.push([name, val]);
    } else if (Array.isArray(val)) {
      arr.push([name].concat(val));
    } else {
      e = {};
      e[name] = val;
      wkt_error('Incorrectly formatted WKT element: ' + JSON.stringify(e));
    }
  });
  if (depth === 0 && arr.length == 1) {
    arr = arr[0]; // kludge to remove top-level array
  }
  return arr;
}

function wkt_parse(str) {
  var obj = {};
  wkt_unpack(str).forEach(function (part) {
    wkt_parse_reorder(part, obj);
  });
  return obj;
}

// Convert WKT string to a JS object
// WKT format: http://docs.opengeospatial.org/is/12-063r5/12-063r5.html#11
function wkt_unpack(str) {
  var obj;
  // Convert WKT escaped quotes to JSON escaped quotes
  // str = str.replace(/""/g, '\\"'); // BUGGY
  str = convert_wkt_quotes(str);

  // Convert WKT entities to JSON arrays
  str = str.replace(/([A-Z0-9]+)\[/g, '["$1",');

  // Enclose axis keywords in quotes to create valid JSON strings
  str = str.replace(/, *([a-zA-Z]+) *(?=[,\]])/g, ',"$1"');

  // str = str.replace(/[^\]]*$/, ''); // esri .prj string may have extra stuff appended

  // WKT may have a "VERTCS" section after "PROJCS" section; enclosing contents
  //   in brackets to create valid JSON array.
  str = '[' + str + ']';

  try {
    obj = JSON.parse(str);
  } catch (e) {
    wkt_error('unparsable WKT format');
  }
  return obj;
}

// Convert WKT escaped quotes to JSON escaped quotes ("" -> \")
function convert_wkt_quotes(str) {
  var c = 0;
  return str.replace(/"+/g, function (s) {
    var even = c % 2 == 0;
    c += s.length;
    // ordinary, unescaped quotes
    if (s == '"' || (s == '""' && even)) return s;
    // WKT-escaped quotes
    if (even) {
      return '"' + s.substring(1).replace(/""/g, '\\"');
    } else {
      return s.replace(/""/g, '\\"');
    }
  });
}

// Rearrange a subarray of a parsed WKT file for easier traversal
// E.g.
//   ["WGS84", ...]  to  {NAME: "WGS84"}
//   ["PROJECTION", "Mercator"]  to  {PROJECTION: "Mercator"}
//   ["PARAMETER", <param1>], ...  to  {PARAMETER: [<param1>, ...]}
function wkt_parse_reorder(arr, obj) {
  var name = arr[0], // TODO: handle alternate OGC names
    i;
  if (
    name == 'GEOGCS' ||
    name == 'GEOCCS' ||
    name == 'PROJCS' ||
    name == 'DATUM' ||
    name == 'VERTCS'
  ) {
    obj[name] = {
      NAME: arr[1]
    };
    for (i = 2; i < arr.length; i++) {
      if (Array.isArray(arr[i])) {
        wkt_parse_reorder(arr[i], obj[name]);
      } else {
        throw wkt_error('WKT parse error');
      }
    }
  } else if (name == 'AXIS' || name == 'PARAMETER') {
    if (name in obj === false) {
      obj[name] = [];
    }
    obj[name].push(arr.slice(1));
  } else {
    obj[name] = arr.slice(1);
  }
  return obj;
}

var WKT_OMIT_DEFAULTS = true;

function wkt_from_proj4(P) {
  var obj;
  if (P.length) P = pj_init(P); // convert proj4 string
  if (pj_is_latlong(P)) {
    obj = { GEOGCS: wkt_make_geogcs(P) };
  } else {
    obj = wkt_make_projcs(P);
  }
  return wkt_stringify(obj);
}

// @str A WKT CRS definition string (e.g. contents of a .prj file)
function wkt_to_proj4(str) {
  var o = wkt_parse(str);
  var proj4;

  if (o.PROJCS) {
    proj4 = wkt_convert_projcs(o.PROJCS);
  } else if (o.GEOGCS) {
    proj4 = '+proj=longlat ' + wkt_convert_geogcs(o.GEOGCS);
  } else if (o.GEOCCS) {
    wkt_error('geocentric coordinates are not supported');
  } else {
    wkt_error('missing a supported WKT CS type');
  }
  return proj4;
}

/*
 * Math.js
 * Transcription of Math.hpp, Constants.hpp, and Accumulator.hpp into
 * JavaScript.
 *
 * Copyright (c) Charles Karney (2011-2017) <charles@karney.com> and licensed
 * under the MIT/X11 License.  For more information, see
 * https://geographiclib.sourceforge.io/
 */

/**
 * @namespace GeographicLib
 * @description The parent namespace for the following modules:
 * - {@link module:GeographicLib/Geodesic GeographicLib/Geodesic} The main
 *   engine for solving geodesic problems via the
 *   {@link module:GeographicLib/Geodesic.Geodesic Geodesic} class.
 * - {@link module:GeographicLib/GeodesicLine GeographicLib/GeodesicLine}
 *   computes points along a single geodesic line via the
 *   {@link module:GeographicLib/GeodesicLine.GeodesicLine GeodesicLine}
 *   class.
 * - {@link module:GeographicLib/PolygonArea GeographicLib/PolygonArea}
 *   computes the area of a geodesic polygon via the
 *   {@link module:GeographicLib/PolygonArea.PolygonArea PolygonArea}
 *   class.
 * - {@link module:GeographicLib/DMS GeographicLib/DMS} handles the decoding
 *   and encoding of angles in degree, minutes, and seconds, via static
 *   functions in this module.
 * - {@link module:GeographicLib/Constants GeographicLib/Constants} defines
 *   constants specifying the version numbers and the parameters for the WGS84
 *   ellipsoid.
 *
 * The following modules are used internally by the package:
 * - {@link module:GeographicLib/Math GeographicLib/Math} defines various
 *   mathematical functions.
 * - {@link module:GeographicLib/Accumulator GeographicLib/Accumulator}
 *   interally used by
 *   {@link module:GeographicLib/PolygonArea.PolygonArea PolygonArea} (via the
 *   {@link module:GeographicLib/Accumulator.Accumulator Accumulator} class)
 *   for summing the contributions to the area of a polygon.
 */
('use strict');
var GeographicLib = {};
GeographicLib.Constants = {};
GeographicLib.Math = {};
GeographicLib.Accumulator = {};

(function (
  /**
   * @exports GeographicLib/Constants
   * @description Define constants defining the version and WGS84 parameters.
   */
  c
) {
  /**
   * @constant
   * @summary WGS84 parameters.
   * @property {number} a the equatorial radius (meters).
   * @property {number} f the flattening.
   */
  c.WGS84 = { a: 6378137, f: 1 / 298.257223563 };
  /**
   * @constant
   * @summary an array of version numbers.
   * @property {number} major the major version number.
   * @property {number} minor the minor version number.
   * @property {number} patch the patch number.
   */
  c.version = { major: 1, minor: 48, patch: 0 };
  /**
   * @constant
   * @summary version string
   */
  c.version_string = '1.48';
})(GeographicLib.Constants);

(function (
  /**
   * @exports GeographicLib/Math
   * @description Some useful mathematical constants and functions (mainly for
   *   internal use).
   */
  m
) {
  /**
   * @summary The number of digits of precision in floating-point numbers.
   * @constant {number}
   */
  m.digits = 53;
  /**
   * @summary The machine epsilon.
   * @constant {number}
   */
  m.epsilon = Math.pow(0.5, m.digits - 1);
  /**
   * @summary The factor to convert degrees to radians.
   * @constant {number}
   */
  m.degree = Math.PI / 180;

  /**
   * @summary Square a number.
   * @param {number} x the number.
   * @returns {number} the square.
   */
  m.sq = function (x) {
    return x * x;
  };

  /**
   * @summary The hypotenuse function.
   * @param {number} x the first side.
   * @param {number} y the second side.
   * @returns {number} the hypotenuse.
   */
  m.hypot = function (x, y) {
    var a, b;
    x = Math.abs(x);
    y = Math.abs(y);
    a = Math.max(x, y);
    b = Math.min(x, y) / (a ? a : 1);
    return a * Math.sqrt(1 + b * b);
  };

  /**
   * @summary Cube root function.
   * @param {number} x the argument.
   * @returns {number} the real cube root.
   */
  m.cbrt = function (x) {
    var y = Math.pow(Math.abs(x), 1 / 3);
    return x < 0 ? -y : y;
  };

  /**
   * @summary The log1p function.
   * @param {number} x the argument.
   * @returns {number} log(1 + x).
   */
  m.log1p = function (x) {
    var y = 1 + x,
      z = y - 1;
    // Here's the explanation for this magic: y = 1 + z, exactly, and z
    // approx x, thus log(y)/z (which is nearly constant near z = 0) returns
    // a good approximation to the true log(1 + x)/x.  The multiplication x *
    // (log(y)/z) introduces little additional error.
    return z === 0 ? x : (x * Math.log(y)) / z;
  };

  /**
   * @summary Inverse hyperbolic tangent.
   * @param {number} x the argument.
   * @returns {number} tanh<sup>&minus;1</sup> x.
   */
  m.atanh = function (x) {
    var y = Math.abs(x); // Enforce odd parity
    y = m.log1p((2 * y) / (1 - y)) / 2;
    return x < 0 ? -y : y;
  };

  /**
   * @summary Copy the sign.
   * @param {number} x gives the magitude of the result.
   * @param {number} y gives the sign of the result.
   * @returns {number} value with the magnitude of x and with the sign of y.
   */
  m.copysign = function (x, y) {
    return Math.abs(x) * (y < 0 || (y === 0 && 1 / y < 0) ? -1 : 1);
  };

  /**
   * @summary An error-free sum.
   * @param {number} u
   * @param {number} v
   * @returns {object} sum with sum.s = round(u + v) and sum.t is u + v &minus;
   *   round(u + v)
   */
  m.sum = function (u, v) {
    var s = u + v,
      up = s - v,
      vpp = s - up,
      t;
    up -= u;
    vpp -= v;
    t = -(up + vpp);
    // u + v =       s      + t
    //       = round(u + v) + t
    return { s: s, t: t };
  };

  /**
   * @summary Evaluate a polynomial.
   * @param {integer} N the order of the polynomial.
   * @param {array} p the coefficient array (of size N + 1) (leading
   *   order coefficient first)
   * @param {number} x the variable.
   * @returns {number} the value of the polynomial.
   */
  m.polyval = function (N, p, s, x) {
    var y = N < 0 ? 0 : p[s++];
    while (--N >= 0) y = y * x + p[s++];
    return y;
  };

  /**
   * @summary Coarsen a value close to zero.
   * @param {number} x
   * @returns {number} the coarsened value.
   */
  m.AngRound = function (x) {
    // The makes the smallest gap in x = 1/16 - nextafter(1/16, 0) = 1/2^57 for
    // reals = 0.7 pm on the earth if x is an angle in degrees.  (This is about
    // 1000 times more resolution than we get with angles around 90 degrees.)
    // We use this to avoid having to deal with near singular cases when x is
    // non-zero but tiny (e.g., 1.0e-200).  This converts -0 to +0; however
    // tiny negative numbers get converted to -0.
    if (x === 0) return x;
    var z = 1 / 16,
      y = Math.abs(x);
    // The compiler mustn't "simplify" z - (z - y) to y
    y = y < z ? z - (z - y) : y;
    return x < 0 ? -y : y;
  };

  /**
   * @summary Normalize an angle.
   * @param {number} x the angle in degrees.
   * @returns {number} the angle reduced to the range (&minus;180&deg;,
   *   180&deg;].
   */
  m.AngNormalize = function (x) {
    // Place angle in [-180, 180).
    x = x % 360;
    return x <= -180 ? x + 360 : x <= 180 ? x : x - 360;
  };

  /**
   * @summary Normalize a latitude.
   * @param {number} x the angle in degrees.
   * @returns {number} x if it is in the range [&minus;90&deg;, 90&deg;],
   *   otherwise return NaN.
   */
  m.LatFix = function (x) {
    // Replace angle with NaN if outside [-90, 90].
    return Math.abs(x) > 90 ? Number.NaN : x;
  };

  /**
   * @summary The exact difference of two angles reduced to (&minus;180&deg;,
   *   180&deg;]
   * @param {number} x the first angle in degrees.
   * @param {number} y the second angle in degrees.
   * @return {object} diff the exact difference, y &minus; x.
   *
   * This computes z = y &minus; x exactly, reduced to (&minus;180&deg;,
   * 180&deg;]; and then sets diff.s = d = round(z) and diff.t = e = z &minus;
   * round(z).  If d = &minus;180, then e &gt; 0; If d = 180, then e &le; 0.
   */
  m.AngDiff = function (x, y) {
    // Compute y - x and reduce to [-180,180] accurately.
    var r = m.sum(m.AngNormalize(-x), m.AngNormalize(y)),
      d = m.AngNormalize(r.s),
      t = r.t;
    return m.sum(d === 180 && t > 0 ? -180 : d, t);
  };

  /**
   * @summary Evaluate the sine and cosine function with the argument in
   *   degrees
   * @param {number} x in degrees.
   * @returns {object} r with r.s = sin(x) and r.c = cos(x).
   */
  m.sincosd = function (x) {
    // In order to minimize round-off errors, this function exactly reduces
    // the argument to the range [-45, 45] before converting it to radians.
    var r, q, s, c, sinx, cosx;
    r = x % 360;
    q = Math.floor(r / 90 + 0.5);
    r -= 90 * q;
    // now abs(r) <= 45
    r *= this.degree;
    // Possibly could call the gnu extension sincos
    s = Math.sin(r);
    c = Math.cos(r);
    switch (q & 3) {
      case 0:
        sinx = s;
        cosx = c;
        break;
      case 1:
        sinx = c;
        cosx = -s;
        break;
      case 2:
        sinx = -s;
        cosx = -c;
        break;
      default:
        sinx = -c;
        cosx = s;
        break; // case 3
    }
    if (x) {
      sinx += 0;
      cosx += 0;
    }
    return { s: sinx, c: cosx };
  };

  /**
   * @summary Evaluate the atan2 function with the result in degrees
   * @param {number} y
   * @param {number} x
   * @returns atan2(y, x) in degrees, in the range (&minus;180&deg;
   *   180&deg;].
   */
  m.atan2d = function (y, x) {
    // In order to minimize round-off errors, this function rearranges the
    // arguments so that result of atan2 is in the range [-pi/4, pi/4] before
    // converting it to degrees and mapping the result to the correct
    // quadrant.
    var q = 0,
      t,
      ang;
    if (Math.abs(y) > Math.abs(x)) {
      t = x;
      x = y;
      y = t;
      q = 2;
    }
    if (x < 0) {
      x = -x;
      ++q;
    }
    // here x >= 0 and x >= abs(y), so angle is in [-pi/4, pi/4]
    ang = Math.atan2(y, x) / this.degree;
    switch (q) {
      // Note that atan2d(-0.0, 1.0) will return -0.  However, we expect that
      // atan2d will not be called with y = -0.  If need be, include
      //
      //   case 0: ang = 0 + ang; break;
      //
      // and handle mpfr as in AngRound.
      case 1:
        ang = (y >= 0 ? 180 : -180) - ang;
        break;
      case 2:
        ang = 90 - ang;
        break;
      case 3:
        ang = -90 + ang;
        break;
    }
    return ang;
  };
})(GeographicLib.Math);

(function (
  /**
   * @exports GeographicLib/Accumulator
   * @description Accurate summation via the
   *   {@link module:GeographicLib/Accumulator.Accumulator Accumulator} class
   *   (mainly for internal use).
   */
  a,
  m
) {
  /**
   * @class
   * @summary Accurate summation of many numbers.
   * @classdesc This allows many numbers to be added together with twice the
   *   normal precision.  In the documentation of the member functions, sum
   *   stands for the value currently held in the accumulator.
   * @param {number | Accumulator} [y = 0]  set sum = y.
   */
  a.Accumulator = function (y) {
    this.Set(y);
  };

  /**
   * @summary Set the accumulator to a number.
   * @param {number | Accumulator} [y = 0] set sum = y.
   */
  a.Accumulator.prototype.Set = function (y) {
    if (!y) y = 0;
    if (y.constructor === a.Accumulator) {
      this._s = y._s;
      this._t = y._t;
    } else {
      this._s = y;
      this._t = 0;
    }
  };

  /**
   * @summary Add a number to the accumulator.
   * @param {number} [y = 0] set sum += y.
   */
  a.Accumulator.prototype.Add = function (y) {
    // Here's Shewchuk's solution...
    // Accumulate starting at least significant end
    var u = m.sum(y, this._t),
      v = m.sum(u.s, this._s);
    u = u.t;
    this._s = v.s;
    this._t = v.t;
    // Start is _s, _t decreasing and non-adjacent.  Sum is now (s + t + u)
    // exactly with s, t, u non-adjacent and in decreasing order (except
    // for possible zeros).  The following code tries to normalize the
    // result.  Ideally, we want _s = round(s+t+u) and _u = round(s+t+u -
    // _s).  The follow does an approximate job (and maintains the
    // decreasing non-adjacent property).  Here are two "failures" using
    // 3-bit floats:
    //
    // Case 1: _s is not equal to round(s+t+u) -- off by 1 ulp
    // [12, -1] - 8 -> [4, 0, -1] -> [4, -1] = 3 should be [3, 0] = 3
    //
    // Case 2: _s+_t is not as close to s+t+u as it shold be
    // [64, 5] + 4 -> [64, 8, 1] -> [64,  8] = 72 (off by 1)
    //                    should be [80, -7] = 73 (exact)
    //
    // "Fixing" these problems is probably not worth the expense.  The
    // representation inevitably leads to small errors in the accumulated
    // values.  The additional errors illustrated here amount to 1 ulp of
    // the less significant word during each addition to the Accumulator
    // and an additional possible error of 1 ulp in the reported sum.
    //
    // Incidentally, the "ideal" representation described above is not
    // canonical, because _s = round(_s + _t) may not be true.  For
    // example, with 3-bit floats:
    //
    // [128, 16] + 1 -> [160, -16] -- 160 = round(145).
    // But [160, 0] - 16 -> [128, 16] -- 128 = round(144).
    //
    if (this._s === 0)
      // This implies t == 0,
      this._s = u;
    // so result is u
    else this._t += u; // otherwise just accumulate u to t.
  };

  /**
   * @summary Return the result of adding a number to sum (but
   *   don't change sum).
   * @param {number} [y = 0] the number to be added to the sum.
   * @return sum + y.
   */
  a.Accumulator.prototype.Sum = function (y) {
    var b;
    if (!y) return this._s;
    else {
      b = new a.Accumulator(this);
      b.Add(y);
      return b._s;
    }
  };

  /**
   * @summary Set sum = &minus;sum.
   */
  a.Accumulator.prototype.Negate = function () {
    this._s *= -1;
    this._t *= -1;
  };
})(GeographicLib.Accumulator, GeographicLib.Math);

/*
 * Geodesic.js
 * Transcription of Geodesic.[ch]pp into JavaScript.
 *
 * See the documentation for the C++ class.  The conversion is a literal
 * conversion from C++.
 *
 * The algorithms are derived in
 *
 *    Charles F. F. Karney,
 *    Algorithms for geodesics, J. Geodesy 87, 43-55 (2013);
 *    https://doi.org/10.1007/s00190-012-0578-z
 *    Addenda: https://geographiclib.sourceforge.io/geod-addenda.html
 *
 * Copyright (c) Charles Karney (2011-2017) <charles@karney.com> and licensed
 * under the MIT/X11 License.  For more information, see
 * https://geographiclib.sourceforge.io/
 */

// Load AFTER Math.js

GeographicLib.Geodesic = {};
GeographicLib.GeodesicLine = {};
GeographicLib.PolygonArea = {};

(function (
  /**
   * @exports GeographicLib/Geodesic
   * @description Solve geodesic problems via the
   *   {@link module:GeographicLib/Geodesic.Geodesic Geodesic} class.
   */
  g,
  l,
  p,
  m,
  c
) {
  var GEOGRAPHICLIB_GEODESIC_ORDER = 6,
    nA1_ = GEOGRAPHICLIB_GEODESIC_ORDER,
    nA2_ = GEOGRAPHICLIB_GEODESIC_ORDER,
    nA3_ = GEOGRAPHICLIB_GEODESIC_ORDER,
    nA3x_ = nA3_,
    nC3x_,
    nC4x_,
    maxit1_ = 20,
    maxit2_ = maxit1_ + m.digits + 10,
    tol0_ = m.epsilon,
    tol1_ = 200 * tol0_,
    tol2_ = Math.sqrt(tol0_),
    tolb_ = tol0_ * tol1_,
    xthresh_ = 1000 * tol2_,
    CAP_NONE = 0,
    CAP_ALL = 0x1f,
    CAP_MASK = CAP_ALL,
    OUT_ALL = 0x7f80,
    astroid,
    A1m1f_coeff,
    C1f_coeff,
    C1pf_coeff,
    A2m1f_coeff,
    C2f_coeff,
    A3_coeff,
    C3_coeff,
    C4_coeff;

  g.tiny_ = Math.sqrt(Number.MIN_VALUE);
  g.nC1_ = GEOGRAPHICLIB_GEODESIC_ORDER;
  g.nC1p_ = GEOGRAPHICLIB_GEODESIC_ORDER;
  g.nC2_ = GEOGRAPHICLIB_GEODESIC_ORDER;
  g.nC3_ = GEOGRAPHICLIB_GEODESIC_ORDER;
  g.nC4_ = GEOGRAPHICLIB_GEODESIC_ORDER;
  nC3x_ = (g.nC3_ * (g.nC3_ - 1)) / 2;
  nC4x_ = (g.nC4_ * (g.nC4_ + 1)) / 2;
  g.CAP_C1 = 1 << 0;
  g.CAP_C1p = 1 << 1;
  g.CAP_C2 = 1 << 2;
  g.CAP_C3 = 1 << 3;
  g.CAP_C4 = 1 << 4;

  g.NONE = 0;
  g.ARC = 1 << 6;
  g.LATITUDE = (1 << 7) | CAP_NONE;
  g.LONGITUDE = (1 << 8) | g.CAP_C3;
  g.AZIMUTH = (1 << 9) | CAP_NONE;
  g.DISTANCE = (1 << 10) | g.CAP_C1;
  g.STANDARD = g.LATITUDE | g.LONGITUDE | g.AZIMUTH | g.DISTANCE;
  g.DISTANCE_IN = (1 << 11) | g.CAP_C1 | g.CAP_C1p;
  g.REDUCEDLENGTH = (1 << 12) | g.CAP_C1 | g.CAP_C2;
  g.GEODESICSCALE = (1 << 13) | g.CAP_C1 | g.CAP_C2;
  g.AREA = (1 << 14) | g.CAP_C4;
  g.ALL = OUT_ALL | CAP_ALL;
  g.LONG_UNROLL = 1 << 15;
  g.OUT_MASK = OUT_ALL | g.LONG_UNROLL;

  g.SinCosSeries = function (sinp, sinx, cosx, c) {
    // Evaluate
    // y = sinp ? sum(c[i] * sin( 2*i    * x), i, 1, n) :
    //            sum(c[i] * cos((2*i+1) * x), i, 0, n-1)
    // using Clenshaw summation.  N.B. c[0] is unused for sin series
    // Approx operation count = (n + 5) mult and (2 * n + 2) add
    var k = c.length, // Point to one beyond last element
      n = k - (sinp ? 1 : 0),
      ar = 2 * (cosx - sinx) * (cosx + sinx), // 2 * cos(2 * x)
      y0 = n & 1 ? c[--k] : 0,
      y1 = 0; // accumulators for sum
    // Now n is even
    n = Math.floor(n / 2);
    while (n--) {
      // Unroll loop x 2, so accumulators return to their original role
      y1 = ar * y0 - y1 + c[--k];
      y0 = ar * y1 - y0 + c[--k];
    }
    return sinp
      ? 2 * sinx * cosx * y0 // sin(2 * x) * y0
      : cosx * (y0 - y1); // cos(x) * (y0 - y1)
  };

  astroid = function (x, y) {
    // Solve k^4+2*k^3-(x^2+y^2-1)*k^2-2*y^2*k-y^2 = 0 for positive
    // root k.  This solution is adapted from Geocentric::Reverse.
    var k,
      p = m.sq(x),
      q = m.sq(y),
      r = (p + q - 1) / 6,
      S,
      r2,
      r3,
      disc,
      u,
      T3,
      T,
      ang,
      v,
      uv,
      w;
    if (!(q === 0 && r <= 0)) {
      // Avoid possible division by zero when r = 0 by multiplying
      // equations for s and t by r^3 and r, resp.
      S = (p * q) / 4; // S = r^3 * s
      r2 = m.sq(r);
      r3 = r * r2;
      // The discriminant of the quadratic equation for T3.  This is
      // zero on the evolute curve p^(1/3)+q^(1/3) = 1
      disc = S * (S + 2 * r3);
      u = r;
      if (disc >= 0) {
        T3 = S + r3;
        // Pick the sign on the sqrt to maximize abs(T3).  This
        // minimizes loss of precision due to cancellation.  The
        // result is unchanged because of the way the T is used
        // in definition of u.
        T3 += T3 < 0 ? -Math.sqrt(disc) : Math.sqrt(disc); // T3 = (r * t)^3
        // N.B. cbrt always returns the real root.  cbrt(-8) = -2.
        T = m.cbrt(T3); // T = r * t
        // T can be zero; but then r2 / T -> 0.
        u += T + (T !== 0 ? r2 / T : 0);
      } else {
        // T is complex, but the way u is defined the result is real.
        ang = Math.atan2(Math.sqrt(-disc), -(S + r3));
        // There are three possible cube roots.  We choose the
        // root which avoids cancellation.  Note that disc < 0
        // implies that r < 0.
        u += 2 * r * Math.cos(ang / 3);
      }
      v = Math.sqrt(m.sq(u) + q); // guaranteed positive
      // Avoid loss of accuracy when u < 0.
      uv = u < 0 ? q / (v - u) : u + v; // u+v, guaranteed positive
      w = (uv - q) / (2 * v); // positive?
      // Rearrange expression for k to avoid loss of accuracy due to
      // subtraction.  Division by 0 not possible because uv > 0, w >= 0.
      k = uv / (Math.sqrt(uv + m.sq(w)) + w); // guaranteed positive
    } else {
      // q == 0 && r <= 0
      // y = 0 with |x| <= 1.  Handle this case directly.
      // for y small, positive root is k = abs(y)/sqrt(1-x^2)
      k = 0;
    }
    return k;
  };

  A1m1f_coeff = [
    // (1-eps)*A1-1, polynomial in eps2 of order 3
    +1, 4, 64, 0, 256
  ];

  // The scale factor A1-1 = mean value of (d/dsigma)I1 - 1
  g.A1m1f = function (eps) {
    var p = Math.floor(nA1_ / 2),
      t = m.polyval(p, A1m1f_coeff, 0, m.sq(eps)) / A1m1f_coeff[p + 1];
    return (t + eps) / (1 - eps);
  };

  C1f_coeff = [
    // C1[1]/eps^1, polynomial in eps2 of order 2
    -1, 6, -16, 32,
    // C1[2]/eps^2, polynomial in eps2 of order 2
    -9, 64, -128, 2048,
    // C1[3]/eps^3, polynomial in eps2 of order 1
    +9, -16, 768,
    // C1[4]/eps^4, polynomial in eps2 of order 1
    +3, -5, 512,
    // C1[5]/eps^5, polynomial in eps2 of order 0
    -7, 1280,
    // C1[6]/eps^6, polynomial in eps2 of order 0
    -7, 2048
  ];

  // The coefficients C1[l] in the Fourier expansion of B1
  g.C1f = function (eps, c) {
    var eps2 = m.sq(eps),
      d = eps,
      o = 0,
      l,
      p;
    for (l = 1; l <= g.nC1_; ++l) {
      // l is index of C1p[l]
      p = Math.floor((g.nC1_ - l) / 2); // order of polynomial in eps^2
      c[l] = (d * m.polyval(p, C1f_coeff, o, eps2)) / C1f_coeff[o + p + 1];
      o += p + 2;
      d *= eps;
    }
  };

  C1pf_coeff = [
    // C1p[1]/eps^1, polynomial in eps2 of order 2
    +205, -432, 768, 1536,
    // C1p[2]/eps^2, polynomial in eps2 of order 2
    +4005, -4736, 3840, 12288,
    // C1p[3]/eps^3, polynomial in eps2 of order 1
    -225, 116, 384,
    // C1p[4]/eps^4, polynomial in eps2 of order 1
    -7173, 2695, 7680,
    // C1p[5]/eps^5, polynomial in eps2 of order 0
    +3467, 7680,
    // C1p[6]/eps^6, polynomial in eps2 of order 0
    +38081, 61440
  ];

  // The coefficients C1p[l] in the Fourier expansion of B1p
  g.C1pf = function (eps, c) {
    var eps2 = m.sq(eps),
      d = eps,
      o = 0,
      l,
      p;
    for (l = 1; l <= g.nC1p_; ++l) {
      // l is index of C1p[l]
      p = Math.floor((g.nC1p_ - l) / 2); // order of polynomial in eps^2
      c[l] = (d * m.polyval(p, C1pf_coeff, o, eps2)) / C1pf_coeff[o + p + 1];
      o += p + 2;
      d *= eps;
    }
  };

  A2m1f_coeff = [
    // (eps+1)*A2-1, polynomial in eps2 of order 3
    -11, -28, -192, 0, 256
  ];

  // The scale factor A2-1 = mean value of (d/dsigma)I2 - 1
  g.A2m1f = function (eps) {
    var p = Math.floor(nA2_ / 2),
      t = m.polyval(p, A2m1f_coeff, 0, m.sq(eps)) / A2m1f_coeff[p + 1];
    return (t - eps) / (1 + eps);
  };

  C2f_coeff = [
    // C2[1]/eps^1, polynomial in eps2 of order 2
    +1, 2, 16, 32,
    // C2[2]/eps^2, polynomial in eps2 of order 2
    +35, 64, 384, 2048,
    // C2[3]/eps^3, polynomial in eps2 of order 1
    +15, 80, 768,
    // C2[4]/eps^4, polynomial in eps2 of order 1
    +7, 35, 512,
    // C2[5]/eps^5, polynomial in eps2 of order 0
    +63, 1280,
    // C2[6]/eps^6, polynomial in eps2 of order 0
    +77, 2048
  ];

  // The coefficients C2[l] in the Fourier expansion of B2
  g.C2f = function (eps, c) {
    var eps2 = m.sq(eps),
      d = eps,
      o = 0,
      l,
      p;
    for (l = 1; l <= g.nC2_; ++l) {
      // l is index of C2[l]
      p = Math.floor((g.nC2_ - l) / 2); // order of polynomial in eps^2
      c[l] = (d * m.polyval(p, C2f_coeff, o, eps2)) / C2f_coeff[o + p + 1];
      o += p + 2;
      d *= eps;
    }
  };

  /**
   * @class
   * @property {number} a the equatorial radius (meters).
   * @property {number} f the flattening.
   * @summary Initialize a Geodesic object for a specific ellipsoid.
   * @classdesc Performs geodesic calculations on an ellipsoid of revolution.
   *   The routines for solving the direct and inverse problems return an
   *   object with some of the following fields set: lat1, lon1, azi1, lat2,
   *   lon2, azi2, s12, a12, m12, M12, M21, S12.  See {@tutorial 2-interface},
   *   "The results".
   * @example
   * var GeographicLib = require("geographiclib"),
   *     geod = GeographicLib.Geodesic.WGS84;
   * var inv = geod.Inverse(1,2,3,4);
   * console.log("lat1 = " + inv.lat1 + ", lon1 = " + inv.lon1 +
   *             ", lat2 = " + inv.lat2 + ", lon2 = " + inv.lon2 +
   *             ",\nazi1 = " + inv.azi1 + ", azi2 = " + inv.azi2 +
   *             ", s12 = " + inv.s12);
   * @param {number} a the equatorial radius of the ellipsoid (meters).
   * @param {number} f the flattening of the ellipsoid.  Setting f = 0 gives
   *   a sphere (on which geodesics are great circles).  Negative f gives a
   *   prolate ellipsoid.
   * @throws an error if the parameters are illegal.
   */
  g.Geodesic = function (a, f) {
    this.a = a;
    this.f = f;
    this._f1 = 1 - this.f;
    this._e2 = this.f * (2 - this.f);
    this._ep2 = this._e2 / m.sq(this._f1); // e2 / (1 - e2)
    this._n = this.f / (2 - this.f);
    this._b = this.a * this._f1;
    // authalic radius squared
    this._c2 =
      (m.sq(this.a) +
        m.sq(this._b) *
          (this._e2 === 0
            ? 1
            : (this._e2 > 0
                ? m.atanh(Math.sqrt(this._e2))
                : Math.atan(Math.sqrt(-this._e2))) /
              Math.sqrt(Math.abs(this._e2)))) /
      2;
    // The sig12 threshold for "really short".  Using the auxiliary sphere
    // solution with dnm computed at (bet1 + bet2) / 2, the relative error in
    // the azimuth consistency check is sig12^2 * abs(f) * min(1, 1-f/2) / 2.
    // (Error measured for 1/100 < b/a < 100 and abs(f) >= 1/1000.  For a given
    // f and sig12, the max error occurs for lines near the pole.  If the old
    // rule for computing dnm = (dn1 + dn2)/2 is used, then the error increases
    // by a factor of 2.)  Setting this equal to epsilon gives sig12 = etol2.
    // Here 0.1 is a safety factor (error decreased by 100) and max(0.001,
    // abs(f)) stops etol2 getting too large in the nearly spherical case.
    this._etol2 =
      (0.1 * tol2_) /
      Math.sqrt(
        (Math.max(0.001, Math.abs(this.f)) * Math.min(1.0, 1 - this.f / 2)) / 2
      );
    if (!(isFinite(this.a) && this.a > 0))
      throw new Error('Equatorial radius is not positive');
    if (!(isFinite(this._b) && this._b > 0))
      throw new Error('Polar semi-axis is not positive');
    this._A3x = new Array(nA3x_);
    this._C3x = new Array(nC3x_);
    this._C4x = new Array(nC4x_);
    this.A3coeff();
    this.C3coeff();
    this.C4coeff();
  };

  A3_coeff = [
    // A3, coeff of eps^5, polynomial in n of order 0
    -3, 128,
    // A3, coeff of eps^4, polynomial in n of order 1
    -2, -3, 64,
    // A3, coeff of eps^3, polynomial in n of order 2
    -1, -3, -1, 16,
    // A3, coeff of eps^2, polynomial in n of order 2
    +3, -1, -2, 8,
    // A3, coeff of eps^1, polynomial in n of order 1
    +1, -1, 2,
    // A3, coeff of eps^0, polynomial in n of order 0
    +1, 1
  ];

  // The scale factor A3 = mean value of (d/dsigma)I3
  g.Geodesic.prototype.A3coeff = function () {
    var o = 0,
      k = 0,
      j,
      p;
    for (j = nA3_ - 1; j >= 0; --j) {
      // coeff of eps^j
      p = Math.min(nA3_ - j - 1, j); // order of polynomial in n
      this._A3x[k++] = m.polyval(p, A3_coeff, o, this._n) / A3_coeff[o + p + 1];
      o += p + 2;
    }
  };

  C3_coeff = [
    // C3[1], coeff of eps^5, polynomial in n of order 0
    +3, 128,
    // C3[1], coeff of eps^4, polynomial in n of order 1
    +2, 5, 128,
    // C3[1], coeff of eps^3, polynomial in n of order 2
    -1, 3, 3, 64,
    // C3[1], coeff of eps^2, polynomial in n of order 2
    -1, 0, 1, 8,
    // C3[1], coeff of eps^1, polynomial in n of order 1
    -1, 1, 4,
    // C3[2], coeff of eps^5, polynomial in n of order 0
    +5, 256,
    // C3[2], coeff of eps^4, polynomial in n of order 1
    +1, 3, 128,
    // C3[2], coeff of eps^3, polynomial in n of order 2
    -3, -2, 3, 64,
    // C3[2], coeff of eps^2, polynomial in n of order 2
    +1, -3, 2, 32,
    // C3[3], coeff of eps^5, polynomial in n of order 0
    +7, 512,
    // C3[3], coeff of eps^4, polynomial in n of order 1
    -10, 9, 384,
    // C3[3], coeff of eps^3, polynomial in n of order 2
    +5, -9, 5, 192,
    // C3[4], coeff of eps^5, polynomial in n of order 0
    +7, 512,
    // C3[4], coeff of eps^4, polynomial in n of order 1
    -14, 7, 512,
    // C3[5], coeff of eps^5, polynomial in n of order 0
    +21, 2560
  ];

  // The coefficients C3[l] in the Fourier expansion of B3
  g.Geodesic.prototype.C3coeff = function () {
    var o = 0,
      k = 0,
      l,
      j,
      p;
    for (l = 1; l < g.nC3_; ++l) {
      // l is index of C3[l]
      for (j = g.nC3_ - 1; j >= l; --j) {
        // coeff of eps^j
        p = Math.min(g.nC3_ - j - 1, j); // order of polynomial in n
        this._C3x[k++] =
          m.polyval(p, C3_coeff, o, this._n) / C3_coeff[o + p + 1];
        o += p + 2;
      }
    }
  };

  C4_coeff = [
    // C4[0], coeff of eps^5, polynomial in n of order 0
    +97, 15015,
    // C4[0], coeff of eps^4, polynomial in n of order 1
    +1088, 156, 45045,
    // C4[0], coeff of eps^3, polynomial in n of order 2
    -224, -4784, 1573, 45045,
    // C4[0], coeff of eps^2, polynomial in n of order 3
    -10656, 14144, -4576, -858, 45045,
    // C4[0], coeff of eps^1, polynomial in n of order 4
    +64, 624, -4576, 6864, -3003, 15015,
    // C4[0], coeff of eps^0, polynomial in n of order 5
    +100, 208, 572, 3432, -12012, 30030, 45045,
    // C4[1], coeff of eps^5, polynomial in n of order 0
    +1, 9009,
    // C4[1], coeff of eps^4, polynomial in n of order 1
    -2944, 468, 135135,
    // C4[1], coeff of eps^3, polynomial in n of order 2
    +5792, 1040, -1287, 135135,
    // C4[1], coeff of eps^2, polynomial in n of order 3
    +5952, -11648, 9152, -2574, 135135,
    // C4[1], coeff of eps^1, polynomial in n of order 4
    -64, -624, 4576, -6864, 3003, 135135,
    // C4[2], coeff of eps^5, polynomial in n of order 0
    +8, 10725,
    // C4[2], coeff of eps^4, polynomial in n of order 1
    +1856, -936, 225225,
    // C4[2], coeff of eps^3, polynomial in n of order 2
    -8448, 4992, -1144, 225225,
    // C4[2], coeff of eps^2, polynomial in n of order 3
    -1440, 4160, -4576, 1716, 225225,
    // C4[3], coeff of eps^5, polynomial in n of order 0
    -136, 63063,
    // C4[3], coeff of eps^4, polynomial in n of order 1
    +1024, -208, 105105,
    // C4[3], coeff of eps^3, polynomial in n of order 2
    +3584, -3328, 1144, 315315,
    // C4[4], coeff of eps^5, polynomial in n of order 0
    -128, 135135,
    // C4[4], coeff of eps^4, polynomial in n of order 1
    -2560, 832, 405405,
    // C4[5], coeff of eps^5, polynomial in n of order 0
    +128, 99099
  ];

  g.Geodesic.prototype.C4coeff = function () {
    var o = 0,
      k = 0,
      l,
      j,
      p;
    for (l = 0; l < g.nC4_; ++l) {
      // l is index of C4[l]
      for (j = g.nC4_ - 1; j >= l; --j) {
        // coeff of eps^j
        p = g.nC4_ - j - 1; // order of polynomial in n
        this._C4x[k++] =
          m.polyval(p, C4_coeff, o, this._n) / C4_coeff[o + p + 1];
        o += p + 2;
      }
    }
  };

  g.Geodesic.prototype.A3f = function (eps) {
    // Evaluate A3
    return m.polyval(nA3x_ - 1, this._A3x, 0, eps);
  };

  g.Geodesic.prototype.C3f = function (eps, c) {
    // Evaluate C3 coeffs
    // Elements c[1] thru c[nC3_ - 1] are set
    var mult = 1,
      o = 0,
      l,
      p;
    for (l = 1; l < g.nC3_; ++l) {
      // l is index of C3[l]
      p = g.nC3_ - l - 1; // order of polynomial in eps
      mult *= eps;
      c[l] = mult * m.polyval(p, this._C3x, o, eps);
      o += p + 1;
    }
  };

  g.Geodesic.prototype.C4f = function (eps, c) {
    // Evaluate C4 coeffs
    // Elements c[0] thru c[g.nC4_ - 1] are set
    var mult = 1,
      o = 0,
      l,
      p;
    for (l = 0; l < g.nC4_; ++l) {
      // l is index of C4[l]
      p = g.nC4_ - l - 1; // order of polynomial in eps
      c[l] = mult * m.polyval(p, this._C4x, o, eps);
      o += p + 1;
      mult *= eps;
    }
  };

  // return s12b, m12b, m0, M12, M21
  g.Geodesic.prototype.Lengths = function (
    eps,
    sig12,
    ssig1,
    csig1,
    dn1,
    ssig2,
    csig2,
    dn2,
    cbet1,
    cbet2,
    outmask,
    C1a,
    C2a
  ) {
    // Return m12b = (reduced length)/_b; also calculate s12b =
    // distance/_b, and m0 = coefficient of secular term in
    // expression for reduced length.
    outmask &= g.OUT_MASK;
    var vals = {},
      m0x = 0,
      J12 = 0,
      A1 = 0,
      A2 = 0,
      B1,
      B2,
      l,
      csig12,
      t;
    if (outmask & (g.DISTANCE | g.REDUCEDLENGTH | g.GEODESICSCALE)) {
      A1 = g.A1m1f(eps);
      g.C1f(eps, C1a);
      if (outmask & (g.REDUCEDLENGTH | g.GEODESICSCALE)) {
        A2 = g.A2m1f(eps);
        g.C2f(eps, C2a);
        m0x = A1 - A2;
        A2 = 1 + A2;
      }
      A1 = 1 + A1;
    }
    if (outmask & g.DISTANCE) {
      B1 =
        g.SinCosSeries(true, ssig2, csig2, C1a) -
        g.SinCosSeries(true, ssig1, csig1, C1a);
      // Missing a factor of _b
      vals.s12b = A1 * (sig12 + B1);
      if (outmask & (g.REDUCEDLENGTH | g.GEODESICSCALE)) {
        B2 =
          g.SinCosSeries(true, ssig2, csig2, C2a) -
          g.SinCosSeries(true, ssig1, csig1, C2a);
        J12 = m0x * sig12 + (A1 * B1 - A2 * B2);
      }
    } else if (outmask & (g.REDUCEDLENGTH | g.GEODESICSCALE)) {
      // Assume here that nC1_ >= nC2_
      for (l = 1; l <= g.nC2_; ++l) C2a[l] = A1 * C1a[l] - A2 * C2a[l];
      J12 =
        m0x * sig12 +
        (g.SinCosSeries(true, ssig2, csig2, C2a) -
          g.SinCosSeries(true, ssig1, csig1, C2a));
    }
    if (outmask & g.REDUCEDLENGTH) {
      vals.m0 = m0x;
      // Missing a factor of _b.
      // Add parens around (csig1 * ssig2) and (ssig1 * csig2) to ensure
      // accurate cancellation in the case of coincident points.
      vals.m12b =
        dn2 * (csig1 * ssig2) - dn1 * (ssig1 * csig2) - csig1 * csig2 * J12;
    }
    if (outmask & g.GEODESICSCALE) {
      csig12 = csig1 * csig2 + ssig1 * ssig2;
      t = (this._ep2 * (cbet1 - cbet2) * (cbet1 + cbet2)) / (dn1 + dn2);
      vals.M12 = csig12 + ((t * ssig2 - csig2 * J12) * ssig1) / dn1;
      vals.M21 = csig12 - ((t * ssig1 - csig1 * J12) * ssig2) / dn2;
    }
    return vals;
  };

  // return sig12, salp1, calp1, salp2, calp2, dnm
  g.Geodesic.prototype.InverseStart = function (
    sbet1,
    cbet1,
    dn1,
    sbet2,
    cbet2,
    dn2,
    lam12,
    slam12,
    clam12,
    C1a,
    C2a
  ) {
    // Return a starting point for Newton's method in salp1 and calp1
    // (function value is -1).  If Newton's method doesn't need to be
    // used, return also salp2 and calp2 and function value is sig12.
    // salp2, calp2 only updated if return val >= 0.
    var vals = {},
      // bet12 = bet2 - bet1 in [0, pi); bet12a = bet2 + bet1 in (-pi, 0]
      sbet12 = sbet2 * cbet1 - cbet2 * sbet1,
      cbet12 = cbet2 * cbet1 + sbet2 * sbet1,
      sbet12a,
      shortline,
      omg12,
      sbetm2,
      somg12,
      comg12,
      t,
      ssig12,
      csig12,
      x,
      y,
      lamscale,
      betscale,
      k2,
      eps,
      cbet12a,
      bet12a,
      m12b,
      m0,
      nvals,
      k,
      omg12a,
      lam12x;
    vals.sig12 = -1; // Return value
    // Volatile declaration needed to fix inverse cases
    // 88.202499451857 0 -88.202499451857 179.981022032992859592
    // 89.262080389218 0 -89.262080389218 179.992207982775375662
    // 89.333123580033 0 -89.333123580032997687 179.99295812360148422
    // which otherwise fail with g++ 4.4.4 x86 -O3
    sbet12a = sbet2 * cbet1;
    sbet12a += cbet2 * sbet1;

    shortline = cbet12 >= 0 && sbet12 < 0.5 && cbet2 * lam12 < 0.5;
    if (shortline) {
      sbetm2 = m.sq(sbet1 + sbet2);
      // sin((bet1+bet2)/2)^2
      // =  (sbet1 + sbet2)^2 / ((sbet1 + sbet2)^2 + (cbet1 + cbet2)^2)
      sbetm2 /= sbetm2 + m.sq(cbet1 + cbet2);
      vals.dnm = Math.sqrt(1 + this._ep2 * sbetm2);
      omg12 = lam12 / (this._f1 * vals.dnm);
      somg12 = Math.sin(omg12);
      comg12 = Math.cos(omg12);
    } else {
      somg12 = slam12;
      comg12 = clam12;
    }

    vals.salp1 = cbet2 * somg12;
    vals.calp1 =
      comg12 >= 0
        ? sbet12 + (cbet2 * sbet1 * m.sq(somg12)) / (1 + comg12)
        : sbet12a - (cbet2 * sbet1 * m.sq(somg12)) / (1 - comg12);

    ssig12 = m.hypot(vals.salp1, vals.calp1);
    csig12 = sbet1 * sbet2 + cbet1 * cbet2 * comg12;
    if (shortline && ssig12 < this._etol2) {
      // really short lines
      vals.salp2 = cbet1 * somg12;
      vals.calp2 =
        sbet12 -
        cbet1 *
          sbet2 *
          (comg12 >= 0 ? m.sq(somg12) / (1 + comg12) : 1 - comg12);
      // norm(vals.salp2, vals.calp2);
      t = m.hypot(vals.salp2, vals.calp2);
      vals.salp2 /= t;
      vals.calp2 /= t;
      // Set return value
      vals.sig12 = Math.atan2(ssig12, csig12);
    } else if (
      Math.abs(this._n) > 0.1 || // Skip astroid calc if too eccentric
      csig12 >= 0 ||
      ssig12 >= 6 * Math.abs(this._n) * Math.PI * m.sq(cbet1)
    ) {
      // Nothing to do, zeroth order spherical approximation is OK
    } else {
      // Scale lam12 and bet2 to x, y coordinate system where antipodal
      // point is at origin and singular point is at y = 0, x = -1.
      lam12x = Math.atan2(-slam12, -clam12); // lam12 - pi
      if (this.f >= 0) {
        // In fact f == 0 does not get here
        // x = dlong, y = dlat
        k2 = m.sq(sbet1) * this._ep2;
        eps = k2 / (2 * (1 + Math.sqrt(1 + k2)) + k2);
        lamscale = this.f * cbet1 * this.A3f(eps) * Math.PI;
        betscale = lamscale * cbet1;

        x = lam12x / lamscale;
        y = sbet12a / betscale;
      } else {
        // f < 0
        // x = dlat, y = dlong
        cbet12a = cbet2 * cbet1 - sbet2 * sbet1;
        bet12a = Math.atan2(sbet12a, cbet12a);
        // In the case of lon12 = 180, this repeats a calculation made
        // in Inverse.
        nvals = this.Lengths(
          this._n,
          Math.PI + bet12a,
          sbet1,
          -cbet1,
          dn1,
          sbet2,
          cbet2,
          dn2,
          cbet1,
          cbet2,
          g.REDUCEDLENGTH,
          C1a,
          C2a
        );
        m12b = nvals.m12b;
        m0 = nvals.m0;
        x = -1 + m12b / (cbet1 * cbet2 * m0 * Math.PI);
        betscale = x < -0.01 ? sbet12a / x : -this.f * m.sq(cbet1) * Math.PI;
        lamscale = betscale / cbet1;
        y = lam12 / lamscale;
      }

      if (y > -tol1_ && x > -1 - xthresh_) {
        // strip near cut
        if (this.f >= 0) {
          vals.salp1 = Math.min(1, -x);
          vals.calp1 = -Math.sqrt(1 - m.sq(vals.salp1));
        } else {
          vals.calp1 = Math.max(x > -tol1_ ? 0 : -1, x);
          vals.salp1 = Math.sqrt(1 - m.sq(vals.calp1));
        }
      } else {
        // Estimate alp1, by solving the astroid problem.
        //
        // Could estimate alpha1 = theta + pi/2, directly, i.e.,
        //   calp1 = y/k; salp1 = -x/(1+k);  for f >= 0
        //   calp1 = x/(1+k); salp1 = -y/k;  for f < 0 (need to check)
        //
        // However, it's better to estimate omg12 from astroid and use
        // spherical formula to compute alp1.  This reduces the mean number of
        // Newton iterations for astroid cases from 2.24 (min 0, max 6) to 2.12
        // (min 0 max 5).  The changes in the number of iterations are as
        // follows:
        //
        // change percent
        //    1       5
        //    0      78
        //   -1      16
        //   -2       0.6
        //   -3       0.04
        //   -4       0.002
        //
        // The histogram of iterations is (m = number of iterations estimating
        // alp1 directly, n = number of iterations estimating via omg12, total
        // number of trials = 148605):
        //
        //  iter    m      n
        //    0   148    186
        //    1 13046  13845
        //    2 93315 102225
        //    3 36189  32341
        //    4  5396      7
        //    5   455      1
        //    6    56      0
        //
        // Because omg12 is near pi, estimate work with omg12a = pi - omg12
        k = astroid(x, y);
        omg12a =
          lamscale * (this.f >= 0 ? (-x * k) / (1 + k) : (-y * (1 + k)) / k);
        somg12 = Math.sin(omg12a);
        comg12 = -Math.cos(omg12a);
        // Update spherical estimate of alp1 using omg12 instead of
        // lam12
        vals.salp1 = cbet2 * somg12;
        vals.calp1 = sbet12a - (cbet2 * sbet1 * m.sq(somg12)) / (1 - comg12);
      }
    }
    // Sanity check on starting guess.  Backwards check allows NaN through.
    if (!(vals.salp1 <= 0.0)) {
      // norm(vals.salp1, vals.calp1);
      t = m.hypot(vals.salp1, vals.calp1);
      vals.salp1 /= t;
      vals.calp1 /= t;
    } else {
      vals.salp1 = 1;
      vals.calp1 = 0;
    }
    return vals;
  };

  // return lam12, salp2, calp2, sig12, ssig1, csig1, ssig2, csig2, eps,
  // domg12, dlam12,
  g.Geodesic.prototype.Lambda12 = function (
    sbet1,
    cbet1,
    dn1,
    sbet2,
    cbet2,
    dn2,
    salp1,
    calp1,
    slam120,
    clam120,
    diffp,
    C1a,
    C2a,
    C3a
  ) {
    var vals = {},
      t,
      salp0,
      calp0,
      somg1,
      comg1,
      somg2,
      comg2,
      somg12,
      comg12,
      B312,
      eta,
      k2,
      nvals;
    if (sbet1 === 0 && calp1 === 0)
      // Break degeneracy of equatorial line.  This case has already been
      // handled.
      calp1 = -g.tiny_;

    // sin(alp1) * cos(bet1) = sin(alp0)
    salp0 = salp1 * cbet1;
    calp0 = m.hypot(calp1, salp1 * sbet1); // calp0 > 0

    // tan(bet1) = tan(sig1) * cos(alp1)
    // tan(omg1) = sin(alp0) * tan(sig1) = tan(omg1)=tan(alp1)*sin(bet1)
    vals.ssig1 = sbet1;
    somg1 = salp0 * sbet1;
    vals.csig1 = comg1 = calp1 * cbet1;
    // norm(vals.ssig1, vals.csig1);
    t = m.hypot(vals.ssig1, vals.csig1);
    vals.ssig1 /= t;
    vals.csig1 /= t;
    // norm(somg1, comg1); -- don't need to normalize!

    // Enforce symmetries in the case abs(bet2) = -bet1.  Need to be careful
    // about this case, since this can yield singularities in the Newton
    // iteration.
    // sin(alp2) * cos(bet2) = sin(alp0)
    vals.salp2 = cbet2 !== cbet1 ? salp0 / cbet2 : salp1;
    // calp2 = sqrt(1 - sq(salp2))
    //       = sqrt(sq(calp0) - sq(sbet2)) / cbet2
    // and subst for calp0 and rearrange to give (choose positive sqrt
    // to give alp2 in [0, pi/2]).
    vals.calp2 =
      cbet2 !== cbet1 || Math.abs(sbet2) !== -sbet1
        ? Math.sqrt(
            m.sq(calp1 * cbet1) +
              (cbet1 < -sbet1
                ? (cbet2 - cbet1) * (cbet1 + cbet2)
                : (sbet1 - sbet2) * (sbet1 + sbet2))
          ) / cbet2
        : Math.abs(calp1);
    // tan(bet2) = tan(sig2) * cos(alp2)
    // tan(omg2) = sin(alp0) * tan(sig2).
    vals.ssig2 = sbet2;
    somg2 = salp0 * sbet2;
    vals.csig2 = comg2 = vals.calp2 * cbet2;
    // norm(vals.ssig2, vals.csig2);
    t = m.hypot(vals.ssig2, vals.csig2);
    vals.ssig2 /= t;
    vals.csig2 /= t;
    // norm(somg2, comg2); -- don't need to normalize!

    // sig12 = sig2 - sig1, limit to [0, pi]
    vals.sig12 = Math.atan2(
      Math.max(0, vals.csig1 * vals.ssig2 - vals.ssig1 * vals.csig2),
      vals.csig1 * vals.csig2 + vals.ssig1 * vals.ssig2
    );

    // omg12 = omg2 - omg1, limit to [0, pi]
    somg12 = Math.max(0, comg1 * somg2 - somg1 * comg2);
    comg12 = comg1 * comg2 + somg1 * somg2;
    // eta = omg12 - lam120
    eta = Math.atan2(
      somg12 * clam120 - comg12 * slam120,
      comg12 * clam120 + somg12 * slam120
    );
    k2 = m.sq(calp0) * this._ep2;
    vals.eps = k2 / (2 * (1 + Math.sqrt(1 + k2)) + k2);
    this.C3f(vals.eps, C3a);
    B312 =
      g.SinCosSeries(true, vals.ssig2, vals.csig2, C3a) -
      g.SinCosSeries(true, vals.ssig1, vals.csig1, C3a);
    vals.domg12 = -this.f * this.A3f(vals.eps) * salp0 * (vals.sig12 + B312);
    vals.lam12 = eta + vals.domg12;
    if (diffp) {
      if (vals.calp2 === 0) vals.dlam12 = (-2 * this._f1 * dn1) / sbet1;
      else {
        nvals = this.Lengths(
          vals.eps,
          vals.sig12,
          vals.ssig1,
          vals.csig1,
          dn1,
          vals.ssig2,
          vals.csig2,
          dn2,
          cbet1,
          cbet2,
          g.REDUCEDLENGTH,
          C1a,
          C2a
        );
        vals.dlam12 = nvals.m12b;
        vals.dlam12 *= this._f1 / (vals.calp2 * cbet2);
      }
    }
    return vals;
  };

  /**
   * @summary Solve the inverse geodesic problem.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} lat2 the latitude of the second point in degrees.
   * @param {number} lon2 the longitude of the second point in degrees.
   * @param {bitmask} [outmask = STANDARD] which results to include.
   * @returns {object} the requested results
   * @description The lat1, lon1, lat2, lon2, and a12 fields of the result are
   *   always set.  For details on the outmask parameter, see {@tutorial
   *   2-interface}, "The outmask and caps parameters".
   */
  g.Geodesic.prototype.Inverse = function (lat1, lon1, lat2, lon2, outmask) {
    var r, vals;
    if (!outmask) outmask = g.STANDARD;
    if (outmask === g.LONG_UNROLL) outmask |= g.STANDARD;
    outmask &= g.OUT_MASK;
    r = this.InverseInt(lat1, lon1, lat2, lon2, outmask);
    vals = r.vals;
    if (outmask & g.AZIMUTH) {
      vals.azi1 = m.atan2d(r.salp1, r.calp1);
      vals.azi2 = m.atan2d(r.salp2, r.calp2);
    }
    return vals;
  };

  g.Geodesic.prototype.InverseInt = function (lat1, lon1, lat2, lon2, outmask) {
    var vals = {},
      lon12,
      lon12s,
      lonsign,
      t,
      swapp,
      latsign,
      sbet1,
      cbet1,
      sbet2,
      cbet2,
      s12x,
      m12x,
      dn1,
      dn2,
      lam12,
      slam12,
      clam12,
      sig12,
      calp1,
      salp1,
      calp2,
      salp2,
      C1a,
      C2a,
      C3a,
      meridian,
      nvals,
      ssig1,
      csig1,
      ssig2,
      csig2,
      eps,
      omg12,
      dnm,
      numit,
      salp1a,
      calp1a,
      salp1b,
      calp1b,
      tripn,
      tripb,
      v,
      dv,
      dalp1,
      sdalp1,
      cdalp1,
      nsalp1,
      lengthmask,
      salp0,
      calp0,
      alp12,
      k2,
      A4,
      C4a,
      B41,
      B42,
      somg12,
      comg12,
      domg12,
      dbet1,
      dbet2,
      salp12,
      calp12,
      sdomg12,
      cdomg12;
    // Compute longitude difference (AngDiff does this carefully).  Result is
    // in [-180, 180] but -180 is only for west-going geodesics.  180 is for
    // east-going and meridional geodesics.
    vals.lat1 = lat1 = m.LatFix(lat1);
    vals.lat2 = lat2 = m.LatFix(lat2);
    // If really close to the equator, treat as on equator.
    lat1 = m.AngRound(lat1);
    lat2 = m.AngRound(lat2);
    lon12 = m.AngDiff(lon1, lon2);
    lon12s = lon12.t;
    lon12 = lon12.s;
    if (outmask & g.LONG_UNROLL) {
      vals.lon1 = lon1;
      vals.lon2 = lon1 + lon12 + lon12s;
    } else {
      vals.lon1 = m.AngNormalize(lon1);
      vals.lon2 = m.AngNormalize(lon2);
    }
    // Make longitude difference positive.
    lonsign = lon12 >= 0 ? 1 : -1;
    // If very close to being on the same half-meridian, then make it so.
    lon12 = lonsign * m.AngRound(lon12);
    lon12s = m.AngRound(180 - lon12 - lonsign * lon12s);
    lam12 = lon12 * m.degree;
    t = m.sincosd(lon12 > 90 ? lon12s : lon12);
    slam12 = t.s;
    clam12 = (lon12 > 90 ? -1 : 1) * t.c;

    // Swap points so that point with higher (abs) latitude is point 1
    // If one latitude is a nan, then it becomes lat1.
    swapp = Math.abs(lat1) < Math.abs(lat2) ? -1 : 1;
    if (swapp < 0) {
      lonsign *= -1;
      t = lat1;
      lat1 = lat2;
      lat2 = t;
      // swap(lat1, lat2);
    }
    // Make lat1 <= 0
    latsign = lat1 < 0 ? 1 : -1;
    lat1 *= latsign;
    lat2 *= latsign;
    // Now we have
    //
    //     0 <= lon12 <= 180
    //     -90 <= lat1 <= 0
    //     lat1 <= lat2 <= -lat1
    //
    // longsign, swapp, latsign register the transformation to bring the
    // coordinates to this canonical form.  In all cases, 1 means no change was
    // made.  We make these transformations so that there are few cases to
    // check, e.g., on verifying quadrants in atan2.  In addition, this
    // enforces some symmetries in the results returned.

    t = m.sincosd(lat1);
    sbet1 = this._f1 * t.s;
    cbet1 = t.c;
    // norm(sbet1, cbet1);
    t = m.hypot(sbet1, cbet1);
    sbet1 /= t;
    cbet1 /= t;
    // Ensure cbet1 = +epsilon at poles
    cbet1 = Math.max(g.tiny_, cbet1);

    t = m.sincosd(lat2);
    sbet2 = this._f1 * t.s;
    cbet2 = t.c;
    // norm(sbet2, cbet2);
    t = m.hypot(sbet2, cbet2);
    sbet2 /= t;
    cbet2 /= t;
    // Ensure cbet2 = +epsilon at poles
    cbet2 = Math.max(g.tiny_, cbet2);

    // If cbet1 < -sbet1, then cbet2 - cbet1 is a sensitive measure of the
    // |bet1| - |bet2|.  Alternatively (cbet1 >= -sbet1), abs(sbet2) + sbet1 is
    // a better measure.  This logic is used in assigning calp2 in Lambda12.
    // Sometimes these quantities vanish and in that case we force bet2 = +/-
    // bet1 exactly.  An example where is is necessary is the inverse problem
    // 48.522876735459 0 -48.52287673545898293 179.599720456223079643
    // which failed with Visual Studio 10 (Release and Debug)

    if (cbet1 < -sbet1) {
      if (cbet2 === cbet1) sbet2 = sbet2 < 0 ? sbet1 : -sbet1;
    } else {
      if (Math.abs(sbet2) === -sbet1) cbet2 = cbet1;
    }

    dn1 = Math.sqrt(1 + this._ep2 * m.sq(sbet1));
    dn2 = Math.sqrt(1 + this._ep2 * m.sq(sbet2));

    // index zero elements of these arrays are unused
    C1a = new Array(g.nC1_ + 1);
    C2a = new Array(g.nC2_ + 1);
    C3a = new Array(g.nC3_);

    meridian = lat1 === -90 || slam12 === 0;
    if (meridian) {
      // Endpoints are on a single full meridian, so the geodesic might
      // lie on a meridian.

      calp1 = clam12;
      salp1 = slam12; // Head to the target longitude
      calp2 = 1;
      salp2 = 0; // At the target we're heading north

      // tan(bet) = tan(sig) * cos(alp)
      ssig1 = sbet1;
      csig1 = calp1 * cbet1;
      ssig2 = sbet2;
      csig2 = calp2 * cbet2;

      // sig12 = sig2 - sig1
      sig12 = Math.atan2(
        Math.max(0, csig1 * ssig2 - ssig1 * csig2),
        csig1 * csig2 + ssig1 * ssig2
      );
      nvals = this.Lengths(
        this._n,
        sig12,
        ssig1,
        csig1,
        dn1,
        ssig2,
        csig2,
        dn2,
        cbet1,
        cbet2,
        outmask | g.DISTANCE | g.REDUCEDLENGTH,
        C1a,
        C2a
      );
      s12x = nvals.s12b;
      m12x = nvals.m12b;
      // Ignore m0
      if ((outmask & g.GEODESICSCALE) !== 0) {
        vals.M12 = nvals.M12;
        vals.M21 = nvals.M21;
      }
      // Add the check for sig12 since zero length geodesics might yield
      // m12 < 0.  Test case was
      //
      //    echo 20.001 0 20.001 0 | GeodSolve -i
      //
      // In fact, we will have sig12 > pi/2 for meridional geodesic
      // which is not a shortest path.
      if (sig12 < 1 || m12x >= 0) {
        // Need at least 2, to handle 90 0 90 180
        if (sig12 < 3 * g.tiny_) sig12 = m12x = s12x = 0;
        m12x *= this._b;
        s12x *= this._b;
        vals.a12 = sig12 / m.degree;
      }
      // m12 < 0, i.e., prolate and too close to anti-podal
      else meridian = false;
    }

    somg12 = 2;
    if (
      !meridian &&
      sbet1 === 0 && // and sbet2 == 0
      (this.f <= 0 || lon12s >= this.f * 180)
    ) {
      // Geodesic runs along equator
      calp1 = calp2 = 0;
      salp1 = salp2 = 1;
      s12x = this.a * lam12;
      sig12 = omg12 = lam12 / this._f1;
      m12x = this._b * Math.sin(sig12);
      if (outmask & g.GEODESICSCALE) vals.M12 = vals.M21 = Math.cos(sig12);
      vals.a12 = lon12 / this._f1;
    } else if (!meridian) {
      // Now point1 and point2 belong within a hemisphere bounded by a
      // meridian and geodesic is neither meridional or equatorial.

      // Figure a starting point for Newton's method
      nvals = this.InverseStart(
        sbet1,
        cbet1,
        dn1,
        sbet2,
        cbet2,
        dn2,
        lam12,
        slam12,
        clam12,
        C1a,
        C2a
      );
      sig12 = nvals.sig12;
      salp1 = nvals.salp1;
      calp1 = nvals.calp1;

      if (sig12 >= 0) {
        salp2 = nvals.salp2;
        calp2 = nvals.calp2;
        // Short lines (InverseStart sets salp2, calp2, dnm)

        dnm = nvals.dnm;
        s12x = sig12 * this._b * dnm;
        m12x = m.sq(dnm) * this._b * Math.sin(sig12 / dnm);
        if (outmask & g.GEODESICSCALE)
          vals.M12 = vals.M21 = Math.cos(sig12 / dnm);
        vals.a12 = sig12 / m.degree;
        omg12 = lam12 / (this._f1 * dnm);
      } else {
        // Newton's method.  This is a straightforward solution of f(alp1) =
        // lambda12(alp1) - lam12 = 0 with one wrinkle.  f(alp) has exactly one
        // root in the interval (0, pi) and its derivative is positive at the
        // root.  Thus f(alp) is positive for alp > alp1 and negative for alp <
        // alp1.  During the course of the iteration, a range (alp1a, alp1b) is
        // maintained which brackets the root and with each evaluation of
        // f(alp) the range is shrunk if possible.  Newton's method is
        // restarted whenever the derivative of f is negative (because the new
        // value of alp1 is then further from the solution) or if the new
        // estimate of alp1 lies outside (0,pi); in this case, the new starting
        // guess is taken to be (alp1a + alp1b) / 2.
        numit = 0;
        // Bracketing range
        salp1a = g.tiny_;
        calp1a = 1;
        salp1b = g.tiny_;
        calp1b = -1;
        for (tripn = false, tripb = false; numit < maxit2_; ++numit) {
          // the WGS84 test set: mean = 1.47, sd = 1.25, max = 16
          // WGS84 and random input: mean = 2.85, sd = 0.60
          nvals = this.Lambda12(
            sbet1,
            cbet1,
            dn1,
            sbet2,
            cbet2,
            dn2,
            salp1,
            calp1,
            slam12,
            clam12,
            numit < maxit1_,
            C1a,
            C2a,
            C3a
          );
          v = nvals.lam12;
          salp2 = nvals.salp2;
          calp2 = nvals.calp2;
          sig12 = nvals.sig12;
          ssig1 = nvals.ssig1;
          csig1 = nvals.csig1;
          ssig2 = nvals.ssig2;
          csig2 = nvals.csig2;
          eps = nvals.eps;
          domg12 = nvals.domg12;
          dv = nvals.dlam12;

          // 2 * tol0 is approximately 1 ulp for a number in [0, pi].
          // Reversed test to allow escape with NaNs
          if (tripb || !(Math.abs(v) >= (tripn ? 8 : 1) * tol0_)) break;
          // Update bracketing values
          if (v > 0 && (numit < maxit1_ || calp1 / salp1 > calp1b / salp1b)) {
            salp1b = salp1;
            calp1b = calp1;
          } else if (
            v < 0 &&
            (numit < maxit1_ || calp1 / salp1 < calp1a / salp1a)
          ) {
            salp1a = salp1;
            calp1a = calp1;
          }
          if (numit < maxit1_ && dv > 0) {
            dalp1 = -v / dv;
            sdalp1 = Math.sin(dalp1);
            cdalp1 = Math.cos(dalp1);
            nsalp1 = salp1 * cdalp1 + calp1 * sdalp1;
            if (nsalp1 > 0 && Math.abs(dalp1) < Math.PI) {
              calp1 = calp1 * cdalp1 - salp1 * sdalp1;
              salp1 = nsalp1;
              // norm(salp1, calp1);
              t = m.hypot(salp1, calp1);
              salp1 /= t;
              calp1 /= t;
              // In some regimes we don't get quadratic convergence because
              // slope -> 0.  So use convergence conditions based on epsilon
              // instead of sqrt(epsilon).
              tripn = Math.abs(v) <= 16 * tol0_;
              continue;
            }
          }
          // Either dv was not positive or updated value was outside legal
          // range.  Use the midpoint of the bracket as the next estimate.
          // This mechanism is not needed for the WGS84 ellipsoid, but it does
          // catch problems with more eccentric ellipsoids.  Its efficacy is
          // such for the WGS84 test set with the starting guess set to alp1 =
          // 90deg:
          // the WGS84 test set: mean = 5.21, sd = 3.93, max = 24
          // WGS84 and random input: mean = 4.74, sd = 0.99
          salp1 = (salp1a + salp1b) / 2;
          calp1 = (calp1a + calp1b) / 2;
          // norm(salp1, calp1);
          t = m.hypot(salp1, calp1);
          salp1 /= t;
          calp1 /= t;
          tripn = false;
          tripb =
            Math.abs(salp1a - salp1) + (calp1a - calp1) < tolb_ ||
            Math.abs(salp1 - salp1b) + (calp1 - calp1b) < tolb_;
        }
        lengthmask =
          outmask |
          (outmask & (g.REDUCEDLENGTH | g.GEODESICSCALE) ? g.DISTANCE : g.NONE);
        nvals = this.Lengths(
          eps,
          sig12,
          ssig1,
          csig1,
          dn1,
          ssig2,
          csig2,
          dn2,
          cbet1,
          cbet2,
          lengthmask,
          C1a,
          C2a
        );
        s12x = nvals.s12b;
        m12x = nvals.m12b;
        // Ignore m0
        if ((outmask & g.GEODESICSCALE) !== 0) {
          vals.M12 = nvals.M12;
          vals.M21 = nvals.M21;
        }
        m12x *= this._b;
        s12x *= this._b;
        vals.a12 = sig12 / m.degree;
        if (outmask & g.AREA) {
          // omg12 = lam12 - domg12
          sdomg12 = Math.sin(domg12);
          cdomg12 = Math.cos(domg12);
          somg12 = slam12 * cdomg12 - clam12 * sdomg12;
          comg12 = clam12 * cdomg12 + slam12 * sdomg12;
        }
      }
    }

    if (outmask & g.DISTANCE) vals.s12 = 0 + s12x; // Convert -0 to 0

    if (outmask & g.REDUCEDLENGTH) vals.m12 = 0 + m12x; // Convert -0 to 0

    if (outmask & g.AREA) {
      // From Lambda12: sin(alp1) * cos(bet1) = sin(alp0)
      salp0 = salp1 * cbet1;
      calp0 = m.hypot(calp1, salp1 * sbet1); // calp0 > 0
      if (calp0 !== 0 && salp0 !== 0) {
        // From Lambda12: tan(bet) = tan(sig) * cos(alp)
        ssig1 = sbet1;
        csig1 = calp1 * cbet1;
        ssig2 = sbet2;
        csig2 = calp2 * cbet2;
        k2 = m.sq(calp0) * this._ep2;
        eps = k2 / (2 * (1 + Math.sqrt(1 + k2)) + k2);
        // Multiplier = a^2 * e^2 * cos(alpha0) * sin(alpha0).
        A4 = m.sq(this.a) * calp0 * salp0 * this._e2;
        // norm(ssig1, csig1);
        t = m.hypot(ssig1, csig1);
        ssig1 /= t;
        csig1 /= t;
        // norm(ssig2, csig2);
        t = m.hypot(ssig2, csig2);
        ssig2 /= t;
        csig2 /= t;
        C4a = new Array(g.nC4_);
        this.C4f(eps, C4a);
        B41 = g.SinCosSeries(false, ssig1, csig1, C4a);
        B42 = g.SinCosSeries(false, ssig2, csig2, C4a);
        vals.S12 = A4 * (B42 - B41);
      }
      // Avoid problems with indeterminate sig1, sig2 on equator
      else vals.S12 = 0;
      if (!meridian && somg12 > 1) {
        somg12 = Math.sin(omg12);
        comg12 = Math.cos(omg12);
      }
      if (
        !meridian &&
        comg12 > -0.7071 && // Long difference not too big
        sbet2 - sbet1 < 1.75
      ) {
        // Lat difference not too big
        // Use tan(Gamma/2) = tan(omg12/2)
        // * (tan(bet1/2)+tan(bet2/2))/(1+tan(bet1/2)*tan(bet2/2))
        // with tan(x/2) = sin(x)/(1+cos(x))
        domg12 = 1 + comg12;
        dbet1 = 1 + cbet1;
        dbet2 = 1 + cbet2;
        alp12 =
          2 *
          Math.atan2(
            somg12 * (sbet1 * dbet2 + sbet2 * dbet1),
            domg12 * (sbet1 * sbet2 + dbet1 * dbet2)
          );
      } else {
        // alp12 = alp2 - alp1, used in atan2 so no need to normalize
        salp12 = salp2 * calp1 - calp2 * salp1;
        calp12 = calp2 * calp1 + salp2 * salp1;
        // The right thing appears to happen if alp1 = +/-180 and alp2 = 0, viz
        // salp12 = -0 and alp12 = -180.  However this depends on the sign
        // being attached to 0 correctly.  The following ensures the correct
        // behavior.
        if (salp12 === 0 && calp12 < 0) {
          salp12 = g.tiny_ * calp1;
          calp12 = -1;
        }
        alp12 = Math.atan2(salp12, calp12);
      }
      vals.S12 += this._c2 * alp12;
      vals.S12 *= swapp * lonsign * latsign;
      // Convert -0 to 0
      vals.S12 += 0;
    }

    // Convert calp, salp to azimuth accounting for lonsign, swapp, latsign.
    if (swapp < 0) {
      t = salp1;
      salp1 = salp2;
      salp2 = t;
      // swap(salp1, salp2);
      t = calp1;
      calp1 = calp2;
      calp2 = t;
      // swap(calp1, calp2);
      if (outmask & g.GEODESICSCALE) {
        t = vals.M12;
        vals.M12 = vals.M21;
        vals.M21 = t;
        // swap(vals.M12, vals.M21);
      }
    }

    salp1 *= swapp * lonsign;
    calp1 *= swapp * latsign;
    salp2 *= swapp * lonsign;
    calp2 *= swapp * latsign;

    return {
      vals: vals,
      salp1: salp1,
      calp1: calp1,
      salp2: salp2,
      calp2: calp2
    };
  };

  /**
   * @summary Solve the general direct geodesic problem.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} azi1 the azimuth at the first point in degrees.
   * @param {bool} arcmode is the next parameter an arc length?
   * @param {number} s12_a12 the (arcmode ? arc length : distance) from the
   *   first point to the second in (arcmode ? degrees : meters).
   * @param {bitmask} [outmask = STANDARD] which results to include.
   * @returns {object} the requested results.
   * @description The lat1, lon1, azi1, and a12 fields of the result are always
   *   set; s12 is included if arcmode is false.  For details on the outmask
   *   parameter, see {@tutorial 2-interface}, "The outmask and caps
   *   parameters".
   */
  g.Geodesic.prototype.GenDirect = function (
    lat1,
    lon1,
    azi1,
    arcmode,
    s12_a12,
    outmask
  ) {
    var line;
    if (!outmask) outmask = g.STANDARD;
    else if (outmask === g.LONG_UNROLL) outmask |= g.STANDARD;
    // Automatically supply DISTANCE_IN if necessary
    if (!arcmode) outmask |= g.DISTANCE_IN;
    line = new l.GeodesicLine(this, lat1, lon1, azi1, outmask);
    return line.GenPosition(arcmode, s12_a12, outmask);
  };

  /**
   * @summary Solve the direct geodesic problem.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} azi1 the azimuth at the first point in degrees.
   * @param {number} s12 the distance from the first point to the second in
   *   meters.
   * @param {bitmask} [outmask = STANDARD] which results to include.
   * @returns {object} the requested results.
   * @description The lat1, lon1, azi1, s12, and a12 fields of the result are
   *   always set.  For details on the outmask parameter, see {@tutorial
   *   2-interface}, "The outmask and caps parameters".
   */
  g.Geodesic.prototype.Direct = function (lat1, lon1, azi1, s12, outmask) {
    return this.GenDirect(lat1, lon1, azi1, false, s12, outmask);
  };

  /**
   * @summary Solve the direct geodesic problem with arc length.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} azi1 the azimuth at the first point in degrees.
   * @param {number} a12 the arc length from the first point to the second in
   *   degrees.
   * @param {bitmask} [outmask = STANDARD] which results to include.
   * @returns {object} the requested results.
   * @description The lat1, lon1, azi1, and a12 fields of the result are
   *   always set.  For details on the outmask parameter, see {@tutorial
   *   2-interface}, "The outmask and caps parameters".
   */
  g.Geodesic.prototype.ArcDirect = function (lat1, lon1, azi1, a12, outmask) {
    return this.GenDirect(lat1, lon1, azi1, true, a12, outmask);
  };

  /**
   * @summary Create a {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} object.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} azi1 the azimuth at the first point in degrees.
   *   degrees.
   * @param {bitmask} [caps = STANDARD | DISTANCE_IN] which capabilities to
   *   include.
   * @returns {object} the
   *   {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} object
   * @description For details on the caps parameter, see {@tutorial
   *   2-interface}, "The outmask and caps parameters".
   */
  g.Geodesic.prototype.Line = function (lat1, lon1, azi1, caps) {
    return new l.GeodesicLine(this, lat1, lon1, azi1, caps);
  };

  /**
   * @summary Define a {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} in terms of the direct geodesic problem specified in terms
   *   of distance.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} azi1 the azimuth at the first point in degrees.
   *   degrees.
   * @param {number} s12 the distance between point 1 and point 2 (meters); it
   *   can be negative.
   * @param {bitmask} [caps = STANDARD | DISTANCE_IN] which capabilities to
   *   include.
   * @returns {object} the
   *   {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} object
   * @description This function sets point 3 of the GeodesicLine to correspond
   *   to point 2 of the direct geodesic problem.  For details on the caps
   *   parameter, see {@tutorial 2-interface}, "The outmask and caps
   *   parameters".
   */
  g.Geodesic.prototype.DirectLine = function (lat1, lon1, azi1, s12, caps) {
    return this.GenDirectLine(lat1, lon1, azi1, false, s12, caps);
  };

  /**
   * @summary Define a {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} in terms of the direct geodesic problem specified in terms
   *   of arc length.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} azi1 the azimuth at the first point in degrees.
   *   degrees.
   * @param {number} a12 the arc length between point 1 and point 2 (degrees);
   *   it can be negative.
   * @param {bitmask} [caps = STANDARD | DISTANCE_IN] which capabilities to
   *   include.
   * @returns {object} the
   *   {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} object
   * @description This function sets point 3 of the GeodesicLine to correspond
   *   to point 2 of the direct geodesic problem.  For details on the caps
   *   parameter, see {@tutorial 2-interface}, "The outmask and caps
   *   parameters".
   */
  g.Geodesic.prototype.ArcDirectLine = function (lat1, lon1, azi1, a12, caps) {
    return this.GenDirectLine(lat1, lon1, azi1, true, a12, caps);
  };

  /**
   * @summary Define a {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} in terms of the direct geodesic problem specified in terms
   *   of either distance or arc length.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} azi1 the azimuth at the first point in degrees.
   *   degrees.
   * @param {bool} arcmode boolean flag determining the meaning of the
   *   s12_a12.
   * @param {number} s12_a12 if arcmode is false, this is the distance between
   *   point 1 and point 2 (meters); otherwise it is the arc length between
   *   point 1 and point 2 (degrees); it can be negative.
   * @param {bitmask} [caps = STANDARD | DISTANCE_IN] which capabilities to
   *   include.
   * @returns {object} the
   *   {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} object
   * @description This function sets point 3 of the GeodesicLine to correspond
   *   to point 2 of the direct geodesic problem.  For details on the caps
   *   parameter, see {@tutorial 2-interface}, "The outmask and caps
   *   parameters".
   */
  g.Geodesic.prototype.GenDirectLine = function (
    lat1,
    lon1,
    azi1,
    arcmode,
    s12_a12,
    caps
  ) {
    var t;
    if (!caps) caps = g.STANDARD | g.DISTANCE_IN;
    // Automatically supply DISTANCE_IN if necessary
    if (!arcmode) caps |= g.DISTANCE_IN;
    t = new l.GeodesicLine(this, lat1, lon1, azi1, caps);
    t.GenSetDistance(arcmode, s12_a12);
    return t;
  };

  /**
   * @summary Define a {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} in terms of the inverse geodesic problem.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} lat2 the latitude of the second point in degrees.
   * @param {number} lon2 the longitude of the second point in degrees.
   * @param {bitmask} [caps = STANDARD | DISTANCE_IN] which capabilities to
   *   include.
   * @returns {object} the
   *   {@link module:GeographicLib/GeodesicLine.GeodesicLine
   *   GeodesicLine} object
   * @description This function sets point 3 of the GeodesicLine to correspond
   *   to point 2 of the inverse geodesic problem.  For details on the caps
   *   parameter, see {@tutorial 2-interface}, "The outmask and caps
   *   parameters".
   */
  g.Geodesic.prototype.InverseLine = function (lat1, lon1, lat2, lon2, caps) {
    var r, t, azi1;
    if (!caps) caps = g.STANDARD | g.DISTANCE_IN;
    r = this.InverseInt(lat1, lon1, lat2, lon2, g.ARC);
    azi1 = m.atan2d(r.salp1, r.calp1);
    // Ensure that a12 can be converted to a distance
    if (caps & (g.OUT_MASK & g.DISTANCE_IN)) caps |= g.DISTANCE;
    t = new l.GeodesicLine(this, lat1, lon1, azi1, caps, r.salp1, r.calp1);
    t.SetArc(r.vals.a12);
    return t;
  };

  /**
   * @summary Create a {@link module:GeographicLib/PolygonArea.PolygonArea
   *   PolygonArea} object.
   * @param {bool} [polyline = false] if true the new PolygonArea object
   *   describes a polyline instead of a polygon.
   * @returns {object} the
   *   {@link module:GeographicLib/PolygonArea.PolygonArea
   *   PolygonArea} object
   */
  g.Geodesic.prototype.Polygon = function (polyline) {
    return new p.PolygonArea(this, polyline);
  };

  /**
   * @summary a {@link module:GeographicLib/Geodesic.Geodesic Geodesic} object
   *   initialized for the WGS84 ellipsoid.
   * @constant {object}
   */
  g.WGS84 = new g.Geodesic(c.WGS84.a, c.WGS84.f);
})(
  GeographicLib.Geodesic,
  GeographicLib.GeodesicLine,
  GeographicLib.PolygonArea,
  GeographicLib.Math,
  GeographicLib.Constants
);

/*
 * GeodesicLine.js
 * Transcription of GeodesicLine.[ch]pp into JavaScript.
 *
 * See the documentation for the C++ class.  The conversion is a literal
 * conversion from C++.
 *
 * The algorithms are derived in
 *
 *    Charles F. F. Karney,
 *    Algorithms for geodesics, J. Geodesy 87, 43-55 (2013);
 *    https://doi.org/10.1007/s00190-012-0578-z
 *    Addenda: https://geographiclib.sourceforge.io/geod-addenda.html
 *
 * Copyright (c) Charles Karney (2011-2016) <charles@karney.com> and licensed
 * under the MIT/X11 License.  For more information, see
 * https://geographiclib.sourceforge.io/
 */

// Load AFTER GeographicLib/Math.js, GeographicLib/Geodesic.js

(function (
  g,
  /**
   * @exports GeographicLib/GeodesicLine
   * @description Solve geodesic problems on a single geodesic line via the
   *   {@link module:GeographicLib/GeodesicLine.GeodesicLine GeodesicLine}
   *   class.
   */
  l,
  m
) {
  /**
   * @class
   * @property {number} a the equatorial radius (meters).
   * @property {number} f the flattening.
   * @property {number} lat1 the initial latitude (degrees).
   * @property {number} lon1 the initial longitude (degrees).
   * @property {number} azi1 the initial azimuth (degrees).
   * @property {number} salp1 the sine of the azimuth at the first point.
   * @property {number} calp1 the cosine the azimuth at the first point.
   * @property {number} s13 the distance to point 3 (meters).
   * @property {number} a13 the arc length to point 3 (degrees).
   * @property {bitmask} caps the capabilities of the object.
   * @summary Initialize a GeodesicLine object.  For details on the caps
   *   parameter, see {@tutorial 2-interface}, "The outmask and caps
   *   parameters".
   * @classdesc Performs geodesic calculations along a given geodesic line.
   *   This object is usually instantiated by
   *   {@link module:GeographicLib/Geodesic.Geodesic#Line Geodesic.Line}.
   *   The methods
   *   {@link module:GeographicLib/Geodesic.Geodesic#DirectLine
   *   Geodesic.DirectLine} and
   *   {@link module:GeographicLib/Geodesic.Geodesic#InverseLine
   *   Geodesic.InverseLine} set in addition the position of a reference point
   *   3.
   * @param {object} geod a {@link module:GeographicLib/Geodesic.Geodesic
   *   Geodesic} object.
   * @param {number} lat1 the latitude of the first point in degrees.
   * @param {number} lon1 the longitude of the first point in degrees.
   * @param {number} azi1 the azimuth at the first point in degrees.
   * @param {bitmask} [caps = STANDARD | DISTANCE_IN] which capabilities to
   *   include; LATITUDE | AZIMUTH are always included.
   */
  l.GeodesicLine = function (geod, lat1, lon1, azi1, caps, salp1, calp1) {
    var t, cbet1, sbet1, eps, s, c;
    if (!caps) caps = g.STANDARD | g.DISTANCE_IN;

    this.a = geod.a;
    this.f = geod.f;
    this._b = geod._b;
    this._c2 = geod._c2;
    this._f1 = geod._f1;
    this.caps = caps | g.LATITUDE | g.AZIMUTH | g.LONG_UNROLL;

    this.lat1 = m.LatFix(lat1);
    this.lon1 = lon1;
    if (typeof salp1 === 'undefined' || typeof calp1 === 'undefined') {
      this.azi1 = m.AngNormalize(azi1);
      t = m.sincosd(m.AngRound(this.azi1));
      this.salp1 = t.s;
      this.calp1 = t.c;
    } else {
      this.azi1 = azi1;
      this.salp1 = salp1;
      this.calp1 = calp1;
    }
    t = m.sincosd(m.AngRound(this.lat1));
    sbet1 = this._f1 * t.s;
    cbet1 = t.c;
    // norm(sbet1, cbet1);
    t = m.hypot(sbet1, cbet1);
    sbet1 /= t;
    cbet1 /= t;
    // Ensure cbet1 = +epsilon at poles
    cbet1 = Math.max(g.tiny_, cbet1);
    this._dn1 = Math.sqrt(1 + geod._ep2 * m.sq(sbet1));

    // Evaluate alp0 from sin(alp1) * cos(bet1) = sin(alp0),
    this._salp0 = this.salp1 * cbet1; // alp0 in [0, pi/2 - |bet1|]
    // Alt: calp0 = hypot(sbet1, calp1 * cbet1).  The following
    // is slightly better (consider the case salp1 = 0).
    this._calp0 = m.hypot(this.calp1, this.salp1 * sbet1);
    // Evaluate sig with tan(bet1) = tan(sig1) * cos(alp1).
    // sig = 0 is nearest northward crossing of equator.
    // With bet1 = 0, alp1 = pi/2, we have sig1 = 0 (equatorial line).
    // With bet1 =  pi/2, alp1 = -pi, sig1 =  pi/2
    // With bet1 = -pi/2, alp1 =  0 , sig1 = -pi/2
    // Evaluate omg1 with tan(omg1) = sin(alp0) * tan(sig1).
    // With alp0 in (0, pi/2], quadrants for sig and omg coincide.
    // No atan2(0,0) ambiguity at poles since cbet1 = +epsilon.
    // With alp0 = 0, omg1 = 0 for alp1 = 0, omg1 = pi for alp1 = pi.
    this._ssig1 = sbet1;
    this._somg1 = this._salp0 * sbet1;
    this._csig1 = this._comg1 =
      sbet1 !== 0 || this.calp1 !== 0 ? cbet1 * this.calp1 : 1;
    // norm(this._ssig1, this._csig1); // sig1 in (-pi, pi]
    t = m.hypot(this._ssig1, this._csig1);
    this._ssig1 /= t;
    this._csig1 /= t;
    // norm(this._somg1, this._comg1); -- don't need to normalize!

    this._k2 = m.sq(this._calp0) * geod._ep2;
    eps = this._k2 / (2 * (1 + Math.sqrt(1 + this._k2)) + this._k2);

    if (this.caps & g.CAP_C1) {
      this._A1m1 = g.A1m1f(eps);
      this._C1a = new Array(g.nC1_ + 1);
      g.C1f(eps, this._C1a);
      this._B11 = g.SinCosSeries(true, this._ssig1, this._csig1, this._C1a);
      s = Math.sin(this._B11);
      c = Math.cos(this._B11);
      // tau1 = sig1 + B11
      this._stau1 = this._ssig1 * c + this._csig1 * s;
      this._ctau1 = this._csig1 * c - this._ssig1 * s;
      // Not necessary because C1pa reverts C1a
      //    _B11 = -SinCosSeries(true, _stau1, _ctau1, _C1pa);
    }

    if (this.caps & g.CAP_C1p) {
      this._C1pa = new Array(g.nC1p_ + 1);
      g.C1pf(eps, this._C1pa);
    }

    if (this.caps & g.CAP_C2) {
      this._A2m1 = g.A2m1f(eps);
      this._C2a = new Array(g.nC2_ + 1);
      g.C2f(eps, this._C2a);
      this._B21 = g.SinCosSeries(true, this._ssig1, this._csig1, this._C2a);
    }

    if (this.caps & g.CAP_C3) {
      this._C3a = new Array(g.nC3_);
      geod.C3f(eps, this._C3a);
      this._A3c = -this.f * this._salp0 * geod.A3f(eps);
      this._B31 = g.SinCosSeries(true, this._ssig1, this._csig1, this._C3a);
    }

    if (this.caps & g.CAP_C4) {
      this._C4a = new Array(g.nC4_); // all the elements of _C4a are used
      geod.C4f(eps, this._C4a);
      // Multiplier = a^2 * e^2 * cos(alpha0) * sin(alpha0)
      this._A4 = m.sq(this.a) * this._calp0 * this._salp0 * geod._e2;
      this._B41 = g.SinCosSeries(false, this._ssig1, this._csig1, this._C4a);
    }

    this.a13 = this.s13 = Number.NaN;
  };

  /**
   * @summary Find the position on the line (general case).
   * @param {bool} arcmode is the next parameter an arc length?
   * @param {number} s12_a12 the (arcmode ? arc length : distance) from the
   *   first point to the second in (arcmode ? degrees : meters).
   * @param {bitmask} [outmask = STANDARD] which results to include; this is
   *   subject to the capabilities of the object.
   * @returns {object} the requested results.
   * @description The lat1, lon1, azi1, and a12 fields of the result are
   *   always set; s12 is included if arcmode is false.  For details on the
   *   outmask parameter, see {@tutorial 2-interface}, "The outmask and caps
   *   parameters".
   */
  l.GeodesicLine.prototype.GenPosition = function (arcmode, s12_a12, outmask) {
    var vals = {},
      sig12,
      ssig12,
      csig12,
      B12,
      AB1,
      ssig2,
      csig2,
      tau12,
      s,
      c,
      serr,
      omg12,
      lam12,
      lon12,
      E,
      sbet2,
      cbet2,
      somg2,
      comg2,
      salp2,
      calp2,
      dn2,
      B22,
      AB2,
      J12,
      t,
      B42,
      salp12,
      calp12;
    if (!outmask) outmask = g.STANDARD;
    else if (outmask === g.LONG_UNROLL) outmask |= g.STANDARD;
    outmask &= this.caps & g.OUT_MASK;
    vals.lat1 = this.lat1;
    vals.azi1 = this.azi1;
    vals.lon1 = outmask & g.LONG_UNROLL ? this.lon1 : m.AngNormalize(this.lon1);
    if (arcmode) vals.a12 = s12_a12;
    else vals.s12 = s12_a12;
    if (!(arcmode || this.caps & g.DISTANCE_IN & g.OUT_MASK)) {
      // Uninitialized or impossible distance calculation requested
      vals.a12 = Number.NaN;
      return vals;
    }

    // Avoid warning about uninitialized B12.
    B12 = 0;
    AB1 = 0;
    if (arcmode) {
      // Interpret s12_a12 as spherical arc length
      sig12 = s12_a12 * m.degree;
      t = m.sincosd(s12_a12);
      ssig12 = t.s;
      csig12 = t.c;
    } else {
      // Interpret s12_a12 as distance
      tau12 = s12_a12 / (this._b * (1 + this._A1m1));
      s = Math.sin(tau12);
      c = Math.cos(tau12);
      // tau2 = tau1 + tau12
      B12 = -g.SinCosSeries(
        true,
        this._stau1 * c + this._ctau1 * s,
        this._ctau1 * c - this._stau1 * s,
        this._C1pa
      );
      sig12 = tau12 - (B12 - this._B11);
      ssig12 = Math.sin(sig12);
      csig12 = Math.cos(sig12);
      if (Math.abs(this.f) > 0.01) {
        // Reverted distance series is inaccurate for |f| > 1/100, so correct
        // sig12 with 1 Newton iteration.  The following table shows the
        // approximate maximum error for a = WGS_a() and various f relative to
        // GeodesicExact.
        //     erri = the error in the inverse solution (nm)
        //     errd = the error in the direct solution (series only) (nm)
        //     errda = the error in the direct solution (series + 1 Newton) (nm)
        //
        //       f     erri  errd errda
        //     -1/5    12e6 1.2e9  69e6
        //     -1/10  123e3  12e6 765e3
        //     -1/20   1110 108e3  7155
        //     -1/50  18.63 200.9 27.12
        //     -1/100 18.63 23.78 23.37
        //     -1/150 18.63 21.05 20.26
        //      1/150 22.35 24.73 25.83
        //      1/100 22.35 25.03 25.31
        //      1/50  29.80 231.9 30.44
        //      1/20   5376 146e3  10e3
        //      1/10  829e3  22e6 1.5e6
        //      1/5   157e6 3.8e9 280e6
        ssig2 = this._ssig1 * csig12 + this._csig1 * ssig12;
        csig2 = this._csig1 * csig12 - this._ssig1 * ssig12;
        B12 = g.SinCosSeries(true, ssig2, csig2, this._C1a);
        serr =
          (1 + this._A1m1) * (sig12 + (B12 - this._B11)) - s12_a12 / this._b;
        sig12 = sig12 - serr / Math.sqrt(1 + this._k2 * m.sq(ssig2));
        ssig12 = Math.sin(sig12);
        csig12 = Math.cos(sig12);
        // Update B12 below
      }
    }

    // sig2 = sig1 + sig12
    ssig2 = this._ssig1 * csig12 + this._csig1 * ssig12;
    csig2 = this._csig1 * csig12 - this._ssig1 * ssig12;
    dn2 = Math.sqrt(1 + this._k2 * m.sq(ssig2));
    if (outmask & (g.DISTANCE | g.REDUCEDLENGTH | g.GEODESICSCALE)) {
      if (arcmode || Math.abs(this.f) > 0.01)
        B12 = g.SinCosSeries(true, ssig2, csig2, this._C1a);
      AB1 = (1 + this._A1m1) * (B12 - this._B11);
    }
    // sin(bet2) = cos(alp0) * sin(sig2)
    sbet2 = this._calp0 * ssig2;
    // Alt: cbet2 = hypot(csig2, salp0 * ssig2);
    cbet2 = m.hypot(this._salp0, this._calp0 * csig2);
    if (cbet2 === 0)
      // I.e., salp0 = 0, csig2 = 0.  Break the degeneracy in this case
      cbet2 = csig2 = g.tiny_;
    // tan(alp0) = cos(sig2)*tan(alp2)
    salp2 = this._salp0;
    calp2 = this._calp0 * csig2; // No need to normalize

    if (arcmode && outmask & g.DISTANCE)
      vals.s12 = this._b * ((1 + this._A1m1) * sig12 + AB1);

    if (outmask & g.LONGITUDE) {
      // tan(omg2) = sin(alp0) * tan(sig2)
      somg2 = this._salp0 * ssig2;
      comg2 = csig2; // No need to normalize
      E = m.copysign(1, this._salp0);
      // omg12 = omg2 - omg1
      omg12 =
        outmask & g.LONG_UNROLL
          ? E *
            (sig12 -
              (Math.atan2(ssig2, csig2) -
                Math.atan2(this._ssig1, this._csig1)) +
              (Math.atan2(E * somg2, comg2) -
                Math.atan2(E * this._somg1, this._comg1)))
          : Math.atan2(
              somg2 * this._comg1 - comg2 * this._somg1,
              comg2 * this._comg1 + somg2 * this._somg1
            );
      lam12 =
        omg12 +
        this._A3c *
          (sig12 + (g.SinCosSeries(true, ssig2, csig2, this._C3a) - this._B31));
      lon12 = lam12 / m.degree;
      vals.lon2 =
        outmask & g.LONG_UNROLL
          ? this.lon1 + lon12
          : m.AngNormalize(m.AngNormalize(this.lon1) + m.AngNormalize(lon12));
    }

    if (outmask & g.LATITUDE) vals.lat2 = m.atan2d(sbet2, this._f1 * cbet2);

    if (outmask & g.AZIMUTH) vals.azi2 = m.atan2d(salp2, calp2);

    if (outmask & (g.REDUCEDLENGTH | g.GEODESICSCALE)) {
      B22 = g.SinCosSeries(true, ssig2, csig2, this._C2a);
      AB2 = (1 + this._A2m1) * (B22 - this._B21);
      J12 = (this._A1m1 - this._A2m1) * sig12 + (AB1 - AB2);
      if (outmask & g.REDUCEDLENGTH)
        // Add parens around (_csig1 * ssig2) and (_ssig1 * csig2) to ensure
        // accurate cancellation in the case of coincident points.
        vals.m12 =
          this._b *
          (dn2 * (this._csig1 * ssig2) -
            this._dn1 * (this._ssig1 * csig2) -
            this._csig1 * csig2 * J12);
      if (outmask & g.GEODESICSCALE) {
        t =
          (this._k2 * (ssig2 - this._ssig1) * (ssig2 + this._ssig1)) /
          (this._dn1 + dn2);
        vals.M12 =
          csig12 + ((t * ssig2 - csig2 * J12) * this._ssig1) / this._dn1;
        vals.M21 =
          csig12 - ((t * this._ssig1 - this._csig1 * J12) * ssig2) / dn2;
      }
    }

    if (outmask & g.AREA) {
      B42 = g.SinCosSeries(false, ssig2, csig2, this._C4a);
      if (this._calp0 === 0 || this._salp0 === 0) {
        // alp12 = alp2 - alp1, used in atan2 so no need to normalize
        salp12 = salp2 * this.calp1 - calp2 * this.salp1;
        calp12 = calp2 * this.calp1 + salp2 * this.salp1;
      } else {
        // tan(alp) = tan(alp0) * sec(sig)
        // tan(alp2-alp1) = (tan(alp2) -tan(alp1)) / (tan(alp2)*tan(alp1)+1)
        // = calp0 * salp0 * (csig1-csig2) / (salp0^2 + calp0^2 * csig1*csig2)
        // If csig12 > 0, write
        //   csig1 - csig2 = ssig12 * (csig1 * ssig12 / (1 + csig12) + ssig1)
        // else
        //   csig1 - csig2 = csig1 * (1 - csig12) + ssig12 * ssig1
        // No need to normalize
        salp12 =
          this._calp0 *
          this._salp0 *
          (csig12 <= 0
            ? this._csig1 * (1 - csig12) + ssig12 * this._ssig1
            : ssig12 * ((this._csig1 * ssig12) / (1 + csig12) + this._ssig1));
        calp12 = m.sq(this._salp0) + m.sq(this._calp0) * this._csig1 * csig2;
      }
      vals.S12 =
        this._c2 * Math.atan2(salp12, calp12) + this._A4 * (B42 - this._B41);
    }

    if (!arcmode) vals.a12 = sig12 / m.degree;
    return vals;
  };

  /**
   * @summary Find the position on the line given s12.
   * @param {number} s12 the distance from the first point to the second in
   *   meters.
   * @param {bitmask} [outmask = STANDARD] which results to include; this is
   *   subject to the capabilities of the object.
   * @returns {object} the requested results.
   * @description The lat1, lon1, azi1, s12, and a12 fields of the result are
   *   always set; s12 is included if arcmode is false.  For details on the
   *   outmask parameter, see {@tutorial 2-interface}, "The outmask and caps
   *   parameters".
   */
  l.GeodesicLine.prototype.Position = function (s12, outmask) {
    return this.GenPosition(false, s12, outmask);
  };

  /**
   * @summary Find the position on the line given a12.
   * @param {number} a12 the arc length from the first point to the second in
   *   degrees.
   * @param {bitmask} [outmask = STANDARD] which results to include; this is
   *   subject to the capabilities of the object.
   * @returns {object} the requested results.
   * @description The lat1, lon1, azi1, and a12 fields of the result are
   *   always set.  For details on the outmask parameter, see {@tutorial
   *   2-interface}, "The outmask and caps parameters".
   */
  l.GeodesicLine.prototype.ArcPosition = function (a12, outmask) {
    return this.GenPosition(true, a12, outmask);
  };

  /**
   * @summary Specify position of point 3 in terms of either distance or arc
   *   length.
   * @param {bool} arcmode boolean flag determining the meaning of the second
   *   parameter; if arcmode is false, then the GeodesicLine object must have
   *   been constructed with caps |= DISTANCE_IN.
   * @param {number} s13_a13 if arcmode is false, this is the distance from
   *   point 1 to point 3 (meters); otherwise it is the arc length from
   *   point 1 to point 3 (degrees); it can be negative.
   **********************************************************************/
  l.GeodesicLine.prototype.GenSetDistance = function (arcmode, s13_a13) {
    if (arcmode) this.SetArc(s13_a13);
    else this.SetDistance(s13_a13);
  };

  /**
   * @summary Specify position of point 3 in terms distance.
   * @param {number} s13 the distance from point 1 to point 3 (meters); it
   *   can be negative.
   **********************************************************************/
  l.GeodesicLine.prototype.SetDistance = function (s13) {
    var r;
    this.s13 = s13;
    r = this.GenPosition(false, this.s13, g.ARC);
    this.a13 = 0 + r.a12; // the 0+ converts undefined into NaN
  };

  /**
   * @summary Specify position of point 3 in terms of arc length.
   * @param {number} a13 the arc length from point 1 to point 3 (degrees);
   *   it can be negative.
   **********************************************************************/
  l.GeodesicLine.prototype.SetArc = function (a13) {
    var r;
    this.a13 = a13;
    r = this.GenPosition(true, this.a13, g.DISTANCE);
    this.s13 = 0 + r.s12; // the 0+ converts undefined into NaN
  };
})(GeographicLib.Geodesic, GeographicLib.GeodesicLine, GeographicLib.Math);

/*
 * PolygonArea.js
 * Transcription of PolygonArea.[ch]pp into JavaScript.
 *
 * See the documentation for the C++ class.  The conversion is a literal
 * conversion from C++.
 *
 * The algorithms are derived in
 *
 *    Charles F. F. Karney,
 *    Algorithms for geodesics, J. Geodesy 87, 43-55 (2013);
 *    https://doi.org/10.1007/s00190-012-0578-z
 *    Addenda: https://geographiclib.sourceforge.io/geod-addenda.html
 *
 * Copyright (c) Charles Karney (2011-2017) <charles@karney.com> and licensed
 * under the MIT/X11 License.  For more information, see
 * https://geographiclib.sourceforge.io/
 */

// Load AFTER GeographicLib/Math.js and GeographicLib/Geodesic.js

(function (
  /**
   * @exports GeographicLib/PolygonArea
   * @description Compute the area of geodesic polygons via the
   *   {@link module:GeographicLib/PolygonArea.PolygonArea PolygonArea}
   *   class.
   */
  p,
  g,
  m,
  a
) {
  var transit, transitdirect;
  transit = function (lon1, lon2) {
    // Return 1 or -1 if crossing prime meridian in east or west direction.
    // Otherwise return zero.
    var lon12, cross;
    // Compute lon12 the same way as Geodesic::Inverse.
    lon1 = m.AngNormalize(lon1);
    lon2 = m.AngNormalize(lon2);
    lon12 = m.AngDiff(lon1, lon2).s;
    cross =
      lon1 <= 0 && lon2 > 0 && lon12 > 0
        ? 1
        : lon2 <= 0 && lon1 > 0 && lon12 < 0
        ? -1
        : 0;
    return cross;
  };

  // an alternate version of transit to deal with longitudes in the direct
  // problem.
  transitdirect = function (lon1, lon2) {
    // We want to compute exactly
    //   int(floor(lon2 / 360)) - int(floor(lon1 / 360))
    // Since we only need the parity of the result we can use std::remquo but
    // this is buggy with g++ 4.8.3 and requires C++11.  So instead we do
    lon1 = lon1 % 720.0;
    lon2 = lon2 % 720.0;
    return (
      ((lon2 >= 0 && lon2 < 360) || lon2 < -360 ? 0 : 1) -
      ((lon1 >= 0 && lon1 < 360) || lon1 < -360 ? 0 : 1)
    );
  };

  /**
   * @class
   * @property {number} a the equatorial radius (meters).
   * @property {number} f the flattening.
   * @property {bool} polyline whether the PolygonArea object describes a
   *   polyline or a polygon.
   * @property {number} num the number of vertices so far.
   * @property {number} lat the current latitude (degrees).
   * @property {number} lon the current longitude (degrees).
   * @summary Initialize a PolygonArea object.
   * @classdesc Computes the area and perimeter of a geodesic polygon.
   *   This object is usually instantiated by
   *   {@link module:GeographicLib/Geodesic.Geodesic#Polygon Geodesic.Polygon}.
   * @param {object} geod a {@link module:GeographicLib/Geodesic.Geodesic
   *   Geodesic} object.
   * @param {bool} [polyline = false] if true the new PolygonArea object
   *   describes a polyline instead of a polygon.
   */
  p.PolygonArea = function (geod, polyline) {
    this._geod = geod;
    this.a = this._geod.a;
    this.f = this._geod.f;
    this._area0 = 4 * Math.PI * geod._c2;
    this.polyline = !polyline ? false : polyline;
    this._mask =
      g.LATITUDE |
      g.LONGITUDE |
      g.DISTANCE |
      (this.polyline ? g.NONE : g.AREA | g.LONG_UNROLL);
    if (!this.polyline) this._areasum = new a.Accumulator(0);
    this._perimetersum = new a.Accumulator(0);
    this.Clear();
  };

  /**
   * @summary Clear the PolygonArea object, setting the number of vertices to
   *   0.
   */
  p.PolygonArea.prototype.Clear = function () {
    this.num = 0;
    this._crossings = 0;
    if (!this.polyline) this._areasum.Set(0);
    this._perimetersum.Set(0);
    this._lat0 = this._lon0 = this.lat = this.lon = Number.NaN;
  };

  /**
   * @summary Add the next vertex to the polygon.
   * @param {number} lat the latitude of the point (degrees).
   * @param {number} lon the longitude of the point (degrees).
   * @description This adds an edge from the current vertex to the new vertex.
   */
  p.PolygonArea.prototype.AddPoint = function (lat, lon) {
    var t;
    if (this.num === 0) {
      this._lat0 = this.lat = lat;
      this._lon0 = this.lon = lon;
    } else {
      t = this._geod.Inverse(this.lat, this.lon, lat, lon, this._mask);
      this._perimetersum.Add(t.s12);
      if (!this.polyline) {
        this._areasum.Add(t.S12);
        this._crossings += transit(this.lon, lon);
      }
      this.lat = lat;
      this.lon = lon;
    }
    ++this.num;
  };

  /**
   * @summary Add the next edge to the polygon.
   * @param {number} azi the azimuth at the current the point (degrees).
   * @param {number} s the length of the edge (meters).
   * @description This specifies the new vertex in terms of the edge from the
   *   current vertex.
   */
  p.PolygonArea.prototype.AddEdge = function (azi, s) {
    var t;
    if (this.num) {
      t = this._geod.Direct(this.lat, this.lon, azi, s, this._mask);
      this._perimetersum.Add(s);
      if (!this.polyline) {
        this._areasum.Add(t.S12);
        this._crossings += transitdirect(this.lon, t.lon2);
      }
      this.lat = t.lat2;
      this.lon = t.lon2;
    }
    ++this.num;
  };

  /**
   * @summary Compute the perimeter and area of the polygon.
   * @param {bool} reverse if true then clockwise (instead of
   *   counter-clockwise) traversal counts as a positive area.
   * @param {bool} sign if true then return a signed result for the area if the
   *   polygon is traversed in the "wrong" direction instead of returning the
   *   area for the rest of the earth.
   * @returns {object} r where r.number is the number of vertices, r.perimeter
   *   is the perimeter (meters), and r.area (only returned if polyline is
   *   false) is the area (meters<sup>2</sup>).
   * @description If the object is a polygon (and not a polygon), the perimeter
   *   includes the length of a final edge connecting the current point to the
   *   initial point.  If the object is a polyline, then area is nan.  More
   *   points can be added to the polygon after this call.
   */
  p.PolygonArea.prototype.Compute = function (reverse, sign) {
    var vals = { number: this.num },
      t,
      tempsum,
      crossings;
    if (this.num < 2) {
      vals.perimeter = 0;
      if (!this.polyline) vals.area = 0;
      return vals;
    }
    if (this.polyline) {
      vals.perimeter = this._perimetersum.Sum();
      return vals;
    }
    t = this._geod.Inverse(
      this.lat,
      this.lon,
      this._lat0,
      this._lon0,
      this._mask
    );
    vals.perimeter = this._perimetersum.Sum(t.s12);
    tempsum = new a.Accumulator(this._areasum);
    tempsum.Add(t.S12);
    crossings = this._crossings + transit(this.lon, this._lon0);
    if (crossings & 1)
      tempsum.Add(((tempsum.Sum() < 0 ? 1 : -1) * this._area0) / 2);
    // area is with the clockwise sense.  If !reverse convert to
    // counter-clockwise convention.
    if (!reverse) tempsum.Negate();
    // If sign put area in (-area0/2, area0/2], else put area in [0, area0)
    if (sign) {
      if (tempsum.Sum() > this._area0 / 2) tempsum.Add(-this._area0);
      else if (tempsum.Sum() <= -this._area0 / 2) tempsum.Add(+this._area0);
    } else {
      if (tempsum.Sum() >= this._area0) tempsum.Add(-this._area0);
      else if (tempsum < 0) tempsum.Add(-this._area0);
    }
    vals.area = tempsum.Sum();
    return vals;
  };

  /**
   * @summary Compute the perimeter and area of the polygon with a tentative
   *   new vertex.
   * @param {number} lat the latitude of the point (degrees).
   * @param {number} lon the longitude of the point (degrees).
   * @param {bool} reverse if true then clockwise (instead of
   *   counter-clockwise) traversal counts as a positive area.
   * @param {bool} sign if true then return a signed result for the area if the
   *   polygon is traversed in the "wrong" direction instead of returning the
   * @returns {object} r where r.number is the number of vertices, r.perimeter
   *   is the perimeter (meters), and r.area (only returned if polyline is
   *   false) is the area (meters<sup>2</sup>).
   * @description A new vertex is *not* added to the polygon.
   */
  p.PolygonArea.prototype.TestPoint = function (lat, lon, reverse, sign) {
    var vals = { number: this.num + 1 },
      t,
      tempsum,
      crossings,
      i;
    if (this.num === 0) {
      vals.perimeter = 0;
      if (!this.polyline) vals.area = 0;
      return vals;
    }
    vals.perimeter = this._perimetersum.Sum();
    tempsum = this.polyline ? 0 : this._areasum.Sum();
    crossings = this._crossings;
    for (i = 0; i < (this.polyline ? 1 : 2); ++i) {
      t = this._geod.Inverse(
        i === 0 ? this.lat : lat,
        i === 0 ? this.lon : lon,
        i !== 0 ? this._lat0 : lat,
        i !== 0 ? this._lon0 : lon,
        this._mask
      );
      vals.perimeter += t.s12;
      if (!this.polyline) {
        tempsum += t.S12;
        crossings += transit(
          i === 0 ? this.lon : lon,
          i !== 0 ? this._lon0 : lon
        );
      }
    }

    if (this.polyline) return vals;

    if (crossings & 1) tempsum += ((tempsum < 0 ? 1 : -1) * this._area0) / 2;
    // area is with the clockwise sense.  If !reverse convert to
    // counter-clockwise convention.
    if (!reverse) tempsum *= -1;
    // If sign put area in (-area0/2, area0/2], else put area in [0, area0)
    if (sign) {
      if (tempsum > this._area0 / 2) tempsum -= this._area0;
      else if (tempsum <= -this._area0 / 2) tempsum += this._area0;
    } else {
      if (tempsum >= this._area0) tempsum -= this._area0;
      else if (tempsum < 0) tempsum += this._area0;
    }
    vals.area = tempsum;
    return vals;
  };

  /**
   * @summary Compute the perimeter and area of the polygon with a tentative
   *   new edge.
   * @param {number} azi the azimuth of the edge (degrees).
   * @param {number} s the length of the edge (meters).
   * @param {bool} reverse if true then clockwise (instead of
   *   counter-clockwise) traversal counts as a positive area.
   * @param {bool} sign if true then return a signed result for the area if the
   *   polygon is traversed in the "wrong" direction instead of returning the
   * @returns {object} r where r.number is the number of vertices, r.perimeter
   *   is the perimeter (meters), and r.area (only returned if polyline is
   *   false) is the area (meters<sup>2</sup>).
   * @description A new vertex is *not* added to the polygon.
   */
  p.PolygonArea.prototype.TestEdge = function (azi, s, reverse, sign) {
    var vals = { number: this.num ? this.num + 1 : 0 },
      t,
      tempsum,
      crossings;
    if (this.num === 0) return vals;
    vals.perimeter = this._perimetersum.Sum() + s;
    if (this.polyline) return vals;

    tempsum = this._areasum.Sum();
    crossings = this._crossings;
    t = this._geod.Direct(this.lat, this.lon, azi, s, this._mask);
    tempsum += t.S12;
    crossings += transitdirect(this.lon, t.lon2);
    t = this._geod.Inverse(t.lat2, t.lon2, this._lat0, this._lon0, this._mask);
    vals.perimeter += t.s12;
    tempsum += t.S12;
    crossings += transit(t.lon2, this._lon0);

    if (crossings & 1) tempsum += ((tempsum < 0 ? 1 : -1) * this._area0) / 2;
    // area is with the clockwise sense.  If !reverse convert to
    // counter-clockwise convention.
    if (!reverse) tempsum *= -1;
    // If sign put area in (-area0/2, area0/2], else put area in [0, area0)
    if (sign) {
      if (tempsum > this._area0 / 2) tempsum -= this._area0;
      else if (tempsum <= -this._area0 / 2) tempsum += this._area0;
    } else {
      if (tempsum >= this._area0) tempsum -= this._area0;
      else if (tempsum < 0) tempsum += this._area0;
    }
    vals.area = tempsum;
    return vals;
  };
})(
  GeographicLib.PolygonArea,
  GeographicLib.Geodesic,
  GeographicLib.Math,
  GeographicLib.Accumulator
);

function pj_qsfn(sinphi, e, one_es) {
  var EPS = 1e-7;
  var con;
  if (e >= EPS) {
    con = e * sinphi;
    // Proj.4 check for div0 and returns HUGE_VAL
    // this returns +/- Infinity; effect should be same
    return (
      one_es *
      (sinphi / (1 - con * con) - (0.5 / e) * log((1 - con) / (1 + con)))
    );
  } else return sinphi + sinphi;
}

function pj_msfn(sinphi, cosphi, es) {
  return cosphi / sqrt(1 - es * sinphi * sinphi);
}

pj_add(pj_aea, 'aea', 'Albers Equal Area', 'Conic Sph&Ell\nlat_1= lat_2=');
pj_add(
  pj_leac,
  'leac',
  'Lambert Equal Area Conic',
  'Conic, Sph&Ell\nlat_1= south'
);

function pj_aea(P) {
  var phi1 = pj_param(P.params, 'rlat_1');
  var phi2 = pj_param(P.params, 'rlat_2');
  pj_aea_init(P, phi1, phi2);
}

function pj_leac(P) {
  var phi1 = pj_param(P.params, 'rlat_1');
  var phi2 = pj_param(P.params, 'bsouth') ? -M_HALFPI : M_HALFPI;
  pj_aea_init(P, phi1, phi2);
}

function pj_aea_init(P, phi1, phi2) {
  var ec,
    n,
    c,
    dd,
    n2,
    rho0,
    rho,
    en,
    ellips,
    cosphi,
    sinphi,
    secant,
    ml2,
    m2,
    ml1,
    m1;

  P.fwd = e_fwd;
  P.inv = e_inv;

  if (fabs(phi1 + phi2) < EPS10) e_error(-21);
  n = sinphi = sin(phi1);
  cosphi = cos(phi1);
  secant = fabs(phi1 - phi2) >= EPS10;
  if ((ellips = P.es > 0)) {
    en = pj_enfn(P.es);
    m1 = pj_msfn(sinphi, cosphi, P.es);
    ml1 = pj_qsfn(sinphi, P.e, P.one_es);
    if (secant) {
      /* secant cone */
      sinphi = sin(phi2);
      cosphi = cos(phi2);
      m2 = pj_msfn(sinphi, cosphi, P.es);
      ml2 = pj_qsfn(sinphi, P.e, P.one_es);
      // Ignoring Proj.4 div0 check (above checks should prevent this)
      n = (m1 * m1 - m2 * m2) / (ml2 - ml1);
    }
    ec = 1 - (0.5 * P.one_es * log((1 - P.e) / (1 + P.e))) / P.e;
    c = m1 * m1 + n * ml1;
    dd = 1 / n;
    rho0 = dd * sqrt(c - n * pj_qsfn(sin(P.phi0), P.e, P.one_es));
  } else {
    if (secant) n = 0.5 * (n + sin(phi2));
    n2 = n + n;
    c = cosphi * cosphi + n2 * sinphi;
    dd = 1 / n;
    rho0 = dd * sqrt(c - n2 * sin(P.phi0));
  }

  function e_fwd(lp, xy) {
    var lam = lp.lam;
    var rho;
    if (
      (rho =
        c -
        (ellips ? n * pj_qsfn(sin(lp.phi), P.e, P.one_es) : n2 * sin(lp.phi))) <
      0
    )
      f_error();
    rho = dd * sqrt(rho);
    xy.x = rho * sin((lam *= n));
    xy.y = rho0 - rho * cos(lam);
  }

  function e_inv(xy, lp) {
    var TOL7 = 1e-7,
      x = xy.x,
      y = rho0 - xy.y,
      rho = hypot(x, y);
    if (rho != 0) {
      if (n < 0) {
        rho = -rho;
        x = -x;
        y = -y;
      }
      lp.phi = rho / dd;
      if (ellips) {
        lp.phi = (c - lp.phi * lp.phi) / n;
        if (fabs(ec - fabs(lp.phi)) > TOL7) {
          if ((lp.phi = phi1_(lp.phi, P.e, P.one_es)) == HUGE_VAL) i_error();
        } else lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
      } else if (fabs((lp.phi = (c - lp.phi * lp.phi) / n2)) <= 1)
        lp.phi = asin(lp.phi);
      else lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
      lp.lam = atan2(x, y) / n;
    } else {
      lp.lam = 0;
      lp.phi = n > 0 ? M_HALFPI : -M_HALFPI;
    }
  }

  /* determine latitude angle phi-1 */
  function phi1_(qs, Te, Tone_es) {
    var N_ITER = 15,
      EPSILON = 1e-7,
      TOL = 1e-10;
    var Phi, sinpi, cospi, con, com, dphi, i;
    Phi = asin(0.5 * qs);
    if (Te < EPSILON) return Phi;
    i = N_ITER;
    do {
      sinpi = sin(Phi);
      cospi = cos(Phi);
      con = Te * sinpi;
      com = 1 - con * con;
      dphi =
        ((0.5 * com * com) / cospi) *
        (qs / Tone_es - sinpi / com + (0.5 / Te) * log((1 - con) / (1 + con)));
      Phi += dphi;
    } while (fabs(dphi) > TOL && --i);
    return i ? Phi : HUGE_VAL;
  }
}

function pj_enfn(es) {
  var C00 = 1,
    C02 = 0.25,
    C04 = 0.046875,
    C06 = 0.01953125,
    C08 = 0.01068115234375,
    C22 = 0.75,
    C44 = 0.46875,
    C46 = 0.01302083333333333333,
    C48 = 0.00712076822916666666,
    C66 = 0.36458333333333333333,
    C68 = 0.00569661458333333333,
    C88 = 0.3076171875;
  var en = [],
    t;
  en[0] = C00 - es * (C02 + es * (C04 + es * (C06 + es * C08)));
  en[1] = es * (C22 - es * (C04 + es * (C06 + es * C08)));
  en[2] = (t = es * es) * (C44 - es * (C46 + es * C48));
  en[3] = (t *= es) * (C66 - es * C68);
  en[4] = t * es * C88;
  return en;
}

function pj_mlfn(phi, sphi, cphi, en) {
  cphi *= sphi;
  sphi *= sphi;
  return (
    en[0] * phi -
    cphi * (en[1] + sphi * (en[2] + sphi * (en[3] + sphi * en[4])))
  );
}

function pj_inv_mlfn(arg, es, en) {
  var EPS = 1e-11,
    MAX_ITER = 10,
    EN_SIZE = 5;

  var k = 1 / (1 - es),
    s,
    t,
    phi;

  phi = arg;
  for (var i = MAX_ITER; i > 0; --i) {
    /* rarely goes over 2 iterations */
    s = sin(phi);
    t = 1 - es * s * s;
    phi -= t = (pj_mlfn(phi, s, cos(phi), en) - arg) * (t * sqrt(t)) * k;
    if (fabs(t) < EPS) {
      return phi;
    }
  }
  pj_ctx_set_errno(ctx, -17);
  return phi;
}

function aasin(v) {
  var ONE_TOL = 1.00000000000001;
  var av = fabs(v);
  if (av >= 1) {
    if (av > ONE_TOL) pj_ctx_set_errno(-19);
    return v < 0 ? -M_HALFPI : M_HALFPI;
  }
  return asin(v);
}

function aacos(v) {
  var ONE_TOL = 1.00000000000001;
  var av = fabs(v);
  if (av >= 1) {
    if (av > ONE_TOL) pj_ctx_set_errno(-19);
    return v < 0 ? M_PI : 0;
  }
  return acos(v);
}

function asqrt(v) {
  return v <= 0 ? 0 : sqrt(v);
}

function aatan2(n, d) {
  var ATOL = 1e-50;
  return fabs(n) < ATOL && fabs(d) < ATOL ? 0 : atan2(n, d);
}

pj_add(pj_aeqd, 'aeqd', 'Azimuthal Equidistant', 'Azi, Sph&Ell\nlat_0 guam');

function pj_aeqd(P) {
  var EPS10 = 1e-10,
    TOL = 1e-14,
    N_POLE = 0,
    S_POLE = 1,
    EQUIT = 2,
    OBLIQ = 3;

  var sinph0, cosph0, M1, N1, Mp, He, G, mode, en, g;
  P.phi0 = pj_param(P.params, 'rlat_0');
  if (fabs(fabs(P.phi0) - M_HALFPI) < EPS10) {
    mode = P.phi0 < 0 ? S_POLE : N_POLE;
    sinph0 = P.phi0 < 0 ? -1 : 1;
    cosph0 = 0;
  } else if (fabs(P.phi0) < EPS10) {
    mode = EQUIT;
    sinph0 = 0;
    cosph0 = 1;
  } else {
    mode = OBLIQ;
    sinph0 = sin(P.phi0);
    cosph0 = cos(P.phi0);
  }
  if (!P.es) {
    P.inv = s_inv;
    P.fwd = s_fwd;
  } else {
    g = new GeographicLib.Geodesic.Geodesic(P.a, P.es / (1 + sqrt(P.one_es)));
    en = pj_enfn(P.es);
    if (pj_param(P.params, 'bguam')) {
      M1 = pj_mlfn(P.phi0, sinph0, cosph0, en);
      P.inv = e_guam_inv;
      P.fwd = e_guam_fwd;
    } else {
      switch (mode) {
        case N_POLE:
          Mp = pj_mlfn(M_HALFPI, 1, 0, en);
          break;
        case S_POLE:
          Mp = pj_mlfn(-M_HALFPI, -1, 0, en);
          break;
        case EQUIT:
        case OBLIQ:
          P.inv = e_inv;
          P.fwd = e_fwd;
          N1 = 1 / sqrt(1 - P.es * sinph0 * sinph0);
          G = sinph0 * (He = P.e / sqrt(P.one_es));
          He *= cosph0;
          break;
      }
      P.inv = e_inv;
      P.fwd = e_fwd;
    }
  }

  function e_fwd(lp, xy) {
    var coslam, cosphi, sinphi, rho;
    var azi1, azi2, s12;
    var lam1, phi1, lam2, phi2;
    var vars;

    coslam = cos(lp.lam);
    cosphi = cos(lp.phi);
    sinphi = sin(lp.phi);
    switch (mode) {
      case N_POLE:
        coslam = -coslam;
      /* falls through */
      case S_POLE:
        xy.x =
          (rho = fabs(Mp - pj_mlfn(lp.phi, sinphi, cosphi, en))) * sin(lp.lam);
        xy.y = rho * coslam;
        break;
      case EQUIT:
      case OBLIQ:
        if (fabs(lp.lam) < EPS10 && fabs(lp.phi - P.phi0) < EPS10) {
          xy.x = xy.y = 0;
          break;
        }
        phi1 = P.phi0 / DEG_TO_RAD;
        lam1 = P.lam0 / DEG_TO_RAD;
        phi2 = lp.phi / DEG_TO_RAD;
        lam2 = (lp.lam + P.lam0) / DEG_TO_RAD;
        vars = g.Inverse(phi1, lam1, phi2, lam2, g.AZIMUTH); // , &s12, &azi1, &azi2);
        azi1 = vars.azi1 * DEG_TO_RAD;
        s12 = vars.s12;
        xy.x = (s12 * sin(azi1)) / P.a;
        xy.y = (s12 * cos(azi1)) / P.a;
        break;
    }
  }

  function e_inv(xy, lp) {
    var c, azi1, azi2, s12, x2, y2, lat1, lon1, lat2, lon2;
    var vars;
    if ((c = hypot(xy.x, xy.y)) < EPS10) {
      lp.phi = P.phi0;
      lp.lam = 0;
      return lp;
    }
    if (mode == OBLIQ || mode == EQUIT) {
      x2 = xy.x * P.a;
      y2 = xy.y * P.a;
      lat1 = P.phi0 / DEG_TO_RAD;
      lon1 = P.lam0 / DEG_TO_RAD;
      azi1 = atan2(x2, y2) / DEG_TO_RAD;
      s12 = sqrt(x2 * x2 + y2 * y2);
      vars = g.Direct(lat1, lon1, azi1, s12, g.STANDARD); // , &lat2, &lon2, &azi2);
      lp.phi = vars.lat2 * DEG_TO_RAD;
      lp.lam = vars.lon2 * DEG_TO_RAD;
      lp.lam -= P.lam0;
    } else {
      /* Polar */
      lp.phi = pj_inv_mlfn(mode == N_POLE ? Mp - c : Mp + c, P.es, en);
      lp.lam = atan2(xy.x, mode == N_POLE ? -xy.y : xy.y);
    }
  }

  function s_fwd(lp, xy) {
    var coslam, cosphi, sinphi;
    sinphi = sin(lp.phi);
    cosphi = cos(lp.phi);
    coslam = cos(lp.lam);
    switch (mode) {
      case EQUIT:
      case OBLIQ:
        if (mode == EQUIT) {
          xy.y = cosphi * coslam;
        } else {
          xy.y = sinph0 * sinphi + cosph0 * cosphi * coslam;
        }
        if (fabs(fabs(xy.y) - 1) < TOL)
          if (xy.y < 0) f_error();
          else xy.x = xy.y = 0;
        else {
          xy.y = acos(xy.y);
          xy.y /= sin(xy.y);
          xy.x = xy.y * cosphi * sin(lp.lam);
          xy.y *=
            mode == EQUIT ? sinphi : cosph0 * sinphi - sinph0 * cosphi * coslam;
        }
        break;
      case N_POLE:
        lp.phi = -lp.phi;
        coslam = -coslam;
      /* falls through */
      case S_POLE:
        if (fabs(lp.phi - M_HALFPI) < EPS10) f_error();
        xy.x = (xy.y = M_HALFPI + lp.phi) * sin(lp.lam);
        xy.y *= coslam;
        break;
    }
  }

  function s_inv(xy, lp) {
    var x = xy.x,
      y = xy.y;
    var cosc, c_rh, sinc;
    if ((c_rh = hypot(x, y)) > M_PI) {
      if (c_rh - EPS10 > M_PI) i_error();
      c_rh = M_PI;
    } else if (c_rh < EPS10) {
      lp.phi = P.phi0;
      lp.lam = 0;
      return;
    }
    if (mode == OBLIQ || mode == EQUIT) {
      sinc = sin(c_rh);
      cosc = cos(c_rh);
      if (mode == EQUIT) {
        lp.phi = aasin((y * sinc) / c_rh);
        x *= sinc;
        y = cosc * c_rh;
      } else {
        lp.phi = aasin(cosc * sinph0 + (y * sinc * cosph0) / c_rh);
        y = (cosc - sinph0 * sin(lp.phi)) * c_rh;
        x *= sinc * cosph0;
      }
      lp.lam = y == 0 ? 0 : atan2(x, y);
    } else if (mode == N_POLE) {
      lp.phi = M_HALFPI - c_rh;
      lp.lam = atan2(x, -y);
    } else {
      lp.phi = c_rh - M_HALFPI;
      lp.lam = atan2(x, y);
    }
  }

  function e_guam_fwd(lp, xy) {
    var cosphi, sinphi, t;
    cosphi = cos(lp.phi);
    sinphi = sin(lp.phi);
    t = 1 / sqrt(1 - P.es * sinphi * sinphi);
    xy.x = lp.lam * cosphi * t;
    xy.y =
      pj_mlfn(lp.phi, sinphi, cosphi, en) -
      M1 +
      0.5 * lp.lam * lp.lam * cosphi * sinphi * t;
  }

  function e_guam_inv(xy, lp) {
    var x2, t, i;
    x2 = 0.5 * xy.x * xy.x;
    lp.phi = P.phi0;
    for (i = 0; i < 3; ++i) {
      t = P.e * sin(lp.phi);
      lp.phi = pj_inv_mlfn(
        M1 + xy.y - x2 * tan(lp.phi) * (t = sqrt(1 - t * t)),
        P.es,
        en
      );
    }
    lp.lam = (xy.x * t) / cos(lp.phi);
  }
}

pj_add(pj_airy, 'airy', 'Airy', 'Misc Sph, no inv.\nno_cut lat_b=');

function pj_airy(P) {
  var EPS = 1e-10,
    N_POLE = 0,
    S_POLE = 1,
    EQUIT = 2,
    OBLIQ = 3,
    p_halfphi,
    sinph0,
    cosph0,
    Cb,
    mode,
    no_cut,
    beta;

  P.es = 0;
  P.fwd = s_fwd;

  no_cut = pj_param(P.params, 'bno_cut');
  beta = 0.5 * (M_HALFPI - pj_param(P.params, 'rlat_b'));
  if (fabs(beta) < EPS) Cb = -0.5;
  else {
    Cb = 1 / tan(beta);
    Cb *= Cb * log(cos(beta));
  }

  if (fabs(fabs(P.phi0) - M_HALFPI) < EPS)
    if (P.phi0 < 0) {
      p_halfpi = -M_HALFPI;
      mode = S_POLE;
    } else {
      p_halfpi = M_HALFPI;
      mode = N_POLE;
    }
  else {
    if (fabs(P.phi0) < EPS) mode = EQUIT;
    else {
      mode = OBLIQ;
      sinph0 = sin(P.phi0);
      cosph0 = cos(P.phi0);
    }
  }

  function s_fwd(lp, xy) {
    var sinlam, coslam, cosphi, sinphi, t, s, Krho, cosz;
    sinlam = sin(lp.lam);
    coslam = cos(lp.lam);
    switch (mode) {
      case EQUIT:
      case OBLIQ:
        sinphi = sin(lp.phi);
        cosphi = cos(lp.phi);
        cosz = cosphi * coslam;
        if (mode == OBLIQ) cosz = sinph0 * sinphi + cosph0 * cosz;
        if (!no_cut && cosz < -EPS) f_error();
        if (fabs((s = 1 - cosz)) > EPS) {
          t = 0.5 * (1 + cosz);
          Krho = -log(t) / s - Cb / t;
        } else {
          Krho = 0.5 - Cb;
        }
        xy.x = Krho * cosphi * sinlam;
        if (mode == OBLIQ)
          xy.y = Krho * (cosph0 * sinphi - sinph0 * cosphi * coslam);
        else xy.y = Krho * sinphi;
        break;
      case S_POLE:
      case N_POLE:
        lp.phi = fabs(p_halfpi - lp.phi);
        if (!no_cut && lp.phi - EPS > M_HALFPI) f_error();
        if ((lp.phi *= 0.5) > EPS) {
          t = tan(lp.phi);
          Krho = -2 * (log(cos(lp.phi)) / t + t * Cb);
          xy.x = Krho * sinlam;
          xy.y = Krho * coslam;
          if (mode == N_POLE) xy.y = -xy.y;
        } else xy.x = xy.y = 0;
    }
  }
}

pj_add(pj_wintri, 'wintri', 'Winkel Tripel', 'Misc Sph\nlat_1');
pj_add(pj_aitoff, 'aitoff', 'Aitoff', 'Misc Sph');

function pj_wintri(P) {
  var Q = (P.opaque = { mode: 1 });
  if (pj_param(P.params, 'tlat_1')) {
    if ((Q.cosphi1 = cos(pj_param(P.params, 'rlat_1'))) === 0) {
      e_error(-22);
    }
  } else {
    /* 50d28' or acos(2/pi) */
    Q.cosphi1 = 0.636619772367581343;
  }
  pj_aitoff(P);
}

function pj_aitoff(P) {
  var Q = P.opaque || { mode: 0 };

  P.inv = s_inv;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var c, d;
    if ((d = acos(cos(lp.phi) * cos((c = 0.5 * lp.lam))))) {
      /* basic Aitoff */
      xy.x = 2 * d * cos(lp.phi) * sin(c) * (xy.y = 1 / sin(d));
      xy.y *= d * sin(lp.phi);
    } else xy.x = xy.y = 0;
    if (Q.mode) {
      /* Winkel Tripel */
      xy.x = (xy.x + lp.lam * Q.cosphi1) * 0.5;
      xy.y = (xy.y + lp.phi) * 0.5;
    }
  }

  function s_inv(xy, lp) {
    var MAXITER = 10,
      MAXROUND = 20,
      EPSILON = 1e-12,
      round = 0,
      iter,
      D,
      C,
      f1,
      f2,
      f1p,
      f1l,
      f2p,
      f2l,
      dp,
      dl,
      sl,
      sp,
      cp,
      cl,
      x,
      y;

    if (fabs(xy.x) < EPSILON && fabs(xy.y) < EPSILON) {
      lp.phi = 0;
      lp.lam = 0;
      return;
    }

    /* intial values for Newton-Raphson method */
    lp.phi = xy.y;
    lp.lam = xy.x;
    do {
      iter = 0;
      do {
        sl = sin(lp.lam * 0.5);
        cl = cos(lp.lam * 0.5);
        sp = sin(lp.phi);
        cp = cos(lp.phi);
        D = cp * cl;
        C = 1 - D * D;
        D = acos(D) / pow(C, 1.5);
        f1 = 2 * D * C * cp * sl;
        f2 = D * C * sp;
        f1p = 2 * ((sl * cl * sp * cp) / C - D * sp * sl);
        f1l = (cp * cp * sl * sl) / C + D * cp * cl * sp * sp;
        f2p = (sp * sp * cl) / C + D * sl * sl * cp;
        f2l = 0.5 * ((sp * cp * sl) / C - D * sp * cp * cp * sl * cl);
        if (Q.mode) {
          /* Winkel Tripel */
          f1 = 0.5 * (f1 + lp.lam * Q.cosphi1);
          f2 = 0.5 * (f2 + lp.phi);
          f1p *= 0.5;
          f1l = 0.5 * (f1l + Q.cosphi1);
          f2p = 0.5 * (f2p + 1);
          f2l *= 0.5;
        }
        f1 -= xy.x;
        f2 -= xy.y;
        dl = (f2 * f1p - f1 * f2p) / (dp = f1p * f2l - f2p * f1l);
        dp = (f1 * f2l - f2 * f1l) / dp;
        while (dl > M_PI) dl -= M_PI; /* set to interval [-M_PI, M_PI]  */
        while (dl < -M_PI) dl += M_PI; /* set to interval [-M_PI, M_PI]  */
        lp.phi -= dp;
        lp.lam -= dl;
      } while ((fabs(dp) > EPSILON || fabs(dl) > EPSILON) && iter++ < MAXITER);
      if (lp.phi > M_HALFPI)
        lp.phi -=
          2 *
          (lp.phi - M_HALFPI); /* correct if symmetrical solution for Aitoff */
      if (lp.phi < -M_HALFPI)
        lp.phi -=
          2 *
          (lp.phi + M_HALFPI); /* correct if symmetrical solution for Aitoff */
      if (fabs(fabs(lp.phi) - M_HALFPI) < EPSILON && !Q.mode)
        lp.lam = 0; /* if pole in Aitoff, return longitude of 0 */

      /* calculate x,y coordinates with solution obtained */
      if ((D = acos(cos(lp.phi) * cos((C = 0.5 * lp.lam))))) {
        /* Aitoff */
        x = 2 * D * cos(lp.phi) * sin(C) * (y = 1 / sin(D));
        y *= D * sin(lp.phi);
      } else x = y = 0;
      if (Q.mode) {
        /* Winkel Tripel */
        x = (x + lp.lam * Q.cosphi1) * 0.5;
        y = (y + lp.phi) * 0.5;
      }
      /* if too far from given values of x,y, repeat with better approximation of phi,lam */
    } while (
      (fabs(xy.x - x) > EPSILON || fabs(xy.y - y) > EPSILON) &&
      round++ < MAXROUND
    );

    if (iter == MAXITER && round == MAXROUND) {
      // not ported: warning message
      // fprintf(stderr, "Warning: Accuracy of 1e-12 not reached. Last increments: dlat=%e and dlon=%e\n", dp, dl);
    }
  }
}

pj_add(pj_august, 'august', 'August Epicycloidal', 'Misc Sph, no inv.');

function pj_august(P) {
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var M = 4 / 3;
    var lam = lp.lam;
    var t, c1, c, x1, x12, y1, y12;
    t = tan(0.5 * lp.phi);
    c1 = sqrt(1 - t * t);
    c = 1 + c1 * cos((lam *= 0.5));
    x1 = (sin(lam) * c1) / c;
    y1 = t / c;
    xy.x = M * x1 * (3 + (x12 = x1 * x1) - 3 * (y12 = y1 * y1));
    xy.y = M * y1 * (3 + 3 * x12 - y12);
  }
}

pj_add(pj_apian, 'apian', 'Apian Globular I', 'Misc Sph, no inv.');
pj_add(pj_ortel, 'ortel', 'Ortelius Oval', 'Misc Sph, no inv.');
pj_add(pj_bacon, 'bacon', 'Bacon Globular', 'Misc Sph, no inv.');

function pj_bacon(P) {
  pj_bacon_init(P, true, false);
}

function pj_apian(P) {
  pj_bacon_init(P, false, false);
}

function pj_ortel(P) {
  pj_bacon_init(P, false, true);
}

function pj_bacon_init(P, bacn, ortl) {
  P.es = 0;
  P.fwd = s_fwd;

  function s_fwd(lp, xy) {
    var HLFPI2 = 2.46740110027233965467; /* (pi/2)^2 */
    var EPS = 1e-10;
    var ax, f;
    xy.y = bacn ? M_HALFPI * sin(lp.phi) : lp.phi;
    if ((ax = fabs(lp.lam)) >= EPS) {
      if (ortl && ax >= M_HALFPI)
        xy.x = sqrt(HLFPI2 - lp.phi * lp.phi + EPS) + ax - M_HALFPI;
      else {
        f = 0.5 * (HLFPI2 / ax + ax);
        xy.x = ax - f + sqrt(f * f - xy.y * xy.y);
      }
      if (lp.lam < 0) xy.x = -xy.x;
    } else xy.x = 0;
  }
}

/*
  Created by Jacques Bertin in 1953, this projection was the go-to choice
  of the French cartographic school when they wished to represent phenomena
  on a global scale.

  Formula designed by Philippe Rivière, 2017.
  https://visionscarto.net/bertin-projection-1953
  Port to PROJ by Philippe Rivière, 21 September 2018
  Port to JavaScript by Matthew Bloch October 2018
*/
pj_add(pj_bertin1953, 'bertin1953', 'Bertin 1953', 'Misc., Sph., NoInv.');

function pj_bertin1953(P) {
  var cos_delta_phi, sin_delta_phi, cos_delta_gamma, sin_delta_gamma;

  P.es = 0;
  P.fwd = s_fwd;
  P.lam0 = 0;
  P.phi0 = DEG_TO_RAD * -42;

  cos_delta_phi = cos(P.phi0);
  sin_delta_phi = sin(P.phi0);
  cos_delta_gamma = 1;
  sin_delta_gamma = 0;

  function s_fwd(lp, xy) {
    var fu = 1.4,
      k = 12,
      w = 1.68,
      d;
    /* Rotate */
    var cosphi, x, y, z, z0;
    lp.lam += DEG_TO_RAD * -16.5;
    cosphi = cos(lp.phi);
    x = cos(lp.lam) * cosphi;
    y = sin(lp.lam) * cosphi;
    z = sin(lp.phi);
    z0 = z * cos_delta_phi + x * sin_delta_phi;
    lp.lam = atan2(
      y * cos_delta_gamma - z0 * sin_delta_gamma,
      x * cos_delta_phi - z * sin_delta_phi
    );
    z0 = z0 * cos_delta_gamma + y * sin_delta_gamma;
    lp.phi = asin(z0);
    lp.lam = adjlon(lp.lam);

    /* Adjust pre-projection */
    if (lp.lam + lp.phi < -fu) {
      d = ((lp.lam - lp.phi + 1.6) * (lp.lam + lp.phi + fu)) / 8;
      lp.lam += d;
      lp.phi -= 0.8 * d * sin(lp.phi + M_PI / 2);
    }

    /* Project with Hammer (1.68,2) */
    cosphi = cos(lp.phi);
    d = sqrt(2 / (1 + cosphi * cos(lp.lam / 2)));
    xy.x = w * d * cosphi * sin(lp.lam / 2);
    xy.y = d * sin(lp.phi);

    /* Adjust post-projection */
    d = (1 - cos(lp.lam * lp.phi)) / k;
    if (xy.y < 0) {
      xy.x *= 1 + d;
    }
    if (xy.y > 0) {
      xy.y *= 1 + (d / 1.5) * xy.x * xy.x;
    }

    return xy;
  }
}

pj_add(pj_boggs, 'boggs', 'Boggs Eumorphic', 'PCyl., no inv., Sph.');

function pj_boggs(P) {
  var NITER = 20,
    EPS = 1e-7,
    ONETOL = 1.000001,
    M_SQRT2 = sqrt(2),
    FXC = 2.00276,
    FXC2 = 1.11072,
    FYC = 0.49931;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var theta, th1, c, i;
    theta = lp.phi;
    if (fabs(fabs(lp.phi) - M_HALFPI) < EPS) xy.x = 0;
    else {
      c = sin(theta) * M_PI;
      for (i = NITER; i; --i) {
        theta -= th1 = (theta + sin(theta) - c) / (1 + cos(theta));
        if (fabs(th1) < EPS) break;
      }
      theta *= 0.5;
      xy.x = (FXC * lp.lam) / (1 / cos(lp.phi) + FXC2 / cos(theta));
    }
    xy.y = FYC * (lp.phi + M_SQRT2 * sin(theta));
  }
}

pj_add(pj_bonne, 'bonne', 'Bonne (Werner lat_1=90)', 'Conic Sph&Ell\nlat_1=');

function pj_bonne(P) {
  var EPS10 = 1e-10;
  var phi1, cphi1, am1, m1, en, c;

  phi1 = pj_param(P.params, 'rlat_1');
  if (fabs(phi1) < EPS10) e_error(-23);
  if (P.es) {
    en = pj_enfn(P.es);
    m1 = pj_mlfn(phi1, (am1 = sin(phi1)), (c = cos(phi1)), en);
    am1 = c / (sqrt(1 - P.es * am1 * am1) * am1);
    P.inv = e_inv;
    P.fwd = e_fwd;
  } else {
    if (fabs(phi1) + EPS10 >= M_HALFPI) cphi1 = 0;
    else cphi1 = 1 / tan(phi1);
    P.inv = s_inv;
    P.fwd = s_fwd;
  }

  function e_fwd(lp, xy) {
    var rh, E, c;
    rh = am1 + m1 - pj_mlfn(lp.phi, (E = sin(lp.phi)), (c = cos(lp.phi)), en);
    E = (c * lp.lam) / (rh * sqrt(1 - P.es * E * E));
    xy.x = rh * sin(E);
    xy.y = am1 - rh * cos(E);
  }

  function e_inv(xy, lp) {
    var s, rh;
    rh = hypot(xy.x, (xy.y = am1 - xy.y));
    lp.phi = pj_inv_mlfn(am1 + m1 - rh, P.es, en);
    if ((s = fabs(lp.phi)) < M_HALFPI) {
      s = sin(lp.phi);
      lp.lam = (rh * atan2(xy.x, xy.y) * sqrt(1 - P.es * s * s)) / cos(lp.phi);
    } else if (fabs(s - M_HALFPI) <= EPS10) lp.lam = 0;
    else i_error();
  }

  function s_fwd(lp, xy) {
    var E, rh;
    rh = cphi1 + phi1 - lp.phi;
    if (fabs(rh) > EPS10) {
      xy.x = rh * sin((E = (lp.lam * cos(lp.phi)) / rh));
      xy.y = cphi1 - rh * cos(E);
    } else xy.x = xy.y = 0;
  }

  function s_inv(xy, lp) {
    var rh = hypot(xy.x, (xy.y = cphi1 - xy.y));
    lp.phi = cphi1 + phi1 - rh;
    if (fabs(lp.phi) > M_HALFPI) i_error();
    if (fabs(fabs(lp.phi) - M_HALFPI) <= EPS10) lp.lam = 0;
    else lp.lam = (rh * atan2(xy.x, xy.y)) / cos(lp.phi);
  }
}

pj_add(pj_cass, 'cass', 'Cassini', 'Cyl, Sph&Ell');

function pj_cass(P) {
  var C1 = 0.16666666666666666666,
    C2 = 0.00833333333333333333,
    C3 = 0.04166666666666666666,
    C4 = 0.33333333333333333333,
    C5 = 0.06666666666666666666;
  var m0, en;

  if (P.es) {
    en = pj_enfn(P.es);
    m0 = pj_mlfn(P.phi0, sin(P.phi0), cos(P.phi0), en);
    P.fwd = e_fwd;
    P.inv = e_inv;
  } else {
    P.fwd = s_fwd;
    P.inv = s_inv;
  }

  function e_fwd(lp, xy) {
    var n, t, a1, c, a2, tn;
    xy.y = pj_mlfn(lp.phi, (n = sin(lp.phi)), (c = cos(lp.phi)), en);

    n = 1 / sqrt(1 - P.es * n * n);
    tn = tan(lp.phi);
    t = tn * tn;
    a1 = lp.lam * c;
    c *= (P.es * c) / (1 - P.es);
    a2 = a1 * a1;

    xy.x = n * a1 * (1 - a2 * t * (C1 - (8 - t + 8 * c) * a2 * C2));
    xy.y -= m0 - n * tn * a2 * (0.5 + (5 - t + 6 * c) * a2 * C3);
  }

  function e_inv(xy, lp) {
    var n, t, r, dd, d2, tn, ph1;
    ph1 = pj_inv_mlfn(m0 + xy.y, P.es, en);
    tn = tan(ph1);
    t = tn * tn;
    n = sin(ph1);
    r = 1 / (1 - P.es * n * n);
    n = sqrt(r);
    r *= (1 - P.es) * n;
    dd = xy.x / n;
    d2 = dd * dd;
    lp.phi = ph1 - ((n * tn) / r) * d2 * (0.5 - (1 + 3 * t) * d2 * C3);
    lp.lam = (dd * (1 + t * d2 * (-C4 + (1 + 3 * t) * d2 * C5))) / cos(ph1);
  }

  function s_fwd(lp, xy) {
    xy.x = asin(cos(lp.phi) * sin(lp.lam));
    xy.y = atan2(tan(lp.phi), cos(lp.lam)) - P.phi0;
  }

  function s_inv(xy, lp) {
    var dd = xy.y + P.phi0;
    lp.phi = asin(sin(dd) * cos(xy.x));
    lp.lam = atan2(tan(xy.x), cos(dd));
  }
}

function pj_authset(es) {
  var P00 = 0.33333333333333333333 /*   1 /     3 */,
    P01 = 0.17222222222222222222 /*  31 /   180 */,
    P02 = 0.10257936507936507937 /* 517 /  5040 */,
    P10 = 0.06388888888888888888 /*  23 /   360 */,
    P11 = 0.06640211640211640212 /* 251 /  3780 */,
    P20 = 0.01677689594356261023 /* 761 / 45360 */,
    APA = [];
  var t;

  APA[0] = es * P00;
  t = es * es;
  APA[0] += t * P01;
  APA[1] = t * P10;
  t *= es;
  APA[0] += t * P02;
  APA[1] += t * P11;
  APA[2] = t * P20;
  return APA;
}

function pj_authlat(beta, APA) {
  var t = beta + beta;
  return beta + APA[0] * sin(t) + APA[1] * sin(t + t) + APA[2] * sin(t + t + t);
}

pj_add(pj_cea, 'cea', 'Equal Area Cylindrical', 'Cyl, Sph&Ell\nlat_ts=');

function pj_cea(P) {
  var t = 0,
    qp,
    apa;
  if (pj_param(P.params, 'tlat_ts')) {
    P.k0 = cos((t = pj_param(P.params, 'rlat_ts')));
    if (P.k0 < 0) {
      e_error(-24);
    }
  }
  if (P.es) {
    t = sin(t);
    P.k0 /= sqrt(1 - P.es * t * t);
    P.e = sqrt(P.es);
    if (!(apa = pj_authset(P.es))) e_error_0();
    qp = pj_qsfn(1, P.e, P.one_es);
    P.fwd = e_fwd;
    P.inv = e_inv;
  } else {
    P.fwd = s_fwd;
    P.inv = s_inv;
  }

  function e_fwd(lp, xy) {
    xy.x = P.k0 * lp.lam;
    xy.y = (0.5 * pj_qsfn(sin(lp.phi), P.e, P.one_es)) / P.k0;
  }

  function e_inv(xy, lp) {
    lp.phi = pj_authlat(asin((2 * xy.y * P.k0) / qp), apa);
    lp.lam = xy.x / P.k0;
  }

  function s_fwd(lp, xy) {
    xy.x = P.k0 * lp.lam;
    xy.y = sin(lp.phi) / P.k0;
  }

  function s_inv(xy, lp) {
    var x = xy.x,
      y = xy.y;
    var t;
    if ((t = fabs((y *= P.k0))) - EPS10 <= 1) {
      if (t >= 1) lp.phi = y < 0 ? -M_HALFPI : M_HALFPI;
      else lp.phi = asin(y);
      lp.lam = x / P.k0;
    } else i_error();
  }
}

pj_add(
  pj_chamb,
  'chamb',
  'Chamberlin Trimetric',
  'Misc Sph, no inv.\nlat_1= lon_1= lat_2= lon_2= lat_3= lon_3='
);

function pj_chamb(P) {
  var THIRD = 1 / 3,
    TOL = 1e-9,
    c = [],
    x0,
    y0,
    v,
    beta_0,
    beta_1,
    beta_2,
    i,
    j;

  for (i = 0; i < 3; ++i) {
    /* get control point locations */
    c[i] = { p: {} };
    c[i].phi = pj_param(P.params, 'rlat_' + (i + 1));
    c[i].lam = pj_param(P.params, 'rlon_' + (i + 1));
    c[i].lam = adjlon(c[i].lam - P.lam0);
    c[i].cosphi = cos(c[i].phi);
    c[i].sinphi = sin(c[i].phi);
  }
  for (i = 0; i < 3; ++i) {
    /* inter ctl pt. distances and azimuths */
    j = i == 2 ? 0 : i + 1;
    c[i].v = vect(
      c[j].phi - c[i].phi,
      c[i].cosphi,
      c[i].sinphi,
      c[j].cosphi,
      c[j].sinphi,
      c[j].lam - c[i].lam
    );

    if (!c[i].v.r) e_error(-25);
    /* co-linearity problem ignored for now */
  }
  beta_0 = lc(c[0].v.r, c[2].v.r, c[1].v.r);
  beta_1 = lc(c[0].v.r, c[1].v.r, c[2].v.r);
  beta_2 = M_PI - beta_0;
  y0 = 2 * (c[0].p.y = c[1].p.y = c[2].v.r * sin(beta_0));
  c[2].p.y = 0;
  c[0].p.x = -(c[1].p.x = 0.5 * c[0].v.r);
  x0 = c[2].p.x = c[0].p.x + c[2].v.r * cos(beta_0);

  P.es = 0;
  P.fwd = s_fwd;

  function s_fwd(lp, xy) {
    var sinphi, cosphi, a, i, j, x, y;
    var v = [];
    sinphi = sin(lp.phi);
    cosphi = cos(lp.phi);
    for (i = 0; i < 3; ++i) {
      /* dist/azimiths from control */
      v[i] = vect(
        lp.phi - c[i].phi,
        c[i].cosphi,
        c[i].sinphi,
        cosphi,
        sinphi,
        lp.lam - c[i].lam
      );
      if (!v[i].r) break;
      v[i].Az = adjlon(v[i].Az - c[i].v.Az);
    }
    if (i < 3) {
      /* current point at control point */
      x = c[i].p.x;
      y = c[i].p.y;
    } else {
      /* point mean of intercepts */
      x = x0;
      y = y0;
      for (i = 0; i < 3; ++i) {
        j = i == 2 ? 0 : i + 1;
        a = lc(c[i].v.r, v[i].r, v[j].r);
        if (v[i].Az < 0) a = -a;
        if (!i) {
          /* coord comp unique to each arc */
          x += v[i].r * cos(a);
          y -= v[i].r * sin(a);
        } else if (i == 1) {
          a = beta_1 - a;
          x -= v[i].r * cos(a);
          y -= v[i].r * sin(a);
        } else {
          a = beta_2 - a;
          x += v[i].r * cos(a);
          y += v[i].r * sin(a);
        }
      }
      x *= THIRD; /* mean of arc intercepts */
      y *= THIRD;
    }
    xy.x = x;
    xy.y = y;
  }

  function vect(dphi, c1, s1, c2, s2, dlam) {
    var v = {};
    var cdl, dp, dl;
    cdl = cos(dlam);
    if (fabs(dphi) > 1 || fabs(dlam) > 1) v.r = aacos(cs1 * s2 + c1 * c2 * cdl);
    else {
      /* more accurate for smaller distances */
      dp = sin(0.5 * dphi);
      dl = sin(0.5 * dlam);
      v.r = 2 * aasin(sqrt(dp * dp + c1 * c2 * dl * dl));
    }
    if (fabs(v.r) > TOL) v.Az = atan2(c2 * sin(dlam), c1 * s2 - s1 * c2 * cdl);
    else v.r = v.Az = 0;
    return v;
  }

  /* law of cosines */
  function lc(b, c, a) {
    return aacos((0.5 * (b * b + c * c - a * a)) / (b * c));
  }
}

pj_add(pj_crast, 'crast', 'Craster Parabolic (Putnins P4)', 'PCyl., Sph.');

function pj_crast(P) {
  var XM = 0.97720502380583984317;
  var RXM = 1.02332670794648848847;
  var YM = 3.06998012383946546542;
  var RYM = 0.32573500793527994772;
  var THIRD = 1 / 3;
  P.inv = s_inv;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    lp.phi *= THIRD;
    xy.x = XM * lp.lam * (2 * cos(lp.phi + lp.phi) - 1);
    xy.y = YM * sin(lp.phi);
  }

  function s_inv(xy, lp) {
    lp.phi = 3 * asin(xy.y * RYM);
    lp.lam = (xy.x * RXM) / (2 * cos((lp.phi + lp.phi) * THIRD) - 1);
  }
}

pj_add(pj_cupola, 'cupola', 'Cupola', 'PCyl., Sph., NoInv.');

// Source: https://www.tandfonline.com/eprint/EE7Y8RK4GXA4ITWUTQPY/full?target=10.1080/23729333.2020.1862962
// See also: http://www.at-a-lanta.nl/weia/cupola.html

function pj_cupola(P) {
  var de = 0.5253; // part of the equator on intermediate sphere, default = 1
  var dp = 0.7264; // sin of angle of polar line, default = 1
  var ri = 1 / Math.sqrt(de * dp);
  var he = 0.4188; // height of equator (can be negative, default = 0)
  var se = 0.9701; // stretch in plane, default = 1
  var phi0 = 22 * DEG_TO_RAD; // phi of projection center
  // center of projection on intermediate sphere
  var pc = calcP(phi0);
  var qc = calcQ(0);
  var spc = sin(pc);
  var cpc = cos(pc);

  // apply default central meridian
  if (!pj_param(P.params, 'tlon_0')) {
    P.lam0 = 11.023 * DEG_TO_RAD;
  }

  P.es = 0;
  P.fwd = s_fwd;

  function calcP(phi) {
    return asin(dp * sin(phi) + he * sqrt(de * dp));
  }

  function calcQ(lam) {
    return de * lam;
  }

  function s_fwd(lp, xy) {
    var p = calcP(lp.phi);
    var q = calcQ(lp.lam);
    var sp = sin(p);
    var cp = cos(p);
    var sqqc = sin(q - qc);
    var cqqc = cos(q - qc);
    var K = sqrt(2 / (1 + sin(pc) * sp + cpc * cp * cqqc));
    xy.x = ri * K * cp * sqqc * se;
    xy.y = (ri * K * (cpc * sp - spc * cp * cqqc)) / se;
  }
}

pj_add(pj_denoy, 'denoy', 'Denoyer Semi-Elliptical', 'PCyl, Sph., no inv.');

function pj_denoy(P) {
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var C0 = 0.95;
    var C1 = -0.08333333333333333333;
    var C3 = 0.00166666666666666666;
    var D1 = 0.9;
    var D5 = 0.03;
    var lam = fabs(lp.lam);
    xy.y = lp.phi;
    xy.x = lp.lam;
    xy.x *= cos(
      (C0 + lam * (C1 + lam * lam * C3)) *
        (lp.phi * (D1 + D5 * lp.phi * lp.phi * lp.phi * lp.phi))
    );
  }
}

pj_add(pj_eck1, 'eck1', 'Eckert I', 'PCyl Sph');
pj_add(pj_eck2, 'eck2', 'Eckert II', 'PCyl Sph');
pj_add(pj_eck3, 'eck3', 'Eckert III', 'PCyl Sph');
pj_add(pj_wag6, 'wag6', 'Wagner VI', 'PCyl Sph');
pj_add(pj_kav7, 'kav7', 'Kavraisky VII', 'PCyl Sph');
pj_add(pj_putp1, 'putp1', 'Putnins P1', 'PCyl Sph');
pj_add(pj_eck4, 'eck4', 'Eckert IV', 'PCyl Sph');
pj_add(pj_eck5, 'eck5', 'Eckert V', 'PCyl Sph');

function pj_eck1(P) {
  var FC = 0.92131773192356127802,
    RP = 0.31830988618379067154;
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = FC * lp.lam * (1 - RP * fabs(lp.phi));
    xy.y = FC * lp.phi;
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y / FC;
    lp.lam = xy.x / (FC * (1 - RP * fabs(lp.phi)));
  }
}

function pj_eck2(P) {
  var FXC = 0.46065886596178063902,
    FYC = 1.44720250911653531871,
    C13 = 0.33333333333333333333,
    ONEEPS = 1.0000001;
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = FXC * lp.lam * (xy.y = sqrt(4 - 3 * sin(fabs(lp.phi))));
    xy.y = FYC * (2 - xy.y);
    if (lp.phi < 0) xy.y = -xy.y;
  }

  function s_inv(xy, lp) {
    lp.lam = xy.x / (FXC * (lp.phi = 2 - fabs(xy.y) / FYC));
    lp.phi = (4 - lp.phi * lp.phi) * C13;
    if (fabs(lp.phi) >= 1) {
      if (fabs(lp.phi) > ONEEPS) i_error();
      else lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
    } else lp.phi = asin(lp.phi);
    if (xy.y < 0) lp.phi = -lp.phi;
  }
}

function pj_eck3(P) {
  var Q = {
    C_x: 0.42223820031577120149,
    C_y: 0.84447640063154240298,
    A: 1,
    B: 0.4052847345693510857755
  };
  pj_eck3_init(P, Q);
}

function pj_kav7(P) {
  var Q = {
    C_x: 0.8660254037844,
    C_y: 1,
    A: 0,
    B: 0.30396355092701331433
  };
  pj_eck3_init(P, Q);
}

function pj_wag6(P) {
  var Q = {
    C_x: 0.94745,
    C_y: 0.94745,
    A: 0,
    B: 0.30396355092701331433
  };
  pj_eck3_init(P, Q);
}

function pj_putp1(P) {
  var Q = {
    C_x: 1.8949,
    C_y: 0.94745,
    A: -0.5,
    B: 0.30396355092701331433
  };
  pj_eck3_init(P, Q);
}

function pj_eck3_init(P, Q) {
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.y = Q.C_y * lp.phi;
    xy.x = Q.C_x * lp.lam * (Q.A + asqrt(1 - Q.B * lp.phi * lp.phi));
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y / Q.C_y;
    lp.lam = xy.x / (Q.C_x * (Q.A + asqrt(1 - Q.B * lp.phi * lp.phi)));
  }
}

function pj_eck4(P) {
  var C_x = 0.42223820031577120149,
    C_y = 1.32650042817700232218,
    RC_y = 0.75386330736002178205,
    C_p = 3.57079632679489661922,
    RC_p = 0.28004957675577868795,
    EPS = 1e-7,
    NITER = 6;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var p, V, s, c, i;
    p = C_p * sin(lp.phi);
    V = lp.phi * lp.phi;
    lp.phi *= 0.895168 + V * (0.0218849 + V * 0.00826809);
    for (i = NITER; i; --i) {
      c = cos(lp.phi);
      s = sin(lp.phi);
      lp.phi -= V = (lp.phi + s * (c + 2) - p) / (1 + c * (c + 2) - s * s);
      if (fabs(V) < EPS) break;
    }
    if (!i) {
      xy.x = C_x * lp.lam;
      xy.y = lp.phi < 0 ? -C_y : C_y;
    } else {
      xy.x = C_x * lp.lam * (1 + cos(lp.phi));
      xy.y = C_y * sin(lp.phi);
    }
  }

  function s_inv(xy, lp) {
    var c;
    lp.phi = aasin(xy.y / C_y);
    lp.lam = xy.x / (C_x * (1 + (c = cos(lp.phi))));
    lp.phi = aasin((lp.phi + sin(lp.phi) * (c + 2)) / C_p);
  }
}

function pj_eck5(P) {
  var XF = 0.44101277172455148219,
    RXF = 2.26750802723822639137,
    YF = 0.88202554344910296438,
    RYF = 1.13375401361911319568;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = XF * (1 + cos(lp.phi)) * lp.lam;
    xy.y = YF * lp.phi;
  }

  function s_inv(xy, lp) {
    lp.lam = (RXF * xy.x) / (1 + cos((lp.phi = RYF * xy.y)));
  }
}

pj_add(
  pj_eqc,
  'eqc',
  'Equidistant Cylindrical (Plate Caree)',
  'Cyl, Sph\nlat_ts=[, lat_0=0]'
);

function pj_eqc(P) {
  var rc = cos(pj_param(P.params, 'rlat_ts'));
  if (rc <= 0) e_error(-24);
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = rc * lp.lam;
    xy.y = lp.phi - P.phi0;
  }

  function s_inv(xy, lp) {
    lp.lam = xy.x / rc;
    lp.phi = xy.y + P.phi0;
  }
}

pj_add(pj_eqdc, 'eqdc', 'Equidistant Conic', 'Conic, Sph&Ell\nlat_1= lat_2=');

function pj_eqdc(P) {
  var phi1, phi2, n, rho, rho0, c, en, ellips, cosphi, sinphi, secant;
  var ml1, m1;
  phi1 = pj_param(P.params, 'rlat_1');
  phi2 = pj_param(P.params, 'rlat_2');
  if (fabs(phi1 + phi2) < EPS10) e_error(-21);
  if (!(en = pj_enfn(P.es))) e_error_0();
  n = sinphi = sin(phi1);
  cosphi = cos(phi1);
  secant = fabs(phi1 - phi2) >= EPS10;
  if ((ellips = P.es > 0)) {
    m1 = pj_msfn(sinphi, cosphi, P.es);
    ml1 = pj_mlfn(phi1, sinphi, cosphi, en);
    if (secant) {
      /* secant cone */
      sinphi = sin(phi2);
      cosphi = cos(phi2);
      n =
        (m1 - pj_msfn(sinphi, cosphi, P.es)) /
        (pj_mlfn(phi2, sinphi, cosphi, en) - ml1);
    }
    c = ml1 + m1 / n;
    rho0 = c - pj_mlfn(P.phi0, sin(P.phi0), cos(P.phi0), en);
  } else {
    if (secant) n = (cosphi - cos(phi2)) / (phi2 - phi1);
    c = phi1 + cos(phi1) / n;
    rho0 = c - P.phi0;
  }

  P.fwd = e_fwd;
  P.inv = e_inv;

  function e_fwd(lp, xy) {
    rho = c - (ellips ? pj_mlfn(lp.phi, sin(lp.phi), cos(lp.phi), en) : lp.phi);
    xy.x = rho * sin((lp.lam *= n));
    xy.y = rho0 - rho * cos(lp.lam);
  }

  function e_inv(xy, lp) {
    if ((rho = hypot(xy.x, (xy.y = rho0 - xy.y))) != 0.0) {
      if (n < 0) {
        rho = -rho;
        xy.x = -xy.x;
        xy.y = -xy.y;
      }
      lp.phi = c - rho;
      if (ellips) lp.phi = pj_inv_mlfn(lp.phi, P.es, en);
      lp.lam = atan2(xy.x, xy.y) / n;
    } else {
      lp.lam = 0;
      lp.phi = n > 0 ? M_HALFPI : -M_HALFPI;
    }
  }
}

/**
 * Copyright 2018 Bernie Jenny, Monash University, Melbourne, Australia.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Equal Earth is a projection inspired by the Robinson projection, but unlike
 * the Robinson projection retains the relative size of areas. The projection
 * was designed in 2018 by Bojan Savric, Tom Patterson and Bernhard Jenny.
 *
 * Publication:
 * Bojan Savric, Tom Patterson & Bernhard Jenny (2018). The Equal Earth map
 * projection, International Journal of Geographical Information Science,
 * DOI: 10.1080/13658816.2018.1504949
 *
 * Code released August 2018
 * Ported to JavaScript and adapted for mapshaper-proj by Matthew Bloch August 2018
 */
pj_add(pj_eqearth, 'eqearth', 'Equal Earth', 'PCyl., Sph.');

function pj_eqearth(P) {
  var A1 = 1.340264,
    A2 = -0.081106,
    A3 = 0.000893,
    A4 = 0.003796,
    M = Math.sqrt(3) / 2.0;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var paramLat = Math.asin(M * Math.sin(lp.phi)),
      paramLatSq = paramLat * paramLat,
      paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
    xy.x =
      (lp.lam * Math.cos(paramLat)) /
      (M *
        (A1 +
          3 * A2 * paramLatSq +
          paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq)));
    xy.y =
      paramLat * (A1 + A2 * paramLatSq + paramLatPow6 * (A3 + A4 * paramLatSq));
  }

  function s_inv(xy, lp) {
    var EPS = 1e-9,
      NITER = 12,
      paramLat = xy.y,
      paramLatSq,
      paramLatPow6,
      fy,
      fpy,
      dlat,
      i;

    for (i = 0; i < NITER; ++i) {
      paramLatSq = paramLat * paramLat;
      paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
      fy =
        paramLat *
          (A1 + A2 * paramLatSq + paramLatPow6 * (A3 + A4 * paramLatSq)) -
        xy.y;
      fpy =
        A1 +
        3 * A2 * paramLatSq +
        paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq);
      paramLat -= dlat = fy / fpy;
      if (Math.abs(dlat) < EPS) {
        break;
      }
    }
    paramLatSq = paramLat * paramLat;
    paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
    lp.lam =
      (M *
        xy.x *
        (A1 +
          3 * A2 * paramLatSq +
          paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq))) /
      Math.cos(paramLat);
    lp.phi = Math.asin(Math.sin(paramLat) / M);
  }
}

pj_add(
  pj_etmerc,
  'etmerc',
  'Extended Transverse Mercator',
  'Cyl, Sph\nlat_ts=(0)\nlat_0=(0)'
);

function pj_etmerc(P) {
  var cgb = [],
    cbg = [],
    utg = [],
    gtu = [],
    Qn,
    Zb,
    f,
    n,
    np,
    Z;
  if (P.es <= 0) e_error(-34);
  /* flattening */
  f = P.es / (1 + sqrt(1 - P.es)); /* Replaces: f = 1 - sqrt(1-P.es); */
  /* third flattening */
  np = n = f / (2 - f);
  /* COEF. OF TRIG SERIES GEO <-> GAUSS */
  /* cgb := Gaussian -> Geodetic, KW p190 - 191 (61) - (62) */
  /* cbg := Geodetic -> Gaussian, KW p186 - 187 (51) - (52) */
  /* PROJ_ETMERC_ORDER = 6th degree : Engsager and Poder: ICC2007 */
  cgb[0] =
    n *
    (2 +
      n *
        (-2 / 3 +
          n * (-2 + n * (116 / 45 + n * (26 / 45 + n * (-2854 / 675))))));
  cbg[0] =
    n *
    (-2 +
      n *
        (2 / 3 +
          n * (4 / 3 + n * (-82 / 45 + n * (32 / 45 + n * (4642 / 4725))))));
  np *= n;
  cgb[1] =
    np *
    (7 / 3 +
      n * (-8 / 5 + n * (-227 / 45 + n * (2704 / 315 + n * (2323 / 945)))));
  cbg[1] =
    np *
    (5 / 3 +
      n * (-16 / 15 + n * (-13 / 9 + n * (904 / 315 + n * (-1522 / 945)))));
  np *= n;
  /* n^5 coeff corrected from 1262/105 -> -1262/105 */
  cgb[2] =
    np * (56 / 15 + n * (-136 / 35 + n * (-1262 / 105 + n * (73814 / 2835))));
  cbg[2] = np * (-26 / 15 + n * (34 / 21 + n * (8 / 5 + n * (-12686 / 2835))));
  np *= n;
  /* n^5 coeff corrected from 322/35 -> 332/35 */
  cgb[3] = np * (4279 / 630 + n * (-332 / 35 + n * (-399572 / 14175)));
  cbg[3] = np * (1237 / 630 + n * (-12 / 5 + n * (-24832 / 14175)));
  np *= n;
  cgb[4] = np * (4174 / 315 + n * (-144838 / 6237));
  cbg[4] = np * (-734 / 315 + n * (109598 / 31185));
  np *= n;
  cgb[5] = np * (601676 / 22275);
  cbg[5] = np * (444337 / 155925);

  /* Constants of the projections */
  /* Transverse Mercator (UTM, ITM, etc) */
  np = n * n;
  /* Norm. mer. quad, K&W p.50 (96), p.19 (38b), p.5 (2) */
  Qn = (P.k0 / (1 + n)) * (1 + np * (1 / 4 + np * (1 / 64 + np / 256)));
  /* coef of trig series */
  /* utg := ell. N, E -> sph. N, E,  KW p194 (65) */
  /* gtu := sph. N, E -> ell. N, E,  KW p196 (69) */
  utg[0] =
    n *
    (-0.5 +
      n *
        (2 / 3 +
          n *
            (-37 / 96 +
              n * (1 / 360 + n * (81 / 512 + n * (-96199 / 604800))))));
  gtu[0] =
    n *
    (0.5 +
      n *
        (-2 / 3 +
          n *
            (5 / 16 + n * (41 / 180 + n * (-127 / 288 + n * (7891 / 37800))))));
  utg[1] =
    np *
    (-1 / 48 +
      n *
        (-1 / 15 +
          n * (437 / 1440 + n * (-46 / 105 + n * (1118711 / 3870720)))));
  gtu[1] =
    np *
    (13 / 48 +
      n *
        (-3 / 5 +
          n * (557 / 1440 + n * (281 / 630 + n * (-1983433 / 1935360)))));
  np *= n;
  utg[2] =
    np * (-17 / 480 + n * (37 / 840 + n * (209 / 4480 + n * (-5569 / 90720))));
  gtu[2] =
    np *
    (61 / 240 + n * (-103 / 140 + n * (15061 / 26880 + n * (167603 / 181440))));
  np *= n;
  utg[3] = np * (-4397 / 161280 + n * (11 / 504 + n * (830251 / 7257600)));
  gtu[3] = np * (49561 / 161280 + n * (-179 / 168 + n * (6601661 / 7257600)));
  np *= n;
  utg[4] = np * (-4583 / 161280 + n * (108847 / 3991680));
  gtu[4] = np * (34729 / 80640 + n * (-3418889 / 1995840));
  np *= n;
  utg[5] = np * (-20648693 / 638668800);
  gtu[5] = np * (212378941 / 319334400);

  /* Gaussian latitude value of the origin latitude */
  Z = gatg(cbg, P.phi0);

  /* Origin northing minus true northing at the origin latitude */
  /* i.e. true northing = N - P.Zb  */
  Zb = -Qn * (Z + clens(gtu, 2 * Z));
  P.fwd = e_fwd;
  P.inv = e_inv;

  function e_fwd(lp, xy) {
    var sin_Cn, cos_Cn, cos_Ce, sin_Ce, tmp;
    var Cn = lp.phi,
      Ce = lp.lam;

    /* ell. LAT, LNG -> Gaussian LAT, LNG */
    Cn = gatg(cbg, Cn);
    /* Gaussian LAT, LNG -> compl. sph. LAT */
    sin_Cn = sin(Cn);
    cos_Cn = cos(Cn);
    sin_Ce = sin(Ce);
    cos_Ce = cos(Ce);
    Cn = atan2(sin_Cn, cos_Ce * cos_Cn);
    Ce = atan2(sin_Ce * cos_Cn, hypot(sin_Cn, cos_Cn * cos_Ce));
    /* compl. sph. N, E -> ell. norm. N, E */
    Ce = asinhy(tan(Ce));
    tmp = clenS(gtu, 2 * Cn, 2 * Ce);
    Cn += tmp[0];
    Ce += tmp[1];
    if (fabs(Ce) <= 2.623395162778) {
      xy.y = Qn * Cn + Zb; /* Northing */
      xy.x = Qn * Ce; /* Easting  */
    } else {
      xy.x = xy.y = HUGE_VAL;
    }
  }

  function e_inv(xy, lp) {
    var sin_Cn, cos_Cn, cos_Ce, sin_Ce, tmp;
    var Cn = xy.y,
      Ce = xy.x;
    /* normalize N, E */
    Cn = (Cn - Zb) / Qn;
    Ce = Ce / Qn;
    if (fabs(Ce) <= 2.623395162778) {
      /* 150 degrees */
      /* norm. N, E -> compl. sph. LAT, LNG */
      tmp = clenS(utg, 2 * Cn, 2 * Ce);
      Cn += tmp[0];
      Ce += tmp[1];
      Ce = atan(sinh(Ce)); /* Replaces: Ce = 2*(atan(exp(Ce)) - M_FORTPI); */
      /* compl. sph. LAT -> Gaussian LAT, LNG */
      sin_Cn = sin(Cn);
      cos_Cn = cos(Cn);
      sin_Ce = sin(Ce);
      cos_Ce = cos(Ce);
      Ce = atan2(sin_Ce, cos_Ce * cos_Cn);
      Cn = atan2(sin_Cn * cos_Ce, hypot(sin_Ce, cos_Ce * cos_Cn));
      /* Gaussian LAT, LNG -> ell. LAT, LNG */
      lp.phi = gatg(cgb, Cn);
      lp.lam = Ce;
    } else {
      lp.phi = lp.lam = HUGE_VAL;
    }
  }

  function log1py(x) {
    var y = 1 + x,
      z = y - 1;
    return z === 0 ? x : (x * log(y)) / z;
  }

  function asinhy(x) {
    var y = fabs(x);
    y = log1py(y * (1 + y / (hypot(1, y) + 1)));
    return x < 0 ? -y : y;
  }

  function gatg(pp, B) {
    var cos_2B = 2 * cos(2 * B),
      i = pp.length - 1,
      h1 = pp[i],
      h2 = 0,
      h;
    while (--i >= 0) {
      h = -h2 + cos_2B * h1 + pp[i];
      h2 = h1;
      h1 = h;
    }
    return B + h * sin(2 * B);
  }

  function clens(pp, arg_r) {
    var r = 2 * cos(arg_r),
      i = pp.length - 1,
      hr1 = pp[i],
      hr2 = 0,
      hr;
    while (--i >= 0) {
      hr = -hr2 + r * hr1 + pp[i];
      hr2 = hr1;
      hr1 = hr;
    }
    return sin(arg_r) * hr;
  }

  function clenS(pp, arg_r, arg_i) {
    var sin_arg_r = sin(arg_r),
      cos_arg_r = cos(arg_r),
      sinh_arg_i = sinh(arg_i),
      cosh_arg_i = cosh(arg_i),
      r = 2 * cos_arg_r * cosh_arg_i,
      i = -2 * sin_arg_r * sinh_arg_i,
      j = pp.length - 1,
      hr = pp[j],
      hi1 = 0,
      hr1 = 0,
      hi = 0,
      hr2,
      hi2;
    while (--j >= 0) {
      hr2 = hr1;
      hi2 = hi1;
      hr1 = hr;
      hi1 = hi;
      hr = -hr2 + r * hr1 - i * hi1 + pp[j];
      hi = -hi2 + i * hr1 + r * hi1;
    }
    r = sin_arg_r * cosh_arg_i;
    i = cos_arg_r * sinh_arg_i;
    return [r * hr - i * hi, r * hi + i * hr];
  }
}

pj_add(pj_gall, 'gall', 'Gall (Gall Stereographic)', 'Cyl, Sph');

function pj_gall(P) {
  var YF = 1.7071067811865475244,
    XF = 0.7071067811865475244,
    RYF = 0.58578643762690495119,
    RXF = 1.4142135623730950488;

  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    xy.x = XF * lp.lam;
    xy.y = YF * tan(0.5 * lp.phi);
  }

  function s_inv(xy, lp) {
    lp.lam = RXF * xy.x;
    lp.phi = 2 * atan(xy.y * RYF);
  }
}

pj_add(pj_geocent, 'geocent', 'Geocentric', '');

function pj_geocent(P) {
  P.is_geocent = true;
  P.x0 = 0;
  P.y0 = 0;

  P.fwd = function (lp, xy) {
    xy.x = lp.lam;
    xy.y = lp.phi;
  };

  P.inv = function (xy, lp) {
    lp.phi = xy.y;
    lp.lam = xy.x;
  };
}

// from

pj_add(
  pj_gilbert,
  'gilbert',
  'Gilbert Two World Perspective',
  'PCyl., Sph., NoInv.\nlat_1='
);

function pj_gilbert(P) {
  var lat1 = pj_param(P.params, 'tlat_1') ? pj_param(P.params, 'rlat_1') : 0,
    phi1 = phiprime(lat1),
    sp1 = sin(phi1),
    cp1 = cos(phi1);
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var lam = lp.lam * 0.5,
      phi = phiprime(lp.phi),
      sp = sin(phi),
      cp = cos(phi),
      cl = cos(lam);
    if (sp1 * sp + cp1 * cp * cl >= 0) {
      xy.x = cp * sin(lam);
      xy.y = cp1 * sp - sp1 * cp * cl;
    } else {
      f_error();
    }
  }

  function phiprime(phi) {
    return aasin(tan(0.5 * phi));
  }
}

pj_add(pj_gins8, 'gins8', 'Ginsburg VIII (TsNIIGAiK)', 'PCyl, Sph., no inv.');

function pj_gins8(P) {
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var Cl = 0.000952426;
    var Cp = 0.162388;
    var C12 = 0.08333333333333333;
    var t = lp.phi * lp.phi;
    xy.y = lp.phi * (1 + t * C12);
    xy.x = lp.lam * (1 - Cp * t);
    t = lp.lam * lp.lam;
    xy.x *= 0.87 - Cl * t * t;
  }
}

pj_add(pj_gn_sinu, 'gn_sinu', 'General Sinusoidal Series', 'PCyl, Sph.\nm= n=');
pj_add(pj_sinu, 'sinu', 'Sinusoidal (Sanson-Flamsteed)', 'PCyl, Sph&Ell');
pj_add(pj_eck6, 'eck6', 'Eckert VI', 'PCyl, Sph.\nm= n=');
pj_add(
  pj_mbtfps,
  'mbtfps',
  'McBryde-Thomas Flat-Polar Sinusoidal',
  'PCyl, Sph.'
);

function pj_gn_sinu(P) {
  if ((pj_param(P.params, 'tn'), pj_param(P.params, 'tm'))) {
    pj_sinu_init(P, pj_param(P.params, 'dm'), pj_param(P.params, 'dn'));
  } else {
    e_error(-99);
  }
}

function pj_sinu(P) {
  var en;
  if (P.es) {
    en = pj_enfn(P.es);
    P.fwd = e_fwd;
    P.inv = e_inv;
  } else {
    pj_sinu_init(P, 0, 1);
  }

  function e_fwd(lp, xy) {
    var s, c;
    xy.y = pj_mlfn(lp.phi, (s = sin(lp.phi)), (c = cos(lp.phi)), en);
    xy.x = (lp.lam * c) / sqrt(1 - P.es * s * s);
  }

  function e_inv(xy, lp) {
    var s = fabs((lp.phi = pj_inv_mlfn(xy.y, P.es, en)));
    if (s < M_HALFPI) {
      s = sin(lp.phi);
      lp.lam = (xy.x * sqrt(1 - P.es * s * s)) / cos(lp.phi);
    } else if (s - EPS10 < M_HALFPI) {
      lp.lam = 0;
    } else {
      i_error();
    }
  }
}

function pj_eck6(P) {
  pj_sinu_init(P, 1, 2.570796326794896619231321691);
}

function pj_mbtfps(P) {
  pj_sinu_init(P, 0.5, 1.785398163397448309615660845);
}

function pj_sinu_init(P, m, n) {
  var MAX_ITER = 8,
    LOOP_TOL = 1e-7,
    C_x,
    C_y;
  C_x = (C_y = sqrt((m + 1) / n)) / (m + 1);
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var k, V, i;
    if (!m) lp.phi = n != 1 ? aasin(n * sin(lp.phi)) : lp.phi;
    else {
      k = n * sin(lp.phi);
      for (i = MAX_ITER; i; --i) {
        lp.phi -= V = (m * lp.phi + sin(lp.phi) - k) / (m + cos(lp.phi));
        if (fabs(V) < LOOP_TOL) break;
      }
      if (!i) f_error();
    }
    xy.x = C_x * lp.lam * (m + cos(lp.phi));
    xy.y = C_y * lp.phi;
  }

  function s_inv(xy, lp) {
    xy.y /= C_y;
    lp.phi = m
      ? aasin((m * xy.y + sin(xy.y)) / n)
      : n != 1
      ? aasin(sin(xy.y) / n)
      : xy.y;
    lp.lam = xy.x / (C_x * (m + cos(xy.y)));
  }
}

pj_add(pj_gnom, 'gnom', 'Gnomonic', 'Azi, Sph.');

function pj_gnom(P) {
  var EPS10 = 1e-10,
    N_POLE = 0,
    S_POLE = 1,
    EQUIT = 2,
    OBLIQ = 3;
  var sinphi0, cosph0, mode;
  if (fabs(fabs(P.phi0) - M_HALFPI) < EPS10) {
    mode = P.phi0 < 0 ? S_POLE : N_POLE;
  } else if (fabs(P.phi0) < EPS10) {
    mode = EQUIT;
  } else {
    mode = OBLIQ;
    sinph0 = sin(P.phi0);
    cosph0 = cos(P.phi0);
  }

  P.inv = s_inv;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var coslam, cosphi, sinphi;
    sinphi = sin(lp.phi);
    cosphi = cos(lp.phi);
    coslam = cos(lp.lam);

    switch (mode) {
      case EQUIT:
        xy.y = cosphi * coslam;
        break;
      case OBLIQ:
        xy.y = sinph0 * sinphi + cosph0 * cosphi * coslam;
        break;
      case S_POLE:
        xy.y = -sinphi;
        break;
      case N_POLE:
        xy.y = sinphi;
        break;
    }

    if (xy.y <= EPS10) f_error();

    xy.x = (xy.y = 1 / xy.y) * cosphi * sin(lp.lam);
    switch (mode) {
      case EQUIT:
        xy.y *= sinphi;
        break;
      case OBLIQ:
        xy.y *= cosph0 * sinphi - sinph0 * cosphi * coslam;
        break;
      case N_POLE:
        coslam = -coslam;
      /* falls through */
      case S_POLE:
        xy.y *= cosphi * coslam;
        break;
    }
  }

  function s_inv(xy, lp) {
    var x = xy.x,
      y = xy.y; // modified below
    var rh, cosz, sinz;
    rh = hypot(x, y);
    sinz = sin((lp.phi = atan(rh)));
    cosz = sqrt(1 - sinz * sinz);

    if (fabs(rh) <= EPS10) {
      lp.phi = P.phi0;
      lp.lam = 0;
    } else {
      switch (mode) {
        case OBLIQ:
          lp.phi = cosz * sinph0 + (y * sinz * cosph0) / rh;
          if (fabs(lp.phi) >= 1) lp.phi = lp.phi > 0 ? M_HALFPI : -M_HALFPI;
          else lp.phi = asin(lp.phi);
          y = (cosz - sinph0 * sin(lp.phi)) * rh;
          x *= sinz * cosph0;
          break;
        case EQUIT:
          lp.phi = (y * sinz) / rh;
          if (fabs(lp.phi) >= 1) lp.phi = lp.phi > 0 ? M_HALFPI : -M_HALFPI;
          else lp.phi = asin(lp.phi);
          y = cosz * rh;
          x *= sinz;
          break;
        case S_POLE:
          lp.phi -= M_HALFPI;
          break;
        case N_POLE:
          lp.phi = M_HALFPI - lp.phi;
          y = -y;
          break;
      }
      lp.lam = atan2(x, y);
    }
  }
}

pj_add(pj_moll, 'moll', 'Mollweide', 'PCyl Sph');
pj_add(pj_wag4, 'wag4', 'Wagner IV', 'PCyl Sph');
pj_add(pj_wag5, 'wag5', 'Wagner V', 'PCyl Sph');

function pj_moll(P) {
  pj_moll_init(P, pj_moll_init_Q(P, M_HALFPI));
}

function pj_wag4(P) {
  pj_moll_init(P, pj_moll_init_Q(P, M_PI / 3));
}

function pj_wag5(P) {
  var Q = {
    C_x: 0.90977,
    C_y: 1.65014,
    C_p: 3.00896
  };
  pj_moll_init(P, Q);
}

function pj_moll_init_Q(P, p) {
  var sp = sin(p),
    p2 = p + p,
    r = sqrt((M_TWOPI * sp) / (p2 + sin(p2)));
  return {
    C_x: (2 * r) / M_PI,
    C_y: r / sp,
    C_p: p2 + sin(p2)
  };
}

function pj_moll_init(P, Q) {
  var MAX_ITER = 10,
    LOOP_TOL = 1e-7;
  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    var k, V, i;
    k = Q.C_p * sin(lp.phi);
    for (i = MAX_ITER; i; --i) {
      lp.phi -= V = (lp.phi + sin(lp.phi) - k) / (1 + cos(lp.phi));
      if (fabs(V) < LOOP_TOL) break;
    }
    if (!i) lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
    else lp.phi *= 0.5;
    xy.x = Q.C_x * lp.lam * cos(lp.phi);
    xy.y = Q.C_y * sin(lp.phi);
  }

  function s_inv(xy, lp) {
    lp.phi = aasin(xy.y / Q.C_y);
    lp.lam = xy.x / (Q.C_x * cos(lp.phi));
    // if (fabs(lp.lam) < M_PI) { // from Proj.4; fails for edge coordinates
    if (fabs(lp.lam) - M_PI < EPS10) {
      // allows inv projection of world layer
      lp.phi += lp.phi;
      lp.phi = aasin((lp.phi + sin(lp.phi)) / Q.C_p);
    } else {
      lp.lam = lp.phi = HUGE_VAL;
    }
  }
}

pj_add(pj_goode, 'goode', 'Goode Homolosine', 'PCyl, Sph.');

function pj_goode(P) {
  var Y_COR = 0.0528,
    PHI_LIM = 0.71093078197902358062,
    sinuFwd,
    sinuInv,
    mollFwd,
    mollInv;
  P.es = 0;
  pj_sinu(P);
  sinuFwd = P.fwd;
  sinuInv = P.inv;
  pj_moll(P);
  mollFwd = P.fwd;
  mollInv = P.inv;
  P.fwd = function (lp, xy) {
    if (fabs(lp.phi) < PHI_LIM) {
      sinuFwd(lp, xy);
    } else {
      mollFwd(lp, xy);
      xy.y -= lp.phi > 0 ? Y_COR : -Y_COR;
    }
  };
  P.inv = function (xy, lp) {
    if (fabs(xy.y) <= PHI_LIM) {
      sinuInv(xy, lp);
    } else {
      xy.y += xy.y > 0 ? Y_COR : -Y_COR;
      mollInv(xy, lp);
    }
  };
}

pj_add(pj_hammer, 'hammer', 'Hammer & Eckert-Greifendorff', 'Misc Sph,\nW= M=');

function pj_hammer(P) {
  var w, m, rm;
  var EPS = 1e-10;
  P.inv = s_inv;
  P.fwd = s_fwd;
  P.es = 0;

  if (pj_param(P.params, 'tW')) {
    if ((w = fabs(pj_param(P.params, 'dW'))) <= 0) e_error(-27);
  } else w = 0.5;
  if (pj_param(P.params, 'tM')) {
    if ((m = fabs(pj_param(P.params, 'dM'))) <= 0) e_error(-27);
  } else m = 1;
  rm = 1 / m;
  m /= w;

  function s_fwd(lp, xy) {
    var cosphi, d;
    d = sqrt(2 / (1 + (cosphi = cos(lp.phi)) * cos((lp.lam *= w))));
    xy.x = m * d * cosphi * sin(lp.lam);
    xy.y = rm * d * sin(lp.phi);
  }

  function s_inv(xy, lp) {
    var z = sqrt(1 - 0.25 * w * w * xy.x * xy.x - 0.25 * xy.y * xy.y);
    if (fabs(2 * z * z - 1) < EPS) {
      lp.lam = HUGE_VAL;
      lp.phi = HUGE_VAL;
      pj_errno = -14;
    } else {
      lp.lam = aatan2(w * xy.x * z, 2 * z * z - 1) / w;
      lp.phi = aasin(z * xy.y);
    }
  }
}

pj_add(pj_hatano, 'hatano', 'Hatano Asymmetrical Equal Area', 'PCyl., Sph.');

function pj_hatano(P) {
  var NITER = 20;
  var EPS = 1e-7;
  var ONETOL = 1.000001;
  var CN = 2.67595;
  var CS = 2.43763;
  var RCN = 0.37369906014686373063;
  var RCS = 0.41023453108141924738;
  var FYCN = 1.75859;
  var FYCS = 1.93052;
  var RYCN = 0.56863737426006061674;
  var RYCS = 0.51799515156538134803;
  var FXC = 0.85;
  var RXC = 1.17647058823529411764;

  P.inv = s_inv;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var th1, c;
    var i;
    c = sin(lp.phi) * (lp.phi < 0 ? CS : CN);
    for (i = NITER; i; --i) {
      lp.phi -= th1 = (lp.phi + sin(lp.phi) - c) / (1 + cos(lp.phi));
      if (fabs(th1) < EPS) break;
    }
    xy.x = FXC * lp.lam * cos((lp.phi *= 0.5));
    xy.y = sin(lp.phi) * (lp.phi < 0 ? FYCS : FYCN);
  }

  function s_inv(xy, lp) {
    var th = xy.y * (xy.y < 0 ? RYCS : RYCN);
    if (fabs(th) > 1) {
      if (fabs(th) > ONETOL) {
        i_error();
      } else {
        th = th > 0 ? M_HALFPI : -M_HALFPI;
      }
    } else {
      th = asin(th);
    }

    lp.lam = (RXC * xy.x) / cos(th);
    th += th;
    lp.phi = (th + sin(th)) * (xy.y < 0 ? RCS : RCN);
    if (fabs(lp.phi) > 1) {
      if (fabs(lp.phi) > ONETOL) {
        i_error();
      } else {
        lp.phi = lp.phi > 0 ? M_HALFPI : -M_HALFPI;
      }
    } else {
      lp.phi = asin(lp.phi);
    }
  }
}

pj_add(pj_healpix, 'healpix', 'HEALPix', 'Sph., Ellps.');
pj_add(
  pj_rhealpix,
  'rhealpix',
  'rHEALPix',
  'Sph., Ellps.\nnorth_square= south_square='
);

function pj_rhealpix(P) {
  pj_healpix(P, true);
}

function pj_healpix(P, rhealpix) {
  var R1 = [
    [0, -1],
    [1, 0]
  ];
  var R2 = [
    [-1, 0],
    [0, -1]
  ];
  var R3 = [
    [0, 1],
    [-1, 0]
  ];
  var IDENT = [
    [1, 0],
    [0, 1]
  ];
  var rot = [IDENT, R1, R2, R3, R3, R2, R1];
  var EPS = 1e-15;

  var north_square;
  var south_square;
  var qp;
  var apa;
  var vertsJit;

  if (rhealpix) {
    north_square = pj_param(P.params, 'inorth_square');
    south_square = pj_param(P.params, 'isouth_square');

    /* Check for valid north_square and south_square inputs. */
    if (north_square < 0 || north_square > 3) {
      e_error(-47);
    }
    if (south_square < 0 || south_square > 3) {
      e_error(-47);
    }
    vertsJit = [
      [-M_PI - EPS, M_FORTPI + EPS],
      [-M_PI + north_square * M_HALFPI - EPS, M_FORTPI + EPS],
      [-M_PI + north_square * M_HALFPI - EPS, 3 * M_FORTPI + EPS],
      [-M_PI + (north_square + 1.0) * M_HALFPI + EPS, 3 * M_FORTPI + EPS],
      [-M_PI + (north_square + 1.0) * M_HALFPI + EPS, M_FORTPI + EPS],
      [M_PI + EPS, M_FORTPI + EPS],
      [M_PI + EPS, -M_FORTPI - EPS],
      [-M_PI + (south_square + 1.0) * M_HALFPI + EPS, -M_FORTPI - EPS],
      [-M_PI + (south_square + 1.0) * M_HALFPI + EPS, -3 * M_FORTPI - EPS],
      [-M_PI + south_square * M_HALFPI - EPS, -3 * M_FORTPI - EPS],
      [-M_PI + south_square * M_HALFPI - EPS, -M_FORTPI - EPS],
      [-M_PI - EPS, -M_FORTPI - EPS]
    ];

    if (P.es != 0.0) {
      apa = pj_authset(P.es); /* For auth_lat(). */
      qp = pj_qsfn(1.0, P.e, P.one_es); /* For auth_lat(). */
      P.a = P.a * sqrt(0.5 * qp); /* Set P.a to authalic radius. */
      P.ra = 1.0 / P.a;
      P.fwd = e_rhealpix_forward;
      P.inv = e_rhealpix_inverse;
    } else {
      P.fwd = s_rhealpix_forward;
      P.inv = s_rhealpix_inverse;
    }
  } else {
    // healpix
    vertsJit = [
      [-M_PI - EPS, M_FORTPI],
      [-3 * M_FORTPI, M_HALFPI + EPS],
      [-M_HALFPI, M_FORTPI + EPS],
      [-M_FORTPI, M_HALFPI + EPS],
      [0.0, M_FORTPI + EPS],
      [M_FORTPI, M_HALFPI + EPS],
      [M_HALFPI, M_FORTPI + EPS],
      [3 * M_FORTPI, M_HALFPI + EPS],
      [M_PI + EPS, M_FORTPI],
      [M_PI + EPS, -M_FORTPI],
      [3 * M_FORTPI, -M_HALFPI - EPS],
      [M_HALFPI, -M_FORTPI - EPS],
      [M_FORTPI, -M_HALFPI - EPS],
      [0.0, -M_FORTPI - EPS],
      [-M_FORTPI, -M_HALFPI - EPS],
      [-M_HALFPI, -M_FORTPI - EPS],
      [-3 * M_FORTPI, -M_HALFPI - EPS],
      [-M_PI - EPS, -M_FORTPI]
    ];

    if (P.es != 0.0) {
      apa = pj_authset(P.es); /* For auth_lat(). */
      qp = pj_qsfn(1.0, P.e, P.one_es); /* For auth_lat(). */
      P.a = P.a * sqrt(0.5 * qp); /* Set P.a to authalic radius. */
      P.ra = 1.0 / P.a;
      P.fwd = e_healpix_forward;
      P.inv = e_healpix_inverse;
    } else {
      P.fwd = s_healpix_forward;
      P.inv = s_healpix_inverse;
    }
  }

  function s_healpix_forward(lp, xy) {
    healpix_sphere(lp, xy);
  }

  function e_healpix_forward(lp, xy) {
    lp.phi = auth_lat(P, lp.phi, 0);
    healpix_sphere(lp, xy);
  }

  function s_healpix_inverse(xy, lp) {
    if (!in_image(xy.x, xy.y)) {
      lp.lam = HUGE_VAL;
      lp.phi = HUGE_VAL;
      pj_ctx_set_errno(-15);
      return;
    }
    healpix_sphere_inverse(xy, lp);
  }

  function e_healpix_inverse(xy, lp) {
    if (!in_image(xy.x, xy.y)) {
      lp.lam = HUGE_VAL;
      lp.phi = HUGE_VAL;
      pj_ctx_set_errno(-15);
      return;
    }
    healpix_sphere_inverse(xy, lp);
    lp.phi = auth_lat(P, lp.phi, 1);
  }

  function s_rhealpix_forward(lp, xy) {
    healpix_sphere(lp, xy);
    combine_caps(xy, north_square, south_square, 0);
  }

  function e_rhealpix_forward(lp, xy) {
    lp.phi = auth_lat(P, lp.phi, 0);
    healpix_sphere(lp, xy);
    return combine_caps(xy, north_square, south_square, 0);
  }

  function s_rhealpix_inverse(xy, lp) {
    if (!in_image(xy.x, xy.y)) {
      lp.lam = HUGE_VAL;
      lp.phi = HUGE_VAL;
      pj_ctx_set_errno(-15);
      return;
    }
    combine_caps(xy, north_square, south_square, 1);
    healpix_sphere_inverse(xy, lp);
  }

  function e_rhealpix_inverse(xy, lp) {
    if (!in_image(xy.x, xy.y)) {
      lp.lam = HUGE_VAL;
      lp.phi = HUGE_VAL;
      pj_ctx_set_errno(-15);
      return;
    }
    combine_caps(xy, north_square, south_square, 1);
    healpix_sphere_inverse(xy, lp);
    lp.phi = auth_lat(P, lp.phi, 1);
  }

  function healpix_sphere(lp, xy) {
    var lam = lp.lam;
    var phi = lp.phi;
    var phi0 = asin(2.0 / 3.0);

    /* equatorial region */
    if (fabs(phi) <= phi0) {
      xy.x = lam;
      xy.y = ((3 * M_PI) / 8) * sin(phi);
    } else {
      var lamc;
      var sigma = sqrt(3 * (1 - fabs(sin(phi))));
      var cn = floor((2 * lam) / M_PI + 2);
      if (cn >= 4) {
        cn = 3;
      }
      lamc = -3 * M_FORTPI + M_HALFPI * cn;
      xy.x = lamc + (lam - lamc) * sigma;
      xy.y = pj_sign(phi) * M_FORTPI * (2 - sigma);
    }
  }

  function healpix_sphere_inverse(xy, lp) {
    var x = xy.x;
    var y = xy.y;
    var y0 = M_FORTPI;

    /* Equatorial region. */
    if (fabs(y) <= y0) {
      lp.lam = x;
      lp.phi = asin((8 * y) / (3 * M_PI));
    } else if (fabs(y) < M_HALFPI) {
      var cn = floor((2 * x) / M_PI + 2);
      var xc, tau;
      if (cn >= 4) {
        cn = 3;
      }
      xc = -3 * M_FORTPI + M_HALFPI * cn;
      tau = 2.0 - (4 * fabs(y)) / M_PI;
      lp.lam = xc + (x - xc) / tau;
      lp.phi = pj_sign(y) * asin(1.0 - pow(tau, 2) / 3.0);
    } else {
      lp.lam = -M_PI;
      lp.phi = pj_sign(y) * M_HALFPI;
    }
  }

  function pj_sign(v) {
    return v > 0 ? 1 : v < 0 ? -1 : 0;
  }

  /**
   * Return the index of the matrix in ROT.
   * @param index ranges from -3 to 3.
   */
  function get_rotate_index(index) {
    switch (index) {
      case 0:
        return 0;
      case 1:
        return 1;
      case 2:
        return 2;
      case 3:
        return 3;
      case -1:
        return 4;
      case -2:
        return 5;
      case -3:
        return 6;
    }
    return 0;
  }

  /**
   * Return true if point (testx, testy) lies in the interior of the polygon
   * determined by the vertices in vert, and return false otherwise.
   * See http://paulbourke.net/geometry/polygonmesh/ for more details.
   * @param nvert the number of vertices in the polygon.
   * @param vert the (x, y)-coordinates of the polygon's vertices
   **/
  function pnpoly(vert, testx, testy) {
    var counter = 0;
    var nvert = vert.length;
    var x1, y1, x2, y2;
    var xinters;
    var i;

    /* Check for boundary cases */
    for (i = 0; i < nvert; i++) {
      if (testx == vert[i][0] && testy == vert[i][1]) {
        return true;
      }
    }

    x1 = vert[0][0];
    y1 = vert[0][1];

    for (i = 1; i < nvert; i++) {
      x2 = vert[i % nvert][0];
      y2 = vert[i % nvert][1];
      if (
        testy > MIN(y1, y2) &&
        testy <= MAX(y1, y2) &&
        testx <= MAX(x1, x2) &&
        y1 != y2
      ) {
        xinters = ((testy - y1) * (x2 - x1)) / (y2 - y1) + x1;
        if (x1 == x2 || testx <= xinters) counter++;
      }
      x1 = x2;
      y1 = y2;
    }
    return counter % 2 != 0;
  }

  function in_image(x, y) {
    return pnpoly(vertsJit, x, y);
  }

  /**
   * Return the authalic latitude of latitude alpha (if inverse=0) or
   * return the approximate latitude of authalic latitude alpha (if inverse=1).
   * P contains the relevant ellipsoid parameters.
   **/
  function auth_lat(P, alpha, inverse) {
    if (!inverse) {
      /* Authalic latitude. */
      var q = pj_qsfn(sin(alpha), P.e, 1.0 - P.es);
      var ratio = q / qp;

      if (fabs(ratio) > 1) {
        /* Rounding error. */
        ratio = pj_sign(ratio);
      }
      return asin(ratio);
    } else {
      /* Approximation to inverse authalic latitude. */
      return pj_authlat(alpha, apa);
    }
  }

  function vector_add(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
  }

  function vector_sub(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }

  function dot_product(a, b) {
    var i, j;
    var ret = [0, 0];
    for (i = 0; i < 2; i++) {
      for (j = 0; j < 2; j++) {
        ret[i] += a[i][j] * b[j];
      }
    }
    return ret;
  }

  /**
   * Return the number of the polar cap, the pole point coordinates, and
   * the region that (x, y) lies in.
   * If inverse=0, then assume (x,y) lies in the image of the HEALPix
   * projection of the unit sphere.
   * If inverse=1, then assume (x,y) lies in the image of the
   * (north_square, south_square)-rHEALPix projection of the unit sphere.
   **/
  function get_cap(x, y, north_square, south_square, inverse) {
    var capmap = {};
    var c;
    capmap.x = x;
    capmap.y = y;
    if (!inverse) {
      if (y > M_FORTPI) {
        capmap.region = 'north';
        c = M_HALFPI;
      } else if (y < -M_FORTPI) {
        capmap.region = 'south';
        c = -M_HALFPI;
      } else {
        capmap.region = 'equatorial';
        capmap.cn = 0;
        return capmap;
      }
      /* polar region */
      if (x < -M_HALFPI) {
        capmap.cn = 0;
        capmap.x = -3 * M_FORTPI;
        capmap.y = c;
      } else if (x >= -M_HALFPI && x < 0) {
        capmap.cn = 1;
        capmap.x = -M_FORTPI;
        capmap.y = c;
      } else if (x >= 0 && x < M_HALFPI) {
        capmap.cn = 2;
        capmap.x = M_FORTPI;
        capmap.y = c;
      } else {
        capmap.cn = 3;
        capmap.x = 3 * M_FORTPI;
        capmap.y = c;
      }
    } else {
      if (y > M_FORTPI) {
        capmap.region = 'north';
        capmap.x = -3 * M_FORTPI + north_square * M_HALFPI;
        capmap.y = M_HALFPI;
        x = x - north_square * M_HALFPI;
      } else if (y < -M_FORTPI) {
        capmap.region = 'south';
        capmap.x = -3 * M_FORTPI + south_square * M_HALFPI;
        capmap.y = -M_HALFPI;
        x = x - south_square * M_HALFPI;
      } else {
        capmap.region = 'equatorial';
        capmap.cn = 0;
        return capmap;
      }
      /* Polar Region, find the HEALPix polar cap number that
         x, y moves to when rHEALPix polar square is disassembled. */
      if (capmap.region == 'north') {
        if (y >= -x - M_FORTPI - EPS && y < x + 5 * M_FORTPI - EPS) {
          capmap.cn = (north_square + 1) % 4;
        } else if (y > -x - M_FORTPI + EPS && y >= x + 5 * M_FORTPI - EPS) {
          capmap.cn = (north_square + 2) % 4;
        } else if (y <= -x - M_FORTPI + EPS && y > x + 5 * M_FORTPI + EPS) {
          capmap.cn = (north_square + 3) % 4;
        } else {
          capmap.cn = north_square;
        }
      } else if (capmap.region == 'south') {
        if (y <= x + M_FORTPI + EPS && y > -x - 5 * M_FORTPI + EPS) {
          capmap.cn = (south_square + 1) % 4;
        } else if (y < x + M_FORTPI - EPS && y <= -x - 5 * M_FORTPI + EPS) {
          capmap.cn = (south_square + 2) % 4;
        } else if (y >= x + M_FORTPI - EPS && y < -x - 5 * M_FORTPI - EPS) {
          capmap.cn = (south_square + 3) % 4;
        } else {
          capmap.cn = south_square;
        }
      }
    }
    return capmap;
  }

  /**
   * Rearrange point (x, y) in the HEALPix projection by
   * combining the polar caps into two polar squares.
   * Put the north polar square in position north_square and
   * the south polar square in position south_square.
   * If inverse=1, then uncombine the polar caps.
   * @param north_square integer between 0 and 3.
   * @param south_square integer between 0 and 3.
   **/
  function combine_caps(xy, north_square, south_square, inverse) {
    var v, c, vector, v_min_c, ret_dot, tmpRot, a;
    var pole = 0;
    var capmap = get_cap(xy.x, xy.y, north_square, south_square, inverse);
    if (capmap.region == 'equatorial') {
      xy.x = capmap.x;
      xy.y = capmap.y;
      return;
    }
    v = [xy.x, xy.y];
    c = [capmap.x, capmap.y];

    if (!inverse) {
      /* Rotate (x, y) about its polar cap tip and then translate it to
         north_square or south_square. */

      if (capmap.region == 'north') {
        pole = north_square;
        tmpRot = rot[get_rotate_index(capmap.cn - pole)];
      } else {
        pole = south_square;
        tmpRot = rot[get_rotate_index(-1 * (capmap.cn - pole))];
      }
    } else {
      /* Inverse function.
       Unrotate (x, y) and then translate it back. */

      /* disassemble */
      if (capmap.region == 'north') {
        pole = north_square;
        tmpRot = rot[get_rotate_index(-1 * (capmap.cn - pole))];
      } else {
        pole = south_square;
        tmpRot = rot[get_rotate_index(capmap.cn - pole)];
      }
    }
    v_min_c = vector_sub(v, c);
    ret_dot = dot_product(tmpRot, v_min_c);
    a = [-3 * M_FORTPI + (!inverse ? 0 : capmap.cn) * M_HALFPI, M_HALFPI];
    vector = vector_add(ret_dot, a);
    xy.x = vector[0];
    xy.y = vector[1];
  }
}

pj_add(pj_hill, 'hill', 'Hill Eucyclic', 'PCyl., Sph.');

// Adapted from: https://github.com/d3/d3-geo-projection/blob/master/src/hill.js
// License: https://github.com/d3/d3-geo-projection/blob/master/LICENSE

function pj_hill(P) {
  var K = 1, // TODO: expose as parameter
    L = 1 + K,
    sinBt = sin(1 / L),
    Bt = asin(sinBt),
    A = 2 * sqrt(M_PI / (B = M_PI + 4 * Bt * L)),
    B,
    rho0 = 0.5 * A * (L + sqrt(K * (2 + K))),
    K2 = K * K,
    L2 = L * L,
    EPS = 1e-12;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var t = 1 - sin(lp.phi),
      rho,
      omega;
    if (t && t < 2) {
      var theta = M_HALFPI - lp.phi,
        i = 25,
        delta,
        sinTheta,
        cosTheta,
        C,
        Bt_Bt1;
      do {
        sinTheta = sin(theta);
        cosTheta = cos(theta);
        Bt_Bt1 = Bt + atan2(sinTheta, L - cosTheta);
        C = 1 + L2 - 2 * L * cosTheta;
        theta -= delta =
          (theta - K2 * Bt - L * sinTheta + C * Bt_Bt1 - 0.5 * t * B) /
          (2 * L * sinTheta * Bt_Bt1);
      } while (fabs(delta) > EPS && --i > 0);
      rho = A * sqrt(C);
      omega = (lp.lam * Bt_Bt1) / M_PI;
    } else {
      rho = A * (K + t);
      omega = (lp.lam * Bt) / M_PI;
    }

    xy.x = rho * sin(omega);
    xy.y = rho0 - rho * cos(omega);
  }

  function s_inv(xy, lp) {
    var x = xy.x,
      y = xy.y,
      rho2 = x * x + (y -= rho0) * y,
      cosTheta = (1 + L2 - rho2 / (A * A)) / (2 * L),
      theta = acos(cosTheta),
      sinTheta = sin(theta),
      Bt_Bt1 = Bt + atan2(sinTheta, L - cosTheta);
    (lp.lam = (asin(x / sqrt(rho2)) * M_PI) / Bt_Bt1),
      (lp.phi = asin(
        1 -
          (2 *
            (theta -
              K2 * Bt -
              L * sinTheta +
              (1 + L2 - 2 * L * cosTheta) * Bt_Bt1)) /
            B
      ));
  }
}

pj_add(pj_krovak, 'krovak', 'Krovak', 'PCyl., Ellps.');

function pj_krovak(P) {
  var u0, n0, g;
  var alpha, k, n, rho0, ad, czech;
  var EPS = 1e-15;
  var S45 = 0.785398163397448; /* 45 deg */
  var S90 = 1.570796326794896; /* 90 deg */
  var UQ = 1.04216856380474; /* DU(2, 59, 42, 42.69689) */
  var S0 = 1.37008346281555; /* Latitude of pseudo standard parallel 78deg 30'00" N */

  /* we want Bessel as fixed ellipsoid */
  P.a = 6377397.155;
  P.e = sqrt((P.es = 0.006674372230614));

  /* if latitude of projection center is not set, use 49d30'N */
  if (!pj_param(P.params, 'tlat_0')) P.phi0 = 0.863937979737193;

  /* if center long is not set use 42d30'E of Ferro - 17d40' for Ferro */
  /* that will correspond to using longitudes relative to greenwich    */
  /* as input and output, instead of lat/long relative to Ferro */
  if (!pj_param(P.params, 'tlon_0'))
    P.lam0 = 0.7417649320975901 - 0.308341501185665;

  /* if scale not set default to 0.9999 */
  if (!pj_param(P.params, 'tk')) P.k0 = 0.9999;
  czech = 1;
  if (!pj_param(P.params, 'tczech')) czech = -1;

  /* Set up shared parameters between forward and inverse */
  alpha = sqrt(1 + (P.es * pow(cos(P.phi0), 4)) / (1 - P.es));
  u0 = asin(sin(P.phi0) / alpha);
  g = pow((1 + P.e * sin(P.phi0)) / (1 - P.e * sin(P.phi0)), (alpha * P.e) / 2);
  k = (tan(u0 / 2 + S45) / pow(tan(P.phi0 / 2 + S45), alpha)) * g;
  n0 = sqrt(1 - P.es) / (1 - P.es * pow(sin(P.phi0), 2));
  n = sin(S0);
  rho0 = (P.k0 * n0) / tan(S0);
  ad = S90 - UQ;
  P.inv = e_inv;
  P.fwd = e_fwd;

  function e_fwd(lp, xy) {
    var gfi, u, deltav, s, d, eps, rho;

    gfi = pow(
      (1 + P.e * sin(lp.phi)) / (1 - P.e * sin(lp.phi)),
      (alpha * P.e) / 2
    );

    u = 2 * (atan((k * pow(tan(lp.phi / 2 + S45), alpha)) / gfi) - S45);
    deltav = -lp.lam * alpha;

    s = asin(cos(ad) * sin(u) + sin(ad) * cos(u) * cos(deltav));
    d = asin((cos(u) * sin(deltav)) / cos(s));
    eps = n * d;
    rho = (rho0 * pow(tan(S0 / 2 + S45), n)) / pow(tan(s / 2 + S45), n);
    xy.y = rho * cos(eps);
    xy.x = rho * sin(eps);
    xy.y *= czech;
    xy.x *= czech;
  }

  function e_inv(xy, lp) {
    var u, deltav, s, d, eps, rho, fi1, xy0;
    var ok;
    xy0 = xy.x;
    xy.x = xy.y;
    xy.y = xy0;
    xy.x *= czech;
    xy.y *= czech;

    rho = sqrt(xy.x * xy.x + xy.y * xy.y);
    eps = atan2(xy.y, xy.x);
    d = eps / sin(S0);
    s = 2 * (atan(pow(rho0 / rho, 1 / n) * tan(S0 / 2 + S45)) - S45);
    u = asin(cos(ad) * sin(s) - sin(ad) * cos(s) * cos(d));
    deltav = asin((cos(s) * sin(d)) / cos(u));
    lp.lam = P.lam0 - deltav / alpha;

    /* ITERATION FOR lp.phi */
    fi1 = u;
    ok = 0;
    do {
      lp.phi =
        2 *
        (atan(
          pow(k, -1 / alpha) *
            pow(tan(u / 2 + S45), 1 / alpha) *
            pow((1 + P.e * sin(fi1)) / (1 - P.e * sin(fi1)), P.e / 2)
        ) -
          S45);
      if (fabs(fi1 - lp.phi) < EPS) ok = 1;
      fi1 = lp.phi;
    } while (ok === 0);
    lp.lam -= P.lam0;
  }
}

pj_add(pj_laea, 'laea', 'Lambert Azimuthal Equal Area', 'Azi, Sph&Ell');

function pj_laea(P) {
  var EPS10 = 1e-10,
    NITER = 20,
    CONV = 1e-10,
    N_POLE = 0,
    S_POLE = 1,
    EQUIT = 2,
    OBLIQ = 3;
  var sinb1, cosb1, xmf, ymf, mmf, qp, dd, rq, apa, mode, t, sinphi;

  t = fabs(P.phi0);
  if (fabs(t - M_HALFPI) < EPS10) mode = P.phi0 < 0 ? S_POLE : N_POLE;
  else if (fabs(t) < EPS10) mode = EQUIT;
  else mode = OBLIQ;
  if (P.es) {
    P.e = sqrt(P.es);
    qp = pj_qsfn(1, P.e, P.one_es);
    mmf = 0.5 / (1 - P.es);
    apa = pj_authset(P.es);
    switch (mode) {
      case N_POLE:
      case S_POLE:
        dd = 1;
        break;
      case EQUIT:
        dd = 1 / (rq = sqrt(0.5 * qp));
        xmf = 1;
        ymf = 0.5 * qp;
        break;
      case OBLIQ:
        rq = sqrt(0.5 * qp);
        sinphi = sin(P.phi0);
        sinb1 = pj_qsfn(sinphi, P.e, P.one_es) / qp;
        cosb1 = sqrt(1 - sinb1 * sinb1);
        dd = cos(P.phi0) / (sqrt(1 - P.es * sinphi * sinphi) * rq * cosb1);
        ymf = (xmf = rq) / dd;
        xmf *= dd;
        break;
    }
    P.inv = e_inv;
    P.fwd = e_fwd;
  } else {
    if (mode == OBLIQ) {
      sinb1 = sin(P.phi0);
      cosb1 = cos(P.phi0);
    }
    P.inv = s_inv;
    P.fwd = s_fwd;
  }

  function e_fwd(lp, xy) {
    var coslam,
      sinlam,
      sinphi,
      q,
      sinb = 0.0,
      cosb = 0.0,
      b = 0.0;
    coslam = cos(lp.lam);
    sinlam = sin(lp.lam);
    sinphi = sin(lp.phi);
    q = pj_qsfn(sinphi, P.e, P.one_es);

    if (mode == OBLIQ || mode == EQUIT) {
      sinb = q / qp;
      cosb = sqrt(1 - sinb * sinb);
    }

    switch (mode) {
      case OBLIQ:
        b = 1 + sinb1 * sinb + cosb1 * cosb * coslam;
        break;
      case EQUIT:
        b = 1 + cosb * coslam;
        break;
      case N_POLE:
        b = M_HALFPI + lp.phi;
        q = qp - q;
        break;
      case S_POLE:
        b = lp.phi - M_HALFPI;
        q = qp + q;
        break;
    }
    if (fabs(b) < EPS10) f_error();

    switch (mode) {
      case OBLIQ:
      case EQUIT:
        if (mode == OBLIQ) {
          b = sqrt(2 / b);
          xy.y = ymf * b * (cosb1 * sinb - sinb1 * cosb * coslam);
        } else {
          b = sqrt(2 / (1 + cosb * coslam));
          xy.y = b * sinb * ymf;
        }
        xy.x = xmf * b * cosb * sinlam;
        break;
      case N_POLE:
      case S_POLE:
        if (q >= 0) {
          b = sqrt(q);
          xy.x = b * sinlam;
          xy.y = coslam * (mode == S_POLE ? b : -b);
        } else xy.x = xy.y = 0;
        break;
    }
  }

  function e_inv(xy, lp) {
    var cCe,
      sCe,
      q,
      rho,
      ab = 0.0;

    switch (mode) {
      case EQUIT:
      case OBLIQ:
        xy.x /= dd;
        xy.y *= dd;
        rho = hypot(xy.x, xy.y);
        if (rho < EPS10) {
          lp.lam = 0;
          lp.phi = P.phi0;
          return lp;
        }
        sCe = 2 * asin((0.5 * rho) / rq);
        cCe = cos(sCe);
        sCe = sin(sCe);
        xy.x *= sCe;
        if (mode == OBLIQ) {
          ab = cCe * sinb1 + (xy.y * sCe * cosb1) / rho;
          xy.y = rho * cosb1 * cCe - xy.y * sinb1 * sCe;
        } else {
          ab = (xy.y * sCe) / rho;
          xy.y = rho * cCe;
        }
        break;
      case N_POLE:
        xy.y = -xy.y;
      /* falls through */
      case S_POLE:
        q = xy.x * xy.x + xy.y * xy.y;
        if (!q) {
          lp.lam = 0;
          lp.phi = P.phi0;
          return lp;
        }
        ab = 1 - q / qp;
        if (mode == S_POLE) ab = -ab;
        break;
    }
    lp.lam = atan2(xy.x, xy.y);
    lp.phi = pj_authlat(asin(ab), apa);
    return lp;
  }

  function s_fwd(lp, xy) {
    var coslam, cosphi, sinphi;
    sinphi = sin(lp.phi);
    cosphi = cos(lp.phi);
    coslam = cos(lp.lam);
    switch (mode) {
      case EQUIT:
      case OBLIQ:
        if (mode == EQUIT) {
          xy.y = 1 + cosphi * coslam;
        } else {
          xy.y = 1 + sinb1 * sinphi + cosb1 * cosphi * coslam;
        }
        if (xy.y <= EPS10) f_error();
        xy.y = sqrt(2 / xy.y);
        xy.x = xy.y * cosphi * sin(lp.lam);
        xy.y *=
          mode == EQUIT ? sinphi : cosb1 * sinphi - sinb1 * cosphi * coslam;
        break;
      case N_POLE:
        coslam = -coslam;
      /* falls through */
      case S_POLE:
        if (fabs(lp.phi + P.phi0) < EPS10) f_error();
        xy.y = M_FORTPI - lp.phi * 0.5;
        xy.y = 2 * (mode == S_POLE ? cos(xy.y) : sin(xy.y));
        xy.x = xy.y * sin(lp.lam);
        xy.y *= coslam;
        break;
    }
  }

  function s_inv(xy, lp) {
    var cosz = 0.0,
      rh,
      sinz = 0.0;

    rh = hypot(xy.x, xy.y);
    if ((lp.phi = rh * 0.5) > 1) i_error();
    lp.phi = 2 * asin(lp.phi);
    if (mode == OBLIQ || mode == EQUIT) {
      sinz = sin(lp.phi);
      cosz = cos(lp.phi);
    }
    switch (mode) {
      case EQUIT:
        lp.phi = fabs(rh) <= EPS10 ? 0 : asin((xy.y * sinz) / rh);
        xy.x *= sinz;
        xy.y = cosz * rh;
        break;
      case OBLIQ:
        lp.phi =
          fabs(rh) <= EPS10
            ? P.phi0
            : asin(cosz * sinb1 + (xy.y * sinz * cosb1) / rh);
        xy.x *= sinz * cosb1;
        xy.y = (cosz - sin(lp.phi) * sinb1) * rh;
        break;
      case N_POLE:
        xy.y = -xy.y;
        lp.phi = M_HALFPI - lp.phi;
        break;
      case S_POLE:
        lp.phi -= M_HALFPI;
        break;
    }
    lp.lam =
      xy.y == 0 && (mode == EQUIT || mode == OBLIQ) ? 0 : atan2(xy.x, xy.y);
  }
}

pj_add(pj_lonlat, 'lonlat', 'Lat/long (Geodetic)', '');
pj_add(pj_lonlat, 'longlat', 'Lat/long (Geodetic alias)', '');
pj_add(pj_lonlat, 'latlon', 'Lat/long (Geodetic alias)', '');
pj_add(pj_lonlat, 'latlong', 'Lat/long (Geodetic alias)', '');

function pj_lonlat(P) {
  P.x0 = 0;
  P.y0 = 0;
  P.is_latlong = true;

  P.fwd = function (lp, xy) {
    xy.x = lp.lam / P.a;
    xy.y = lp.phi / P.a;
  };

  P.inv = function (xy, lp) {
    lp.lam = xy.x * P.a;
    lp.phi = xy.y * P.a;
  };
}

function pj_tsfn(phi, sinphi, e) {
  sinphi *= e;
  // Proj.4 returns HUGE_VAL on div0; this returns +/- Infinity; effect should be same
  return (
    tan(0.5 * (M_HALFPI - phi)) / pow((1 - sinphi) / (1 + sinphi), 0.5 * e)
  );
}

pj_add(
  pj_lcc,
  'lcc',
  'Lambert Conformal Conic',
  'Conic, Sph&Ell\nlat_1= and lat_2= or lat_0='
);

function pj_lcc(P) {
  var EPS10 = 1e-10;
  var cosphi, sinphi, secant;
  var phi1, phi2, n, rho0, c, ellips, ml1, m1;

  P.inv = e_inv;
  P.fwd = e_fwd;

  phi1 = pj_param(P.params, 'rlat_1');
  if (pj_param(P.params, 'tlat_2')) phi2 = pj_param(P.params, 'rlat_2');
  else {
    phi2 = phi1;
    if (!pj_param(P.params, 'tlat_0')) P.phi0 = phi1;
  }
  if (fabs(phi1 + phi2) < EPS10) e_error(-21);
  n = sinphi = sin(phi1);
  cosphi = cos(phi1);
  secant = fabs(phi1 - phi2) >= EPS10;
  if ((ellips = P.es != 0)) {
    P.e = sqrt(P.es);
    m1 = pj_msfn(sinphi, cosphi, P.es);
    ml1 = pj_tsfn(phi1, sinphi, P.e);
    if (secant) {
      /* secant cone */
      sinphi = sin(phi2);
      n = log(m1 / pj_msfn(sinphi, cos(phi2), P.es));
      n /= log(ml1 / pj_tsfn(phi2, sinphi, P.e));
    }
    c = rho0 = (m1 * pow(ml1, -n)) / n;
    rho0 *=
      fabs(fabs(P.phi0) - M_HALFPI) < EPS10
        ? 0
        : pow(pj_tsfn(P.phi0, sin(P.phi0), P.e), n);
  } else {
    if (secant)
      n =
        log(cosphi / cos(phi2)) /
        log(tan(M_FORTPI + 0.5 * phi2) / tan(M_FORTPI + 0.5 * phi1));
    c = (cosphi * pow(tan(M_FORTPI + 0.5 * phi1), n)) / n;
    rho0 =
      fabs(fabs(P.phi0) - M_HALFPI) < EPS10
        ? 0
        : c * pow(tan(M_FORTPI + 0.5 * P.phi0), -n);
  }

  function e_fwd(lp, xy) {
    var lam = lp.lam;
    var rho;
    if (fabs(fabs(lp.phi) - M_HALFPI) < EPS10) {
      if (lp.phi * n <= 0) f_error();
      rho = 0;
    } else {
      rho =
        c *
        (ellips
          ? pow(pj_tsfn(lp.phi, sin(lp.phi), P.e), n)
          : pow(tan(M_FORTPI + 0.5 * lp.phi), -n));
    }
    lam *= n;
    xy.x = P.k0 * (rho * sin(lam));
    xy.y = P.k0 * (rho0 - rho * cos(lam));
  }

  function e_inv(xy, lp) {
    var x = xy.x,
      y = xy.y;
    var rho;
    x /= P.k0;
    y /= P.k0;

    y = rho0 - y;
    rho = hypot(x, y);
    if (rho != 0) {
      if (n < 0) {
        rho = -rho;
        x = -x;
        y = -y;
      }
      if (ellips) {
        lp.phi = pj_phi2(pow(rho / c, 1 / n), P.e);
        if (lp.phi == HUGE_VAL) i_error();
      } else lp.phi = 2 * atan(pow(c / rho, 1 / n)) - M_HALFPI;
      lp.lam = atan2(x, y) / n;
    } else {
      lp.lam = 0;
      lp.phi = n > 0 ? M_HALFPI : -M_HALFPI;
    }
  }
}

pj_add(pj_loxim, 'loxim', 'Loximuthal', 'PCyl Sph');

function pj_loxim(P) {
  var EPS = 1e-8;
  var phi1, cosphi1, tanphi1;
  phi1 = pj_param(P.params, 'rlat_1');
  cosphi1 = cos(phi1);
  tanphi1 = tan(M_FORTPI + 0.5 * phi1);
  if (cosphi1 < EPS) e_error(-22);
  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    xy.y = lp.phi - phi1;
    if (fabs(xy.y) < EPS) xy.x = lp.lam * cosphi1;
    else {
      xy.x = M_FORTPI + 0.5 * lp.phi;
      if (fabs(xy.x) < EPS || fabs(fabs(xy.x) - M_HALFPI) < EPS) xy.x = 0;
      else xy.x = (lp.lam * xy.y) / log(tan(xy.x) / tanphi1);
    }
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y + phi1;
    if (fabs(xy.y) < EPS) {
      lp.lam = xy.x / cosphi1;
    } else {
      lp.lam = M_FORTPI + 0.5 * lp.phi;
      if (fabs(lp.lam) < EPS || fabs(fabs(lp.lam) - M_HALFPI) < EPS) lp.lam = 0;
      else lp.lam = (xy.x * log(tan(lp.lam) / tanphi1)) / xy.y;
    }
  }
}

pj_add(
  pj_mbt_fpp,
  'mbt_fpp',
  'McBride-Thomas Flat-Polar Parabolic',
  'Cyl., Sph.'
);

function pj_mbt_fpp(P) {
  var CS = 0.95257934441568037152,
    FXC = 0.92582009977255146156,
    FYC = 3.40168025708304504493,
    C23 = 2 / 3,
    C13 = 1 / 3,
    ONEEPS = 1.0000001;

  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    lp.phi = asin(CS * sin(lp.phi));
    xy.x = FXC * lp.lam * (2 * cos(C23 * lp.phi) - 1);
    xy.y = FYC * sin(C13 * lp.phi);
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y / FYC;
    if (fabs(lp.phi) >= 1) {
      if (fabs(lp.phi) > ONEEPS) i_error();
      else lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
    } else lp.phi = asin(lp.phi);

    lp.lam = xy.x / (FXC * (2 * cos(C23 * (lp.phi *= 3)) - 1));
    if (fabs((lp.phi = sin(lp.phi) / CS)) >= 1) {
      if (fabs(lp.phi) > ONEEPS) i_error();
      else lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
    } else lp.phi = asin(lp.phi);
  }
}

pj_add(
  pj_mbt_fpq,
  'mbt_fpq',
  'McBryde-Thomas Flat-Polar Quartic',
  'Cyl., Sph.'
);

function pj_mbt_fpq(P) {
  var NITER = 20,
    EPS = 1e-7,
    ONETOL = 1.000001,
    C = 1.7071067811865475244,
    RC = 0.58578643762690495119,
    FYC = 1.87475828462269495505,
    RYC = 0.53340209679417701685,
    FXC = 0.3124597141037824925,
    RXC = 3.20041258076506210122;

  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    var th1, c, i;
    c = C * sin(lp.phi);
    for (i = NITER; i; --i) {
      lp.phi -= th1 =
        (sin(0.5 * lp.phi) + sin(lp.phi) - c) /
        (0.5 * cos(0.5 * lp.phi) + cos(lp.phi));
      if (fabs(th1) < EPS) break;
    }
    xy.x = FXC * lp.lam * (1.0 + (2 * cos(lp.phi)) / cos(0.5 * lp.phi));
    xy.y = FYC * sin(0.5 * lp.phi);
  }

  function s_inv(xy, lp) {
    var t;
    lp.phi = RYC * xy.y;
    if (fabs(lp.phi) > 1) {
      if (fabs(lp.phi) > ONETOL) i_error();
      else if (lp.phi < 0) {
        t = -1;
        lp.phi = -M_PI;
      } else {
        t = 1;
        lp.phi = M_PI;
      }
    } else lp.phi = 2 * asin((t = lp.phi));
    lp.lam = (RXC * xy.x) / (1 + (2 * cos(lp.phi)) / cos(0.5 * lp.phi));
    lp.phi = RC * (t + sin(lp.phi));
    if (fabs(lp.phi) > 1)
      if (fabs(lp.phi) > ONETOL) i_error();
      else lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
    else lp.phi = asin(lp.phi);
  }
}

pj_add(
  pj_mbt_fps,
  'mbt_fps',
  'McBryde-Thomas Flat-Pole Sine (No. 2)',
  'Cyl., Sph.'
);

function pj_mbt_fps(P) {
  var MAX_ITER = 10,
    LOOP_TOL = 1e-7,
    C1 = 0.45503,
    C2 = 1.36509,
    C3 = 1.41546,
    C_x = 0.22248,
    C_y = 1.44492,
    C1_2 = 1 / 3;

  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    var k, V, t, i;
    k = C3 * sin(lp.phi);
    for (i = MAX_ITER; i; --i) {
      t = lp.phi / C2;
      lp.phi -= V =
        (C1 * sin(t) + sin(lp.phi) - k) / (C1_2 * cos(t) + cos(lp.phi));
      if (fabs(V) < LOOP_TOL) break;
    }
    t = lp.phi / C2;
    xy.x = C_x * lp.lam * (1 + (3 * cos(lp.phi)) / cos(t));
    xy.y = C_y * sin(t);
  }

  function s_inv(xy, lp) {
    var t;
    lp.phi = C2 * (t = aasin(xy.y / C_y));
    lp.lam = xy.x / (C_x * (1 + (3 * cos(lp.phi)) / cos(t)));
    lp.phi = aasin((C1 * sin(t) + sin(lp.phi)) / C3);
  }
}

function pj_phi2(ts, e) {
  var N_ITER = 15,
    TOL = 1e-10,
    eccnth = 0.5 * e,
    Phi = M_HALFPI - 2 * atan(ts),
    i = N_ITER,
    con,
    dphi;

  do {
    con = e * sin(Phi);
    dphi = M_HALFPI - 2 * atan(ts * pow((1 - con) / (1 + con), eccnth)) - Phi;
    Phi += dphi;
  } while (fabs(dphi) > TOL && --i);
  if (i <= 0) {
    pj_ctx_set_errno(-18);
  }
  return Phi;
}

pj_add(pj_merc, 'merc', 'Mercator', 'Cyl, Sph&Ell\nlat_ts=');

function pj_merc(P) {
  var EPS10 = 1e-10;
  var phits = 0;
  var is_phits = pj_param(P.params, 'tlat_ts');

  if (is_phits) {
    phits = pj_param(P.params, 'rlat_ts');
    if (phits >= M_HALFPI) {
      e_error(-24);
    }
  }

  if (P.es) {
    // ellipsoid
    if (is_phits) {
      P.k0 = pj_msfn(sin(phits), cos(phits), P.es);
    }
    P.inv = e_inv;
    P.fwd = e_fwd;
  } else {
    P.inv = s_inv;
    P.fwd = s_fwd;
  }

  function e_fwd(lp, xy) {
    if (fabs(fabs(lp.phi) - M_HALFPI) <= EPS10) {
      f_error();
    }
    xy.x = P.k0 * lp.lam;
    xy.y = -P.k0 * log(pj_tsfn(lp.phi, sin(lp.phi), P.e));
  }

  function e_inv(xy, lp) {
    lp.phi = pj_phi2(exp(-xy.y / P.k0), P.e);
    if (lp.phi === HUGE_VAL) {
      i_error();
    }
    lp.lam = xy.x / P.k0;
  }

  function s_fwd(lp, xy) {
    if (fabs(fabs(lp.phi) - M_HALFPI) <= EPS10) {
      f_error();
    }
    xy.x = P.k0 * lp.lam;
    xy.y = P.k0 * log(tan(M_FORTPI + 0.5 * lp.phi));
  }

  function s_inv(xy, lp) {
    lp.phi = M_HALFPI - 2 * atan(exp(-xy.y / P.k0));
    lp.lam = xy.x / P.k0;
  }
}

pj_add(pj_mill, 'mill', 'Miller Cylindrical', 'Cyl, Sph');

function pj_mill(P) {
  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    xy.x = lp.lam;
    xy.y = log(tan(M_FORTPI + lp.phi * 0.4)) * 1.25;
  }

  function s_inv(xy, lp) {
    lp.lam = xy.x;
    lp.phi = 2.5 * (atan(exp(0.8 * xy.y)) - M_FORTPI);
  }
}

/* evaluate complex polynomial */

/* note: coefficients are always from C_1 to C_n
 **  i.e. C_0 == (0., 0)
 **  n should always be >= 1 though no checks are made
 */
// z: Complex number (object with r and i properties)
// C: Array of complex numbers
// returns: complex number
function pj_zpoly1(z, C) {
  var t, r, i;
  var n = C.length - 1;
  r = C[n][0];
  i = C[n][1];
  while (--n >= 0) {
    t = r;
    r = C[n][0] + z.r * t - z.i * i;
    i = C[n][1] + z.r * i + z.i * t;
  }
  return {
    r: z.r * r - z.i * i,
    i: z.r * i + z.i * r
  };
}

/* evaluate complex polynomial and derivative */
function pj_zpolyd1(z, C, der) {
  var ai, ar, bi, br, t;
  var first = true;
  var n = C.length - 1;
  ar = br = C[n][0];
  ai = bi = C[n][1];
  while (--n >= 0) {
    if (first) {
      first = false;
    } else {
      br = ar + z.r * (t = br) - z.i * bi;
      bi = ai + z.r * bi + z.i * t;
    }
    ar = C[n][0] + z.r * (t = ar) - z.i * ai;
    ai = C[n][1] + z.r * ai + z.i * t;
  }
  der.r = ar + z.r * br - z.i * bi;
  der.i = ai + z.r * bi + z.i * br;
  return {
    r: z.r * ar - z.i * ai,
    i: z.r * ai + z.i * ar
  };
}

pj_add(pj_mil_os, 'mil_os', 'Miller Oblated Stereographic', 'Azi(mod)');
pj_add(pj_lee_os, 'lee_os', 'Lee Oblated Stereographic', 'Azi(mod)');
pj_add(pj_gs48, 'gs48', 'Mod Stereographic of 48 U.S.', 'Azi(mod)');
pj_add(pj_alsk, 'alsk', 'Mod Stereographic of Alaska', 'Azi(mod)');
pj_add(pj_gs50, 'gs50', 'Mod Stereographic of 50 U.S.', 'Azi(mod)');

function pj_mil_os(P) {
  var AB = [
    [0.9245, 0],
    [0, 0],
    [0.01943, 0]
  ];
  P.lam0 = DEG_TO_RAD * 20;
  P.phi0 = DEG_TO_RAD * 18;
  P.es = 0;
  pj_mod_ster(P, AB);
}

function pj_lee_os(P) {
  var AB = [
    [0.721316, 0],
    [0, 0],
    [-0.0088162, -0.00617325]
  ];
  P.lam0 = DEG_TO_RAD * -165;
  P.phi0 = DEG_TO_RAD * -10;
  P.es = 0;
  pj_mod_ster(P, AB);
}

function pj_gs48(P) {
  var AB = [
    [0.98879, 0],
    [0, 0],
    [-0.050909, 0],
    [0, 0],
    [0.075528, 0]
  ];
  P.lam0 = DEG_TO_RAD * -96;
  P.phi0 = DEG_TO_RAD * 39;
  P.es = 0;
  P.a = 6370997;
  pj_mod_ster(P, AB);
}

function pj_alsk(P) {
  var ABe = [
    /* Alaska ellipsoid */ [0.9945303, 0],
    [0.0052083, -0.0027404],
    [0.0072721, 0.0048181],
    [-0.0151089, -0.1932526],
    [0.0642675, -0.1381226],
    [0.3582802, -0.2884586]
  ];
  var ABs = [
    /* Alaska sphere */ [0.9972523, 0],
    [0.0052513, -0.0041175],
    [0.0074606, 0.0048125],
    [-0.0153783, -0.1968253],
    [0.0636871, -0.1408027],
    [0.3660976, -0.2937382]
  ];
  var AB;
  P.lam0 = DEG_TO_RAD * -152;
  P.phi0 = DEG_TO_RAD * 64;
  if (P.es != 0.0) {
    /* fixed ellipsoid/sphere */
    AB = ABe;
    P.a = 6378206.4;
    P.e = sqrt((P.es = 0.00676866));
  } else {
    AB = ABs;
    P.a = 6370997;
  }
  pj_mod_ster(P, AB);
}

function pj_gs50(P) {
  var ABe = [
    [0.9827497, 0],
    [0.0210669, 0.0053804],
    [-0.1031415, -0.0571664],
    [-0.0323337, -0.0322847],
    [0.0502303, 0.1211983],
    [0.0251805, 0.0895678],
    [-0.0012315, -0.1416121],
    [0.0072202, -0.1317091],
    [-0.0194029, 0.0759677],
    [-0.0210072, 0.0834037]
  ];
  var ABs = [
    [0.984299, 0],
    [0.0211642, 0.0037608],
    [-0.1036018, -0.0575102],
    [-0.0329095, -0.0320119],
    [0.0499471, 0.1223335],
    [0.026046, 0.0899805],
    [0.0007388, -0.1435792],
    [0.0075848, -0.1334108],
    [-0.0216473, 0.0776645],
    [-0.0225161, 0.0853673]
  ];
  var AB;
  P.lam0 = DEG_TO_RAD * -120;
  P.phi0 = DEG_TO_RAD * 45;
  if (P.es != 0.0) {
    /* fixed ellipsoid/sphere */
    AB = ABe;
    P.a = 6378206.4;
    P.e = sqrt((P.es = 0.00676866));
  } else {
    AB = ABs;
    P.a = 6370997;
  }
  pj_mod_ster(P, AB);
}

function pj_mod_ster(P, zcoeff) {
  var EPSLN = 1e-12;
  var esphi, chio;
  var cchio, schio;
  if (P.es != 0.0) {
    esphi = P.e * sin(P.phi0);
    chio =
      2 *
        atan(
          tan((M_HALFPI + P.phi0) * 0.5) *
            pow((1 - esphi) / (1 + esphi), P.e * 0.5)
        ) -
      M_HALFPI;
  } else chio = P.phi0;
  schio = sin(chio);
  cchio = cos(chio);
  P.inv = e_inv;
  P.fwd = e_fwd;

  function e_fwd(lp, xy) {
    var sinlon, coslon, esphi, chi, schi, cchi, s;
    var p = {};

    sinlon = sin(lp.lam);
    coslon = cos(lp.lam);
    esphi = P.e * sin(lp.phi);
    chi =
      2 *
        atan(
          tan((M_HALFPI + lp.phi) * 0.5) *
            pow((1 - esphi) / (1 + esphi), P.e * 0.5)
        ) -
      M_HALFPI;
    schi = sin(chi);
    cchi = cos(chi);
    s = 2 / (1 + schio * schi + cchio * cchi * coslon);
    p.r = s * cchi * sinlon;
    p.i = s * (cchio * schi - schio * cchi * coslon);
    p = pj_zpoly1(p, zcoeff);
    xy.x = p.r;
    xy.y = p.i;
  }

  function e_inv(xy, lp) {
    var nn;
    var p = {},
      fxy,
      fpxy = {},
      dp = {}; // complex numbers
    var den,
      rh = 0.0,
      z,
      sinz = 0.0,
      cosz = 0.0,
      chi,
      phi = 0.0,
      esphi;
    var dphi;

    p.r = xy.x;
    p.i = xy.y;
    for (nn = 20; nn; --nn) {
      fxy = pj_zpolyd1(p, zcoeff, fpxy);
      fxy.r -= xy.x;
      fxy.i -= xy.y;
      den = fpxy.r * fpxy.r + fpxy.i * fpxy.i;
      dp.r = -(fxy.r * fpxy.r + fxy.i * fpxy.i) / den;
      dp.i = -(fxy.i * fpxy.r - fxy.r * fpxy.i) / den;
      p.r += dp.r;
      p.i += dp.i;
      if (fabs(dp.r) + fabs(dp.i) <= EPSLN) break;
    }
    if (nn) {
      rh = hypot(p.r, p.i);
      z = 2 * atan(0.5 * rh);
      sinz = sin(z);
      cosz = cos(z);
      lp.lam = P.lam0;
      if (fabs(rh) <= EPSLN) {
        /* if we end up here input coordinates were (0,0).
         * pj_inv() adds P.lam0 to lp.lam, this way we are
         * sure to get the correct offset */
        lp.lam = 0.0;
        lp.phi = P.phi0;
        return;
      }
      chi = aasin(cosz * schio + (p.i * sinz * cchio) / rh);
      phi = chi;
      for (nn = 20; nn; --nn) {
        esphi = P.e * sin(phi);
        dphi =
          2 *
            atan(
              tan((M_HALFPI + chi) * 0.5) *
                pow((1 + esphi) / (1 - esphi), P.e * 0.5)
            ) -
          M_HALFPI -
          phi;
        phi += dphi;
        if (fabs(dphi) <= EPSLN) break;
      }
    }
    if (nn) {
      lp.phi = phi;
      lp.lam = atan2(p.r * sinz, rh * cchio * cosz - p.i * schio * sinz);
    } else lp.lam = lp.phi = HUGE_VAL;
  }
}

pj_add(pj_natearth, 'natearth', 'Natural Earth', 'PCyl., Sph.');
pj_add(pj_natearth2, 'natearth2', 'Natural Earth 2', 'PCyl., Sph.');

function pj_natearth(P) {
  var A0 = 0.8707,
    A1 = -0.131979,
    A2 = -0.013791,
    A3 = 0.003971,
    A4 = -0.001529,
    B0 = 1.007226,
    B1 = 0.015085,
    B2 = -0.044475,
    B3 = 0.028874,
    B4 = -0.005916,
    C0 = B0,
    C1 = 3 * B1,
    C2 = 7 * B2,
    C3 = 9 * B3,
    C4 = 11 * B4,
    EPS = 1e-11,
    MAX_Y = 0.8707 * 0.52 * M_PI;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var phi2, phi4;
    phi2 = lp.phi * lp.phi;
    phi4 = phi2 * phi2;
    xy.x =
      lp.lam *
      (A0 + phi2 * (A1 + phi2 * (A2 + phi4 * phi2 * (A3 + phi2 * A4))));
    xy.y = lp.phi * (B0 + phi2 * (B1 + phi4 * (B2 + B3 * phi2 + B4 * phi4)));
  }

  function s_inv(xy, lp) {
    var x = xy.x,
      y = xy.y;
    var yc, tol, y2, y4, f, fder;
    if (y > MAX_Y) {
      y = MAX_Y;
    } else if (y < -MAX_Y) {
      y = -MAX_Y;
    }

    yc = y;
    for (;;) {
      /* Newton-Raphson */
      y2 = yc * yc;
      y4 = y2 * y2;
      f = yc * (B0 + y2 * (B1 + y4 * (B2 + B3 * y2 + B4 * y4))) - y;
      fder = C0 + y2 * (C1 + y4 * (C2 + C3 * y2 + C4 * y4));
      yc -= tol = f / fder;
      if (fabs(tol) < EPS) {
        break;
      }
    }
    lp.phi = yc;
    y2 = yc * yc;
    lp.lam = x / (A0 + y2 * (A1 + y2 * (A2 + y2 * y2 * y2 * (A3 + y2 * A4))));
  }
}

function pj_natearth2(P) {
  var A0 = 0.84719,
    A1 = -0.13063,
    A2 = -0.04515,
    A3 = 0.05494,
    A4 = -0.02326,
    A5 = 0.00331,
    B0 = 1.01183,
    B1 = -0.02625,
    B2 = 0.01926,
    B3 = -0.00396,
    C0 = B0,
    C1 = 9 * B1,
    C2 = 11 * B2,
    C3 = 13 * B3,
    EPS = 1e-11,
    MAX_Y = 0.84719 * 0.535117535153096 * M_PI;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var phi2, phi4, phi6;
    phi2 = lp.phi * lp.phi;
    phi4 = phi2 * phi2;
    phi6 = phi2 * phi4;
    xy.x =
      lp.lam *
      (A0 + A1 * phi2 + phi6 * phi6 * (A2 + A3 * phi2 + A4 * phi4 + A5 * phi6));
    xy.y = lp.phi * (B0 + phi4 * phi4 * (B1 + B2 * phi2 + B3 * phi4));
  }

  function s_inv(xy, lp) {
    var x = xy.x,
      y = xy.y;
    var yc, tol, y2, y4, y6, f, fder;
    if (y > MAX_Y) {
      y = MAX_Y;
    } else if (y < -MAX_Y) {
      y = -MAX_Y;
    }
    yc = y;
    for (;;) {
      /* Newton-Raphson */
      y2 = yc * yc;
      y4 = y2 * y2;
      f = yc * (B0 + y4 * y4 * (B1 + B2 * y2 + B3 * y4)) - y;
      fder = C0 + y4 * y4 * (C1 + C2 * y2 + C3 * y4);
      yc -= tol = f / fder;
      if (fabs(tol) < EPS) {
        break;
      }
    }
    lp.phi = yc;
    y2 = yc * yc;
    y4 = y2 * y2;
    y6 = y2 * y4;
    lp.lam = x / (A0 + A1 * y2 + y6 * y6 * (A2 + A3 * y2 + A4 * y4 + A5 * y6));
  }
}

pj_add(pj_nell, 'nell', 'Nell', 'PCyl., Sph.');

function pj_nell(P) {
  var MAX_ITER = 10;
  var LOOP_TOL = 1e-7;
  P.inv = s_inv;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var k, V, i;
    k = 2 * sin(lp.phi);
    V = lp.phi * lp.phi;
    lp.phi *= 1.00371 + V * (-0.0935382 + V * -0.011412);
    for (i = MAX_ITER; i; --i) {
      lp.phi -= V = (lp.phi + sin(lp.phi) - k) / (1 + cos(lp.phi));
      if (fabs(V) < LOOP_TOL) break;
    }
    xy.x = 0.5 * lp.lam * (1 + cos(lp.phi));
    xy.y = lp.phi;
  }

  function s_inv(xy, lp) {
    lp.lam = (2 * xy.x) / (1 + cos(xy.y));
    lp.phi = aasin(0.5 * (xy.y + sin(xy.y)));
  }
}

pj_add(pj_nell_h, 'nell_h', 'Nell-Hammer', 'PCyl., Sph.');

function pj_nell_h(P) {
  var NITER = 9,
    EPS = 1e-7;
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = 0.5 * lp.lam * (1 + cos(lp.phi));
    xy.y = 2.0 * (lp.phi - tan(0.5 * lp.phi));
  }

  function s_inv(xy, lp) {
    var V, c, p, i;
    p = 0.5 * xy.y;
    for (i = NITER; i > 0; --i) {
      c = cos(0.5 * lp.phi);
      lp.phi -= V = (lp.phi - tan(lp.phi / 2) - p) / (1 - 0.5 / (c * c));
      if (fabs(V) < EPS) break;
    }
    if (!i) {
      lp.phi = p < 0 ? -M_HALFPI : M_HALFPI;
      lp.lam = 2 * xy.x;
    } else lp.lam = (2 * xy.x) / (1 + cos(lp.phi));
  }
}

pj_add(pj_nsper, 'nsper', 'Near-sided perspective', 'Azi, Sph\nh=');
pj_add(pj_tpers, 'tpers', 'Tilted perspective', 'Azi, Sph\ntilt= azi= h=');

function pj_nsper(P) {
  pj_tpers_init(P, pj_param(P.params, 'dh'));
}

function pj_tpers(P) {
  var tilt = pj_param(P.params, 'dtilt') * DEG_TO_RAD;
  var azi = pj_param(P.params, 'dazi') * DEG_TO_RAD;
  var height = pj_param(P.params, 'dh');
  pj_tpers_init(P, height, tilt, azi);
}

function pj_tpers_init(P, height, tiltAngle, azimuth) {
  var N_POLE = 0,
    S_POLE = 1,
    EIT = 2,
    OBLI = 3,
    tilt = !isNaN(tiltAngle) && !isNaN(azimuth),
    mode,
    sinph0,
    cosph0,
    p,
    rp,
    pn1,
    pfact,
    h,
    cg,
    sg,
    sw,
    cw;

  if (height <= 0) e_error(-30);
  if (tilt) {
    cg = cos(azimuth);
    sg = sin(azimuth);
    cw = cos(tiltAngle);
    sw = sin(tiltAngle);
  }
  if (fabs(fabs(P.phi0) - M_HALFPI) < EPS10)
    mode = P.phi0 < 0 ? S_POLE : N_POLE;
  else if (fabs(P.phi0) < EPS10) mode = EIT;
  else {
    mode = OBLI;
    sinph0 = sin(P.phi0);
    cosph0 = cos(P.phi0);
  }
  pn1 = height / P.a; /* normalize by radius */
  p = 1 + pn1;
  rp = 1 / p;
  h = 1 / pn1;
  pfact = (p + 1) * h;

  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    var coslam, cosphi, sinphi;
    var yt, ba;
    sinphi = sin(lp.phi);
    cosphi = cos(lp.phi);
    coslam = cos(lp.lam);
    switch (mode) {
      case OBLI:
        xy.y = sinph0 * sinphi + cosph0 * cosphi * coslam;
        break;
      case EIT:
        xy.y = cosphi * coslam;
        break;
      case S_POLE:
        xy.y = -sinphi;
        break;
      case N_POLE:
        xy.y = sinphi;
        break;
    }
    if (xy.y < rp) f_error();
    xy.y = pn1 / (p - xy.y);
    xy.x = xy.y * cosphi * sin(lp.lam);
    switch (mode) {
      case OBLI:
        xy.y *= cosph0 * sinphi - sinph0 * cosphi * coslam;
        break;
      case EIT:
        xy.y *= sinphi;
        break;
      case N_POLE:
        coslam = -coslam;
      /* falls through */
      case S_POLE:
        xy.y *= cosphi * coslam;
        break;
    }
    if (tilt) {
      yt = xy.y * cg + xy.x * sg;
      ba = 1 / (yt * sw * h + cw);
      xy.x = (xy.x * cg - xy.y * sg) * cw * ba;
      xy.y = yt * ba;
    }
  }

  function s_inv(xy, lp) {
    var rh, cosz, sinz;
    var bm, bq, yt;
    if (tilt) {
      yt = 1 / (pn1 - xy.y * sw);
      bm = pn1 * xy.x * yt;
      bq = pn1 * xy.y * cw * yt;
      xy.x = bm * cg + bq * sg;
      xy.y = bq * cg - bm * sg;
    }
    rh = hypot(xy.x, xy.y);
    if ((sinz = 1 - rh * rh * pfact) < 0) i_error();
    sinz = (p - sqrt(sinz)) / (pn1 / rh + rh / pn1);
    cosz = sqrt(1 - sinz * sinz);
    if (fabs(rh) <= EPS10) {
      lp.lam = 0;
      lp.phi = P.phi0;
    } else {
      switch (mode) {
        case OBLI:
          lp.phi = asin(cosz * sinph0 + (xy.y * sinz * cosph0) / rh);
          xy.y = (cosz - sinph0 * sin(lp.phi)) * rh;
          xy.x *= sinz * cosph0;
          break;
        case EIT:
          lp.phi = asin((xy.y * sinz) / rh);
          xy.y = cosz * rh;
          xy.x *= sinz;
          break;
        case N_POLE:
          lp.phi = asin(cosz);
          xy.y = -xy.y;
          break;
        case S_POLE:
          lp.phi = -asin(cosz);
          break;
      }
      lp.lam = atan2(xy.x, xy.y);
    }
  }
}

pj_add(pj_nzmg, 'nzmg', 'New Zealand Map Grid', 'fixed Earth');

function pj_nzmg(P) {
  var EPSLN = 1e-10;
  var SEC5_TO_RAD = 0.4848136811095359935899141023;
  var RAD_TO_SEC5 = 2.062648062470963551564733573;
  var bf = [
    [0.7557853228, 0.0],
    [0.249204646, 0.003371507],
    [-0.001541739, 0.04105856],
    [-0.10162907, 0.01727609],
    [-0.26623489, -0.36249218],
    [-0.6870983, -1.1651967]
  ];

  var tphi = [
    1.5627014243, 0.5185406398, -0.03333098, -0.1052906, -0.0368594, 0.007317,
    0.0122, 0.00394, -0.0013
  ];

  var tpsi = [
    0.6399175073, -0.1358797613, 0.063294409, -0.02526853, 0.0117879,
    -0.0055161, 0.0026906, -0.001333, 0.00067, -0.00034
  ];

  /* force to International major axis */
  P.ra = 1 / (P.a = 6378388.0);
  P.lam0 = DEG_TO_RAD * 173;
  P.phi0 = DEG_TO_RAD * -41;
  P.x0 = 2510000;
  P.y0 = 6023150;

  P.inv = e_inv;
  P.fwd = e_fwd;

  function e_fwd(lp, xy) {
    var i = tpsi.length - 1;
    var p = { r: tpsi[i] };
    var phi = (lp.phi - P.phi0) * RAD_TO_SEC5;
    for (--i; i >= 0; --i) p.r = tpsi[i] + phi * p.r;
    p.r *= phi;
    p.i = lp.lam;
    p = pj_zpoly1(p, bf);
    xy.x = p.i;
    xy.y = p.r;
  }

  function e_inv(xy, lp) {
    var nn, i, dr, di, f, den;
    var p = { r: xy.y, i: xy.x };
    var fp = {};
    for (nn = 20; nn > 0; --nn) {
      f = pj_zpolyd1(p, bf, fp);
      f.r -= xy.y;
      f.i -= xy.x;
      den = fp.r * fp.r + fp.i * fp.i;
      p.r += dr = -(f.r * fp.r + f.i * fp.i) / den;
      p.i += di = -(f.i * fp.r - f.r * fp.i) / den;
      if (fabs(dr) + fabs(di) <= EPSLN) break;
    }
    if (nn > 0) {
      lp.lam = p.i;
      i = tphi.length - 1;
      lp.phi = tphi[i];
      for (--i; i >= 0; --i) lp.phi = tphi[i] + p.r * lp.phi;
      lp.phi = P.phi0 + p.r * lp.phi * SEC5_TO_RAD;
    } else lp.lam = lp.phi = HUGE_VAL;
  }
}

pj_add(
  pj_ob_tran,
  'ob_tran',
  'General Oblique Transformation',
  'Misc Sph\n' +
    'o_proj= plus parameters for projection\n' +
    'o_lat_p= o_lon_p= (new pole) or\n' +
    'o_alpha= o_lon_c= o_lat_c= or\n' +
    'o_lon_1= o_lat_1= o_lon_2= o_lat_2='
);

function pj_ob_tran(P) {
  var name, defn, P2;
  var lamp, cphip, sphip, phip;
  var lamc, phic, alpha;
  var lam1, lam2, phi1, phi2, con;
  var TOL = 1e-10;

  name = pj_param(P.params, 'so_proj');
  defn = pj_list[name];
  if (!name) e_error(-26);
  if (!defn || name == 'ob_tran') e_error(-37);
  P.es = 0;
  // copy params to second object
  P2 = {};
  Object.keys(P).forEach(function (key) {
    // TODO: remove o_ params?
    P2[key] = P[key];
  });
  defn.init(P2);

  // NOT in Proj.4
  // fix output units when doing latlong transform (see pj_transform.js)
  if (P2.is_latlong && P.to_meter == 1) {
    P.to_meter = DEG_TO_RAD;
    P.fr_meter = RAD_TO_DEG;
  }

  if (pj_param(P.params, 'to_alpha')) {
    lamc = pj_param(P.params, 'ro_lon_c');
    phic = pj_param(P.params, 'ro_lat_c');
    alpha = pj_param(P.params, 'ro_alpha');

    if (fabs(fabs(phic) - M_HALFPI) <= TOL) e_error(-32);
    lamp = lamc + aatan2(-cos(alpha), -sin(alpha) * sin(phic));
    phip = aasin(cos(phic) * sin(alpha));
  } else if (pj_param(P.params, 'to_lat_p')) {
    /* specified new pole */
    lamp = pj_param(P.params, 'ro_lon_p');
    phip = pj_param(P.params, 'ro_lat_p');
  } else {
    /* specified new 'equator' points */

    lam1 = pj_param(P.params, 'ro_lon_1');
    phi1 = pj_param(P.params, 'ro_lat_1');
    lam2 = pj_param(P.params, 'ro_lon_2');
    phi2 = pj_param(P.params, 'ro_lat_2');
    if (
      fabs(phi1 - phi2) <= TOL ||
      (con = fabs(phi1)) <= TOL ||
      fabs(con - M_HALFPI) <= TOL ||
      fabs(fabs(phi2) - M_HALFPI) <= TOL
    )
      e_error(-33);
    lamp = atan2(
      cos(phi1) * sin(phi2) * cos(lam1) - sin(phi1) * cos(phi2) * cos(lam2),
      sin(phi1) * cos(phi2) * sin(lam2) - cos(phi1) * sin(phi2) * sin(lam1)
    );
    phip = atan(-cos(lamp - lam1) / tan(phi1));
  }
  if (fabs(phip) > TOL) {
    /* oblique */
    cphip = cos(phip);
    sphip = sin(phip);
    P.fwd = o_fwd;
    P.inv = P2.inv ? o_inv : null;
  } else {
    /* transverse */
    P.fwd = t_fwd;
    P.inv = P2.inv ? t_inv : null;
  }

  function o_fwd(lp, xy) {
    var coslam, sinphi, cosphi;
    coslam = cos(lp.lam);
    sinphi = sin(lp.phi);
    cosphi = cos(lp.phi);
    lp.lam = adjlon(
      aatan2(cosphi * sin(lp.lam), sphip * cosphi * coslam + cphip * sinphi) +
        lamp
    );
    lp.phi = aasin(sphip * sinphi - cphip * cosphi * coslam);
    P2.fwd(lp, xy);
  }

  function t_fwd(lp, xy) {
    var cosphi, coslam;
    cosphi = cos(lp.phi);
    coslam = cos(lp.lam);
    lp.lam = adjlon(aatan2(cosphi * sin(lp.lam), sin(lp.phi)) + lamp);
    lp.phi = aasin(-cosphi * coslam);
    P2.fwd(lp, xy);
  }

  function o_inv(xy, lp) {
    var coslam, sinphi, cosphi;
    P2.inv(xy, lp);
    if (lp.lam != HUGE_VAL) {
      coslam = cos((lp.lam -= lamp));
      sinphi = sin(lp.phi);
      cosphi = cos(lp.phi);
      lp.phi = aasin(sphip * sinphi + cphip * cosphi * coslam);
      lp.lam = aatan2(
        cosphi * sin(lp.lam),
        sphip * cosphi * coslam - cphip * sinphi
      );
    }
  }

  function t_inv(xy, lp) {
    var cosphi, t;
    P2.inv(xy, lp);
    if (lp.lam != HUGE_VAL) {
      cosphi = cos(lp.phi);
      t = lp.lam - lamp;
      lp.lam = aatan2(cosphi * sin(t), -sin(lp.phi));
      lp.phi = aasin(cosphi * cos(t));
    }
  }
}

pj_add(
  pj_ocea,
  'ocea',
  'Oblique Cylindrical Equal Area',
  'Cyl, Sph lonc= alpha= or\nlat_1= lat_2= lon_1= lon_2='
);

function pj_ocea(P) {
  var phi_0 = 0,
    phi_1,
    phi_2,
    lam_1,
    lam_2,
    lonz,
    alpha,
    rok,
    rtk,
    sinphi,
    cosphi,
    singam,
    cosgam;
  rok = 1 / P.k0;
  rtk = P.k0;
  /*If the keyword "alpha" is found in the sentence then use 1point+1azimuth*/
  if (pj_param(P.params, 'talpha')) {
    /*Define Pole of oblique transformation from 1 point & 1 azimuth*/
    alpha = pj_param(P.params, 'ralpha');
    lonz = pj_param(P.params, 'rlonc');
    /*Equation 9-8 page 80 (http://pubs.usgs.gov/pp/1395/report.pdf)*/
    singam = atan(-cos(alpha) / (-sin(phi_0) * sin(alpha))) + lonz;
    /*Equation 9-7 page 80 (http://pubs.usgs.gov/pp/1395/report.pdf)*/
    sinphi = asin(cos(phi_0) * sin(alpha));
    /*If the keyword "alpha" is NOT found in the sentence then use 2points*/
  } else {
    /*Define Pole of oblique transformation from 2 points*/
    phi_1 = pj_param(P.params, 'rlat_1');
    phi_2 = pj_param(P.params, 'rlat_2');
    lam_1 = pj_param(P.params, 'rlon_1');
    lam_2 = pj_param(P.params, 'rlon_2');
    /*Equation 9-1 page 80 (http://pubs.usgs.gov/pp/1395/report.pdf)*/
    singam = atan2(
      cos(phi_1) * sin(phi_2) * cos(lam_1) -
        sin(phi_1) * cos(phi_2) * cos(lam_2),
      sin(phi_1) * cos(phi_2) * sin(lam_2) -
        cos(phi_1) * sin(phi_2) * sin(lam_1)
    );

    /* take care of P->lam0 wrap-around when +lam_1=-90*/
    if (lam_1 == -M_HALFPI) singam = -singam;

    /*Equation 9-2 page 80 (http://pubs.usgs.gov/pp/1395/report.pdf)*/
    sinphi = atan(-cos(singam - lam_1) / tan(phi_1));
  }
  P.lam0 = singam + M_HALFPI;
  cosphi = cos(sinphi);
  sinphi = sin(sinphi);
  cosgam = cos(singam);
  singam = sin(singam);
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var t;
    xy.y = sin(lp.lam);
    t = cos(lp.lam);
    xy.x = atan((tan(lp.phi) * cosphi + sinphi * xy.y) / t);
    if (t < 0) xy.x += M_PI;
    xy.x *= rtk;
    xy.y = rok * (sinphi * sin(lp.phi) - cosphi * cos(lp.phi) * xy.y);
  }

  function s_inv(xy, lp) {
    var t, s;
    xy.y /= rok;
    xy.x /= rtk;
    t = sqrt(1 - xy.y * xy.y);
    lp.phi = asin(xy.y * sinphi + t * cosphi * (s = sin(xy.x)));
    lp.lam = atan2(t * sinphi * s - xy.y * cosphi, t * cos(xy.x));
  }
}

pj_add(
  pj_omerc,
  'omerc',
  'Oblique Mercator',
  'Cyl, Sph&Ell no_rot\n' +
    'alpha= [gamma=] [no_off] lonc= or\nlon_1= lat_1= lon_2= lat_2='
);

function pj_omerc(P) {
  var TOL = 1e-7;
  var con,
    com,
    cosph0,
    D,
    F,
    H,
    L,
    sinph0,
    p,
    J,
    gamma = 0,
    gamma0,
    lamc = 0,
    lam1 = 0,
    lam2 = 0,
    phi1 = 0,
    phi2 = 0,
    alpha_c = 0;
  var alp,
    gam,
    no_off = 0;
  var A, B, E, AB, ArB, BrA, rB, singam, cosgam, sinrot, cosrot;
  var v_pole_n, v_pole_s, u_0;
  var no_rot;

  no_rot = pj_param(P.params, 'tno_rot');
  if ((alp = pj_param(P.params, 'talpha')) != 0)
    alpha_c = pj_param(P.params, 'ralpha');
  if ((gam = pj_param(P.params, 'tgamma')) != 0)
    gamma = pj_param(P.params, 'rgamma');
  if (alp || gam) {
    lamc = pj_param(P.params, 'rlonc');
    no_off =
      /* For libproj4 compatibility ... for backward compatibility */
      pj_param(P.params, 'tno_off') || pj_param(P.params, 'tno_uoff');
    if (no_off) {
      /* Mark the parameter as used, so that the pj_get_def() return them */
      pj_param(P.params, 'sno_uoff');
      pj_param(P.params, 'sno_off');
    }
  } else {
    lam1 = pj_param(P.params, 'rlon_1');
    phi1 = pj_param(P.params, 'rlat_1');
    lam2 = pj_param(P.params, 'rlon_2');
    phi2 = pj_param(P.params, 'rlat_2');
    if (
      fabs(phi1 - phi2) <= TOL ||
      (con = fabs(phi1)) <= TOL ||
      fabs(con - M_HALFPI) <= TOL ||
      fabs(fabs(P.phi0) - M_HALFPI) <= TOL ||
      fabs(fabs(phi2) - M_HALFPI) <= TOL
    )
      e_error(-33);
  }
  com = sqrt(P.one_es);
  if (fabs(P.phi0) > EPS10) {
    sinph0 = sin(P.phi0);
    cosph0 = cos(P.phi0);
    con = 1 - P.es * sinph0 * sinph0;
    B = cosph0 * cosph0;
    B = sqrt(1 + (P.es * B * B) / P.one_es);
    A = (B * P.k0 * com) / con;
    D = (B * com) / (cosph0 * sqrt(con));
    if ((F = D * D - 1) <= 0) F = 0;
    else {
      F = sqrt(F);
      if (P.phi0 < 0) F = -F;
    }
    E = F += D;
    E *= pow(pj_tsfn(P.phi0, sinph0, P.e), B);
  } else {
    B = 1 / com;
    A = P.k0;
    E = D = F = 1;
  }
  if (alp || gam) {
    if (alp) {
      gamma0 = asin(sin(alpha_c) / D);
      if (!gam) gamma = alpha_c;
    } else alpha_c = asin(D * sin((gamma0 = gamma)));
    P.lam0 = lamc - asin(0.5 * (F - 1 / F) * tan(gamma0)) / B;
  } else {
    H = pow(pj_tsfn(phi1, sin(phi1), P.e), B);
    L = pow(pj_tsfn(phi2, sin(phi2), P.e), B);
    F = E / H;
    p = (L - H) / (L + H);
    J = E * E;
    J = (J - L * H) / (J + L * H);
    if ((con = lam1 - lam2) < -M_PI) lam2 -= M_TWOPI;
    else if (con > M_PI) lam2 += M_TWOPI;
    P.lam0 = adjlon(
      0.5 * (lam1 + lam2) - atan((J * tan(0.5 * B * (lam1 - lam2))) / p) / B
    );
    gamma0 = atan((2 * sin(B * adjlon(lam1 - P.lam0))) / (F - 1 / F));
    gamma = alpha_c = asin(D * sin(gamma0));
  }
  singam = sin(gamma0);
  cosgam = cos(gamma0);
  sinrot = sin(gamma);
  cosrot = cos(gamma);
  BrA = 1 / (ArB = A * (rB = 1 / B));
  AB = A * B;
  if (no_off) u_0 = 0;
  else {
    u_0 = fabs(ArB * atan(sqrt(D * D - 1) / cos(alpha_c)));
    if (P.phi0 < 0) u_0 = -u_0;
  }
  F = 0.5 * gamma0;
  v_pole_n = ArB * log(tan(M_FORTPI - F));
  v_pole_s = ArB * log(tan(M_FORTPI + F));

  P.fwd = e_fwd;
  P.inv = e_inv;

  function e_fwd(lp, xy) {
    var S, T, U, V, W, temp, u, v;

    if (fabs(fabs(lp.phi) - M_HALFPI) > EPS10) {
      W = E / pow(pj_tsfn(lp.phi, sin(lp.phi), P.e), B);
      temp = 1 / W;
      S = 0.5 * (W - temp);
      T = 0.5 * (W + temp);
      V = sin(B * lp.lam);
      U = (S * singam - V * cosgam) / T;
      if (fabs(fabs(U) - 1.0) < EPS10) f_error();
      v = 0.5 * ArB * log((1 - U) / (1 + U));
      temp = cos(B * lp.lam);
      if (fabs(temp) < TOL) {
        u = A * lp.lam;
      } else {
        u = ArB * atan2(S * cosgam + V * singam, temp);
      }
    } else {
      v = lp.phi > 0 ? v_pole_n : v_pole_s;
      u = ArB * lp.phi;
    }
    if (no_rot) {
      xy.x = u;
      xy.y = v;
    } else {
      u -= u_0;
      xy.x = v * cosrot + u * sinrot;
      xy.y = u * cosrot - v * sinrot;
    }
  }

  function e_inv(xy, lp) {
    var u, v, Qp, Sp, Tp, Vp, Up;
    if (no_rot) {
      v = xy.y;
      u = xy.x;
    } else {
      v = xy.x * cosrot - xy.y * sinrot;
      u = xy.y * cosrot + xy.x * sinrot + u_0;
    }
    Qp = exp(-BrA * v);
    Sp = 0.5 * (Qp - 1 / Qp);
    Tp = 0.5 * (Qp + 1 / Qp);
    Vp = sin(BrA * u);
    Up = (Vp * cosgam + Sp * singam) / Tp;
    if (fabs(fabs(Up) - 1) < EPS10) {
      lp.lam = 0;
      lp.phi = Up < 0 ? -M_HALFPI : M_HALFPI;
    } else {
      lp.phi = E / sqrt((1 + Up) / (1 - Up));
      if ((lp.phi = pj_phi2(pow(lp.phi, 1 / B), P.e)) == HUGE_VAL) i_error();
      lp.lam = -rB * atan2(Sp * cosgam - Vp * singam, cos(BrA * u));
    }
  }
}

pj_add(pj_ortho, 'ortho', 'Orthographic', 'Azi, Sph.');

function pj_ortho(P) {
  var EPS10 = 1e-10,
    N_POLE = 0,
    S_POLE = 1,
    EQUIT = 2,
    OBLIQ = 3;
  var Q = {};

  if (fabs(fabs(P.phi0) - M_HALFPI) <= EPS10)
    Q.mode = P.phi0 < 0 ? S_POLE : N_POLE;
  else if (fabs(P.phi0) > EPS10) {
    Q.mode = OBLIQ;
    Q.sinph0 = sin(P.phi0);
    Q.cosph0 = cos(P.phi0);
  } else Q.mode = EQUIT;

  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    var coslam, cosphi, sinphi;
    cosphi = cos(lp.phi);
    coslam = cos(lp.lam);
    switch (Q.mode) {
      case EQUIT:
        if (cosphi * coslam < -EPS10) f_error();
        xy.y = sin(lp.phi);
        break;
      case OBLIQ:
        if (
          Q.sinph0 * (sinphi = sin(lp.phi)) + Q.cosph0 * cosphi * coslam <
          -EPS10
        )
          f_error();
        xy.y = Q.cosph0 * sinphi - Q.sinph0 * cosphi * coslam;
        break;
      case N_POLE:
        coslam = -coslam;
      /* falls through */
      case S_POLE:
        if (fabs(lp.phi - P.phi0) - EPS10 > M_HALFPI) f_error();
        xy.y = cosphi * coslam;
        break;
    }
    xy.x = cosphi * sin(lp.lam);
  }

  function s_inv(xy, lp) {
    var rh, cosc, sinc;

    if ((sinc = rh = hypot(xy.x, xy.y)) > 1) {
      if (sinc - 1 > EPS10) i_error();
      sinc = 1;
    }
    cosc = sqrt(1 - sinc * sinc); /* in this range OK */
    if (fabs(rh) <= EPS10) {
      lp.phi = P.phi0;
      lp.lam = 0.0;
    } else {
      switch (Q.mode) {
        case N_POLE:
          xy.y = -xy.y;
          lp.phi = acos(sinc);
          break;
        case S_POLE:
          lp.phi = -acos(sinc);
          break;
        case EQUIT:
        case OBLIQ:
          if (Q.mode == EQUIT) {
            lp.phi = (xy.y * sinc) / rh;
            xy.x *= sinc;
            xy.y = cosc * rh;
          } else {
            lp.phi = cosc * Q.sinph0 + (xy.y * sinc * Q.cosph0) / rh;
            xy.y = (cosc - Q.sinph0 * lp.phi) * rh;
            xy.x *= sinc * Q.cosph0;
          }
          if (fabs(lp.phi) >= 1) lp.phi = lp.phi < 0 ? -M_HALFPI : M_HALFPI;
          else lp.phi = asin(lp.phi);
          break;
      }
      lp.lam =
        xy.y == 0 && (Q.mode == OBLIQ || Q.mode == EQUIT)
          ? xy.x == 0
            ? 0
            : xy.x < 0
            ? -M_HALFPI
            : M_HALFPI
          : atan2(xy.x, xy.y);
    }
  }
}

pj_add(pj_patterson, 'patterson', 'Patterson Cylindrical', 'Cyl., Sph.');

function pj_patterson(P) {
  var K1 = 1.0148,
    K2 = 0.23185,
    K3 = -0.14499,
    K4 = 0.02406,
    C1 = K1,
    C2 = 5.0 * K2,
    C3 = 7.0 * K3,
    C4 = 9.0 * K4,
    EPS = 1e-11,
    MAX_Y = 908571831.7;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var phi2 = lp.phi * lp.phi;
    xy.x = lp.lam;
    xy.y = lp.phi * (K1 + phi2 * phi2 * (K2 + phi2 * (K3 + K4 * phi2)));
  }

  function s_inv(xy, lp) {
    var MAX_ITER = 100;
    var yc, tol, y2, f, fder;
    var i;

    yc = xy.y;

    /* make sure y is inside valid range */
    if (xy.y > MAX_Y) {
      xy.y = MAX_Y;
    } else if (xy.y < -MAX_Y) {
      xy.y = -MAX_Y;
    }

    for (i = MAX_ITER; i; --i) {
      /* Newton-Raphson */
      y2 = yc * yc;
      f = yc * (K1 + y2 * y2 * (K2 + y2 * (K3 + K4 * y2))) - xy.y;
      fder = C1 + y2 * y2 * (C2 + y2 * (C3 + C4 * y2));
      yc -= tol = f / fder;
      if (fabs(tol) < EPS) {
        break;
      }
    }
    // other projections don't error if non-convergent
    // if (i === 0) error(PJD_ERR_NON_CONVERGENT);
    lp.phi = yc;

    /* longitude */
    lp.lam = xy.x;
  }
}

pj_add(pj_poly, 'poly', 'Polyconic (American)', 'Conic, Sph&Ell');

function pj_poly(P) {
  var TOL = 1e-10,
    CONV = 1e-10,
    N_ITER = 10,
    I_ITER = 20,
    ITOL = 1e-12,
    ml0,
    en;

  if (P.es) {
    en = pj_enfn(P.es);
    ml0 = pj_mlfn(P.phi0, sin(P.phi0), cos(P.phi0), en);
    P.fwd = e_fwd;
    P.inv = e_inv;
  } else {
    ml0 = -P.phi0;
    P.fwd = s_fwd;
    P.inv = s_inv;
  }

  function e_fwd(lp, xy) {
    var ms, sp, cp;

    if (fabs(lp.phi) <= TOL) {
      xy.x = lp.lam;
      xy.y = -ml0;
    } else {
      sp = sin(lp.phi);
      ms = fabs((cp = cos(lp.phi))) > TOL ? pj_msfn(sp, cp, P.es) / sp : 0;
      xy.x = ms * sin((lp.lam *= sp));
      xy.y = pj_mlfn(lp.phi, sp, cp, en) - ml0 + ms * (1 - cos(lp.lam));
    }
  }

  function e_inv(xy, lp) {
    var x = xy.x,
      y = xy.y;
    var r, c, sp, cp, s2ph, ml, mlb, mlp, dPhi, i;
    y += ml0;
    if (fabs(y) <= TOL) {
      lp.lam = x;
      lp.phi = 0;
    } else {
      r = y * y + x * x;
      for (lp.phi = y, i = I_ITER; i > 0; --i) {
        sp = sin(lp.phi);
        s2ph = sp * (cp = cos(lp.phi));
        if (fabs(cp) < ITOL) i_error();
        c = (sp * (mlp = sqrt(1 - P.es * sp * sp))) / cp;
        ml = pj_mlfn(lp.phi, sp, cp, en);
        mlb = ml * ml + r;
        mlp = P.one_es / (mlp * mlp * mlp);
        lp.phi += dPhi =
          (ml + ml + c * mlb - 2 * y * (c * ml + 1)) /
          ((P.es * s2ph * (mlb - 2 * y * ml)) / c +
            2 * (y - ml) * (c * mlp - 1 / s2ph) -
            mlp -
            mlp);
        if (fabs(dPhi) <= ITOL) break;
      }
      if (!i) {
        i_error();
      }
      c = sin(lp.phi);
      lp.lam = asin(x * tan(lp.phi) * sqrt(1 - P.es * c * c)) / sin(lp.phi);
    }
  }

  function s_fwd(lp, xy) {
    var cot, E;
    if (fabs(lp.phi) <= TOL) {
      xy.x = lp.lam;
      xy.y = ml0;
    } else {
      cot = 1 / tan(lp.phi);
      xy.x = sin((E = lp.lam * sin(lp.phi))) * cot;
      xy.y = lp.phi - P.phi0 + cot * (1 - cos(E));
    }
  }

  function s_inv(xy, lp) {
    var B, dphi, tp, i;
    if (fabs((xy.y = P.phi0 + xy.y)) <= TOL) {
      lp.lam = xy.x;
      lp.phi = 0;
    } else {
      lp.phi = xy.y;
      B = xy.x * xy.x + xy.y * xy.y;
      i = N_ITER;
      do {
        tp = tan(lp.phi);
        lp.phi -= dphi =
          (xy.y * (lp.phi * tp + 1) -
            lp.phi -
            0.5 * (lp.phi * lp.phi + B) * tp) /
          ((lp.phi - xy.y) / tp - 1);
      } while (fabs(dphi) > CONV && --i);
      if (!i) i_error();
      lp.lam = asin(xy.x * tan(lp.phi)) / sin(lp.phi);
    }
  }
}

pj_add(pj_putp2, 'putp2', 'Putnins P2', 'PCyl., Sph.');

function pj_putp2(P) {
  var C_x = 1.8949,
    C_y = 1.71848,
    C_p = 0.6141848493043784,
    EPS = 1e-10,
    NITER = 10,
    PI_DIV_3 = 1.0471975511965977;
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var p, c, s, V, i;
    p = C_p * sin(lp.phi);
    s = lp.phi * lp.phi;
    lp.phi *= 0.615709 + s * (0.00909953 + s * 0.0046292);
    for (i = NITER; i; --i) {
      c = cos(lp.phi);
      s = sin(lp.phi);
      lp.phi -= V = (lp.phi + s * (c - 1) - p) / (1 + c * (c - 1) - s * s);
      if (fabs(V) < EPS) break;
    }
    if (!i) lp.phi = lp.phi < 0 ? -PI_DIV_3 : PI_DIV_3;
    xy.x = C_x * lp.lam * (cos(lp.phi) - 0.5);
    xy.y = C_y * sin(lp.phi);
  }

  function s_inv(xy, lp) {
    var c;
    lp.phi = aasin(xy.y / C_y);
    lp.lam = xy.x / (C_x * ((c = cos(lp.phi)) - 0.5));
    lp.phi = aasin((lp.phi + sin(lp.phi) * (c - 1)) / C_p);
  }
}

pj_add(pj_putp3, 'putp3', 'Putnins P3', 'PCyl., Sph.');
pj_add(pj_putp3p, 'putp3p', "Putnins P3'", 'PCyl., Sph.');

function pj_putp3p(P) {
  pj_putp3(P, true);
}

function pj_putp3(P, prime) {
  var C = 0.79788456,
    RPISQ = 0.1013211836,
    A = (prime ? 2 : 4) * RPISQ;
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = C * lp.lam * (1 - A * lp.phi * lp.phi);
    xy.y = C * lp.phi;
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y / C;
    lp.lam = xy.x / (C * (1 - A * lp.phi * lp.phi));
  }
}

pj_add(pj_putp4p, 'putp4p', "Putnins P4'", 'PCyl., Sph.');
pj_add(pj_weren, 'weren', 'Werenskiold I', 'PCyl., Sph.');

function pj_putp4p(P) {
  pj_putp4p_init(P, 0.874038744, 3.883251825);
}

function pj_weren(P) {
  pj_putp4p_init(P, 1, 4.442882938);
}

function pj_putp4p_init(P, C_x, C_y) {
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    lp.phi = aasin(0.883883476 * sin(lp.phi));
    xy.x = C_x * lp.lam * cos(lp.phi);
    xy.x /= cos((lp.phi *= 0.333333333333333));
    xy.y = C_y * sin(lp.phi);
  }

  function s_inv(xy, lp) {
    lp.phi = aasin(xy.y / C_y);
    lp.lam = (xy.x * cos(lp.phi)) / C_x;
    lp.phi *= 3;
    lp.lam /= cos(lp.phi);
    lp.phi = aasin(1.13137085 * sin(lp.phi));
  }
}

pj_add(pj_putp5, 'putp5', 'Putnins P5', 'PCyl., Sph.');
pj_add(pj_putp5p, 'putp5p', "Putnins P5'", 'PCyl., Sph.');

function pj_putp5p(P) {
  pj_putp5(P, true);
}

function pj_putp5(P, prime) {
  var A = prime ? 1.5 : 2,
    B = prime ? 0.5 : 1,
    C = 1.01346,
    D = 1.2158542;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = C * lp.lam * (A - B * sqrt(1 + D * lp.phi * lp.phi));
    xy.y = C * lp.phi;
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y / C;
    lp.lam = xy.x / (C * (A - B * sqrt(1 + D * lp.phi * lp.phi)));
  }
}

pj_add(pj_putp6, 'putp6', 'Putnins P6', 'PCyl., Sph.');
pj_add(pj_putp6p, 'putp6p', "Putnins P6'", 'PCyl., Sph.');

function pj_putp6p(P) {
  pj_putp6(P, true);
}

function pj_putp6(P, prime) {
  var EPS = 1e-10,
    NITER = 10,
    CON_POLE = 1.732050807568877,
    A,
    B,
    C_x,
    C_y,
    D;

  if (prime) {
    C_x = 0.44329;
    C_y = 0.80404;
    A = 6;
    B = 5.61125;
    D = 3;
  } else {
    C_x = 1.01346;
    C_y = 0.9191;
    A = 4;
    B = 2.1471437182129378784;
    D = 2;
  }

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var p, r, V, i;
    p = B * sin(lp.phi);
    lp.phi *= 1.10265779;
    for (i = NITER; i; --i) {
      r = sqrt(1 + lp.phi * lp.phi);
      lp.phi -= V = ((A - r) * lp.phi - log(lp.phi + r) - p) / (A - 2 * r);
      if (fabs(V) < EPS) break;
    }
    if (!i) lp.phi = p < 0 ? -CON_POLE : CON_POLE;
    xy.x = C_x * lp.lam * (D - sqrt(1 + lp.phi * lp.phi));
    xy.y = C_y * lp.phi;
  }

  function s_inv(xy, lp) {
    var r;
    lp.phi = xy.y / C_y;
    r = sqrt(1 + lp.phi * lp.phi);
    lp.lam = xy.x / (C_x * (D - r));
    lp.phi = aasin(((A - r) * lp.phi - log(lp.phi + r)) / B);
  }
}

pj_add(pj_qsc, 'qsc', 'Quadrilateralized Spherical Cube', 'Azi, Sph.');

function pj_qsc(P) {
  var EPS10 = 1e-10;

  /* The six cube faces. */
  var FACE_FRONT = 0;
  var FACE_RIGHT = 1;
  var FACE_BACK = 2;
  var FACE_LEFT = 3;
  var FACE_TOP = 4;
  var FACE_BOTTOM = 5;

  /* The four areas on a cube face. AREA_0 is the area of definition,
   * the other three areas are counted counterclockwise. */
  var AREA_0 = 0;
  var AREA_1 = 1;
  var AREA_2 = 2;
  var AREA_3 = 3;
  var face;
  var a_squared;
  var b;
  var one_minus_f;
  var one_minus_f_squared;

  /* Determine the cube face from the center of projection. */
  if (P.phi0 >= M_HALFPI - M_FORTPI / 2.0) {
    face = FACE_TOP;
  } else if (P.phi0 <= -(M_HALFPI - M_FORTPI / 2.0)) {
    face = FACE_BOTTOM;
  } else if (fabs(P.lam0) <= M_FORTPI) {
    face = FACE_FRONT;
  } else if (fabs(P.lam0) <= M_HALFPI + M_FORTPI) {
    face = P.lam0 > 0.0 ? FACE_RIGHT : FACE_LEFT;
  } else {
    face = FACE_BACK;
  }
  /* Fill in useful values for the ellipsoid <-> sphere shift
   * described in [LK12]. */
  if (P.es !== 0.0) {
    a_squared = P.a * P.a;
    b = P.a * sqrt(1.0 - P.es);
    one_minus_f = 1.0 - (P.a - b) / P.a;
    one_minus_f_squared = one_minus_f * one_minus_f;
  }

  P.fwd = e_fwd;
  P.inv = e_inv;

  function e_fwd(lp, xy) {
    var lat, lon;
    var theta, phi;
    var t, mu; /* nu; */
    var area;
    var q, r, s;
    var sinlat, coslat;
    var sinlon, coslon;
    var tmp;

    /* Convert the geodetic latitude to a geocentric latitude.
     * This corresponds to the shift from the ellipsoid to the sphere
     * described in [LK12]. */
    if (P.es !== 0.0) {
      lat = atan(one_minus_f_squared * tan(lp.phi));
    } else {
      lat = lp.phi;
    }

    /* Convert the input lat, lon into theta, phi as used by QSC.
     * This depends on the cube face and the area on it.
     * For the top and bottom face, we can compute theta and phi
     * directly from phi, lam. For the other faces, we must use
     * unit sphere cartesian coordinates as an intermediate step. */
    lon = lp.lam;
    if (face == FACE_TOP) {
      phi = M_HALFPI - lat;
      if (lon >= M_FORTPI && lon <= M_HALFPI + M_FORTPI) {
        area = AREA_0;
        theta = lon - M_HALFPI;
      } else if (lon > M_HALFPI + M_FORTPI || lon <= -(M_HALFPI + M_FORTPI)) {
        area = AREA_1;
        theta = lon > 0.0 ? lon - M_PI : lon + M_PI;
      } else if (lon > -(M_HALFPI + M_FORTPI) && lon <= -M_FORTPI) {
        area = AREA_2;
        theta = lon + M_HALFPI;
      } else {
        area = AREA_3;
        theta = lon;
      }
    } else if (face == FACE_BOTTOM) {
      phi = M_HALFPI + lat;
      if (lon >= M_FORTPI && lon <= M_HALFPI + M_FORTPI) {
        area = AREA_0;
        theta = -lon + M_HALFPI;
      } else if (lon < M_FORTPI && lon >= -M_FORTPI) {
        area = AREA_1;
        theta = -lon;
      } else if (lon < -M_FORTPI && lon >= -(M_HALFPI + M_FORTPI)) {
        area = AREA_2;
        theta = -lon - M_HALFPI;
      } else {
        area = AREA_3;
        theta = lon > 0.0 ? -lon + M_PI : -lon - M_PI;
      }
    } else {
      if (face == FACE_RIGHT) {
        lon = qsc_shift_lon_origin(lon, +M_HALFPI);
      } else if (face == FACE_BACK) {
        lon = qsc_shift_lon_origin(lon, +M_PI);
      } else if (face == FACE_LEFT) {
        lon = qsc_shift_lon_origin(lon, -M_HALFPI);
      }
      sinlat = sin(lat);
      coslat = cos(lat);
      sinlon = sin(lon);
      coslon = cos(lon);
      q = coslat * coslon;
      r = coslat * sinlon;
      s = sinlat;

      if (face == FACE_FRONT) {
        phi = acos(q);
        tmp = qsc_fwd_equat_face_theta(phi, s, r);
      } else if (face == FACE_RIGHT) {
        phi = acos(r);
        tmp = qsc_fwd_equat_face_theta(phi, s, -q);
      } else if (face == FACE_BACK) {
        phi = acos(-q);
        tmp = qsc_fwd_equat_face_theta(phi, s, -r);
      } else if (face == FACE_LEFT) {
        phi = acos(-r);
        tmp = qsc_fwd_equat_face_theta(phi, s, q);
      } else {
        /* Impossible */
        phi = 0.0;
        tmp = {
          area: AREA_0,
          theta: 0
        };
      }
      theta = tmp.theta;
      area = tmp.area;
    }

    /* Compute mu and nu for the area of definition.
     * For mu, see Eq. (3-21) in [OL76], but note the typos:
     * compare with Eq. (3-14). For nu, see Eq. (3-38). */
    mu = atan(
      (12.0 / M_PI) * (theta + acos(sin(theta) * cos(M_FORTPI)) - M_HALFPI)
    );
    t = sqrt(
      (1.0 - cos(phi)) /
        (cos(mu) * cos(mu)) /
        (1.0 - cos(atan(1.0 / cos(theta))))
    );
    /* nu = atan(t);        We don't really need nu, just t, see below. */

    /* Apply the result to the real area. */
    if (area == AREA_1) {
      mu += M_HALFPI;
    } else if (area == AREA_2) {
      mu += M_PI;
    } else if (area == AREA_3) {
      mu += M_PI_HALFPI;
    }

    /* Now compute x, y from mu and nu */
    /* t = tan(nu); */
    xy.x = t * cos(mu);
    xy.y = t * sin(mu);
  }

  function e_inv(xy, lp) {
    var mu, nu, cosmu, tannu;
    var tantheta, theta, cosphi, phi;
    var t;
    var area;

    /* Convert the input x, y to the mu and nu angles as used by QSC.
     * This depends on the area of the cube face. */
    nu = atan(sqrt(xy.x * xy.x + xy.y * xy.y));
    mu = atan2(xy.y, xy.x);
    if (xy.x >= 0.0 && xy.x >= fabs(xy.y)) {
      area = AREA_0;
    } else if (xy.y >= 0.0 && xy.y >= fabs(xy.x)) {
      area = AREA_1;
      mu -= M_HALFPI;
    } else if (xy.x < 0.0 && -xy.x >= fabs(xy.y)) {
      area = AREA_2;
      mu = mu < 0.0 ? mu + M_PI : mu - M_PI;
    } else {
      area = AREA_3;
      mu += M_HALFPI;
    }

    /* Compute phi and theta for the area of definition.
     * The inverse projection is not described in the original paper, but some
     * good hints can be found here (as of 2011-12-14):
     * http://fits.gsfc.nasa.gov/fitsbits/saf.93/saf.9302
     * (search for "Message-Id: <9302181759.AA25477 at fits.cv.nrao.edu>") */
    t = (M_PI / 12.0) * tan(mu);
    tantheta = sin(t) / (cos(t) - 1.0 / sqrt(2.0));
    theta = atan(tantheta);
    cosmu = cos(mu);
    tannu = tan(nu);
    cosphi =
      1.0 - cosmu * cosmu * tannu * tannu * (1.0 - cos(atan(1.0 / cos(theta))));
    if (cosphi < -1.0) {
      cosphi = -1.0;
    } else if (cosphi > +1.0) {
      cosphi = +1.0;
    }

    /* Apply the result to the real area on the cube face.
     * For the top and bottom face, we can compute phi and lam directly.
     * For the other faces, we must use unit sphere cartesian coordinates
     * as an intermediate step. */
    if (face == FACE_TOP) {
      phi = acos(cosphi);
      lp.phi = M_HALFPI - phi;
      if (area == AREA_0) {
        lp.lam = theta + M_HALFPI;
      } else if (area == AREA_1) {
        lp.lam = theta < 0.0 ? theta + M_PI : theta - M_PI;
      } else if (area == AREA_2) {
        lp.lam = theta - M_HALFPI;
      } /* area == AREA_3 */ else {
        lp.lam = theta;
      }
    } else if (face == FACE_BOTTOM) {
      phi = acos(cosphi);
      lp.phi = phi - M_HALFPI;
      if (area == AREA_0) {
        lp.lam = -theta + M_HALFPI;
      } else if (area == AREA_1) {
        lp.lam = -theta;
      } else if (area == AREA_2) {
        lp.lam = -theta - M_HALFPI;
      } /* area == AREA_3 */ else {
        lp.lam = theta < 0.0 ? -theta - M_PI : -theta + M_PI;
      }
    } else {
      /* Compute phi and lam via cartesian unit sphere coordinates. */
      var q, r, s;
      q = cosphi;
      t = q * q;
      if (t >= 1.0) {
        s = 0.0;
      } else {
        s = sqrt(1.0 - t) * sin(theta);
      }
      t += s * s;
      if (t >= 1.0) {
        r = 0.0;
      } else {
        r = sqrt(1.0 - t);
      }
      /* Rotate q,r,s into the correct area. */
      if (area == AREA_1) {
        t = r;
        r = -s;
        s = t;
      } else if (area == AREA_2) {
        r = -r;
        s = -s;
      } else if (area == AREA_3) {
        t = r;
        r = s;
        s = -t;
      }
      /* Rotate q,r,s into the correct cube face. */
      if (face == FACE_RIGHT) {
        t = q;
        q = -r;
        r = t;
      } else if (face == FACE_BACK) {
        q = -q;
        r = -r;
      } else if (face == FACE_LEFT) {
        t = q;
        q = r;
        r = -t;
      }
      /* Now compute phi and lam from the unit sphere coordinates. */
      lp.phi = acos(-s) - M_HALFPI;
      lp.lam = atan2(r, q);
      if (face == FACE_RIGHT) {
        lp.lam = qsc_shift_lon_origin(lp.lam, -M_HALFPI);
      } else if (face == FACE_BACK) {
        lp.lam = qsc_shift_lon_origin(lp.lam, -M_PI);
      } else if (face == FACE_LEFT) {
        lp.lam = qsc_shift_lon_origin(lp.lam, +M_HALFPI);
      }
    }

    /* Apply the shift from the sphere to the ellipsoid as described
     * in [LK12]. */
    if (P.es !== 0) {
      var invert_sign;
      var tanphi, xa;
      invert_sign = lp.phi < 0.0 ? 1 : 0;
      tanphi = tan(lp.phi);
      xa = b / sqrt(tanphi * tanphi + one_minus_f_squared);
      lp.phi = atan(sqrt(P.a * P.a - xa * xa) / (one_minus_f * xa));
      if (invert_sign) {
        lp.phi = -lp.phi;
      }
    }
  }

  /* Helper function for forward projection: compute the theta angle
   * and determine the area number. */
  function qsc_fwd_equat_face_theta(phi, y, x) {
    var area, theta;
    if (phi < EPS10) {
      area = AREA_0;
      theta = 0.0;
    } else {
      theta = atan2(y, x);
      if (fabs(theta) <= M_FORTPI) {
        area = AREA_0;
      } else if (theta > M_FORTPI && theta <= M_HALFPI + M_FORTPI) {
        area = AREA_1;
        theta -= M_HALFPI;
      } else if (
        theta > M_HALFPI + M_FORTPI ||
        theta <= -(M_HALFPI + M_FORTPI)
      ) {
        area = AREA_2;
        theta = theta >= 0.0 ? theta - M_PI : theta + M_PI;
      } else {
        area = AREA_3;
        theta += M_HALFPI;
      }
    }
    return {
      area: area,
      theta: theta
    };
  }

  /* Helper function: shift the longitude. */
  function qsc_shift_lon_origin(lon, offset) {
    var slon = lon + offset;
    if (slon < -M_PI) {
      slon += M_TWOPI;
    } else if (slon > +M_PI) {
      slon -= M_TWOPI;
    }
    return slon;
  }
}

pj_add(pj_robin, 'robin', 'Robinson', 'PCyl., Sph.');

function pj_robin(P) {
  var X = to_float([
    [1, 2.2199e-17, -7.15515e-5, 3.1103e-6],
    [0.9986, -0.000482243, -2.4897e-5, -1.3309e-6],
    [0.9954, -0.00083103, -4.48605e-5, -9.86701e-7],
    [0.99, -0.00135364, -5.9661e-5, 3.6777e-6],
    [0.9822, -0.00167442, -4.49547e-6, -5.72411e-6],
    [0.973, -0.00214868, -9.03571e-5, 1.8736e-8],
    [0.96, -0.00305085, -9.00761e-5, 1.64917e-6],
    [0.9427, -0.00382792, -6.53386e-5, -2.6154e-6],
    [0.9216, -0.00467746, -0.00010457, 4.81243e-6],
    [0.8962, -0.00536223, -3.23831e-5, -5.43432e-6],
    [0.8679, -0.00609363, -0.000113898, 3.32484e-6],
    [0.835, -0.00698325, -6.40253e-5, 9.34959e-7],
    [0.7986, -0.00755338, -5.00009e-5, 9.35324e-7],
    [0.7597, -0.00798324, -3.5971e-5, -2.27626e-6],
    [0.7186, -0.00851367, -7.01149e-5, -8.6303e-6],
    [0.6732, -0.00986209, -0.000199569, 1.91974e-5],
    [0.6213, -0.010418, 8.83923e-5, 6.24051e-6],
    [0.5722, -0.00906601, 0.000182, 6.24051e-6],
    [0.5322, -0.00677797, 0.000275608, 6.24051e-6]
  ]);

  var Y = to_float([
    [-5.20417e-18, 0.0124, 1.21431e-18, -8.45284e-11],
    [0.062, 0.0124, -1.26793e-9, 4.22642e-10],
    [0.124, 0.0124, 5.07171e-9, -1.60604e-9],
    [0.186, 0.0123999, -1.90189e-8, 6.00152e-9],
    [0.248, 0.0124002, 7.10039e-8, -2.24e-8],
    [0.31, 0.0123992, -2.64997e-7, 8.35986e-8],
    [0.372, 0.0124029, 9.88983e-7, -3.11994e-7],
    [0.434, 0.0123893, -3.69093e-6, -4.35621e-7],
    [0.4958, 0.0123198, -1.02252e-5, -3.45523e-7],
    [0.5571, 0.0121916, -1.54081e-5, -5.82288e-7],
    [0.6176, 0.0119938, -2.41424e-5, -5.25327e-7],
    [0.6769, 0.011713, -3.20223e-5, -5.16405e-7],
    [0.7346, 0.0113541, -3.97684e-5, -6.09052e-7],
    [0.7903, 0.0109107, -4.89042e-5, -1.04739e-6],
    [0.8435, 0.0103431, -6.4615e-5, -1.40374e-9],
    [0.8936, 0.00969686, -6.4636e-5, -8.547e-6],
    [0.9394, 0.00840947, -0.000192841, -4.2106e-6],
    [0.9761, 0.00616527, -0.000256, -4.2106e-6],
    [1, 0.00328947, -0.000319159, -4.2106e-6]
  ]);

  var FXC = 0.8487,
    FYC = 1.3523,
    C1 = 11.45915590261646417544,
    RC1 = 0.08726646259971647884,
    NODES = 18,
    ONEEPS = 1.000001,
    EPS = 1e-8;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var i, dphi;
    i = floor((dphi = fabs(lp.phi)) * C1);
    if (i < 0) f_error();
    if (i >= NODES) i = NODES - 1;
    dphi = RAD_TO_DEG * (dphi - RC1 * i);
    xy.x = V(X[i], dphi) * FXC * lp.lam;
    xy.y = V(Y[i], dphi) * FYC;
    if (lp.phi < 0) xy.y = -xy.y;
  }

  function s_inv(xy, lp) {
    var t, t1, T, i;
    lp.lam = xy.x / FXC;
    lp.phi = fabs(xy.y / FYC);
    if (lp.phi >= 1) {
      /* simple pathologic cases */
      if (lp.phi > ONEEPS) i_error();
      else {
        lp.phi = xy.y < 0 ? -M_HALFPI : M_HALFPI;
        lp.lam /= X[NODES][0];
      }
    } else {
      /* general problem */
      /* in Y space, reduce to table interval */
      i = floor(lp.phi * NODES);
      if (i < 0 || i >= NODES) {
        return i_error();
      }
      for (;;) {
        if (Y[i][0] > lp.phi) --i;
        else if (Y[i + 1][0] <= lp.phi) ++i;
        else break;
      }
      T = new Float32Array(Y[i]); // copy row to avoid mutating constants
      /* first guess, linear interp */
      t = (5 * (lp.phi - T[0])) / (Y[i + 1][0] - T[0]);
      /* make into root */
      T[0] -= lp.phi;
      for (;;) {
        /* Newton-Raphson reduction */
        t -= t1 = V(T, t) / DV(T, t);
        if (fabs(t1) < EPS) break;
      }
      lp.phi = (5 * i + t) * DEG_TO_RAD;
      if (xy.y < 0) lp.phi = -lp.phi;
      lp.lam /= V(X[i], t);
    }
  }

  function V(C, z) {
    return C[0] + z * (C[1] + z * (C[2] + z * C[3]));
  }

  function DV(C, z) {
    return C[1] + z * (C[2] + C[2] + z * 3 * C[3]);
  }

  // convert constants to single-precision floats, for compatibility with
  // Proj.4 tests (PJ_robin.c uses floats instead of doubles)
  function to_float(rows) {
    return rows.map(function (row) {
      return new Float32Array(row);
    });
  }
}

pj_add(
  pj_get_sconic('EULER'),
  'euler',
  'Euler',
  'Conic, Sph\nlat_1= and lat_2='
);
pj_add(
  pj_get_sconic('MURD1'),
  'murd1',
  'Murdoch I',
  'Conic, Sph\nlat_1= and lat_2='
);
pj_add(
  pj_get_sconic('MURD2'),
  'murd2',
  'Murdoch II',
  'Conic, Sph\nlat_1= and lat_2='
);
pj_add(
  pj_get_sconic('MURD3'),
  'murd3',
  'Murdoch III',
  'Conic, Sph\nlat_1= and lat_2='
);
pj_add(
  pj_get_sconic('PCONIC'),
  'pconic',
  'Perspective Conic',
  'Conic, Sph\nlat_1= and lat_2='
);
pj_add(
  pj_get_sconic('TISSOT'),
  'tissot',
  'Tissot',
  'Conic, Sph\nlat_1= and lat_2='
);
pj_add(
  pj_get_sconic('VITK1'),
  'vitk1',
  'Vitkovsky I',
  'Conic, Sph\nlat_1= and lat_2='
);

function pj_get_sconic(type) {
  return function (P) {
    pj_sconic(P, type);
  };
}

function pj_sconic(P, type) {
  var del, cs;
  var p1, p2;
  var n;
  var rho_c;
  var rho_0;
  var sig;
  var c1, c2;
  var EPS = 1e-10;

  if (!pj_param(P.params, 'tlat_1') || !pj_param(P.params, 'tlat_2')) {
    e_error(-41);
  } else {
    p1 = pj_param(P.params, 'rlat_1');
    p2 = pj_param(P.params, 'rlat_2');
    del = 0.5 * (p2 - p1);
    sig = 0.5 * (p2 + p1);
    if (fabs(del) < EPS || fabs(sig) < EPS) {
      e_error(-42);
    }
  }

  switch (type) {
    case 'TISSOT':
      n = sin(sig);
      cs = cos(del);
      rho_c = n / cs + cs / n;
      rho_0 = sqrt((rho_c - 2 * sin(P.phi0)) / n);
      break;

    case 'MURD1':
      rho_c = sin(del) / (del * tan(sig)) + sig;
      rho_0 = rho_c - P.phi0;
      n = sin(sig);
      break;

    case 'MURD2':
      rho_c = (cs = sqrt(cos(del))) / tan(sig);
      rho_0 = rho_c + tan(sig - P.phi0);
      n = sin(sig) * cs;
      break;

    case 'MURD3':
      rho_c = del / (tan(sig) * tan(del)) + sig;
      rho_0 = rho_c - P.phi0;
      n = (sin(sig) * sin(del) * tan(del)) / (del * del);
      break;

    case 'EULER':
      n = (sin(sig) * sin(del)) / del;
      del *= 0.5;
      rho_c = del / (tan(del) * tan(sig)) + sig;
      rho_0 = rho_c - P.phi0;
      break;

    case 'PCONIC':
      n = sin(sig);
      c2 = cos(del);
      c1 = 1 / tan(sig);
      if (fabs((del = P.phi0 - sig)) - EPS >= M_HALFPI) e_error(-43);
      rho_0 = c2 * (c1 - tan(del));
      break;

    case 'VITK1':
      n = ((cs = tan(del)) * sin(sig)) / del;
      rho_c = del / (cs * tan(sig)) + sig;
      rho_0 = rho_c - P.phi0;
      break;
  }

  P.inv = s_inv;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var rho;

    switch (type) {
      case 'MURD2':
        rho = rho_c + tan(sig - lp.phi);
        break;
      case 'PCONIC':
        rho = c2 * (c1 - tan(lp.phi - sig));
        break;
      default:
        rho = rho_c - lp.phi;
        break;
    }
    xy.x = rho * sin((lp.lam *= n));
    xy.y = rho_0 - rho * cos(lp.lam);
  }

  function s_inv(xy, lp) {
    var rho;

    rho = hypot(xy.x, (xy.y = rho_0 - xy.y));
    if (n < 0) {
      rho = -rho;
      xy.x = -xy.x;
      xy.y = -xy.y;
    }

    lp.lam = atan2(xy.x, xy.y) / n;

    switch (type) {
      case 'PCONIC':
        lp.phi = atan(c1 - rho / c2) + sig;
        break;
      case 'MURD2':
        lp.phi = sig - atan(rho - rho_c);
        break;
      default:
        lp.phi = rho_c - rho;
    }
  }
}

pj_add(pj_somerc, 'somerc', 'Swiss. Obl. Mercator', 'Cyl, Ell\nFor CH1903');

function pj_somerc(P) {
  var K, c, hlf_e, kR, cosp0, sinp0;
  var EPS = 1e-10;
  var NITER = 6;
  var cp, phip0, sp;
  hlf_e = 0.5 * P.e;
  cp = cos(P.phi0);
  cp *= cp;
  c = sqrt(1 + P.es * cp * cp * P.rone_es);
  sp = sin(P.phi0);
  cosp0 = cos((phip0 = aasin((sinp0 = sp / c))));
  sp *= P.e;
  K =
    log(tan(M_FORTPI + 0.5 * phip0)) -
    c * (log(tan(M_FORTPI + 0.5 * P.phi0)) - hlf_e * log((1 + sp) / (1 - sp)));
  kR = (P.k0 * sqrt(P.one_es)) / (1 - sp * sp);
  P.inv = e_inv;
  P.fwd = e_fwd;

  function e_fwd(lp, xy) {
    var phip, lamp, phipp, lampp, sp, cp;
    sp = P.e * sin(lp.phi);
    phip =
      2 *
        atan(
          exp(
            c *
              (log(tan(M_FORTPI + 0.5 * lp.phi)) -
                hlf_e * log((1 + sp) / (1 - sp))) +
              K
          )
        ) -
      M_HALFPI;
    lamp = c * lp.lam;
    cp = cos(phip);
    phipp = aasin(cosp0 * sin(phip) - sinp0 * cp * cos(lamp));
    lampp = aasin((cp * sin(lamp)) / cos(phipp));
    xy.x = kR * lampp;
    xy.y = kR * log(tan(M_FORTPI + 0.5 * phipp));
  }

  function e_inv(xy, lp) {
    var phip, lamp, phipp, lampp, cp, esp, con, delp;
    var i;
    phipp = 2 * (atan(exp(xy.y / kR)) - M_FORTPI);
    lampp = xy.x / kR;
    cp = cos(phipp);
    phip = aasin(cosp0 * sin(phipp) + sinp0 * cp * cos(lampp));
    lamp = aasin((cp * sin(lampp)) / cos(phip));
    con = (K - log(tan(M_FORTPI + 0.5 * phip))) / c;
    for (i = NITER; i; --i) {
      esp = P.e * sin(phip);
      delp =
        (con +
          log(tan(M_FORTPI + 0.5 * phip)) -
          hlf_e * log((1 + esp) / (1 - esp))) *
        (1 - esp * esp) *
        cos(phip) *
        P.rone_es;
      phip -= delp;
      if (fabs(delp) < EPS) break;
    }
    if (i) {
      lp.phi = phip;
      lp.lam = lamp / c;
    } else i_error();
  }
}

pj_add(pj_stere, 'stere', 'Stereographic', 'Azi, Sph&Ell\nlat_ts=');
pj_add(pj_ups, 'ups', 'Universal Polar Stereographic', 'Azi, Sph&Ell\nsouth');

function pj_ups(P) {
  P.phi0 = pj_param(P.params, 'bsouth') ? -M_HALFPI : M_HALFPI;
  P.k0 = 0.994;
  P.x0 = 2000000;
  P.y0 = 2000000;
  P.lam0 = 0;
  if (!P.es) e_error(-34);
  pj_stere_init(P, M_HALFPI);
}

function pj_stere(P) {
  var phits = pj_param(P.params, 'tlat_ts')
    ? pj_param(P.params, 'rlat_ts')
    : M_HALFPI;
  pj_stere_init(P, phits);
}

function pj_stere_init(P, phits) {
  var EPS10 = 1e-10,
    TOL = 1e-8,
    NITER = 8,
    CONV = 1e-10,
    S_POLE = 0,
    N_POLE = 1,
    OBLIQ = 2,
    EQUIT = 3;
  var X, t, sinph0, cosph0;
  var sinX1, cosX1, akm1, mode;

  if (fabs((t = fabs(P.phi0)) - M_HALFPI) < EPS10)
    mode = P.phi0 < 0 ? S_POLE : N_POLE;
  else mode = t > EPS10 ? OBLIQ : EQUIT;
  phits = fabs(phits);

  if (P.es) {
    switch (mode) {
      case N_POLE:
      case S_POLE:
        if (fabs(phits - M_HALFPI) < EPS10)
          akm1 =
            (2 * P.k0) / sqrt(pow(1 + P.e, 1 + P.e) * pow(1 - P.e, 1 - P.e));
        else {
          akm1 = cos(phits) / pj_tsfn(phits, (t = sin(phits)), P.e);
          t *= P.e;
          akm1 /= sqrt(1 - t * t);
        }
        break;
      case EQUIT:
      case OBLIQ:
        t = sin(P.phi0);
        X = 2 * atan(ssfn(P.phi0, t, P.e)) - M_HALFPI;
        t *= P.e;
        akm1 = (2 * P.k0 * cos(P.phi0)) / sqrt(1 - t * t);
        sinX1 = sin(X);
        cosX1 = cos(X);
        break;
    }
    P.fwd = e_fwd;
    P.inv = e_inv;
  } else {
    switch (mode) {
      case OBLIQ:
        sinph0 = sin(P.phi0);
        cosph0 = cos(P.phi0);
      /* falls through */
      case EQUIT:
        akm1 = 2 * P.k0;
        break;
      case S_POLE:
      case N_POLE:
        akm1 =
          fabs(phits - M_HALFPI) >= EPS10
            ? cos(phits) / tan(M_FORTPI - 0.5 * phits)
            : 2 * P.k0;
        break;
    }
    P.fwd = s_fwd;
    P.inv = s_inv;
  }

  function e_fwd(lp, xy) {
    var coslam,
      sinlam,
      sinX = 0,
      cosX = 0,
      X,
      A,
      sinphi;
    coslam = cos(lp.lam);
    sinlam = sin(lp.lam);
    sinphi = sin(lp.phi);
    if (mode == OBLIQ || mode == EQUIT) {
      sinX = sin((X = 2 * atan(ssfn(lp.phi, sinphi, P.e)) - M_HALFPI));
      cosX = cos(X);
    }

    switch (mode) {
      case OBLIQ:
        A = akm1 / (cosX1 * (1 + sinX1 * sinX + cosX1 * cosX * coslam));
        xy.y = A * (cosX1 * sinX - sinX1 * cosX * coslam);
        xy.x = A * cosX;
        break;
      case EQUIT:
        /* zero division is handled in pj_fwd */
        A = akm1 / (1 + cosX * coslam);
        xy.y = A * sinX;
        xy.x = A * cosX;
        break;
      case S_POLE:
        lp.phi = -lp.phi;
        coslam = -coslam;
        sinphi = -sinphi;
      /* falls through */
      case N_POLE:
        xy.x = akm1 * pj_tsfn(lp.phi, sinphi, P.e);
        xy.y = -xy.x * coslam;
        break;
    }
    xy.x = xy.x * sinlam;
  }

  function s_fwd(lp, xy) {
    var phi = lp.phi,
      sinphi = sin(phi),
      cosphi = cos(phi),
      coslam = cos(lp.lam),
      sinlam = sin(lp.lam);

    switch (mode) {
      case EQUIT:
      case OBLIQ:
        if (mode == EQUIT) {
          xy.y = 1 + cosphi * coslam;
        } else {
          xy.y = 1 + sinph0 * sinphi + cosph0 * cosphi * coslam;
        }
        if (xy.y <= EPS10) f_error();
        xy.x = (xy.y = akm1 / xy.y) * cosphi * sinlam;
        xy.y *=
          mode == EQUIT ? sinphi : cosph0 * sinphi - sinph0 * cosphi * coslam;
        break;
      case N_POLE:
        coslam = -coslam;
        phi = -phi;
      /* falls through */
      case S_POLE:
        if (fabs(phi - M_HALFPI) < TOL) f_error();
        xy.x = sinlam * (xy.y = akm1 * tan(M_FORTPI + 0.5 * phi));
        xy.y *= coslam;
        break;
    }
  }

  function e_inv(xy, lp) {
    var phi = lp.phi,
      tp = 0,
      phi_l = 0,
      halfe = 0,
      halfpi = 0,
      cosphi,
      sinphi,
      rho,
      i;
    rho = hypot(xy.x, xy.y);

    switch (mode) {
      case OBLIQ:
      case EQUIT:
        cosphi = cos((tp = 2 * atan2(rho * cosX1, akm1)));
        sinphi = sin(tp);
        if (rho == 0) phi_l = asin(cosphi * sinX1);
        else phi_l = asin(cosphi * sinX1 + (xy.y * sinphi * cosX1) / rho);

        tp = tan(0.5 * (M_HALFPI + phi_l));
        xy.x *= sinphi;
        xy.y = rho * cosX1 * cosphi - xy.y * sinX1 * sinphi;
        halfpi = M_HALFPI;
        halfe = 0.5 * P.e;
        break;
      case N_POLE:
        xy.y = -xy.y;
      /* falls through */
      case S_POLE:
        phi_l = M_HALFPI - 2 * atan((tp = -rho / akm1));
        halfpi = -M_HALFPI;
        halfe = -0.5 * P.e;
        break;
    }

    for (i = 0; i < NITER; i++, phi_l = lp.phi) {
      sinphi = P.e * sin(phi_l);
      lp.phi = 2 * atan(tp * pow((1 + sinphi) / (1 - sinphi), halfe)) - halfpi;
      if (fabs(phi_l - lp.phi) < CONV) {
        if (mode == S_POLE) lp.phi = -lp.phi;
        lp.lam = xy.x == 0 && xy.y == 0 ? 0 : atan2(xy.x, xy.y);
        return;
      }
    }
    i_error();
  }

  function s_inv(xy, lp) {
    var c, rh, sinc, cosc;
    sinc = sin((c = 2 * atan((rh = hypot(xy.x, xy.y)) / akm1)));
    cosc = cos(c);
    lp.lam = 0;

    switch (mode) {
      case EQUIT:
        if (fabs(rh) <= EPS10) lp.phi = 0;
        else lp.phi = asin((xy.y * sinc) / rh);
        if (cosc != 0 || xy.x != 0) lp.lam = atan2(xy.x * sinc, cosc * rh);
        break;
      case OBLIQ:
        if (fabs(rh) <= EPS10) lp.phi = P.phi0;
        else lp.phi = asin(cosc * sinph0 + (xy.y * sinc * cosph0) / rh);
        if ((c = cosc - sinph0 * sin(lp.phi)) != 0 || xy.x != 0)
          lp.lam = atan2(xy.x * sinc * cosph0, c * rh);
        break;
      case N_POLE:
        xy.y = -xy.y;
      /* falls through */
      case S_POLE:
        if (fabs(rh) <= EPS10) lp.phi = P.phi0;
        else lp.phi = asin(mode == S_POLE ? -cosc : cosc);
        lp.lam = xy.x == 0 && xy.y == 0 ? 0 : atan2(xy.x, xy.y);
        break;
    }
  }

  function ssfn(phit, sinphi, eccen) {
    sinphi *= eccen;
    return (
      tan(0.5 * (M_HALFPI + phit)) *
      pow((1 - sinphi) / (1 + sinphi), 0.5 * eccen)
    );
  }
}

function srat(esinp, exp) {
  return pow((1 - esinp) / (1 + esinp), exp);
}

function pj_gauss_ini(e, phi0) {
  var es = e * e,
    sphi = sin(phi0),
    cphi = cos(phi0),
    rc = sqrt(1 - es) / (1 - es * sphi * sphi),
    C = sqrt(1 + (es * cphi * cphi * cphi * cphi) / (1 - es)),
    // ignoring Proj.4 div0 check (seems unneccessary)
    chi = asin(sphi / C),
    ratexp = 0.5 * C * e,
    K =
      tan(0.5 * chi + M_FORTPI) /
      (pow(tan(0.5 * phi0 + M_FORTPI), C) * srat(e * sphi, ratexp));
  return { e: e, K: K, C: C, chi: chi, ratexp: ratexp, rc: rc };
}

function pj_gauss(elp, en) {
  return {
    phi:
      2 *
        atan(
          en.K *
            pow(tan(0.5 * elp.phi + M_FORTPI), en.C) *
            srat(en.e * sin(elp.phi), en.ratexp)
        ) -
      M_HALFPI,
    lam: en.C * elp.lam
  };
}

function pj_inv_gauss(lp, en) {
  var MAX_ITER = 20,
    DEL_TOL = 1e-14,
    phi1 = lp.phi,
    num = pow(tan(0.5 * lp.phi + M_FORTPI) / en.K, 1 / en.C),
    i,
    phi;
  lp.lam /= en.C;
  for (i = MAX_ITER; i > 0; --i) {
    phi = 2 * atan(num * srat(en.e * sin(lp.phi), -0.5 * en.e)) - M_HALFPI;
    if (fabs(phi - lp.phi) < DEL_TOL) break;
    lp.phi = phi;
  }
  if (!i) pj_ctx_set_errno(-17); /* convergence failed */
}

pj_add(
  pj_sterea,
  'sterea',
  'Oblique Stereographic Alternative',
  'Azimuthal, Sph&Ell'
);

function pj_sterea(P) {
  var en = pj_gauss_ini(P.e, P.phi0),
    phic0 = en.chi,
    R = en.rc,
    R2 = 2 * R,
    sinc0 = sin(phic0),
    cosc0 = cos(phic0);

  P.fwd = e_fwd;
  P.inv = e_inv;

  function e_fwd(lp, xy) {
    var cosc, sinc, cosl, k;
    lp = pj_gauss(lp, en);
    sinc = sin(lp.phi);
    cosc = cos(lp.phi);
    cosl = cos(lp.lam);
    k = (P.k0 * R2) / (1 + sinc0 * sinc + cosc0 * cosc * cosl);
    xy.x = k * cosc * sin(lp.lam);
    xy.y = k * (cosc0 * sinc - sinc0 * cosc * cosl);
  }

  function e_inv(xy, lp) {
    var x = xy.x / P.k0,
      y = xy.y / P.k0,
      rho,
      c,
      sinc,
      cosc;
    if ((rho = hypot(x, y))) {
      c = 2 * atan2(rho, R2);
      sinc = sin(c);
      cosc = cos(c);
      lp.phi = asin(cosc * sinc0 + (y * sinc * cosc0) / rho);
      lp.lam = atan2(x * sinc, rho * cosc0 * cosc - y * sinc0 * sinc);
    } else {
      lp.phi = phic0;
      lp.lam = 0;
    }
    pj_inv_gauss(lp, en);
  }
}

pj_add(pj_kav5, 'kav5', 'Kavraisky V', 'PCyl., Sph.');
pj_add(pj_qua_aut, 'qua_aut', 'Quartic Authalic', 'PCyl., Sph.');
pj_add(pj_fouc, 'fouc', 'Foucaut', 'PCyl., Sph.');
pj_add(
  pj_mbt_s,
  'mbt_s',
  'McBryde-Thomas Flat-Polar Sine (No. 1)',
  'PCyl., Sph.'
);

function pj_kav5(P) {
  pj_sts(P, 1.50488, 1.35439, false);
}

function pj_qua_aut(P) {
  pj_sts(P, 2, 2, false);
}

function pj_fouc(P) {
  pj_sts(P, 2, 2, true);
}

function pj_mbt_s(P) {
  pj_sts(P, 1.48875, 1.36509, false);
}

function pj_sts(P, p, q, tan_mode) {
  var C_x = q / p;
  var C_y = p;
  var C_p = 1 / q;
  P.inv = s_inv;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var c;
    xy.x = C_x * lp.lam * cos(lp.phi);
    xy.y = C_y;
    lp.phi *= C_p;
    c = cos(lp.phi);
    if (tan_mode) {
      xy.x *= c * c;
      xy.y *= tan(lp.phi);
    } else {
      xy.x /= c;
      xy.y *= sin(lp.phi);
    }
  }

  function s_inv(xy, lp) {
    var c;
    xy.y /= C_y;
    c = cos((lp.phi = tan_mode ? atan(xy.y) : aasin(xy.y)));
    lp.phi /= C_p;
    lp.lam = xy.x / (C_x * cos(lp.phi));
    if (tan_mode) lp.lam /= c * c;
    else lp.lam *= c;
  }
}

pj_add(pj_tcea, 'tcea', 'Transverse Cylindrical Equal Area', 'Cyl, Sph');

function pj_tcea(P) {
  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = (cos(lp.phi) * sin(lp.lam)) / P.k0;
    xy.y = P.k0 * (atan2(tan(lp.phi), cos(lp.lam)) - P.phi0);
  }

  function s_inv(xy, lp) {
    var t;
    xy.y = xy.y / P.k0 + P.phi0;
    xy.x *= P.k0;
    t = sqrt(1 - xy.x * xy.x);
    lp.phi = asin(t * sin(xy.y));
    lp.lam = atan2(xy.x, t * cos(xy.y));
  }
}

pj_add(pj_times, 'times', 'Times', 'Cyl, Sph');

function pj_times(P) {
  P.es = 0;
  P.fwd = function (lp, xy) {
    var t = tan(lp.phi / 2);
    var s = sin(M_FORTPI * t);
    xy.x = lp.lam * (0.74482 - 0.34588 * s * s);
    xy.y = 1.70711 * t;
  };
  P.inv = function (xy, lp) {
    var t = xy.y / 1.70711;
    var s = sin(M_FORTPI * t);
    lp.lam = xy.x / (0.74482 - 0.34588 * s * s);
    lp.phi = 2 * atan(t);
  };
}

pj_add(pj_tmerc, 'tmerc', 'Transverse Mercator', 'Cyl, Sph&Ell');
pj_add(
  pj_utm,
  'utm',
  'Universal Transverse Mercator (UTM)',
  'Cyl, Sph\nzone= south'
);

function pj_utm_zone(P) {}

function pj_utm(P) {
  var zone;
  if (!P.es) e_error(-34);
  P.y0 = pj_param(P.params, 'bsouth') ? 10000000 : 0;
  P.x0 = 500000;
  if (pj_param(P.params, 'tzone')) {
    if ((zone = pj_param(P.params, 'izone')) > 0 && zone <= 60) --zone;
    else e_error(-35);
  } else {
    /* nearest central meridian input */
    zone = floor(((adjlon(P.lam0) + M_PI) * 30) / M_PI);
    if (zone < 0) zone = 0;
    else if (zone >= 60) zone = 59;
  }
  P.lam0 = ((zone + 0.5) * M_PI) / 30 - M_PI;
  P.k0 = 0.9996;
  P.phi0 = 0;
  pj_etmerc(P);
}

function pj_tmerc(P) {
  // TODO: support +algo option
  if (pj_param(P.params, 'bapprox')) {
    pj_tmerc_approx(P);
  } else {
    pj_tmerc_auto(P);
  }
}

function pj_tmerc_auto(P) {
  if (P.es === 0) {
    return pj_tmerc_approx(P);
  }
  pj_etmerc(P);
  var etfwd = P.fwd;
  var etinv = P.inv;
  pj_tmerc_approx(P);
  var fwd = P.fwd;
  var inv = P.inv;

  P.fwd = function (lp, xy) {
    if (fabs(lp.lam) > 3 * DEG_TO_RAD) etfwd(lp, xy);
    else fwd(lp, xy);
  };

  P.inv = function (xy, lp) {
    // See https://github.com/OSGeo/PROJ/blob/master/src/projections/tmerc.cpp
    if (fabs(xy.x) > 0.053 - 0.022 * xy.y * xy.y) etinv(xy, lp);
    else inv(xy, lp);
  };
}

function pj_tmerc_approx(P) {
  var EPS10 = 1e-10,
    FC1 = 1,
    FC2 = 0.5,
    FC3 = 0.16666666666666666666,
    FC4 = 0.08333333333333333333,
    FC5 = 0.05,
    FC6 = 0.03333333333333333333,
    FC7 = 0.02380952380952380952,
    FC8 = 0.01785714285714285714;
  var esp, ml0, en;

  if (P.es) {
    if (!(en = pj_enfn(P.es)))
      // in pj_mlfn.js
      e_error_0();
    ml0 = pj_mlfn(P.phi0, sin(P.phi0), cos(P.phi0), en);
    esp = P.es / (1 - P.es);
    P.fwd = e_fwd;
    P.inv = e_inv;
  } else {
    esp = P.k0;
    ml0 = 0.5 * esp;
    P.fwd = s_fwd;
    P.inv = s_inv;
  }

  function e_fwd(lp, xy) {
    var sinphi, cosphi, t, al, als, n;
    if (lp.lam < -M_HALFPI || lp.lam > M_HALFPI) {
      pj_ctx_set_errno(-14);
      return;
    }

    sinphi = sin(lp.phi);
    cosphi = cos(lp.phi);
    t = fabs(cosphi) > EPS10 ? sinphi / cosphi : 0;
    t *= t;
    al = cosphi * lp.lam;
    als = al * al;
    al /= sqrt(1 - P.es * sinphi * sinphi);
    n = esp * cosphi * cosphi;
    xy.x =
      P.k0 *
      al *
      (FC1 +
        FC3 *
          als *
          (1 -
            t +
            n +
            FC5 *
              als *
              (5 +
                t * (t - 18) +
                n * (14 - 58 * t) +
                FC7 * als * (61 + t * (t * (179 - t) - 479)))));
    xy.y =
      P.k0 *
      (pj_mlfn(lp.phi, sinphi, cosphi, en) -
        ml0 +
        sinphi *
          al *
          lp.lam *
          FC2 *
          (1 +
            FC4 *
              als *
              (5 -
                t +
                n * (9 + 4 * n) +
                FC6 *
                  als *
                  (61 +
                    t * (t - 58) +
                    n * (270 - 330 * t) +
                    FC8 * als * (1385 + t * (t * (543 - t) - 3111))))));
  }

  function s_fwd(lp, xy) {
    var b, cosphi;
    /*
     * Fail if our longitude is more than 90 degrees from the
     * central meridian since the results are essentially garbage.
     * Is error -20 really an appropriate return value?
     *
     *  http://trac.osgeo.org/proj/ticket/5
     */
    if (lp.lam < -M_HALFPI || lp.lam > M_HALFPI) {
      pj_ctx_set_errno(-14);
      return;
    }
    cosphi = cos(lp.phi);
    b = cosphi * sin(lp.lam);
    if (fabs(fabs(b) - 1) <= EPS10) f_error();

    xy.x = ml0 * log((1 + b) / (1 - b));
    xy.y = (cosphi * cos(lp.lam)) / sqrt(1 - b * b);

    b = fabs(xy.y);
    if (b >= 1) {
      if (b - 1 > EPS10) {
        f_error();
      } else {
        xy.y = 0;
      }
    } else xy.y = acos(xy.y);

    if (lp.phi < 0) xy.y = -xy.y;
    xy.y = esp * (xy.y - P.phi0);
  }

  function e_inv(xy, lp) {
    var n, con, cosphi, d, ds, sinphi, t;
    lp.phi = pj_inv_mlfn(ml0 + xy.y / P.k0, P.es, en);
    if (fabs(lp.phi) >= M_HALFPI) {
      lp.phi = xy.y < 0 ? -M_HALFPI : M_HALFPI;
      lp.lam = 0;
    } else {
      sinphi = sin(lp.phi);
      cosphi = cos(lp.phi);
      t = fabs(cosphi) > 1e-10 ? sinphi / cosphi : 0;
      n = esp * cosphi * cosphi;
      d = (xy.x * sqrt((con = 1 - P.es * sinphi * sinphi))) / P.k0;
      con *= t;
      t *= t;
      ds = d * d;
      lp.phi -=
        ((con * ds) / (1 - P.es)) *
        FC2 *
        (1 -
          ds *
            FC4 *
            (5 +
              t * (3 - 9 * n) +
              n * (1 - 4 * n) -
              ds *
                FC6 *
                (61 +
                  t * (90 - 252 * n + 45 * t) +
                  46 * n -
                  ds * FC8 * (1385 + t * (3633 + t * (4095 + 1575 * t))))));
      lp.lam =
        (d *
          (FC1 -
            ds *
              FC3 *
              (1 +
                2 * t +
                n -
                ds *
                  FC5 *
                  (5 +
                    t * (28 + 24 * t + 8 * n) +
                    6 * n -
                    ds * FC7 * (61 + t * (662 + t * (1320 + 720 * t))))))) /
        cosphi;
    }
  }

  function s_inv(xy, lp) {
    var h = exp(xy.x / esp);
    var g = 0.5 * (h - 1 / h);
    h = cos(P.phi0 + xy.y / esp);
    lp.phi = asin(sqrt((1 - h * h) / (1 + g * g)));
    /* Make sure that phi is on the correct hemisphere when false northing is used */
    if (xy.y < 0 && -lp.phi + P.phi0 < 0) lp.phi = -lp.phi;
    lp.lam = g || h ? atan2(g, h) : 0;
  }
}

pj_add(
  pj_tpeqd,
  'tpeqd',
  'Two Point Equidistant',
  'Misc Sph\nlat_1= lon_1= lat_2= lon_2='
);

function pj_tpeqd(P) {
  var cp1, sp1, cp2, sp2, ccs, cs, sc, r2z0, z02, dlam2;
  var hz0, thz0, rhshz0, ca, sa, lamp, lamc;
  var lam_1, lam_2, phi_1, phi_2, A12, pp;

  /* get control point locations */
  phi_1 = pj_param(P.params, 'rlat_1');
  lam_1 = pj_param(P.params, 'rlon_1');
  phi_2 = pj_param(P.params, 'rlat_2');
  lam_2 = pj_param(P.params, 'rlon_2');

  if (phi_1 == phi_2 && lam_1 == lam_2) e_error(-25);
  P.lam0 = adjlon(0.5 * (lam_1 + lam_2));
  dlam2 = adjlon(lam_2 - lam_1);
  cp1 = cos(phi_1);
  cp2 = cos(phi_2);
  sp1 = sin(phi_1);
  sp2 = sin(phi_2);
  cs = cp1 * sp2;
  sc = sp1 * cp2;
  ccs = cp1 * cp2 * sin(dlam2);
  z02 = aacos(sp1 * sp2 + cp1 * cp2 * cos(dlam2));
  hz0 = 0.5 * z02;
  A12 = atan2(cp2 * sin(dlam2), cp1 * sp2 - sp1 * cp2 * cos(dlam2));
  ca = cos((pp = aasin(cp1 * sin(A12))));
  sa = sin(pp);
  lamp = adjlon(atan2(cp1 * cos(A12), sp1) - hz0);
  dlam2 *= 0.5;
  lamc = M_HALFPI - atan2(sin(A12) * sp1, cos(A12)) - dlam2;
  thz0 = tan(hz0);
  rhshz0 = 0.5 / sin(hz0);
  r2z0 = 0.5 / z02;
  z02 *= z02;

  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    var t, z1, z2, dl1, dl2, sp, cp;
    sp = sin(lp.phi);
    cp = cos(lp.phi);
    z1 = aacos(sp1 * sp + cp1 * cp * cos((dl1 = lp.lam + dlam2)));
    z2 = aacos(sp2 * sp + cp2 * cp * cos((dl2 = lp.lam - dlam2)));
    z1 *= z1;
    z2 *= z2;
    xy.x = r2z0 * (t = z1 - z2);
    t = z02 - t;
    xy.y = r2z0 * asqrt(4 * z02 * z2 - t * t);
    if (ccs * sp - cp * (cs * sin(dl1) - sc * sin(dl2)) < 0) xy.y = -xy.y;
  }

  function s_inv(xy, lp) {
    var cz1, cz2, s, d, cp, sp;
    cz1 = cos(hypot(xy.y, xy.x + hz0));
    cz2 = cos(hypot(xy.y, xy.x - hz0));
    s = cz1 + cz2;
    d = cz1 - cz2;
    lp.lam = -atan2(d, s * thz0);
    lp.phi = aacos(hypot(thz0 * s, d) * rhshz0);
    if (xy.y < 0) lp.phi = -lp.phi;
    /* lam--phi now in system relative to P1--P2 base equator */
    sp = sin(lp.phi);
    cp = cos(lp.phi);
    lp.phi = aasin(sa * sp + ca * cp * (s = cos((lp.lam -= lamp))));
    lp.lam = atan2(cp * sin(lp.lam), sa * cp * s - ca * sp) + lamc;
  }
}

pj_add(pj_urm5, 'urm5', 'Urmaev V', 'PCyl., Sph., no inv.\nn= q= alpha=');

function pj_urm5(P) {
  var m, rmn, q3, n;
  var alpha, t;
  n = pj_param(P.params, 'dn');
  if (n > 0 && n <= 1 === false) {
    e_error(-40);
  }
  q3 = pj_param(P.params, 'dq') / 3;
  alpha = pj_param(P.params, 'ralpha');
  t = n * sin(alpha);
  m = cos(alpha) / sqrt(1 - t * t);
  rmn = 1 / (m * n);

  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var t = (lp.phi = aasin(n * sin(lp.phi)));
    xy.x = m * lp.lam * cos(lp.phi);
    t *= t;
    xy.y = lp.phi * (1 + t * q3) * rmn;
  }
}

pj_add(pj_urmfps, 'urmfps', 'Urmaev Flat-Polar Sinusoidal', 'PCyl, Sph.\nn=');
pj_add(pj_wag1, 'wag1', 'Wagner I (Kavraisky VI)', 'PCyl, Sph.');

function pj_wag1(P) {
  pj_urmfps_init(P, 0.8660254037844386467637231707);
}

function pj_urmfps(P) {
  var n = pj_param(P.params, 'dn');
  if (n <= 0 || n > 1) e_error(-40);
  pj_urmfps_init(P, n);
}

function pj_urmfps_init(P, n) {
  var C_x = 0.8773826753,
    C_y = 1.139753528477 / n;

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var phi = aasin(n * sin(lp.phi));
    xy.x = C_x * lp.lam * cos(phi);
    xy.y = C_y * phi;
  }

  function s_inv(xy, lp) {
    xy.y /= C_y;
    lp.phi = aasin(sin(xy.y) / n);
    lp.lam = xy.x / (C_x * cos(xy.y));
  }
}

pj_add(pj_vandg, 'vandg', 'van der Grinten (I)', 'Misc Sph');
pj_add(pj_vandg2, 'vandg2', 'van der Grinten II', 'Misc Sph, no inv.');
pj_add(pj_vandg3, 'vandg3', 'van der Grinten III', 'Misc Sph, no inv.');
pj_add(pj_vandg4, 'vandg4', 'van der Grinten IV', 'Misc Sph, no inv.');

function pj_vandg(P) {
  var TOL = 1e-10,
    THIRD = 0.33333333333333333333,
    TWO_THRD = 0.66666666666666666666,
    C2_27 = 0.07407407407407407407,
    PI4_3 = 4.18879020478639098458,
    PISQ = 9.86960440108935861869,
    TPISQ = 19.73920880217871723738,
    HPISQ = 4.93480220054467930934;

  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    var al, al2, g, g2, p2;
    p2 = fabs(lp.phi / M_HALFPI);
    if (p2 - TOL > 1) f_error();
    if (p2 > 1) p2 = 1;
    if (fabs(lp.phi) <= TOL) {
      xy.x = lp.lam;
      xy.y = 0;
    } else if (fabs(lp.lam) <= TOL || fabs(p2 - 1) < TOL) {
      xy.x = 0;
      xy.y = M_PI * tan(0.5 * asin(p2));
      if (lp.phi < 0) xy.y = -xy.y;
    } else {
      al = 0.5 * fabs(M_PI / lp.lam - lp.lam / M_PI);
      al2 = al * al;
      g = sqrt(1 - p2 * p2);
      g = g / (p2 + g - 1);
      g2 = g * g;
      p2 = g * (2 / p2 - 1);
      p2 = p2 * p2;
      xy.x = g - p2;
      g = p2 + al2;
      xy.x = (M_PI * (al * xy.x + sqrt(al2 * xy.x * xy.x - g * (g2 - p2)))) / g;
      if (lp.lam < 0) xy.x = -xy.x;
      xy.y = fabs(xy.x / M_PI);
      xy.y = 1 - xy.y * (xy.y + 2 * al);
      if (xy.y < -TOL) f_error();
      if (xy.y < 0) xy.y = 0;
      else xy.y = sqrt(xy.y) * (lp.phi < 0 ? -M_PI : M_PI);
    }
  }

  function s_inv(xy, lp) {
    var t, c0, c1, c2, c3, al, r2, r, m, d, ay, x2, y2;
    x2 = xy.x * xy.x;
    if ((ay = fabs(xy.y)) < TOL) {
      lp.phi = 0;
      t = x2 * x2 + TPISQ * (x2 + HPISQ);
      lp.lam = fabs(xy.x) <= TOL ? 0 : (0.5 * (x2 - PISQ + sqrt(t))) / xy.x;
      return lp;
    }
    y2 = xy.y * xy.y;
    r = x2 + y2;
    r2 = r * r;
    c1 = -M_PI * ay * (r + PISQ);
    c3 = r2 + M_TWOPI * (ay * r + M_PI * (y2 + M_PI * (ay + M_HALFPI)));
    c2 = c1 + PISQ * (r - 3 * y2);
    c0 = M_PI * ay;
    c2 /= c3;
    al = c1 / c3 - THIRD * c2 * c2;
    m = 2 * sqrt(-THIRD * al);
    d = C2_27 * c2 * c2 * c2 + (c0 * c0 - THIRD * c2 * c1) / c3;
    if ((t = fabs((d = (3 * d) / (al * m)))) - TOL <= 1) {
      d = t > 1 ? (d > 0 ? 0 : M_PI) : acos(d);
      lp.phi = M_PI * (m * cos(d * THIRD + PI4_3) - THIRD * c2);
      if (xy.y < 0) lp.phi = -lp.phi;
      t = r2 + TPISQ * (x2 - y2 + HPISQ);
      lp.lam =
        fabs(xy.x) <= TOL
          ? 0
          : (0.5 * (r - PISQ + (t <= 0 ? 0 : sqrt(t)))) / xy.x;
    } else i_error();
  }
}

function pj_vandg2(P) {
  pj_vandg2_init(P, false);
}

function pj_vandg3(P) {
  pj_vandg2_init(P, true);
}

function pj_vandg2_init(P, vdg3) {
  var TOL = 1e-10;
  P.fwd = s_fwd;
  P.es = 0;

  function s_fwd(lp, xy) {
    var x1, at, bt, ct;
    bt = fabs(M_TWO_D_PI * lp.phi);
    if ((ct = 1 - bt * bt) < 0) ct = 0;
    else ct = sqrt(ct);
    if (fabs(lp.lam) < TOL) {
      xy.x = 0;
      xy.y = (M_PI * (lp.phi < 0 ? -bt : bt)) / (1 + ct);
    } else {
      at = 0.5 * fabs(M_PI / lp.lam - lp.lam / M_PI);
      if (vdg3) {
        x1 = bt / (1 + ct);
        xy.x = M_PI * (sqrt(at * at + 1 - x1 * x1) - at);
        xy.y = M_PI * x1;
      } else {
        x1 = (ct * sqrt(1 + at * at) - at * ct * ct) / (1 + at * at * bt * bt);
        xy.x = M_PI * x1;
        xy.y = M_PI * sqrt(1 - x1 * (x1 + 2 * at) + TOL);
      }
      if (lp.lam < 0) xy.x = -xy.x;
      if (lp.phi < 0) xy.y = -xy.y;
    }
  }
}

function pj_vandg4(P) {
  P.es = 0;
  P.fwd = function (lp, xy) {
    var TOL = 1e-10;
    var x1, t, bt, ct, ft, bt2, ct2, dt, dt2;
    if (fabs(lp.phi) < TOL) {
      xy.x = lp.lam;
      xy.y = 0;
    } else if (fabs(lp.lam) < TOL || fabs(fabs(lp.phi) - M_HALFPI) < TOL) {
      xy.x = 0;
      xy.y = lp.phi;
    } else {
      bt = fabs(M_TWO_D_PI * lp.phi);
      bt2 = bt * bt;
      ct = (0.5 * (bt * (8 - bt * (2 + bt2)) - 5)) / (bt2 * (bt - 1));
      ct2 = ct * ct;
      dt = M_TWO_D_PI * lp.lam;
      dt = dt + 1 / dt;
      dt = sqrt(dt * dt - 4);
      if (fabs(lp.lam) - M_HALFPI < 0) dt = -dt;
      dt2 = dt * dt;
      x1 = bt + ct;
      x1 *= x1;
      t = bt + 3 * ct;
      ft =
        x1 * (bt2 + ct2 * dt2 - 1) +
        (1 - bt2) * (bt2 * (t * t + 4 * ct2) + ct2 * (12 * bt * ct + 4 * ct2));
      x1 = (dt * (x1 + ct2 - 1) + 2 * sqrt(ft)) / (4 * x1 + dt2);
      xy.x = M_HALFPI * x1;
      xy.y = M_HALFPI * sqrt(1 + dt * fabs(x1) - x1 * x1);
      if (lp.lam < 0) xy.x = -xy.x;
      if (lp.phi < 0) xy.y = -xy.y;
    }
  };
}

pj_add(pj_wag2, 'wag2', 'Wagner II', 'PCyl., Sph.');
pj_add(pj_wag3, 'wag3', 'Wagner III', 'PCyl., Sph.\nlat_ts=');
pj_add(pj_wag7, 'wag7', 'Wagner VII', 'Misc Sph, no inv.');

function pj_wag2(P) {
  var C_x = 0.92483,
    C_y = 1.38725,
    C_p1 = 0.88022,
    C_p2 = 0.8855;

  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    lp.phi = aasin(C_p1 * sin(C_p2 * lp.phi));
    xy.x = C_x * lp.lam * cos(lp.phi);
    xy.y = C_y * lp.phi;
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y / C_y;
    lp.lam = xy.x / (C_x * cos(lp.phi));
    lp.phi = aasin(sin(lp.phi) / C_p1) / C_p2;
  }
}

function pj_wag3(P) {
  var TWOTHIRD = 0.6666666666666666666667,
    ts = pj_param(P.params, 'rlat_ts'),
    C_x = cos(ts) / cos((2 * ts) / 3);

  P.es = 0;
  P.fwd = s_fwd;
  P.inv = s_inv;

  function s_fwd(lp, xy) {
    xy.x = C_x * lp.lam * cos(TWOTHIRD * lp.phi);
    xy.y = lp.phi;
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y;
    lp.lam = xy.x / (C_x * cos(TWOTHIRD * lp.phi));
  }
}

function pj_wag7(P) {
  P.es = 0;
  P.fwd = function (lp, xy) {
    var theta, ct, D;
    theta = asin((xy.y = 0.90630778703664996 * sin(lp.phi)));
    xy.x = 2.66723 * (ct = cos(theta)) * sin((lp.lam /= 3));
    xy.y *= 1.24104 * (D = 1 / sqrt(0.5 * (1 + ct * cos(lp.lam))));
    xy.x *= D;
  };
}

pj_add(pj_wink1, 'wink1', 'Winkel I', 'PCyl., Sph.\nlat_ts=');
pj_add(pj_wink2, 'wink2', 'Winkel II', 'PCyl., Sph., no inv.\nlat_1=');

function pj_wink1(P) {
  var cosphi1 = cos(pj_param(P.params, 'rlat_ts'));
  P.fwd = s_fwd;
  P.inv = s_inv;
  P.es = 0;

  function s_fwd(lp, xy) {
    xy.x = 0.5 * lp.lam * (cosphi1 + cos(lp.phi));
    xy.y = lp.phi;
  }

  function s_inv(xy, lp) {
    lp.phi = xy.y;
    lp.lam = (2 * xy.x) / (cosphi1 + cos(lp.phi));
  }
}

function pj_wink2(P) {
  var cosphi1 = cos(pj_param(P.params, 'rlat_1'));
  var MAX_ITER = 10,
    LOOP_TOL = 1e-7;
  P.fwd = s_fwd;
  P.inv = null;
  P.es = 0;

  function s_fwd(lp, xy) {
    var k,
      V,
      i,
      phi = lp.phi;
    xy.y = phi * M_TWO_D_PI;
    k = M_PI * sin(phi);
    phi *= 1.8;
    for (i = MAX_ITER; i; --i) {
      phi -= V = (phi + sin(phi) - k) / (1 + cos(phi));
      if (fabs(V) < LOOP_TOL) break;
    }
    if (!i) phi = phi < 0 ? -M_HALFPI : M_HALFPI;
    else phi *= 0.5;
    xy.x = 0.5 * lp.lam * (cos(phi) + cosphi1);
    xy.y = M_FORTPI * (sin(phi) + xy.y);
  }
}

// Projections are inserted here by the build script

var api = proj4js; // (partial) support for proj4js api

// Add Proj.4-style api
api.pj_init = pj_init;
api.pj_fwd = pj_fwd;
api.pj_inv = pj_inv;
api.pj_transform = pj_transform;
api.pj_add = pj_add;

// Convenience functions not in Proj.4
api.pj_fwd_deg = pj_fwd_deg;
api.pj_inv_deg = pj_inv_deg;
api.pj_transform_point = pj_transform_point;

// Export some functions for testing
api.internal = {
  dmstod: dmstod,
  dmstor: dmstor,
  get_rtodms: get_rtodms,
  get_dtodms: get_dtodms,
  get_proj_defn: get_proj_defn,
  pj_latlong_from_proj: pj_latlong_from_proj,
  pj_get_params: pj_get_params,
  pj_datums: pj_datums,
  pj_list: pj_list,
  pj_ellps: pj_ellps,
  pj_units: pj_units,
  pj_read_init_opts: pj_read_init_opts,
  find_datum: find_datum,
  DEG_TO_RAD: DEG_TO_RAD,
  RAD_TO_DEG: RAD_TO_DEG,
  wkt_parse: wkt_parse,
  wkt_unpack: wkt_unpack,
  convert_wkt_quotes: convert_wkt_quotes,
  wkt_to_proj4: wkt_to_proj4,
  wkt_from_proj4: wkt_from_proj4,
  wkt_make_projcs: wkt_make_projcs,
  wkt_get_geogcs_name: wkt_get_geogcs_name,
  wkt_stringify: wkt_stringify,
  mproj_insert_libcache: mproj_insert_libcache,
  mproj_search_libcache: mproj_search_libcache,
  GeographicLib: GeographicLib
};

// TODO: move to better file
function pj_latlong_from_proj(P) {
  var defn = '+proj=latlong' + get_geod_defn(P);
  return pj_init(defn);
}

export default api;
