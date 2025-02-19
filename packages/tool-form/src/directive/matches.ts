import type { Node } from "tool-json";
import { nestFrame, resolveReferences } from "tool-json";
import type { SchemaFrame, OutputUnit } from "tool-schema";
import { parseSchemaResource, validateSchemaResource } from "tool-schema";
import type { FormContext } from "../context.ts";
import { OperatorDirective } from "../directive.ts";
import { parseNode } from "../parse.ts";
import { processNode } from "../process.ts";

/**
 * A directive that matches its input node against a JSON Schema.
 *
 * @category Directive
 */
export const matchesDirective = {
  ...OperatorDirective.prototype,
  name: "$matches",

  parse(argument: Node, context: FormContext): void {
    parseNode(argument, context);
  },

  async operate(
    argument: Node,
    node: Node,
    context: FormContext,
  ): Promise<Node | undefined> {
    const output = await nestFrame(
      context,
      async (frame: SchemaFrame): Promise<OutputUnit> => {
        frame.nodeKey = "$matches";

        // Transform the directive argument.
        frame.node = argument;
        const result = await processNode(argument, context);

        // Parse the transformed argument as a JSON Schema.
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

    return output.valid;
  },
} as const satisfies OperatorDirective;
