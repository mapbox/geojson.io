import { getExtents } from 'app/lib/geometry';
import { generateSyntheticPoints } from 'app/lib/pmap/generate_synthetic_points';
import Flatbush from 'flatbush';
import uniq from 'lodash/uniq';
import { USelection } from 'state';
import type { Sel } from 'state/jotai';
import type { IFeature, IWrappedFeature, Point } from 'types';
import { decodeId } from './id';

export const EmptyIndex = {
  type: 'none',
  search: () => {
    return USelection.none();
  }
} as const;

export type FlatbushLike =
  | typeof EmptyIndex
  | FlatbushFeatureIndex
  | FlatbushVertexIndex;

type Box = [Pos2, Pos2];

function boxTosearchArgs(box: Box): [number, number, number, number] {
  const minX = Math.min(box[0][0], box[1][0]);
  const maxX = Math.max(box[0][0], box[1][0]);
  const minY = Math.min(box[0][1], box[1][1]);
  const maxY = Math.max(box[0][1], box[1][1]);
  return [minX, minY, maxX, maxY];
}

class FlatbushFeatureIndex {
  type = 'feature' as const;
  private index: Flatbush;
  private features: IWrappedFeature[];

  /**
   * Since we split up multi features here,
   * this is a mapping from the split-extent to the original
   * feature.
   */
  private indexes: number[];

  constructor(features: IWrappedFeature[]) {
    this.indexes = [];
    /**
     * Flat array for performance.
     */
    const allExtents: number[] = [];
    for (let i = 0; i < features.length; i++) {
      const { feature } = features[i];
      const extents = getExtents(feature);
      for (const extent of extents) {
        allExtents.push(extent[0], extent[1], extent[2], extent[3]);
        this.indexes.push(i);
      }
    }
    const fb = new Flatbush(allExtents.length / 4);
    for (let i = 0; i < allExtents.length; i += 4) {
      fb.add(
        allExtents[i],
        allExtents[i + 1],
        allExtents[i + 2],
        allExtents[i + 3]
      );
    }
    fb.finish();
    this.features = features;
    this.index = fb;
  }

  search(box: Box, selection: Sel): Sel {
    const rawIndexes = uniq(this.index.search(...boxTosearchArgs(box)));
    const found = uniq(
      rawIndexes.map((rawIndex) => this.features[this.indexes[rawIndex]])
    );
    if (selection.type === 'multi' && selection.previousIds?.length) {
      const ids = selection.previousIds.slice();
      const setIds = new Set(ids);

      for (const { id } of found) {
        if (!setIds.has(id)) {
          ids.push(id);
        }
      }

      return {
        type: 'multi',
        ids: ids,
        previousIds: selection.previousIds
      };
    } else {
      return USelection.fromIds(found.map((f) => f.id));
    }
  }
}

class FlatbushVertexIndex {
  type = 'vertex' as const;
  private index: Flatbush;
  private vertexes: IFeature<Point>[];

  constructor(feature: IWrappedFeature, featureIndex: number) {
    const vertexes = generateSyntheticPoints(
      feature.feature,
      featureIndex
    ).filter((pt) => decodeId(pt.id as RawId).type === 'vertex');

    const fb = new Flatbush(vertexes.length);
    for (const feature of vertexes) {
      const [lng, lat] = feature.geometry.coordinates;
      fb.add(lng, lat, lng, lat);
    }
    fb.finish();

    this.vertexes = vertexes;
    this.index = fb;
  }

  search(box: Box, selection: Sel): Sel {
    if (selection.type !== 'single') return selection;
    const ids = this.index.search(...boxTosearchArgs(box));
    const parts = uniq(ids.map((id) => this.vertexes[id])).map(
      (f) => decodeId(f.id as RawId) as VertexId
    );
    return {
      type: 'single',
      id: selection.id,
      parts
    };
  }
}

// TODO: this should probably happen in a worker.
export function generateFeaturesFlatbushInstance(
  features: IWrappedFeature[]
): FlatbushLike {
  if (!features.length) return EmptyIndex;
  return new FlatbushFeatureIndex(features);
}

// TODO: this should probably happen in a worker.
export function generateVertexFlatbushInstance(
  feature: IWrappedFeature,
  index: number
): FlatbushLike {
  return new FlatbushVertexIndex(feature, index);
}
