import type { Node } from "tool-json";
import { isArray, isObject, nestFrame, resolveReferences } from "tool-json";
import type { SchemaFrame, OutputUnit } from "tool-schema";
import { parseSchemaResource, validateSchemaResource } from "tool-schema";
import type { FormContext } from "../context.ts";
import { OperatorDirective } from "../directive.ts";
import { parseNode } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that matches its input node against a series of branches.
 *
 * @category Directive
 */
export const matchDirective = {
  ...OperatorDirective.prototype,
  name: "$match",

  parse(argument: Node, context: FormContext): void {
    parseNode(argument, context);
  },

  async operate(
    argument: Node,
    node: Node,
    context: FormContext,
  ): Promise<Node | undefined> {
    if (!isArray(argument)) {
      return undefined;
    }

    for (let index = 0; index < argument.length; index += 1) {
      const branch = argument[index];
      const result = await nestFrame(
        context,
        async (frame: SchemaFrame): Promise<Node> => {
          frame.nodeKey = index;
          frame.node = branch;
          return await transformBranch(branch, node, context);
        },
      );
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  },
} as const satisfies OperatorDirective;

/** @internal */
async function transformBranch(
  branch: Node,
  node: Node,
  context: FormContext,
): Promise<Node> {
  if (isObject(branch) && branch.$case !== undefined) {
    return await transformBranchSchema(branch, node, context);
  }
  return await transformBranchObject(branch, context);
}

/** @internal */
async function transformBranchSchema(
  branch: { readonly [key: string]: unknown },
  node: Node,
  context: FormContext,
): Promise<Node> {
  const output = await nestFrame(
    context,
    async (frame: SchemaFrame): Promise<OutputUnit> => {
      frame.nodeKey = "$case";

      // Transform the branch case.
      frame.node = branch.$case;
      const result = await processNode(branch.$case, context);

      // Parse the transformed branch case as a JSON Schema.
      frame.node = result;
      const resource = parseSchemaResource(context);

      // Resolve all references in the parsed schema.
      await resolveReferences(context, resource);

      // Validate the input node against the schema.
      frame.instance = node;
      frame.output = { valid: true };
      validateSchemaResource(context);

      return frame.output;
    },
  );

  if (!output.valid) {
    return undefined;
  }

  if (branch.$then !== undefined) {
    return await processNode(branch.$then, context);
  }

  return await processNode(
    Object.fromEntries(
      Object.entries(branch).filter(([key]) => key !== "$case"),
    ),
    context,
  );
}

/** @internal */
async function transformBranchObject(
  branch: Node,
  context: FormContext,
): Promise<Node> {
  if (isObject(branch) && branch.$then !== undefined) {
    return await processNode(branch.$then, context);
  }
  return await processNode(branch, context);
}
