import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$each directive", () => {
  void test("repeats inline array templates", () => {
    const template = Template.parse({
      $each: "$.alphabet.*",
      $as: "alpha",
      letter: { $: "alpha" },
    });
    assert.deepEqual(template.transform({ alphabet: ["a", "b", "c"] }), [
      { letter: "a" },
      { letter: "b" },
      { letter: "c" },
    ]);
  });

  void test("repeats array $value templates", () => {
    const template = Template.parse({
      $each: "$.xs.*",
      $as: "x",
      $value: { $: "x" },
    });
    assert.deepEqual(template.transform({ xs: [1, 2, 3] }), [1, 2, 3]);
  });

  void test("repeats inline object templates", () => {
    const template = Template.parse({
      $each: "$.users.*",
      $as: "user",
      $key: { $: "user.id" },
      name: { $: "user.name" },
      role: { $: "user.role" },
    });
    assert.deepEqual(
      template.transform({
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

  void test("repeats object $value templates", () => {
    const template = Template.parse({
      $each: "$.users.*",
      $as: "user",
      $key: { $: "user.id" },
      $value: { $: "user.name" },
    });
    assert.deepEqual(
      template.transform({
        users: [
          { id: "u1", name: "Alice", role: "admin" },
          { id: "u2", name: "Bob", role: "user" },
        ],
      }),
      { u1: "Alice", u2: "Bob" },
    );
  });
});
