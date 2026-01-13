import { describe, expect, it } from 'vitest';

import { groupFiles } from './group_files';

function f(names: string[]) {
  return names.map((name) => {
    return {
      name
    } as File;
  });
}

describe('groupFiles', () => {
  it('single geojson', () => {
    expect(groupFiles(f(['x.geojson']))).toEqual([
      {
        type: 'file',
        file: {
          name: 'x.geojson'
        }
      }
    ]);
  });
  it('two geojson', () => {
    expect(groupFiles(f(['x.geojson', 'y.geojson']))).toEqual([
      {
        type: 'file',
        file: {
          name: 'x.geojson'
        }
      },
      {
        type: 'file',
        file: {
          name: 'y.geojson'
        }
      }
    ]);
  });
  it('shapefile', () => {
    expect(groupFiles(f(['x.geojson', 'z.shp', 'y.geojson']))).toEqual([
      {
        type: 'file',
        file: {
          name: 'x.geojson'
        }
      },
      {
        type: 'file',
        file: {
          name: 'y.geojson'
        }
      },
      {
        type: 'shapefile',
        files: {
          shp: {
            name: 'z.shp'
          }
        }
      }
    ]);
  });
  it('shapefile - 3 parts', () => {
    expect(groupFiles(f(['z.prj', 'z.shp', 'z.dbf']))).toEqual([
      {
        type: 'shapefile',
        files: {
          shp: {
            name: 'z.shp'
          },
          dbf: {
            name: 'z.dbf'
          },
          prj: {
            name: 'z.prj'
          }
        }
      }
    ]);
  });
});
