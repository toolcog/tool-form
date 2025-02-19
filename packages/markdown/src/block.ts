import type { Node } from "tool-json";
import { isInteger, isArray, isObject, Payload } from "tool-json";
import type { FormContext, DirectiveObject } from "tool-form";
import type { MarkdownDirective } from "./directive.ts";
import { detectMarkdownDirective } from "./directive.ts";
import type { MarkdownEncoding } from "./encoding.ts";

/**
 * Encodes a markdown block.
 */
export function encodeBlock(
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
    return encodeBlockArray(node, context);
  }

  // Encode block directives.
  const encoding = context.encodings!.markdown as MarkdownEncoding;
  const blockDirective = detectMarkdownDirective(
    node,
    context,
    encoding.blockDirectives,
    encoding.inlineDirectives,
  );
  if (blockDirective !== undefined) {
    return blockDirective.encode(node, context);
  }

  // Encode inline directives.
  const inlineDirective = detectMarkdownDirective(
    node,
    context,
    encoding.inlineDirectives,
  );
  if (inlineDirective !== undefined) {
    return inlineDirective.encode(node, context);
  }

  // Encode non-directive objects.
  return encoding.encodeBlockObject(node, context);
}

/**
 * Encodes an array of markdown blocks.
 */
export function encodeBlockArray(
  nodes: readonly Node[],
  context: FormContext,
): string {
  let result = "";
  const encoding = context.encodings!.markdown as MarkdownEncoding;
  for (const node of nodes) {
    const content = encoding.encodeBlock(node, context);
    if (content === undefined || content === "") {
      continue;
    }
    if (result !== "") {
      result += "\n\n";
    }
    result += content;
  }
  return result;
}

/**
 * Encodes an object as a markdown block.
 */
export function encodeBlockObject(
  node: { readonly [key: string]: Node },
  context: FormContext,
): string | undefined {
  return JSON.stringify(node, null, 2);
}

/**
 * A directive that encodes a markdown block, even in inline contexts.
 */
export const blockDirective = {
  name: "$block",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    return encoding.encodeBlock(node.$block, context);
  },
} as const satisfies MarkdownDirective;

/**
 * Returns a markdown heading directive for the given level.
 */
export function headingDirective(level: number): MarkdownDirective {
  const name = "$h" + level;
  return {
    name,
    encode(node: DirectiveObject, context: FormContext): string | undefined {
      const encoding = context.encodings!.markdown as MarkdownEncoding;
      const content = encoding.encodeInline(node[name], context);
      if (content === undefined) {
        return undefined;
      }
      return "#".repeat(level) + " " + content;
    },
  };
}

/**
 * A markdown directive that encodes a paragraph.
 */
export const pDirective = {
  name: "$p",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    return encoding.encodeInline(node.$p, context);
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes an unordered list.
 */
export const ulDirective = {
  name: "$ul",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const items = node.$ul;
    if (!isArray(items)) {
      return undefined;
    }

    let result = "";
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    for (const item of items) {
      const content = encoding.encodeBlock(item, context);
      if (content === undefined) {
        continue;
      }
      if (result !== "") {
        result += "\n";
      }
      const lines = content.split("\n");
      result += "- " + lines[0];
      for (let i = 1; i < lines.length; i += 1) {
        result += "\n  " + lines[i];
      }
    }
    return result;
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes an ordered list.
 */
export const olDirective = {
  name: "$ol",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const items = node.$ol;
    if (!isArray(items)) {
      return undefined;
    }

    let result = "";
    let index = isInteger(node.$start) ? node.$start : 1;
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    for (const item of items) {
      const content = encoding.encodeBlock(item, context);
      if (content === undefined) {
        continue;
      }
      if (result !== "") {
        result += "\n";
      }
      const prefix = index + ". ";
      index += 1;
      const lines = content.split("\n");
      result += prefix + lines[0];
      const indent = " ".repeat(prefix.length);
      for (let i = 1; i < lines.length; i += 1) {
        result += "\n" + indent + lines[i];
      }
    }
    return result;
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes a block quote.
 */
export const blockquoteDirective = {
  name: "$blockquote",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    const content = encoding.encodeBlock(node.$blockquote, context);
    if (content === undefined) {
      return undefined;
    }

    let result = "";
    for (const line of content.split("\n")) {
      if (result !== "") {
        result += "\n";
      }
      result += line === "" ? ">" : "> " + line;
    }
    return result;
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes a code block.
 */
export const codeBlockDirective = {
  name: "$code",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    const encoding = context.encodings!.markdown as MarkdownEncoding;
    const content = encoding.encodeInline(node.$code, context);
    if (content === undefined) {
      return undefined;
    }
    const lang = String(node.$lang ?? "");
    return "```" + lang + "\n" + content + "\n" + "```";
  },
} as const satisfies MarkdownDirective;

/**
 * A markdown directive that encodes a horizontal rule.
 */
export const hrDirective = {
  name: "$hr",
  encode(node: DirectiveObject, context: FormContext): string | undefined {
    return "---";
  },
} as const satisfies MarkdownDirective;
