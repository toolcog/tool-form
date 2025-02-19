import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseTemplate } from "tool-form";

void suite("$when directive", () => {
  void test("includes the object when $when evaluates to true", async () => {
    const template = await parseTemplate({
      $when: "$.authorized == true",
      score: 10,
    });
    assert.deepEqual(await template.transform({ authorized: true }), {
      score: 10,
    });
  });

  void test("excludes the object when $when evaluates to false", async () => {
    const template = await parseTemplate({
      $when: "$.authorized == true",
      score: 10,
    });
    assert.deepEqual(
      await template.transform({ authorized: false }),
      undefined,
    );
  });

  void test("includes the object when $when transforms to true", async () => {
    const template = await parseTemplate({ score: 10 });
    assert.deepEqual(await template.transform({}), { score: 10 });
  });

  void test("excludes the object when $when transforms to false", async () => {
    const template = await parseTemplate({ $when: false, score: 10 });
    assert.deepEqual(await template.transform({}), undefined);
  });
});
