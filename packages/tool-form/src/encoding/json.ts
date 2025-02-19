import type { Node } from "tool-json";
import { isObject, getChild, Payload } from "tool-json";
import type { FormContext } from "../context.ts";
import type { Encoding } from "../encoding.ts";

/**
 * An encoding that produces JSON strings.
 *
 * @category Encoding
 */
export const jsonEncoding = {
  name: "json",
  encode(node: Node, context: FormContext): Promise<Node | undefined> {
    let space: number | undefined;
    if (isObject(node) && node.$indent !== undefined) {
      let indent: unknown;
      ({ $indent: indent, ...node } = node);

      if (indent === true) {
        space = 2;
      } else if (typeof indent === "number" && indent >= 0 && indent <= 8) {
        space = indent;
      }
    }

    let content = getChild(node, "$content");
    if (content === undefined) {
      content = node;
    }

    const value = JSON.stringify(content, null, space);
    if (value === undefined) {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(
      new Payload(value, { "Content-Type": "application/json" }),
    );
  },
} as const satisfies Encoding;
