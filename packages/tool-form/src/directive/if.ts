import type { Node, Frame } from "tool-json";
import { nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject, DomainDirective } from "../directive.ts";
import { evaluatePredicateExpression, coerceBoolean } from "../evaluate.ts";
import { processNode } from "../process.ts";

/**
 * A directive that conditionally transforms a node.
 *
 * @category Directive
 */
export const ifDirective = {
  type: "domain",
  name: "$if",
  transform(node: DirectiveObject, context: FormContext): Node | undefined {
    const condition =
      typeof node.$if === "string" ?
        evaluatePredicateExpression(node.$if, context)
      : nestFrame(context, (frame: Frame): boolean => {
          frame.nodeKey = "$if";
          frame.node = node.$if;
          return coerceBoolean(processNode(node.$if, context));
        });

    if (condition) {
      return nestFrame(context, (frame: Frame): Node | undefined => {
        frame.nodeKey = "$then";
        frame.node = node.$then;
        return processNode(node.$then, context);
      });
    } else {
      return nestFrame(context, (frame: Frame): Node | undefined => {
        frame.nodeKey = "$else";
        frame.node = node.$else;
        return processNode(node.$else, context);
      });
    }
  },
} as const satisfies DomainDirective;
