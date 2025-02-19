import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$each directive", () => {
  void test("repeats inline array templates", async () => {
    const template = await parseTemplate({
      $each: "$.alphabet.*",
      $as: "alpha",
      letter: { $: "alpha" },
    });
    assert.deepEqual(await template.transform({ alphabet: ["a", "b", "c"] }), [
      { letter: "a" },
      { letter: "b" },
      { letter: "c" },
    ]);
  });

  void test("repeats array $value templates", async () => {
    const template = await parseTemplate({
      $each: "$.xs.*",
      $as: "x",
      $value: { $: "x" },
    });
    assert.deepEqual(await template.transform({ xs: [1, 2, 3] }), [1, 2, 3]);
  });

  void test("repeats inline object templates", async () => {
    const template = await parseTemplate({
      $each: "$.users.*",
      $as: "user",
      $key: { $: "user.id" },
      name: { $: "user.name" },
      role: { $: "user.role" },
    });
    assert.deepEqual(
      await template.transform({
        users: [
          { id: "u1", name: "Alice", role: "admin" },
          { id: "u2", name: "Bob", role: "user" },
        ],
      }),
      {
        u1: { name: "Alice", role: "admin" },
        u2: { name: "Bob", role: "user" },
      },
    );
  });

  void test("repeats object $value templates", async () => {
    const template = await parseTemplate({
      $each: "$.users.*",
      $as: "user",
      $key: { $: "user.id" },
      $value: { $: "user.name" },
    });
    assert.deepEqual(
      await template.transform({
        users: [
          { id: "u1", name: "Alice", role: "admin" },
          { id: "u2", name: "Bob", role: "user" },
        ],
      }),
      { u1: "Alice", u2: "Bob" },
    );
  });
});
