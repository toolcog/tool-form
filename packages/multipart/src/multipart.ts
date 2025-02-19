import type { Node } from "tool-json";
import { isObject, Payload } from "tool-json";
import type { FormContext } from "tool-form";
import { encodePart } from "./part.ts";
import type { MultipartEncoding } from "./encoding.ts";

/** @internal */
export function encodeMultipart(
  node: { readonly [key: string]: Node },
  boundary: string,
  context: FormContext,
): Payload<Uint8Array> {
  const encoding = context.encodings!.multipart as MultipartEncoding;

  const headers: Record<string, string> = {};
  let data: Uint8Array;

  // Encode each part and compute the total length.
  const parts: Uint8Array[] = [];
  let length = 0;
  for (const [key, value] of Object.entries(node)) {
    if (key in encoding.multipartProps) {
      continue;
    }
    const part = encodePart(key, value, boundary, context);
    if (part === undefined) {
      continue;
    }
    parts.push(part);
    length += part.length;
  }

  // Add the length of the last boundary.
  const lastBoundary = new TextEncoder().encode("--" + boundary + "--\r\n");
  length += lastBoundary.length;

  // Allocate the buffer and write the encoded parts.
  data = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    data.set(part, offset);
    offset += part.length;
  }
  // Write the last boundary to the buffer.
  data.set(lastBoundary, offset);

  // Collect explicit headers.
  const explicitHeaders = node.$headers;
  if (isObject(explicitHeaders)) {
    for (const [name, value] of Object.entries(explicitHeaders)) {
      if (typeof value !== "string") {
        continue;
      }
      // Filter out managed headers.
      if (encoding.managedHeaders[name.toLowerCase()]) {
        continue;
      }
      headers[name] = value;
    }
  }

  headers["Content-Type"] = getMultipartType(node, boundary);

  return new Payload(data, headers);
}

/** @internal */
function getMultipartType(
  node: { readonly [key: string]: Node },
  boundary: string,
): string {
  let subtype = node.$subtype;
  if (subtype === undefined || typeof subtype !== "string") {
    subtype = "form-data";
  }
  return "multipart/" + subtype + "; boundary=" + boundary;
}
