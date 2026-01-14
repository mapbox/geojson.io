import { fcLineString } from 'test/helpers';
import { expect, test } from 'vitest';
import replaceCoordinates from './replace_coordinates';

test('replaceCoordinates', () => {
  expect(
    // eslint-disable-next-line
    replaceCoordinates(fcLineString.features[0] as any, [
      [0, 0],
      [1, 1]
    ])
  ).toHaveProperty(
    ['geometry', 'coordinates'],
    [
      [0, 0],
      [1, 1]
    ]
  );
});
