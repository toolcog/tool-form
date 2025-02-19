import type { Node } from "tool-json";
import { isArray, isObject, unicodeCompare } from "tool-json";

/** @internal */
export function compareNodes(a: Node, b: Node): number {
  const aOrdinal = getOrdinal(a);
  const bOrdinal = getOrdinal(b);
  if (aOrdinal !== bOrdinal) {
    return aOrdinal - bOrdinal;
  }

  switch (aOrdinal) {
    case UNDEFINED_ORDINAL:
    case NULL_ORDINAL:
      return 0;

    case BOOLEAN_ORDINAL:
      return compareBooleans(a as boolean, b as boolean);

    case NUMBER_ORDINAL:
      return compareNumbers(a as number, b as number);

    case STRING_ORDINAL:
      return compareStrings(a as string, b as string);

    case ARRAY_ORDINAL:
      return compareArrays(a as readonly Node[], b as readonly Node[]);

    case OBJECT_ORDINAL:
      return compareObjects(
        a as { readonly [key: string]: Node },
        b as { readonly [key: string]: Node },
      );

    default:
      return 0; // Unreachable
  }
}

function compareBooleans(a: boolean, b: boolean): number {
  return (
    a === b ? 0
    : a ? 1
    : -1
  );
}

function compareNumbers(a: number, b: number): number {
  if (Object.is(a, b)) {
    return 0;
  } else if (Number.isNaN(a)) {
    return 1; // NaN > all other numbers
  } else if (Number.isNaN(b)) {
    return -1; // NaN > all other numbers
  } else if (Object.is(a, -0) && b === 0) {
    return -1; // -0 < +0 per IEEE-754
  } else if (a === 0 && Object.is(b, -0)) {
    return 1; // -0 < +0 per IEEE-754
  }
  return a < b ? -1 : 1;
}

function compareStrings(a: string, b: string): number {
  return unicodeCompare(a, b);
}

function compareArrays(a: readonly Node[], b: readonly Node[]): number {
  const minLength = Math.min(a.length, b.length);

  for (let i = 0; i < minLength; i += 1) {
    const order = compareNodes(a[i], b[i]);
    if (order !== 0) {
      return order;
    }
  }

  return a.length - b.length;
}

function compareObjects(
  a: { readonly [key: string]: Node },
  b: { readonly [key: string]: Node },
): number {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  const minLength = Math.min(aKeys.length, bKeys.length);

  for (let i = 0; i < minLength; i += 1) {
    const aKey = aKeys[i]!;
    const bKey = bKeys[i]!;

    const keyOrder = aKey.localeCompare(bKey);
    if (keyOrder !== 0) {
      return keyOrder;
    }

    const valueOrder = compareNodes(a[aKey], b[bKey]);
    if (valueOrder !== 0) {
      return valueOrder;
    }
  }

  return aKeys.length - bKeys.length;
}

function getOrdinal(value: Node): number {
  if (value === undefined) {
    return UNDEFINED_ORDINAL;
  } else if (value === null) {
    return NULL_ORDINAL;
  } else if (typeof value === "boolean") {
    return BOOLEAN_ORDINAL;
  } else if (typeof value === "number") {
    return NUMBER_ORDINAL;
  } else if (typeof value === "string") {
    return STRING_ORDINAL;
  } else if (isArray(value)) {
    return ARRAY_ORDINAL;
  } else if (isObject(value)) {
    return OBJECT_ORDINAL;
  }
  return -1;
}

const UNDEFINED_ORDINAL = 0;
const NULL_ORDINAL = 1;
const BOOLEAN_ORDINAL = 2;
const NUMBER_ORDINAL = 3;
const STRING_ORDINAL = 4;
const ARRAY_ORDINAL = 5;
const OBJECT_ORDINAL = 6;
