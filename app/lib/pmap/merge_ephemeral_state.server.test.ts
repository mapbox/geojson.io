import { fcLineString, fcPoly } from 'test/helpers';
import { expect, test } from 'vitest';
import { fixDegenerates, makeRectangle } from './merge_ephemeral_state';

test('makeRectangle', () => {
  expect(
    makeRectangle({
      box: [
        [0, 0],
        [10, 10]
      ],

      type: 'lasso'
    })
  ).toMatchInlineSnapshot(`
    [
      0,
      0,
      0,
      0,
      10,
      0,
      10,
      10,
      0,
      10,
      0,
      0,
      0,
      0,
      0,
    ]
  `);
});

test('fixDegenerates', () => {
  expect(fixDegenerates(fcLineString.features[0])).toEqual(
    fcLineString.features[0]
  );
  expect(fixDegenerates(fcPoly.features[0])).toEqual(fcPoly.features[0]);
});
