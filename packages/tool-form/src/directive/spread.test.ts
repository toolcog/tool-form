import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$spread directive", () => {
  void test("spreads arrays into arrays", async () => {
    const template = await parseTemplate([1, 2, { $spread: "$.value" }, 5, 6]);
    assert.deepEqual(
      await template.transform({ value: [3, 4] }),
      [1, 2, 3, 4, 5, 6],
    );
  });

  void test("spreads objects into objects", async () => {
    const template = await parseTemplate({
      a: 1,
      s: { $spread: "$.value" },
      d: 4,
    });
    assert.deepEqual(await template.transform({ value: { b: 2, c: 3 } }), {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  void test("spreads arrays into objects", async () => {
    const template = await parseTemplate({
      a: 1,
      s: { $spread: "$.value" },
      b: 4,
    });
    assert.deepEqual(await template.transform({ value: [2, 3] }), {
      a: 1,
      0: 2,
      1: 3,
      b: 4,
    });
  });

  void test("spreads objects into arrays", async () => {
    const template = await parseTemplate([1, 2, { $spread: "$.value" }, 5, 6]);
    assert.deepEqual(
      await template.transform({ value: { a: 3, b: 4 } }),
      [1, 2, 3, 4, 5, 6],
    );
  });
});
