import { isArray, initContext } from "tool-json";
import type { QueryContext, QueryContextOptions } from "tool-query";
import { initQueryContext, createQueryContext } from "tool-query";
import type {
  SchemaContext,
  SchemaContextOptions,
  SchemaFrame,
} from "tool-schema";
import { initSchemaContext } from "tool-schema";
import type { Directive } from "./directive.ts";
import type { Transform } from "./transform.ts";
import type { Encoding } from "./encoding.ts";

/**
 * A context for Tool Form processing.
 *
 * @category Context
 */
export interface FormContext extends QueryContext, SchemaContext {
  /**
   * The topmost frame on the schema processing stack.
   * @readonly
   * @override
   */
  stack: SchemaFrame | undefined;

  /**
   * A function to create new frames for the schema processing stack.
   * @override
   * @internal
   */
  createFrame: ((parent?: SchemaFrame) => SchemaFrame) | undefined;

  /**
   * Supported processing directives.
   */
  directives: { readonly [name: string]: Directive } | undefined;

  /**
   * Supported value transforms.
   */
  transforms: { readonly [name: string]: Transform } | undefined;

  /**
   * Supported output encodings.
   */
  encodings: { readonly [name: string]: Encoding } | undefined;
}

/**
 * Options for configuring a form context.
 *
 * @category Context
 */
export interface FormContextOptions
  extends QueryContextOptions,
    SchemaContextOptions {
  /**
   * Additional processing directives to support.
   */
  directives?:
    | readonly Directive[]
    | { readonly [name: string]: Directive }
    | undefined;

  /**
   * Additional value transforms to support.
   */
  transforms?:
    | readonly Transform[]
    | { readonly [name: string]: Transform }
    | undefined;

  /**
   * Additional output encodings to support.
   */
  encodings?:
    | readonly Encoding[]
    | { readonly [name: string]: Encoding }
    | undefined;
}

/**
 * Initializes a context for Tool Form processing.
 *
 * @category Context
 */
export function initFormContext(
  context: (QueryContext | SchemaContext) & Partial<FormContext>,
  options?: FormContextOptions,
): FormContext {
  // Minimize mixin shape variation.
  if (!("directives" in context)) {
    context.directives = undefined;
  }
  if (!("transforms" in context)) {
    context.transforms = undefined;
  }
  if (!("encodings" in context)) {
    context.encodings = undefined;
  }

  // Configure additional directives.
  if (options?.directives !== undefined) {
    if (isArray(options.directives)) {
      const directives: Record<string, Directive> = {
        ...context.directives,
      };
      for (const directive of options.directives) {
        directives[directive.name] = directive;
      }
      context.directives = directives;
    } else if (context.directives !== undefined) {
      context.directives = {
        ...context.directives,
        ...options.directives,
      };
    } else {
      context.directives = options.directives;
    }
  }

  // Configure additional transforms.
  if (options?.transforms !== undefined) {
    if (isArray(options.transforms)) {
      const transforms: Record<string, Transform> = {
        ...context.transforms,
      };
      for (const transform of options.transforms) {
        transforms[transform.name] = transform;
      }
      context.transforms = transforms;
    } else if (context.transforms !== undefined) {
      context.transforms = {
        ...context.transforms,
        ...options.transforms,
      };
    } else {
      context.transforms = options.transforms;
    }
  }

  // Configure additional encodings.
  if (options?.encodings !== undefined) {
    if (isArray(options.encodings)) {
      const encodings: Record<string, Encoding> = {
        ...context.encodings,
      };
      for (const encoding of options.encodings) {
        encodings[encoding.name] = encoding;
      }
      context.encodings = encodings;
    } else if (context.encodings !== undefined) {
      context.encodings = {
        ...context.encodings,
        ...options.encodings,
      };
    } else {
      context.encodings = options.encodings;
    }
  }

  return context as FormContext;
}

/**
 * Creates a new shared context for Tool Form processing.
 *
 * @category Context
 */
export function createFormContext(options?: FormContextOptions): FormContext {
  return initFormContext(
    initSchemaContext(createQueryContext(options), options),
    options,
  );
}

/**
 * Initializes a form context with the specified options,
 * returning `options` itself if it's already a form context.
 *
 * @category Context
 */
export function coerceFormContext(
  options?: FormContextOptions | FormContext,
): FormContext {
  if (options !== undefined && "queryScope" in options) {
    return options;
  }

  return initFormContext(
    initSchemaContext(
      initQueryContext(initContext({}, options), options),
      options,
    ),
    options,
  );
}
