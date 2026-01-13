import type { ConvertResult } from 'app/lib/convert/utils';
import type { FileGroups } from 'app/lib/group_files';
import type { SimplifySupportedGeometry } from 'app/lib/map_operations/simplify';
import { atomWithReset } from 'jotai/utils';
import type { IFeature, IWrappedFeature } from 'types';

/**
 * Modal state, controlled by dragging and dropping,
 * keybindings, etc.
 */
export type DialogStateImport = {
  type: 'import';
  title: string;
  description: string;
  files: FileGroups;
};

export type DialogStateCircle = {
  type: 'circle';
  title: string;
  description: string;
  position: Pos2;
};

export type DialogStateImportNotes = {
  type: 'import_notes';
  title: string;
  description: string;
  result: ConvertResult;
};

export type DialogStateCastProperty = {
  type: 'cast_property';
  title: string;
  description: string;
  column: string;
};

export type DialogStateBuffer = {
  type: 'buffer';
  title: 'Buffer';
  description: 'Create a buffer on this feature';
  features: IWrappedFeature[];
};

export type DialogStateSimplify = {
  type: 'simplify';
  title: 'Simplify';
  description: 'Simplify feature geometry';
  features: IWrappedFeature<IFeature<SimplifySupportedGeometry>>[];
};

type DialogState =
  | DialogStateImport
  | DialogStateImportNotes
  | DialogStateCastProperty
  | DialogStateSimplify
  | DialogStateBuffer
  | DialogStateCircle
  | {
      type: 'circle_types';
      title: string;
      description: string;
    }
  | {
      type: 'quickswitcher';
      title: string;
      description: string;
    }
  | {
      type: 'export';
      title: string;
      description: string;
    }
  | {
      type: 'from_url';
      title: string;
      description: string;
    }
  | {
      type: 'about';
      title: string;
      description: string;
    }
  | null;

export const dialogAtom = atomWithReset<DialogState>(null);
