import type { Node } from "tool-json";
import type { FormContext } from "./context.ts";

/**
 * An output encoding that serializes nodes.
 *
 * @category Encoding
 */
export interface Encoding {
  /**
   * The name of the encoding.
   */
  readonly name: string;

  /**
   * Encodes the given node.
   */
  encode(node: Node, context: FormContext): Promise<Node | undefined>;
}
