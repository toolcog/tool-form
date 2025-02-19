import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("sort transform", () => {
  void test("orders values by type", () => {
    const template = Template.parse({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      template.transform({
        values: ["string", 42, null, [1, 2], { x: 1 }, true, undefined],
      }),
      [undefined, null, true, 42, "string", [1, 2], { x: 1 }],
    );
  });

  void test("orders numbers by IEEE-754 total order", () => {
    const template = Template.parse({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      template.transform({
        values: [42, -Infinity, NaN, 0, -0, Infinity, -42],
      }),
      [-Infinity, -42, -0, 0, 42, Infinity, NaN],
    );
  });

  void test("orders strings by code points", () => {
    const template = Template.parse({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      template.transform({
        values: ["b", "B", "a", "A", "1", "世界"],
      }),
      ["1", "A", "B", "a", "b", "世界"],
    );
  });

  void test("orders arrays lexicographically", () => {
    const template = Template.parse({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      template.transform({
        values: [[1, 2], [1], [1, 1], [2]],
      }),
      [[1], [1, 1], [1, 2], [2]],
    );
  });

  void test("orders objects by properties", () => {
    const template = Template.parse({
      $: "values",
      $transform: "sort",
    });
    assert.deepEqual(
      template.transform({
        values: [{ x: 2 }, { x: 1, y: 1 }, { x: 1 }, {}],
      }),
      [{}, { x: 1 }, { x: 1, y: 1 }, { x: 2 }],
    );
  });

  void test("sorts object properties lexicographically", () => {
    const template = Template.parse({
      $: "obj",
      $transform: "sort",
    });
    assert.deepEqual(
      template.transform({
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

  void test("works in pipe expressions", () => {
    const template = Template.parse("{{values | sort}}");
    assert.equal(
      template.transform({
        values: ["z", "a", "y"],
      }),
      '["a","y","z"]',
    );
  });

  void test("returns undefined for non-array/object inputs", () => {
    const template = Template.parse({
      $transform: "sort",
      $: "value",
    });
    assert.equal(template.transform({ value: 42 }), undefined);
  });
});
