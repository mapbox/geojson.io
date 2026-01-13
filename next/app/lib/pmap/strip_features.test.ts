import { SIMPLESTYLE_PROPERTIES } from 'app/lib/constants';
import { fcLineString, wrapMapAndId } from 'test/helpers';
import { expect, test } from 'vitest';
import { pick, stripFeature } from './strip_features';

test('pick', () => {
  expect(pick({}, [])).toBeNull();
  expect(pick({ a: 1 }, [])).toBeNull();
  expect(pick({ a: 1 }, ['b'])).toBeNull();
  expect(pick({}, ['b'])).toBeNull();
  expect(pick({ b: 1 }, ['b'])).toEqual({
    b: 1
  });
  expect(pick({ b: 1, c: 2 }, ['b'])).toEqual({
    b: 1
  });
  expect(pick({ b: 1, c: 2 }, ['b'])).toEqual({
    b: 1
  });
  expect(pick({ b: 1, c: 2 }, ['b', 'c'])).toEqual({
    b: 1,
    c: 2
  });
});

test('stripFeature', () => {
  const { wrappedFeatures, idMap } = wrapMapAndId(fcLineString);
  expect(
    stripFeature({
      wrappedFeature: wrappedFeatures[0],
      idMap,
      keepProperties: []
    })
  ).toMatchInlineSnapshot(`
    {
      "geometry": {
        "coordinates": [
          [
            0,
            0,
          ],
          [
            1,
            1,
          ],
          [
            2,
            2,
          ],
        ],
        "type": "LineString",
      },
      "id": 0,
      "properties": null,
      "type": "Feature",
    }
  `);

  expect(
    stripFeature({
      wrappedFeature: wrappedFeatures[0],
      idMap,
      keepProperties: ['x']
    })
  ).toMatchInlineSnapshot(`
    {
      "geometry": {
        "coordinates": [
          [
            0,
            0,
          ],
          [
            1,
            1,
          ],
          [
            2,
            2,
          ],
        ],
        "type": "LineString",
      },
      "id": 0,
      "properties": {
        "x": 1,
      },
      "type": "Feature",
    }
  `);

  expect(
    stripFeature({
      wrappedFeature: wrappedFeatures[0],
      idMap,
      keepProperties: SIMPLESTYLE_PROPERTIES.slice()
    })
  ).toMatchInlineSnapshot(`
    {
      "geometry": {
        "coordinates": [
          [
            0,
            0,
          ],
          [
            1,
            1,
          ],
          [
            2,
            2,
          ],
        ],
        "type": "LineString",
      },
      "id": 0,
      "properties": null,
      "type": "Feature",
    }
  `);
});
