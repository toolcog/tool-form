import type { Node } from "tool-json";
import { isObject } from "tool-json";
import type { FormContext, Encoding } from "tool-form";
import { encodeMultipart } from "./multipart.ts";

/**
 * A type of encoding that produces multipart output.
 */
export interface MultipartEncoding extends Encoding {
  /**
   * Generate a multipart boundary string, without dashes.
   * @internal
   */
  generateBoundary(): string;

  /**
   * Domain properties that are interpreted in multipart objects.
   * @internal
   */
  multipartProps: { readonly [key: string]: true };

  /**
   * Domain properties that are interpreted in part objects.
   * @internal
   */
  partProps: { readonly [key: string]: true };

  /**
   * Lowercase names of headers that are managed by the multipart encoding.
   * @internal
   */
  managedHeaders: { readonly [key: string]: true };
}

/**
 * An encoding that produces multipart output.
 */
export const multipartEncoding: MultipartEncoding = {
  name: "multipart",
  encode(node: Node, context: FormContext): Promise<Node | undefined> {
    if (!isObject(node)) {
      return Promise.resolve(undefined);
    }

    const boundary = this.generateBoundary();
    return Promise.resolve(encodeMultipart(node, boundary, context));
  },

  generateBoundary(): string {
    const boundaryChars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let boundary = "";
    for (let i = 0; i < 24; i += 1) {
      const randomIndex = Math.floor(Math.random() * boundaryChars.length);
      boundary += boundaryChars[randomIndex]!;
    }
    return boundary;
  },

  multipartProps: {
    $headers: true,
    $subtype: true,
  },

  partProps: {
    $content: true,
    $contentType: true,
    $disposition: true,
    $filename: true,
    $headers: true,
  },

  managedHeaders: {
    "content-type": true,
    "content-disposition": true,
  },
};
