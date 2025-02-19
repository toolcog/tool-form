import { currentLocation } from "tool-json";
import type { FormContext, DirectiveObject } from "tool-form";
import { TransformError } from "tool-form";

/**
 * A markdown directive.
 */
export interface MarkdownDirective {
  /**
   * The name of the directive property.
   */
  readonly name: string;

  /**
   * Encodes the given node as a markdown string.
   */
  encode(node: DirectiveObject, context: FormContext): string | undefined;
}

/**
 * Returns the markdown directive defined by the given node,
 * or `undefined` if the node is not a markdown directive object.
 *
 * @throws TransformError if the node contains more than one property
 * in the union of the `directives` and `excludeDirectives` sets.
 */
export function detectMarkdownDirective(
  node: DirectiveObject,
  context: FormContext,
  directives: { readonly [name: string]: MarkdownDirective },
  excludeDirectives?: { readonly [name: string]: MarkdownDirective },
): MarkdownDirective | undefined {
  let directive: MarkdownDirective | undefined;
  for (const key of Object.keys(node)) {
    if (directive === undefined) {
      directive = directives[key];
    } else if (
      directives[key] !== undefined ||
      excludeDirectives?.[key] !== undefined
    ) {
      throw new TransformError("Ambiguous markdown directive", {
        location: currentLocation(context),
      });
    }
  }
  return directive;
}
