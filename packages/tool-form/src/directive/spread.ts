import type { NodeList, Frame } from "tool-json";
import { Fragment, nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject, DomainDirective } from "../directive.ts";
import { evaluateQueryExpression } from "../evaluate.ts";
import { processNode } from "../process.ts";

/**
 * A directive that spreads Variable Expressions into parent nodes.
 *
 * @category Directive
 */
export const spreadDirective = {
  type: "domain",
  name: "$spread",
  transform(node: DirectiveObject, context: FormContext): Fragment | undefined {
    const nodes =
      typeof node.$spread === "string" ?
        evaluateQueryExpression(node.$spread, context)
      : nestFrame(context, (frame: Frame): NodeList | undefined => {
          frame.nodeKey = "$spread";
          frame.node = node.$spread;
          const result = processNode(node.$spread, context);
          return result !== undefined ? [result] : undefined;
        });
    if (nodes === undefined) {
      return undefined;
    }

    return new Fragment(nodes);
  },
} as const satisfies DomainDirective;
