// This is the vi.'setupFilesAfterEnv' setup file
// It's a good place to set globals, add global before/after hooks, etc
//

import { TextDecoder, TextEncoder } from 'fastestsmallesttextencoderdecoder';
import Fs from 'fs';
import { diff } from 'jest-diff';
import { matcherHint } from 'jest-matcher-utils';
import Path from 'path';
import type { Either } from 'purify-ts/Either';
import type { Maybe } from 'purify-ts/Maybe';
import { expect } from 'vitest';

const passMessage = (expect: 'Left' | 'Right') => () =>
  matcherHint(`.not.to${expect}`, 'received', '') +
  '\n\n' +
  `Expected Either to be ${expect}`;

const failMessage = (expect: 'Left' | 'Right') => () =>
  matcherHint(`.toBe${expect}`, 'received', '') +
  '\n\n' +
  `Expected Either to be ${expect}`;

const failRight = (value: string) => () =>
  matcherHint('.toEqualRight', 'received', '') +
  '\n\n' +
  'Expected Either to be Right, received Left.' +
  '\n\n' +
  value;

expect.extend({
  toBeRight(received: Either<unknown, unknown>) {
    const pass = received.isRight();
    return {
      pass: pass,
      message: pass ? passMessage('Right') : failMessage('Right')
    };
  },
  toBeNothing(received: Maybe<unknown>) {
    const pass = received.isNothing();
    return {
      pass: pass,
      message: pass ? () => 'Was nothing' : () => 'Expected Nothing, got Just'
    };
  },
  toBeJust(received: Maybe<unknown>) {
    const pass = received.isJust();
    return {
      pass: pass,
      message: pass ? () => 'Was just' : () => 'Expected Just, got Nothing'
    };
  },
  toBeLeft(received: Either<unknown, unknown>) {
    const pass = received.isLeft();
    return {
      pass: pass,
      message: pass ? passMessage('Left') : failMessage('Left')
    };
  },
  toEqualLeft(received: Either<unknown, unknown>, expected: unknown) {
    const { equals, utils, expand } = this;
    const options = {
      comment: 'Right value equality',
      isNot: this.isNot,
      promise: this.promise
    };

    return received.caseOf({
      Right(value) {
        return {
          pass: false,
          message: failRight(utils.printReceived(value))
        };
      },
      Left(value) {
        if (equals(value, expected)) {
          return {
            pass: true,
            message: passMessage('Left')
          };
        } else {
          return {
            pass: false,
            message: () => {
              const diffString = diff(expected, received, {
                expand: !!expand
              });

              return (
                utils.matcherHint(
                  'toEqualLeft',
                  undefined,
                  undefined,
                  options
                ) +
                '\n\n' +
                (diffString && diffString.includes('- Expect')
                  ? `Difference:\n\n${diffString}`
                  : `Expected: ${utils.printExpected(expected)}\n` +
                    `Received: ${utils.printReceived(received)}`)
              );
            }
          };
        }
      }
    });
  },
  toEqualRight(received: Either<unknown, unknown>, expected: unknown) {
    const { equals, utils, expand } = this;
    const options = {
      comment: 'Right value equality',
      isNot: this.isNot,
      promise: this.promise
    };

    return received.caseOf({
      Left(value) {
        return {
          pass: false,
          message: failRight(utils.printReceived(value))
        };
      },
      Right(value) {
        if (equals(value, expected)) {
          return {
            pass: true,
            message: passMessage('Right')
          };
        } else {
          return {
            pass: false,
            message: () => {
              const diffString = diff(expected, received, {
                expand: !!expand
              });

              return (
                utils.matcherHint(
                  'toEqualRight',
                  undefined,
                  undefined,
                  options
                ) +
                '\n\n' +
                (diffString && diffString.includes('- Expect')
                  ? `Difference:\n\n${diffString}`
                  : `Expected: ${utils.printExpected(expected)}\n` +
                    `Received: ${utils.printReceived(received)}`)
              );
            }
          };
        }
      }
    });
  }
});

if (
  typeof window !== 'undefined' &&
  typeof window.URL.createObjectURL === 'undefined'
) {
  (window as any).URL.createObjectURL = () => {
    // Do nothing
    // Mock this function for mapbox-gl to work
  };

  (window as any).TextEncoder = TextEncoder;
  (window as any).TextDecoder = TextDecoder;

  (window as any).ResizeObserver = class ResizeObserver {
    cb: any;
    constructor(cb: any) {
      this.cb = cb;
    }
    observe() {
      // eslint-disable-next-line
      this.cb([{ borderBoxSize: { inlineSize: 0, blockSize: 0 } }]);
    }
    unobserve() {}
  };

  window.File.prototype.text = function () {
    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.addEventListener('load', () => {
        resolve(reader.result as string);
      });
      reader.readAsText(this);
    });
  };

  (window as any).DOMRect = {
    fromRect: () => ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0
    })
  };

  (window as any).fetch = (url: string) => {
    if (url !== '/zip-lookup.json') throw new Error('Unexpected fetch');
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          JSON.parse(
            Fs.readFileSync(
              Path.join(__dirname, '../public/zip-lookup.json'),
              'utf8'
            )
          )
        )
    });
  };
}
