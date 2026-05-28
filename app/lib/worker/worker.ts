import { getIssues } from '@placemarkio/check-geojson';
import { bufferFeature } from 'app/lib/buffer';
import { fileToGeoJSON, fromGeoJSON } from 'app/lib/convert';
import { booleanFeatures } from 'app/lib/map_operations/boolean_features';
import * as Comlink from 'comlink';
import { EitherHandler } from './shared';

const lib = {
  getIssues,
  bufferFeature,
  booleanFeatures,
  fileToGeoJSON,
  fromGeoJSON
};

export type Lib = typeof lib;

Comlink.transferHandlers.set('EITHER', EitherHandler);
Comlink.expose(lib);
