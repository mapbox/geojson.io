import * as E from 'app/components/elements';
import { styledCheckbox } from 'app/components/elements';
import LAYERS from 'app/lib/default_styles';
import {
  activeStyleIdAtom,
  styleOptionsAtom,
  customRasterLayersAtom,
  type CustomRasterLayer
} from 'state/jotai';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom } from 'state/jotai';
import { DialogHelpers } from 'state/dialog_helpers';
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  DragHandleDots2Icon,
  EyeOpenIcon,
  EyeNoneIcon
} from '@radix-ui/react-icons';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';
import { toast } from 'react-hot-toast';

const SortableRasterLayer = memo(function SortableRasterLayer({
  layer,
  onEdit,
  onDelete,
  onToggleVisibility
}: {
  layer: CustomRasterLayer;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: layer.id });

  const style: React.HTMLAttributes<HTMLDivElement>['style'] = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        aria-label="Drag to reorder"
      >
        <DragHandleDots2Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{layer.name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {layer.tileUrl}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleVisibility}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          type="button"
          aria-label={layer.visible !== false ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible !== false ? (
            <EyeOpenIcon className="w-4 h-4" />
          ) : (
            <EyeNoneIcon className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onEdit}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          type="button"
          aria-label="Edit layer"
        >
          <Pencil1Icon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-200 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
          type="button"
          aria-label="Delete layer"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export function StylesPopover() {
  const [activeStyleId, setActiveStyleId] = useAtom(activeStyleIdAtom);
  const [styleOptions, setStyleOptions] = useAtom(styleOptionsAtom);
  const [customRasterLayers, setCustomRasterLayers] = useAtom(
    customRasterLayersAtom
  );
  const setDialogState = useSetAtom(dialogAtom);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const handleAddRasterLayer = () => {
    setDialogState(DialogHelpers.addRasterLayer());
  };

  const handleEditRasterLayer = (layer: {
    id: string;
    name: string;
    tileUrl: string;
  }) => {
    setDialogState(DialogHelpers.editRasterLayer(layer));
  };

  const handleDeleteRasterLayer = (id: string) => {
    setCustomRasterLayers(customRasterLayers.filter((l) => l.id !== id));
    toast.success('Raster layer removed');
  };

  const handleToggleVisibility = (id: string) => {
    setCustomRasterLayers(
      customRasterLayers.map((layer) =>
        layer.id === id
          ? { ...layer, visible: layer.visible !== false ? false : true }
          : layer
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = customRasterLayers.findIndex((l) => l.id === active.id);
      const newIndex = customRasterLayers.findIndex((l) => l.id === over.id);

      const newLayers = arrayMove(customRasterLayers, oldIndex, newIndex);
      // Update order values
      newLayers.forEach((layer, i) => {
        layer.order = i;
      });
      setCustomRasterLayers(newLayers);
    }
  };

  return (
    <div>
      <div className="flex justify-between pb-2">
        <div className="font-bold">Basemap</div>
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-row gap-4 p-2 overflow-x-auto">
          {Object.entries(LAYERS).map(([id, layer]) => {
            const isActive = id === activeStyleId;
            // Image file convention: public/layer-icons/{id}.png (or .jpg, .svg, etc.)
            // You will need to place the images in public/layer-icons/ with the correct names
            const iconSrc = `/next/layer-icons/${id}.png`;
            return (
              <div key={id} className="flex flex-col items-center">
                <button
                  className={`w-16 h-16 rounded border flex items-center justify-center transition-colors ${
                    isActive
                      ? 'border-blue-500 ring-4 ring-blue-400 bg-blue-100 ring-offset-2'
                      : 'border-gray-400 bg-gray-200'
                  }`}
                  aria-label={`Select ${layer.name}`}
                  onClick={() => setActiveStyleId(id)}
                  type="button"
                >
                  <img
                    src={iconSrc}
                    alt={layer.name}
                    className="w-full h-full object-cover rounded"
                    style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                    onError={(e) => {
                      // Hide image if not found
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </button>
                <div className="text-xs mt-1 text-center">{layer.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Style options panel */}

      <div className="px-2 py-3">
        {/* Disable label visibility option for OSM style since it is a style with a raster layer */}
        {activeStyleId !== 'OSM' ? (
          <label className="flex items-center gap-x-2">
            <input
              type="checkbox"
              checked={styleOptions.labelVisibility}
              onChange={(e) =>
                setStyleOptions({
                  ...styleOptions,
                  labelVisibility: e.target.checked
                })
              }
              className={styledCheckbox({ variant: 'default' })}
            />
            <E.StyledLabelSpan size="xs">Show map labels</E.StyledLabelSpan>
          </label>
        ) : (
          <span className="flex items-center gap-x-2 opacity-50 cursor-not-allowed">
            <input
              type="checkbox"
              checked={false}
              disabled
              className={styledCheckbox({ variant: 'default' })}
            />
            <E.StyledLabelSpan size="xs" style={{ color: '#888' }}>
              Show map labels
            </E.StyledLabelSpan>
          </span>
        )}
      </div>

      {/* Raster Layers section */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between pb-2 px-2">
          <div className="font-bold">Raster Layers</div>
          <button
            onClick={handleAddRasterLayer}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            type="button"
            aria-label="Add raster layer"
          >
            <PlusIcon />
            Add Layer
          </button>
        </div>

        {customRasterLayers.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={customRasterLayers.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 px-2 max-h-48 overflow-y-auto">
                {customRasterLayers.map((layer) => (
                  <SortableRasterLayer
                    key={layer.id}
                    layer={layer}
                    onEdit={() => handleEditRasterLayer(layer)}
                    onDelete={() => handleDeleteRasterLayer(layer.id)}
                    onToggleVisibility={() => handleToggleVisibility(layer.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
