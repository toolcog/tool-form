import type { Node, Frame } from "tool-json";
import { nestFrame, currentResource, resolveResourceUri } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject, DomainDirective } from "../directive.ts";
import { processNode } from "../process.ts";

/**
 * A directive that incorporates a URI reference into a template.
 *
 * @category Directive
 */
export const includeDirective = {
  type: "domain",
  name: "$include",
  transform(node: DirectiveObject, context: FormContext): Node | undefined {
    const uri = nestFrame(context, (frame: Frame): Node | undefined => {
      frame.nodeKey = "$include";
      frame.node = node.$include;
      return processNode(node.$include, context);
    });
    if (typeof uri !== "string") {
      return undefined;
    }

    const resource = currentResource(context);
    return resolveResourceUri(context, resource, uri);
  },
} as const satisfies DomainDirective;
