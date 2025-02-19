import type { Node, Frame } from "tool-json";
import { nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject, DomainDirective } from "../directive.ts";
import { processNode } from "../process.ts";

/**
 * A directive that uses its transformed value as its output.
 *
 * @category Directive
 */
export const useDirective = {
  type: "domain",
  name: "$use",
  transform(node: DirectiveObject, context: FormContext): Node | undefined {
    return nestFrame(context, (frame: Frame): Node | undefined => {
      frame.nodeKey = "$use";
      frame.node = node.$use;
      return processNode(node.$use, context);
    });
  },
} as const satisfies DomainDirective;
