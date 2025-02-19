import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$ directive", () => {
  void test("substitutes singular expressions", () => {
    const template = Template.parse({ username: { $: "$.user" } });
    assert.deepEqual(template.transform({ user: "me" }), { username: "me" });
  });

  void test("substitutes expressions with implicit root identifiers", () => {
    const template = Template.parse({ username: { $: "user" } });
    assert.deepEqual(template.transform({ user: "me" }), { username: "me" });
  });

  void test("substitutes expressions with implicit first child segments", () => {
    const template = Template.parse({ username: { $: "user" } });
    assert.deepEqual(template.transform({ user: "me" }), { username: "me" });
  });
});
