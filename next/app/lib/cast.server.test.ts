import { describe, expect, it, test } from 'vitest';

import {
  Cast,
  cast,
  castExplicit,
  ExplicitCast,
  recast,
  recommendCast,
  validJSON
} from './cast';

test('validJSON', () => {
  expect(validJSON('{}')).toBeTruthy();
  expect(validJSON('{')).toBeFalsy();
});

test('recommendCast', () => {
  expect(recommendCast('hello')).toEqual(Cast.None);
  expect(recommendCast('true')).toEqual(Cast.Boolean);
  expect(recommendCast('false')).toEqual(Cast.Boolean);
  expect(recommendCast('null')).toEqual(Cast.Null);
  expect(recommendCast('10')).toEqual(Cast.Number);
  expect(recommendCast('')).toEqual(Cast.None);
  expect(recommendCast(10)).toEqual(Cast.None);
  expect(recommendCast('10a')).toEqual(Cast.None);
  expect(recommendCast('[1]')).toEqual(Cast.JSON);
  expect(recommendCast(`{"x": 1}`)).toEqual(Cast.JSON);
  expect(recommendCast(`{"x": 1`)).toEqual(Cast.None);
});

test('recommendCast', () => {
  expect(cast('hello')).toEqual('hello');
  expect(cast('true')).toEqual(true);
  expect(cast('false')).toEqual(false);
  expect(cast('null')).toEqual(null);
  expect(cast('10')).toEqual(10);
  // Special case for what are probably zip codes
  expect(cast('01')).toEqual('01');
  expect(cast('0x1')).toEqual(1);
  expect(cast('0xf')).toEqual(15);
  expect(cast('10a')).toEqual('10a');
  expect(cast('[1]')).toEqual([1]);
  expect(cast(`{"x": 1}`)).toEqual({ x: 1 });
  expect(cast(`{"x": 1`)).toEqual(`{"x": 1`);
});

describe('castExplicit', () => {
  it('valid casts', () => {
    expect(castExplicit('hello', ExplicitCast.String)).toEqual('hello');
    expect(castExplicit('[1]', ExplicitCast.String)).toEqual('[1]');
    expect(castExplicit('10', ExplicitCast.Number)).toEqual(10);
    expect(castExplicit('[1]', ExplicitCast.JSON)).toEqual([1]);
    expect(castExplicit([1], ExplicitCast.String)).toEqual('[1]');
    expect(castExplicit('false', ExplicitCast.Boolean)).toEqual(false);
    expect(castExplicit('true', ExplicitCast.Boolean)).toEqual(true);
  });
  it('string', () => {
    expect(castExplicit(undefined, ExplicitCast.String)).toEqual('');
  });
  it('html to text and back', () => {
    const str = 'Hello world';
    const html = { '@type': 'html', value: str };
    expect(castExplicit(html, ExplicitCast.String)).toEqual(str);
    expect(castExplicit(str, ExplicitCast.HTML)).toEqual(html);
  });
  it('failed casts', () => {
    expect(castExplicit('hello', ExplicitCast.Number)).toEqual('hello');
    expect(castExplicit('hello', ExplicitCast.JSON)).toEqual('hello');
  });
});

test('recast', () => {
  expect(recast([1], '[2]')).toEqual([2]);
  expect(recast('[1]', '[2]')).toEqual('[2]');
  expect(recast(true, 'false')).toEqual(false);
  expect(recast(1, '20')).toEqual(20);
});
