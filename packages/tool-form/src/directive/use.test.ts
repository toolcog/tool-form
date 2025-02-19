import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$use directive", () => {
  void test("uses its value as its output", async () => {
    const template = await parseTemplate({ $use: [1, 2, 3] });
    assert.deepEqual(await template.transform({}), [1, 2, 3]);
  });

  void test("transforms its value", async () => {
    const template = await parseTemplate({ $use: "Hello, {{name}}!" });
    assert.deepEqual(
      await template.transform({ name: "world" }),
      "Hello, world!",
    );
  });
});
