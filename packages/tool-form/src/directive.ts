import type { Node, Fragment } from "tool-json";
import { currentLocation } from "tool-json";
import { TransformError } from "./error.ts";
import type { FormContext } from "./context.ts";

/**
 * An object that contains Directive Properties.
 *
 * @category Directive
 */
export type DirectiveObject = { readonly [key: string]: unknown };

/**
 * A processing rule that can be applied to a node.
 *
 * @category Directive
 */
export type Directive = ModifierDirective | DomainDirective | OperatorDirective;

/**
 * A directive that modifies the transformation context.
 *
 * @category Directive
 */
export interface ModifierDirective {
  /**
   * The kind of directive.
   */
  readonly type: "modifier";

  /**
   * The name of the directive property.
   */
  readonly name: string;

  /**
   * Parses a node that contains this directive.
   */
  parse(node: DirectiveObject, context: FormContext): void;

  /**
   * Modifies the context in which the node will be transformed.
   */
  modify(node: DirectiveObject, context: FormContext): Promise<void>;
}

/**
 * Tool Form modifier directive mixin.
 *
 * @category Directive
 * @internal
 */
export const ModifierDirective = {
  prototype: {
    type: "modifier",
    name: undefined,
    parse(node: DirectiveObject, context: FormContext): void {
      // nop
    },
    modify(node: DirectiveObject, context: FormContext): Promise<void> {
      return Promise.resolve();
    },
  },
} as const;

/**
 * A directive that transforms nodes.
 *
 * @category Directive
 */
export interface DomainDirective {
  /**
   * The kind of directive.
   */
  readonly type: "domain";

  /**
   * The name of the directive property.
   */
  readonly name: string;

  /**
   * Parses a node that contains this directive.
   */
  parse(node: DirectiveObject, context: FormContext): void;

  /**
   * Transforms the node.
   */
  transform(
    node: DirectiveObject,
    context: FormContext,
  ): Promise<Fragment | Node | undefined>;
}

/**
 * Tool Form domain directive mixin.
 *
 * @category Directive
 * @internal
 */
export const DomainDirective = {
  prototype: {
    type: "domain",
    name: undefined,
    parse(node: DirectiveObject, context: FormContext): void {
      // nop
    },
    transform: undefined,
  },
} as const;

/**
 * A directive that operates on transformed nodes.
 *
 * @category Directive
 */
export interface OperatorDirective {
  /**
   * The kind of directive.
   */
  readonly type: "operator";

  /**
   * The name of the directive property.
   */
  readonly name: string;

  /**
   * Parses a node that contains this directive.
   */
  parse(argument: Node, context: FormContext): void;

  /**
   * Renders the transformed node.
   */
  operate(
    argument: Node,
    node: Node,
    context: FormContext,
  ): Promise<Fragment | Node | undefined>;
}

/**
 * Tool Form operator directive mixin.
 *
 * @category Directive
 * @internal
 */
export const OperatorDirective = {
  prototype: {
    type: "operator",
    name: undefined,
    parse(argument: Node, context: FormContext): void {
      // nop
    },
    operate: undefined,
  },
} as const;

/**
 * The set of directives declared by a Directive Object.
 *
 * @category Context
 * @internal
 */
export interface DirectiveSet {
  /**
   * The Modifier Directives declared by the Directive Object.
   */
  readonly modifiers:
    | { readonly [name: string]: ModifierDirective }
    | undefined;

  /**
   * The Domain Directive declared by the Directive Object.
   */
  readonly domain: DomainDirective | undefined;

  /**
   * The Operator Directives and corresponding values declared by
   * the Directive Object.
   */
  readonly operators:
    | { readonly [name: string]: [OperatorDirective, Node | undefined] }
    | undefined;
}

/**
 * Returns the set of directive properties defined on the given node.
 *
 * @throws TransformError if ambiguous directive combinations are detected.
 * @category Directive
 */
export function detectDirectives(
  node: DirectiveObject,
  context: FormContext,
): DirectiveSet {
  let modifiers: Record<string, ModifierDirective> | undefined;
  let domain: DomainDirective | undefined;
  let operators:
    | Record<string, [OperatorDirective, Node | undefined]>
    | undefined;

  for (const directive of Object.values(context.directives ?? {})) {
    const value = node[directive.name];
    if (value === undefined) {
      continue;
    }

    if (directive.type === "modifier") {
      modifiers ??= {};
      modifiers[directive.name] = directive;
    } else if (directive.type === "domain") {
      if (domain !== undefined) {
        throw new TransformError("Ambiguous domain directive", {
          location: currentLocation(context),
        });
      }
      domain = directive;
    } else if (directive.type === "operator") {
      operators ??= {};
      operators[directive.name] = [directive, value];
    }
  }

  return { modifiers, domain, operators };
}
