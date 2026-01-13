import type { Folder, Root } from '@tmcw/togeojson';
import type { ConvertResult } from 'app/lib/convert/utils';
import type { Feature, FeatureCollection } from 'types';

function flattenRoot(root: Root | Folder, features: Feature[] = []) {
  for (const child of root.children) {
    switch (child.type) {
      case 'Feature': {
        features.push(child);
        break;
      }
    }
  }

  return features;
}

export function flattenResult(result: ConvertResult): FeatureCollection {
  switch (result.type) {
    case 'geojson':
      return result.geojson;
    case 'root':
      return {
        type: 'FeatureCollection',
        features: flattenRoot(result.root)
      };
  }
}
