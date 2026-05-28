import { Tab } from '../';
import type { FeatureEditorTab, FeatureEditorTabId } from 'types';

const FeatureEditorTabList = ({
  tabOrder,
  setActiveTab,
  activeTab
}: {
  tabOrder: FeatureEditorTab[];
  activeTab: FeatureEditorTab;
  setActiveTab: (tabId: FeatureEditorTabId) => void;
}) => {
  return (
    <div
      role="tablist"
      style={{
        gridTemplateColumns: `repeat(${tabOrder.length}, 1fr) min-content`
      }}
      className="flex-0 grid h-8 flex-none
        sticky top-0 z-10
        bg-white dark:bg-gray-800
        divide-x divide-gray-200 dark:divide-black"
    >
      {tabOrder.map((tab) => {
        return (
          <Tab
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            active={activeTab.id === tab.id}
            label={tab.label}
          />
        );
      })}
    </div>
  );
};

export default FeatureEditorTabList;
