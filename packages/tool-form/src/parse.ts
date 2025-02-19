import type { Node, Frame } from "tool-json";
import { isArray, isObject, nestFrame } from "tool-json";
import type { DirectiveObject } from "./directive.ts";
import { detectDirectives } from "./directive.ts";
import type { FormContext } from "./context.ts";

/**
 * Parses a template node.
 *
 * @category Parse
 * @internal
 */
export function parseNode(node: Node | undefined, context: FormContext): void {
  if (isArray(node)) {
    parseArray(node, context);
  } else if (isObject(node)) {
    parseDirectives(node, context);
  }
}

/**
 * Parses a template array.
 *
 * @category Parse
 * @internal
 */
export function parseArray(node: readonly Node[], context: FormContext): void {
  for (let index = 0; index < node.length; index += 1) {
    const item = node[index];
    nestFrame(context, (frame: Frame): void => {
      frame.nodeKey = index;
      frame.node = item;
      parseNode(item, context);
    });
  }
}

/**
 * Parses a template object.
 *
 * @category Parse
 * @internal
 */
export function parseObject(
  node: { readonly [key: string]: Node },
  context: FormContext,
): void {
  for (let [key, value] of Object.entries(node)) {
    // Exclude directive properties.
    if (context.directives?.[key] !== undefined) {
      continue;
    }

    // Unescape `$$` prefix.
    if (key.startsWith("$$")) {
      key = key.slice(1);
    }

    nestFrame(context, (frame: Frame): void => {
      frame.nodeKey = key;
      frame.node = value;
      parseNode(value, context);
    });
  }
}

/**
 * Parses a directive object.
 *
 * @category Parse
 * @internal
 */
export function parseDirectives(
  node: DirectiveObject,
  context: FormContext,
): void {
  // Detect and validate directives.
  const directives = detectDirectives(node, context);

  // Parse modifier directives.
  if (directives.modifiers !== undefined) {
    for (const directive of Object.values(directives.modifiers)) {
      directive.parse(node, context);
    }
  }

  // Parse domain directive, or parse the object.
  if (directives.domain !== undefined) {
    directives.domain.parse(node, context);
  } else {
    parseObject(node, context);
  }

  // Parse operator directives.
  if (directives.operators !== undefined) {
    for (const [directive, argument] of Object.values(directives.operators)) {
      directive.parse(argument, context);
    }
  }
}
