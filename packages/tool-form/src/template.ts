import type { Node, Frame } from "tool-json";
import { initContext, nestFrame } from "tool-json";
import { initQueryContext } from "tool-query";
import type { FormContext, FormContextOptions } from "./context.ts";
import { initFormContext } from "./context.ts";
import type { Directive } from "./directive.ts";
import type { Transform } from "./transform.ts";
import type { Encoding } from "./encoding.ts";
import { processTemplate } from "./process.ts";
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
 * A handle for a parsed Tool Form template.
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
  readonly context: FormContext;

  /** @internal */
  constructor(node: T, context: FormContext) {
    this.node = node;
    this.context = context;
  }

  /**
   * Transforms this template with the given arguments.
   */
  transform(args: Node): Node | undefined {
    return nestFrame(this.context, (frame: Frame): Node | undefined => {
      frame.node = this.node;
      return processTemplate(this.node, args, this.context);
    });
  }

  /**
   * Returns the raw template node.
   */
  toJSON(): unknown {
    return this.node;
  }

  /**
   * Parses a root template node.
   */
  static parse<const T>(node: T, options?: FormContextOptions): Template<T> {
    // Initialize the query context.
    const context = initQueryContext(
      initContext({}, options),
      options,
    ) as FormContext;

    // Inject standard directives and encodings.
    context.directives = standardDirectives;
    context.transforms = standardTransforms;
    context.encodings = standardEncodings;

    // Prior to initializing the form context,
    initFormContext(context, options);

    return new Template(node, context);
  }
}

/**
 * Standard Tool Form directives.
 *
 * @category Template
 * @internal
 */
const standardDirectives: { readonly [name: string]: Directive } = {
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
  [transformDirective.name]: transformDirective,
  [encodeDirective.name]: encodeDirective,
};

/**
 * Standard Tool Form transforms.
 *
 * @category Template
 * @internal
 */
const standardTransforms: { readonly [name: string]: Transform } = {
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
const standardEncodings: { readonly [name: string]: Encoding } = {
  [jsonEncoding.name]: jsonEncoding,
  [base64Encoding.name]: base64Encoding,
  [urlencodedEncoding.name]: urlencodedEncoding,
} as const;
