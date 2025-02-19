import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("last transform", () => {
  void test("returns the last element of an array", () => {
    const template = Template.parse({
      $: "users",
      $transform: "last",
    });
    assert.deepEqual(template.transform({ users: ["alice", "bob"] }), "bob");
  });
});
