import type { Node } from "tool-json";
import { isArray, isObject, currentLocation } from "tool-json";
import type { FormContext, DirectiveObject } from "tool-form";
import { TransformError } from "tool-form";
import type { ArgsDirective } from "./directive.ts";
import { detectArgsDirective } from "./directive.ts";
import type { ArgsEncoding } from "./encoding.ts";

/** @internal */
export function encodeArgs(
  node: Node,
  context: FormContext,
  args: string[] = [],
): string[] {
  if (node === undefined || node === null || node === false) {
    // Skip
  } else if (node === true) {
    args.push("true");
  } else if (typeof node === "number") {
    args.push(node.toString());
  } else if (typeof node === "string") {
    args.push(node);
  } else if (isArray(node)) {
    args = encodeArgArray(node, context, args);
  } else if (isObject(node)) {
    args = encodeArgsDirective(node, context, args);
  }
  return args;
}

/** @internal */
export function encodeArgArray(
  node: readonly Node[],
  context: FormContext,
  args: string[],
): string[] {
  for (const item of node) {
    args = encodeArgs(item, context, args);
  }
  return args;
}

/** @internal */
export function encodeArgObject(
  node: DirectiveObject,
  context: FormContext,
  args: string[],
): string[] {
  for (const [key, value] of Object.entries(node)) {
    if (value === undefined) {
      continue;
    }

    if (key === "$args") {
      args.push(
        ...encodeArgs(value, context).map((arg) => validateArg(arg, context)),
      );
      continue;
    }

    if (key.startsWith("-") || key.startsWith("+")) {
      // Validate flag name format.
      if (!/^[-+][-A-Za-z0-9][-A-Za-z0-9_]*(=)?$/.test(key)) {
        throw new TransformError("Invalid flag name: " + JSON.stringify(key), {
          location: currentLocation(context),
        });
      }

      // Handle single-char flags with `true` value.
      if (key.length === 2 && key[1] !== "-" && value === true) {
        args.push(key);
        continue;
      }

      // Handle flags with `=` suffix.
      if (key.endsWith("=")) {
        const values = encodeArgs(value, context);
        if (values.length > 0) {
          args.push(key + joinFlagValues(values));
        }
        continue;
      }

      // Regular flags: emit flag followed by values.
      args.push(key);
      if (value !== true) {
        args = encodeArgs(value, context, args);
      }
      continue;
    }

    // Validate subcommand and positional argument names.
    if (!/^[A-Za-z0-9][-A-Za-z0-9_]*$/.test(key)) {
      throw new TransformError(
        "Invalid subcommand/argument name: " + JSON.stringify(key),
        { location: currentLocation(context) },
      );
    }

    // Emit the name.
    args.push(key);

    // Process the value.
    args = encodeArgs(value, context, args);
  }

  return args;
}

/** @internal */
export function encodeArgsDirective(
  node: DirectiveObject,
  context: FormContext,
  args: string[],
): string[] {
  const encoding = context.encodings!.args as ArgsEncoding;
  const directive = detectArgsDirective(node, context, encoding.directives);
  if (directive !== undefined) {
    args = directive.encode(node, context, args);
  } else {
    args = encodeArgObject(node, context, args);
  }
  return args;
}

/** @internal */
export const flagsDirective = {
  name: "$flags",
  encode(
    node: DirectiveObject,
    context: FormContext,
    args: string[],
  ): string[] {
    if (!isObject(node.$flags)) {
      return args;
    }

    const start = args.length;
    const shorthand: string[] = [];

    for (const [key, value] of Object.entries(node.$flags)) {
      if (value === undefined) {
        continue;
      }

      if (key.startsWith("-") || key.startsWith("+")) {
        // Validate flag name format.
        if (!/^[-+][-A-Za-z0-9][-A-Za-z0-9_]*(=)?$/.test(key)) {
          throw new TransformError(
            "Invalid flag name: " + JSON.stringify(key),
            { location: currentLocation(context) },
          );
        }

        // Single-char flags with `true` values get combined.
        if (key.length === 2 && key[1] !== "-" && value === true) {
          shorthand.push(key[1]!);
          continue;
        }

        // Handle flags with `=` suffix.
        if (key.endsWith("=")) {
          const values = encodeArgs(value, context);
          if (values.length > 0) {
            args.push(key + joinFlagValues(values));
          }
          continue;
        }

        // Regular flags: emit flag followed by values.
        args.push(key);
        if (value !== true) {
          args = encodeArgs(value, context, args);
        }
        continue;
      }

      // Non-flag keys are treated as subcommands.
      if (!/^[A-Za-z0-9][-A-Za-z0-9_]*$/.test(key)) {
        throw new TransformError(
          "Invalid subcommand/argument name: " + JSON.stringify(key),
          { location: currentLocation(context) },
        );
      }

      args.push(key);
      args = encodeArgs(value, context, args);
    }

    // Add combined shorthand flags at start of what we just added.
    if (shorthand.length > 0) {
      args.splice(start, 0, "-" + shorthand.join(""));
    }

    // Handle $args if present.
    if (node.$args !== undefined) {
      args = encodeArgs(node.$args, context, args);
    }

    return args;
  },
} as const satisfies ArgsDirective;

/** @internal */
export const repeatDirective = {
  name: "$repeat",
  encode(
    node: DirectiveObject,
    context: FormContext,
    args: string[],
  ): string[] {
    if (!isObject(node.$repeat)) {
      return args;
    }

    for (const [key, value] of Object.entries(node.$repeat)) {
      if (value === undefined) {
        continue;
      }

      // Validate flag name format.
      if (!/^[-+][-A-Za-z0-9][-A-Za-z0-9_]*(=)?$/.test(key)) {
        throw new TransformError("Invalid flag name: " + JSON.stringify(key), {
          location: currentLocation(context),
        });
      }

      // Handle single-char flags with `true` value.
      if (key.length === 2 && key[1] !== "-" && value === true) {
        args.push(key);
        continue;
      }

      // Handle arrays by repeating the flag.
      if (isArray(value)) {
        if (key.endsWith("=")) {
          // For = suffix flags, repeat flag before each value.
          for (const item of value) {
            const values = encodeArgs(item, context);
            if (values.length > 0) {
              args.push(key + joinFlagValues(values));
            }
          }
        } else {
          // For regular flags, all values follow a single flag.
          args.push(key);
          args = encodeArgs(value, context, args);
        }
        continue;
      }

      // Handle non-arrays like regular flags.
      if (key.endsWith("=")) {
        const values = encodeArgs(value, context);
        if (values.length > 0) {
          args.push(key + joinFlagValues(values));
        }
      } else {
        args.push(key);
        if (value !== true) {
          args = encodeArgs(value, context, args);
        }
      }
    }

    // Handle $args, if present.
    if (node.$args !== undefined) {
      args = encodeArgs(node.$args, context, args);
    }

    return args;
  },
} as const satisfies ArgsDirective;

/** @internal */
export function joinFlagValues(values: string[]): string {
  return values.map((value) => value.replace(/[\\,"]/g, "\\$&")).join(",");
}

/** @internal */
export function validateArg(node: string, context: FormContext): string {
  if (!/^[A-Za-z0-9][-A-Za-z0-9._]*$/.test(node)) {
    throw new TransformError("Invalid argument: " + JSON.stringify(node), {
      location: currentLocation(context),
    });
  }
  return node;
}
