import { Left, Right } from 'purify-ts/Either';
import { expect, test } from 'vitest';
import { EitherHandler } from './shared';

test('serialize left', () => {
  expect(EitherHandler.canHandle(Left(10))).toBeTruthy();
  expect(EitherHandler.canHandle(Right(10))).toBeTruthy();
  expect(EitherHandler.canHandle(10 as any)).toBeFalsy();
});

test('serialize left', () => {
  const serialized = EitherHandler.serialize(Left(10));
  expect(EitherHandler.deserialize(serialized[0])).toEqualLeft(10);
});

test('serialize right', () => {
  const serialized = EitherHandler.serialize(Right(10));
  expect(EitherHandler.deserialize(serialized[0])).toEqualRight(10);
});
