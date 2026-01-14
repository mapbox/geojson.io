import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GeometryActions } from 'app/components/context_actions/geometry_actions';
import { CMContent, VisibilityToggleIcon } from 'app/components/elements';
import { useZoomTo } from 'app/hooks/use_zoom_to';
import { usePersistence } from 'app/lib/persistence/context';
import type { IPersistence } from 'app/lib/persistence/ipersistence';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { ContextMenu as CM } from 'radix-ui';
import { memo, useCallback } from 'react';
import { USelection } from 'state';
import { dataAtom, selectionAtom } from 'state/jotai';
import type { JsonValue } from 'type-fest';
import type { IWrappedFeature } from 'types';
import type { FlattenedFeature } from './math';

const visibilityToggleClass =
  'hidden opacity-30 hover:opacity-100 group-hover:inline-block pr-2';

function ItemInner({
  item,
  preview,
  overlay,
  treeCurrentValueRef
}: {
  item: FlattenedFeature;
  preview: string | null;
  overlay: boolean;
  treeCurrentValueRef: React.MutableRefObject<FlattenedFeature[]>;
}) {
  const rep = usePersistence();

  return (
    <ItemFeature
      overlay={overlay}
      item={item}
      rep={rep}
      preview={preview}
      treeCurrentValueRef={treeCurrentValueRef}
    />
  );
}

function toggleFeatureVisibility(
  feature: IWrappedFeature,
  force?: boolean
): IWrappedFeature {
  const newProperties = { ...feature.feature.properties };
  const wasVisible =
    force !== undefined ? force : newProperties.visibility === false;
  if (wasVisible) {
    delete newProperties.visibility;
  } else {
    newProperties.visibility = false;
  }
  return {
    ...feature,
    feature: {
      ...feature.feature,
      properties: newProperties
    }
  };
}

function Spacer({
  selected,
  feature = false,
  depth
}: {
  selected: false | 'direct' | 'secondary';
  feature?: boolean;
  depth: number;
}) {
  return (
    <div
      className={
        selected
          ? 'border-mb-blue-300 dark:border-mb-blue-300'
          : 'border-gray-200 dark:border-gray-700'
      }
      style={{
        height: 2,
        borderLeftWidth: depth * 16,
        marginRight: feature ? 16 : 0
      }}
    />
  );
}

function ItemFeature({
  item,
  rep,
  preview,
  overlay,
  treeCurrentValueRef
}: {
  item: FlattenedFeature;
  rep: IPersistence;
  preview: string | null;
  overlay: boolean;
  treeCurrentValueRef: React.MutableRefObject<FlattenedFeature[]>;
}) {
  const [sel, setSelection] = useAtom(selectionAtom);
  const zoomTo = useZoomTo();
  const feature = item.data;
  const { depth } = item;
  const selected = USelection.isSelected(sel, feature.id);
  const geometryLabel = feature.feature.geometry?.type || 'Null geometry';
  const previewVal = limitPreviewValue(
    (preview && feature.feature.properties?.[preview]) as JsonValue
  );
  const transact = rep.useTransact();

  const handleToggleVisibility = useAtomCallback(
    useCallback(
      (get, _set, e: React.MouseEvent<HTMLDivElement>) => {
        const data = get(dataAtom);
        e.stopPropagation();
        const selectedFeatures = USelection.getSelectedFeatures(data);
        if (selectedFeatures.length > 1) {
          const force = feature.feature.properties?.visibility === false;
          void transact({
            note: 'Toggled a feature’s visibility',
            track: 'feature-toggle-visibility',
            putFeatures: selectedFeatures.map((feature) =>
              toggleFeatureVisibility(feature, force)
            )
          });
        } else {
          void transact({
            note: 'Toggled a feature’s visibility',
            putFeatures: [toggleFeatureVisibility(feature)]
          });
        }
      },
      [feature, transact]
    )
  );

  const selState = selected ? 'direct' : false;

  return (
    <button
      type="button"
      className={sharedStyle({
        selected: selState,
        overlay
      })}
      onDoubleClick={() => {
        void zoomTo([feature]);
      }}
      onClick={(e) => {
        setSelection((oldSelection) => {
          if (e.metaKey) {
            return USelection.toggleSelectionId(oldSelection, feature.id);
          } else if (e.shiftKey) {
            const ids = USelection.toIds(oldSelection);

            if (ids.length === 0) {
              return USelection.single(feature.id);
            }

            const treeValue = treeCurrentValueRef.current;

            const idx = treeValue.findIndex((item) => item.id === feature.id);
            const range = { min: idx, max: idx };

            const idSet = new Set(ids);

            for (let idx = 0; idx < treeValue.length; idx++) {
              // Only consider items that will expand the range.
              if (idx < range.min || idx > range.max) {
                const item = treeValue[idx];
                if (idSet.has(item.id)) {
                  if (idx < range.min) range.min = idx;
                  if (idx > range.max) range.max = idx;
                }
              }
            }

            const newIds: string[] = [];

            for (let i = range.min; i < range.max + 1; i++) {
              const item = treeValue[i];
              if (item?.kind === 'feature') {
                newIds.push(item.id);
              }
            }

            return USelection.fromIds(newIds);
          }
          return USelection.single(feature.id);
        });
      }}
      data-at={item.at}
    >
      <Spacer selected={selState} depth={depth} feature />
      <span className="block select-none truncate flex-auto">
        {previewVal ? (
          <>
            {previewVal} <span className="opacity-20">{geometryLabel}</span>
          </>
        ) : (
          geometryLabel
        )}
      </span>
      <div
        role="checkbox"
        title="Toggle visibility"
        onClick={handleToggleVisibility}
        className={visibilityToggleClass}
        aria-checked={feature.feature.properties?.visibility !== false}
      >
        <VisibilityToggleIcon
          visibility={feature.feature.properties?.visibility !== false}
        />
      </div>
    </button>
  );
}

function limitPreviewValue(previewVal: JsonValue): string | undefined {
  if (typeof previewVal === 'number') {
    previewVal = previewVal.toString();
  }
  if (typeof previewVal === 'string') {
    previewVal = previewVal.slice(0, 32);
  } else {
    return undefined;
  }
  return previewVal;
}

export const OverlayItem = ({
  id,
  item,
  preview,
  treeCurrentValueRef,
  ...props
}: {
  id: UniqueIdentifier;
  preview: string | null;
  item: FlattenedFeature;
  treeCurrentValueRef: React.MutableRefObject<FlattenedFeature[]>;
}) => {
  return (
    <div className="absolute" {...props}>
      <ItemInner
        treeCurrentValueRef={treeCurrentValueRef}
        item={item}
        overlay
        preview={preview}
      />
    </div>
  );
};

function FeatureContextMenu({ item }: { item: FlattenedFeature }) {
  return (
    <GeometryActions selectedWrappedFeatures={[item.data]} as="context-item" />
  );
}

export const SortableItem = memo(function SortableItem({
  id,
  item,
  preview,
  isDragging,
  treeCurrentValueRef,
  depth,
  highlight
}: {
  id: UniqueIdentifier;
  item: FlattenedFeature;
  preview: string | null;
  isDragging: boolean;
  treeCurrentValueRef: React.MutableRefObject<FlattenedFeature[]>;
  depth: number;
  highlight: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id });

  const style: React.HTMLAttributes<HTMLDivElement>['style'] = {
    transform: CSS.Transform.toString(transform),
    transition,
    /**
     * Prevent the page from scrolling on an iPad
     */
    touchAction: 'none'
  };

  return (
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
      className={clsx(
        isDragging ? 'opacity-100' : '',
        highlight &&
          'ring-2 ring-mb-blue-500 ring-inset bg-opacity-20 bg-mb-blue-300 dark:bg-mb-blue-700'
      )}
    >
      {isDragging ? (
        <div
          style={{
            height: 0,
            paddingLeft: 16 + depth * 16
          }}
        >
          <div
            className="rounded-sm bg-mb-blue-300 border border-mb-blue-700"
            style={{
              height: 4
            }}
          ></div>
        </div>
      ) : (
        <CM.Root>
          <CM.Trigger>
            <ItemInner
              overlay={false}
              preview={preview}
              item={item}
              treeCurrentValueRef={treeCurrentValueRef}
            />
          </CM.Trigger>
          <CM.Portal>
            <CMContent>
              <FeatureContextMenu item={item} />
            </CMContent>
          </CM.Portal>
        </CM.Root>
      )}
    </div>
  );
});

function sharedStyle({
  selected,
  overlay,
  visibility = true
}: {
  selected: false | 'direct' | 'secondary';
  overlay: boolean;
  visibility?: boolean;
}) {
  return clsx(
    `text-xs block w-full
    text-left
    flex items-center
    py-1
    border-gray-100
    dark:text-white`,
    visibility ? '' : 'text-gray-500 dark:text-gray-400',
    selected === 'direct'
      ? 'bg-opacity-20 bg-mb-blue-300 dark:bg-purple-800'
      : selected === 'secondary'
      ? 'bg-opacity-20 bg-purple-200 dark:bg-mb-blue-700'
      : `hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-200 dark:focus:bg-gray-700`,
    overlay ? 'px-4 rounded-sm ring-1 ring-gray-500 shadow-md opacity-60' : ''
  );
}
