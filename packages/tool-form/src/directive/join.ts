import type { Node, Frame } from "tool-json";
import { isArray, isObject, nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { OperatorDirective } from "../directive.ts";
import { coerceString } from "../evaluate.ts";
import { processNode } from "../process.ts";

/**
 * A directive that joins transformed arrays of strings.
 *
 * @category Directive
 */
export const joinDirective = {
  type: "operator",
  name: "$join",
  operate(argument: Node, node: Node, context: FormContext): Node | undefined {
    argument = nestFrame(context, (frame: Frame): Node | undefined => {
      frame.nodeKey = "$join";
      frame.node = argument;
      return processNode(argument, context);
    });

    const separator = typeof argument === "string" ? argument : "";

    let fragments: readonly Node[];
    if (isArray(node)) {
      fragments = node;
    } else if (isObject(node)) {
      fragments = Object.values(node);
    } else {
      fragments = [node];
    }

    let result = "";
    let first = true;
    for (const fragment of fragments) {
      if (!first) {
        result += separator;
      }
      if (fragment !== undefined) {
        result += coerceString(fragment);
        first = false;
      }
    }
    return result;
  },
} as const satisfies OperatorDirective;
