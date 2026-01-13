import type { TransferHandler } from 'comlink';
import { Either, Left, Right } from 'purify-ts/Either';

interface SerializedEither {
  __val: any;
  __either: 'left' | 'right';
}

export const EitherHandler: TransferHandler<
  Either<unknown, unknown>,
  SerializedEither
> = {
  canHandle: (obj): obj is Either<unknown, unknown> => {
    return Either.isEither(obj);
  },
  serialize: (either: Either<unknown, unknown>) => {
    const __val = either.extract();
    const transfer = [];
    if (either.isRight() && (__val as any)?.result?.blob) {
      transfer.push((__val as any).result.blob);
    }
    return [
      {
        __val: either.extract(),
        __either: either.isLeft() ? 'left' : 'right'
      },
      []
    ];
  },
  deserialize: (obj) => {
    return obj.__either === 'left' ? Left(obj.__val) : Right(obj.__val);
  }
};
