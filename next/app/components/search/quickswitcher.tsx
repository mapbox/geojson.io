import { Combobox } from '@headlessui/react';
import { ArrowDownIcon } from '@radix-ui/react-icons';
import {
  comboboxFooterClass,
  comboboxInputClass,
  ResultsOptions
} from 'app/components/search/quickswitcher_shared';
import { Loading } from 'app/components/elements';
import { MapContext } from 'app/context/map_context';
import { useZoomTo } from 'app/hooks/use_zoom_to';
import {
  type GeocoderResults,
  mapboxSearch,
  retrieveFeature,
  type QItem
} from 'app/lib/geocode';
import { getColumns, getFn } from 'app/lib/search_utils';
import Fuse from 'fuse.js';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { LngLatBounds, type LngLatLike } from 'mapbox-gl';
import { useContext, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { USelection } from 'state';
import {
  dataAtom,
  lastSearchResultAtom,
  searchHistoryAtom,
  selectionAtom
} from 'state/jotai';
import debounce from 'lodash/debounce';

function featureToBounds(bbox: BBox4) {
  const [a, b, c, d] = bbox;
  return LngLatBounds.convert([
    [a, b],
    [c, d]
  ]);
}

/**
 * https://github.com/mapbox/mapbox-gl-geocoder/blob/main/lib/index.js#L83
 */
const POI_ZOOM = 16;

export function QuickswitcherDialog({ onClose }: { onClose: () => void }) {
  const map = useContext(MapContext);
  const data = useAtomValue(dataAtom);
  const { featureMap } = data;
  const zoomTo = useZoomTo();

  const setSelection = useSetAtom(selectionAtom);
  const setLastSearchResult = useSetAtom(lastSearchResultAtom);
  const [searchHistory, setSearchHistory] = useAtom(searchHistoryAtom);
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [touched, setTouched] = useState<boolean>(false);
  const [historyCursor, setHistoryCursor] = useState<number>(0);

  const debouncedSetQuery = useMemo(() => debounce(setDebouncedQuery, 300), []);

  const searchIndex = useMemo(() => {
    const columns = getColumns({
      featureMap,
      virtualColumns: []
    });
    return new Fuse(Array.from(featureMap.values()), {
      keys: columns,
      isCaseSensitive: false,
      includeMatches: true,
      getFn,
      threshold: 0.2,
      ignoreLocation: true
    });
  }, [featureMap]);

  const {
    data: list,
    isLoading,
    isError
  } = useQuery(
    ['geocoder', debouncedQuery],
    async ({ signal }) => {
      return mapboxSearch({
        query: debouncedQuery || '',
        center: map?.map.getCenter(),
        zoom: map?.map.getZoom(),
        signal,
        searchIndex
      });
    },
    {
      enabled: debouncedQuery.length > 2,
      keepPreviousData: true
    }
  );

  function goToFeature(item: QItem) {
    if (!item || !map) return;

    const toCoords = (coordinates: LngLatLike) => {
      map.map.zoomTo(POI_ZOOM, { animate: false });
      map.map.setCenter(coordinates, {
        animate: false
      });
    };

    const toBounds = (bounds: BBox4) => {
      map.map.fitBounds(featureToBounds(bounds), {
        animate: false
      });
    };

    switch (item.type) {
      case 'action': {
        void item.action.onSelect();
        break;
      }
      case 'wrappedFeature': {
        setSelection(USelection.single(item.result.item.id));
        void zoomTo([item.result.item]);
        break;
      }
      case 'coordinate': {
        toCoords(item.coordinates);
        setLastSearchResult(item);
        break;
      }
      case 'geocoder': {
        // Retrieve full feature with coordinates when user clicks
        void retrieveFeature(item.suggestion).then((feature) => {
          const coords = feature.geometry.coordinates;
          toCoords([coords[0], coords[1]] as LngLatLike);
          // Store as a regular Feature for last search result
          const featureItem: QItem = {
            type: 'Feature',
            geometry: feature.geometry,
            bbox: feature.properties.bbox,
            properties: {
              id: feature.properties.mapbox_id,
              label: item.properties.label
            }
          };
          setLastSearchResult(featureItem);
        });
        break;
      }
      case 'Feature': {
        if (item.bbox) {
          toBounds(item.bbox as BBox4);
        } else {
          toCoords(item.geometry.coordinates as LngLatLike);
        }
        setLastSearchResult(item);
        break;
      }
      case 'extent': {
        toBounds(item.coordinates);
        setLastSearchResult(item);
        break;
      }
      case 'container':
      case 'leaf': {
        // Pass. These are only included
        // in the Index version of this component.
      }
    }
  }

  const geocoderResults = Array.isArray(list?.geocoder) ? list.geocoder : [];
  const literalResults = Array.isArray(list?.literal) ? list.literal : [];
  const featureResults = Array.isArray(list?.features) ? list.features : [];

  return (
    <div aria-label="Search" className="relative w-full">
      <Combobox
        value={null}
        onChange={(item) => {
          if (query) {
            setSearchHistory((history) => {
              return [query].concat(history);
            });
          }
          if (item) {
            onClose();
            goToFeature(item);
          }
        }}
      >
        <Combobox.Input
          ref={(input: any) => {
            (input as HTMLInputElement)?.focus();
          }}
          onKeyUp={(e: any) => {
            switch (e.key) {
              case 'Escape': {
                onClose();
                break;
              }
              case 'ArrowUp': {
                if (!touched && searchHistory.length) {
                  const item = searchHistory[historyCursor];
                  if (item) {
                    setQuery(searchHistory[0]);
                    setHistoryCursor((i) => i + 1);
                    e.target.value = item;
                  }
                }
                break;
              }
            }
          }}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            debouncedSetQuery(event.target.value);
            if (!touched) setTouched(true);
          }}
          spellCheck={false}
          id="search-geocoder"
          aria-label="Search"
          className={comboboxInputClass}
        />
        {isLoading ? (
          <Loading />
        ) : isError ? (
          <div className="p-4 text-red-600">
            Error loading results: {error?.message || 'Unknown error'}
          </div>
        ) : (
          <Combobox.Options className="bg-white dark:bg-gray-900">
            <ResultsOptions results={literalResults} title="Literal" />
            <ResultsOptions results={geocoderResults} title="Geocoder" />
            <ResultsOptions results={featureResults} title="Features" />
          </Combobox.Options>
        )}
      </Combobox>

      <div className={comboboxFooterClass}>
        {hasResults(list) ? (
          <>
            <ArrowDownIcon /> Navigate options
            <div className="flex-auto text-right">Powered by Mapbox Search</div>
          </>
        ) : (
          'Type to search…'
        )}
      </div>
    </div>
  );
}

/**
 * Note: this needs to be updated if `results` ever gets another
 * section.
 */
function hasResults(results: GeocoderResults | undefined): boolean {
  if (!results) return false;
  return !!(
    results.features.length ||
    results.geocoder.length ||
    results.literal.length
  );
}
