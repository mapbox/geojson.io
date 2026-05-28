import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import {
  Button,
  StyledPopoverContent,
  TextWell
} from 'app/components/elements';
import Modes from 'app/components/modes';
import { PanelDetailsCollapsible } from 'app/components/panel_details';
import { Popover as P } from 'radix-ui';
import { memo } from 'react';
import { panelNullOpen } from 'state/jotai';
import type { IWrappedFeature } from 'types';

export const FeatureEditorNullGeometry = memo(
  function FeatureEditorNullGeometryInner({
    wrappedFeature
  }: {
    wrappedFeature: IWrappedFeature;
  }) {
    if (wrappedFeature.feature.geometry) return null;

    return (
      <PanelDetailsCollapsible title="Null geometry" atom={panelNullOpen}>
        <TextWell size="xs">
          <ExclamationTriangleIcon className="inline-block w-3 h-3 mr-1" />
          This feature has no geometry information.
        </TextWell>
        <div className="pt-2">
          <P.Root>
            <P.Trigger asChild>
              <Button size="xs">Add geometry</Button>
            </P.Trigger>
            <StyledPopoverContent size="xs">
              <Modes replaceGeometryForId={wrappedFeature.id} />
            </StyledPopoverContent>
          </P.Root>
        </div>
      </PanelDetailsCollapsible>
    );
  }
);
