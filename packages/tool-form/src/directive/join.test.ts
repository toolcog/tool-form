import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$join directive", () => {
  void test("joins arrays of strings", () => {
    const template = Template.parse({ $: "array", $join: true });
    assert.deepEqual(template.transform({ array: ["a", "b", "c"] }), "abc");
  });

  void test("joins arrays of strings with a separator", () => {
    const template = Template.parse({ $: "array", $join: " " });
    assert.deepEqual(template.transform({ array: ["a", "b", "c"] }), "a b c");
  });

  void test("joins objects with string values", () => {
    const template = Template.parse({ $: "object", $join: true });
    assert.deepEqual(template.transform({ object: { a: "b", c: "d" } }), "bd");
  });

  void test("joins objects with string values and a separator", () => {
    const template = Template.parse({ $: "object", $join: " " });
    assert.deepEqual(template.transform({ object: { a: "b", c: "d" } }), "b d");
  });

  void test("joins $use values", () => {
    const template = Template.parse({ $use: ["a", "b", "c"], $join: true });
    assert.deepEqual(template.transform({}), "abc");
  });
});
