import type { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Root, Folder as TFolder } from '@tmcw/togeojson';
import { sortByAt } from 'app/lib/parse_stored';
import { useMemo } from 'react';
import type { Data } from 'state/jotai';
import type { Feature, FeatureMap, IWrappedFeature } from 'types';

export const indentationWidth = 16;

export interface FlattenedFeature {
  kind: 'feature';
  at: string;
  data: IWrappedFeature;
  id: string;
  depth: number;
}

interface Sortable {
  at: string;
  id: string;
  data: Feature | TFolder;
}

function featureToFlat(
  feature: IWrappedFeature,
  depth: number
): FlattenedFeature {
  return {
    at: feature.at,
    id: feature.id,
    kind: 'feature',
    depth,
    data: feature
  };
}

export function solveRootItems(featureMap: FeatureMap): Root {
  // Collect all features from featureMap, sort, and return as root children
  const features: Sortable[] = Array.from(featureMap.values()).map(
    (wrappedFeature) => ({
      id: wrappedFeature.id,
      at: wrappedFeature.at,
      data: wrappedFeature.feature
    })
  );

  const children = sortByAt(features).map((item) => item.data);

  return {
    type: 'root',
    children
  };
}

/**
 * For the left-side UI that shows a draggable list of features,
 * this generates a flattened setup of those features.
 */
export function useRootItems({ featureMap }: { featureMap: FeatureMap }): Root {
  return useMemo(() => {
    return solveRootItems(featureMap);
  }, [featureMap]);
}

/**
 * For the left-side UI that shows a draggable list of features,
 * this generates a flattened setup of those features.
 *
 * activeId lets us hide items that are under folders
 * that are being dragged.
 */
export function useFlattenedFeatures({
  data,
  activeId
}: {
  data: Data;
  activeId: UniqueIdentifier | null;
}) {
  return useMemo(() => {
    const items: FlattenedFeature[] = [];

    for (const feature of data.featureMap.values()) {
      items.push(featureToFlat(feature, 0));
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, activeId]);
}

/**
 * Round a drag x coordinate to a depth level.
 */
function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

/**
 * Derived from dndkit: this method helps figure out where
 * the given feature or folder is going to be dropped.
 */
export function getProjection({
  tree,
  activeId,
  overId,
  offsetLeft,
  indentationWidth
}: {
  tree: FlattenedFeature[];
  activeId: UniqueIdentifier;
  overId: UniqueIdentifier;
  offsetLeft: number;
  indentationWidth: number;
}) {
  const overItemIndex = tree.findIndex(({ id }) => id === overId);
  const activeItemIndex = tree.findIndex(({ id }) => id === activeId);

  const activeItem = tree[activeItemIndex];

  const newItems = arrayMove(tree, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];

  const dragDepth = getDragDepth(offsetLeft, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = getMaxDepth({
    previousItem
  });
  const minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return {
    depth,
    maxDepth,
    minDepth
  };
}

function getMaxDepth({ previousItem }: { previousItem: FlattenedFeature }) {
  if (previousItem?.kind === 'feature') {
    return previousItem.depth;
  }

  return 0;
}

function getMinDepth({ nextItem }: { nextItem: FlattenedFeature }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}
