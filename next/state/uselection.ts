import { EMPTY_ARRAY } from 'app/lib/constants';
import { toggle } from 'app/lib/utils';
import type { Data, Sel, SelSingle } from 'state/jotai';
import type { IWrappedFeature } from 'types';

export const USelection = {
  reduce(selection: Sel): Sel {
    return selection.type === 'single' && selection.parts.length
      ? USelection.single(selection.id)
      : USelection.none();
  },
  /**
   * Return **Feature** ids associated with this selection.
   */
  toIds(selection: Sel): readonly IWrappedFeature['id'][] {
    switch (selection.type) {
      case 'none':
        return [];
      case 'single':
        return [selection.id];
      case 'multi':
        return selection.ids;
    }
  },
  /**
   * Get vertices as an array if they are in the selection.
   */

  getVertexIds(selection: Sel): VertexId[] {
    if (selection.type === 'single' && selection.parts.length) {
      return selection.parts.flatMap((id) => {
        return id.type === 'vertex' ? [id] : [];
      });
    }
    return EMPTY_ARRAY as VertexId[];
  },

  // Dangerous: this will throw if given a 'none' selection.
  // Basically an assertion method.
  asSingle(selection: Sel): SelSingle {
    if (selection.type === 'none') {
      throw new Error('Given a none selection');
    }
    return selection.type === 'single'
      ? selection
      : {
          type: 'single',
          id: selection.ids[0],
          parts: []
        };
  },
  fromIds(ids: IWrappedFeature['id'][]): Sel {
    return ids.length === 0
      ? { type: 'none' }
      : ids.length === 1
      ? this.single(ids[0])
      : {
          type: 'multi',
          ids
        };
  },
  /**
   * Get selected features of a single or multi selection.
   */
  getSelectedFeatures({
    selection,
    featureMap
  }: Pick<Data, 'selection' | 'featureMap'>): IWrappedFeature[] {
    switch (selection.type) {
      case 'none': {
        return EMPTY_ARRAY as IWrappedFeature[];
      }
      default: {
        const features: IWrappedFeature[] = [];
        for (const id of this.toIds(selection)) {
          const feature = featureMap.get(id);
          if (feature) features.push(feature);
        }
        return features;
      }
    }
  },
  isSelected(selection: Sel, id: IWrappedFeature['id']): boolean {
    switch (selection.type) {
      case 'none': {
        return false;
      }
      case 'single': {
        return selection.id === id;
      }
      case 'multi': {
        return selection.ids.includes(id);
      }
    }
  },
  isVertexSelected(selection: Sel, id: string, vertexId: VertexId): boolean {
    return (
      selection.type === 'single' &&
      selection.id === id &&
      selection.parts.length === 1 &&
      selection.parts[0].vertex === vertexId.vertex
    );
  },
  /**
   * Note: only deals in top-level uids,
   * not RawId components.
   */
  toggleSelectionId(selection: Sel, id: IWrappedFeature['id']): Sel {
    const ids = this.toIds(selection);
    const updatedIds = toggle(ids, id);
    return this.fromIds(updatedIds);
  },
  toggleSingleSelectionId(selection: Sel, id: IWrappedFeature['id']): Sel {
    if (selection.type === 'single' && this.isSelected(selection, id)) {
      return this.none();
    }
    return this.single(id);
  },
  addSelectionId(selection: Sel, id: IWrappedFeature['id']): Sel {
    const ids = this.toIds(selection);
    if (ids.includes(id)) return selection;
    return this.fromIds(ids.concat(id));
  },
  removeFeatureFromSelection(selection: Sel, id: IWrappedFeature['id']): Sel {
    switch (selection.type) {
      case 'none': {
        return selection;
      }
      case 'single': {
        if (selection.id === id) {
          return SELECTION_NONE;
        } else {
          return selection;
        }
      }
      case 'multi': {
        if (selection.ids.includes(id)) {
          selection.ids = selection.ids.filter((sid) => sid !== id);
          return selection;
        } else {
          return selection;
        }
      }
    }
  },
  none(): Sel {
    return SELECTION_NONE;
  },
  single(id: IWrappedFeature['id']): SelSingle {
    return {
      type: 'single',
      id,
      parts: []
    };
  }
};

const SELECTION_NONE: Sel = {
  type: 'none'
};
