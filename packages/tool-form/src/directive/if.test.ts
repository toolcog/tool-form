import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$if directive", () => {
  void test("transforms $then when $if evaluates to true", () => {
    const template = Template.parse({
      $if: "$.x == true",
      $then: "a",
      $else: "b",
    });
    assert.deepEqual(template.transform({ x: true }), "a");
  });

  void test("transforms $else when $if evaluates to false", () => {
    const template = Template.parse({
      $if: "$.x == true",
      $then: "a",
      $else: "b",
    });
    assert.deepEqual(template.transform({ x: false }), "b");
  });

  void test("transforms $then when $if transforms to true", () => {
    const template = Template.parse({ $if: true, $then: "a", $else: "b" });
    assert.deepEqual(template.transform({}), "a");
  });

  void test("transforms $else when $if transforms to false", () => {
    const template = Template.parse({ $if: false, $then: "a", $else: "b" });
    assert.deepEqual(template.transform({}), "b");
  });

  void test("transforms $else when $if transforms to undefined", () => {
    const template = Template.parse({ $if: "$.x", $then: "a", $else: "b" });
    assert.deepEqual(template.transform({}), "b");
  });
});
