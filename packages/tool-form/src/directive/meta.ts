import { ModifierDirective } from "../directive.ts";

/**
 * A directive that provides metadata about a template.
 *
 * @category Directive
 */
export const metaDirective = {
  ...ModifierDirective.prototype,
  name: "$meta",
} as const satisfies ModifierDirective;
