import type { ScaleUnit } from 'app/lib/constants';
import type { ExportOptions } from 'app/lib/convert';
import LAYERS from 'app/lib/default_styles';
import type { QItemAddable } from 'app/lib/geocode';
import type { PersistenceMetadataMemory } from 'app/lib/persistence/ipersistence';
import type { MomentLog } from 'app/lib/persistence/moment';
import { CMomentLog } from 'app/lib/persistence/moment';
import { shallowArrayEqual } from 'app/lib/utils';
import type { FileSystemHandle } from 'browser-fs-access';
import { atom, type createStore } from 'jotai';
import { atomWithStorage, selectAtom } from 'jotai/utils';
import { focusAtom } from 'jotai-optics';
import { atomWithMachine } from 'jotai-xstate';
import { CIRCLE_TYPE, MODE_INFO, Mode, modeAtom } from 'state/mode';
import { dataSessionStorage } from './session_storage_helpers';
import type { SetOptional } from 'type-fest';
import {
  type FeatureMap,
  type IPresence,
  SYMBOLIZATION_NONE,
  type StyleOptions
} from 'types';
import { NIL } from 'uuid';
import { createMachine } from 'xstate';
import { USelection } from './uselection';

export type Store = ReturnType<typeof createStore>;

// TODO: make this specific
type MapboxLayer = any;

interface FileInfo {
  handle: FileSystemHandle | FileSystemFileHandle;
  options: ExportOptions;
}

export type PreviewProperty = PersistenceMetadataMemory['label'];

// ----------------------------------------------------------------------------

/**
 * Core data
 */
export interface Data {
  featureMap: FeatureMap;
  selection: Sel;
}

export const dataAtom = atomWithStorage<Data>(
  'geojson-data',
  {
    featureMap: new Map(),
    selection: { type: 'none' }
  },
  dataSessionStorage
);

const layerId = NIL;

// tracks the active style
export const activeStyleIdAtom = atomWithStorage<string>(
  'activeStyleId',
  'STANDARD_LIGHT'
);

// tracks style options (currently only labelVisibility, not style-specific)
export const styleOptionsAtom = atomWithStorage<StyleOptions>('styleOptions', {
  labelVisibility: true
});

export const styleConfigAtom = atom((get) => {
  const activeId = get(activeStyleIdAtom);
  const baseLayer = LAYERS[activeId] || LAYERS.STANDARD_LIGHT;
  return {
    ...baseLayer,
    id: layerId
  };
});

export const selectedFeaturesAtom = selectAtom(
  dataAtom,
  (data) => {
    return USelection.getSelectedFeatures(data);
  },
  shallowArrayEqual
);

export const selectionAtom = focusAtom(dataAtom, (optic) =>
  optic.prop('selection')
);

/**
 * User presences, keyed by user id
 */
export const presencesAtom = atom<{
  presences: Map<number, IPresence>;
}>({
  get presences() {
    return new Map();
  }
});

export const memoryMetaAtom = atom<Omit<PersistenceMetadataMemory, 'type'>>({
  symbolization: SYMBOLIZATION_NONE,
  label: null,
  layer: null
});

export const searchHistoryAtom = atom<string[]>([]);

// ----------------------------------------------------------------------------
/**
 * Split
 */
export type Side = 'left' | 'right';

export const OTHER_SIDE: Record<Side, Side> = {
  left: 'right',
  right: 'left'
};

/**
 * The separation between the map and the pane, which can
 * be controlled by dragging the resizer
 */
export const MIN_SPLITS = {
  left: 200,
  right: 200
} as const;

export interface Splits {
  bottom: number;
  rightOpen: boolean;
  right: number;
  leftOpen: boolean;
  left: number;
}

export const splitsAtom = atom<Splits>({
  bottom: 500,
  rightOpen: true,
  right: 320,
  leftOpen: true,
  left: 200
});

export const showPanelBottomAtom = atom<boolean>(true);

// ----------------------------------------------------------------------------
export const showAllAtom = atomWithStorage('showAll', true);
export const featureEditorActiveTab = atomWithStorage(
  'featureEditorActiveTab',
  'styles'
);

export const panelSymbolizationExportOpen = atomWithStorage(
  'panelSymbolizationExportOpen',
  true
);

export const hideHintsAtom = atomWithStorage<Mode[]>('hideHints', []);

export const scaleUnitAtom = atomWithStorage<ScaleUnit>(
  'scaleUnit',
  'imperial'
);

export const addMetadataWithGeocoderAtom = atomWithStorage(
  'addMetadataWithGeocoder',
  false
);

export type {
  DialogStateCastProperty as ModalStateCastProperty,
  DialogStateImport as ModalStateImport
} from 'state/dialog_state';
// ----------------------------------------------------------------------------
/**
 * Modal state
 */
export { dialogAtom } from 'state/dialog_state';

/**
 * Current layer state
 * TODO: move to server
 */
export type PartialLayer = SetOptional<MapboxLayer, 'createdById'>;

/**
 * Moment log state. This is the client-side representation
 * of undo/redo history, which is only relevant to the user
 * editing this document.
 */
export const momentLogAtom = atom<MomentLog>(new CMomentLog());

// ----------------------------------------------------------------------------
/**
 * Selection state
 */

/**
 * A selection of a single feature.
 */
export interface SelSingle {
  type: 'single';
  /**
   * The feature's id
   */
  id: StringId;
  parts: readonly VertexId[];
}

export interface SelMulti {
  type: 'multi';
  ids: readonly StringId[];
  previousIds?: readonly StringId[];
}

/**
 * This is not an abbreviation, it is named Sel
 * instead of Selection for safety: otherwise
 * window.Selection will sneak in if you don't
 * import the type.
 */
export type Sel =
  | SelMulti
  | {
      type: 'none';
    }
  | SelSingle;

export const SELECTION_NONE: Sel = {
  type: 'none'
};

// ----------------------------------------------------------------------------
/**
 * Ephemeral editing state
 */
export interface EphemeralEditingStateLasso {
  type: 'lasso';
  box: [Pos2, Pos2];
}

export const cursorStyleAtom = atom<React.CSSProperties['cursor']>('default');

export type EphemeralEditingState =
  | EphemeralEditingStateLasso
  | { type: 'none' };

export const ephemeralStateAtom = atom<EphemeralEditingState>({ type: 'none' });

export { Mode, MODE_INFO, modeAtom };

export const lastSearchResultAtom = atom<QItemAddable | null>(null);

/**
 * File info
 */
export const fileInfoAtom = atom<FileInfo | null>(null);

const fileInfoMachine = createMachine({
  predictableActionArguments: true,
  id: 'fileInfo',
  initial: 'idle',
  states: {
    idle: {
      on: {
        show: 'visible'
      }
    },
    visible: {
      after: {
        2000: {
          target: 'idle'
        }
      }
    }
  }
});

export const fileInfoMachineAtom = atomWithMachine(() => fileInfoMachine);

export enum TabOption {
  JSON = 'JSON',
  Table = 'Table',
  List = 'List',
  Symbolization = 'Symbolization'
}

export const tabAtom = atom<TabOption>(TabOption.JSON);

export type VirtualColumns = string[];
export const virtualColumnsAtom = atom<VirtualColumns>([]);

export interface FilterOptions {
  column: string | null;
  search: string | null;
  isCaseSensitive: boolean;
  geometryType: string | null;
  exact: boolean;
}

export const initialFilterValues: FilterOptions = {
  column: '',
  search: '',
  isCaseSensitive: false,
  geometryType: null,
  exact: false
};

export const tableFilterAtom = atom<FilterOptions>(initialFilterValues);

export const circleTypeAtom = atomWithStorage<CIRCLE_TYPE>(
  'circleType',
  CIRCLE_TYPE.MERCATOR
);
