import type { IWrappedFeature } from 'types';

/**
 * A two-way map between string UUIDs
 * and integer IDs.
 */
export interface IDMap {
  /**
   * Array of all the string identifiers.
   * The index of each identifier is its
   * map ID.
   *
   * Go from map id to string id:
   * uuid = idmap[integer_map_id]
   */
  uuids: string[];

  /**
   * Map from UUID strings to integer
   * map IDs.
   *
   * intid = intids.get(uuid)
   */
  intids: Map<string, RawId>;
}

export const UIDMap = {
  empty(): IDMap {
    return {
      uuids: [],
      intids: new Map()
    };
  },
  /**
   * Used for public maps. We have a lot of features,
   * all at once, and want to load all their IDs into the map.
   */
  loadIdsFromPersistence(wrappedFeatures: IWrappedFeature[]): IDMap {
    const map = UIDMap.empty();
    for (const { id } of wrappedFeatures) {
      UIDMap.pushUUID(map, id);
    }
    return map;
  },
  /**
   * Record the presence of a new UUID
   * in the map. If the UUID already exists,
   * this is a noop.
   */
  pushUUID(map: IDMap, uuid: string): void {
    // Do not push duplicates.
    if (map.intids.has(uuid)) return;
    const index = map.uuids.push(uuid) - 1;
    map.intids.set(uuid, index as RawId);
  },
  deleteUUID(map: IDMap, uuid: string): void {
    const index = map.intids.get(uuid);
    if (index === undefined) return;

    // Allow this ID to be GC'ed by removing
    // the reference to it. This makes the array
    // sparse. Possibly this should replace with null
    // instead?
    //
    // This could also rebuild the indexes, but
    // that would be slower and I'm not confident
    // that the memory difference between a sparse
    // array and a short array is great enough.

    // eslint-disable-next-line @typescript-eslint/no-array-delete
    delete map.uuids[index];
    map.intids.delete(uuid);
  },
  getUUID(map: IDMap, intid: number): string {
    return map.uuids[intid];
  },
  getIntID(map: IDMap, uuid: string): RawId {
    return map.intids.get(uuid)!;
  }
};
