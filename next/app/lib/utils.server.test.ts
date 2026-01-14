import {
  formatCapitalize,
  formatCount,
  formatDateAgo,
  formatTitle,
  formatUSD,
  getIsMac,
  localizeKeybinding,
  MAC_CMD_SYMBOL,
  pluralize,
  shallowArrayEqual,
  toggle,
  toggleByValue,
  truncate,
  writeToClipboard
} from 'app/lib/utils';
import { describe, expect, it, test } from 'vitest';

test('formatTitle', () => {
  expect(formatTitle('X')).toMatchInlineSnapshot(`"X | geojson.io"`);
});

test('shallowArrayEqual', () => {
  const arr = [1];
  expect(shallowArrayEqual(arr, arr)).toBeTruthy();
  expect(shallowArrayEqual([], [])).toBeTruthy();
  expect(shallowArrayEqual([1], [1])).toBeTruthy();
  const x = {};
  expect(shallowArrayEqual([x], [x])).toBeTruthy();
  expect(shallowArrayEqual([x], [x, 1])).toBeFalsy();
  expect(shallowArrayEqual([x, 1], [x])).toBeFalsy();
  expect(shallowArrayEqual(undefined, [x])).toBeFalsy();
  expect(shallowArrayEqual(undefined, undefined)).toBeFalsy();
});

test('writeToClipboard', async () => {
  await expect(writeToClipboard(Promise.resolve('hi'))).rejects.toThrowError();
});

test.skip('getIsMac', () => {
  expect(getIsMac()).toBeFalsy();
});

test('localizeKeybinding', () => {
  expect(localizeKeybinding('a', true)).toEqual('a');
  expect(localizeKeybinding('a', false)).toEqual('a');
  expect(localizeKeybinding('Command+a', true)).toEqual(`${MAC_CMD_SYMBOL}+a`);
  expect(localizeKeybinding('Command+a', false)).toEqual('Ctrl+a');
});

test('formatRelative2', () => {
  const base = new Date('2000/2/2');
  expect(formatDateAgo(new Date(+base + 10000000), base)).toEqual(
    '3 hours ago'
  );

  expect(formatDateAgo(new Date(+base + 1000000000), base)).toEqual(
    '2 weeks ago'
  );
});

describe('toggle', () => {
  it('base case', () => {
    expect(toggle([], 1)).toEqual([1]);
  });
  it('removal', () => {
    expect(toggle([1], 1)).toEqual([]);
  });
  it('addition', () => {
    expect(toggle([1, 2, 3, 4], 1)).toEqual([2, 3, 4]);
  });
});

describe('toggleByValue', () => {
  it('base case', () => {
    expect(toggleByValue([], { x: 1 })).toEqual([{ x: 1 }]);
  });
  it('removal', () => {
    expect(toggleByValue([{ x: 1 }], { x: 1 })).toEqual([]);
  });
  it('addition', () => {
    expect(
      toggleByValue([{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }], { x: 1 })
    ).toEqual([{ x: 2 }, { x: 3 }, { x: 4 }]);
  });
});

test('pluralize', () => {
  expect(pluralize('feature', 1)).toEqual('1 feature');
  expect(pluralize('feature', 2)).toEqual('2 features');
  expect(pluralize('feature', 2, false)).toEqual('features');
  expect(pluralize('goose', 2, true, 'geese')).toEqual('2 geese');
});

test('formatCount', () => {
  expect(formatCount(1000)).toEqual('1,000');
  expect(formatCount(100)).toEqual('100');
});

test('formatCapitalize', () => {
  expect(formatCapitalize('hello')).toEqual('Hello');
});

test('formatUSD', () => {
  expect(formatUSD(100)).toEqual('$100.00');
});

test('truncate', () => {
  expect(truncate('a'.repeat(100))).toEqual(`${'a'.repeat(48)}…`);
});
