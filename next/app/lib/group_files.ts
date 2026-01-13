import type { ShapefileGroup } from 'app/lib/convert/shapefile';
import { getExtension } from 'app/lib/convert/utils';
import remove from 'lodash/remove';

export type FileGroups = Array<FileGroup | ShapefileGroup>;

export type { ShapefileGroup };

export interface FileGroup {
  type: 'file';
  file: File;
}

function asFileGroup(file: File): FileGroup {
  return { type: 'file' as const, file };
}

function asShapefileGroup(file: File): ShapefileGroup {
  return {
    type: 'shapefile',
    files: {
      shp: file
    }
  };
}

function isShp(file: File): boolean {
  return getExtension(file.name) === '.shp';
}

/**
 * Take unorganized files in a list of File objects
 * and attempt to group them into shapefile groups
 * and other freestanding files.
 */
export function groupFiles(files: readonly File[]): FileGroups {
  const pool = Array.from(files);

  const shapefileGroups = remove(pool, (file) => isShp(file)).map((file) =>
    asShapefileGroup(file)
  );

  function addGroup(group: ShapefileGroup, ext: keyof ShapefileGroup['files']) {
    const base = group.files.shp.name.replace(/\.shp$/, '');
    const toAdd = remove(pool, (file) => file.name === `${base}.${ext}`);
    if (toAdd.length) {
      group.files[ext] = toAdd[0];
    }
  }

  for (const group of shapefileGroups) {
    addGroup(group, 'shx');
    addGroup(group, 'prj');
    addGroup(group, 'dbf');
    addGroup(group, 'cpg');
  }

  return [...pool.map((file) => asFileGroup(file)), ...shapefileGroups];
}
