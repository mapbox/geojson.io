import difference from 'lodash/difference';
import uniq from 'lodash/uniq';

import type {
  Feature,
  Geometry,
  GeometryCollection,
  IFeature,
  MultiLineString,
  MultiPoint,
  MultiPolygon
} from 'types';

function mergeGeometryCollection(features: Feature[]): Feature {
  const newFeature: IFeature<GeometryCollection> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'GeometryCollection',
      geometries: []
    }
  };

  for (const feature of features) {
    switch (feature.geometry?.type) {
      case 'GeometryCollection':
        newFeature.geometry.geometries.push(...feature.geometry.geometries);
        break;
      default:
        if (feature.geometry === null) break;
        newFeature.geometry.geometries.push(feature.geometry);
        break;
    }
    mergeProperties(newFeature, feature);
  }

  return newFeature;
}

function mergeProperties(newFeature: Feature, feature: Feature) {
  if (!newFeature.properties) {
    newFeature.properties = {};
  }
  if (feature.properties) {
    Object.assign(newFeature.properties, feature.properties);
  }
}

function combineFeaturesPoint(features: Feature[]) {
  const newFeature: IFeature<MultiPoint> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPoint',
      coordinates: []
    }
  };
  for (const feature of features) {
    switch (feature.geometry?.type) {
      case 'Point':
        newFeature.geometry.coordinates.push(feature.geometry.coordinates);
        break;
      case 'MultiPoint':
        newFeature.geometry.coordinates.push(...feature.geometry.coordinates);
        break;
      default:
        break;
    }
    mergeProperties(newFeature, feature);
  }
  return newFeature;
}

function combineFeaturesPolygon(features: Feature[]) {
  const newFeature: IFeature<MultiPolygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: []
    }
  };
  for (const feature of features) {
    switch (feature.geometry?.type) {
      case 'Polygon':
        newFeature.geometry.coordinates.push(feature.geometry.coordinates);
        break;
      case 'MultiPolygon':
        newFeature.geometry.coordinates.push(...feature.geometry.coordinates);
        break;
      default:
        break;
    }
    mergeProperties(newFeature, feature);
  }
  return newFeature;
}

function combineFeaturesLineString(features: Feature[]) {
  const newFeature: IFeature<MultiLineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiLineString',
      coordinates: []
    }
  };
  for (const feature of features) {
    switch (feature.geometry?.type) {
      case 'LineString':
        // TODO: drop any
        newFeature.geometry.coordinates.push(feature.geometry.coordinates);
        break;
      case 'MultiLineString':
        newFeature.geometry.coordinates.push(...feature.geometry.coordinates);
        break;
      default:
        break;
    }
    mergeProperties(newFeature, feature);
  }
  return newFeature;
}

type MergeableFamilies = 'Polygon' | 'Point' | 'LineString';

function mergeFeatureFamily(
  features: Feature[],
  family: MergeableFamilies
): Feature {
  switch (family) {
    case 'Polygon':
      return combineFeaturesPolygon(features);
    case 'Point':
      return combineFeaturesPoint(features);
    case 'LineString':
      return combineFeaturesLineString(features);
  }
}

function inFamily(
  geometryTypes: Array<Geometry['type'] | undefined>,
  search: Array<Geometry['type']>
) {
  return difference(geometryTypes, search).length === 0;
}

function getFamily(features: Feature[]): MergeableFamilies | null {
  const geometryTypes = uniq(features.map((feature) => feature.geometry?.type));

  return inFamily(geometryTypes, ['Polygon', 'MultiPolygon'])
    ? 'Polygon'
    : inFamily(geometryTypes, ['LineString', 'MultiLineString'])
    ? 'LineString'
    : inFamily(geometryTypes, ['Point', 'MultiPoint'])
    ? 'Point'
    : null;
}

export function mergeFeaturesMessage(features: Feature[]): string {
  if (features.length < 2) return '';
  const family = getFamily(features);
  return family ? `Merge into Multi${family}` : `Merge into GeometryCollection`;
}

export function mergeFeatures(features: Feature[]): Feature {
  const family = getFamily(features);

  if (family === null) {
    return mergeGeometryCollection(features);
  } else {
    return mergeFeatureFamily(features, family);
  }
}
