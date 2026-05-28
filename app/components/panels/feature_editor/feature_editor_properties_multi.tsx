import { PanelDetails } from 'app/components/panel_details';
import { onArrow } from 'app/lib/arrow_navigation';
import { cast } from 'app/lib/cast';
import { deletePropertyKey } from 'app/lib/map_operations/delete_property_key';
import { updatePropertyKey } from 'app/lib/map_operations/update_property_key';
import { updatePropertyValue } from 'app/lib/map_operations/update_property_value';
import { extractMultiProperties } from 'app/lib/multi_properties';
import { usePersistence } from 'app/lib/persistence/context';
import { pluralize } from 'app/lib/utils';
import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import { useRef } from 'react';
import type { JsonValue } from 'type-fest';
import type { Feature, IWrappedFeature } from 'types';
import { PropertyTableHead } from './feature_editor_properties';
import { NewRow } from './new_row';
import { PropertyRowMulti } from './property_row';

type Transformer = (arg0: Feature) => Feature;

export function FeatureEditorPropertiesMulti({
  selectedFeatures
}: {
  selectedFeatures: IWrappedFeature[];
}) {
  const propertyMap = extractMultiProperties(selectedFeatures);
  const rep = usePersistence();
  const transact = rep.useTransact();
  const localOrder = useRef<PropertyKey[]>(Array.from(propertyMap.keys()));

  function updateFeatures(transformer: Transformer) {
    return transact({
      note: 'Updated multiple feature properties',
      putFeatures: selectedFeatures.map((wrappedFeature) => {
        return {
          ...wrappedFeature,
          feature: transformer(wrappedFeature.feature)
        };
      })
    });
  }

  const updateValue = (key: string, value: JsonValue) => {
    return updateFeatures((feature) =>
      updatePropertyValue(feature, {
        key,
        value
      })
    );
  };

  const updateKey = (key: string, newKey: string) => {
    void updateFeatures((feature) =>
      updatePropertyKey(feature, { key, newKey })
    );
  };

  const deleteKey = (key: string) => {
    localOrder.current = without(localOrder.current, key);
    void updateFeatures((feature) => deletePropertyKey(feature, { key }));
  };

  const castValue = (key: string, value: string) => {
    void updateFeatures((feature) => {
      const properties = { ...feature.properties };
      properties[key] = cast(value);
      return {
        ...feature,
        properties
      };
    });
  };

  const addRow = (key: string, value: string) => {
    void updateFeatures((feature) =>
      updatePropertyValue(feature, { key, value })
    ).then(() => {
      if (!localOrder.current.includes(key)) localOrder.current.push(key);
    });
  };

  const pairs = sortBy(Array.from(propertyMap.entries()), ([key]) =>
    localOrder.current.indexOf(key)
  );

  return (
    <PanelDetails
      title={`Properties (${pluralize('feature', selectedFeatures.length)})`}
      variant="fullwidth"
    >
      <table className="ppb-2 b-2 w-full" data-focus-scope onKeyDown={onArrow}>
        <PropertyTableHead />
        <tbody>
          {pairs.map((pair, y) => {
            return (
              <PropertyRowMulti
                y={y}
                key={pair[0]}
                pair={pair}
                even={y % 2 === 0}
                onChangeValue={updateValue}
                onChangeKey={updateKey}
                onDeleteKey={deleteKey}
                onCast={castValue}
              />
            );
          })}
          <NewRow onCommit={addRow} y={pairs.length} />
        </tbody>
      </table>
    </PanelDetails>
  );
}
