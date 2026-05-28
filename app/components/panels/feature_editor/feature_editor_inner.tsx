import { useEffect, useMemo } from 'react';
import { useAtom } from 'jotai';
import { getCircleProp, getCircleRadius } from 'app/lib/circle';
import { useAtomValue } from 'jotai';
import { USelection } from 'state';
import { selectionAtom } from 'state/jotai';
import type { IWrappedFeature } from 'types';
import { FEATURE_EDITOR_TAB_CONFIG } from 'types';
import { featureEditorActiveTab } from 'state/jotai';
import { FeatureEditorProperties } from './feature_editor_properties';
import FeatureEditorActiveTab from './feature_editor_active_tab';
import FeatureEditorTabList from './feature_editor_tab_list';

export function FeatureEditorInner({
  selectedFeature
}: {
  selectedFeature: IWrappedFeature;
}) {
  const [activeTabId, setActiveTabId] = useAtom(featureEditorActiveTab);
  const activeTab =
    FEATURE_EDITOR_TAB_CONFIG.find((tab) => tab.id === activeTabId) ||
    FEATURE_EDITOR_TAB_CONFIG[0];
  const selection = useAtomValue(selectionAtom);

  // Calculate vertexId once for use in filtering and passing to children
  const vertices = USelection.getVertexIds(selection);
  const [vertexId] = vertices;

  // Filter Tabs based on Type of Feature
  const filteredTabs = useMemo(() => {
    let tabs = [...FEATURE_EDITOR_TAB_CONFIG];

    // Check if Vertex on feature is selected
    // exclude it if not selected
    if (vertexId === undefined) {
      tabs = tabs.filter((tab) => tab.id !== 'vertex');
    }

    // If it is not a circle feature remove circle tab from editor
    // and set activeTab to styles (if it was circle)
    const prop = getCircleProp(selectedFeature?.feature);
    const radius = getCircleRadius(selectedFeature?.feature);
    if (!prop || !radius) {
      tabs = tabs.filter((tab) => tab.id !== 'mercator-circle');
    }

    return tabs;
  }, [selectedFeature, vertexId]);

  useEffect(() => {
    if (!filteredTabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(filteredTabs[0]?.id || 'styles');
    }
  }, [filteredTabs, activeTabId, setActiveTabId]);

  // Set Vertex tab to 'active' if a vertex is selected
  useEffect(() => {
    if (vertexId !== undefined) {
      setActiveTabId('vertex');
    }
  }, [vertexId, setActiveTabId]);

  return (
    <div
      className="overflow-y-auto flex"
      style={{ height: 'calc(100% - 30px)' }}
    >
      {/* First Col */}
      <div className=" w-1/2 flex-auto overflow-y-auto geojsonio-scrollbar border-r">
        <FeatureEditorProperties wrappedFeature={selectedFeature} />
      </div>

      {/* Second Col w Tabs */}
      <div className="w-1/2 divide-y divide-gray-200 dark:divide-gray-900 border-gray-200 dark:border-gray-900 overflow-auto flex flex-col">
        <FeatureEditorTabList
          tabOrder={filteredTabs}
          setActiveTab={setActiveTabId}
          activeTab={activeTab}
        />

        <div className="relative overflow-auto flex-auto geojsonio-scrollbar">
          <FeatureEditorActiveTab
            activeTab={activeTab}
            selectedFeature={selectedFeature}
            vertexId={vertexId}
          />
        </div>
      </div>
    </div>
  );
}
