import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { TransformError, parseTemplate } from "tool-form";
import { argsEncoding } from "@tool-form/args";

void suite("args encoding", () => {
  const options = { encodings: [argsEncoding] } as const;

  void suite("value encoding", () => {
    void test("skips undefined values", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: undefined },
        options,
      );
      assert.deepEqual(await template.transform({}), []);
    });

    void test("skips null values", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: null },
        options,
      );
      assert.deepEqual(await template.transform({}), []);
    });

    void test("skips false values", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: false },
        options,
      );
      assert.deepEqual(await template.transform({}), []);
    });

    void test("encodes true as string", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: true },
        options,
      );
      assert.deepEqual(await template.transform({}), ["true"]);
    });

    void test("encodes numbers as strings", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: 42 },
        options,
      );
      assert.deepEqual(await template.transform({}), ["42"]);
    });

    void test("validates string arguments", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: "test123" },
        options,
      );
      assert.deepEqual(await template.transform({}), ["test123"]);
    });

    void test("rejects strings starting with dash", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: "-bad" },
        options,
      );
      await assert.rejects(
        async () => await template.transform({}),
        TransformError,
      );
    });

    void test("rejects strings with spaces", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: "bad value" },
        options,
      );
      await assert.rejects(
        async () => await template.transform({}),
        TransformError,
      );
    });

    void test("flattens arrays", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: ["one", "two", "three"] },
        options,
      );
      assert.deepEqual(await template.transform({}), ["one", "two", "three"]);
    });

    void test("flattens nested arrays", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: ["one", ["two", "three"], "four"] },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "one",
        "two",
        "three",
        "four",
      ]);
    });
  });

  void suite("string validation", () => {
    void test("allows alphanumeric", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: "abc123" },
        options,
      );
      assert.deepEqual(await template.transform({}), ["abc123"]);
    });

    void test("allows dots", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: "file.txt" },
        options,
      );
      assert.deepEqual(await template.transform({}), ["file.txt"]);
    });

    void test("allows underscores", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: "my_file" },
        options,
      );
      assert.deepEqual(await template.transform({}), ["my_file"]);
    });

    void test("rejects leading dot", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: ".hidden" },
        options,
      );
      await assert.rejects(
        async () => await template.transform({}),
        TransformError,
      );
    });

    void test("rejects leading dash", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: "-flag" },
        options,
      );
      await assert.rejects(
        async () => await template.transform({}),
        TransformError,
      );
    });

    void test("rejects spaces", async () => {
      const template = await parseTemplate(
        { $encode: "args", $args: "hello world" },
        options,
      );
      await assert.rejects(
        async () => await template.transform({}),
        TransformError,
      );
    });

    void test("rejects shell metacharacters", async () => {
      for (const c of ["|", "&", ";", "$", "`", "(", ")", "<", ">"]) {
        const template = await parseTemplate(
          { $encode: "args", $args: "test" + c },
          options,
        );
        await assert.rejects(
          async () => await template.transform({}),
          TransformError,
        );
      }
    });
  });

  void suite("object encoding", () => {
    void test("encodes subcommands", async () => {
      const template = await parseTemplate(
        { $encode: "args", git: { commit: null } },
        options,
      );
      assert.deepEqual(await template.transform({}), ["git", "commit"]);
    });

    void test("encodes single-char flags", async () => {
      const template = await parseTemplate(
        { $encode: "args", "-f": true },
        options,
      );
      assert.deepEqual(await template.transform({}), ["-f"]);
    });

    void test("encodes long flags", async () => {
      const template = await parseTemplate(
        { $encode: "args", "--flag": "value" },
        options,
      );
      assert.deepEqual(await template.transform({}), ["--flag", "value"]);
    });

    void test("encodes flags with = suffix", async () => {
      const template = await parseTemplate(
        { $encode: "args", "--flag=": "value" },
        options,
      );
      assert.deepEqual(await template.transform({}), ["--flag=value"]);
    });

    void test("encodes flags with multiple values", async () => {
      const template = await parseTemplate(
        { $encode: "args", "--flag": ["one", "two"] },
        options,
      );
      assert.deepEqual(await template.transform({}), ["--flag", "one", "two"]);
    });

    void test("encodes flags with = suffix and multiple values", async () => {
      const template = await parseTemplate(
        { $encode: "args", "--flag=": ["one", "two"] },
        options,
      );
      assert.deepEqual(await template.transform({}), ["--flag=one,two"]);
    });

    void test("escapes commas in = suffix values", async () => {
      const template = await parseTemplate(
        { $encode: "args", "--flag=": "value,with,commas" },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "--flag=value\\,with\\,commas",
      ]);
    });

    void test("combines subcommands and flags", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          git: {
            commit: {
              "-m": "Initial commit",
              "--amend": true,
            },
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "git",
        "commit",
        "-m",
        "Initial commit",
        "--amend",
      ]);
    });

    void test("appends $args after other arguments", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          git: {
            commit: {
              "-m": "Initial commit",
              $args: ["file1.txt", "file2.txt"],
            },
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "git",
        "commit",
        "-m",
        "Initial commit",
        "file1.txt",
        "file2.txt",
      ]);
    });
  });

  void suite("$flags directive", () => {
    void test("combines shorthand flags", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "-a": true,
            "-b": true,
            "-v": true,
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), ["-abv"]);
    });

    void test("handles long flags", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "--flag": "value",
            "--other": "stuff",
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "--flag",
        "value",
        "--other",
        "stuff",
      ]);
    });

    void test("handles = suffix flags", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "--flag=": "value",
            "--other=": "stuff",
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "--flag=value",
        "--other=stuff",
      ]);
    });

    void test("joins multiple values with commas for = suffix", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "--define=": ["DEBUG=1", "VERSION=2"],
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "--define=DEBUG=1,VERSION=2",
      ]);
    });

    void test("escapes commas in = suffix values", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "--label=": ["app=myapp", "env=prod,debug"],
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "--label=app=myapp,env=prod\\,debug",
      ]);
    });

    void test("puts shorthand flags before long flags", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "--verbose": "debug",
            "-a": true,
            "-b": true,
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "-ab",
        "--verbose",
        "debug",
      ]);
    });

    void test("treats non-flag keys as subcommands", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "-f": true,
            subcommand: {
              "--flag": "value",
            },
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "-f",
        "subcommand",
        "--flag",
        "value",
      ]);
    });

    void test("appends $args after flags", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "--flag": "value",
          },
          $args: ["file1.txt", "file2.txt"],
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "--flag",
        "value",
        "file1.txt",
        "file2.txt",
      ]);
    });

    void test("validates flag names", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $flags: {
            "bad name": true,
          },
        },
        options,
      );
      await assert.rejects(
        async () => await template.transform({}),
        TransformError,
      );
    });
  });

  void suite("$repeat directive", () => {
    void test("appends all values after single flag", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $repeat: {
            "-I": ["include1", "include2"],
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "-I",
        "include1",
        "include2",
      ]);
    });

    void test("repeats flag for each value with = suffix", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $repeat: {
            "--define=": ["DEBUG=1", "VERSION=2"],
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "--define=DEBUG=1",
        "--define=VERSION=2",
      ]);
    });

    void test("handles non-array values like regular flags", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $repeat: {
            "-I": "include1",
            "--define=": "DEBUG=1",
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "-I",
        "include1",
        "--define=DEBUG=1",
      ]);
    });

    void test("handles true values", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $repeat: {
            "-v": true,
            "--verbose=": true,
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), ["-v", "--verbose=true"]);
    });

    void test("validates flag names", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $repeat: {
            "bad-flag": ["value"],
          },
        },
        options,
      );
      await assert.rejects(
        async () => await template.transform({}),
        TransformError,
      );
    });

    void test("appends all values after single flag with $args", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $repeat: {
            "-I": ["include1", "include2"],
          },
          $args: ["file1.txt", "file2.txt"],
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "-I",
        "include1",
        "include2",
        "file1.txt",
        "file2.txt",
      ]);
    });

    void test("escapes commas in = suffix values", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          $repeat: {
            "--label=": ["app=my,app", "env=prod,debug"],
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "--label=app=my\\,app",
        "--label=env=prod\\,debug",
      ]);
    });
  });

  void suite("complex compositions", () => {
    void test("combines subcommands with directives", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          docker: {
            run: {
              $flags: {
                "-i": true,
                "-t": true,
                "--name=": "test-container",
                "--label=": ["app=myapp", "env=prod"],
              },
              $args: ["ubuntu", "bash"],
            },
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "docker",
        "run",
        "-it",
        "--name=test-container",
        "--label=app=myapp,env=prod",
        "ubuntu",
        "bash",
      ]);
    });

    void test("mixes $flags and $repeat in subcommands", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          gcc: [
            {
              $flags: {
                "-O": "2",
                "--std=": "c++17",
              },
            },
            {
              $repeat: {
                "-I": ["include1", "include2"],
                "--define=": ["DEBUG=1", "VERSION=2"],
              },
            },
            ["main.cpp"],
          ],
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "gcc",
        "-O",
        "2",
        "--std=c++17",
        "-I",
        "include1",
        "include2",
        "--define=DEBUG=1",
        "--define=VERSION=2",
        "main.cpp",
      ]);
    });

    void test("nests subcommands with repeated flags", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          git: {
            submodule: {
              foreach: {
                git: {
                  pull: [
                    {
                      $flags: {
                        "--ff": "only",
                      },
                    },
                    {
                      $repeat: {
                        "--recurse-submodules=": ["on-demand", "yes"],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "git",
        "submodule",
        "foreach",
        "git",
        "pull",
        "--ff",
        "only",
        "--recurse-submodules=on-demand",
        "--recurse-submodules=yes",
      ]);
    });

    void test("handles complex flag combinations", async () => {
      const template = await parseTemplate(
        {
          $encode: "args",
          command: [
            {
              $flags: {
                "-a": true,
                "-b": true,
                "--long=": "value",
              },
            },
            "subcommand",
            {
              $repeat: {
                "-I": ["one", "two"],
                "--define=": ["A=1", "B=2"],
              },
            },
            {
              $flags: {
                "-x": true,
                "-y": true,
                "--opt=": "value",
              },
            },
            ["file.txt"],
          ],
        },
        options,
      );
      assert.deepEqual(await template.transform({}), [
        "command",
        "-ab",
        "--long=value",
        "subcommand",
        "-I",
        "one",
        "two",
        "--define=A=1",
        "--define=B=2",
        "-xy",
        "--opt=value",
        "file.txt",
      ]);
    });
  });
});
