import type { JsonValue } from 'type-fest';
import { z } from 'zod';
import { parseOrError } from './errors';
import { safeParseMaybe } from './utils';

export enum Cast {
  Number = 'number',
  Boolean = 'boolean',
  Null = 'null',
  None = 'none',
  JSON = 'JSON'
}

export enum ExplicitCast {
  Number = 'number',
  Boolean = 'boolean',
  String = 'string',
  JSON = 'JSON',
  HTML = 'Rich text'
}

const TYPEOFS: {
  [key: string]: Cast;
} = {
  number: Cast.Number,
  boolean: Cast.Boolean,
  object: Cast.JSON
} as const;

export function validJSON(value: string) {
  return parseOrError(value).isRight();
}

function isJSONObject(value: string): boolean {
  if (!value.match(/\s*[[{]/)) return false;
  return validJSON(value);
}

const literalCasts = new Map<string, Cast>([
  ['true', Cast.Boolean],
  ['false', Cast.Boolean],
  ['null', Cast.Null]
]);

/**
 * This looks at a string and considers what it may be intending
 * to be. For example, the string "10" would get a recommendation
 * of Cast.Number.
 */
export function recommendCast(value: JsonValue): Cast {
  if (typeof value !== 'string') {
    return Cast.None;
  }

  // +"" will cast to a number but should not.
  if (value === '') return Cast.None;
  const litCast = literalCasts.get(value);
  if (litCast !== undefined) return litCast;
  if (isNumberLike(value)) return Cast.Number;

  if (isJSONObject(value)) {
    return Cast.JSON;
  }

  return Cast.None;
}

const literalValues: { [key: string]: JsonValue } = {
  true: true,
  false: false,
  null: null
};

/**
 * Allow many forms of numbers but _not_ integer
 * strings starting with 0, because those are often
 * used as identifiers.
 */
function isNumberLike(value: string) {
  return !Number.isNaN(+value) && !value.match(/^0\d+$/);
}

/**
 * Cast a string value to a guessed native value - if the string
 * is a literal value like "true", it becomes a boolean, if it's
 * object-like, parse it as a JSON value.
 */
export function cast(value: string) {
  if (value in literalValues) return literalValues[value];
  if (isNumberLike(value)) {
    return +value;
  }
  if (isJSONObject(value)) return JSON.parse(value) as JsonValue;
  return value;
}

function anythingToString(value: JsonValue | undefined): string {
  const html = asHTML(value);
  if (html.isJust()) {
    return html.extract().value;
  }

  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'object' || Array.isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch (_e) {
      return String(value);
    }
  }

  return String(value);
}

const EXPLICIT_CASTERS: Record<
  ExplicitCast,
  (arg0: JsonValue | undefined) => JsonValue
> = {
  [ExplicitCast.Number]: (value) => {
    if (value === undefined) return 0;
    const numVal = value === null ? 0 : +value;
    return Number.isNaN(numVal) ? value : numVal;
  },
  [ExplicitCast.Boolean]: (value) => {
    if (value === 'false') return false;
    return !!value;
  },
  [ExplicitCast.String]: anythingToString,
  [ExplicitCast.JSON]: (value) => {
    if (value === undefined) return '';
    if (typeof value !== 'string') return value;
    return parseOrError(value).orDefault(value);
  },
  [ExplicitCast.HTML]: (value): IHtmlValue => {
    return asHTML(value).orDefaultLazy(() => {
      return {
        '@type': 'html',
        value: anythingToString(value)
      };
    });
  }
};

/**
 * Cast a value to a specific type. If it can't be cast,
 * just return the existing value.
 */
export function castExplicit(
  value: JsonValue | undefined,
  target: ExplicitCast
) {
  return EXPLICIT_CASTERS[target](value);
}

function newTypeValid(recommendation: Cast, oldValue: JsonValue) {
  return (
    recommendation === TYPEOFS[typeof oldValue] ||
    (oldValue === null && recommendation === Cast.Null)
  );
}

export function recast(oldValue: JsonValue, newValue: string | JsonValue) {
  if (typeof newValue !== 'string') return newValue;
  const recommendation = recommendCast(newValue);
  if (newTypeValid(recommendation, oldValue)) {
    return cast(newValue);
  }
  return newValue;
}

const HtmlValue = z.object({
  '@type': z.literal('html'),
  value: z.string()
});

type IHtmlValue = z.infer<typeof HtmlValue>;

/**
 * Determines if this value is the object
 * that denotes a rich text block.
 */
export function asHTML(value: JsonValue | undefined) {
  return safeParseMaybe(HtmlValue.safeParse(value));
}
