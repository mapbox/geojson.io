import {
  ArrowRightIcon,
  CircleIcon,
  ClipboardCopyIcon,
  CommitIcon
} from '@radix-ui/react-icons';
import { GeometryActions } from 'app/components/context_actions/geometry_actions';
import type { ContextInfo } from 'app/components/map_component';
import { stringifyFeatures } from 'app/hooks/use_clipboard';
import {
  continueFeature,
  getContinuationDirection
} from 'app/hooks/use_line_mode';
import { usePersistence } from 'app/lib/persistence/context';
import { writeToClipboard } from 'app/lib/utils';
import { captureException } from 'integrations/errors';
import { useSetAtom } from 'jotai';
import { ContextMenu as CM } from 'radix-ui';
import { memo } from 'react';
import toast from 'react-hot-toast';
import { USelection } from 'state';
import { dialogAtom, Mode, modeAtom, selectionAtom } from 'state/jotai';
import { DialogHelpers } from 'state/dialog_helpers';
import type { IFeature, IWrappedFeature, LineString } from 'types';
import { CMContent, CMItem, CMSubContent, CMSubTriggerItem } from './elements';

function FeatureItem({ feature }: { feature: IWrappedFeature }) {
  const setSelection = useSetAtom(selectionAtom);
  return (
    <CMItem
      onSelect={() => {
        setSelection(USelection.single(feature.id));
      }}
      onFocus={() => {
        setSelection(USelection.single(feature.id));
      }}
      key={feature.id}
    >
      {feature.feature.geometry?.type}
    </CMItem>
  );
}

function getContinuation(contextInfo: ContextInfo) {
  for (const { id, wrappedFeature } of contextInfo.features.ids) {
    const direction = getContinuationDirection(id, wrappedFeature.feature);
    if (direction) {
      return {
        wrappedFeature: wrappedFeature as IWrappedFeature<IFeature<LineString>>,
        direction
      };
    }
  }
  return null;
}

function MaybeContinue({ contextInfo }: { contextInfo: ContextInfo }) {
  const rep = usePersistence();
  const transact = rep.useTransact();
  const setSelection = useSetAtom(selectionAtom);
  const setMode = useSetAtom(modeAtom);
  const continuation = getContinuation(contextInfo);
  if (!continuation) return null;

  return (
    <CMItem
      onSelect={() => {
        const { wrappedFeature, direction } = continuation;
        const newFeature = continueFeature(wrappedFeature.feature, direction);
        transact({
          note: 'Continued a feature',
          putFeatures: [
            {
              ...wrappedFeature,
              feature: newFeature
            }
          ]
        })
          .then(() => {
            setSelection(USelection.single(wrappedFeature.id));
            setMode({
              mode: Mode.DRAW_LINE,
              modeOptions: { reverse: direction === 'reverse' }
            });
          })
          .catch((e) => captureException(e));
      }}
    >
      <CommitIcon />
      Continue line
    </CMItem>
  );
}

export const MapContextMenu = memo(function MapContextMenu({
  contextInfo
}: {
  contextInfo: ContextInfo | null;
}) {
  const setDialogState = useSetAtom(dialogAtom);

  return (
    <CM.Portal>
      <CMContent>
        {contextInfo ? (
          <>
            {contextInfo.features.features.length ? (
              <CM.Sub>
                <CMSubTriggerItem>
                  Select
                  <ArrowRightIcon />
                </CMSubTriggerItem>
                <CMSubContent>
                  {contextInfo.features.features.map((feature) => {
                    return <FeatureItem key={feature.id} feature={feature} />;
                  })}
                </CMSubContent>
              </CM.Sub>
            ) : null}
            {contextInfo.selectedFeatures.length ? (
              <CM.Sub>
                <CMSubTriggerItem>
                  Operations
                  <ArrowRightIcon />
                </CMSubTriggerItem>

                <CMSubContent>
                  <GeometryActions
                    selectedWrappedFeatures={contextInfo.selectedFeatures}
                    as="context-item"
                  />
                </CMSubContent>
                <CMItem
                  onSelect={() => {
                    stringifyFeatures(contextInfo.selectedFeatures).ifJust(
                      ({ data, message }) => {
                        toast
                          .promise(writeToClipboard(data), {
                            loading: 'Copying…',
                            error: 'Failed to copy',
                            success: message
                          })
                          .catch((e) => {
                            captureException(e);
                          });
                      }
                    );
                  }}
                >
                  Copy as GeoJSON
                  <ClipboardCopyIcon />
                </CMItem>
              </CM.Sub>
            ) : null}
            <MaybeContinue contextInfo={contextInfo} />
          </>
        ) : null}
        <CMItem
          onSelect={() => {
            if (contextInfo) {
              setDialogState(DialogHelpers.circle(contextInfo.position));
            }
          }}
        >
          Draw circle here
          <CircleIcon />
        </CMItem>
      </CMContent>
    </CM.Portal>
  );
});
