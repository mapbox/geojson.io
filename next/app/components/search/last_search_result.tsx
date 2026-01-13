import { GroupIcon, PlusIcon } from '@radix-ui/react-icons';
import {
  getQItemNamePreview,
  qItemToFeature,
  qItemToPolygon
} from 'app/lib/geocode';
import { newFeatureId } from 'app/lib/id';
import { usePersistence } from 'app/lib/persistence/context';
import { captureException } from 'integrations/errors';
import { useAtom } from 'jotai';
import { USelection } from 'state';
import {
  addMetadataWithGeocoderAtom,
  lastSearchResultAtom,
  selectionAtom
} from 'state/jotai';
import { match } from 'ts-pattern';
import type { Feature } from 'types';
import { Button } from '../elements';

export function LastSearchResult() {
  const [addMetadataWithGeocoder] = useAtom(addMetadataWithGeocoderAtom);
  const rep = usePersistence();
  const transact = rep.useTransact();
  const [lastSearchResult, setLastSearchResult] = useAtom(lastSearchResultAtom);
  const [selection, setSelection] = useAtom(selectionAtom);

  if (!lastSearchResult) {
    return null;
  }

  const onAddPoint: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const id = newFeatureId();
    transact({
      note: 'Added a geocoded point',
      track: 'add-geocoded-point',
      putFeatures: [
        {
          id,
          feature: qItemToFeature(lastSearchResult, addMetadataWithGeocoder)
        }
      ]
    })
      .then(() => {
        setSelection(USelection.single(id));
      })
      .catch((e) => captureException(e));
    setLastSearchResult(null);
    e.stopPropagation();
  };

  const asPolygon =
    lastSearchResult &&
    qItemToPolygon(lastSearchResult, addMetadataWithGeocoder);

  function onAddPolygon(asPolygon: Feature) {
    const id = newFeatureId();
    transact({
      note: 'Added a geocoded extent',
      putFeatures: [
        {
          id,
          feature: asPolygon
        }
      ]
    })
      .then(() => {
        setSelection(USelection.single(id));
      })
      .catch((e) => captureException(e));
    setLastSearchResult(null);
  }

  return (
    <div
      className="absolute inset-0 bg-opacity-50 p-2 flex justify-end items-start"
      onClick={() => {
        setLastSearchResult(null);
      }}
    >
      <div className="bg-white p-2 rounded-md space-y-1 mt-12 border-gray-300">
        <div className="flex items-stretch gap-x-1">
          {match(lastSearchResult)
            .with({ type: 'extent' }, (lastSearchResult) => {
              return asPolygon ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={(e) => {
                    onAddPolygon(asPolygon);
                    e.stopPropagation();
                  }}
                >
                  <GroupIcon />
                  Add {getQItemNamePreview(lastSearchResult)}
                </Button>
              ) : null;
            })
            .with({ type: 'coordinate' }, (lastSearchResult) => {
              return (
                <Button type="button" variant="primary" onClick={onAddPoint}>
                  <PlusIcon />
                  Add {getQItemNamePreview(lastSearchResult)}
                </Button>
              );
            })
            .with({ type: 'Feature' }, (lastSearchResult) => {
              return (
                <>
                  <Button type="button" variant="primary" onClick={onAddPoint}>
                    <PlusIcon />
                    Add {getQItemNamePreview(lastSearchResult)}
                  </Button>
                  {asPolygon ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddPolygon(asPolygon);
                      }}
                    >
                      <GroupIcon />
                      Extent
                    </Button>
                  ) : null}
                </>
              );
            })
            .exhaustive()}
        </div>
      </div>
    </div>
  );
}
