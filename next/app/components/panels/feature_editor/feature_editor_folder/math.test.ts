import { expect, test } from 'vitest';
import { solveRootItems } from './math';

test('solveRootItems', () => {
  expect(solveRootItems(new Map(), new Map())).toEqual({
    children: [],
    type: 'root'
  });
});
