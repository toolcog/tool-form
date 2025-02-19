import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("length transform", () => {
  void test("returns the length of a string", () => {
    const template = Template.parse({
      $: "user",
      $transform: "length",
    });
    assert.deepEqual(template.transform({ user: "alice" }), 5);
  });

  void test("returns the length of an array", () => {
    const template = Template.parse({
      $: "users",
      $transform: "length",
    });
    assert.deepEqual(template.transform({ users: ["alice", "bob"] }), 2);
  });

  void test("returns the length of an object", () => {
    const template = Template.parse({
      $: "user",
      $transform: "length",
    });
    assert.deepEqual(
      template.transform({ user: { name: "alice", age: 30 } }),
      2,
    );
  });

  void test("works in pipe expressions", () => {
    assert.deepEqual(
      Template.parse("{{user | length}}").transform({ user: "alice" }),
      "5",
    );
    assert.deepEqual(
      Template.parse("{{users | length}}").transform({
        users: ["alice", "bob"],
      }),
      "2",
    );
    assert.deepEqual(
      Template.parse("{{user | length}}").transform({
        user: { name: "alice", age: 30 },
      }),
      "2",
    );
  });
});
