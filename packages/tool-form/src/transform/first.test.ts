import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("first transform", () => {
  void test("returns the first element of an array", () => {
    const template = Template.parse({
      $: "users",
      $transform: "first",
    });
    assert.deepEqual(template.transform({ users: ["alice", "bob"] }), "alice");
  });
});
