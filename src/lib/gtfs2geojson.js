// vendored gtfs2geojson because the latest published version requires `dsv` which
// includes a call to fs.readFileSync() that does not play well with rollup.
// TODO: PR this change to gtfs2geojson that uses d3-dsv instead

// ISC License

// Copyright (c) 2015, Tom MacWright <tom@macwright.org>

// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

const csvParse = require('d3-dsv').csvParse;

const gtfs2geojson = {
  /**
   * Parsessss GTFS shapes.txt data given as a string and return a GeoJSON FeatureCollection
   * of features with LineString geometries.
   *
   * @param {string} gtfs csv content of shapes.txt
   * @returns {Object} geojson featurecollection
   */
  lines: function (gtfs) {
    const shapes = csvParse(gtfs).reduce((memo, row) => {
      memo[row.shape_id] = (memo[row.shape_id] || []).concat(row);
      return memo;
    }, {});

    return {
      type: 'FeatureCollection',
      features: Object.keys(shapes).map((id) => {
        return {
          type: 'Feature',
          id: id,
          properties: {
            shape_id: id
          },
          geometry: {
            type: 'LineString',
            coordinates: shapes[id]
              .sort((a, b) => {
                return +a.shape_pt_sequence - b.shape_pt_sequence;
              })
              .map((coord) => {
                return [
                  parseFloat(coord.shape_pt_lon),
                  parseFloat(coord.shape_pt_lat)
                ];
              })
          }
        };
      })
    };
  },

  /**
   * Parse GTFS stops.txt data given as a string and return a GeoJSON FeatureCollection
   * of features with Point geometries.
   *
   * @param {string} gtfs csv content of stops.txt
   * @returns {Object} geojson featurecollection
   *
   */

  stops: function (gtfs) {
    const stops = csvParse(gtfs);
    return {
      type: 'FeatureCollection',
      features: Object.keys(stops).map((id) => {
        return {
          type: 'Feature',
          id: stops[id].stop_id,
          properties: {
            stop_id: stops[id].stop_id,
            stop_name: stops[id].stop_name
          },
          geometry: {
            type: 'Point',
            coordinates: [
              parseFloat(stops[id].stop_lon),
              parseFloat(stops[id].stop_lat)
            ]
          }
        };
      })
    };
  }
};

export default gtfs2geojson;
