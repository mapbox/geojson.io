import { fcMultiPoint, wrap, wrapMap } from 'test/helpers';
import { expect, test } from 'vitest';
import { getColumns, getFn } from './search_utils';

test('getFn', () => {
  expect(getFn(wrap(fcMultiPoint)[0], 'x')).toEqual('1');
  expect(getFn(wrap(fcMultiPoint)[0], 'q')).toEqual('');
});

test('getColumns', () => {
  expect(
    getColumns({
      featureMap: wrapMap(fcMultiPoint),
      virtualColumns: []
    })
  ).toEqual(['x']);
});
