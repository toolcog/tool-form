import type { Node, Frame } from "tool-json";
import { isArray, isObject, Fragment, nestFrame } from "tool-json";
import type { DirectiveObject } from "./directive.ts";
import { detectDirectives } from "./directive.ts";
import type { FormContext, FormContextOptions } from "./context.ts";
import { coerceFormContext } from "./context.ts";
import { interpolateStringTemplate } from "./interpolate.ts";

/**
 * Transforms a template node with the given query arguments.
 *
 * @category Process
 */
export async function processTemplate(
  template: Node,
  args: Node,
  options?: FormContextOptions,
): Promise<Node | undefined> {
  const context = coerceFormContext(options);

  const queryArgument = context.queryArgument;
  try {
    context.queryArgument = args;
    return await processNode(template, context);
  } finally {
    context.queryArgument = queryArgument;
  }
}

/**
 * Processes a template node.
 *
 * @category Process
 * @internal
 */
export async function processNode(
  node: Node | undefined,
  context: FormContext,
): Promise<Node | undefined> {
  if (node === undefined) {
    return undefined;
  } else if (typeof node === "string") {
    return interpolateStringTemplate(node, context);
  } else if (isArray(node)) {
    return await processArray(node, context);
  } else if (isObject(node)) {
    return await processDirectives(node, context);
  }
  return node;
}

/**
 * Processes a template array.
 *
 * @category Process
 * @internal
 */
export async function processArray(
  node: readonly Node[],
  context: FormContext,
): Promise<readonly Node[]> {
  const result: Node[] = [];
  let modified = false;

  for (let index = 0; index < node.length; index += 1) {
    const item = node[index];
    await nestFrame(context, async (frame: Frame): Promise<void> => {
      frame.nodeKey = index;
      frame.node = item;

      const transformed = await processNode(item, context);
      if (transformed === undefined) {
        modified = true;
      } else if (transformed === item) {
        result.push(item);
      } else if (!(transformed instanceof Fragment)) {
        result.push(transformed);
        modified = true;
      } else {
        for (const node of transformed.nodes) {
          if (isObject(node)) {
            for (const value of Object.values(node)) {
              if (value !== undefined) {
                result.push(value);
                modified = true;
              }
            }
          }
        }
      }
    });
  }

  if (!modified) {
    return node;
  }
  return result;
}

/**
 * Processes a template object.
 *
 * @category Process
 * @internal
 */
export async function processObject(
  node: { readonly [key: string]: Node },
  context: FormContext,
): Promise<{ readonly [key: string]: Node }> {
  const result: { [key: string]: Node } = {};
  let modified = false;

  for (let [key, value] of Object.entries(node)) {
    // Exclude directive properties.
    if (context.directives?.[key] !== undefined) {
      modified = true;
      continue;
    }

    // Unescape `$$` prefix.
    if (key.startsWith("$$")) {
      key = key.slice(1);
      modified = true;
    }

    await nestFrame(context, async (frame: Frame): Promise<void> => {
      frame.nodeKey = key;
      frame.node = value;

      const transformed = await processNode(value, context);
      if (transformed === undefined) {
        modified = true;
      } else if (transformed === value) {
        result[key] = value;
      } else if (!(transformed instanceof Fragment)) {
        result[key] = transformed;
        modified = true;
      } else {
        for (const node of transformed.nodes) {
          if (isObject(node)) {
            for (const [key, value] of Object.entries(node)) {
              if (value !== undefined) {
                result[key] = value;
                modified = true;
              } else if (key in result) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete result[key];
                modified = true;
              }
            }
          }
        }
      }
    });
  }

  if (!modified) {
    return node;
  }
  return result;
}

/**
 * Processes a directive object.
 *
 * @category Process
 * @internal
 */
export async function processDirectives(
  node: DirectiveObject,
  context: FormContext,
): Promise<Node | undefined> {
  let result: Node | undefined;

  // Detect and validate directives.
  const directives = detectDirectives(node, context);

  // Apply modifier directives.
  if (directives.modifiers !== undefined) {
    for (const directive of Object.values(directives.modifiers)) {
      await directive.modify(node, context);
    }
  }

  // Apply the domain directive, or transform the object.
  if (directives.domain !== undefined) {
    result = await directives.domain.transform(node, context);
  } else {
    result = await processObject(node, context);
  }

  // Apply operator directives.
  if (directives.operators !== undefined) {
    for (const [directive, argument] of Object.values(directives.operators)) {
      result = await directive.operate(argument, result, context);
    }
  }

  return result;
}
