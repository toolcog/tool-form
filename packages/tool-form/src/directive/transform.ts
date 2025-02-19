import type { Node, Frame } from "tool-json";
import { isArray, nestFrame, currentLocation } from "tool-json";
import { TransformError } from "../error.ts";
import type { FormContext } from "../context.ts";
import type { OperatorDirective } from "../directive.ts";
import { processNode } from "../process.ts";

/**
 * A directive that applies a Transform function to a value.
 *
 * @category Directive
 */
export const transformDirective = {
  type: "operator",
  name: "$transform",
  operate(argument: Node, node: Node, context: FormContext): Node | undefined {
    argument = nestFrame(context, (frame: Frame): Node | undefined => {
      frame.nodeKey = "$transform";
      frame.node = argument;
      return processNode(argument, context);
    });

    const transforms = isArray(argument) ? argument : [argument];
    for (const name of transforms) {
      if (typeof name !== "string") {
        throw new TransformError(
          "Transform name must be a string: " + JSON.stringify(name),
          { location: currentLocation(context) },
        );
      }

      const transform = context.transforms?.[name];
      if (transform === undefined) {
        throw new TransformError(
          "Unsupported transform: " + JSON.stringify(name),
          { location: currentLocation(context) },
        );
      }

      node = transform.transform(node, context);
    }

    return node;
  },
} as const satisfies OperatorDirective;
