import type { Node } from "tool-json";
import { Payload } from "tool-json";
import type { FormContext, Encoding } from "tool-form";
import type { MarkdownDirective } from "./directive.ts";
import {
  encodeInline,
  encodeInlineArray,
  encodeInlineObject,
  inlineDirective,
  aDirective,
  imgDirective,
  codeDirective,
  emDirective,
  strongDirective,
} from "./inline.ts";
import {
  encodeBlock,
  encodeBlockArray,
  encodeBlockObject,
  blockDirective,
  headingDirective,
  pDirective,
  ulDirective,
  olDirective,
  blockquoteDirective,
  codeBlockDirective,
  hrDirective,
} from "./block.ts";

/**
 * A type of encoding that produces Markdown strings.
 */
export interface MarkdownEncoding extends Encoding {
  readonly encodeInline: (
    node: Node | undefined,
    context: FormContext,
  ) => string | undefined;

  readonly encodeInlineArray: (
    nodes: readonly Node[],
    context: FormContext,
  ) => string;

  readonly encodeInlineObject: (
    node: { readonly [key: string]: Node },
    context: FormContext,
  ) => string | undefined;

  readonly inlineDirectives: { readonly [name: string]: MarkdownDirective };

  readonly encodeBlock: (
    node: Node | undefined,
    context: FormContext,
  ) => string | undefined;

  readonly encodeBlockArray: (
    nodes: readonly Node[],
    context: FormContext,
  ) => string;

  readonly encodeBlockObject: (
    node: { readonly [key: string]: Node },
    context: FormContext,
  ) => string | undefined;

  readonly blockDirectives: { readonly [name: string]: MarkdownDirective };
}

/**
 * An encoding that produces Markdown strings.
 */
export const markdownEncoding: MarkdownEncoding = {
  name: "markdown",
  async encode(node: Node, context: FormContext): Promise<Node | undefined> {
    const value = this.encodeBlock(node, context);
    if (value === undefined) {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(
      new Payload(value, { "Content-Type": "text/markdown" }),
    );
  },

  encodeInline,
  encodeInlineArray,
  encodeInlineObject,
  inlineDirectives: {
    $a: aDirective,
    $img: imgDirective,
    $code: codeDirective,
    $em: emDirective,
    $strong: strongDirective,
    $inline: inlineDirective,
    $block: blockDirective,
  },

  encodeBlock,
  encodeBlockArray,
  encodeBlockObject,
  blockDirectives: {
    $h1: headingDirective(1),
    $h2: headingDirective(2),
    $h3: headingDirective(3),
    $h4: headingDirective(4),
    $h5: headingDirective(5),
    $h6: headingDirective(6),
    $p: pDirective,
    $ul: ulDirective,
    $ol: olDirective,
    $blockquote: blockquoteDirective,
    $code: codeBlockDirective,
    $hr: hrDirective,
    $block: blockDirective,
    $inline: inlineDirective,
  },
};
