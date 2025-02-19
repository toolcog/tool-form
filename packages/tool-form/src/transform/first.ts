import type { Node } from "tool-json";
import { isArray } from "tool-json";
import type { FormContext } from "../context.ts";
import type { Transform } from "../transform.ts";

/**
 * A transform that returns the first element of an array.
 *
 * @category Transform
 */
export const firstTransform = {
  name: "first",
  transform(node: Node, context: FormContext): Node | undefined {
    if (isArray(node)) {
      return node[0];
    }
    return undefined;
  },
} as const satisfies Transform;
