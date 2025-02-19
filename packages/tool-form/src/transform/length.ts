import type { Node } from "tool-json";
import { isArray, isObject, unicodeLength } from "tool-json";
import type { FormContext } from "../context.ts";
import type { Transform } from "../transform.ts";

/**
 * A transform that returns the length of a string, array, or object.
 *
 * @category Transform
 */
export const lengthTransform = {
  name: "length",
  transform(node: Node, context: FormContext): Node | undefined {
    if (typeof node === "string") {
      return unicodeLength(node);
    } else if (isArray(node)) {
      return node.length;
    } else if (isObject(node)) {
      return Object.keys(node).length;
    }
    return undefined;
  },
} as const satisfies Transform;
