import { currentLocation } from "tool-json";
import type { FormContext, DirectiveObject } from "tool-form";
import { TransformError } from "tool-form";

/**
 * An args directive.
 */
export interface ArgsDirective {
  /**
   * The name of the directive property.
   */
  readonly name: string;

  /**
   * Appends the encoded form of the given node to the args array.
   */
  encode(node: DirectiveObject, context: FormContext, args: string[]): string[];
}

/**
 * Returns the args directive defined by the given node, or `undefined`
 * if the node is not an args directive object.
 *
 * @throws TransformError if the node contains more than one property
 * in the `directives` set.
 */
export function detectArgsDirective(
  node: DirectiveObject,
  context: FormContext,
  directives: { readonly [name: string]: ArgsDirective },
): ArgsDirective | undefined {
  let directive: ArgsDirective | undefined;
  for (const key of Object.keys(node)) {
    if (directive === undefined) {
      directive = directives[key];
    } else if (directives[key] !== undefined) {
      throw new TransformError("Ambiguous args directive", {
        location: currentLocation(context),
      });
    }
  }
  return directive;
}
