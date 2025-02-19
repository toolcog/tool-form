import type { FormContext } from "../context.ts";
import type { DirectiveObject, ModifierDirective } from "../directive.ts";

/**
 * A directive that provides a comment about a template.
 *
 * @category Directive
 */
export const commentDirective = {
  type: "modifier",
  name: "$comment",
  modify(node: DirectiveObject, context: FormContext): void {
    // nop
  },
} as const satisfies ModifierDirective;
