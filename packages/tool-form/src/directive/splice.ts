import type { Node } from "tool-json";
import { currentLocation } from "tool-json";
import { TransformError } from "../error.ts";
import type { FormContext } from "../context.ts";
import type { DirectiveObject } from "../directive.ts";
import { DomainDirective } from "../directive.ts";
import { evaluateSingularExpression } from "../evaluate.ts";

/**
 * A directive that incorporates values from Singular Expressions into a template.
 *
 * @category Directive
 */
export const spliceDirective = {
  ...DomainDirective.prototype,
  name: "$",

  transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Node | undefined> {
    if (typeof node.$ !== "string") {
      throw new TransformError("$ value must be a string", {
        location: currentLocation(context),
      });
    }

    return Promise.resolve(evaluateSingularExpression(node.$, context));
  },
} as const satisfies DomainDirective;
