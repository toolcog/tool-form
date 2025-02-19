import type { Node, Frame } from "tool-json";
import { nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject, DomainDirective } from "../directive.ts";
import { evaluatePredicateExpression, coerceBoolean } from "../evaluate.ts";
import { processNode, processObject } from "../process.ts";

/**
 * A directive that conditionally includes a node.
 *
 * @category Directive
 */
export const whenDirective = {
  type: "domain",
  name: "$when",
  transform(node: DirectiveObject, context: FormContext): Node | undefined {
    const condition =
      typeof node.$when === "string" ?
        evaluatePredicateExpression(node.$when, context)
      : nestFrame(context, (frame: Frame): boolean => {
          frame.nodeKey = "$when";
          frame.node = node.$when;
          return coerceBoolean(processNode(node.$when, context));
        });

    if (condition) {
      return processObject(node, context);
    }
    return undefined;
  },
} as const satisfies DomainDirective;
