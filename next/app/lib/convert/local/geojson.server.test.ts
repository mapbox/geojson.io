import { DEFAULT_EXPORT_OPTIONS } from 'app/lib/convert';
import { fcLineString, wrapMap } from 'test/helpers';
import { expect, test } from 'vitest';
import { geojsonToString } from './geojson';

test('GeoJSON', () => {
  expect(
    geojsonToString(new Map(), DEFAULT_EXPORT_OPTIONS.geojsonOptions)
  ).toMatchInlineSnapshot(`"{"type":"FeatureCollection","features":[]}"`);

  expect(
    geojsonToString(
      wrapMap(fcLineString),
      DEFAULT_EXPORT_OPTIONS.geojsonOptions
    )
  ).toMatchInlineSnapshot(
    `"{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"x":1},"geometry":{"type":"LineString","coordinates":[[0,0],[1,1],[2,2]]}}]}"`
  );
});
