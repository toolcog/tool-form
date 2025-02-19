import type { Node } from "tool-json";
import type { FormContext, Encoding } from "tool-form";
import type { ArgsDirective } from "./directive.ts";
import { encodeArgs, flagsDirective, repeatDirective } from "./args.ts";

export interface ArgsEncoding extends Encoding {
  readonly directives: { readonly [name: string]: ArgsDirective };
}

/**
 * An encoding that produces command-line argument arrays
 */
export const argsEncoding: ArgsEncoding = {
  name: "args",
  encode(node: Node, context: FormContext): Promise<Node | undefined> {
    return Promise.resolve(encodeArgs(node, context));
  },

  directives: {
    [flagsDirective.name]: flagsDirective,
    [repeatDirective.name]: repeatDirective,
  },
};
