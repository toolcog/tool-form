import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$use directive", () => {
  void test("uses its value as its output", () => {
    const template = Template.parse({ $use: [1, 2, 3] });
    assert.deepEqual(template.transform({}), [1, 2, 3]);
  });

  void test("transforms its value", () => {
    const template = Template.parse({ $use: "Hello, {{name}}!" });
    assert.deepEqual(template.transform({ name: "world" }), "Hello, world!");
  });
});
