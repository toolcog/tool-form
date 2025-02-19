import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$spread directive", () => {
  void test("spreads arrays into arrays", () => {
    const template = Template.parse([1, 2, { $spread: "$.value" }, 5, 6]);
    assert.deepEqual(template.transform({ value: [3, 4] }), [1, 2, 3, 4, 5, 6]);
  });

  void test("spreads objects into objects", () => {
    const template = Template.parse({ a: 1, s: { $spread: "$.value" }, d: 4 });
    assert.deepEqual(template.transform({ value: { b: 2, c: 3 } }), {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  void test("spreads arrays into objects", () => {
    const template = Template.parse({ a: 1, s: { $spread: "$.value" }, b: 4 });
    assert.deepEqual(template.transform({ value: [2, 3] }), {
      a: 1,
      0: 2,
      1: 3,
      b: 4,
    });
  });

  void test("spreads objects into arrays", () => {
    const template = Template.parse([1, 2, { $spread: "$.value" }, 5, 6]);
    assert.deepEqual(
      template.transform({ value: { a: 3, b: 4 } }),
      [1, 2, 3, 4, 5, 6],
    );
  });
});
