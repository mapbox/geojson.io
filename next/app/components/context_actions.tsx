import {
  CaretDownIcon,
  Cross1Icon,
  RulerHorizontalIcon
} from '@radix-ui/react-icons';
import * as E from 'app/components/elements';
import { pluralize } from 'app/lib/utils';
import { useAtomValue } from 'jotai';
import { DropdownMenu as DD, Popover as P, Tooltip as T } from 'radix-ui';
import type React from 'react';
import { selectedFeaturesAtom } from 'state/jotai';
import { GeometryActions } from './context_actions/geometry_actions';
import { MultiActions } from './context_actions/multi_actions';
import { ShapeUnite16 } from './icons';
import { FeatureEditorGeometry } from './panels/feature_editor/feature_editor_geometry';

export function ToolbarTrigger({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentProps<typeof T.Trigger>) {
  return (
    <div
      className="h-10 w-12 p-1
          group bn
          flex items-stretch justify-center focus:outline-none"
    >
      <T.Trigger asChild {...props}>
        <DD.Trigger asChild>
          <E.Button variant="quiet">
            {children}
            <CaretDownIcon className="w-3 h-3" />
          </E.Button>
        </DD.Trigger>
      </T.Trigger>
    </div>
  );
}

export default function ContextActions() {
  const selectedWrappedFeatures = useAtomValue(selectedFeaturesAtom);

  if (selectedWrappedFeatures.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="h-12 self-stretch flex items-center text-xs pr-2 text-gray-700 dark:text-white">
        {pluralize('feature', selectedWrappedFeatures.length)} selected
      </div>
      {selectedWrappedFeatures.length > 1 ? (
        <DD.Root>
          <T.Root>
            <ToolbarTrigger aria-label="Operations">
              <ShapeUnite16 />
            </ToolbarTrigger>
            <E.TContent>
              <E.StyledTooltipArrow />
              <div className="whitespace-nowrap">Union features</div>
            </E.TContent>
          </T.Root>
          <E.DDContent align="start">
            <MultiActions
              selectedWrappedFeatures={selectedWrappedFeatures}
              as="dropdown-item"
            />
          </E.DDContent>
        </DD.Root>
      ) : null}
      <GeometryActions
        selectedWrappedFeatures={selectedWrappedFeatures}
        as="root"
      />
      <T.Root>
        <P.Root>
          <T.Trigger asChild>
            <div
              className="h-10 w-10 p-1
                  group bn
                  flex items-stretch justify-center focus:outline-none"
            >
              <P.Trigger asChild aria-label="Measurements">
                <E.Button variant="quiet">
                  <RulerHorizontalIcon />
                </E.Button>
              </P.Trigger>
            </div>
          </T.Trigger>
          <E.TContent side="bottom">
            <E.StyledTooltipArrow />
            <div className="whitespace-nowrap">Geometry information</div>
          </E.TContent>
          <E.PopoverContent2 size="md">
            <div className="relative">
              <P.Close
                aria-label="Close"
                className="absolute top-0 right-1 dark:text-white"
              >
                <Cross1Icon />
              </P.Close>
              <div className="pt-4">
                <FeatureEditorGeometry
                  wrappedFeatures={selectedWrappedFeatures}
                />
              </div>
            </div>
          </E.PopoverContent2>
        </P.Root>
      </T.Root>
    </div>
  );
}
