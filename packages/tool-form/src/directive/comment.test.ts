import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$comment directive", () => {
  void test("strips $comment directives", async () => {
    const template = await parseTemplate({
      $comment: "D'oh!",
      name: "Homer",
    });
    assert.deepEqual(await template.transform({}), { name: "Homer" });
  });
});
