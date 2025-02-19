import assert from "node:assert/strict";
import { suite, test } from "node:test";
import type { Payload } from "tool-json";
import { Template } from "tool-form";
import { markdownEncoding } from "@tool-form/markdown";

void suite("markdown encoding", () => {
  const options = { encodings: [markdownEncoding] } as const;

  void test("encodes paragraphs", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $p: "A simple paragraph",
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.deepEqual(result.headers, {
      "Content-Type": "text/markdown",
    });
    assert.equal(result.value, "A simple paragraph");
  });

  void test("encodes block directives", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $block: [
          { $h1: "Title" },
          { $ul: ["First", "Second"] },
          { $code: "console.log()", $lang: "js" },
        ],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(
      result.value,
      "# Title\n" +
        "\n" +
        "- First\n" +
        "- Second\n" +
        "\n" +
        "```js\n" +
        "console.log()\n" +
        "```",
    );
  });

  void test("encodes inline directives", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $inline: [
          "Check out ",
          { $a: "https://example.com", text: "this link" },
          " and ",
          { $code: "some code" },
          "!",
        ],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(
      result.value,
      "Check out [this link](https://example.com) and `some code`!",
    );
  });

  void test("excludes undefined values in arrays", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $block: ["First", { $when: false, value: "Second" }, "Third"],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(result.value, "First\n\nThird");
  });

  void test("encodes $inline directives in block context", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $block: [
          "Check out this link:",
          { $a: "https://example.com", text: "Example" },
          "And some code:",
          { $inline: { $code: "console.log('hello')" } },
        ],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(
      result.value,
      "Check out this link:\n" +
        "\n" +
        "[Example](https://example.com)\n" +
        "\n" +
        "And some code:\n" +
        "\n" +
        "`console.log('hello')`",
    );
  });

  void test("encodes emphasis directives", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $inline: [
          "This is ",
          { $em: "emphasized" },
          " and this is ",
          { $strong: "important" },
          "!",
        ],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(
      result.value,
      "This is _emphasized_ and this is **important**!",
    );
  });

  void test("encodes multiline list items", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $ul: [
          "Single line",
          "First line\nSecond line",
          {
            $inline: [
              "Start of list item\n",
              { $code: "some code" },
              "\nEnd of item",
            ],
          },
        ],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(
      result.value,
      "- Single line\n" +
        "- First line\n" +
        "  Second line\n" +
        "- Start of list item\n" +
        "  `some code`\n" +
        "  End of item",
    );
  });

  void test("encodes bare nested lists", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $ul: [
          "First level",
          {
            $ul: [
              "Second level",
              "Multiple\nlines here",
              {
                $ul: ["Third level"],
              },
            ],
          },
          "Back to first",
        ],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(
      result.value,
      "- First level\n" +
        "- - Second level\n" +
        "  - Multiple\n" +
        "    lines here\n" +
        "  - - Third level\n" +
        "- Back to first",
    );
  });

  void test("encodes labeled nested lists", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $ul: [
          "First item",
          [
            "Second item",
            {
              $ul: [
                "Second level",
                [
                  "Hold my beer",
                  {
                    $ul: ["Third level"],
                  },
                ],
              ],
            },
          ],
          "Third item",
        ],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(
      result.value,
      "- First item\n" +
        "- Second item\n" +
        "  \n" +
        "  - Second level\n" +
        "  - Hold my beer\n" +
        "    \n" +
        "    - Third level\n" +
        "- Third item",
    );
  });

  void test("handles nested $encode directives", () => {
    const template = Template.parse(
      {
        $encode: "markdown",
        $block: [
          { $h2: "Example Request" },
          "Here's how to create a user:",
          {
            $code: {
              $encode: "json",
              $indent: 2,
              method: "POST",
              path: "/users",
              body: {
                name: "Alice",
                role: "admin",
              },
            },
            $lang: "json",
          },
        ],
      },
      options,
    );
    const result = template.transform({}) as Payload<string>;

    assert.equal(
      result.value,
      "## Example Request\n" +
        "\n" +
        "Here's how to create a user:\n" +
        "\n" +
        "```json\n" +
        "{\n" +
        '  "method": "POST",\n' +
        '  "path": "/users",\n' +
        '  "body": {\n' +
        '    "name": "Alice",\n' +
        '    "role": "admin"\n' +
        "  }\n" +
        "}\n" +
        "```",
    );
  });
});
