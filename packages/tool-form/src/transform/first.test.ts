import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("first transform", () => {
  void test("returns the first element of an array", async () => {
    const template = await parseTemplate({
      $: "users",
      $transform: "first",
    });
    assert.deepEqual(
      await template.transform({ users: ["alice", "bob"] }),
      "alice",
    );
  });
});
