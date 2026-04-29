import { useAtomValue, useAtom } from 'jotai';
import { Mode, modeAtom, selectedFeaturesAtom } from 'state/jotai';
import { FeatureEditorInner } from './feature_editor/feature_editor_inner';
import FeatureEditorMulti from './feature_editor/feature_editor_multi';
import { featureEditorMinimized } from 'state/jotai';
import { ResolvedLayout } from '../geojson_io';
import { SizeIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import { Tooltip } from 'radix-ui';
import { TContent } from '../elements';

export default function FeatureEditor({ layout }: { layout: ResolvedLayout }) {
  const selectedFeatures = useAtomValue(selectedFeaturesAtom);
  const [minimizedEditor, setMinimizedEditor] = useAtom(featureEditorMinimized);
  const mode = useAtomValue(modeAtom);

  // Don't show panel while drawing a feature
  const isDrawing = [
    Mode.DRAW_POLYGON,
    Mode.DRAW_LINE,
    Mode.DRAW_CIRCLE,
    Mode.DRAW_POINT,
    Mode.DRAW_RECTANGLE
  ].includes(mode.mode);

  const hasSelected = selectedFeatures.length > 0 && !isDrawing;

  const classes = {
    'absolute bg-white transition-all z-20 drop-shadow-md overflow-hidden': true,
    'right-4 bottom-4 rounded': layout === 'HORIZONTAL',
    'w-[calc(100%-2rem)] h-1/3': layout === 'HORIZONTAL' && !minimizedEditor,
    'w-80 h-[32px]': layout === 'HORIZONTAL' && minimizedEditor,
    'h-[32px] w-full bottom-0': layout === 'VERTICAL' && minimizedEditor,
    'h-full w-full': layout === 'VERTICAL' && !minimizedEditor
  };

  const translateDistance = !minimizedEditor
    ? 'translateY(110%)'
    : 'translateY(200%)';

  return (
    <div
      className={clsx(classes)}
      style={{ transform: hasSelected ? 'translateY(0)' : translateDistance }}
    >
      <h2 className="text-center relative py-1 px-8 focus:outline-none text-white dark:text-white bg-[#34495e]">
        Feature Editor
        <span className="text-sm text-[#c7c7c7]">
          {selectedFeatures.length > 1
            ? ` (${selectedFeatures.length} features selected)`
            : ''}
        </span>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className="absolute top-2 right-2 cursor-pointer hover:text-gray-200">
              <SizeIcon onClick={() => setMinimizedEditor((prev) => !prev)} />
            </div>
          </Tooltip.Trigger>
          <TContent side="left">
            <div className="flex gap-x-2 items-center ">
              {minimizedEditor ? 'Expand' : 'Minimize'}
            </div>
          </TContent>
        </Tooltip.Root>
      </h2>

      {selectedFeatures.length > 1 && minimizedEditor === false && (
        <FeatureEditorMulti selectedFeatures={selectedFeatures} />
      )}
      {selectedFeatures.length === 1 && minimizedEditor === false && (
        <FeatureEditorInner selectedFeature={selectedFeatures[0]} />
      )}
    </div>
  );
}
