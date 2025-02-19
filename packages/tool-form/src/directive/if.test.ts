import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$if directive", () => {
  void test("transforms $then when $if evaluates to true", async () => {
    const template = await parseTemplate({
      $if: "$.x == true",
      $then: "a",
      $else: "b",
    });
    assert.deepEqual(await template.transform({ x: true }), "a");
  });

  void test("transforms $else when $if evaluates to false", async () => {
    const template = await parseTemplate({
      $if: "$.x == true",
      $then: "a",
      $else: "b",
    });
    assert.deepEqual(await template.transform({ x: false }), "b");
  });

  void test("transforms $then when $if transforms to true", async () => {
    const template = await parseTemplate({ $if: true, $then: "a", $else: "b" });
    assert.deepEqual(await template.transform({}), "a");
  });

  void test("transforms $else when $if transforms to false", async () => {
    const template = await parseTemplate({
      $if: false,
      $then: "a",
      $else: "b",
    });
    assert.deepEqual(await template.transform({}), "b");
  });

  void test("transforms $else when $if transforms to undefined", async () => {
    const template = await parseTemplate({
      $if: "$.x",
      $then: "a",
      $else: "b",
    });
    assert.deepEqual(await template.transform({}), "b");
  });
});
