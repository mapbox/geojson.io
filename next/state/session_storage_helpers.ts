import { createJSONStorage } from 'jotai/utils';
import { Data } from './jotai';
import toast from 'react-hot-toast';

let hasWarnedAboutSize = false;

const sessionStorageWHandling = {
  getItem: (key: string) => {
    return sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    try {
      sessionStorage.setItem(key, value);
      hasWarnedAboutSize = false;
    } catch (error) {
      // Quota Exceeded Error
      console.log('error is', error);
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22)
      ) {
        // Only toast if we haven't fired it previously
        if (!hasWarnedAboutSize) {
          toast.error(
            'Dataset too large for browser storage - changes will be lost on page refresh',
            {
              icon: '⚠️'
            }
          );
          hasWarnedAboutSize = true;
        }
      } else {
        console.error('Storage error:', error);
      }
    }
  },
  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
  }
};

export const dataSessionStorage = createJSONStorage<Data>(
  () => sessionStorageWHandling,
  {
    replacer: (_key, value) => {
      if (value instanceof Map) {
        return {
          _type: 'Map',
          value: Array.from(value.entries())
        };
      }
      return value;
    },
    reviver: (_key, value) => {
      if (
        value &&
        typeof value === 'object' &&
        '_type' in value &&
        value._type === 'Map' &&
        'value' in value
      ) {
        return new Map(value.value as [any, any][]);
      }
      return value;
    }
  }
);
