import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Payload } from "tool-json";
import { parseTemplate } from "tool-form";

void suite("json encoding", () => {
  void test("encodes compact JSON by default", async () => {
    const template = await parseTemplate({
      $encode: "json",
      name: { $: "user" },
    });
    assert.deepEqual(
      await template.transformNode({ user: "alice" }),
      new Payload('{"name":"alice"}', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes compact JSON when $indent is false", async () => {
    const template = await parseTemplate({
      $encode: "json",
      $indent: false,
      count: { $: "value" },
    });
    assert.deepEqual(
      await template.transformNode({ value: 42 }),
      new Payload('{"count":42}', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes pretty-printed JSON when $indent is true", async () => {
    const template = await parseTemplate({
      $encode: "json",
      $indent: true,
      active: { $: "state" },
    });
    assert.deepEqual(
      await template.transformNode({ state: true }),
      new Payload('{\n  "active": true\n}', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes pretty-printed JSON with an integer $indent", async () => {
    const template = await parseTemplate({
      $encode: "json",
      $indent: 4,
      id: { $: "key" },
    });
    assert.deepEqual(
      await template.transformNode({ key: "abc123" }),
      new Payload('{\n    "id": "abc123"\n}', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes string $content", async () => {
    const template = await parseTemplate({
      $encode: "json",
      $content: { $: "message" },
    });
    assert.deepEqual(
      await template.transformNode({ message: "Hello, world!" }),
      new Payload('"Hello, world!"', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes number $content", async () => {
    const template = await parseTemplate({
      $encode: "json",
      $content: { $: "timeout" },
    });
    assert.deepEqual(
      await template.transformNode({ timeout: 3600 }),
      new Payload("3600", {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes boolean $content", async () => {
    const template = await parseTemplate({
      $encode: "json",
      $content: { $: "valid" },
    });
    assert.deepEqual(
      await template.transformNode({ valid: false }),
      new Payload("false", {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes null $content", async () => {
    const template = await parseTemplate({
      $encode: "json",
      $content: { $: "value" },
    });
    assert.deepEqual(
      await template.transformNode({ value: null }),
      new Payload("null", {
        "Content-Type": "application/json",
      }),
    );
  });
});
