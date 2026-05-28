import { FeatureEditorCircle } from './feature_editor_circle';
import { FeatureEditorExport } from './feature_editor_export';
import { FeatureEditorId } from './feature_editor_id';
import { FeatureEditorVertex } from './feature_editor_vertex';
import { RawEditor } from './raw_editor';
import { FeatureEditorStyle } from './feature_editor_style';
import type { IWrappedFeature, FeatureEditorTab } from 'types';

const FeatureEditorActiveTab = ({
  activeTab,
  selectedFeature,
  vertexId
}: {
  activeTab: FeatureEditorTab;
  selectedFeature: IWrappedFeature;
  vertexId?: VertexId;
}) => {
  switch (activeTab.id) {
    case 'mercator-circle':
      return (
        <FeatureEditorCircle
          wrappedFeature={selectedFeature}
          key={`circle-${selectedFeature.id}`}
        />
      );
    case 'vertex':
      return (
        <FeatureEditorVertex
          wrappedFeature={selectedFeature}
          vertexId={vertexId}
        />
      );
    case 'styles':
      return (
        <FeatureEditorStyle
          wrappedFeature={selectedFeature}
          key={selectedFeature.id}
        />
      );
    case 'export':
      return <FeatureEditorExport wrappedFeature={selectedFeature} />;
    case 'id':
      return <FeatureEditorId wrappedFeature={selectedFeature} />;
    case 'geojson':
      return <RawEditor feature={selectedFeature} />;
    default:
      return null;
  }
};

export default FeatureEditorActiveTab;
