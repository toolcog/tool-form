import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { createResource } from "tool-json";
import { createFormContext, parseTemplate } from "tool-form";

void suite("$include directive", () => {
  void test("incorporates URI references", async () => {
    const context = createFormContext({
      resources: [
        createResource("https://example.com/user.json", {
          name: "Alice",
        }),
      ],
    });
    const template = await parseTemplate(
      { profile: { $include: "https://example.com/user.json" } },
      context,
    );
    assert.deepEqual(await template.transform({}), {
      profile: { name: "Alice" },
    });
  });
});
