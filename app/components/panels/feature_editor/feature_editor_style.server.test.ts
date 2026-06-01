import { describe, expect, it } from 'vitest';

import { parseProperties } from './feature_editor_style';

describe('parseProperties', () => {
  it('parses null', () => {
    expect(parseProperties({})).toMatchInlineSnapshot(`
      {
        "enableFill": false,
        "enableFillOpacity": false,
        "enableStroke": false,
        "enableStrokeOpacity": false,
        "enableStrokeWidth": false,
        "fill": "#312E81",
        "fill-opacity": 0.3,
        "stroke": "#312E81",
        "stroke-opacity": 1,
        "stroke-width": 1,
      }
    `);
  });

  it('parses partial properties', () => {
    expect(parseProperties({ fill: '#f00' })).toMatchInlineSnapshot(`
      {
        "enableFill": true,
        "enableFillOpacity": false,
        "enableStroke": false,
        "enableStrokeOpacity": false,
        "enableStrokeWidth": false,
        "fill": "#f00",
        "fill-opacity": 0.3,
        "stroke": "#312E81",
        "stroke-opacity": 1,
        "stroke-width": 1,
      }
    `);
  });

  it('rejects invalid types', () => {
    expect(parseProperties({ fill: 10, 'stroke-width': 'ten' }))
      .toMatchInlineSnapshot(`
        {
          "enableFill": false,
          "enableFillOpacity": false,
          "enableStroke": false,
          "enableStrokeOpacity": false,
          "enableStrokeWidth": false,
          "fill": "#312E81",
          "fill-opacity": 0.3,
          "stroke": "#312E81",
          "stroke-opacity": 1,
          "stroke-width": 1,
        }
      `);
  });
});
