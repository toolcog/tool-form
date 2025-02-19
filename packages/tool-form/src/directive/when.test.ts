import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Template } from "tool-form";

void suite("$when directive", () => {
  void test("includes the object when $when evaluates to true", () => {
    const template = Template.parse({
      $when: "$.authorized == true",
      score: 10,
    });
    assert.deepEqual(template.transform({ authorized: true }), { score: 10 });
  });

  void test("excludes the object when $when evaluates to false", () => {
    const template = Template.parse({
      $when: "$.authorized == true",
      score: 10,
    });
    assert.deepEqual(template.transform({ authorized: false }), undefined);
  });

  void test("includes the object when $when transforms to true", () => {
    const template = Template.parse({ score: 10 });
    assert.deepEqual(template.transform({}), { score: 10 });
  });

  void test("excludes the object when $when transforms to false", () => {
    const template = Template.parse({ $when: false, score: 10 });
    assert.deepEqual(template.transform({}), undefined);
  });
});
