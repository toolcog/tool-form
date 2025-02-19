import { pctEncode } from "tool-uri";
import type { Node } from "tool-json";
import { isArray, isObject, getChild, Payload } from "tool-json";
import type { FormContext } from "../context.ts";
import type { Encoding } from "../encoding.ts";

/**
 * An encoding that produces `application/x-www-form-urlencoded` strings.
 *
 * @category Encoding
 */
export const urlencodedEncoding = {
  name: "urlencoded",
  encode(node: Node, context: FormContext): Promise<Node | undefined> {
    let content = getChild(node, "$content");
    if (content === undefined) {
      content = node;
    }

    const value = urlencode(content);
    return Promise.resolve(
      new Payload(value, {
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    );
  },
} as const satisfies Encoding;

/**
 * Encodes a node as an `application/x-www-form-urlencoded` string.
 *
 * @category Encoding
 * @internal
 */
export function urlencode(node: Node, prefix?: string): string {
  let output = "";

  if (isArray(node)) {
    for (let index = 0; index < node.length; index += 1) {
      const value = node[index];
      if (value === undefined || value === null) {
        continue;
      }
      const path = (prefix !== undefined ? prefix + "." : "") + index;
      const result = urlencode(value, path);
      if (output.length !== 0 && result.length !== 0) {
        output += "&";
      }
      output += result;
    }
  } else if (isObject(node)) {
    for (let [key, value] of Object.entries(node)) {
      if (value === undefined || value === null) {
        continue;
      }
      const path =
        (prefix !== undefined ? prefix + "." : "") +
        pctEncode(key.replace(/ /g, "+"), "form");
      const result = urlencode(value, path);
      if (output.length !== 0 && result.length !== 0) {
        output += "&";
      }
      output += result;
    }
  } else if (node !== undefined && node !== null) {
    if (prefix !== undefined) {
      output += prefix + "=";
    }
    output += pctEncode(String(node).replace(/ /g, "+"), "form");
  }

  return output;
}
