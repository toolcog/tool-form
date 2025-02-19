import type { Node } from "tool-json";
import { isArray, isObject, sort } from "tool-json";
import type { FormContext } from "../context.ts";
import type { Transform } from "../transform.ts";
import { compareNodes } from "../order.ts";

/**
 * A transform that sorts arrays according to the total order defined in section 2.1.1.
 *
 * @category Transform
 */
export const sortTransform = {
  name: "sort",
  transform(node: Node, context: FormContext): Node | undefined {
    if (isArray(node)) {
      return sort([...node], compareNodes);
    } else if (isObject(node)) {
      const sorted: Record<string, Node> = {};
      for (const key of Object.keys(node).sort()) {
        const value = node[key];
        if (value !== undefined) {
          sorted[key] = value;
        }
      }
      return sorted;
    }
    return undefined;
  },
} as const satisfies Transform;
