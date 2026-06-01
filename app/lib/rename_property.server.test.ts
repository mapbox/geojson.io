import { expect, test } from 'vitest';

import renameProperty from './rename_property';

test('renameProperty', () => {
  expect(renameProperty({ a: 1 }, 'a', 'b')).toEqual({ b: 1 });
  expect(renameProperty({ a: 1, z: 2 }, 'a', 'b')).toEqual({ b: 1, z: 2 });
  expect(renameProperty({ a: 1, b: 2 }, 'a', 'b')).toEqual({ b: 1 });
  expect(renameProperty({}, 'a', 'b')).toEqual({});
  expect(
    Object.keys(renameProperty({ a: 1, b: 2, c: 3, d: 4 }, 'b', 'test'))
  ).toEqual(['a', 'test', 'c', 'd']);
});
