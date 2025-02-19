import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$match directive", () => {
  void test("matches the input node against each branch", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: [
        {
          $case: { required: ["error"] },
          $then: { status: "error", message: { $: "error.message" } },
        },
        {
          $case: { required: ["data"] },
          status: "success",
          result: { $: "data.value" },
        },
        { status: "unknown" },
      ],
    });
    assert.deepEqual(
      await template.transform({ error: { message: "Not found" } }),
      { status: "error", message: "Not found" },
    );
    assert.deepEqual(await template.transform({ data: { value: 42 } }), {
      status: "success",
      result: 42,
    });
    assert.deepEqual(await template.transform({}), { status: "unknown" });
  });

  void test("produces undefined for non-array directive values", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: "not an array",
    });
    assert.deepEqual(await template.transform({}), undefined);
  });

  void test("produces undefined for empty branch arrays", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: [],
    });
    assert.deepEqual(
      await template.transform({ data: { value: 42 } }),
      undefined,
    );
  });

  void test("validates input against schema in $case property", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: [
        {
          $case: { type: "string" },
          $then: { type: "string" },
        },
      ],
    });

    assert.deepEqual(await template.transform("hello"), { type: "string" });
    assert.deepEqual(await template.transform(42), undefined);
  });

  void test("transforms branches without explicit $then", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: [
        {
          $case: { type: "number" },
          type: "number",
          value: { $: "$" },
        },
      ],
    });

    assert.deepEqual(await template.transform(42), {
      type: "number",
      value: 42,
    });
    assert.deepEqual(await template.transform("hello"), undefined);
  });

  void test("falls through to default branch without $case", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: [
        {
          $case: { type: "string" },
          $then: { matched: true },
        },
        {
          default: true,
        },
      ],
    });

    assert.deepEqual(await template.transform("hello"), { matched: true });
    assert.deepEqual(await template.transform(42), { default: true });
  });

  void test("selects first matching branch", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: [
        {
          $case: { type: "object" },
          $then: "first",
        },
        {
          $case: { required: ["id"] },
          $then: "second",
        },
      ],
    });

    assert.deepEqual(await template.transform({ id: 123 }), "first");
  });

  void test("evaluates branches in order", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: [
        {
          $case: { required: ["a"] },
          $then: "a",
        },
        {
          $case: { required: ["b"] },
          $then: "b",
        },
        {
          $case: { required: ["c"] },
          $then: "c",
        },
      ],
    });

    assert.deepEqual(await template.transform({ a: 1, b: 2, c: 3 }), "a");
    assert.deepEqual(await template.transform({ b: 2, c: 3 }), "b");
    assert.deepEqual(await template.transform({ c: 3 }), "c");
    assert.deepEqual(await template.transform({ d: 4 }), undefined);
  });

  void test("produces undefined when no branches match", async () => {
    const template = await parseTemplate({
      $: "$",
      $match: [
        {
          $case: { required: ["a"] },
          $then: "a",
        },
        {
          $case: { required: ["b"] },
          $then: "b",
        },
      ],
    });

    assert.deepEqual(await template.transform({ c: 3 }), undefined);
  });
});
