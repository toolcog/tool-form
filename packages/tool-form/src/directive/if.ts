import type { Node, Frame } from "tool-json";
import { nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject } from "../directive.ts";
import { DomainDirective } from "../directive.ts";
import { evaluatePredicateExpression, coerceBoolean } from "../evaluate.ts";
import { parseObject } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that conditionally transforms a node.
 *
 * @category Directive
 */
export const ifDirective = {
  ...DomainDirective.prototype,
  name: "$if",

  parse(node: DirectiveObject, context: FormContext): void {
    parseObject(node, context);
  },

  async transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Node | undefined> {
    const condition =
      typeof node.$if === "string" ?
        evaluatePredicateExpression(node.$if, context)
      : await nestFrame(context, async (frame: Frame): Promise<boolean> => {
          frame.nodeKey = "$if";
          frame.node = node.$if;
          return coerceBoolean(await processNode(node.$if, context));
        });

    if (condition) {
      return await nestFrame(
        context,
        async (frame: Frame): Promise<Node | undefined> => {
          frame.nodeKey = "$then";
          frame.node = node.$then;
          return await processNode(node.$then, context);
        },
      );
    } else {
      return await nestFrame(
        context,
        async (frame: Frame): Promise<Node | undefined> => {
          frame.nodeKey = "$else";
          frame.node = node.$else;
          return await processNode(node.$else, context);
        },
      );
    }
  },
} as const satisfies DomainDirective;
