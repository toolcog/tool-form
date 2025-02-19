import type { Node, Frame } from "tool-json";
import { isArray, nestFrame, currentLocation } from "tool-json";
import { TransformError } from "../error.ts";
import type { FormContext } from "../context.ts";
import type { OperatorDirective } from "../directive.ts";
import { processNode } from "../process.ts";

/**
 * A directive that serializes a value using a format encoder.
 *
 * @category Directive
 */
export const encodeDirective = {
  type: "operator",
  name: "$encode",
  operate(argument: Node, node: Node, context: FormContext): Node | undefined {
    argument = nestFrame(context, (frame: Frame): Node | undefined => {
      frame.nodeKey = "$encode";
      frame.node = argument;
      return processNode(argument, context);
    });

    const encodings = isArray(argument) ? argument : [argument];
    for (const name of encodings) {
      if (typeof name !== "string") {
        throw new TransformError(
          "Encoding name must be a string: " + JSON.stringify(name),
          { location: currentLocation(context) },
        );
      }

      const encoding = context.encodings?.[name];
      if (encoding === undefined) {
        throw new TransformError(
          "Unsupported encoding: " + JSON.stringify(name),
          { location: currentLocation(context) },
        );
      }

      node = encoding.encode(node, context);
    }

    return node;
  },
} as const satisfies OperatorDirective;
