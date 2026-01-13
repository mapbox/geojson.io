import once from 'lodash/once';

export const detectCompatibility = once((): boolean => {
  try {
    if (!('localStorage' in window)) {
      throw new Error('Not supported');
    }
    localStorage.getItem('test');
    return true;
  } catch (_e) {
    return false;
  }
});
