import { expandUriTemplate } from "tool-uri";
import type { Node } from "tool-json";
import { currentLocation } from "tool-json";
import {
  createQuery,
  createChildSegment,
  createNameSelector,
  formatQuery,
} from "tool-query";
import { TransformError } from "../error.ts";
import type { FormContext } from "../context.ts";
import type { DirectiveObject } from "../directive.ts";
import { DomainDirective } from "../directive.ts";
import { evaluateSingularExpression } from "../evaluate.ts";

/**
 * A directive that expands RFC 6570 URI Templates.
 *
 * @category Directive
 */
export const uriDirective = {
  ...DomainDirective.prototype,
  name: "$uri",

  transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Node | undefined> {
    if (typeof node.$uri !== "string") {
      throw new TransformError("$uri value must be a string", {
        location: currentLocation(context),
      });
    }

    return Promise.resolve(
      expandUriTemplate(node.$uri, (varname: string): unknown => {
        let query = node[varname] as string | undefined;
        if (query === undefined) {
          query = formatQuery(
            createQuery([createChildSegment([createNameSelector(varname)])]),
          );
        } else if (typeof query !== "string") {
          throw new TransformError(
            "variable expression " +
              JSON.stringify(varname) +
              " must be a string",
            { location: currentLocation(context) },
          );
        }
        return evaluateSingularExpression(query, context);
      }),
    );
  },
} as const satisfies DomainDirective;
