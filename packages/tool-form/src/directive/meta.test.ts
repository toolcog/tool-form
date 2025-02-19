import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$meta directive", () => {
  void test("strips $meta directives", async () => {
    const template = await parseTemplate({
      $meta: { slug: "getting-started" },
      title: "Getting Started",
    });
    assert.deepEqual(await template.transform({}), {
      title: "Getting Started",
    });
  });
});
