import type { Node } from "tool-json";
import { currentLocation } from "tool-json";
import { TransformError } from "../error.ts";
import type { FormContext } from "../context.ts";
import type { DirectiveObject, DomainDirective } from "../directive.ts";
import { evaluateSingularExpression } from "../evaluate.ts";

/**
 * A directive that incorporates values from Singular Expressions into a template.
 *
 * @category Directive
 */
export const spliceDirective = {
  type: "domain",
  name: "$",
  transform(node: DirectiveObject, context: FormContext): Node | undefined {
    if (typeof node.$ !== "string") {
      throw new TransformError("$ value must be a string", {
        location: currentLocation(context),
      });
    }

    return evaluateSingularExpression(node.$, context);
  },
} as const satisfies DomainDirective;
