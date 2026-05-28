/**
 * Fog/atmosphere definition from the Mapbox Standard style.
 * Apply this to non-Standard styles (e.g. Outdoors, OSM) to get
 * stars and atmospheric haze in globe projection.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STANDARD_FOG: Record<string, any> = {
  'vertical-range': [30, 120],
  range: [
    'interpolate',
    ['linear'],
    ['zoom'],
    13,
    ['literal', [1, 10]],
    15,
    ['literal', [1, 4]],
    22,
    ['literal', [14, 20]]
  ],
  color: [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    5,
    [
      'interpolate',
      ['linear'],
      ['measure-light', 'brightness'],
      0.1,
      'hsla(240, 9%, 55%, 1)',
      0.4,
      'hsla(0, 0%, 100%, 1)'
    ],
    7,
    [
      'interpolate',
      ['linear'],
      ['measure-light', 'brightness'],
      0.02,
      'hsla(213, 63%, 20%, 0.9)',
      0.03,
      'hsla(30, 65%, 60%, 0.5)',
      0.4,
      'hsla(10, 79%, 88%, 0.95)',
      0.45,
      'hsla(200, 60%, 98%, 0.9)'
    ]
  ],
  'high-color': [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    5,
    [
      'interpolate',
      ['linear'],
      ['measure-light', 'brightness'],
      0.1,
      'hsla(215, 100%, 20%, 1)',
      0.4,
      'hsla(215, 100%, 51%, 1)'
    ],
    7,
    [
      'interpolate',
      ['linear'],
      ['measure-light', 'brightness'],
      0,
      'hsla(228, 38%, 20%, 1)',
      0.05,
      'hsla(360, 100%, 85%, 1)',
      0.2,
      'hsla(205, 88%, 86%, 1)',
      0.4,
      'hsla(270, 65%, 85%, 1)',
      0.45,
      'hsla(0, 0%, 100%, 1)'
    ]
  ],
  'space-color': [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    5,
    'hsl(211, 84%, 9%)',
    7,
    [
      'interpolate',
      ['linear'],
      ['measure-light', 'brightness'],
      0,
      'hsl(211, 84%, 17%)',
      0.2,
      'hsl(210, 40%, 30%)',
      0.4,
      'hsl(270, 45%, 98%)',
      0.45,
      'hsl(210, 100%, 80%)'
    ]
  ],
  'horizon-blend': [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    5,
    0.01,
    7,
    [
      'interpolate',
      ['exponential', 1.2],
      ['measure-light', 'brightness'],
      0.35,
      0.03,
      0.4,
      0.1,
      0.45,
      0.03
    ]
  ],
  'star-intensity': [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    5,
    0.4,
    7,
    [
      'interpolate',
      ['exponential', 1.2],
      ['measure-light', 'brightness'],
      0.1,
      0.2,
      0.3,
      0
    ]
  ]
};

export default STANDARD_FOG;
