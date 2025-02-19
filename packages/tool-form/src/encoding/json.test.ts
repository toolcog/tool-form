import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Payload } from "tool-json";
import { Template } from "tool-form";

void suite("json encoding", () => {
  void test("encodes compact JSON by default", () => {
    const template = Template.parse({
      $encode: "json",
      name: { $: "user" },
    });
    assert.deepEqual(
      template.transform({ user: "alice" }),
      new Payload('{"name":"alice"}', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes compact JSON when $indent is false", () => {
    const template = Template.parse({
      $encode: "json",
      $indent: false,
      count: { $: "value" },
    });
    assert.deepEqual(
      template.transform({ value: 42 }),
      new Payload('{"count":42}', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes pretty-printed JSON when $indent is true", () => {
    const template = Template.parse({
      $encode: "json",
      $indent: true,
      active: { $: "state" },
    });
    assert.deepEqual(
      template.transform({ state: true }),
      new Payload('{\n  "active": true\n}', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes pretty-printed JSON with an integer $indent", () => {
    const template = Template.parse({
      $encode: "json",
      $indent: 4,
      id: { $: "key" },
    });
    assert.deepEqual(
      template.transform({ key: "abc123" }),
      new Payload('{\n    "id": "abc123"\n}', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes string $content", () => {
    const template = Template.parse({
      $encode: "json",
      $content: { $: "message" },
    });
    assert.deepEqual(
      template.transform({ message: "Hello, world!" }),
      new Payload('"Hello, world!"', {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes number $content", () => {
    const template = Template.parse({
      $encode: "json",
      $content: { $: "timeout" },
    });
    assert.deepEqual(
      template.transform({ timeout: 3600 }),
      new Payload("3600", {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes boolean $content", () => {
    const template = Template.parse({
      $encode: "json",
      $content: { $: "valid" },
    });
    assert.deepEqual(
      template.transform({ valid: false }),
      new Payload("false", {
        "Content-Type": "application/json",
      }),
    );
  });

  void test("encodes null $content", () => {
    const template = Template.parse({
      $encode: "json",
      $content: { $: "value" },
    });
    assert.deepEqual(
      template.transform({ value: null }),
      new Payload("null", {
        "Content-Type": "application/json",
      }),
    );
  });
});
