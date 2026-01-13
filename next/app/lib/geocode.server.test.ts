import type { Action } from 'app/components/context_actions/action_item';
import { describe, expect, it, test } from 'vitest';
import {
  bboxToQItem,
  coordFeature,
  getActions,
  getLiteralItems,
  getQItemNamePreview,
  qItemToPolygon
} from './geocode';

test('bboxToQItem', () => {
  expect(bboxToQItem([1, 2, 5, 6])).toMatchInlineSnapshot(`
    {
      "coordinates": [
        1,
        2,
        5,
        6,
      ],
      "name": "1,2,5,6",
      "type": "extent",
    }
  `);
});

test('qItemToPolygon', () => {
  expect(
    qItemToPolygon(coordFeature([1, 2]).unsafeCoerce())
  ).toMatchInlineSnapshot(`null`);
  expect(qItemToPolygon(bboxToQItem([1, 2, 5, 7]))).toMatchInlineSnapshot(`
    {
      "geometry": {
        "bbox": [
          1,
          2,
          5,
          7,
        ],
        "coordinates": [
          [
            [
              1,
              2,
            ],
            [
              1,
              7,
            ],
            [
              5,
              7,
            ],
            [
              5,
              2,
            ],
            [
              1,
              2,
            ],
          ],
        ],
        "type": "Polygon",
      },
      "properties": {},
      "type": "Feature",
    }
  `);
});

test('getQItemNamePreview', () => {
  expect(
    getQItemNamePreview(coordFeature([1, 2]).unsafeCoerce())
  ).toMatchInlineSnapshot(`"2N, 1E"`);
  expect(getQItemNamePreview(bboxToQItem([1, 2, 5, 7]))).toMatchInlineSnapshot(
    `"1,2,5,7"`
  );
});

test('coordFeature', () => {
  expect(coordFeature([2, -99])).toBeLeft();
  expect(coordFeature([1, 2], true)).toMatchInlineSnapshot(`
    {
      "coordinates": [
        2,
        1,
      ],
      "name": "1N, 2E",
      "type": "coordinate",
    }
  `);
  expect(coordFeature([1, 2])).toMatchInlineSnapshot(`
    {
      "coordinates": [
        1,
        2,
      ],
      "name": "2N, 1E",
      "type": "coordinate",
    }
  `);
});

test('getActions', () => {
  const exampleAction: Action = {
    label: 'Buffer',
    icon: null,
    onSelect: async () => {},
    applicable: true
  };
  expect(getActions('Buffer', [])).toEqual([]);
  expect(getActions('Buffer', [exampleAction])).toEqual([
    {
      action: exampleAction,
      type: 'action'
    }
  ]);
  expect(getActions('Hi', [exampleAction])).toEqual([]);
});

describe('getLiteralItems', () => {
  it('get from non-location string', () => {
    expect(getLiteralItems('')).toEqual([]);
    expect(getLiteralItems('New York')).toEqual([]);
  });
  it('coordinate string', () => {
    expect(getLiteralItems('1 1')).toMatchInlineSnapshot(`
      [
        {
          "coordinates": [
            1,
            1,
          ],
          "name": "1N, 1E",
          "type": "coordinate",
        },
        {
          "coordinates": [
            1,
            1,
          ],
          "name": "1N, 1E",
          "type": "coordinate",
        },
      ]
    `);
  });
  it('bbox string', () => {
    expect(getLiteralItems('-1 -1 2 3')).toMatchInlineSnapshot(`
      [
        {
          "coordinates": [
            -1,
            -1,
            2,
            3,
          ],
          "name": "-1,-1,2,3",
          "type": "extent",
        },
      ]
    `);
  });
});
