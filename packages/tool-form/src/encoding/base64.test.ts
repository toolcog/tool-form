import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Payload } from "tool-json";
import { parseTemplate } from "tool-form";

void suite("base64 encoding", () => {
  void test("encodes strings", async () => {
    const template = await parseTemplate({
      $encode: "base64",
      $: "greeting",
    });
    assert.deepEqual(
      await template.transformNode({ greeting: "Hello, world!" }),
      new Payload("SGVsbG8sIHdvcmxkIQ==", {
        "Content-Type": "application/base64",
      }),
    );
  });

  void test("encodes JSON objects", async () => {
    const template = await parseTemplate({
      $encode: "base64",
      username: { $: "user" },
      password: { $: "token" },
    });
    assert.deepEqual(
      await template.transformNode({ user: "admin", token: "secret" }),
      new Payload("eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJzZWNyZXQifQ==", {
        "Content-Type": "application/base64",
      }),
    );
  });

  void test("encodes string $content", async () => {
    const template = await parseTemplate({
      $encode: "base64",
      $content: { $: "token" },
    });
    assert.deepEqual(
      await template.transformNode({ token: "secret" }),
      new Payload("c2VjcmV0", {
        "Content-Type": "application/base64",
      }),
    );
  });
});
