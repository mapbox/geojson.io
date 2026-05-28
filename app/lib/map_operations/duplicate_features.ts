import { newFeatureId } from 'app/lib/id';
import { EMPTY_MOMENT, type Moment } from 'app/lib/persistence/moment';
import { USelection } from 'state/index';
import type { Data, Sel } from 'state/jotai';
import type { IWrappedFeature } from 'types';

interface DuplicateResult {
  newSelection: Sel;
  moment: Moment;
}

function duplicateFeaturesSimple(features: IWrappedFeature[]): DuplicateResult {
  const putFeatures = features.map((feature) => {
    return {
      ...feature,
      id: newFeatureId()
    };
  });
  return {
    moment: {
      ...EMPTY_MOMENT,
      note: 'Duplicated features',
      putFeatures
    },
    newSelection: USelection.fromIds(putFeatures.map((f) => f.id))
  };
}

/**
 * Duplicate features
 */
export function duplicateFeatures(data: Data): DuplicateResult {
  switch (data.selection.type) {
    case 'none': {
      // No-op if nothing is selected: just
      // return another "none" selection and an empty moment.
      return {
        newSelection: USelection.none(),
        moment: EMPTY_MOMENT
      };
    }
    case 'multi':
    case 'single': {
      return duplicateFeaturesSimple(USelection.getSelectedFeatures(data));
    }
  }
}
