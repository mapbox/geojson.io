import type { IDMap } from 'app/lib/id_mapper';
import type { Promisable } from 'type-fest';
import type { ISymbolization } from 'types';
import { z } from 'zod';
import type { MomentInput } from './moment';

export type PersistenceMetadataMemory = {
  type: 'memory';
  symbolization: ISymbolization;
  label: string | null;
  layer: any;
};

type PersistenceMetadata = PersistenceMetadataMemory;

export interface TransactOptions {
  quiet?: boolean;
}

const EditWrappedFeatureCollection = z.object({
  id: z.string(),
  name: z.optional(z.string()),
  label: z.optional(z.string()),
  layerId: z.optional(z.number().int().nullable()),
  defaultLayer: z.any(),
  access: z.any(),
  symbolization: z.any(),
  wrappedFeatureCollectionFolderId: z.string().uuid().nullable().optional()
});

export type MetaUpdatesInput = Omit<
  z.infer<typeof EditWrappedFeatureCollection>,
  'id'
>;

export type MetaPair = [
  PersistenceMetadata,
  (updates: MetaUpdatesInput) => Promisable<void>
];

export interface IPersistence {
  idMap: IDMap;

  putPresence(presence: unknown): Promise<void>;

  useLastPresence(): null;

  useHistoryControl(): (direction: 'undo' | 'redo') => Promise<void>;

  /**
   * The main method for making changes to the map: give this
   * a partial moment which can delete or add features and folders,
   * and it'll implement it. Unless you specify that the change
   * is quiet, the change is pushed onto the undo history.
   */
  useTransact(): (
    moment: Partial<MomentInput> & TransactOptions
  ) => Promise<void>;

  /**
   * Delete existing features.
   */
  useMetadata(): MetaPair;
}
