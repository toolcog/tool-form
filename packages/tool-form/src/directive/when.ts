import type { Node, Frame } from "tool-json";
import { nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject } from "../directive.ts";
import { DomainDirective } from "../directive.ts";
import { evaluatePredicateExpression, coerceBoolean } from "../evaluate.ts";
import { parseObject } from "../parse.ts";
import { processNode, processObject } from "../process.ts";

/**
 * A directive that conditionally includes a node.
 *
 * @category Directive
 */
export const whenDirective = {
  ...DomainDirective.prototype,
  name: "$when",

  parse(node: DirectiveObject, context: FormContext): void {
    parseObject(node, context);
  },

  async transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Node | undefined> {
    const condition =
      typeof node.$when === "string" ?
        evaluatePredicateExpression(node.$when, context)
      : await nestFrame(context, async (frame: Frame): Promise<boolean> => {
          frame.nodeKey = "$when";
          frame.node = node.$when;
          return coerceBoolean(await processNode(node.$when, context));
        });

    if (condition) {
      return await processObject(node, context);
    }
    return undefined;
  },
} as const satisfies DomainDirective;
