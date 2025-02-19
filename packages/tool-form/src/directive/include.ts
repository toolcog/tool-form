import type { Node, Frame } from "tool-json";
import { nestFrame, currentResource, resolveResourceUri } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject } from "../directive.ts";
import { DomainDirective } from "../directive.ts";
import { parseObject } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that incorporates a URI reference into a template.
 *
 * @category Directive
 */
export const includeDirective = {
  ...DomainDirective.prototype,
  name: "$include",

  parse(node: DirectiveObject, context: FormContext): void {
    parseObject(node, context);
  },

  async transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Node | undefined> {
    const uri = await nestFrame(
      context,
      async (frame: Frame): Promise<Node | undefined> => {
        frame.nodeKey = "$include";
        frame.node = node.$include;
        return await processNode(node.$include, context);
      },
    );
    if (typeof uri !== "string") {
      return undefined;
    }

    const resource = currentResource(context);
    return await resolveResourceUri(context, resource, uri);
  },
} as const satisfies DomainDirective;
