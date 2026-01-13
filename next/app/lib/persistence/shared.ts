import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';
import { type Data, dataAtom, momentLogAtom } from 'state/jotai';
import type { IWrappedFeature } from 'types';
import { fMoment, type Moment, type MomentInput, UMomentLog } from './moment';

// This  used to send to posthog, but now could be removed
// or wired into your own product analytics.
export function trackMoment(partialMoment: Partial<MomentInput>) {
  const { track } = partialMoment;
  if (track) {
    delete partialMoment.track;
  }
}

/**
 * Same as momentForDeleteFolders but for features:
 * create an undelete operation.
 *
 * @param features The folders to delete by ID
 * @param param1 internal context
 * @returns a moment with an undelete
 */
export function momentForDeleteFeatures(
  features: readonly IWrappedFeature['id'][],
  { featureMap }: Data
): Moment {
  const moment = fMoment('Update features');
  for (const id of features) {
    const feature = featureMap.get(id);
    if (feature) {
      moment.putFeatures.push(feature);
    }
  }
  return moment;
}

function getLastAtInMap(map: Map<unknown, IWrappedFeature>): string {
  let lastAt = 'a0';
  for (const val of map.values()) {
    lastAt = val.at;
  }
  return lastAt;
}

/**
 * Get the last known at value from
 * a state ctx. This takes O(n) wrt length of both
 * arrays. It would be nice for the design to eliminate
 * the need for this by keeping things sorted. That is a big TODO.
 *
 * @param ctx
 * @returns the last at, or a0
 */
export function getFreshAt(ctx: Data): string {
  return getLastAtInMap(ctx.featureMap);
}

export function useEndSnapshot() {
  return useAtomCallback(
    useCallback((_get, set) => {
      set(momentLogAtom, (momentLog) => UMomentLog.endSnapshot(momentLog));
    }, [])
  );
}

export function useStartSnapshot() {
  return useAtomCallback(
    useCallback(
      (_get, set, feature: Parameters<typeof UMomentLog.startSnapshot>[1]) => {
        set(momentLogAtom, (momentLog) =>
          UMomentLog.startSnapshot(momentLog, feature)
        );
      },
      []
    )
  );
}

/**
 * Dangerous! This makes the assumption that the
 * previous history state is about to be undone. This
 * is only used in the double-click case for now.
 */
export function usePopMoment() {
  return useAtomCallback(
    useCallback((_get, set, n: number) => {
      set(momentLogAtom, (momentLog) => UMomentLog.popMoment(momentLog, n));
    }, [])
  );
}

/**
 * Subscribe to the raw map of features indexed
 * by ID.
 *
 * @returns map of folders
 */
export function useFeatureMap(): Map<string, IWrappedFeature> {
  return useAtomValue(dataAtom).featureMap;
}
