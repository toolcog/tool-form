import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$meta directive", () => {
  void test("strips $meta directives", () => {
    const template = Template.parse({
      $meta: { slug: "getting-started" },
      title: "Getting Started",
    });
    assert.deepEqual(template.transform({}), { title: "Getting Started" });
  });
});
