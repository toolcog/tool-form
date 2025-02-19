import { currentLocation } from "tool-json";
import { TransformError } from "./error.ts";
import type { FormContext } from "./context.ts";
import { evaluateSingularExpression, coerceString } from "./evaluate.ts";

/**
 * Interpolates expressions in a string template.
 *
 * @category Evaluate
 */
export function interpolateStringTemplate(
  input: string,
  context: FormContext,
): string {
  let offset = 0;
  const limit = input.length;

  let output = "";
  let start = offset;

  while (offset < limit) {
    let c = input.charCodeAt(offset);
    switch (c) {
      case 0x5c /*"\\"*/:
        output += input.slice(start, offset);
        offset += 1;
        c = offset < limit ? input.charCodeAt(offset) : -1;
        switch (c) {
          case 0x5c /*"\\"*/:
            offset += 1;
            output += "\\";
            start = offset;
            break;
          case 0x7b /*"{"*/:
            offset += 1;
            output += "{";
            start = offset;
            break;
          case 0x7d /*"}"*/:
            offset += 1;
            output += "}";
            start = offset;
            break;
          default:
            throw new TransformError(
              "Invalid escape sequence in string template",
              { location: currentLocation(context) },
            );
        }
        break;
      case 0x7b /*"{"*/: {
        if (
          offset + 1 >= limit ||
          input.charCodeAt(offset + 1) !== 0x7b /*"{"*/
        ) {
          offset += 1;
          break;
        }

        output += input.slice(start, offset);
        offset += 2;
        start = offset;

        while (true) {
          offset = input.indexOf("}", offset);
          if (offset === -1) {
            throw new TransformError(
              'Missing closing "}}" in string template',
              { location: currentLocation(context) },
            );
          }
          if (
            offset + 1 >= limit ||
            input.charCodeAt(offset + 1) !== 0x7d /*"}"*/
          ) {
            offset += 1;
            continue;
          }
          break;
        }

        const expr = input.slice(start, offset);
        offset += 2;
        start = offset;

        const result = coerceString(evaluateSingularExpression(expr, context));
        if (result !== undefined) {
          output += result;
        }
        break;
      }
      case 0x7d /*"}"*/:
        if (
          offset + 1 >= limit ||
          input.charCodeAt(offset + 1) !== 0x7d /*"}"*/
        ) {
          offset += 1;
          break;
        }
        throw new TransformError('Unexpected "}}" in string template', {
          location: currentLocation(context),
        });
      default:
        offset += 1;
    }
  }

  output += input.slice(start, offset);

  return output;
}
