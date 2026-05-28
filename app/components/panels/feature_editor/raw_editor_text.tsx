import { geojsonioThemeNoHeight } from 'app/lib/codemirror_theme';
import { usePersistence } from 'app/lib/persistence/context';

import { memo, useRef } from 'react';
import type { Feature, IWrappedFeature } from 'types';
import { GeoJSONEditor } from '../geojson_editor';

export const FeatureText = memo(function FeatureText({
  feature
}: {
  feature: IWrappedFeature;
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();
  const { at, id } = feature;
  const localValue = useRef<Feature | null>(null);

  const onChange = (sent: any) => {
    localValue.current = sent;
    return transact({
      note: 'Updated a property value',
      putFeatures: [
        {
          at: at,
          id: id,
          feature: sent
        }
      ]
    });
  };

  return (
    <GeoJSONEditor
      value={feature.feature}
      onChange={onChange}
      theme={geojsonioThemeNoHeight}
      containerClassName="w-full"
    />
  );
});
