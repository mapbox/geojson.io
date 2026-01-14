import type { ConvertError } from 'app/lib/errors';
import { type GeojsonIOError, parseOrError } from 'app/lib/errors';
import type { AsyncZippable } from 'fflate';
import groupBy from 'lodash/groupBy';
import { EitherAsync } from 'purify-ts/EitherAsync';
import type { FeatureCollection, GeometryCollection } from 'types';
import type { ExportOptions, ExportResult, FileType, ImportOptions } from '.';
import { unzip } from './local/shared';
import { type ConvertResult, getExtension, okResult } from './utils';

/**
 * Dirty workaround for avoiding some mapshaper complexity.
 * This is the result of
 * destStr = expandProjDefn(opts.crs (EPSG:4326), dataset);
 * destInfo = getCrsInfo(destStr)
 */
const EPSG_4236 = {
  params: {
    init: {
      used: true,
      param: 'epsg:4326'
    },
    proj: {
      used: true,
      param: 'longlat'
    },
    datum: {
      used: true,
      param: 'WGS84'
    },
    no_defs: {
      used: true,
      param: true
    },
    ellps: {
      used: true,
      param: 'WGS84'
    },
    towgs84: {
      used: true,
      param: '0,0,0'
    },
    a: {
      used: true,
      param: '6378137.0'
    },
    rf: {
      used: true,
      param: '298.257223563'
    }
  },
  is_latlong: true,
  is_geocent: false,
  is_long_wrap_set: false,
  long_wrap_center: 0,
  axis: 'enu',
  gridlist: null,
  gridlist_count: 0,
  vgridlist_geoid: null,
  vgridlist_geoid_count: 0,
  datum_params: [0, 0, 0, 0, 0, 0, 0],
  datum_type: 1,
  es: 0.0066943799901413165,
  a: 6378137,
  a_orig: 6378137,
  es_orig: 0.0066943799901413165,
  e: 0.08181919084262149,
  ra: 1.567855942887398e-7,
  one_es: 0.9933056200098587,
  rone_es: 1.0067394967422765,
  geoc: false,
  over: false,
  has_geoid_vgrids: false,
  lam0: 0,
  phi0: 0,
  x0: 0,
  y0: 0,
  k0: 1,
  fr_meter: 1,
  to_meter: 1,
  vto_meter: 1,
  vfr_meter: 1,
  from_greenwich: 0
};

function asArray(input: ArrayBuffer | string) {
  if (typeof input === 'string') {
    const encoder = new TextEncoder();
    return encoder.encode(input);
  } else {
    return new Uint8Array(input);
  }
}

type Content =
  | {
      content: ArrayBufferLike | string;
    }
  | undefined;

interface Obj {
  shp: Content;
  shx: Content;
  dbf: Content;
  prj: Content;
  cpg: Content;
}

async function importAndReproject(obj: Obj) {
  const { importContent } = await import(
    'vendor/mapshaper/io/mapshaper-import'
  );
  const { exportFileContent } = await import(
    'vendor/mapshaper/io/mapshaper-export'
  );
  const { projectDataset } = await import(
    'vendor/mapshaper/commands/mapshaper-proj'
  );
  const { parsePrj } = await import(
    'vendor/mapshaper/crs/mapshaper-projections'
  );

  const out = importContent(obj);

  if (out.info?.prj) {
    projectDataset(out, parsePrj(out.info.prj), EPSG_4236, {});
  }

  const exported = exportFileContent(out, {
    format: 'geojson'
  });

  return parseOrError<FeatureCollection | GeometryCollection>(
    // eslint-disable-next-line
    exported[0]?.content?.toString('utf8')
  );
}

function normalizeGeometryCollection(
  geojson: FeatureCollection | GeometryCollection
): FeatureCollection {
  /**
   * If there is no dbf associated, Mapshaper will produce a GeometryCollection
   * https://github.com/mbloch/mapshaper/blob/434d3a71a9cbd97e797a34cdfe43d988c834cfe3/src/geojson/geojson-export.js#L165-L186
   */
  if (geojson.type === 'GeometryCollection') {
    return {
      type: 'FeatureCollection',
      features: geojson.geometries.map((geometry) => {
        return {
          type: 'Feature',
          properties: {},
          geometry
        };
      })
    };
  }
  return geojson;
}

export interface ShapefileGroup {
  type: 'shapefile';
  files: {
    shp: File;
    shx?: File;
    prj?: File;
    dbf?: File;
    cpg?: File;
  };
}

class CShapefile implements FileType {
  id = 'shapefile' as const;
  label = ['ESRI Shapefile'];
  extensions = ['.zip'];
  filenames = [] as string[];
  mimes = [] as string[];
  forwardLoose(file: ShapefileGroup, _options?: ImportOptions) {
    return EitherAsync<ConvertError, ConvertResult>(
      async function forwardShapefile({ fromPromise }) {
        const obj: Obj = {
          shp: await file.files.shp
            .arrayBuffer()
            .then((content) => ({ content })),
          shx: await file.files.shx
            ?.arrayBuffer()
            .then((content) => ({ content })),
          prj: await file.files.prj?.text().then((content) => ({ content })),
          cpg: await file.files.cpg
            ?.text()
            .then((content) => ({ content: content.trim() })),
          dbf: await file.files.dbf
            ?.arrayBuffer()
            .then((content) => ({ content }))
        };

        const geojson = await fromPromise(importAndReproject(obj));

        return okResult(normalizeGeometryCollection(geojson));
      }
    );
  }
  forwardBinary(file: ArrayBuffer, _options?: ImportOptions) {
    return EitherAsync<GeojsonIOError, ConvertResult>(
      async function forwardShapefile({ fromPromise }) {
        const unzipped = await unzip(file);
        const fileNames = Object.keys(unzipped);
        const byExt = groupBy(fileNames, (filename) =>
          getExtension(filename).replace(/^\./, '')
        );

        const { shp = [], cpg = [], shx = [], prj = [], dbf = [] } = byExt;

        function shortest(types: string[]) {
          if (!types.length) return undefined;
          const name = types.sort((a, b) => a.length - b.length)[0];
          return {
            content: unzipped[name].buffer
          };
        }

        function shortestString(types: string[]) {
          if (!types.length) return undefined;
          const name = types.sort((a, b) => a.length - b.length)[0];
          const file = unzipped[name];
          const content = new TextDecoder().decode(
            file.buffer as unknown as ArrayBuffer
          );
          return { content };
        }

        const obj: Obj = {
          shp: shortest(shp),
          shx: shortest(shx),
          dbf: shortest(dbf),
          cpg: shortestString(cpg),
          prj: shortestString(prj)
        };

        const geojson = await fromPromise(importAndReproject(obj));

        return okResult(normalizeGeometryCollection(geojson));
      }
    );
  }
  back({ geojson }: { geojson: FeatureCollection }, _options: ExportOptions) {
    return EitherAsync<ConvertError, ExportResult>(
      async function backShapefile() {
        const { importContent } = await import(
          'vendor/mapshaper/io/mapshaper-import'
        );
        const { exportFileContent } = await import(
          'vendor/mapshaper/io/mapshaper-export'
        );
        const fflate = await import('fflate');

        const out = importContent({
          json: {
            content: JSON.stringify(geojson),
            filename: 'input.geojson'
          }
        });

        const exported = exportFileContent(out, {
          format: 'shapefile'
        });

        const zippable: AsyncZippable = Object.fromEntries(
          // eslint-disable-next-line
          exported.map((e: any) => {
            // eslint-disable-next-line
            return [e.filename, asArray(e.content)];
          })
        );

        const zip = await new Promise<Uint8Array>((resolve, reject) => {
          fflate.zip(zippable, {}, (err, res) => {
            if (err) return reject(err);
            resolve(res);
          });
        });

        return {
          blob: new Blob([zip]),
          name: 'shapefile.zip'
        };
      }
    );
  }
}

export const Shapefile = new CShapefile();
