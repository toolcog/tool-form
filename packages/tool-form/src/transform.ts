import type { Node } from "tool-json";
import type { FormContext } from "./context.ts";

/**
 * A function that transforms nodes.
 *
 * @category Transform
 */
export interface Transform {
  /**
   * The name of the transform.
   */
  readonly name: string;

  /**
   * Transforms the given node.
   */
  transform(node: Node, context: FormContext): Node | undefined;
}
