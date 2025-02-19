import type { FormContext } from "../context.ts";
import type { DirectiveObject, ModifierDirective } from "../directive.ts";

/**
 * A directive that provides metadata about a template.
 *
 * @category Directive
 */
export const metaDirective = {
  type: "modifier",
  name: "$meta",
  modify(node: DirectiveObject, context: FormContext): void {
    // nop
  },
} as const satisfies ModifierDirective;
