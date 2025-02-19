import type { Node } from "tool-json";
import { getChild, Payload } from "tool-json";
import type { FormContext } from "../context.ts";
import type { Encoding } from "../encoding.ts";
import { coerceString } from "../evaluate.ts";

/**
 * An encoding that produces base64-encoded strings.
 *
 * @category Encoding
 */
export const base64Encoding = {
  name: "base64",
  encode(node: Node, context: FormContext): Promise<Node | undefined> {
    let content = getChild(node, "$content");
    if (content === undefined) {
      content = node;
    }

    let data: Uint8Array;
    if (ArrayBuffer.isView(content)) {
      data = new Uint8Array(
        content.buffer,
        content.byteOffset,
        content.byteLength,
      );
    } else if (content !== undefined) {
      data = new TextEncoder().encode(coerceString(content));
    } else {
      return Promise.resolve(undefined);
    }

    const value = btoa(String.fromCharCode(...data));
    return Promise.resolve(
      new Payload(value, { "Content-Type": "application/base64" }),
    );
  },
} as const satisfies Encoding;
