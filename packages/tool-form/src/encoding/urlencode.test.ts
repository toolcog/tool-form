import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Payload } from "tool-json";
import { Template } from "tool-form";

void suite("urlencoded encoding", () => {
  void test("encodes strings", () => {
    const template = Template.parse({
      $encode: "urlencoded",
      $: "message",
    });
    assert.deepEqual(
      template.transform({ message: "Don't panic! 🚀" }),
      new Payload("Don%27t+panic%21+%F0%9F%9A%80", {
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    );
  });

  void test("encodes flat objects", () => {
    const template = Template.parse({
      $encode: "urlencoded",
      drink: { $: "beverage" },
      answer: "42",
    });
    assert.deepEqual(
      template.transform({ beverage: "Pan Galactic Gargle Blaster" }),
      new Payload("drink=Pan+Galactic+Gargle+Blaster&answer=42", {
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    );
  });

  void test("encodes nested objects", () => {
    const template = Template.parse({
      $encode: "urlencoded",
      guide: {
        item: { $: "essential" },
        warning: "DON'T FORGET IT",
      },
    });
    assert.deepEqual(
      template.transform({ essential: "towel" }),
      new Payload("guide.item=towel&guide.warning=DON%27T+FORGET+IT", {
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    );
  });

  void test("encodes flat arrays", () => {
    const template = Template.parse({
      $encode: "urlencoded",
      $content: { $: "crew" },
    });
    assert.deepEqual(
      template.transform({ crew: ["Arthur", "Ford", "Trillian"] }),
      new Payload("0=Arthur&1=Ford&2=Trillian", {
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    );
  });

  void test("encodes nested arrays", () => {
    const template = Template.parse({
      $encode: "urlencoded",
      $content: { $: "probabilities" },
    });
    assert.deepEqual(
      template.transform({
        probabilities: [
          [42, 13.5],
          [7.5, 9],
        ],
      }),
      new Payload("0.0=42&0.1=13.5&1.0=7.5&1.1=9", {
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    );
  });
});
