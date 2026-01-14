import { fcLineAndPoly, wrap } from 'test/helpers';
import { expect, test } from 'vitest';
import { collectStatistics } from './stats';

test('collectStatistics', () => {
  expect(collectStatistics([])).toMatchInlineSnapshot('[]');
  expect(collectStatistics(wrap(fcLineAndPoly))).toMatchInlineSnapshot(`
    [
      {
        "property": "x",
        "stats": {
          "max": 1,
          "min": 1,
          "strings": [],
          "sum": 2,
          "types": {
            "boolean": 0,
            "number": 2,
            "other": 0,
            "string": 0,
          },
        },
      },
    ]
  `);
});
