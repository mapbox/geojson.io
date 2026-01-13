import { EMPTY_ARRAY, emptySelection } from 'app/lib/constants';
import { encodeId } from 'app/lib/id';
import { type IDMap, UIDMap } from 'app/lib/id_mapper';
import type { Data, PreviewProperty } from 'state/jotai';
import type { Feature, ISymbolization } from 'types';
import { generateSyntheticPoints } from './generate_synthetic_points';
import { fixDegenerates } from './merge_ephemeral_state';
import { getKeepProperties, stripFeature } from './strip_features';

/**
 * This is basically the "intermediate representation" before
 * features go to the map. The features here are as barebones
 * as they can be.
 */
interface SplitGroups {
  selectionIds: Set<RawId>;
  synthetic: Feature[];
  ephemeral: Feature[];
  features: Feature[];
}

/**
 * When the user has a SelectionSingle state,
 * as a performance optimization we push it into
 * the ephemeral layer.
 *
 * In the case that a single feature is selected,
 * synthetic features for its vertices are generated.
 *
 * This also generates selectionIds, which is a list
 * of RawId (integer) IDs which are the ones that go
 * directly to Mapbox GL.
 *
 * This is somewhat slow. It could probably be
 * faster using memoization, or a micro-optimization of
 * how to create the stripped values.
 */
export function splitFeatureGroups({
  data,
  lastSymbolization,
  idMap,
  previewProperty
}: {
  data: Data;
  lastSymbolization: ISymbolization | null;
  idMap: IDMap;
  previewProperty: PreviewProperty;
}): SplitGroups {
  const { selection, featureMap } = data;

  const features: Feature[] = [];
  let selectedFeature: Feature | null = null;

  const keepProperties = getKeepProperties({
    symbolization: lastSymbolization,
    previewProperty
  });

  for (const feature of featureMap.values()) {
    if (feature.feature.properties?.visibility === false) {
      continue;
    }
    if (selection.type === 'single' && feature.id === selection.id) {
      selectedFeature = stripFeature({
        wrappedFeature: feature,
        keepProperties,
        idMap
      });
    } else {
      features.push(
        stripFeature({
          wrappedFeature: feature,
          keepProperties,
          idMap
        })
      );
    }
  }

  // If nothing is selected, don't split the selected
  // feature at all.
  const noneResult = {
    synthetic: EMPTY_ARRAY,
    ephemeral: EMPTY_ARRAY,
    features,
    selectionIds: emptySelection
  } as const;

  switch (selection.type) {
    case 'single': {
      const { id } = selection;
      if (!selectedFeature) {
        // TODO: dirty code
        // Workaround: if the selected feature no longer exists
        return noneResult;
      }

      const selectionIds = new Set<RawId>(selection.parts.map(encodeId));
      return {
        synthetic: generateSyntheticPoints(
          selectedFeature,
          UIDMap.getIntID(idMap, id)
        ),
        ephemeral: [fixDegenerates(selectedFeature)],
        features,
        selectionIds
      };
    }
    case 'none': {
      return noneResult;
    }
    case 'multi': {
      // Performance optimization: using .includes()
      // here with an array may be slow.
      const selectionIds = new Set<RawId>(
        selection.ids.map((uuid) => UIDMap.getIntID(idMap, uuid))
      );
      return {
        synthetic: EMPTY_ARRAY,
        ephemeral: EMPTY_ARRAY,
        features,
        selectionIds
      };
    }
  }
}
