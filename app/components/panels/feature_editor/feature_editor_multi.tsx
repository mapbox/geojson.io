import { FeatureEditorStyleMulti } from 'app/components/panels/feature_editor/feature_editor_style';
import type { IWrappedFeature } from 'types';
import { FeatureEditorPropertiesMulti } from './feature_editor_properties_multi';

export default function FeatureEditorMulti({
  selectedFeatures
}: {
  selectedFeatures: IWrappedFeature[];
}) {
  return (
    <div
      className="overflow-y-auto flex"
      style={{ height: 'calc(100% - 30px)' }}
    >
      <div className=" w-1/2 flex-auto overflow-y-auto geojsonio-scrollbar border-r">
        <FeatureEditorPropertiesMulti selectedFeatures={selectedFeatures} />
      </div>

      <div className="w-1/2 divide-y divide-gray-200 dark:divide-gray-900 border-gray-200 dark:border-gray-900 overflow-auto geojsonio-scrollbar">
        <FeatureEditorStyleMulti
          wrappedFeatures={selectedFeatures}
          key="style-editor-multi"
        />
      </div>
    </div>
  );
}
