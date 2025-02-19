import type { Node, Frame } from "tool-json";
import { isArray, isObject, nestFrame } from "tool-json";
import type { FormContext } from "../context.ts";
import type { DirectiveObject } from "../directive.ts";
import { DomainDirective } from "../directive.ts";
import { evaluateQueryExpression, coerceString } from "../evaluate.ts";
import { parseObject } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that evaluates a template for each node in a sequence.
 *
 * @category Directive
 */
export const eachDirective = {
  ...DomainDirective.prototype,
  name: "$each",

  parse(node: DirectiveObject, context: FormContext): void {
    parseObject(node, context);
  },

  async transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Node | undefined> {
    const variable = node.$as;
    if (typeof variable !== "string") {
      return undefined;
    }

    // Determine the sequence to iterate over.
    let nodes: readonly Node[];
    if (typeof node.$each === "string") {
      nodes = evaluateQueryExpression(node.$each, context);
    } else {
      const transformed = nestFrame(
        context,
        async (frame: Frame): Promise<Node | undefined> => {
          frame.nodeKey = "$each";
          frame.node = node.$each;
          return await processNode(node.$each, context);
        },
      );

      if (isArray(transformed)) {
        nodes = transformed;
      } else if (isObject(transformed)) {
        nodes = Object.values(transformed);
      } else {
        nodes = [];
      }
    }

    // Determine the template to evaluate.
    let template: unknown;
    if (node.$value !== undefined) {
      template = node.$value;
    } else {
      template = {};
      for (const [key, value] of Object.entries(node)) {
        if (key === "$each" || key === "$as" || key === "$key") {
          continue;
        }
        (template as Record<string, Node>)[key] = value;
      }
    }

    // Transform the sequence into the result.
    if (node.$key !== undefined) {
      return transformEachObject(nodes, node.$key, template, variable, context);
    } else {
      return transformEachArray(nodes, template, variable, context);
    }
  },
} as const satisfies DomainDirective;

async function transformEachArray(
  nodes: readonly Node[],
  template: unknown,
  variable: string,
  context: FormContext,
): Promise<Node[]> {
  const result: Node[] = [];

  const outerArgument = context.queryArgument;
  const innerArgument: Record<string, Node> = {
    ...(outerArgument as object),
  };
  try {
    context.queryArgument = innerArgument;
    for (const node of nodes) {
      innerArgument[variable] = node;
      const element = await processNode(template, context);
      if (element !== undefined) {
        result.push(element);
      }
    }
  } finally {
    context.queryArgument = outerArgument;
  }

  return result;
}

async function transformEachObject(
  nodes: readonly Node[],
  keyTemplate: unknown,
  valueTemplate: unknown,
  variable: string,
  context: FormContext,
): Promise<Record<string, Node>> {
  const result: Record<string, Node> = {};

  const outerArgument = context.queryArgument;
  const innerArgument: Record<string, Node> = {
    ...(outerArgument as object),
  };
  try {
    context.queryArgument = innerArgument;
    for (const node of nodes) {
      innerArgument[variable] = node;
      const key = coerceString(await processNode(keyTemplate, context));
      const value = await processNode(valueTemplate, context);
      if (key !== undefined && value !== undefined) {
        result[key] = value;
      }
    }
  } finally {
    context.queryArgument = outerArgument;
  }

  return result;
}
