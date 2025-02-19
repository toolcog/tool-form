import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$comment directive", () => {
  void test("strips $comment directives", () => {
    const template = Template.parse({
      $comment: "D'oh!",
      name: "Homer",
    });
    assert.deepEqual(template.transform({}), { name: "Homer" });
  });
});
