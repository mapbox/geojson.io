import { COLORBREWER_DIVERGING } from 'app/lib/colorbrewer';
import type { IPresence } from 'types';
import { expect, test } from 'vitest';
import { colorFromPresence, linearGradient } from './color';

test('colorFromPresence', () => {
  expect(colorFromPresence({ userId: 0 } as unknown as IPresence)).toEqual(
    '#648704'
  );
});

test('linearGradient', () => {
  const ramp = COLORBREWER_DIVERGING[0].colors;
  expect(
    linearGradient({
      colors: ramp[8]!,
      interpolate: 'step'
    })
  ).toMatchInlineSnapshot(
    `"linear-gradient(90deg, rgb(178,24,43) 0%, rgb(178,24,43) 12.5%,rgb(214,96,77) 12.5%, rgb(214,96,77) 25%,rgb(244,165,130) 25%, rgb(244,165,130) 37.5%,rgb(253,219,199) 37.5%, rgb(253,219,199) 50%,rgb(209,229,240) 50%, rgb(209,229,240) 62.5%,rgb(146,197,222) 62.5%, rgb(146,197,222) 75%,rgb(67,147,195) 75%, rgb(67,147,195) 87.5%,rgb(33,102,172) 87.5%, rgb(33,102,172) 100%"`
  );
  expect(
    linearGradient({
      colors: ramp[8]!,
      interpolate: 'linear'
    })
  ).toMatchInlineSnapshot(
    `"linear-gradient(90deg, rgb(178,24,43) 0%,rgb(214,96,77) 12.5%,rgb(244,165,130) 25%,rgb(253,219,199) 37.5%,rgb(209,229,240) 50%,rgb(146,197,222) 62.5%,rgb(67,147,195) 75%,rgb(33,102,172) 87.5%"`
  );
});
