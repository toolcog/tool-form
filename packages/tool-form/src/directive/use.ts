import type { Node, Frame } from "tool-json";
import { nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject } from "../directive.ts";
import { DomainDirective } from "../directive.ts";
import { parseObject } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that uses its transformed value as its output.
 *
 * @category Directive
 */
export const useDirective = {
  ...DomainDirective.prototype,
  name: "$use",

  parse(node: DirectiveObject, context: FormContext): void {
    parseObject(node, context);
  },

  async transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Node | undefined> {
    return await nestFrame(
      context,
      async (frame: Frame): Promise<Node | undefined> => {
        frame.nodeKey = "$use";
        frame.node = node.$use;
        return await processNode(node.$use, context);
      },
    );
  },
} as const satisfies DomainDirective;
