import assert from "node:assert/strict";
import { suite, test } from "node:test";
import {
  TransformError,
  createFormContext,
  interpolateStringTemplate,
} from "tool-form";

void suite("interpolation", () => {
  void test("preserves literal text", () => {
    assert.equal(
      interpolateStringTemplate("Just some text", createFormContext()),
      "Just some text",
    );
  });

  void test("preserves whitespace", () => {
    assert.equal(
      interpolateStringTemplate(
        "  spaced  {{$.value}}  text  ",
        createFormContext({ queryArgument: { value: "middle" } }),
      ),
      "  spaced  middle  text  ",
    );
  });

  void test("interpolates singular expressions", () => {
    assert.equal(
      interpolateStringTemplate(
        "Hello, {{$.name}}!",
        createFormContext({ queryArgument: { name: "world" } }),
      ),
      "Hello, world!",
    );
  });

  void test("interpolates expressions with implicit root identifiers", () => {
    assert.equal(
      interpolateStringTemplate(
        "Hello, {{.name}}!",
        createFormContext({ queryArgument: { name: "world" } }),
      ),
      "Hello, world!",
    );
  });

  void test("interpolates expressions with implicit first child segments", () => {
    assert.equal(
      interpolateStringTemplate(
        "Hello, {{name}}!",
        createFormContext({ queryArgument: { name: "world" } }),
      ),
      "Hello, world!",
    );
  });

  void test("interpolates object paths", () => {
    assert.equal(
      interpolateStringTemplate(
        "{{$.user.name}}",
        createFormContext({ queryArgument: { user: { name: "Alice" } } }),
      ),
      "Alice",
    );
  });

  void test("interpolates array paths", () => {
    assert.equal(
      interpolateStringTemplate(
        "{{$.items[0]}}",
        createFormContext({ queryArgument: { items: ["first", "second"] } }),
      ),
      "first",
    );
  });

  void test("interpolates filter expressions", () => {
    assert.equal(
      interpolateStringTemplate(
        "Value: {{$[?@.x == 1].y}}",
        createFormContext({
          queryArgument: [
            { x: 1, y: "found" },
            { x: 2, y: "wrong" },
          ],
        }),
      ),
      'Value: ["found"]',
    );
  });

  void test("interpolates filter expressions matching nothing", () => {
    assert.equal(
      interpolateStringTemplate(
        "Value: {{$[?@.x == 3].y}}",
        createFormContext({
          queryArgument: [
            { x: 1, y: "wrong" },
            { x: 2, y: "also wrong" },
          ],
        }),
      ),
      "Value: []",
    );
  });

  void test("interpolates empty node lists as empty strings", () => {
    assert.equal(
      interpolateStringTemplate(
        "Value: {{$.does.not.exist}}",
        createFormContext(),
      ),
      "Value: ",
    );
  });

  void test("interpolates undefined values as empty strings", () => {
    assert.equal(
      interpolateStringTemplate(
        "Hello{{$.title}} {{$.name}}!",
        createFormContext({
          queryArgument: { name: "Alice", title: undefined },
        }),
      ),
      "Hello Alice!",
    );
  });

  void test("interpolates stringified null values", () => {
    assert.equal(
      interpolateStringTemplate(
        "Value: {{$.missing}}",
        createFormContext({ queryArgument: { missing: null } }),
      ),
      "Value: null",
    );
  });

  void test("interpolates stringified boolean values", () => {
    assert.equal(
      interpolateStringTemplate(
        "Active: {{$.enabled}}",
        createFormContext({ queryArgument: { enabled: true } }),
      ),
      "Active: true",
    );
  });

  void test("interpolates stringified number values", () => {
    assert.equal(
      interpolateStringTemplate(
        "Value: {{$.number}}",
        createFormContext({ queryArgument: { number: 42 } }),
      ),
      "Value: 42",
    );
  });

  void test("interpolates JSON stringified array values", () => {
    assert.equal(
      interpolateStringTemplate(
        "Items: {{$.list}}",
        createFormContext({ queryArgument: { list: [1, 2, 3] } }),
      ),
      "Items: [1,2,3]",
    );
  });

  void test("interpolates JSON stringified object values", () => {
    assert.equal(
      interpolateStringTemplate(
        "Data: {{$.config}}",
        createFormContext({ queryArgument: { config: { a: 1, b: 2 } } }),
      ),
      'Data: {"a":1,"b":2}',
    );
  });

  void test("interpolates multiple expressions", () => {
    assert.equal(
      interpolateStringTemplate(
        "{{$.first}} and {{$.second}}",
        createFormContext({ queryArgument: { first: "one", second: "two" } }),
      ),
      "one and two",
    );
  });

  void test("interpolates adjacent expressions", () => {
    assert.equal(
      interpolateStringTemplate(
        "{{$.a}}{{$.b}}{{$.c}}",
        createFormContext({ queryArgument: { a: "1", b: "2", c: "3" } }),
      ),
      "123",
    );
  });

  void test("preserves escaped braces", () => {
    assert.equal(
      interpolateStringTemplate(
        "\\{{not interpolated\\}}",
        createFormContext(),
      ),
      "{{not interpolated}}",
    );
  });

  void test("preserves escaped backslashes", () => {
    assert.equal(
      interpolateStringTemplate(
        "C:\\\\Users\\\\{{$.name}}",
        createFormContext({ queryArgument: { name: "Alice" } }),
      ),
      "C:\\Users\\Alice",
    );
  });

  void test("mixes escapes and interpolation", () => {
    assert.equal(
      interpolateStringTemplate(
        "{{$.name}}'s \\{{escaped\\}} template",
        createFormContext({ queryArgument: { name: "Alice" } }),
      ),
      "Alice's {{escaped}} template",
    );
  });

  void test("rejects invalid escape sequences", () => {
    assert.throws(() => {
      interpolateStringTemplate("\\invalid", createFormContext());
    }, TransformError);
  });

  void test("rejects unmatched closing braces", () => {
    assert.throws(() => {
      interpolateStringTemplate("text}}", createFormContext());
    }, TransformError);
    assert.throws(() => {
      interpolateStringTemplate("text}} ", createFormContext());
    }, TransformError);
  });

  void test("rejects unclosed opening braces", () => {
    assert.throws(() => {
      interpolateStringTemplate("text{{$.value", createFormContext());
    }, TransformError);
    assert.throws(() => {
      interpolateStringTemplate("text{{$.value ", createFormContext());
    }, TransformError);
  });
});
