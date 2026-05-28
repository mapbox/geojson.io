import { Blob } from 'node:buffer';
import Fs from 'node:fs';
import Path from 'node:path';
import { fcLineString, twoPoints } from 'test/helpers';
import type { IFeature, Polygon } from 'types';
import { describe, expect, it, test } from 'vitest';
import { DEFAULT_IMPORT_OPTIONS } from '.';
import { BBOX } from './bbox';
import { CoordinateString } from './coordinate_string';
import { CSV } from './csv';
import { EXIF } from './exif';
import { adjustForFgb, FlatGeobuf } from './flatgeobuf';
import { GeoJSON } from './geojson';
import { KML } from './kml';
import { Polyline } from './polyline';
import { Shapefile } from './shapefile';
import { TCX } from './tcx';
import { TopoJSON } from './topojson';
import { getExtension } from './utils';
import { WKT } from './wkt';

describe('convert', () => {
  describe('Shapefile', () => {
    it('back', async () => {
      const res = (
        await Shapefile.back(
          { geojson: fcLineString },
          {
            type: Shapefile.id
          }
        )
      ).unsafeCoerce();
      expect(res).toHaveProperty('name', 'shapefile.zip');
    });
    // TODO: extremely difficult to test this portion because
    // of Buffer/ArrayBuffer confusion and jsdom
    // it("forward", async () => {
    //   const res = (
    //     await Shapefile.back(fcLineString, {
    //       type: Shapefile.id,
    //     })
    //   ).unsafeCoerce();
    //   const loop = (
    //     await Shapefile.forwardBinary(
    //       {
    //         arrayBuffer() {
    //           return readAsBuffer(res.blob);
    //         },
    //       } as any,
    //       {
    //         ...DEFAULT_IMPORT_OPTIONS,
    //         type: Shapefile.id,
    //       }
    //     )
    //   ).unsafeCoerce();
    //   console.log(loop);
    // });
  });
  describe('BBOX', () => {
    const res = {
      features: [
        {
          geometry: {
            bbox: [0, 1, 2, 3],
            coordinates: [
              [
                [0, 1],
                [0, 3],
                [2, 3],
                [2, 1],
                [0, 1]
              ]
            ],
            type: 'Polygon'
          },
          properties: {},
          type: 'Feature'
        }
      ],
      type: 'FeatureCollection'
    };
    it('forwardString', async () => {
      expect(
        (await BBOX.forwardString('0 1 2 3')).unsafeCoerce()
      ).toHaveProperty('geojson', res);
    });
    it('featureToString', async () => {
      expect(
        (
          await BBOX.featureToString(res.features[0] as IFeature<Polygon>)
        ).unsafeCoerce()
      ).toEqual('0,1,2,3');
    });
  });
  describe('TCX', () => {
    it('id', () => {
      expect(TCX.id).toEqual('tcx');
    });
  });

  describe('CoordinateString', () => {
    it('forwardString', async () => {
      expect(
        (
          await CoordinateString.forwardString('1, 2', {
            ...DEFAULT_IMPORT_OPTIONS,
            coordinateStringOptions: {
              order: 'LONLAT'
            },
            type: 'coordinate-string'
          })
        ).unsafeCoerce()
      ).toHaveProperty('geojson', {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [1, 2]
            }
          }
        ]
      });
    });
    it('featureToString', async () => {
      await expect(
        CoordinateString.featureToString({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          }
        })
      ).resolves.toEqualRight('1,2');

      await expect(
        CoordinateString.featureToString({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [1, 2],
              [3, 4]
            ]
          }
        })
      ).resolves.toBeLeft();
    });
  });
  describe('TopoJSON', () => {
    it('forward', async () => {
      await expect(
        TopoJSON.forwardString('{}', {
          ...DEFAULT_IMPORT_OPTIONS,
          type: TopoJSON.id
        })
      ).resolves.toBeLeft();
    });
  });
  // TODO: this is blocked by dynamic import() support
  // in the test stack.
  test('FlatGeobuf', () => {
    expect(FlatGeobuf).toBeTruthy();
  });

  test('adjustForFgb', () => {
    expect(
      adjustForFgb({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: null,
            properties: null
          }
        ]
      })
    ).toMatchInlineSnapshot(`
    {
      "features": [],
      "type": "FeatureCollection",
    }
  `);

    expect(
      adjustForFgb({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [1, 2]
            },
            properties: {
              x: [1],
              b: { x: 1 },
              q: null,
              y: 2
            }
          }
        ]
      })
    ).toMatchInlineSnapshot(`
      {
        "features": [
          {
            "geometry": {
              "coordinates": [
                1,
                2,
              ],
              "type": "Point",
            },
            "properties": {
              "b": "{"x":1}",
              "q": null,
              "x": "[1]",
              "y": 2,
            },
            "type": "Feature",
          },
        ],
        "type": "FeatureCollection",
      }
    `);
  });
  it('getExtension', () => {
    expect(getExtension('foo.bar')).toEqual('.bar');
    expect(getExtension('foo')).toEqual('');
    expect(getExtension('foo.bar.baz')).toEqual('.baz');
  });

  describe('EXIF', () => {
    it('.forward', async () => {
      const input = Fs.readFileSync(Path.join('test', 'exifimage.jpg')).buffer;
      expect(
        (
          await EXIF.forwardBinary(input, {
            ...DEFAULT_IMPORT_OPTIONS,
            type: EXIF.id
          })
        ).unsafeCoerce()
      ).toHaveProperty(['geojson', 'features', '0', 'geometry'], {
        coordinates: [-121.78388888888888, 36.802775],
        type: 'Point'
      });
    });
  });

  (global as any).Blob = Blob;

  describe('WKT', () => {
    it('forwardString', async () => {
      expect(
        (await WKT.forwardString('POINT (1 2)')).unsafeCoerce()
      ).toHaveProperty('geojson', {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [1, 2]
            }
          }
        ]
      });
    });
    it('featureToString', async () => {
      await expect(
        WKT.featureToString({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          }
        })
      ).resolves.toEqualRight('POINT (1 2)');
    });
  });

  describe('CSV', () => {
    it('can translate lines', async () => {
      expect(
        (
          await CSV.back(
            { geojson: twoPoints },
            {
              type: 'csv'
            }
          )
        ).unsafeCoerce()
      ).toHaveProperty('name', 'features.csv');
    });
  });

  describe('KML', () => {
    it('can translate lines', async () => {
      expect(
        (
          await KML.back(
            { geojson: twoPoints, featureMap: new Map() },
            {
              type: 'csv'
            }
          )
        ).unsafeCoerce()
      ).toHaveProperty('name', 'features.kml');
    });
  });

  describe('Polyline', () => {
    it('cannot translate points', async () => {
      expect(
        await Polyline.back(
          { geojson: twoPoints },
          {
            type: 'polyline'
          }
        )
      ).toBeLeft();
    });
    it('can translate lines', async () => {
      expect(
        (
          await Polyline.back(
            { geojson: fcLineString },
            {
              type: 'polyline'
            }
          )
        ).unsafeCoerce()
      ).toHaveProperty('name', 'line.poly');
    });
  });

  describe('GeoJSON', () => {
    const OPTIONS = {
      ...DEFAULT_IMPORT_OPTIONS,
      type: GeoJSON.id
    } as const;

    it('forward', async () => {
      const point = { type: 'Point', coordinates: [0, 0] };
      const pointFeature = {
        type: 'Feature',
        properties: { x: 1 },
        geometry: { type: 'Point', coordinates: [0, 0] }
      };

      expect(
        (
          await GeoJSON.forwardString(JSON.stringify(point), OPTIONS)
        ).unsafeCoerce()
      ).toHaveProperty('geojson', {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: point
          }
        ]
      });

      const featureOut = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { x: 1 },
            geometry: point
          }
        ]
      };
      expect(
        (
          await GeoJSON.forwardString(JSON.stringify(pointFeature), OPTIONS)
        ).unsafeCoerce()
      ).toHaveProperty('geojson', featureOut);
      expect(
        (
          await GeoJSON.forwardString(JSON.stringify(featureOut), OPTIONS)
        ).unsafeCoerce()
      ).toHaveProperty('geojson', featureOut);
    });
    it('back', async () => {
      expect(
        (
          await GeoJSON.back(
            {
              featureMap: new Map()
            },
            {
              type: 'geojson',
              geojsonOptions: {
                winding: 'RFC7946',
                truncate: false,
                addBboxes: true,
                includeId: false,
                indent: true
              }
            }
          )
        ).unsafeCoerce()
      ).toHaveProperty('name', 'features.geojson');
    });
  });
});
