import type { Node, Frame } from "tool-json";
import { isArray, isObject, nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import { OperatorDirective } from "../directive.ts";
import { coerceString } from "../evaluate.ts";
import { parseNode } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that joins transformed arrays of strings.
 *
 * @category Directive
 */
export const joinDirective = {
  ...OperatorDirective.prototype,
  name: "$join",

  parse(argument: Node, context: FormContext): void {
    parseNode(argument, context);
  },

  async operate(
    argument: Node,
    node: Node,
    context: FormContext,
  ): Promise<Node | undefined> {
    argument = await nestFrame(
      context,
      async (frame: Frame): Promise<Node | undefined> => {
        frame.nodeKey = "$join";
        frame.node = argument;
        return await processNode(argument, context);
      },
    );

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
