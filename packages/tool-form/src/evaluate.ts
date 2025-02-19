import type { Node, NodeList } from "tool-json";
import { currentLocation } from "tool-json";
import {
  QueryError,
  isSingularQuery,
  parseQuery,
  parseImplicitQuery,
  parseExpression,
  parseShorthandName,
  parseBlankSpace,
  evaluateQuery,
  evaluateExpression,
} from "tool-query";
import { TransformError } from "./error.ts";
import type { FormContext } from "./context.ts";

/**
 * Evaluates a Query Expression, returning all matching nodes.
 *
 * @category Evaluate
 */
export function evaluateQueryExpression(
  value: string,
  context: FormContext,
): NodeList {
  const query = parseQuery(value, context);
  return evaluateQuery(query, context.queryArgument, context);
}

/**
 * Evaluates a Singular Expression with an optional leading root identifier
 * and an elide-able leading dot on a leading child segment,
 * returning a single value or undefined.
 *
 * @category Evaluate
 */
export function evaluateSingularExpression(
  input: string,
  context: FormContext,
): Node | undefined {
  const buf = { input, offset: 0, limit: input.length };
  const query = parseImplicitQuery(buf, context);
  const nodes = evaluateQuery(query, context.queryArgument, context);
  let node = isSingularQuery(query) ? nodes[0] : nodes;

  // *(S "|" transform-name)
  while (true) {
    parseBlankSpace(buf);
    if (
      buf.offset >= buf.limit ||
      buf.input.charCodeAt(buf.offset) !== 0x7c /* "|" */
    ) {
      break;
    }
    buf.offset += 1; // "|"
    parseBlankSpace(buf);

    const name = parseShorthandName(buf);
    const transform = context.transforms?.[name];
    if (transform === undefined) {
      throw new TransformError(
        "Unsupported transform: " + JSON.stringify(name),
        { location: currentLocation(context) },
      );
    }

    node = transform.transform(node, context);
  }

  if (typeof input === "string" && buf.offset !== input.length) {
    throw new QueryError("Invalid singular expression", buf);
  }
  return node;
}

/**
 * Evaluates a Predicate Expression, returning a boolean.
 *
 * @category Evaluate
 */
export function evaluatePredicateExpression(
  input: string,
  context: FormContext,
): boolean {
  const expression = parseExpression(input, context);
  return evaluateExpression(expression, context.queryArgument, context);
}

/**
 * Coerces a node to a boolean value.
 *
 * @category Evaluate
 * @internal
 */
export function coerceBoolean(node: Node): boolean {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  return !!node;
}

/**
 * Coerces a node to a string value.
 *
 * @category Evaluate
 * @internal
 */
export function coerceString(node: Node): string | undefined {
  if (typeof node === "string") {
    return node;
  } else if (node !== undefined) {
    return JSON.stringify(node);
  }
  return undefined;
}
