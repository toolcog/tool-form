# Tool Form

[![Package](https://img.shields.io/badge/npm-0.1.0-ae8c7e?labelColor=3b3a37)](https://www.npmjs.com/package/tool-form)
[![License](https://img.shields.io/badge/license-MIT-ae8c7e?labelColor=3b3a37)](https://opensource.org/licenses/MIT)

Connect AI to any API by bridging semantic intent and protocol mechanics. Tool Form enables AI systems to use APIs naturally by transforming semantic operations into precise protocol formats, without requiring custom code for every endpoint.

## The Problem

Every API is unique, yet APIs tend to cluster around common patterns. All REST APIs are fundamentally similar. So are all SQL queries, GraphQL operations, and RPC calls. But despite these similarities, each API differs in the details. The conventional wisdom is that each endpoint needs custom code - a separate tool implementation for every operation.

This approach doesn't scale. As AI systems grow more capable, they need access to more APIs. Writing and maintaining custom code for every endpoint creates an explosion of complexity that limits what AI can do. We need a better way.

## The Insight

The key insight behind Tool Form is that while APIs live in a high-dimensional space of semantic operations ("get user profile", "update email", "search documents"), they all project onto low-dimensional protocol spaces (HTTP's method/URL/headers/body, SQL's SELECT/FROM/WHERE, etc.). This projection isn't just one way - we also need to reconstruct semantic meaning from protocol responses.

This bidirectional transformation between semantic and protocol spaces is the fundamental challenge that prevents AI from utilizing any API. Tool Form solves this by providing:

1. **Protocol Projection** - Transform semantic parameters into precise protocol formats
2. **Semantic Reconstruction** - Convert protocol responses into meaningful results
3. **Security Boundaries** - Maintain strict separation between semantic operations and credentials
4. **Format Awareness** - Handle common formats through pluggable encodings

## Installation

Install the lightweight template:

```bash
npm install tool-form
```

Optionally install additional encoding plugins:

```bash
npm install @tool-form/markdown
npm install @tool-form/multipart
npm install @tool-form/args
```

## Quick Start

Let's connect an AI agent to GitHub's API to create an issue. First, we'll create a template that projects semantic parameters onto GitHub's REST protocol:

```typescript
import { parseTemplate } from "tool-form";

const createIssueTemplate = await parseTemplate({
  method: "POST",
  url: {
    // URI template encodes paths and substitutes parameters automatically
    $uri: "https://api.github.com/repos/{owner}/{repo}/issues"
  },
  headers: {
    // Ensures compatibility with future GitHub API versions
    Accept: "application/vnd.github.v3+json",
    // Delays token evaluation until transform time for security
    Authorization: "Bearer {{$.auth.token}}"
  },
  body: {
    $encode: "json",
    // Substitute template arguments with JSONPath queries
    title: { $: "title" },
    body: { $: "description" },
    // Pass arrays through without manual stringification
    labels: { $: "labels" }
  }
});
```

This template handles all the protocol details - REST endpoint structure, GitHub-specific headers, JSON encoding. The AI just needs to provide the semantic parameters:

```typescript
const request = await createIssueTemplate.transform({
  owner: "toolcog",
  repo: "tool-form",
  title: "Add support for nested markdown encodings",
  description:
    "We should support nested markdown encodings to enable more complex document structures. This would allow templates to:\n\n1. Generate code blocks with syntax highlighting\n2. Include formatted JSON for raw data\n3. Support markdown within blockquotes",
  labels: ["enhancement", "documentation"],
  auth: { token: process.env.GITHUB_TOKEN }
});
```

Now we can make the API call:

```typescript
const response = await fetch(request.url, {
  method: request.method,
  headers: request.headers,
  body: request.body
});
```

But raw API responses aren't very AI-friendly. Let's create a template that reconstructs semantic meaning from GitHub's response format:

```typescript
const issueTemplate = await parseTemplate({
  $encode: "markdown",
  // Join blocks with blank lines automatically
  $block: [
    "# Issue #{{number}}: {{title}}",
    "This **{{state}}** issue was created by `{{user.login}}`.",
    {
      // Remove entire section if the labels array is empty
      $when: "$.labels.*",
      $block: [
        "## Labels",
        // Extract the name field from each array element into a list item
        { $ul: { $: "labels.*.name" } }
      ]
    },
    "## Details",
    // Preserve markdown formatting in the issue body
    { $blockquote: { $: "body" } }
  ]
});

const result = await issueTemplate.transform(await response.json());

console.log(result);
```

This produces a semantic description that AI can reliably understand:

```markdown
# Issue #42: Add support for nested markdown encodings

This **open** issue was created by `alice-chen`.

## Labels

- enhancement
- documentation

## Details

> We should support nested markdown encodings to enable more complex document structures. This would allow templates to:
>
> 1. Generate code blocks with syntax highlighting
> 2. Include formatted JSON for raw data
> 3. Support markdown within blockquotes
```

That's it! We just:

1. Projected semantic intent ("create an issue") onto GitHub's REST protocol
2. Handled all the protocol details (endpoints, headers, auth, JSON)
3. Transformed the response into clear, semantic markdown
4. Did it all without writing a single line of GitHub-specific code

And here's the best part - you don't have to write these templates by hand. Tool Form is designed to work with higher-level tools that can:

- Generate templates from OpenAPI specs
- Optimize templates for better semantic clarity
- Store and discover templates at scale

Ready to dive deeper? Check out the documentation below.

## Examples

Tool Form includes two collections of examples that demonstrate its capabilities through practical implementations:

- [**Tool Examples**](../../examples/tools#readme) - Progressive examples showing how to connect AI to APIs through semantic templates, from basic protocol projection to scalable Tool Augmented Generation (TAG).

- [**Agent Examples**](../../examples/agents#readme) - Architectural patterns for building reliable, scalable agent systems that demonstrate how structured interfaces enhance AI agent capabilities.

Each collection shows how to solve specific problems you'll encounter when connecting AI to APIs in reliable agent systems.

## Crash Course

Let's dive into Tool Form by understanding how it transforms data. This crash course moves quickly but thoroughly—each section builds on the previous ones, so follow along in sequence.

### The Value Transformation Model

Tool Form operates on values, not strings. This is the key insight that separates it from traditional template engines:

```jsonc
{
  "greeting": "Hello, {{name}}!",
  "user": {
    "id": { "$": "user.id" },
    "joined": "Joined on {{user.created_at}}"
  }
}
```

Given the input `{"name": "Alice", "user": {"id": 42, "created_at": "2023-01-15"}}`, this transforms to:

```jsonc
{
  "greeting": "Hello, Alice!",
  "user": {
    "id": 42,
    "joined": "Joined on 2023-01-15"
  }
}
```

Notice what's happening:

- String interpolation with `{{...}}` fills values into strings
- The `$` directive replaces the entire property with the query result
- Structure is preserved throughout transformation
- Types are maintained (id is a number, not a string)

This value-based approach enables hygienic transformation, where structure and types are preserved without unexpected leakage between different parts of the template.

For complex transformations, multiple directives can work together:

```jsonc
{
  "summary": {
    // Include data via JSONPath
    "$comment": "User profile summary",
    "name": { "$": "user.profile.name" },
    "status": { "$": "user.status" },
    // Transform values through encodings
    "$encode": "json"
  }
}
```

Each directive has a specific role:

- Modifier directives (like `$comment`) add metadata
- Domain directives (like `$`) produce values
- Operator directives (like `$encode`) process results

This separation of concerns keeps templates maintainable even as they grow in complexity.

### Data Access with JSONPath

JSONPath is your primary tool for accessing data within templates. It provides a consistent way to extract values from the template arguments:

```jsonc
{
  // Direct property access
  "name": { "$": "user.name" },

  // Array element access
  "firstRole": { "$": "user.roles[0]" },

  // All array elements (non-singular)
  "allRoles": { "$": "user.roles[*]" },

  // Filtered array elements
  "adminRoles": { "$": "user.roles[?@.type == 'admin']" },

  // Recursive descent
  "allIds": { "$": "$..id" },

  // Transform results with pipes
  "roleCount": { "$": "user.roles | length" }
}
```

The result type depends on whether the query is singular or non-singular:

- Singular queries return a single value (or undefined if no match)
- Non-singular queries always return an array (which may be empty)

This distinction matters for how you structure your templates:

```jsonc
{
  // Singular query - direct value
  "adminName": { "$": "users[?@.role == 'admin'].name" },

  // Non-singular query - always an array
  "adminNames": { "$": "users[?@.role == 'admin'].*.name" }
}
```

With template arguments:

```jsonc
{
  "users": [
    { "name": "Alice", "role": "admin" },
    { "name": "Bob", "role": "user" },
    { "name": "Charlie", "role": "admin" }
  ]
}
```

The result would be:

```jsonc
{
  "adminName": "Alice",
  "adminNames": ["Alice", "Charlie"]
}
```

For more complex data manipulation, combine JSONPath with other directives:

```jsonc
{
  "users": {
    // Combine values structurally
    "$spread": {
      "$": "team.members",
      "activeUsers": { "$": "users[?@.active]" }
    }
  }
}
```

### Control Flow

Tool Form provides powerful directives for conditional processing, enabling templates to make decisions based on data:

```jsonc
{
  "access": {
    // Branch based on a condition
    "$if": "$.user.isAdmin",
    "$then": { "level": "admin", "permissions": ["read", "write", "delete"] },
    "$else": { "level": "user", "permissions": ["read"] }
  },

  "debugInfo": {
    // Include or exclude entire objects
    "$when": "$.settings.debug",
    "enabled": true,
    "level": { "$": "settings.logLevel" }
  },

  "environment": {
    // Conditions can be complex expressions
    "$if": "$.env == 'production' || $.features.prodMode",
    "$then": "production",
    "$else": {
      "$if": "$.env == 'staging'",
      "$then": "staging",
      "$else": "development"
    }
  }
}
```

The `$if` directive provides branching logic:

- Evaluates the condition
- Returns either the `$then` value or the `$else` value
- Handles nested conditions naturally

The `$when` directive provides filtering:

- Returns the containing object (minus the directive) when true
- Returns an Undefined Value (which gets removed) when false
- Perfect for conditional inclusion without complex nesting

For array-based conditions, you can use JSONPath expressions directly:

```jsonc
{
  "notification": {
    // Check if any array elements match a condition
    "$when": "$.alerts[?@.priority == 'high']",
    "message": "You have high priority alerts!",
    "count": { "$": "alerts[?@.priority == 'high'] | length" }
  }
}
```

For data with variable structure, the `$match` directive enables pattern matching through JSON Schema validation:

```jsonc
{
  "apiResponse": {
    // Use the response data as input for $match
    "$": "response",
    // Match the input against each schema in order
    "$match": [
      {
        // Match against error response schema
        "$case": { "required": ["error"] },
        // If matched, all other properties will be transformed and returned
        "status": "error",
        "message": { "$": "error.message" }
      },
      {
        // Match against user profile schema
        "$case": { "required": ["user"] },
        "status": "success",
        "id": { "$": "user.id" },
        "name": { "$": "user.name" }
      },
      // Any value without a $case property will be transformed
      // and returned if defined
      "status": "unknown"
    ]
  }
}
```

The `$match` directive:

- Takes the Input Node (from the `$` directive)
- Evaluates each branch in sequence
- Validates the Input Node against each branch's schema
- Returns the first matching branch's transformation
- Provides a clean way to handle polymorphic data structures

For structural validation, the `$matches` directive tests if a value conforms to a JSON Schema:

```jsonc
{
  "validation": {
    // Use the profile as the input to $matches
    "$": "profile",
    // Validate the input against the schema
    "$matches": {
      "type": "object",
      "required": ["id", "email"],
      "properties": {
        "email": { "format": "email" }
      }
    }
  }
}
```

These control flow directives let you create templates that adapt to their input, making decisions based on data structure rather than generating static output.

By combining simple patterns, you can implement sophisticated conditional logic while maintaining clear template structure.

### Structural Composition

Real-world data rarely maps perfectly to API requirements. Tool Form provides powerful composition patterns that let you reshape data to fit your needs:

```jsonc
{
  "profile": {
    // Merge properties from multiple sources
    "$spread": {
      "$": "user.profile",
      "id": { "$": "user.id" },
      "verified": { "$": "user.email_verified" }
    }
  }
}
```

The `$spread` directive combines values into a single structure:

- For objects, it merges properties
- For arrays, it concatenates elements
- For strings evaluated as queries, it spreads the query results

This enables flexible composition patterns for both objects and arrays:

```jsonc
{
  "config": {
    // Object composition - merge properties
    "$spread": {
      "base": { "$": "defaults" },
      "environment": { "$": "environments[$.current]" },
      "overrides": { "$": "custom" }
    }
  },

  "tags": [
    "automatic",
    // Array composition - add elements
    { "$spread": { "$": "user.tags" } },
    { "$spread": { "$": "system.tags" } }
  ]
}
```

You can use `$spread` conditionally to handle optional elements:

```jsonc
{
  "request": {
    "method": "POST",
    "$spread": {
      // All these properties are optional in the output
      "$when": "$.auth",
      "auth": {
        "type": { "$": "auth.type" },
        "credentials": { "$": "auth.token" }
      }
    },
    "$spread": {
      "$when": "$.params.filters",
      "filters": { "$": "params.filters" }
    }
  }
}
```

For structural composition with conditional logic, combine `$spread` with `$if`:

```jsonc
{
  "permissions": {
    "$spread": {
      "$if": "$.user.isAdmin",
      "$then": {
        "admin": true,
        "canManageUsers": true
      },
      "$else": {
        "$if": "$.user.role == 'moderator'",
        "$then": {
          "canModerate": true
        },
        "$else": {
          "canView": true
        }
      }
    }
  }
}
```

These composition patterns enable flexible, declarative templates that adapt to different data structures while maintaining clean template organization.

### Iteration

Working with collections is a fundamental requirement for API integration. Tool Form provides powerful iteration capabilities through the `$each` directive:

```jsonc
{
  "users": {
    // Iterate over array elements
    "$each": "$.team.members",
    "$as": "member",
    // Create a value for each element
    "id": { "$": "member.id" },
    "name": { "$": "member.name" },
    "role": { "$": "member.role" }
  }
}
```

The `$each` directive:

- Iterates over a sequence of values
- Binds each value to a variable name (`$as`)
- Transforms the template for each value
- Returns an array of results

You can transform each item into a completely different structure:

```jsonc
{
  "items": {
    "$each": "$.products",
    "$as": "product",
    // Complete control over the output structure
    "details": {
      "id": { "$": "product.id" },
      "price": { "$": "product.price" },
      "$when": "product.sale",
      "discount": { "$": "product.discount" }
    }
  }
}
```

For more control over the output, you can specify exactly what to transform:

```jsonc
{
  "items": {
    "$each": "$.products",
    "$as": "product",
    // Transform a specific template for each item
    "$value": {
      "name": { "$": "product.name" },
      "sku": { "$": "product.sku" }
    }
  }
}
```

To create an object instead of an array, use the `$key` property:

```jsonc
{
  "userMap": {
    "$each": "$.users",
    "$as": "user",
    // Use the id as the property name
    "$key": { "$": "user.id" },
    // Properties become values in the resulting object
    "name": { "$": "user.name" },
    "role": { "$": "user.role" }
  }
}
```

With template arguments:

```jsonc
{
  "users": [
    { "id": "u1", "name": "Alice", "role": "admin" },
    { "id": "u2", "name": "Bob", "role": "user" }
  ]
}
```

The result would be:

```jsonc
{
  "userMap": {
    "u1": { "name": "Alice", "role": "admin" },
    "u2": { "name": "Bob", "role": "user" }
  }
}
```

For advanced iteration patterns, combine `$each` with other directives:

```jsonc
{
  "resources": {
    "$each": "$.resources",
    "$as": "resource",
    "$key": { "$": "resource.type" },
    "$value": {
      // Further iterate over resource permissions
      "$each": "$.resource.permissions",
      "$as": "perm",
      "$value": { "$": "perm.level" }
    }
  }
}
```

These iteration patterns let you transform collections flexibly while maintaining clear template structure.

### Encodings

Integrating with APIs often requires converting between different data formats. Tool Form's encoding system handles this through the `$encode` directive:

```jsonc
{
  "config": {
    // Values to encode
    "debug": true,
    "environment": { "$": "env" },
    "features": { "$": "features" },
    // Transform to JSON string
    "$encode": "json"
  }
}
```

Given `{"env": "production", "features": ["a", "b"]}`, this produces:

```jsonc
{
  "config": "{\"debug\":true,\"environment\":\"production\",\"features\":[\"a\",\"b\"]}"
}
```

For more control over encoding, use domain properties:

```jsonc
{
  "prettyConfig": {
    "debug": true,
    "environment": { "$": "env" },
    // Format with indentation
    "$encode": "json",
    "$indent": 2
  }
}
```

The real power comes from encoding composition. Encodings can be nested or chained to handle complex formats:

```jsonc
{
  "data": {
    // Base64-encoded JSON
    "$encode": ["json", "base64"],
    "user": { "$": "user.name" },
    "timestamp": { "$": "timestamp" }
  },

  "form": {
    // URL-encoded form data
    "$encode": "urlencoded",
    "user": { "$": "user.name" },
    "action": "login"
  }
}
```

For direct value encoding, use the `$use` directive:

```jsonc
{
  "encoded": {
    // Start with a literal value
    "$use": {
      "name": { "$": "user.name" },
      "token": { "$": "user.token" }
    },
    // Apply encoding to the value
    "$encode": "json"
  }
}
```

For formats with special requirements, use domain properties specific to that encoding:

```jsonc
{
  "request": {
    "$encode": "multipart",
    "metadata": {
      // Nested encoding for one part
      "$encode": "json",
      "user": { "$": "user.id" },
      "action": "upload"
    },
    "file": {
      // File-specific properties
      "$filename": { "$": "document.name" },
      "$contentType": { "$": "document.mime_type" },
      "$content": { "$": "document.content" }
    }
  }
}
```

Through the encoding system, Tool Form enables hygienic generation of complex protocol payloads while maintaining clear separation between data and format concerns.

### Putting It All Together

Let's integrate what we've learned to create a complete workflow that solves a real-world challenge. We'll build a template that transforms semantic operations into a REST API request, and another that reconstructs the response into a meaningful result:

```jsonc
{
  // Request template - transforms parameters into protocol format
  "request": {
    "method": "POST",
    "url": {
      // Dynamic API endpoint based on environment
      "$uri": {
        "$if": "$.environment == 'production'",
        "$then": "https://api.example.com/v1/orders/{order_id}/process",
        "$else": "https://api-dev.example.com/v1/orders/{order_id}/process"
      }
    },
    "headers": {
      // Authentication with selective inclusion
      "$spread": {
        "$when": "$.auth.type == 'oauth'",
        "Authorization": "Bearer {{$.auth.credentials.token}}"
      },
      "$spread": {
        "$when": "$.auth.type == 'api_key'",
        "X-API-Key": { "$": "auth.credentials.key" }
      },
      // Standard headers
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    "body": {
      // JSON-encoded request body with structural composition
      "$encode": "json",
      // Include base request data
      "$spread": { "$": "request.data" },
      // Add metadata
      "metadata": {
        "client_version": "1.0.0",
        "timestamp": { "$": "request.timestamp" },
        "$spread": {
          "$when": "$.telemetry",
          "metrics": { "$": "telemetry.metrics" }
        }
      },
      // Dynamic line items based on order contents
      "line_items": {
        "$each": "$.order.items",
        "$as": "item",
        "$value": {
          "product_id": { "$": "item.id" },
          "quantity": { "$": "item.quantity" },
          "$when": "item.options",
          "options": { "$": "item.options" }
        }
      },
      // Payment details with conditional fields
      "payment": {
        "method": { "$": "payment.method" },
        "$spread": {
          "$if": "$.payment.method == 'credit_card'",
          "$then": {
            "card_token": { "$": "payment.card.token" },
            "$when": "$.payment.card.save",
            "save_for_future": true
          },
          "$else": {
            "$if": "$.payment.method == 'paypal'",
            "$then": {
              "paypal_token": { "$": "payment.paypal.token" }
            },
            "$else": {
              "alternate_reference": { "$": "payment.reference" }
            }
          }
        }
      }
    }
  },

  // Response template - transforms API response into semantic result
  "response": {
    // Pattern match against different response structures
    "$": "response",
    "$match": [
      {
        // Error response pattern
        "$case": { "required": ["error"] },
        "status": "error",
        "code": { "$": "error.code" },
        "message": { "$": "error.message" },
        // Include validation errors if present
        "$spread": {
          "$when": "$.error.validation",
          "validation_errors": {
            "$each": "$.error.validation",
            "$as": "err",
            "$value": {
              "field": { "$": "err.field" },
              "message": { "$": "err.message" }
            }
          }
        }
      },
      {
        // Success response pattern
        "$case": { "required": ["order"] },
        "status": "success",
        "order": {
          "id": { "$": "order.id" },
          "status": { "$": "order.status" },
          "total": { "$": "order.total" },
          // Transform timestamps to standard format
          "created_at": { "$": "order.created_at" },
          "estimated_delivery": { "$": "order.estimated_delivery" },
          // Items with specific fields extracted
          "items": {
            "$each": "$.order.items",
            "$as": "item",
            "$value": {
              "name": { "$": "item.product.name" },
              "price": { "$": "item.price" },
              "quantity": { "$": "item.quantity" }
            }
          }
        },
        // Selectively include shipping information
        "$spread": {
          "$when": "$.order.shipping",
          "shipping": {
            "method": { "$": "order.shipping.method" },
            "address": { "$": "order.shipping.address" },
            "tracking_number": { "$": "order.shipping.tracking" }
          }
        },
        // Include all metadata properties without explicit mapping
        "metadata": { "$spread": { "$": "metadata" } }
      },
      // Default case for unexpected response formats
      { "status": "unknown", "message": "Unexpected response format" }
    ]
  }
}
```

This comprehensive example demonstrates how Tool Form enables:

- **Protocol Projection** - Transforming semantic parameters into a precise REST request
- **Conditional Logic** - Adapting to different environments, auth types, and payment methods
- **Pattern Matching** - Handling polymorphic response structures through schema validation
- **Structural Composition** - Building complex objects from multiple data sources
- **Collection Handling** - Transforming arrays of order items with consistent structure
- **Format Management** - Encoding the request body as JSON with proper structure
- **Semantic Reconstruction** - Converting the protocol response into a meaningful result
- **Error Handling** - Providing clear error information when things go wrong

By combining these capabilities, Tool Form enables AI systems to interact with any API through semantic templates, without requiring custom code for each endpoint.

### Design Principles

As you build your own templates, keep these key principles in mind:

**1. Structure Before Strings**

Maintain structural integrity throughout transformation. Prefer:

```jsonc
{
  "user": { "$": "user.name" },
  "role": { "$": "user.role" }
}
```

Over string concatenation:

```jsonc
{
  "info": "User {{$.user.name}} has role {{$.user.role}}"
}
```

The structured approach enables proper protocol encoding, maintains types, and allows for validation. This principle extends to pattern matching with `$match`, which validates structure directly rather than relying on string-based conditions.

**2. Transformation, Not Generation**

Templates should transform values rather than generate them. Prefer:

```jsonc
{
  "items": {
    "$each": "$.products",
    "$as": "product",
    "id": { "$": "product.id" }
  }
}
```

Over ad-hoc construction:

```jsonc
{
  "items": [{ "id": "prod1" }, { "id": "prod2" }]
}
```

Transformation connects inputs to outputs, maintaining semantic relationships.

**3. Explicit Over Implicit**

Make transformations explicit rather than relying on implicit behavior. Prefer:

```jsonc
{
  "user": {
    "$spread": { "$": "user.profile" },
    "id": { "$": "user.id" }
  }
}
```

Over implicit property relationships:

```jsonc
{
  "user": {
    "$": "user"
  }
}
```

Explicit transformations make templates more maintainable and less prone to unexpected behavior.

**4. Composition Over Complexity**

Build complex templates through composition of simple patterns. Prefer:

```jsonc
{
  "$spread": {
    "$when": "$.feature_enabled",
    "feature": { "$": "feature.config" }
  }
}
```

Over complex conditional logic:

```jsonc
{
  "$if": "$.feature_enabled",
  "$then": {
    "feature": { "$": "feature.config" }
    // ... copy all other properties
  },
  "$else": {
    // ... copy all other properties without feature
  }
}
```

Composition creates more maintainable templates that adapt to changing requirements.

**5. Progressive Enhancement**

Start with a minimal template and enhance it progressively. Begin with:

```jsonc
{
  "user": { "$": "user.name" },
  "items": { "$": "items" }
}
```

Then enhance with specific needs:

```jsonc
{
  "user": { "$": "user.name" },
  "items": {
    "$each": "$.items",
    "$as": "item",
    "id": { "$": "item.id" },
    "quantity": { "$": "item.quantity" }
  }
}
```

This approach keeps templates focused on requirements rather than hypothetical needs.

By following these principles, you'll create templates that remain clear, maintainable, and secure as they grow in complexity.

## Documentation

See the [Tool Form documentation](https://github.com/toolcog/tool-form) for:

- Protocol transformation patterns
- Format-specific guides
- Security model details
- Complete API reference

## Related Projects

- [Tool Handle] - Connect AI to tools through protocol projection
- [HTTP Handle] - HTTP protocol handler for Tool Handle
- [Command Handle] - Command line handler for Tool Handle

## Community

- [Discord] - Join our developer community
- [GitHub Discussions] - Ask questions and share ideas
- [Contributing Guide] - Help improve Tool Form

## License

MIT © Tool Cognition Inc.

[Tool Handle]: https://github.com/toolcog/tool-handle
[HTTP Handle]: https://github.com/toolcog/http-handle
[Command Handle]: https://github.com/toolcog/command-handle
[Discord]: https://discord.gg/toolcog
[GitHub Discussions]: https://github.com/toolcog/tool-form/discussions
[Contributing Guide]: ../../CONTRIBUTING.md
