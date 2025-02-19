import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { sort } from "tool-json";
import { compareNodes } from "tool-form";

void suite("total order", () => {
  void test("orders by type", () => {
    const values = ["string", 42, null, [1, 2], { x: 1 }, true, undefined];
    const sorted = sort(values, compareNodes);
    assert.deepEqual(sorted, [
      undefined,
      null,
      true,
      42,
      "string",
      [1, 2],
      { x: 1 },
    ]);
  });

  void test("undefined values are equal", () => {
    assert.equal(compareNodes(undefined, undefined), 0);
  });

  void test("null values are equal", () => {
    assert.equal(compareNodes(null, null), 0);
  });

  void test("orders booleans", () => {
    assert.equal(compareNodes(false, true), -1);
    assert.equal(compareNodes(true, false), 1);
    assert.equal(compareNodes(true, true), 0);
    assert.equal(compareNodes(false, false), 0);
  });

  void test("orders numbers by IEEE-754 total order", () => {
    const values = [42, -Infinity, NaN, 0, -0, Infinity, -42];
    const sorted = sort(values, compareNodes);
    assert.deepEqual(sorted, [-Infinity, -42, -0, 0, 42, Infinity, NaN]);
  });

  void test("orders strings by code points", () => {
    const values = ["b", "B", "a", "A", "1", "世界"];
    const sorted = sort(values, compareNodes);
    assert.deepEqual(sorted, ["1", "A", "B", "a", "b", "世界"]);
  });

  void test("orders arrays lexicographically", () => {
    const values = [[1, 2], [1], [1, 1], [2]];
    const sorted = sort(values, compareNodes);
    assert.deepEqual(sorted, [[1], [1, 1], [1, 2], [2]]);
  });

  void test("shorter arrays come before longer with same prefix", () => {
    assert.equal(compareNodes([1, 2], [1, 2, 3]), -1);
    assert.equal(compareNodes([1, 2, 3], [1, 2]), 1);
    assert.equal(compareNodes([1, 2], [1, 2]), 0);
  });

  void test("orders objects by properties", () => {
    const values = [{ x: 2 }, { x: 1, y: 1 }, { x: 1 }, {}];
    const sorted = sort(values, compareNodes);
    assert.deepEqual(sorted, [{}, { x: 1 }, { x: 1, y: 1 }, { x: 2 }]);
  });

  void test("orders object properties lexicographically", () => {
    const a = { z: 1, a: 2, y: 1 };
    const b = { a: 2, y: 1, z: 1 };
    assert.equal(compareNodes(a, b), 0);
  });

  void test("objects with fewer properties come first", () => {
    assert.equal(compareNodes({ x: 1 }, { x: 1, y: 2 }), -1);
    assert.equal(compareNodes({ x: 1, y: 2 }, { x: 1 }), 1);
    assert.equal(compareNodes({ x: 1 }, { x: 1 }), 0);
  });

  void test("handles recursive structures", () => {
    const a = { x: [1, { y: 2 }] };
    const b = { x: [1, { y: 3 }] };
    assert.equal(compareNodes(a, b), -1);
    assert.equal(compareNodes(b, a), 1);
    assert.equal(compareNodes(a, a), 0);
  });
});
