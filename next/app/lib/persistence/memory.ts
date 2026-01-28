import { type IDMap, UIDMap } from 'app/lib/id_mapper';
import { sortAts } from 'app/lib/parse_stored';
import type {
  IPersistence,
  MetaPair,
  MetaUpdatesInput
} from 'app/lib/persistence/ipersistence';
import {
  EMPTY_MOMENT,
  fMoment,
  type MomentInput,
  OPPOSITE,
  UMoment,
  UMomentLog
} from 'app/lib/persistence/moment';
import { generateKeyBetween } from 'fractional-indexing';
import once from 'lodash/once';
import { useAtom } from 'jotai';
import {
  type Data,
  dataAtom,
  styleConfigAtom,
  memoryMetaAtom,
  momentLogAtom,
  type Store
} from 'state/jotai';
import type { IWrappedFeature, IWrappedFeatureInput } from 'types';
import { getFreshAt, momentForDeleteFeatures, trackMoment } from './shared';

export class MemPersistence implements IPersistence {
  idMap: IDMap;
  private store: Store;
  constructor(idMap: IDMap, store: Store) {
    this.idMap = idMap;
    this.store = store;

    // Sync IDMap with features loaded from sessionStorage
    // atomWithStorage hydrates asynchronously, so we subscribe to changes
    // and sync the IDMap when features appear (from sessionStorage restore)
    let hasHydrated = false;
    store.sub(dataAtom, () => {
      if (hasHydrated) return;

      const data = store.get(dataAtom);
      if (data.featureMap.size > 0) {
        for (const id of data.featureMap.keys()) {
          UIDMap.pushUUID(this.idMap, id);
        }
        hasHydrated = true;
      }
    });
  }
  putPresence = async () => {};

  /**
   * This could and should be improved. It does do some weird stuff:
   * we need to write to the moment log and to features.
   */
  private apply(moment: MomentInput) {
    let ctx = this.store.get(dataAtom);
    let styleConfig = this.store.get(styleConfigAtom);
    if (!ctx.featureMap.size) {
      ctx = {
        ...ctx,
        featureMap: new Map()
      };
    }
    const reverse = UMoment.merge(
      fMoment(moment.note || `Reverse`),
      this.deleteFeaturesInner(moment.deleteFeatures, ctx),
      this.putFeaturesInner(moment.putFeatures, ctx)
      // style config is now a single value, no need for put/delete logic
    );

    this.store.set(dataAtom, {
      selection: ctx.selection,
      featureMap: new Map(
        Array.from(ctx.featureMap).sort((a, b) => {
          return sortAts(a[1], b[1]);
        })
      )
    });

    // style config is now a single value, no need for put/delete logic
    return reverse;
  }

  useTransact() {
    return (partialMoment: Partial<MomentInput> & { quiet?: boolean }) => {
      const { quiet, ...momentData } = partialMoment;
      trackMoment(momentData);
      const moment: MomentInput = { ...EMPTY_MOMENT, ...momentData };
      // Update app state - dataAtom
      const result = this.apply(moment);
      // If update is not quiet, then update the momentLog / history
      if (!quiet) {
        this.store.set(
          momentLogAtom,
          UMomentLog.pushMoment(this.store.get(momentLogAtom), result)
        );
      }
      return Promise.resolve();
    };
  }

  useLastPresence() {
    return null;
  }

  useMetadata(): MetaPair {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [meta, setMeta] = useAtom(memoryMetaAtom);

    return [
      {
        type: 'memory',
        ...meta
      },
      (updates: MetaUpdatesInput) => {
        setMeta((meta) => {
          return {
            ...meta,
            ...updates
          };
        });
        return Promise.resolve();
      }
    ];
  }

  useHistoryControl() {
    return (direction: 'undo' | 'redo') => {
      const momentLog = UMomentLog.shallowCopy(this.store.get(momentLogAtom));
      const moment = momentLog[direction].shift();
      if (!moment) {
        // Nothing to undo
        return Promise.resolve();
      }
      const reverse = this.apply(moment);
      if (UMoment.isEmpty(reverse)) {
        // console.error(
        //   "[SKIPPING] Got an empty reverse, forward: ",
        //   moment,
        //   " reverse: ",
        //   reverse
        // );
        return Promise.resolve();
      }
      const opposite = OPPOSITE[direction];
      momentLog[opposite] = [reverse].concat(momentLog[opposite]);
      this.store.set(momentLogAtom, momentLog);
      return Promise.resolve();
    };
  }

  // PRIVATE --------------------------------------------
  //
  /**
   * Inner workings of delete features. Beware,
   * changes ctx by reference.
   *
   * @param features input features
   * @param ctx MUTATED
   * @returns new moment
   */
  private deleteFeaturesInner(
    features: readonly IWrappedFeature['id'][],
    ctx: Data
  ) {
    const moment = momentForDeleteFeatures(features, ctx);
    for (const id of features) {
      ctx.featureMap.delete(id);
    }
    return moment;
  }

  private putFeaturesInner(features: IWrappedFeatureInput[], ctx: Data) {
    const moment = fMoment('Put features');
    const ats = once(() =>
      Array.from(ctx.featureMap.values(), (wrapped) => wrapped.at).sort()
    );
    const atsSet = once(() => new Set(ats()));

    let lastAt: string | null = null;

    for (const inputFeature of features) {
      const oldVersion = ctx.featureMap.get(inputFeature.id);
      if (inputFeature.at === undefined) {
        if (!lastAt) lastAt = getFreshAt(ctx);
        const at = generateKeyBetween(lastAt, null);
        lastAt = at;
        inputFeature.at = at;
      }
      if (oldVersion) {
        moment.putFeatures.push(oldVersion);
      } else {
        moment.deleteFeatures.push(inputFeature.id);
        // If we're inserting a new feature but its
        // at value is already in the set, find it a
        // new value at the start
        if (atsSet().has(inputFeature.at)) {
          inputFeature.at = generateKeyBetween(null, ats()[0]);
        }
      }
      ctx.featureMap.set(inputFeature.id, inputFeature as IWrappedFeature);
      UIDMap.pushUUID(this.idMap, inputFeature.id);
    }

    return moment;
  }
}
