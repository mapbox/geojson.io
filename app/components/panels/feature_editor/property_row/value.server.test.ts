import { expect, test } from 'vitest';

import { asSymbol, EditorTab, guessTab } from './value';

test('asSymbol', () => {
  expect(asSymbol('foo')).toEqual('String');
  expect(asSymbol(12)).toEqual('Number');
  expect(asSymbol(true)).toEqual('Boolean');
});

test('guessTab', () => {
  expect(guessTab('foo')).toEqual(EditorTab.TEXT);
  expect(guessTab([])).toEqual(EditorTab.JSON);
  expect(guessTab('#f00')).toEqual(EditorTab.COLOR);
});
