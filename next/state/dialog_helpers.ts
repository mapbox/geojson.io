import type { ConvertResult } from 'app/lib/convert/utils';
import type { FileGroups } from 'app/lib/group_files';
import type { SimplifySupportedGeometry } from 'app/lib/map_operations/simplify';
import type { IFeature, IWrappedFeature } from 'types';
import type {
  DialogStateImport,
  DialogStateCircle,
  DialogStateImportNotes,
  DialogStateCastProperty,
  DialogStateBuffer,
  DialogStateSimplify
} from './dialog_state';

/**
 * Centralized dialog configurations with their titles and descriptions.
 * This ensures consistent messaging across the app and makes updates easier.
 */
export const DIALOG_CONFIGS = {
  quickswitcher: {
    title: 'Search',
    description: 'Search locations, addresses, POIs or features'
  },
  export: {
    title: 'Export',
    description: 'Export features: choose export options'
  },
  about: {
    title: 'About',
    description: 'About this application'
  },
  from_url: {
    title: 'Import from URL',
    description: 'Load GeoJSON data from a URL'
  },
  circle_types: {
    title: 'Circle Type',
    description: 'Choose circle creation method'
  }
} as const;

/**
 * Helper functions to create dialog states with proper typing.
 * These functions ensure that all required fields are provided and
 * maintain consistency across the application.
 */
export const DialogHelpers = {
  quickswitcher: () => ({
    type: 'quickswitcher' as const,
    ...DIALOG_CONFIGS.quickswitcher
  }),

  export: () => ({
    type: 'export' as const,
    ...DIALOG_CONFIGS.export
  }),

  about: () => ({
    type: 'about' as const,
    ...DIALOG_CONFIGS.about
  }),

  fromUrl: () => ({
    type: 'from_url' as const,
    ...DIALOG_CONFIGS.from_url
  }),

  circleTypes: () => ({
    type: 'circle_types' as const,
    ...DIALOG_CONFIGS.circle_types
  }),

  // Dialogs that require additional data
  import: (files: FileGroups): DialogStateImport => ({
    type: 'import',
    title: 'Import',
    description: 'Import data from files',
    files
  }),

  importNotes: (result: ConvertResult): DialogStateImportNotes => ({
    type: 'import_notes',
    title: 'Import Notes',
    description: 'Review import warnings and notes',
    result
  }),

  castProperty: (column: string): DialogStateCastProperty => ({
    type: 'cast_property',
    title: 'Convert Property',
    description: `Convert property type for ${column}`,
    column
  }),

  buffer: (features: IWrappedFeature[]): DialogStateBuffer => ({
    type: 'buffer',
    title: 'Buffer',
    description: 'Create a buffer on this feature',
    features
  }),

  simplify: (
    features: IWrappedFeature<IFeature<SimplifySupportedGeometry>>[]
  ): DialogStateSimplify => ({
    type: 'simplify',
    title: 'Simplify',
    description: 'Simplify feature geometry',
    features
  }),

  circle: (position: Pos2): DialogStateCircle => ({
    type: 'circle',
    title: 'Create Circle',
    description: 'Configure circle parameters',
    position
  })
};
