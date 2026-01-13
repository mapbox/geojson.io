import {
  type CollisionDescriptor,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type UniqueIdentifier
} from '@dnd-kit/core';
import type { ClientRect } from '@dnd-kit/core/dist/types';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { LEFT_PANEL_ROW_HEIGHT } from 'app/lib/constants';
import { usePersistence } from 'app/lib/persistence/context';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { captureException } from 'integrations/errors';
import { useAtomValue } from 'jotai';
import isEqual from 'lodash/isEqual';
import { Portal } from 'radix-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { USelection } from 'state';
import { dataAtom, type Sel, splitsAtom } from 'state/jotai';
import { FeatureEditorFolderHeader } from './feature_editor_folder/header';
import { useCustomSensors } from './feature_editor_folder/hooks';
import { OverlayItem, SortableItem } from './feature_editor_folder/items';
import {
  type FlattenedFeature,
  getProjection,
  indentationWidth,
  useFlattenedFeatures
} from './feature_editor_folder/math';
import { virtualPosition } from './feature_editor_folder/utils';

/**
 * Returns the coordinates of the center of a given ClientRect
 */
function verticalCenterOfRectangle(rect: ClientRect): number {
  return rect.top + rect.height * 0.5;
}

/**
 * Returns the closest rectangles from an array of rectangles to
 * pointer.
 */
const closestVerticalCenter: CollisionDetection = ({
  pointerCoordinates,
  droppableRects,
  droppableContainers
}) => {
  const centerRect = pointerCoordinates?.y || 0;
  let closest: CollisionDescriptor | null = null;

  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);

    if (rect) {
      const distBetween = Math.abs(
        verticalCenterOfRectangle(rect) - centerRect
      );

      if (!closest || distBetween < closest.data.value) {
        closest = { id, data: { droppableContainer, value: distBetween } };
      }
    }
  }

  return closest ? [closest] : [];
};

export function FeatureEditorFolder() {
  const splits = useAtomValue(splitsAtom);
  if (!splits.leftOpen) return null;
  return (
    <div
      style={{
        width: splits.left
      }}
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-900 relative"
    >
      <div className="absolute inset-0 flex flex-col">
        <FeatureEditorFolderInner />
      </div>
    </div>
  );
}

/**
 * Find the item **before** this item by traversing
 * the tree starting with the element before its new
 * location and backtracking.
 */
function findBeforeAt({
  newIndex,
  myDepth,
  sortedItems
}: {
  newIndex: number;
  myDepth: number;
  sortedItems: FlattenedFeature[];
}) {
  for (let i = newIndex - 1; i >= 0; i--) {
    // console.log(i, sortedItems[i].depth, myDepth);
    if (sortedItems[i].depth < myDepth) {
      break;
    } else if (sortedItems[i].depth === myDepth) {
      return sortedItems[i].at;
    } else {
      // console.log("skipping because depth >", sortedItems[i]);
    }
  }
  return null;
}

/*
 * Find the item **after** this item by traversing
 * the tree starting after it.
 */
function findAfterAt({
  newIndex,
  myDepth,
  sortedItems
}: {
  newIndex: number;
  myDepth: number;
  sortedItems: FlattenedFeature[];
}) {
  for (let i = newIndex + 1; i < sortedItems.length; i++) {
    // console.log("after", i, sortedItems[i].depth, myDepth);
    if (sortedItems[i].depth < myDepth) {
      break;
    } else if (sortedItems[i].depth === myDepth) {
      return sortedItems[i].at;
    } else {
      // console.log("skipping because depth >", sortedItems[i]);
    }
  }
  return null;
}

export function FeatureEditorFolderInner() {
  const data = useAtomValue(dataAtom);
  const { featureMap, selection } = data;
  const rep = usePersistence();
  const [meta] = rep.useMetadata();
  const transact = rep.useTransact();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  /**
   * Required for virtualization
   */
  const parentRef = useRef<HTMLDivElement | null>(null);

  /**
   * Custom sensors let you both click & drag items in the list.
   */
  const sensors = useCustomSensors();

  /**
   * The idea here is that by shift-clicking items in the
   * tree, you can do a span selection like in Finder. But
   * if we were to pass the whole tree to every item,
   * it'd re-render every item. So pass this "passively"
   */
  const treeCurrentValueRef = useRef<FlattenedFeature[]>([]);

  /**
   * Generate the tree: this is a flattened tree,
   * with features.
   */
  const tree = useFlattenedFeatures({ data, activeId });

  treeCurrentValueRef.current = tree;

  const projected =
    activeId && overId
      ? getProjection({
          tree,
          activeId,
          overId,
          offsetLeft,
          indentationWidth
        })
      : null;

  const activeItemIndex = useMemo(() => {
    return tree.findIndex(({ id }) => id === activeId);
  }, [tree, activeId]);

  const rowVirtualizer = useVirtualizer({
    count: tree.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(
      (index: number) => {
        return index === activeItemIndex ? 0 : LEFT_PANEL_ROW_HEIGHT;
      },
      [activeItemIndex]
    ),
    overscan: 10
  });

  const { scrollToIndex } = rowVirtualizer;
  const lastSelection = useRef<Sel | null>(null);

  /**
   * Scroll so that the newly-selected feature
   * is in the viewport
   */
  useEffect(() => {
    if (
      selection.type === 'none' ||
      isEqual(selection, lastSelection.current)
    ) {
      return;
    }

    switch (selection.type) {
      case 'single': {
        const idx = tree.findIndex((item) => {
          return item.kind === 'feature' && item.id === selection.id;
        });
        if (idx !== null && idx !== -1) {
          scrollToIndex(idx);
        }
        break;
      }
      case 'multi': {
        break;
      }
    }

    lastSelection.current = selection;
  }, [tree, selection, scrollToIndex, data, transact]);

  function resetState() {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
    setOverId(event.active.id);
  }

  function handleDragOver(evt: DragOverEvent) {
    const { over } = evt;
    setOverId(over?.id ?? null);
  }

  function handleDragMove(evt: DragMoveEvent) {
    const { delta } = evt;
    setOffsetLeft(delta.x);
  }

  function handleDragEnd(evt: DragEndEvent) {
    const { active, over } = evt;
    resetState();

    if (projected && over) {
      const { depth } = projected;
      const clonedItems: FlattenedFeature[] = tree.slice();
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];
      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      const newIndex = sortedItems.findIndex((item) => item.id === active.id);
      const myDepth = depth;
      /*
       * Find the item **before** this item by traversing
       * the tree starting with the element before its new
       * location and backtracking.
       */
      const beforeAt = findBeforeAt({ newIndex, myDepth, sortedItems });
      const afterAt = findAfterAt({ newIndex, myDepth, sortedItems });

      let at = activeTreeItem.at;

      try {
        at = generateKeyBetween(beforeAt, afterAt);
      } catch (e) {
        // console.error("key generation failed", e);
        captureException(e);
      }

      switch (activeTreeItem.kind) {
        case 'feature': {
          if (selection.type === 'multi') {
            try {
              const wrappedFeatures = USelection.getSelectedFeatures(data);
              const ats = generateNKeysBetween(
                beforeAt,
                afterAt,
                wrappedFeatures.length
              );
              void transact({
                note: 'Changed the order of features',
                putFeatures: wrappedFeatures.map((wrappedFeature, i) => {
                  return {
                    ...wrappedFeature,
                    at: ats[i]
                  };
                })
              });
            } catch (e) {
              // console.error("key generation failed", e);
              captureException(e);
            }
          } else {
            void transact({
              note: 'Changed the order of a feature',
              putFeatures: [
                {
                  ...activeTreeItem.data,
                  at
                }
              ]
            });
          }
          break;
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <FeatureEditorFolderHeader featureMap={featureMap} />
      <SortableContext items={tree} strategy={verticalListSortingStrategy}>
        <div
          ref={parentRef}
          data-keybinding-scope="editor_folder"
          className="geojsonio-scrollbar overflow-y-scroll flex-auto group"
        >
          <div
            className="relative w-full"
            style={{
              willChange: 'transform',
              height: `${rowVirtualizer.getTotalSize()}px`
            }}
          >
            {rowVirtualizer.getVirtualItems().map((row) => {
              const item = tree[row.index];
              const isDragging = activeId === item.id;

              return (
                <div key={row.index} style={virtualPosition(row)}>
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    treeCurrentValueRef={treeCurrentValueRef}
                    depth={
                      item.id === activeId && projected
                        ? projected.depth
                        : item.depth
                    }
                    highlight={false}
                    item={item}
                    preview={meta.label}
                    isDragging={isDragging}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </SortableContext>
      <Portal.Root>
        <DragOverlay dropAnimation={null} className="bg-transparent">
          {activeId ? (
            <OverlayItem
              preview={meta.label}
              id={activeId}
              treeCurrentValueRef={treeCurrentValueRef}
              item={tree.find((item) => item.id === activeId)!}
            />
          ) : null}
        </DragOverlay>
      </Portal.Root>
    </DndContext>
  );
}
