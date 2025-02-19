import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("length transform", () => {
  void test("returns the length of a string", async () => {
    const template = await parseTemplate({
      $: "user",
      $transform: "length",
    });
    assert.deepEqual(await template.transform({ user: "alice" }), 5);
  });

  void test("returns the length of an array", async () => {
    const template = await parseTemplate({
      $: "users",
      $transform: "length",
    });
    assert.deepEqual(await template.transform({ users: ["alice", "bob"] }), 2);
  });

  void test("returns the length of an object", async () => {
    const template = await parseTemplate({
      $: "user",
      $transform: "length",
    });
    assert.deepEqual(
      await template.transform({ user: { name: "alice", age: 30 } }),
      2,
    );
  });

  void test("works in pipe expressions", async () => {
    assert.deepEqual(
      await (
        await parseTemplate("{{user | length}}")
      ).transform({
        user: "alice",
      }),
      "5",
    );
    assert.deepEqual(
      await (
        await parseTemplate("{{users | length}}")
      ).transform({
        users: ["alice", "bob"],
      }),
      "2",
    );
    assert.deepEqual(
      await (
        await parseTemplate("{{user | length}}")
      ).transform({
        user: { name: "alice", age: 30 },
      }),
      "2",
    );
  });
});
