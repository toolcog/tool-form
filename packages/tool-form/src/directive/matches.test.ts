import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$matches directive", () => {
  void test("validates the input node against the schema", async () => {
    const template = await parseTemplate({
      $: "value",
      $matches: { type: "string" },
    });
    assert.deepEqual(await template.transform({ value: "test" }), true);
    assert.deepEqual(await template.transform({ value: 42 }), false);
  });

  void test("handles internal $refs to $defs", async () => {
    const template = await parseTemplate(
      {
        $: "user",
        $matches: {
          $defs: {
            email: {
              type: "string",
              format: "email",
            },
          },
          type: "object",
          properties: {
            name: { type: "string" },
            email: { $ref: "#/$defs/email" },
          },
          required: ["name", "email"],
        },
      },
      { validation: "strict" },
    );

    assert.deepEqual(
      await template.transform({
        user: { name: "Alice", email: "alice@example.com" },
      }),
      true,
    );
    assert.deepEqual(
      await template.transform({
        user: { name: "Bob", email: "not-an-email" },
      }),
      false,
    );
  });

  void test("validates complex nested objects", async () => {
    const template = await parseTemplate({
      $: "data",
      $matches: {
        type: "object",
        properties: {
          id: { type: "string" },
          settings: {
            type: "object",
            properties: {
              notifications: {
                type: "object",
                properties: {
                  email: { type: "boolean" },
                  push: { type: "boolean" },
                },
                required: ["email", "push"],
              },
            },
            required: ["notifications"],
          },
        },
        required: ["id", "settings"],
      },
    });

    assert.deepEqual(
      await template.transform({
        data: {
          id: "user123",
          settings: {
            notifications: {
              email: true,
              push: false,
            },
          },
        },
      }),
      true,
    );
    assert.deepEqual(
      await template.transform({
        data: {
          id: "user123",
          settings: {
            notifications: {
              email: true,
              // missing required push property
            },
          },
        },
      }),
      false,
    );
  });

  void test("works within conditional expressions", async () => {
    const template = await parseTemplate({
      $if: {
        $: "input",
        $matches: {
          type: "object",
          required: ["command"],
          properties: {
            command: { type: "string" },
            args: { type: "array", items: { type: "string" } },
          },
        },
      },
      $then: "valid",
      $else: "invalid",
    });

    assert.deepEqual(
      await template.transform({
        input: { command: "run", args: ["--debug", "--verbose"] },
      }),
      "valid",
    );
    assert.deepEqual(
      await template.transform({
        input: { args: ["--debug"] }, // missing required command
      }),
      "invalid",
    );
  });
});
