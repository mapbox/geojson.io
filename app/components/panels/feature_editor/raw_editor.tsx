import { TextWell } from 'app/components/elements';
import { FeatureText } from 'app/components/panels/feature_editor/raw_editor_text';
import type { IWrappedFeature } from 'types';

export function RawEditor({ feature }: { feature: IWrappedFeature }) {
  return (
    <>
      <FeatureText feature={feature} />
      <div className="m-3">
        <TextWell size="xs">This editor edits only this feature.</TextWell>
      </div>
    </>
  );
}
