# Tool Form Args Encoder

[![Package](https://img.shields.io/badge/npm-0.1.0-ae8c7e?labelColor=3b3a37)](https://www.npmjs.com/package/@tool-form/args)
[![License](https://img.shields.io/badge/license-MIT-ae8c7e?labelColor=3b3a37)](https://opensource.org/licenses/MIT)

Transform structured data into hygienically formatted command-line arguments for executing shell commands and CLIs. Built for [Tool Form] and [Tool Handle].

## Why an Args Encoding?

Command-line tools often expect complex argument patterns for everything from simple flags to nested subcommands. While these patterns enable rich functionality, their low-level string format makes them challenging to generate reliably, especially for AI tools.

The Tool Form args encoding enables you to transform structured data into properly formatted command arguments that:

- Handle flags with proper prefix and value formatting
- Support nested subcommands and command composition
- Manage argument ordering and grouping
- Preserve argument values without shell interpretation issues

By mapping command-line concepts to natural JSON structures, your tools can generate complex argument patterns without worrying about flag prefixes, value escaping, or argument ordering rules.

## Installation

```bash
npm install @tool-form/args
```

## Quick Start

The Tool Form args encoding enables templates to generate properly structured command arguments from JSON objects. It provides a set of directive properties that control argument formatting while integrating naturally with Tool Form's template features.

```typescript
import { parseTemplate } from "tool-form";
import { argsEncoding } from "@tool-form/args";

// Shows how Tool Form transforms nested objects into linearized command line arguments
const template = await parseTemplate(
  {
    $encode: "args",
    // Subcommands become positional arguments
    docker: {
      run: {
        // $flags combines single-char flags
        $flags: {
          "-i": { $: "container.interactive" },
          "-t": { $: "container.tty" },
          "--rm": { $: "container.remove_after_exit" },

          // $when directive conditionally includes entire flag groups
          $when: "$.container.resources",
          "--memory": { $: "container.resources.memory" },
          "--cpus": { $: "container.resources.cpus" },

          // $if directive enables flag value branching with template substitution
          "--name=": {
            $if: "$.env === 'prod'",
            then: { $: "container.name" },
            else: "{{container.name}}-{{env}}"
          },

          // Direct values in $if branches are emitted as-is
          "--network": {
            $if: "$.env === 'prod'",
            then: "prod-network",
            else: "dev-network"
          }
        },

        // $repeat directive handles repeated flag patterns
        $repeat: {
          // $each transforms arrays into repeated flag instances
          "-p=": {
            $each: "$.container.ports",
            $as: "port",
            // Interpolate JSONPath expressions into any string
            $value: "{{port.host}}:{{port.container}}"
          },

          // = suffix joins values with proper escaping
          "--env=": {
            $each: "$.container.env",
            $as: "env_var",
            $value: "{{env_var.name}}={{env_var.value}}"
          },

          // Multiple $each directives maintain ordering within $repeat
          "-v=": {
            $each: "$.container.volumes",
            $as: "vol",
            $value: "{{vol.source}}:{{vol.target}}"
          }
        },

        // $args directive appends positional arguments after flags
        $args: [
          // Direct value substitution from template arguments
          { $: "container.image" },
          // Conditional positional arguments with $when
          { $when: "$.container.command", $: "container.command" }
        ]
      }
    }
  },
  { encodings: [argsEncoding] }
);
```

<details>

<summary><strong>Example Output</strong></summary>

```bash
docker run -i -t --rm --memory 2g --cpus 2 --name=auth-service-staging --network dev-network -p=8080:80 -p=8443:443 --env=NODE_ENV=staging --env=DEBUG=true -v=./src:/app/src -v=./config:/app/config node:18 npm start
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "env": "staging",
  "container": {
    "interactive": true,
    "tty": true,
    "remove_after_exit": true,
    "name": "auth-service",
    "image": "node:18",
    "command": "npm start",
    "resources": {
      "memory": "2g",
      "cpus": "2"
    },
    "ports": [
      { "host": "8080", "container": "80" },
      { "host": "8443", "container": "443" }
    ],
    "env": [
      { "name": "NODE_ENV", "value": "staging" },
      { "name": "DEBUG", "value": "true" }
    ],
    "volumes": [
      { "source": "./src", "target": "/app/src" },
      { "source": "./config", "target": "/app/config" }
    ]
  }
}
```

</details>

</details>

The encoding works seamlessly with Tool Form's transformation directives:

- String interpolation via `{{expression}}` syntax
- Data access through the `$` directive
- Control flow with `$when`, `$if`, and `$each`
- Array composition for complex commands

Domain directives control argument-specific aspects:

- `$flags` - Manages flag formatting and combination
- `$repeat` - Repeats flags for multiple values
- `$args` - Adds positional arguments

For simple commands, standard JSON objects with subcommands is preferred over directives.

### Next Steps

- See [Usage Patterns](#usage-patterns) for common usage patterns
- Learn about [Command Concepts](#command-concepts) for proper structure
- Check the [Available Directives](#available-directives) reference

## Usage Patterns

The patterns below demonstrate how to transform structured data into hygienically formatted command line arguments. Each pattern addresses a fundamental challenge in argument generation: handling flags, managing subcommands, structuring complex commands, and preserving argument values.

### 1. Flag handling

Command-line tools use various flag patterns that require specific formatting. The template structure maps naturally to the resulting argument format.

```jsonc
{
  "$encode": "args",
  "kubectl": {
    "apply": {
      "$flags": {
        // Conditional flags based on mode
        "-f": { "$uri": "/api/v1/deployments/{{deployment}}" },
        "--namespace": { "$": "namespace" },

        // Validation options
        "--validate": { "$": "options.validate" },

        // Conditional server-side options
        "$when": "options.server_side",
        "--server-side": true,
        "--force-conflicts": true,

        // Dynamic field management
        "--field-manager": {
          "$if": "$.options.field_manager",
          "then": { "$": "options.field_manager" },
          "else": "kubectl-client"
        }
      }
    }
  }
}
```

<details>

<summary><strong>Example Output</strong></summary>

```bash
kubectl apply -f /api/v1/deployments/{{deployment}} --namespace {{namespace}} --validate --server-side --force-conflicts --field-manager {{options.field_manager}}
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "deployment": "auth-service-staging",
  "namespace": "staging",
  "options": {
    "validate": true,
    "server_side": true,
    "force_conflicts": true,
    "field_manager": "kubectl-client"
  }
}
```

</details>

</details>

This template demonstrates several key principles:

- Single-char flags combine when `true`
- Long flags maintain proper spacing
- `=` suffix controls value joining
- Arrays handle multiple values

The encoding handles proper flag formatting while maintaining clear relationships between options and their values.

### 2. Repeated flag patterns

Some commands expect flags to be repeated for each value. The `$repeat` directive enables precise control over flag repetition.

```jsonc
{
  "$encode": "args",
  "go": {
    "test": {
      "$flags": {
        // Test configuration
        "-v": { "$": "options.verbose" },
        "-timeout": { "$": "options.timeout" },

        // Conditional flag group inclusion
        "$when": "options.coverage",
        "-coverprofile": "coverage.out",
        "-covermode": "atomic"
      },

      "$repeat": {
        // $each transforms arrays into repeated flags
        "-tags=": {
          "$each": "$.options.tags",
          "$as": "tag",
          "$value": { "$": "tag" }
        },

        // Package paths with string interpolation
        "./...": {
          "$each": "$.options.packages",
          "$as": "pkg",
          "$value": "./{{pkg}}..."
        }
      },

      // $args for positional arguments
      "$args": [
        "-run",
        {
          "$if": "$.options.test_filter",
          "then": { "$": "options.test_filter" },
          "else": "."
        }
      ]
    }
  }
}
```

<details>

<summary><strong>Example Output</strong></summary>

```bash
go test -v -timeout 2m -coverprofile coverage.out -covermode atomic -tags {{options.tags}} ./... -run {{options.test_filter}}
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "options": {
    "verbose": true,
    "timeout": "2m",
    "coverage": true,
    "tags": ["unit", "integration"],
    "test_filter": "TestAuthService"
  }
}
```

</details>

</details>

This pattern shows how to:

- Repeat flags for each value
- Control value separation
- Mix repeated and single flags
- Preserve argument order

### 3. Complex command composition

Complex commands often need both subcommands and various flag patterns. Array composition enables clean separation of concerns while maintaining proper argument structure.

```jsonc
{
  "$encode": "args",
  "git": {
    "push": [
      // Flag group for basic options
      {
        "$flags": {
          "-u": { "$": "options.set_upstream" },
          "--force": { "$": "options.force" }
        }
      },

      // $if controls entire argument generation
      {
        "$if": "$.remote.type === 'github'",
        "then": {
          "$uri": "git@github.com:{{remote.owner}}/{{remote.repo}}.git"
        },
        "else": { "$": "remote.url" }
      },

      // Nested flag groups with conditionals
      {
        "$flags": {
          // $when for conditional flag inclusion
          "-b": { "$when": "options.create_branch", "$": "branch" },

          // $each transforms arrays into repeated flags
          "$when": "options.push_options",
          "--push-option": {
            "$each": "$.options.push_options",
            "$as": "opt",
            "$value": { "$": "opt" }
          }
        }
      },

      // Array elements become sequential arguments
      [
        { "$": "source_branch" },
        {
          "$if": "$.target_branch",
          "then": ":{{target_branch}}",
          "else": ""
        }
      ]
    ]
  }
}
```

<details>

<summary><strong>Example Output</strong></summary>

```bash
git push -u {{options.set_upstream}} --force --push-option {{options.push_options}}
{{options.remote.url}} {{options.branch}}
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "options": {
    "set_upstream": true,
    "force": true,
    "push_options": ["--no-verify"],
    "remote": {
      "type": "github",
      "owner": "toolcog",
      "repo": "tool-form",
      "url": "git@github.com:toolcog/tool-form.git"
    },
    "branch": "main"
  }
}
```

</details>

</details>

This pattern demonstrates:

- Command composition with arrays
- Mixed directive usage
- Clean separation of concerns
- Proper argument ordering

## Command Concepts

Understanding command-line argument structure helps create more maintainable
templates. Here are the key concepts:

### Argument structure

A command consists of:

- Optional subcommands
- Flags with or without values
- Positional arguments

The encoding handles formatting automatically:

```jsonc
{
  "$encode": "args",
  "command": {
    "subcommand": {
      // Flags with proper prefixes
      "--flag": "value",
      // Positional args at end
      "$args": ["arg1", "arg2"]
    }
  }
}
```

### Flag Types

Flags use formats appropriate to their names:

- Single-char (`-v`) - Single dash
- Long form (`--verbose`) - Double dash
- With values (`--name value`)
- With equals (`--name=value`)

```jsonc
{
  "$encode": "args",
  "$flags": {
    "-v": true,
    "--verbose": true,
    "--name": "value",
    "--env=": "DEBUG=1"
  }
}
```

### Argument order

The encoding maintains consistent ordering:

1. Subcommands first
2. Combined single-char flags
3. Regular flags with values
4. Repeated flags
5. Positional arguments

## Available Directives

Domain directives control argument generation:

### Command Directives

- `$flags` - Flag management and combination
- `$repeat` - Flag repetition for arrays
- `$args` - Positional arguments

### Composition

- Array elements combine in sequence
- Objects nest subcommands
- Strings become positional args

## License

MIT © Tool Cognition Inc.

[Tool Form]: https://github.com/toolcog/tool-form
[Tool Handle]: https://github.com/toolcog/tool-handle
