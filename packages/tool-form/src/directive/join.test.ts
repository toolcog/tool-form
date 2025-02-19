import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$join directive", () => {
  void test("joins arrays of strings", async () => {
    const template = await parseTemplate({ $: "array", $join: true });
    assert.deepEqual(
      await template.transform({ array: ["a", "b", "c"] }),
      "abc",
    );
  });

  void test("joins arrays of strings with a separator", async () => {
    const template = await parseTemplate({ $: "array", $join: " " });
    assert.deepEqual(
      await template.transform({ array: ["a", "b", "c"] }),
      "a b c",
    );
  });

  void test("joins objects with string values", async () => {
    const template = await parseTemplate({ $: "object", $join: true });
    assert.deepEqual(
      await template.transform({ object: { a: "b", c: "d" } }),
      "bd",
    );
  });

  void test("joins objects with string values and a separator", async () => {
    const template = await parseTemplate({ $: "object", $join: " " });
    assert.deepEqual(
      await template.transform({ object: { a: "b", c: "d" } }),
      "b d",
    );
  });

  void test("joins $use values", async () => {
    const template = await parseTemplate({
      $use: ["a", "b", "c"],
      $join: true,
    });
    assert.deepEqual(await template.transform({}), "abc");
  });
});
