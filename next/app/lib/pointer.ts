import type { JsonValue } from 'type-fest';

const hasExcape = /~/;
const escapeMatcher = /~[01]/g;

type Pointer = string | string[];

function escapeReplacer(m: string) {
  switch (m) {
    case '~1':
      return '/';
    case '~0':
      return '~';
  }
  throw new Error(`Invalid tilde escape: ${m}`);
}

function untilde(str: string) {
  if (!hasExcape.test(str)) return str;
  return str.replace(escapeMatcher, escapeReplacer);
}

function setter(obj: any, pointer: Pointer, value: any): JsonValue {
  let part: string | number;
  let hasNextPart: boolean;

  if (pointer[1] === 'constructor' && pointer[2] === 'prototype') {
    return obj as JsonValue;
  }
  if (pointer[1] === '__proto__') return obj as JsonValue;

  for (let p = 1, len = pointer.length; p < len; ) {
    part = untilde(pointer[p++]);
    hasNextPart = len > p;

    if (typeof obj[part] === 'undefined') {
      // support setting of /-
      if (Array.isArray(obj) && part === '-') {
        part = obj.length;
      }

      // support nested objects/array when setting values
      if (hasNextPart) {
        if (
          (pointer[p] !== '' && (pointer[p] as any) < Infinity) ||
          pointer[p] === '-'
        )
          obj[part] = [];
        else obj[part] = {};
      }
    }

    if (!hasNextPart) break;
    obj = obj[part];
  }

  const oldValue = obj[part!];
  if (value === undefined) delete obj[part!];
  else obj[part!] = value;
  return oldValue as JsonValue;
}

function compilePointer(pointer: Pointer) {
  if (typeof pointer === 'string') {
    pointer = pointer.split('/');
    if (pointer[0] === '') return pointer;
    throw new Error('Invalid JSON pointer.');
  } else if (Array.isArray(pointer)) {
    return pointer;
  }

  throw new Error('Invalid JSON pointer.');
}

export function get(obj: any, pointer: Pointer): JsonValue | undefined {
  if (typeof obj !== 'object') throw new Error('Invalid input object.');
  pointer = compilePointer(pointer);
  const len = pointer.length;
  if (len === 1) return obj as JsonValue;

  for (let p = 1; p < len; ) {
    obj = obj[untilde(pointer[p++])];
    if (len === p) return obj as JsonValue;
    if (typeof obj !== 'object') return undefined;
  }
}

export function clone<T>(obj: T, pointer: Pointer): T {
  if (typeof obj !== 'object') throw new Error('Invalid input object.');
  pointer = compilePointer(pointer);
  const len = pointer.length;
  if (len === 1) return obj;

  const rootPointer = Object.assign({}, obj);
  let levelPointer = rootPointer as any;

  for (let p = 1; p < len - 1; ) {
    const key = untilde(pointer[p++]);
    // Clone objects and arrays
    if (Array.isArray(levelPointer[key])) {
      // eslint-disable-next-line
      levelPointer[key] = levelPointer[key].slice();
    } else if (
      levelPointer[key] !== null &&
      typeof levelPointer[key] === 'object'
    ) {
      levelPointer[key] = Object.assign({}, levelPointer[key]);
    }
    levelPointer = levelPointer[key];
    if (len === p) return rootPointer;
  }
  return rootPointer;
}

export function set(obj: any, pointer: Pointer, value: any) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.');
  pointer = compilePointer(pointer);
  if (pointer.length === 0) throw new Error('Invalid JSON pointer for set.');
  return setter(obj, pointer, value);
}
