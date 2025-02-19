import type { Node } from "tool-json";
import { isObject, getChild, Payload, currentLocation } from "tool-json";
import type { FormContext } from "tool-form";
import { TransformError } from "tool-form";
import type { MultipartEncoding } from "./encoding.ts";

/** @internal */
export function encodePart(
  id: string,
  node: Node,
  boundary: string,
  context: FormContext,
): Uint8Array | undefined {
  if (node === undefined || node === null) {
    return undefined;
  }

  const payload = encodeContent(id, node, context);
  const headers = formatPartHeaders(payload.headers, context);
  const headerPart = new TextEncoder().encode(
    "--" + boundary + "\r\n" + headers + "\r\n",
  );
  const trailerPart = new TextEncoder().encode(
    payload.headers["Content-Type"]?.startsWith("multipart/") === true ?
      ""
    : "\r\n",
  );

  const data = new Uint8Array(
    headerPart.length + payload.value.length + trailerPart.length,
  );
  data.set(headerPart, 0);
  data.set(payload.value, headerPart.length);
  data.set(trailerPart, headerPart.length + payload.value.length);
  return data;
}

/** @internal */
export function encodeContent(
  id: string,
  node: unknown,
  context: FormContext,
): Payload<Uint8Array> {
  const encoding = context.encodings!.multipart as MultipartEncoding;

  const headers: Record<string, string> = {};
  let data: Uint8Array;

  // Extract $contentType domain property.
  let contentType = getChild(node, "$contentType") as string | undefined;
  if (typeof contentType !== "string") {
    contentType = undefined;
  }

  // Unwrap $content domain property.
  let content = getChild(node, "$content");
  if (content === undefined) {
    content = node;
  }

  // Unwrap payload, collecting its headers.
  if (content instanceof Payload) {
    for (const [key, value] of Object.entries(content.headers)) {
      if (contentType === undefined && key === "Content-Type") {
        contentType = value;
      }
      headers[key] = value;
    }
    content = content.value;
  }

  // Encode content.
  if (content === undefined || content === null) {
    if (contentType === undefined) {
      contentType = "application/octet-stream";
    }
    data = new Uint8Array(0);
  } else if (!isObject(content)) {
    if (contentType === undefined) {
      contentType = "text/plain; charset=utf-8";
    }
    data = new TextEncoder().encode(String(content));
  } else if (ArrayBuffer.isView(content)) {
    if (contentType === undefined) {
      contentType = "application/octet-stream";
    }
    data = new Uint8Array(
      content.buffer,
      content.byteOffset,
      content.byteLength,
    );
  } else {
    // Filter out domain properties.
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(content)) {
      if (key in encoding.partProps) {
        continue;
      }
      filtered[key] = val;
    }

    if (contentType === undefined) {
      contentType = "application/json";
    }
    data = new TextEncoder().encode(JSON.stringify(filtered));
  }

  // Collect explicit headers.
  const explicitHeaders = getChild(node, "$headers");
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

  headers["Content-Type"] = contentType;

  headers["Content-Disposition"] = getContentDisposition(id, node);

  return new Payload(data, headers);
}

/**
 * Format the headers as an RFC 822 fields block.
 * @internal
 */
export function formatPartHeaders(
  headers: { readonly [name: string]: string },
  context: FormContext,
): string {
  let output = "";
  for (const [name, value] of Object.entries(headers)) {
    // Disallow control characters (0x00-0x1F, 0x7F) except HTAB (0x09),
    // and explicitly check for CR/LF to prevent continuation lines.
    if (/[\x00-\x08\x0A-\x1F\x7F\r\n]/.test(value)) {
      throw new TransformError(
        "Invalid character in header value: " + JSON.stringify(value),
        { location: currentLocation(context) },
      );
    }
    output += name + ": " + value + "\r\n";
  }
  return output;
}

/** @internal */
function getContentDisposition(id: string, node: unknown): string {
  let disposition = getChild(node, "$disposition") as string | undefined;
  if (typeof disposition !== "string") {
    disposition = "form-data";
  }

  disposition += '; name="' + id.replace(/["\\]/g, "\\$&") + '"';

  const filename = getChild(node, "$filename") as string | undefined;
  if (typeof filename === "string") {
    disposition += '; filename="' + filename.replace(/["\\]/g, "\\$&") + '"';
  }

  return disposition;
}
