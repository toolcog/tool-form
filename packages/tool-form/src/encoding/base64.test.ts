import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Payload } from "tool-json";
import { Template } from "tool-form";

void suite("base64 encoding", () => {
  void test("encodes strings", () => {
    const template = Template.parse({
      $encode: "base64",
      $: "greeting",
    });
    assert.deepEqual(
      template.transform({ greeting: "Hello, world!" }),
      new Payload("SGVsbG8sIHdvcmxkIQ==", {
        "Content-Type": "application/base64",
      }),
    );
  });

  void test("encodes JSON objects", () => {
    const template = Template.parse({
      $encode: "base64",
      username: { $: "user" },
      password: { $: "token" },
    });
    assert.deepEqual(
      template.transform({ user: "admin", token: "secret" }),
      new Payload("eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJzZWNyZXQifQ==", {
        "Content-Type": "application/base64",
      }),
    );
  });

  void test("encodes string $content", () => {
    const template = Template.parse({
      $encode: "base64",
      $content: { $: "token" },
    });
    assert.deepEqual(
      template.transform({ token: "secret" }),
      new Payload("c2VjcmV0", {
        "Content-Type": "application/base64",
      }),
    );
  });
});
