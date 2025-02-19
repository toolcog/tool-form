import type { Node } from "tool-json";
import { isArray } from "tool-json";
import type { FormContext } from "../context.ts";
import type { Transform } from "../transform.ts";

/**
 * A transform that returns the last element of an array.
 *
 * @category Transform
 */
export const lastTransform = {
  name: "last",
  transform(node: Node, context: FormContext): Node | undefined {
    if (isArray(node)) {
      return node[node.length - 1];
    }
    return undefined;
  },
} as const satisfies Transform;
