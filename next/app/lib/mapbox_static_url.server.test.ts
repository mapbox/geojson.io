import { describe, expect, it } from 'vitest';

import { mapboxStaticURL } from './mapbox_static_url';

describe('mapboxStaticURL', () => {
  it('mapbox', () => {
    expect(
      mapboxStaticURL({
        type: 'MAPBOX',
        token: 'xxx',
        url: 'mapbox://styles/tmcw/ckkpwot3j10mt17p1y4ecfvgx'
      })
    ).toMatchInlineSnapshot(
      `"https://api.mapbox.com/styles/v1/tmcw/ckkpwot3j10mt17p1y4ecfvgx/static/[-136.3106,-35.8527,-22.7311,59.8357]/80x40@2x?access_token=xxx&attribution=false&logo=false"`
    );
  });
  it('xyz', () => {
    expect(
      mapboxStaticURL({
        type: 'XYZ',
        token: '',
        url: 'https://foo.com/{z}/{x}/{y}.png'
      })
    ).toMatchInlineSnapshot(`"https://foo.com/0/0/0.png"`);
  });
});
