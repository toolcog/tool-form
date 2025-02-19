import type { Node, Frame } from "tool-json";
import { Payload, initContext, nestFrame, resolveReferences } from "tool-json";
import { initQueryContext } from "tool-query";
import { initSchemaContext, dialects } from "tool-schema";
import type { FormContext, FormContextOptions } from "./context.ts";
import { initFormContext } from "./context.ts";
import type { Directive } from "./directive.ts";
import type { Transform } from "./transform.ts";
import type { Encoding } from "./encoding.ts";
import { processTemplate } from "./process.ts";
import { parseTemplateResource } from "./resource.ts";
import { metaDirective } from "./directive/meta.ts";
import { commentDirective } from "./directive/comment.ts";
import { spliceDirective } from "./directive/splice.ts";
import { useDirective } from "./directive/use.ts";
import { uriDirective } from "./directive/uri.ts";
import { includeDirective } from "./directive/include.ts";
import { spreadDirective } from "./directive/spread.ts";
import { ifDirective } from "./directive/if.ts";
import { whenDirective } from "./directive/when.ts";
import { eachDirective } from "./directive/each.ts";
import { joinDirective } from "./directive/join.ts";
import { matchDirective } from "./directive/match.ts";
import { matchesDirective } from "./directive/matches.ts";
import { transformDirective } from "./directive/transform.ts";
import { encodeDirective } from "./directive/encode.ts";
import { lengthTransform } from "./transform/length.ts";
import { sortTransform } from "./transform/sort.ts";
import { firstTransform } from "./transform/first.ts";
import { lastTransform } from "./transform/last.ts";
import { jsonEncoding } from "./encoding/json.ts";
import { base64Encoding } from "./encoding/base64.ts";
import { urlencodedEncoding } from "./encoding/urlencoded.ts";

/**
 * Options for parsing a Tool Form template.
 *
 * @category Template
 */
export interface TemplateOptions extends FormContextOptions {
  /**
   * The base URI for the template.
   */
  baseUri?: string | undefined;
}

/**
 * A handle to a resolved Tool Form template.
 *
 * @category Template
 */
export class Template<T = unknown> {
  /**
   * The raw template node.
   */
  readonly node: T;

  /**
   * The context in which the template was parsed.
   */
  readonly #context: FormContext;

  /** @internal */
  constructor(node: T, context: FormContext) {
    this.node = node;
    this.#context = context;
  }

  /**
   * The context in which the template was parsed.
   */
  get context(): FormContext {
    return this.#context;
  }

  /**
   * Transforms this template with the given arguments, returning the raw
   * result node, which might be a `Payload` wrapper.
   */
  async transformNode(args: Node): Promise<Node | undefined> {
    return nestFrame(
      this.context,
      async (frame: Frame): Promise<Node | undefined> => {
        frame.node = this.node;
        return await processTemplate(this.node, args, this.context);
      },
    );
  }

  /**
   * Transforms this template with the given arguments,
   * unwrapping any `Payload` result.
   */
  async transform(args: Node): Promise<Node | undefined> {
    const result = await this.transformNode(args);
    return result instanceof Payload ? result.value : result;
  }

  /**
   * Returns the raw template node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * Parses a Tool Form template.
 *
 * @category Template
 */
export async function parseTemplate<const T>(
  node: T,
  options?: TemplateOptions,
): Promise<Template<T>> {
  // Initialize the query context first.
  const context = initSchemaContext(
    initQueryContext(initContext({}, options), options),
    options,
  ) as FormContext;

  // Inject standard directives and encodings.
  context.directives = directives;
  context.transforms = transforms;
  context.encodings = encodings;

  // Then initialize the form context.
  initFormContext(context, options);

  // Configure JSON Schema dialects.
  if (context.dialects === undefined) {
    // Support all standard dialects.
    context.dialects = dialects;
  }

  // Configure the default JSON Schema dialect.
  if (context.dialect === undefined) {
    // Use the first dialect as the default.
    for (const dialect of context.dialects.values()) {
      context.dialect = dialect;
      break;
    }
  }

  // Enable format validation by default.
  if (context.validation === undefined) {
    context.validation = true;
  }

  // Isolate parsing in a nested stack frame.
  await nestFrame(context, async (frame: Frame): Promise<void> => {
    frame.baseUri = options?.baseUri;
    frame.node = node;
    // Parse the template.
    const resource = parseTemplateResource(context);
    // Resolve all references registered during parsing.
    await resolveReferences(context, resource);
  });

  return new Template(node, context);
}

/**
 * Standard Tool Form directives.
 *
 * @category Template
 * @internal
 */
export const directives: { readonly [name: string]: Directive } = {
  [metaDirective.name]: metaDirective,
  [commentDirective.name]: commentDirective,
  [spliceDirective.name]: spliceDirective,
  [useDirective.name]: useDirective,
  [uriDirective.name]: uriDirective,
  [includeDirective.name]: includeDirective,
  [spreadDirective.name]: spreadDirective,
  [ifDirective.name]: ifDirective,
  [whenDirective.name]: whenDirective,
  [eachDirective.name]: eachDirective,
  [joinDirective.name]: joinDirective,
  [matchDirective.name]: matchDirective,
  [matchesDirective.name]: matchesDirective,
  [transformDirective.name]: transformDirective,
  [encodeDirective.name]: encodeDirective,
};

/**
 * Standard Tool Form transforms.
 *
 * @category Template
 * @internal
 */
export const transforms: { readonly [name: string]: Transform } = {
  [lengthTransform.name]: lengthTransform,
  [sortTransform.name]: sortTransform,
  [firstTransform.name]: firstTransform,
  [lastTransform.name]: lastTransform,
};

/**
 * Standard Tool Form encodings.
 *
 * @category Template
 * @internal
 */
export const encodings: { readonly [name: string]: Encoding } = {
  [jsonEncoding.name]: jsonEncoding,
  [base64Encoding.name]: base64Encoding,
  [urlencodedEncoding.name]: urlencodedEncoding,
} as const;
