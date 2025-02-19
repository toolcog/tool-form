import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$ directive", () => {
  void test("substitutes singular expressions", async () => {
    const template = await parseTemplate({ username: { $: "$.user" } });
    assert.deepEqual(await template.transform({ user: "me" }), {
      username: "me",
    });
  });

  void test("substitutes expressions with implicit root identifiers", async () => {
    const template = await parseTemplate({ username: { $: "user" } });
    assert.deepEqual(await template.transform({ user: "me" }), {
      username: "me",
    });
  });

  void test("substitutes expressions with implicit first child segments", async () => {
    const template = await parseTemplate({ username: { $: "user" } });
    assert.deepEqual(await template.transform({ user: "me" }), {
      username: "me",
    });
  });
});
