import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { createResource } from "tool-json";
import { createFormContext, Template } from "tool-form";

void suite("$include directive", () => {
  void test("incorporates URI references", () => {
    const context = createFormContext({
      resources: [
        createResource("https://example.com/user.json", {
          name: "Alice",
        }),
      ],
    });
    const template = Template.parse(
      { profile: { $include: "https://example.com/user.json" } },
      context,
    );
    assert.deepEqual(template.transform({}), { profile: { name: "Alice" } });
  });
});
