import { ModifierDirective } from "../directive.ts";

/**
 * A directive that provides a comment about a template.
 *
 * @category Directive
 */
export const commentDirective = {
  ...ModifierDirective.prototype,
  name: "$comment",
} as const satisfies ModifierDirective;
