import type { Node } from "tool-json";
import { isArray, isObject, Payload } from "tool-json";
import type { FormContext, DirectiveObject } from "tool-form";
import type { MarkdownDirective } from "./directive.ts";
import { detectMarkdownDirective } from "./directive.ts";
import type { MarkdownEncoding } from "./encoding.ts";

/**
 * Encodes an inline markdown run.
 */
export function encodeInline(
  node: Node | undefined,
  context: FormContext,
): string | undefined {
  // Unwrap payloads.
  if (node instanceof Payload) {
    node = node.value;
  }

  // Encode primitives.
  if (node === undefined) {
    return undefined;
  } else if (node === null) {
    return "";
  } else if (!isObject(node)) {
    return String(node);
  }

  // Encode arrays.
  if (isArray(node)) {
    return encodeInlineArray(node, context);
  }

  // Encode inline directives.
  const encoding = context.encodings!.markdown as MarkdownEncoding;
  const inlineDirective = detectMarkdownDirective(
    node,
    context,
    encoding.inlineDirectives,
    encoding.blockDirectives,
  );
  if (inlineDirective !== undefined) {
    return inlineDirective.encode(node, context);
  }

  // Encode block directives surrounded by newlines.
  const blockDirective = detectMarkdownDirective(
    node,
    context,
    encoding.blockDirectives,
  );
  if (blockDirective !== undefined) {
    return "\n" + blockDirective.encode(node, context) + "\n";
  }

  // Encode non-directive objects.
  return encoding.encodeInlineObject(node, context);
}

/**
 * Encodes an array of inline markdown runs.
 */
export function encodeInlineArray(
  nodes: readonly Node[],
  context: FormContext,
): string {
  let result = "";
  const encoding = context.encodings!.markdown as MarkdownEncoding;
  for (const node of nodes) {
    const content = encoding.encodeInline(node, context);
    if (content === undefined) {
      continue;
    }
    result += content;
  }
  return result;
}

/**
 * Encodes an object as an inline markdown run.
 */
export function encodeInlineObject(
  node: { readonly [key: string]: Node },
  context: FormContext,
): string | undefined {
  return JSON.stringify(node);
}

/**
 * A directive that encodes an inline markdown run, even in block contexts.
 */
export const inlineDirective = {
  name: "$inline",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    return encoding.encodeInline(node.$inline, context);
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes a link.
 */
export const aDirective = {
  name: "$a",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    const url = encoding.encodeInline(node.$a, context);
    if (url === undefined) {
      return undefined;
    }
    const text = encoding.encodeInline(node.text, context) ?? url;
    return "[" + text + "](" + url + ")";
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes an image.
 */
export const imgDirective = {
  name: "$img",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    const url = encoding.encodeInline(node.$img, context);
    if (url === undefined) {
      return undefined;
    }
    const alt = encoding.encodeInline(node.alt, context) ?? "";
    return "![" + alt + "](" + url + ")";
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes a code span.
 */
export const codeDirective = {
  name: "$code",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    const content = encoding.encodeInline(node.$code, context);
    if (content === undefined) {
      return undefined;
    }
    return "`" + content + "`";
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes an italic span.
 */
export const emDirective = {
  name: "$em",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    const content = encoding.encodeInline(node.$em, context);
    if (content === undefined) {
      return undefined;
    }
    return "_" + content + "_";
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes a bold span.
 */
export const strongDirective = {
  name: "$strong",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    const content = encoding.encodeInline(node.$strong, context);
    if (content === undefined) {
      return undefined;
    }
    return "**" + content + "**";
  },
} as const satisfies MarkdownDirective;
