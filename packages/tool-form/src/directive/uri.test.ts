import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$uri directive", () => {
  void test("expands URI templates", async () => {
    const template = await parseTemplate({
      href: { $uri: "http://example.com{/path*}" },
    });
    assert.deepEqual(
      await template.transform({ path: ["one", "two", "three"] }),
      { href: "http://example.com/one/two/three" },
    );
  });

  void test("expands URI templates with $variables", async () => {
    const template = await parseTemplate({
      href: {
        $uri: "http://example.com{/path*}{?query*}",
        path: "$.segments",
        query: "$.params",
      },
    });
    assert.deepEqual(
      await template.transform({
        segments: ["one", "two", "three"],
        params: { a: "1", b: "2" },
      }),
      { href: "http://example.com/one/two/three?a=1&b=2" },
    );
  });
});
