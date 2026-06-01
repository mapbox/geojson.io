import { expect, test } from 'vitest';

import { detectCompatibility } from './detect_compatibility';

test('detectCompatibility', () => {
  expect(detectCompatibility()).toBeFalsy();
});
