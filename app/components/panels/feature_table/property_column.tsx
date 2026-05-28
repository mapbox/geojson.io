import { useZoomTo } from 'app/hooks/use_zoom_to';
import { updatePropertyValue } from 'app/lib/map_operations/update_property_value';
import { usePersistence } from 'app/lib/persistence/context';
import { captureException } from 'integrations/errors';
import { memo } from 'react';
import type { JsonValue } from 'type-fest';
import type { CoordProps, IWrappedFeature } from 'types';
import { PropertyRowValue } from '../feature_editor/property_row/value';

export const PropertyColumn = memo(function PropertyColumn({
  feature,
  column,
  x,
  y
}: {
  feature: IWrappedFeature;
  column: string;
} & CoordProps) {
  const zoomTo = useZoomTo();
  const rep = usePersistence();
  const transact = rep.useTransact();
  let value = feature.feature.properties?.[column];
  if (value === undefined || value === null) value = '';

  function onChangeValue(value: JsonValue) {
    transact({
      note: 'Changed a property value',
      putFeatures: [
        {
          ...feature,
          feature: updatePropertyValue(feature.feature, {
            key: column,
            value: value
          })
        }
      ]
    }).catch((e) => captureException(e));
  }

  return (
    <div className="group">
      <PropertyRowValue
        x={x}
        y={y}
        pair={[column, value]}
        table
        onChangeValue={(_key, value) => onChangeValue(value)}
        onFocus={() => zoomTo([feature])}
        onDeleteKey={() => {}}
        onCast={() => {}}
        even={false}
      />
    </div>
  );
});
