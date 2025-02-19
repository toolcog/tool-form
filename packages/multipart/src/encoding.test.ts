import assert from "node:assert/strict";
import { afterEach, suite, test } from "node:test";
import type { Payload } from "tool-json";
import { parseTemplate } from "tool-form";
import { multipartEncoding } from "@tool-form/multipart";

void suite("multipart encoding", () => {
  let boundaryCount = 0;
  afterEach(() => {
    boundaryCount = 0;
  });

  const multipart = {
    ...multipartEncoding,
    generateBoundary(): string {
      boundaryCount += 1;
      return "boundary-" + boundaryCount;
    },
  };
  const options = { encodings: [multipart] } as const;

  void test("encodes form-data", async () => {
    const template = await parseTemplate(
      {
        $encode: "multipart",
        username: "Alice",
        age: 30,
        avatar: {
          $contentType: "image/png",
          $disposition: "form-data",
          $filename: "avatar.png",
          $content: "BASE64_DATA",
        },
      },
      options,
    );
    const result = (await template.transformNode({})) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "Content-Type": "multipart/form-data; boundary=boundary-1",
    });
    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-1\r\n" +
        "Content-Type: text/plain; charset=utf-8\r\n" +
        'Content-Disposition: form-data; name="username"\r\n' +
        "\r\n" +
        "Alice\r\n" +
        "--boundary-1\r\n" +
        "Content-Type: text/plain; charset=utf-8\r\n" +
        'Content-Disposition: form-data; name="age"\r\n' +
        "\r\n" +
        "30\r\n" +
        "--boundary-1\r\n" +
        "Content-Type: image/png\r\n" +
        'Content-Disposition: form-data; name="avatar"; filename="avatar.png"\r\n' +
        "\r\n" +
        "BASE64_DATA\r\n" +
        "--boundary-1--\r\n",
    );
  });

  void test("encodes evaluated directives", async () => {
    const template = await parseTemplate(
      {
        $encode: "multipart",
        user: {
          $contentType: "application/json",
          name: { $: "name" },
          email: { $: "email" },
        },
        settings: { $: "settings" },
      },
      options,
    );
    const result = (await template.transformNode({
      name: "John Doe",
      email: "john@example.com",
      settings: { theme: "dark" },
    })) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "Content-Type": "multipart/form-data; boundary=boundary-1",
    });
    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-1\r\n" +
        "Content-Type: application/json\r\n" +
        'Content-Disposition: form-data; name="user"\r\n' +
        "\r\n" +
        '{"name":"John Doe","email":"john@example.com"}\r\n' +
        "--boundary-1\r\n" +
        "Content-Type: application/json\r\n" +
        'Content-Disposition: form-data; name="settings"\r\n' +
        "\r\n" +
        '{"theme":"dark"}\r\n' +
        "--boundary-1--\r\n",
    );
  });

  void test("encodes nested multipart data", async () => {
    const template = await parseTemplate(
      {
        $encode: "multipart",
        $subtype: "form-data",
        profile: {
          user: "Alice",
          roles: ["admin", "editor"],
        },
        files: {
          $encode: "multipart",
          $subtype: "mixed",
          doc1: "Document content",
          doc2: {
            $contentType: "text/markdown; charset=utf-8",
            $content: "# Title\nSome text",
          },
        },
      },
      options,
    );
    const result = (await template.transformNode({})) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "Content-Type": "multipart/form-data; boundary=boundary-2",
    });
    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-2\r\n" +
        "Content-Type: application/json\r\n" +
        'Content-Disposition: form-data; name="profile"\r\n' +
        "\r\n" +
        '{"user":"Alice","roles":["admin","editor"]}\r\n' +
        "--boundary-2\r\n" +
        "Content-Type: multipart/mixed; boundary=boundary-1\r\n" +
        'Content-Disposition: form-data; name="files"\r\n' +
        "\r\n" +
        "--boundary-1\r\n" +
        "Content-Type: text/plain; charset=utf-8\r\n" +
        'Content-Disposition: form-data; name="doc1"\r\n' +
        "\r\n" +
        "Document content\r\n" +
        "--boundary-1\r\n" +
        "Content-Type: text/markdown; charset=utf-8\r\n" +
        'Content-Disposition: form-data; name="doc2"\r\n' +
        "\r\n" +
        "# Title\nSome text\r\n" +
        "--boundary-1--\r\n" +
        "--boundary-2--\r\n",
    );
  });

  void test("encodes custom headers and dispositions", async () => {
    const template = await parseTemplate(
      {
        $encode: "multipart",
        file: {
          $contentType: "application/octet-stream",
          $disposition: "attachment",
          $filename: "data.bin",
          $headers: {
            "X-Custom-Header": "custom-value",
            "Content-Language": "en-US",
          },
          $content: "binary-data",
        },
      },
      options,
    );
    const result = (await template.transformNode({})) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "Content-Type": "multipart/form-data; boundary=boundary-1",
    });
    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-1\r\n" +
        "X-Custom-Header: custom-value\r\n" +
        "Content-Language: en-US\r\n" +
        "Content-Type: application/octet-stream\r\n" +
        'Content-Disposition: attachment; name="file"; filename="data.bin"\r\n' +
        "\r\n" +
        "binary-data\r\n" +
        "--boundary-1--\r\n",
    );
  });

  void test("encodes default content types", async () => {
    const template = await parseTemplate(
      {
        $encode: "multipart",
        string: "plain text",
        number: 42,
        boolean: true,
        object: { key: "value" },
        null: null,
      },
      options,
    );
    const result = (await template.transformNode({})) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "Content-Type": "multipart/form-data; boundary=boundary-1",
    });
    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-1\r\n" +
        "Content-Type: text/plain; charset=utf-8\r\n" +
        'Content-Disposition: form-data; name="string"\r\n' +
        "\r\n" +
        "plain text\r\n" +
        "--boundary-1\r\n" +
        "Content-Type: text/plain; charset=utf-8\r\n" +
        'Content-Disposition: form-data; name="number"\r\n' +
        "\r\n" +
        "42\r\n" +
        "--boundary-1\r\n" +
        "Content-Type: text/plain; charset=utf-8\r\n" +
        'Content-Disposition: form-data; name="boolean"\r\n' +
        "\r\n" +
        "true\r\n" +
        "--boundary-1\r\n" +
        "Content-Type: application/json\r\n" +
        'Content-Disposition: form-data; name="object"\r\n' +
        "\r\n" +
        '{"key":"value"}\r\n' +
        "--boundary-1--\r\n",
    );
  });

  void test("supports explicit headers", async () => {
    const template = await parseTemplate(
      {
        $encode: "multipart",
        $headers: {
          "X-Custom": "value",
          "Content-Language": "en-US",
        },
        file: {
          $content: "test",
        },
      },
      options,
    );
    const result = (await template.transformNode({})) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "X-Custom": "value",
      "Content-Language": "en-US",
      "Content-Type": "multipart/form-data; boundary=boundary-1",
    });

    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-1\r\n" +
        "Content-Type: text/plain; charset=utf-8\r\n" +
        'Content-Disposition: form-data; name="file"\r\n' +
        "\r\n" +
        "test\r\n" +
        "--boundary-1--\r\n",
    );
  });

  void test("supports binary data", async () => {
    const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const template = await parseTemplate(
      {
        $encode: "multipart",
        data: binaryData,
      },
      options,
    );
    const result = (await template.transformNode({})) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "Content-Type": "multipart/form-data; boundary=boundary-1",
    });
    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-1\r\n" +
        "Content-Type: application/octet-stream\r\n" +
        'Content-Disposition: form-data; name="data"\r\n' +
        "\r\n" +
        new TextDecoder().decode(binaryData) +
        "\r\n" +
        "--boundary-1--\r\n",
    );
  });

  void test("supports binary data in $content", async () => {
    const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const template = await parseTemplate(
      {
        $encode: "multipart",
        data: {
          $content: binaryData,
        },
      },
      options,
    );
    const result = (await template.transformNode({})) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "Content-Type": "multipart/form-data; boundary=boundary-1",
    });
    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-1\r\n" +
        "Content-Type: application/octet-stream\r\n" +
        'Content-Disposition: form-data; name="data"\r\n' +
        "\r\n" +
        new TextDecoder().decode(binaryData) +
        "\r\n" +
        "--boundary-1--\r\n",
    );
  });

  void test("supports binary data in $content with domain properties", async () => {
    const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const template = await parseTemplate(
      {
        $encode: "multipart",
        data: {
          $contentType: "application/octet-stream",
          $filename: "test.bin",
          $content: binaryData,
        },
      },
      options,
    );
    const result = (await template.transformNode({})) as Payload<Uint8Array>;

    assert.deepEqual(result.headers, {
      "Content-Type": "multipart/form-data; boundary=boundary-1",
    });
    assert.equal(
      new TextDecoder().decode(result.value),
      "--boundary-1\r\n" +
        "Content-Type: application/octet-stream\r\n" +
        'Content-Disposition: form-data; name="data"; filename="test.bin"\r\n' +
        "\r\n" +
        new TextDecoder().decode(binaryData) +
        "\r\n" +
        "--boundary-1--\r\n",
    );
  });
});
