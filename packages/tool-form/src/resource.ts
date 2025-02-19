import type { Resource } from "tool-json";
import {
  isObject,
  currentFrame,
  createResource,
  getResource,
  setResource,
} from "tool-json";
import type { FormContext } from "./context.ts";
import { parseNode } from "./parse.ts";

/**
 * A Tool Form template resource.
 *
 * @category Resource
 */
export interface TemplateResource extends Resource {}

/**
 * Returns `true` if the given resource is a Tool Form template resource.
 *
 * @category Resource
 */
export function isTemplateResource(
  resource:
    | (Resource & {
        [K in keyof TemplateResource]?: TemplateResource[K] | undefined;
      })
    | undefined,
): resource is TemplateResource {
  return resource !== undefined;
}

/**
 * Initializes a JSON resource as a Tool Form template resource.
 *
 * @category Resource
 */
export function initTemplateResource(
  resource: Resource & Partial<TemplateResource>,
): TemplateResource {
  return resource as TemplateResource;
}

/**
 * Parses the node at the top of the stack as a Tool Form template.
 *
 * @throws TransformError if the node is not a valid template.
 * @category Resource
 * @internal
 */
export function parseTemplateResource(
  context: FormContext,
): TemplateResource | undefined {
  // Get the schema node from the top of the stack.
  const frame = currentFrame(context);
  const node = frame.node;

  // Short-circuit non-object templates.
  if (!isObject(node)) {
    return undefined;
  }

  // Get the JSON resource associated with the template node.
  let resource = getResource(context, node) as TemplateResource | undefined;
  if (isTemplateResource(resource)) {
    // The node has already been parsed as a template resource.
    return resource;
  }
  // Create and register a new JSON resource, if one doesn't already exist.
  if (resource === undefined) {
    resource = createResource(undefined, node) as TemplateResource;
    setResource(context, resource);
  }
  // Initialize the JSON resource as a template resource.
  initTemplateResource(resource);

  // Parse the template resource.
  parseNode(node, context);

  return resource;
}
