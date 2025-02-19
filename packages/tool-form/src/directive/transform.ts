import type { Node, Frame } from "tool-json";
import { isArray, nestFrame, currentLocation } from "tool-json";
import { TransformError } from "../error.ts";
import type { FormContext } from "../context.ts";
import { OperatorDirective } from "../directive.ts";
import { parseNode } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that applies a Transform function to a value.
 *
 * @category Directive
 */
export const transformDirective = {
  ...OperatorDirective.prototype,
  name: "$transform",

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
        frame.nodeKey = "$transform";
        frame.node = argument;
        return await processNode(argument, context);
      },
    );

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
