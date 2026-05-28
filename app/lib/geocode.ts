import type { Action } from 'app/components/context_actions/action_item';
import { env } from 'app/lib/env_client';
import type { ContainerNode, LeafNode } from 'app/lib/tree';
import Fuse, { type FuseResult } from 'fuse.js';
import pick from 'lodash/pick';
import type { LngLat } from 'mapbox-gl';
import { Either, Left, Right } from 'purify-ts/Either';
import type { JsonObject } from 'type-fest';
import type { IFeature, IWrappedFeature, Point } from 'types';
import { z } from 'zod';
import { SearchSession, SearchBoxCore } from '@mapbox/search-js-core';
import type {
  SearchBoxOptions,
  SearchBoxSuggestion,
  SearchBoxFeatureSuggestion,
  SearchBoxSuggestionResponse,
  SearchBoxRetrieveResponse
} from '@mapbox/search-js-core';
import { ConvertError } from './errors';
import {
  bboxToPolygon,
  formatCoordinates,
  parseBBOX,
  parseCoordinates
} from './geometry';
import { truncate } from './utils';

interface TreeFolder {
  folderId: any;
  name: string;
  id: any;
}

interface TreeWfc {
  name: string;
  wrappedFeatureCollectionFolderId: any;
}

type SearchIndex = Fuse<IWrappedFeature>;

type QItemWrappedFeature = {
  type: 'wrappedFeature';
  result: FuseResult<IWrappedFeature>;
};

type QItemAction = {
  type: 'action';
  action: Action;
};

type QItemCoordinate = {
  type: 'coordinate';
  name: string;
  coordinates: [number, number];
};

type QItemExtent = {
  type: 'extent';
  name: string;
  coordinates: [number, number, number, number];
};

type SearchBoxSuggestionItem = {
  type: 'geocoder';
  suggestion: SearchBoxSuggestion;
  properties: {
    label: string;
  };
};

type QItemContainerNode = ContainerNode<TreeFolder, TreeWfc>;
type QItemLeafNode = LeafNode<TreeWfc>;

export type QItemAddable = IGeocoderFeature | QItemCoordinate | QItemExtent;

export type QItem =
  | QItemAddable
  | QItemWrappedFeature
  | QItemAction
  | SearchBoxSuggestionItem
  | QItemContainerNode
  | QItemLeafNode;

type SearchBoxSession = SearchSession<
  SearchBoxOptions,
  SearchBoxSuggestion,
  SearchBoxSuggestionResponse,
  SearchBoxRetrieveResponse
>;

/**
 * Parse Mapbox Search JS response -----------------------------------------------
 */
const zBBox4 = z.tuple([z.number(), z.number(), z.number(), z.number()]);

const MapboxSearchProperties = z
  .object({
    mapbox_id: z.string(),
    name: z.string(),
    full_address: z.string().optional(),
    place_formatted: z.string().optional()
  })
  .passthrough();

type IMapboxSearchProperties = z.infer<typeof MapboxSearchProperties>;

const zPoint: z.ZodType<Point> = z.lazy(() =>
  z.object({
    type: z.literal('Point'),
    coordinates: z.array(z.number()).min(2)
  })
);

const MapboxSearchFeature = z.object({
  type: z.literal('Feature'),
  geometry: zPoint,
  bbox: z.optional(zBBox4),
  properties: MapboxSearchProperties
});

type IMapboxSearchFeature = IFeature<Point, IMapboxSearchProperties>;

// Type for geocoder features (simpler format used internally)
const GeocoderProperties = z.object({
  id: z.string(),
  label: z.string()
});

type IGeocoderProperties = z.infer<typeof GeocoderProperties>;
type IGeocoderFeature = IFeature<Point, IGeocoderProperties>;

// Mapbox Search API result format
export const MapboxSearchResult = z.object({
  bbox: z.optional(zBBox4),
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      geometry: zPoint,
      bbox: z.optional(zBBox4),
      properties: GeocoderProperties
    })
  )
});

export type MapboxSearchResultType = z.infer<typeof MapboxSearchResult>;

/**
 * Retrieve full feature with coordinates from a SearchBoxSuggestion
 * This should be called when the user clicks on a suggestion to get coordinates
 */
export async function retrieveFeature(
  suggestion: SearchBoxSuggestion
): Promise<SearchBoxFeatureSuggestion> {
  const search = new SearchBoxCore({ accessToken: env.MAPBOX_TOKEN });
  const session = getSearchSession(search);

  const response = await session.retrieve(suggestion);

  // Response contains an array of features, return the first one
  return response.features[0];
}

/**
 * Transform a Pos2 coordinate into a QItem, if it seems
 * valid, otherwise return nothing.
 */
export function coordFeature(
  pos: Pos2,
  flip = false
): Either<ConvertError, QItemCoordinate> {
  if (flip) {
    pos = pos.slice().reverse() as Pos2;
  }
  if (pos[1] > 90 || pos[1] < -90) {
    return Left(new ConvertError('Coordinate out of bounds'));
  }
  return Right({
    type: 'coordinate',
    name: `${formatCoordinates(pos)}`,
    coordinates: pos
  });
}

/**
 * Convert bbox into a QItem. Can't fail, but maybe should.
 */
export function bboxToQItem(bbox: BBox4): QItemExtent {
  return {
    type: 'extent',
    name: `${bbox.join(',')}`,
    coordinates: bbox
  };
}

export function getQItemNamePreview(item: QItemAddable): string {
  switch (item.type) {
    case 'Feature': {
      return truncate(item.properties.label, 24);
    }
    case 'extent': {
      return item.name;
    }
    case 'coordinate': {
      return item.name;
    }
  }
}

function includeProperties(properties: JsonObject, includeData = false) {
  if (includeData || !properties) return properties;
  return pick(properties, ['name', 'label']);
}

export function qItemToPolygon(
  item: QItemAddable,
  includeData = false
): IFeature | null {
  switch (item.type) {
    case 'coordinate':
      return null;
    case 'Feature': {
      if (item.bbox) {
        return {
          type: 'Feature',
          geometry: bboxToPolygon(item.bbox),
          properties: includeProperties(item.properties, includeData)
        };
      }
      return null;
    }
    case 'extent': {
      return {
        type: 'Feature',
        geometry: bboxToPolygon(item.coordinates),
        properties: {}
      };
    }
  }
}

export function qItemToFeature(
  item: QItemAddable,
  includeData = false
): IFeature {
  switch (item.type) {
    case 'Feature': {
      return {
        ...item,
        properties: includeProperties(item.properties, includeData)
      };
    }
    case 'extent': {
      return {
        type: 'Feature',
        geometry: bboxToPolygon(item.coordinates),
        properties: {}
      };
    }
    case 'coordinate': {
      return {
        type: 'Feature',
        geometry: {
          coordinates: item.coordinates,
          type: 'Point'
        },
        properties: {}
      };
    }
  }
}

/**
 * Get the possible coordinate and bbox interpretations
 * of the user input.
 */
export function getLiteralItems(query: string) {
  const coordEither = parseCoordinates(query);
  const coord = coordEither.chain((pos) => coordFeature(pos));
  const coord2 = coordEither.chain((pos) => coordFeature(pos, true));
  const bbox = parseBBOX(query).map(bboxToQItem);
  return Either.rights<ConvertError, QItem>([bbox, coord, coord2]);
}

export function getActions(query: string, actions: Action[]): QItemAction[] {
  const searchIndex = new Fuse(actions, {
    keys: ['label'],
    isCaseSensitive: false,
    threshold: 0.2,
    ignoreLocation: true
  });
  const results = searchIndex.search(query, {
    limit: 5
  });
  return results.map((result) => {
    return {
      type: 'action',
      action: result.item
    };
  });
}

function getFeatureItems(
  query: string,
  searchIndex: SearchIndex
): QItemWrappedFeature[] {
  const results = searchIndex.search(query, {
    limit: 5
  });
  return results.map((result) => {
    return {
      type: 'wrappedFeature',
      result
    };
  });
}

export interface GeocoderResults {
  literal: QItem[];
  features: QItem[];
  geocoder: SearchBoxSuggestionItem[];
}

// Create a singleton search session instance
let searchSession: SearchBoxSession | null = null;

function getSearchSession(SBCoreInstance: SearchBoxCore): SearchBoxSession {
  if (!searchSession) {
    searchSession = new SearchSession(SBCoreInstance);
  }
  return searchSession;
}

/**
 * Search using Mapbox Search JS Core
 * Combines literal coordinate/bbox parsing with geocoding suggestions
 */
export async function mapboxSearch({
  query,
  center,
  zoom,
  searchIndex
}: {
  query: string;
  center: LngLat | undefined;
  zoom: number | undefined;
  signal: AbortSignal | undefined;
  searchIndex: SearchIndex;
}): Promise<GeocoderResults> {
  if (!query) {
    return {
      literal: [],
      features: [],
      geocoder: []
    };
  }

  const search = new SearchBoxCore({ accessToken: env.MAPBOX_TOKEN });

  const session = getSearchSession(search);

  try {
    // Get suggestions from Mapbox Search
    const response = await session.suggest(query, {
      proximity: center ? [center.lng, center.lat] : undefined,
      limit: 8
    });

    // Filter for feature suggestions (exclude category suggestions)
    let featureSuggestions = response.suggestions.filter(
      (s: SearchBoxSuggestion) =>
        s.feature_type !== 'category' && s.feature_type !== 'brand'
    );

    // Only return top 5 results (ensuring if brand/category results are removed we still return 5 results)
    featureSuggestions = featureSuggestions.slice(0, 5);

    // Map suggestions to display format with labels
    const geocoderItems: SearchBoxSuggestionItem[] = featureSuggestions.map(
      (suggestion: SearchBoxSuggestion) => ({
        type: 'geocoder',
        suggestion,
        properties: {
          label:
            suggestion.name && suggestion.place_formatted
              ? `${suggestion.name} - ${
                  suggestion.full_address || suggestion.place_formatted
                }`
              : suggestion.name_preferred ||
                suggestion.name ||
                'Unknown location'
        }
      })
    );

    return {
      literal: getLiteralItems(query),
      features: getFeatureItems(query, searchIndex),
      geocoder: geocoderItems
    };
  } catch (error) {
    // If search fails, still return literal and local results
    console.error('Mapbox search error:', error);
    return {
      literal: getLiteralItems(query),
      features: getFeatureItems(query, searchIndex),
      geocoder: []
    };
  }
}
