import { useAtomValue } from 'jotai';
import { Mode, modeAtom, selectedFeaturesAtom } from 'state/jotai';
import { FeatureEditorInner } from './feature_editor/feature_editor_inner';
import FeatureEditorMulti from './feature_editor/feature_editor_multi';
import { ResolvedLayout } from '../geojson_io';
import clsx from 'clsx';

export default function FeatureEditor({ layout }: { layout: ResolvedLayout }) {
  const selectedFeatures = useAtomValue(selectedFeaturesAtom);
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

  return (
    <div
      className={clsx(
        `absolute bg-white transition-all z-20 drop-shadow-md overflow-hidden`,
        {
          'h-1/3 left-4 right-4 bottom-4 rounded': layout === 'HORIZONTAL',
          'h-full w-full': layout === 'VERTICAL'
        }
      )}
      style={{ transform: hasSelected ? 'translateY(0)' : 'translateY(110%)' }}
    >
      <h2 className="text-center py-1 px-3 focus:outline-none text-white dark:text-white bg-[#34495e]">
        Feature Editor
        <span className="text-sm text-[#c7c7c7]">
          {selectedFeatures.length > 1
            ? ` (${selectedFeatures.length} features selected)`
            : ''}
        </span>
      </h2>

      {selectedFeatures.length > 1 && (
        <FeatureEditorMulti selectedFeatures={selectedFeatures} />
      )}
      {selectedFeatures.length === 1 && (
        <FeatureEditorInner selectedFeature={selectedFeatures[0]} />
      )}
    </div>
  );
}
