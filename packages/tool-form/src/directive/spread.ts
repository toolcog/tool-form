import type { NodeList, Frame } from "tool-json";
import { Fragment, nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject } from "../directive.ts";
import { DomainDirective } from "../directive.ts";
import { evaluateQueryExpression } from "../evaluate.ts";
import { parseObject } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that spreads Variable Expressions into parent nodes.
 *
 * @category Directive
 */
export const spreadDirective = {
  ...DomainDirective.prototype,
  name: "$spread",

  parse(node: DirectiveObject, context: FormContext): void {
    parseObject(node, context);
  },

  async transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Fragment | undefined> {
    const nodes =
      typeof node.$spread === "string" ?
        evaluateQueryExpression(node.$spread, context)
      : await nestFrame(
          context,
          async (frame: Frame): Promise<NodeList | undefined> => {
            frame.nodeKey = "$spread";
            frame.node = node.$spread;
            const result = await processNode(node.$spread, context);
            return result !== undefined ? [result] : undefined;
          },
        );
    if (nodes === undefined) {
      return undefined;
    }

    return new Fragment(nodes);
  },
} as const satisfies DomainDirective;
