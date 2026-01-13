import { expect, test } from 'vitest';

import { GreatCircle } from './arc';

test('GreatCircle', () => {
  const a = new GreatCircle([0, 0], [10, 0]);
  expect(a.interpolate(0)).toEqual([0, 0]);
  expect(a.interpolate(1)).toEqual([10, 0]);
});

test('GreatCircleException', () => {
  expect(() => {
    new GreatCircle([1, 1], [-179, -1]);
  }).toThrowError();
});

test('Routes', () => {
  expect(new GreatCircle([-77, 23], [-130, 60]).arc(100)).toMatchSnapshot();
});
