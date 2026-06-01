import {
  AllSidesIcon,
  CopyIcon,
  Crosshair1Icon,
  DotIcon,
  GlobeIcon,
  LinkBreak2Icon,
  MaskOnIcon,
  MixIcon,
  TextIcon,
  TrashIcon
} from '@radix-ui/react-icons';
import { ToolbarTrigger } from 'app/components/context_actions';
import type {
  Action,
  ActionProps
} from 'app/components/context_actions/action_item';
import {
  type B3Variant,
  DDContent,
  StyledTooltipArrow,
  TContent
} from 'app/components/elements';
import { SingleActions } from 'app/components/single_actions';
import { useZoomTo } from 'app/hooks/use_zoom_to';
import {
  GEOJSON_MULTI_GEOMETRY_TYPES,
  MULTI_TO_SINGULAR
} from 'app/lib/constants';
import { newFeatureId } from 'app/lib/id';
import {
  addInnerRing,
  CanInnerRingResult,
  canInnerRing
} from 'app/lib/map_operations';
import { deleteFeatures } from 'app/lib/map_operations/delete_features';
import { divideFeatures } from 'app/lib/map_operations/divide_feature';
import { drawArc } from 'app/lib/map_operations/draw_arc';
import { drawCentroids } from 'app/lib/map_operations/draw_centroids';
import { drawLabelPoints } from 'app/lib/map_operations/draw_label_points';
import { duplicateFeatures } from 'app/lib/map_operations/duplicate_features';
import { usePersistence } from 'app/lib/persistence/context';
import { useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { DropdownMenu as DD, Tooltip } from 'radix-ui';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { dialogAtom } from 'state/dialog_state';
import { DialogHelpers } from 'state/dialog_helpers';
import { dataAtom, selectionAtom } from 'state/jotai';
import type { Geometry, IFeature, IWrappedFeature, Polygon } from 'types';
import { ActionItem } from './action_item';

export function useActions(
  selectedWrappedFeatures: IWrappedFeature[]
): Action[] {
  const rep = usePersistence();
  const transact = rep.useTransact();
  const selectedFeatures = selectedWrappedFeatures.map((f) => f.feature);
  const canInnerRingResult = canInnerRing(selectedFeatures);
  const setDialogState = useSetAtom(dialogAtom);
  const zoomTo = useZoomTo();

  const bufferFeaturesAction = {
    label: 'Buffer',
    applicable: true,
    icon: <AllSidesIcon />,
    onSelect: function doBufferFeatures() {
      setDialogState(DialogHelpers.buffer(selectedWrappedFeatures));
      return Promise.resolve();
    }
  };

  const geometriesThatYieldCentroids = new Set<Geometry['type']>([
    'Polygon',
    'MultiPolygon'
  ]);

  const supportsCentroids = selectedFeatures.some(
    (feature) =>
      feature.geometry?.type &&
      geometriesThatYieldCentroids.has(feature.geometry?.type)
  );

  const onCentroid = useAtomCallback(
    useCallback(
      // eslint-disable-next-line
      async (_get, set) => {
        const { newSelection, moment } = drawCentroids(selectedWrappedFeatures);
        set(selectionAtom, newSelection);
        return transact(moment);
      },
      [transact, selectedWrappedFeatures]
    )
  );

  const addCentroidAction = {
    label: 'Create centroids',
    applicable: supportsCentroids,
    icon: <DotIcon />,
    onSelect: onCentroid
  };

  const onLabelPoint = useAtomCallback(
    useCallback(
      // eslint-disable-next-line
      async (_get, set) => {
        const { newSelection, moment } = drawLabelPoints(
          selectedWrappedFeatures
        );
        set(selectionAtom, newSelection);
        return transact(moment);
      },
      [transact, selectedWrappedFeatures]
    )
  );

  const addLabelPointAction = {
    label: 'Create label points',
    applicable: supportsCentroids,
    icon: <TextIcon />,
    onSelect: onLabelPoint
  };

  const onArc = useAtomCallback(
    useCallback(
      // eslint-disable-next-line
      async (_get, set) => {
        return drawArc(selectedWrappedFeatures).caseOf({
          Left(e) {
            toast.error(e.message);
          },
          Right({ newSelection, moment }) {
            set(selectionAtom, newSelection);
            return transact(moment);
          }
        });
      },
      [transact, selectedWrappedFeatures]
    )
  );

  const drawArcAction = {
    label: 'Draw great arc',
    applicable:
      selectedFeatures.length === 2 &&
      selectedFeatures.every((feature) => feature.geometry?.type === 'Point'),
    icon: <GlobeIcon />,
    onSelect: onArc
  };

  const onDuplicate = useAtomCallback(
    useCallback(
      async (get, set) => {
        const data = get(dataAtom);
        const { newSelection, moment } = duplicateFeatures(data);
        set(selectionAtom, newSelection);
        await transact(moment);
      },
      [transact]
    )
  );

  const duplicateFeaturesAction = {
    label: 'Duplicate features',
    applicable: true,
    icon: <CopyIcon />,
    onSelect: onDuplicate
  };

  const onDelete = useAtomCallback(
    useCallback(
      async (get, set) => {
        const data = get(dataAtom);
        const { newSelection, moment } = deleteFeatures(data);
        set(selectionAtom, newSelection);
        await transact(moment);
      },
      [transact]
    )
  );

  const deleteFeaturesAction = {
    label: 'Delete features',
    variant: 'destructive' as B3Variant,
    applicable: true,
    icon: <TrashIcon />,
    onSelect: onDelete
  };

  const zoomToAction = {
    icon: <Crosshair1Icon />,
    applicable: true,
    label: 'Zoom to',
    onSelect: function doAddInnerRing() {
      return Promise.resolve(zoomTo(selectedWrappedFeatures));
    }
  };

  const innerRingAction = {
    icon: <MaskOnIcon />,
    applicable: canInnerRingResult === CanInnerRingResult.Yes,
    label: 'Add inner ring to polygon',
    onSelect: async function doAddInnerRing() {
      return await addInnerRing(
        selectedFeatures[0] as IFeature<Polygon>,
        selectedFeatures[1] as IFeature<Polygon>
      ).caseOf({
        Left(error) {
          return Promise.resolve(void toast.error(error.message));
        },
        Right(features) {
          return transact({
            note: 'Added an innner ring to a polygon',
            track: 'operation-add-polygon-inner-ring',
            deleteFeatures: [
              selectedWrappedFeatures[0].id,
              selectedWrappedFeatures[1].id
            ],
            putFeatures: features.map((feature) => {
              return {
                id: newFeatureId(),
                feature
              };
            })
          });
        }
      });
    }
  };

  const divideAction = {
    icon: <LinkBreak2Icon />,
    applicable: selectedFeatures.some(
      (feature) =>
        feature.geometry !== null &&
        GEOJSON_MULTI_GEOMETRY_TYPES.has(feature.geometry?.type)
    ),
    label:
      selectedFeatures.length === 1
        ? selectedFeatures[0]?.geometry?.type === 'GeometryCollection'
          ? 'Split GeometryCollection'
          : `Divide into ${MULTI_TO_SINGULAR[
              selectedFeatures[0]?.geometry?.type || 'LineString'
            ]!}s`
        : `Divide features`,
    onSelect: async function doDivide() {
      const { putFeatures, deleteFeatures } = divideFeatures(
        selectedWrappedFeatures
      );
      await transact({
        note: 'Divided multi-features into single features',
        track: 'operation-divide-multi-features',
        deleteFeatures,
        putFeatures
      });
    }
  };

  return [
    zoomToAction,
    divideAction,
    innerRingAction,
    bufferFeaturesAction,
    duplicateFeaturesAction,
    drawArcAction,
    deleteFeaturesAction,
    addCentroidAction,
    addLabelPointAction
  ];
}

export function GeometryActions({
  as,
  selectedWrappedFeatures
}: {
  as: ActionProps['as'];
  selectedWrappedFeatures: IWrappedFeature[];
}) {
  const actions = useActions(selectedWrappedFeatures);

  return (
    <>
      {as === 'context-item' ? (
        <SingleActions
          selectedWrappedFeatures={selectedWrappedFeatures}
          as={as}
        />
      ) : (
        <DD.Root>
          <Tooltip.Root>
            <ToolbarTrigger aria-label="Operations">
              <MixIcon />
            </ToolbarTrigger>
            <TContent side="bottom">
              <StyledTooltipArrow />
              <div className="whitespace-nowrap">Geometry operations</div>
            </TContent>
          </Tooltip.Root>
          <DDContent align="start">
            <SingleActions
              selectedWrappedFeatures={selectedWrappedFeatures}
              as="dropdown-item"
            />
          </DDContent>
        </DD.Root>
      )}

      {actions
        .filter((action) => action.applicable)
        .map((action, i) => (
          <ActionItem as={as} key={i} action={action} />
        ))}
    </>
  );
}
