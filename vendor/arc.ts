import { Geometry } from 'types';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

class Coord {
  lon: number;
  lat: number;
  x: number;
  y: number;
  constructor([lon, lat]: Pos2) {
    this.lon = lon;
    this.lat = lat;
    this.x = D2R * lon;
    this.y = D2R * lat;
  }
  view() {
    return String(this.lon).slice(0, 4) + ',' + String(this.lat).slice(0, 4);
  }
  antipode() {
    const anti_lat = -1 * this.lat;
    const anti_lon = this.lon < 0 ? 180 + this.lon : (180 - this.lon) * -1;
    return new Coord([anti_lon, anti_lat]);
  }
}

class LineString {
  length: number;
  coords: Array<Pos2>;
  constructor() {
    this.coords = [];
    this.length = 0;
  }

  move_to(coord: Pos2) {
    this.length++;
    this.coords.push(coord);
  }
}

class Arc {
  geometries: any[];

  constructor() {
    this.geometries = [];
  }

  json(): Geometry | null {
    if (this.geometries.length <= 0) {
      return null;
    } else if (this.geometries.length == 1) {
      return {
        type: 'LineString',
        coordinates: this.geometries[0].coords
      };
    } else {
      const multiline = [];
      for (let i = 0; i < this.geometries.length; i++) {
        multiline.push(this.geometries[i].coords);
      }
      return { type: 'MultiLineString', coordinates: multiline };
    }
  }
}

/*
 * http://en.wikipedia.org/wiki/Great-circle_distance
 *
 */
export class GreatCircle {
  start: Coord;
  end: Coord;
  g: number;

  constructor(start: Pos2, end: Pos2) {
    this.start = new Coord(start);
    this.end = new Coord(end);

    const w = this.start.x - this.end.x;
    const h = this.start.y - this.end.y;
    const z =
      Math.pow(Math.sin(h / 2.0), 2) +
      Math.cos(this.start.y) *
        Math.cos(this.end.y) *
        Math.pow(Math.sin(w / 2.0), 2);
    this.g = 2.0 * Math.asin(Math.sqrt(z));

    if (this.g == Math.PI) {
      throw new Error(
        'it appears ' +
          this.start.view() +
          ' and ' +
          this.end.view() +
          " are 'antipodal', e.g diametrically opposite, thus there is no single route but rather infinite"
      );
    } else if (isNaN(this.g)) {
      throw new Error(
        `Could not calculate great circle between ${start.join(
          ','
        )} and ${end.join(',')}`
      );
    }
  }

  /*
   * http://williams.best.vwh.net/avform.htm#Intermediate
   */
  interpolate(f: number): Pos2 {
    const A = Math.sin((1 - f) * this.g) / Math.sin(this.g);
    const B = Math.sin(f * this.g) / Math.sin(this.g);
    const x =
      A * Math.cos(this.start.y) * Math.cos(this.start.x) +
      B * Math.cos(this.end.y) * Math.cos(this.end.x);
    const y =
      A * Math.cos(this.start.y) * Math.sin(this.start.x) +
      B * Math.cos(this.end.y) * Math.sin(this.end.x);
    const z = A * Math.sin(this.start.y) + B * Math.sin(this.end.y);
    const lat = R2D * Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    const lon = R2D * Math.atan2(y, x);
    return [lon, lat];
  }

  /*
   * Generate points along the great circle
   */
  arc(npoints?: number, options?: { offset?: number }): Geometry | null {
    const first_pass: Pos2[] = [];
    if (!npoints || npoints <= 2) {
      first_pass.push([this.start.lon, this.start.lat]);
      first_pass.push([this.end.lon, this.end.lat]);
    } else {
      const delta = 1.0 / (npoints - 1);
      for (let i = 0; i < npoints; ++i) {
        const step = delta * i;
        const pair = this.interpolate(step);
        first_pass.push(pair);
      }
    }
    /* partial port of dateline handling from:
      gdal/ogr/ogrgeometryfactory.cpp

      TODO - does not handle all wrapping scenarios yet
    */
    let bHasBigDiff = false;
    let dfMaxSmallDiffLong = 0;
    // from http://www.gdal.org/ogr2ogr.html
    // -datelineoffset:
    // (starting with GDAL 1.10) offset from dateline in degrees (default long. = +/- 10deg, geometries within 170deg to -170deg will be splited)
    const dfDateLineOffset = options && options.offset ? options.offset : 10;
    const dfLeftBorderX = 180 - dfDateLineOffset;
    const dfRightBorderX = -180 + dfDateLineOffset;
    const dfDiffSpace = 360 - dfDateLineOffset;

    // https://github.com/OSGeo/gdal/blob/7bfb9c452a59aac958bff0c8386b891edf8154ca/gdal/ogr/ogrgeometryfactory.cpp#L2342
    for (let j = 1; j < first_pass.length; ++j) {
      const dfPrevX = first_pass[j - 1][0];
      const dfX = first_pass[j][0];
      const dfDiffLong = Math.abs(dfX - dfPrevX);
      if (
        dfDiffLong > dfDiffSpace &&
        ((dfX > dfLeftBorderX && dfPrevX < dfRightBorderX) ||
          (dfPrevX > dfLeftBorderX && dfX < dfRightBorderX))
      ) {
        bHasBigDiff = true;
      } else if (dfDiffLong > dfMaxSmallDiffLong) {
        dfMaxSmallDiffLong = dfDiffLong;
      }
    }

    const poMulti = [];
    if (bHasBigDiff && dfMaxSmallDiffLong < dfDateLineOffset) {
      let poNewLS: Pos2[] = [];
      poMulti.push(poNewLS);
      for (let k = 0; k < first_pass.length; ++k) {
        const dfX0 = first_pass[k][0];
        if (k > 0 && Math.abs(dfX0 - first_pass[k - 1][0]) > dfDiffSpace) {
          let dfX1 = first_pass[k - 1][0];
          let dfY1 = first_pass[k - 1][1];
          let dfX2 = first_pass[k][0];
          let dfY2 = first_pass[k][1];
          if (
            dfX1 > -180 &&
            dfX1 < dfRightBorderX &&
            dfX2 == 180 &&
            k + 1 < first_pass.length &&
            first_pass[k - 1][0] > -180 &&
            first_pass[k - 1][0] < dfRightBorderX
          ) {
            poNewLS.push([-180, first_pass[k][1]]);
            k++;
            poNewLS.push([first_pass[k][0], first_pass[k][1]]);
            continue;
          } else if (
            dfX1 > dfLeftBorderX &&
            dfX1 < 180 &&
            dfX2 == -180 &&
            k + 1 < first_pass.length &&
            first_pass[k - 1][0] > dfLeftBorderX &&
            first_pass[k - 1][0] < 180
          ) {
            poNewLS.push([180, first_pass[k][1]]);
            k++;
            poNewLS.push([first_pass[k][0], first_pass[k][1]]);
            continue;
          }

          if (dfX1 < dfRightBorderX && dfX2 > dfLeftBorderX) {
            // swap dfX1, dfX2
            const tmpX = dfX1;
            dfX1 = dfX2;
            dfX2 = tmpX;
            // swap dfY1, dfY2
            const tmpY = dfY1;
            dfY1 = dfY2;
            dfY2 = tmpY;
          }
          if (dfX1 > dfLeftBorderX && dfX2 < dfRightBorderX) {
            dfX2 += 360;
          }

          if (dfX1 <= 180 && dfX2 >= 180 && dfX1 < dfX2) {
            const dfRatio = (180 - dfX1) / (dfX2 - dfX1);
            const dfY = dfRatio * dfY2 + (1 - dfRatio) * dfY1;
            poNewLS.push([
              first_pass[k - 1][0] > dfLeftBorderX ? 180 : -180,
              dfY
            ]);
            poNewLS = [];
            poNewLS.push([
              first_pass[k - 1][0] > dfLeftBorderX ? -180 : 180,
              dfY
            ]);
            poMulti.push(poNewLS);
          } else {
            poNewLS = [];
            poMulti.push(poNewLS);
          }
          poNewLS.push([dfX0, first_pass[k][1]]);
        } else {
          poNewLS.push([first_pass[k][0], first_pass[k][1]]);
        }
      }
    } else {
      // add normally
      const poNewLS0: Pos2[] = [];
      poMulti.push(poNewLS0);
      for (let l = 0; l < first_pass.length; ++l) {
        poNewLS0.push([first_pass[l][0], first_pass[l][1]]);
      }
    }

    const arc = new Arc();
    for (let m = 0; m < poMulti.length; ++m) {
      const line = new LineString();
      arc.geometries.push(line);
      const points = poMulti[m];
      for (let j0 = 0; j0 < points.length; ++j0) {
        line.move_to(points[j0]);
      }
    }
    return arc.json();
  }
}
