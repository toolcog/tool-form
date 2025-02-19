import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("sort transform", () => {
  void test("orders values by type", async () => {
    const template = await parseTemplate({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      await template.transform({
        values: ["string", 42, null, [1, 2], { x: 1 }, true, undefined],
      }),
      [undefined, null, true, 42, "string", [1, 2], { x: 1 }],
    );
  });

  void test("orders numbers by IEEE-754 total order", async () => {
    const template = await parseTemplate({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      await template.transform({
        values: [42, -Infinity, NaN, 0, -0, Infinity, -42],
      }),
      [-Infinity, -42, -0, 0, 42, Infinity, NaN],
    );
  });

  void test("orders strings by code points", async () => {
    const template = await parseTemplate({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      await template.transform({
        values: ["b", "B", "a", "A", "1", "世界"],
      }),
      ["1", "A", "B", "a", "b", "世界"],
    );
  });

  void test("orders arrays lexicographically", async () => {
    const template = await parseTemplate({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      await template.transform({
        values: [[1, 2], [1], [1, 1], [2]],
      }),
      [[1], [1, 1], [1, 2], [2]],
    );
  });

  void test("orders objects by properties", async () => {
    const template = await parseTemplate({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      await template.transform({
        values: [{ x: 2 }, { x: 1, y: 1 }, { x: 1 }, {}],
      }),
      [{}, { x: 1 }, { x: 1, y: 1 }, { x: 2 }],
    );
  });

  void test("sorts object properties lexicographically", async () => {
    const template = await parseTemplate({
      $: "obj",
      $transform: "sort",
    });
    assert.deepEqual(
      await template.transform({
        obj: {
          z: 1,
          a: 2,
          y: 1,
        },
      }),
      {
        a: 2,
        y: 1,
        z: 1,
      },
    );
  });

  void test("works in pipe expressions", async () => {
    const template = await parseTemplate("{{values | sort}}");
    assert.equal(
      await template.transform({
        values: ["z", "a", "y"],
      }),
      '["a","y","z"]',
    );
  });

  void test("returns undefined for non-array/object inputs", async () => {
    const template = await parseTemplate({
      $transform: "sort",
      $: "value",
    });
    assert.equal(await template.transform({ value: 42 }), undefined);
  });
});
