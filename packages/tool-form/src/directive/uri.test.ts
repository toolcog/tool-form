import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$uri directive", () => {
  void test("expands URI templates", () => {
    const template = Template.parse({
      href: { $uri: "http://example.com{/path*}" },
    });
    assert.deepEqual(template.transform({ path: ["one", "two", "three"] }), {
      href: "http://example.com/one/two/three",
    });
  });

  void test("expands URI templates with $variables", () => {
    const template = Template.parse({
      href: {
        $uri: "http://example.com{/path*}{?query*}",
        path: "$.segments",
        query: "$.params",
      },
    });
    assert.deepEqual(
      template.transform({
        segments: ["one", "two", "three"],
        params: { a: "1", b: "2" },
      }),
      { href: "http://example.com/one/two/three?a=1&b=2" },
    );
  });
});
