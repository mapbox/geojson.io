import * as E from 'app/components/elements';
import { styledCheckbox } from 'app/components/elements';
import LAYERS from 'app/lib/default_styles';
import { activeStyleIdAtom, styleOptionsAtom } from 'state/jotai';
import { useAtom } from 'jotai';

export function StylesPopover() {
  const [activeStyleId, setActiveStyleId] = useAtom(activeStyleIdAtom);
  const [styleOptions, setStyleOptions] = useAtom(styleOptionsAtom);

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
            const iconSrc = `/layer-icons/${id}.png`;
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
    </div>
  );
}
