---
title: Tool Form Markdown Encoding
author: Chris Sachs
date: 2024-12
slug: draft-csachs-tool-form-markdown-encoding-00
---

# Tool Form Markdown Encoding

## Abstract

This document specifies a Markdown Encoding for Tool Form that enables hygienic generation of markdown text from JSON values. The encoding ensures structural integrity by maintaining proper markdown element boundaries while preserving the natural expression of markdown syntax where possible. This enables Tool Form templates to generate clear, structured responses that LLMs can reliably process and act upon.

## Table of Contents

1. [Introduction](#1-introduction)  
   1.1. [Terminology](#11-terminology)

2. [Processing Model](#2-processing-model)  
   2.1. [Markdown Directives](#21-markdown-directives)  
   2.2. [Value Transformation](#22-markdown-transformation)

3. [Inline Directives](#3-inline-directives)  
   3.1. [`$inline` Directive](#31-inline-directive)  
   3.2. [`$em` Directive](#32-em-directive)  
   3.3. [`$strong` Directive](#33-strong-directive)  
   3.4. [`$code` Directive](#34-code-directive)  
   3.5. [`$a` Directive](#35-a-directive)  
   3.6. [`$img` Directive](#36-img-directive)

4. [Block Directives](#4-block-directives)  
   4.1. [`$block` Directive](#41-block-directive)  
   4.2. [`$h1` through `$h6` Directives](#42-h1-through-h6-directives)  
   4.3. [`$p` Directive](#43-p-directive)  
   4.4. [`$ul` Directives](#44-ul-directives)  
   4.5. [`$ol` Directives](#45-ol-directives)  
   4.6. [`$blockquote` Directive](#46-blockquote-directive)  
   4.7. [`$code` Directive](#47-code-directive)  
   4.8. [`$hr` Directive](#48-hr-directive)

5. [Security Considerations](#5-security-considerations)

6. [IANA Considerations](#6-iana-considerations)  
   6.1. [Tool Form Encoding Registration](#61-tool-form-encoding-registration)

7. [References](#7-references)  
   7.1. [Normative References](#71-normative-references)  
   7.2. [Informative References](#72-informative-references)

- [Appendix A. Examples](#appendix-a-examples)  
  A.1. [Ergonomic Markdown](#a1-ergonomic-markdown)  
  A.2. [Structural Composition](#a2-structural-composition)  
  A.3. [Semantic Transformation](#a3-semantic-transformation)

## 1. Introduction

Tool Form [TOOLFORM] encodings transform fully resolved JSON values into specific output formats. The Markdown Encoding transforms these values into well-structured Markdown [MARKDOWN] text, with particular focus on maintaining proper element boundaries. While markdown can be written directly in string values, the encoding provides directives for cases where structural guarantees are needed.

This encoding operates solely on resolved JSON values - after all Tool Form template processing has completed. It does not participate in template evaluation or affect how directives are processed. Its role is purely to serialize the final JSON value into markdown text.

For example:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "# Status Report",
    // Markdown syntax in strings is preserved, not escaped
    "Current status is **active** with:",
    {
      "$ul": [
        "CPU: 75% utilization",
        // $inline joins elements without adding whitespace,
        // keeping the code span in the list item
        { "$inline": ["Memory: ", { "$code": "2.1GB" }, " used"] },
        "Disk: 60% full"
      ]
    },
    { "$blockquote": "All systems operational" }
  ]
}
```

This produces:

```markdown
# Status Report

Current status is **active** with:

- CPU: 75% utilization
- Memory: `2.1GB` used
- Disk: 60% full

> All systems operational
```

### 1.1. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

The terminology of [TOOLFORM] applies, particularly its definitions of Node and Domain Property. This document uses the following additional terms:

Block Mode
: A processing mode where markdown elements are separated by blank lines. Used for headings, lists, code blocks, and other block-level elements.

Inline Mode
: A processing mode where markdown elements flow together without extra spacing. Used for emphasis, links, code spans, and other inline formatting.

Markdown Directive
: A property in a JSON object that controls markdown generation. Block directives (like `$ul` or `$blockquote`) create block-level elements, while inline directives (like `$em` or `$code`) create inline formatting.

## 2. Processing Model

The markdown encoding transforms JSON values into markdown text through two mechanisms: direct value transformation and directive-based transformation. Direct transformation converts JSON values into natural markdown text, allowing markdown patterns to form freely within string values. Directive-based transformation provides explicit control over markdown structure when needed, ensuring that elements remain properly contained within their parent context.

### 2.1. Markdown Directives

A markdown directive is a property in a JSON object that begins with `$` and controls how its value is transformed into markdown text. Each directive processes its value in either Block Mode or Inline Mode, transforming that value according to §2.2. A directive may define Domain Properties that provide additional configuration for the transformation.

A JSON object MUST contain at most one markdown directive. When a markdown directive is present, other properties in the object are treated as Domain Properties of that directive. If an object contains more than one markdown directive, implementations MUST return an error.

Any markdown directive can appear in any context. For example, block-level directives like `$blockquote` can appear within inline-level directives like `$em`, and vice versa. The `$block` and `$inline` directives are commonly used to override the current mode when needed.

### 2.2. Value Transformation

When transforming a JSON value in either Block Mode or Inline Mode:

1. If the value is an Undefined Value, produce no output
2. If the value is null, produce an empty string
3. If the value is a string, number, or boolean, convert it to a string
4. If the value is an array:
   - Transform each element in the current mode
   - Remove any elements that produce an Undefined Value
   - In Block Mode, join the remaining elements with blank lines
   - In Inline Mode, join the remaining elements directly
5. If the value is an object:
   - If it contains a markdown directive:
     - Process according to §2.1
     - If in Inline Mode and the directive produces block content, surround the result with newlines
   - Otherwise, serialize it as JSON text:
     - In Block Mode, with 2-space indentation
     - In Inline Mode, without indentation

The mode affects only how elements are joined together, not how individual values are transformed. Any value can be transformed in either mode, and any directive can appear in either mode.

## 3. Inline Directives

Inline directives produce content that flows within text, without introducing blank lines between elements. Each inline directive processes its value in Inline Mode, producing text-level formatting like emphasis, links, and code spans. While these directives are designed for inline content, they can appear in either Block Mode or Inline Mode.

### 3.1. `$inline` Directive

The `$inline` directive processes its value in Inline Mode, joining elements without adding whitespace. The value MUST be either a single value or an array of values. Each value is transformed according to §2.2 in Inline Mode, and the results are joined directly. Values that transform to an Undefined Value are removed.

This directive is commonly used within block directives to maintain text flow, particularly in list items and blockquotes where multiple elements should flow as a single paragraph.

For example:

```jsonc
{
  "$encode": "markdown",
  "$ul": [
    "Simple item",
    // List items render in block mode
    {
      // The $inline directive forces inline mode,
      // joining array elements without whitespace
      "$inline": [
        "Status: ",
        { "$code": "active" },
        " (",
        { "$em": "running" },
        ")"
      ]
    }
  ]
}
```

This produces:

```markdown
- Simple item
- Status: `active` (_running_)
```

### 3.2. `$em` Directive

The `$em` directive processes its value in Inline Mode and wraps the result with underscores to create emphasized text. The value is transformed according to §2.2 in Inline Mode. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

For example:

```jsonc
{
  "$encode": "markdown",
  "$inline": ["Status: ", { "$em": "pending" }, " - awaiting review"]
}
```

This produces:

```markdown
Status: _pending_ - awaiting review
```

### 3.3. `$strong` Directive

The `$strong` directive processes its value in Inline Mode and wraps the result with double asterisks to create strongly emphasized text. The value is transformed according to §2.2 in Inline Mode. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

For example:

```jsonc
{
  "$encode": "markdown",
  "$inline": ["Alert: ", { "$strong": "critical error" }, " detected"]
}
```

This produces:

```markdown
Alert: **critical error** detected
```

### 3.4. `$code` Directive

The `$code` directive in Inline Mode wraps its value with backticks to create inline code. The value is transformed according to §2.2 in Inline Mode. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

A separate `$code` directive exists for Block Mode (section 4.7).

For example:

```jsonc
{
  "$encode": "markdown",
  "$inline": [
    "Use the ",
    { "$code": "npm install" },
    " command to install dependencies"
  ]
}
```

This produces:

```markdown
Use the `npm install` command to install dependencies
```

### 3.5. `$a` Directive

The `$a` directive creates a markdown link. The value specifies the URL and is transformed according to §2.2 in Inline Mode. The optional `text` Domain Property specifies the link text; if not provided, the URL is used as the text. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

For example:

```jsonc
{
  "$encode": "markdown",
  "$inline": [
    "See ",
    {
      "$a": "https://example.com/docs",
      "text": "the documentation"
    },
    " for details"
  ]
}
```

This produces:

```markdown
See [the documentation](https://example.com/docs) for details
```

### 3.6. `$img` Directive

The `$img` directive creates a markdown image. The value specifies the image URL and is transformed according to §2.2 in Inline Mode. The optional `alt` Domain Property specifies the alt text; if not provided, an empty string is used. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

For example:

```jsonc
{
  "$encode": "markdown",
  "$inline": [
    "Here's our logo: ",
    {
      "$img": "https://example.com/logo.png",
      "alt": "Example Corp Logo"
    }
  ]
}
```

This produces:

```markdown
Here's our logo: ![Example Corp Logo](https://example.com/logo.png)
```

## 4. Block Directives

Block directives produce standalone block-level elements like headings, lists, and blockquotes. Each block directive processes its value in either Block Mode or Inline Mode, with inline content automatically forming paragraphs. These directives naturally separate from surrounding content with blank lines, maintaining proper block structure regardless of where they appear.

### 4.1. `$block` Directive

The `$block` directive processes its value in Block Mode, joining elements with blank lines. The value MUST be either a single value or an array of values. Each value is transformed according to §2.2 in Block Mode, and the results are joined with blank lines between them. Values that transform to an Undefined Value are removed.

This directive is commonly used as the root of a markdown document to establish proper block structure, particularly when specifying the value of an `$encode: "markdown"` directive.

For example:

```jsonc
{
  "$encode": "markdown",
  // The $block directive joins elements with blank lines
  "$block": [
    "# System Status",
    "All services operational:",
    { "$ul": ["API: 100%", "Database: 100%", "Cache: 100%"] },
    { "$blockquote": "No incidents reported in the last 24 hours" }
  ]
}
```

This produces:

```markdown
# System Status

All services operational:

- API: 100%
- Database: 100%
- Cache: 100%

> No incidents reported in the last 24 hours
```

### 4.2. `$h1` through `$h6` Directives

The heading directives (`$h1` through `$h6`) create markdown headings of levels one through six. Each directive processes its value in Inline Mode and prefixes the result with one to six hash marks and a space. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

For example:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    { "$h1": "Document Title" },
    "Introduction text",
    { "$h2": "First Section" },
    "Section content",
    { "$h3": "Subsection" },
    "Subsection content"
  ]
}
```

This produces:

```markdown
# Document Title

Introduction text

## First Section

Section content

### Subsection

Subsection content
```

### 4.3. `$p` Directive

The `$p` directive creates an explicit paragraph. The value is transformed according to §2.2 in Inline Mode. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

Since inline content in Block Mode automatically creates paragraphs, this directive is primarily useful for making paragraph structure explicit in templates.

For example:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    { "$p": "First paragraph with some inline content" },
    { "$p": ["Second paragraph with ", { "$em": "emphasized" }, " text"] }
  ]
}
```

This produces:

```markdown
First paragraph with some inline content

Second paragraph with _emphasized_ text
```

### 4.4. `$ul` Directives

The `$ul` directive creates an unordered list. The value MUST be an array. Each array element is transformed according to §2.2 in Block Mode, and the result is prefixed with `- `. Multiline items are indented with two spaces after the first line. Values that transform to an Undefined Value are removed.

For example:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "Available actions:",
    {
      "$ul": [
        "Simple item",
        "Item with multiple lines\nthat need proper indentation",
        {
          "$inline": [
            "Status: ",
            { "$code": "active" },
            " with ",
            { "$em": "no issues" }
          ]
        }
      ]
    }
  ]
}
```

This produces:

```markdown
Available actions:

- Simple item
- Item with multiple lines
  that need proper indentation
- Status: `active` with _no issues_
```

### 4.5. `$ol` Directives

The `$ol` directive creates an ordered list. The value MUST be an array. Each array element is transformed according to §2.2 in Block Mode, and the result is prefixed with its index followed by a period and space. The optional `$start` Domain Property specifies the starting index (defaults to 1). Multiline items are indented to align with the first line's content. Values that transform to an Undefined Value are removed.

For example:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "Required steps:",
    {
      "$start": 3,
      "$ol": [
        "Configure environment",
        "Install dependencies\nwith correct versions",
        {
          "$inline": [
            "Run tests and verify ",
            { "$code": "status === 'passed'" }
          ]
        }
      ]
    }
  ]
}
```

This produces:

```markdown
Required steps:

3. Configure environment
4. Install dependencies
   with correct versions
5. Run tests and verify `status === 'passed'`
```

### 4.6. `$blockquote` Directive

The `$blockquote` directive creates a markdown blockquote. The value is transformed according to §2.2 in Block Mode. Each line of the result is prefixed with `> `, with empty lines receiving just `>`. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

For example:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "System status:",
    {
      "$blockquote": [
        { "$strong": "All systems operational" },
        "No incidents reported in the last 24 hours.\nAll metrics within normal ranges.",
        { "$ul": ["CPU: 45%", "Memory: 60%", "Disk: 72%"] }
      ]
    }
  ]
}
```

This produces:

```markdown
System status:

> **All systems operational**
>
> No incidents reported in the last 24 hours.
> All metrics within normal ranges.
>
> - CPU: 45%
> - Memory: 60%
> - Disk: 72%
```

### 4.7. `$code` Directive

The `$code` directive in Block Mode creates a fenced code block. The value is transformed according to §2.2 in Inline Mode and wrapped with triple backticks. The optional `$lang` Domain Property specifies the language for syntax highlighting. If the value transforms to an Undefined Value, the directive produces an Undefined Value.

A separate `$code` directive exists for Inline Mode (§3.4).

For example:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "Example configuration:",
    {
      "$lang": "json",
      "$code": {
        "$encode": "json",
        "$indent": 2,
        "name": "example",
        "version": "1.0.0",
        "dependencies": {
          "markdown": "^2.0.0"
        }
      }
    }
  ]
}
```

This produces:

````markdown
Example configuration:

```json
{
  "name": "example",
  "version": "1.0.0",
  "dependencies": {
    "markdown": "^2.0.0"
  }
}
```
````

### 4.8. `$hr` Directive

The `$hr` directive creates a horizontal rule. The value is ignored. This directive always produces three hyphens (`---`).

For example:

```jsonc
{
  "$encode": "markdown",
  "$block": ["First section", { "$hr": true }, "Second section"]
}
```

This produces:

```markdown
First section

---

Second section
```

## 5. Security Considerations

The primary security concern for the Markdown Encoding is structural containment. While markdown itself is designed to be human-readable and flexible, this encoding must ensure that no content can break out of its intended structure. This is particularly important for list items and blockquotes, where improper indentation or line prefixing could break the containing element's structure. The transformation rules in §2.2 and the directive specifications in §3 and §4 ensure this containment.

Note that this encoding operates solely on resolved JSON values. All Tool Form security considerations regarding template processing, JSONPath evaluation, and resource access have already been addressed before this encoding receives its input.

## 6. IANA Considerations

### 6.1. Tool Form Encoding Registration

IANA is requested to register the following encoding in the "Tool Form Encoding" registry:

Name: markdown  
Description: Transforms JSON values into markdown text, with particular focus on maintaining proper element boundaries while preserving natural markdown syntax  
Media Type: text/markdown  
Reference: This document

## 7. References

### 7.1. Normative References

[TOOLFORM] Sachs, C., "Tool Form",  
draft-csachs-tool-form-00, December 2024,  
<https://toolcog.com/specs/drafts/tool-form/draft-00>.

### 7.2. Informative References

[MARKDOWN] Gruber, J., "Markdown", December 2004,  
<https://daringfireball.net/projects/markdown/>.

## Appendix A. Examples

### A.1. Ergonomic Markdown

The markdown encoding preserves markdown syntax in string values, enabling natural expression of text formatting without requiring directives. This example demonstrates how markdown patterns flow naturally within JSON structure, with directives needed only for maintaining proper element hygiene, when required.

```jsonc
{
  "$encode": "markdown",
  "$block": [
    // Write markdown naturally in string values
    "# API Status: **Operational**",

    // Combine markdown syntax with string interpolation
    "Current time: _{{timestamp}}_",

    // Use arrays to create paragraphs
    [
      "The system is operating normally with:",
      "- CPU usage at **{{metrics.cpu}}%**",
      "- Memory at **{{metrics.memory}}%**",
      "- All services `RUNNING`"
    ],

    // Use directives only when structure matters
    {
      "$blockquote": [
        // Markdown in directive values flows naturally
        "**Note:** System maintenance scheduled for:",
        "1. Database backup at **{{maintenance.db_time}}**",
        "2. Cache flush at **{{maintenance.cache_time}}**",
        "_Please plan accordingly_"
      ]
    },

    // Combine natural markdown with explicit structure
    "## Recent Changes",
    {
      "$ul": [
        // List items can contain markdown formatting
        "Deployed version `{{deploy.version}}` - **{{deploy.status}}**",
        "Updated API rate limits to `{{limits.rate}}/sec`",
        // Use $inline when you need to control text flow
        {
          "$inline": [
            "Added support for ",
            { "$code": "{{feature.name}}" },
            " - _{{feature.status}}_"
          ]
        }
      ]
    }
  ]
}
```

Given these Template Arguments:

```jsonc
{
  "timestamp": "2024-03-15 14:30 UTC",
  "metrics": {
    "cpu": 45,
    "memory": 62
  },
  "maintenance": {
    "db_time": "2024-03-16 02:00 UTC",
    "cache_time": "2024-03-16 02:30 UTC"
  },
  "deploy": {
    "version": "v2.3.4",
    "status": "successful"
  },
  "limits": {
    "rate": 1000
  },
  "feature": {
    "name": "async_processing",
    "status": "beta"
  }
}
```

This produces:

```markdown
# API Status: **Operational**

Current time: _2024-03-15 14:30 UTC_

The system is operating normally with:

- CPU usage at **45%**
- Memory at **62%**
- All services `RUNNING`

> **Note:** System maintenance scheduled for:
>
> 1. Database backup at **2024-03-16 02:00 UTC**
> 2. Cache flush at **2024-03-16 02:30 UTC**
>
> _Please plan accordingly_

## Recent Changes

- Deployed version `v2.3.4` - **successful**
- Updated API rate limits to `1000/sec`
- Added support for `async_processing` - _beta_
```

This example demonstrates how the markdown encoding enables natural expression of markdown patterns while maintaining proper structure. Directives are used only when needed for structural guarantees, such as ensuring proper list formatting or blockquote boundaries. The rest of the markdown flows naturally through string values and interpolation.

### A.2. Structural Composition

This example demonstrates how block and inline modes compose to maintain structural integrity across complex document hierarchies. It shows proper nesting of lists, blockquotes, and code blocks while preserving natural text flow within each structural element.

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "# API Documentation",

    // Top-level description with inline formatting
    {
      "$p": [
        "The ",
        { "$code": "/users" },
        " endpoint supports ",
        { "$strong": "user management" },
        " operations."
      ]
    },

    "## Authentication",
    {
      "$blockquote": [
        { "$strong": "Required" },
        "All requests must include an API key:",
        {
          "$ul": [
            // $inline prevents unwanted paragraph breaks in list items
            { "$inline": ["Header: ", { "$code": "X-API-Key" }] },
            { "$inline": ["Value: ", { "$code": "{{api_key}}" }] }
          ]
        }
      ]
    },

    "## Available Methods",
    {
      "$ul": [
        // List items automatically process content in Block Mode
        [
          "`GET` List users",
          {
            "$blockquote": [
              "Parameters:",
              {
                "$ul": [
                  "page: Page number (default: 1)",
                  "limit: Items per page (default: 20)",
                  // Nested array creates a single list item
                  [
                    "filter: Result filtering",
                    {
                      "$lang": "json",
                      "$code": {
                        "$encode": "json",
                        "$indent": 2,
                        "role": "admin",
                        "active": true
                      }
                    }
                  ]
                ]
              }
            ]
          }
        ],
        [
          "`POST` Create user",
          {
            "$blockquote": [
              "Request body:",
              {
                "$lang": "json",
                "$code": {
                  "$encode": "json",
                  "$indent": 2,
                  "name": "string",
                  "email": "string",
                  "role": "enum: user, admin"
                }
              }
            ]
          }
        ]
      ]
    }
  ]
}
```

Given these Template Arguments:

```jsonc
{
  "api_key": "YOUR_API_KEY"
}
```

This produces:

````markdown
# API Documentation

The `/users` endpoint supports **user management** operations.

## Authentication

> **Required**
> All requests must include an API key:
>
> - Header: `X-API-Key`
> - Value: `YOUR_API_KEY`

## Available Methods

- GET List users

  > Parameters:
  >
  > - page: Page number (default: 1)
  > - limit: Items per page (default: 20)
  > - filter: Result filtering
  >
  >   ```json
  >   {
  >     "role": "admin",
  >     "active": true
  >   }
  >   ```

- POST Create user
  > Request body:
  >
  > ```json
  > {
  >   "name": "string",
  >   "email": "string",
  >   "role": "enum: user, admin"
  > }
  > ```
````

This example shows how directives maintain proper structure through multiple levels of nesting. Block mode ensures correct spacing between elements, while inline mode enables natural text flow within structural boundaries. The composition of these modes, together with appropriate directives, ensures that complex document hierarchies remain well-formed regardless of their nesting depth or content type.

### A.3. Semantic Transformation

This example demonstrates how to transform raw system data into semantically meaningful markdown. It shows how document structure and formatting can highlight relationships and importance while preserving technical details where needed.

```jsonc
{
  "$encode": "markdown",
  "$block": [
    // Lead with critical information
    "# Deployment Status: {{status}}",

    // Transform raw state into clear prose
    [
      "Deployment of ",
      { "$code": "{{service.name}}@{{service.version}}" },
      " to ",
      { "$strong": "{{environment}}" },
      " is ",
      { "$em": "{{status | toLowerCase}}" },
      "."
    ],

    // Surface blocking issues prominently
    {
      "$when": "blocking_issues",
      "$block": [
        "## ⚠️ Blocking Issues",
        {
          "$ul": {
            "$each": "blocking_issues",
            "$as": "issue",
            // Format each issue consistently
            "$inline": [
              { "$strong": "{{issue.type}}" },
              ": {{issue.message}}\n",
              "→ Required action: ",
              { "$code": "{{issue.action}}" }
            ]
          }
        }
      ]
    },

    // Group related metrics
    "## Health Metrics",
    {
      "$blockquote": [
        // Highlight overall health assessment
        { "$strong": "{{health.summary}}" },
        "Based on current metrics:",
        {
          "$ul": {
            "$each": "metrics",
            "$as": "metric",
            // Show trends and thresholds
            "$inline": [
              "{{metric.name}}: ",
              { "$strong": "{{metric.value}}{{metric.unit}}" },
              " (",
              { "$em": "{{metric.trend}}" },
              ")",
              {
                "$when": "metric.threshold",
                "$inline": [
                  "\n→ Threshold: ",
                  { "$code": "{{metric.threshold}}{{metric.unit}}" }
                ]
              }
            ]
          }
        }
      ]
    },

    // Show dependency relationships
    "## Dependencies",
    {
      "$ul": {
        "$each": "dependencies",
        "$as": "dep",
        "$value": [
          { "$code": "{{dep.name}}" },
          ": {{dep.status}}",
          {
            "$when": "dep.error",
            "$block": [
              { "$blockquote": "{{dep.error}}" },
              // Preserve raw error details in code block
              {
                "$lang": "json",
                "$code": {
                  "$encode": "json",
                  "$indent": 2,
                  "$": "dep.details"
                }
              }
            ]
          }
        ]
      }
    },

    // Preserve full state for reference
    "## Raw Deployment State",
    {
      "$lang": "json",
      "$code": {
        "$encode": "json",
        "$indent": 2,
        // Include only relevant fields
        "service": { "$": "service" },
        "environment": { "$": "environment" },
        "status": { "$": "status" },
        "metrics": { "$": "metrics" },
        "dependencies": { "$": "dependencies" }
      }
    }
  ]
}
```

Given these Template Arguments:

```jsonc
{
  "service": {
    "name": "payment-api",
    "version": "2.3.4"
  },
  "environment": "production",
  "status": "FAILED",
  "blocking_issues": [
    {
      "type": "Security",
      "message": "Vulnerable dependency detected",
      "action": "updateDependencies"
    },
    {
      "type": "Performance",
      "message": "Response time exceeds SLA",
      "action": "optimizeQueries"
    }
  ],
  "health": {
    "summary": "Partially degraded"
  },
  "metrics": [
    {
      "name": "Response Time",
      "value": 250,
      "unit": "ms",
      "trend": "increasing",
      "threshold": 200
    },
    {
      "name": "Error Rate",
      "value": 2.5,
      "unit": "%",
      "trend": "stable",
      "threshold": 1
    },
    {
      "name": "CPU Usage",
      "value": 85,
      "unit": "%",
      "trend": "stable"
    }
  ],
  "dependencies": [
    {
      "name": "auth-service",
      "status": "operational"
    },
    {
      "name": "database",
      "status": "degraded",
      "error": "Connection pool exhausted",
      "details": {
        "active_connections": 95,
        "max_connections": 100,
        "wait_queue": 15,
        "timeout_count": 23
      }
    }
  ]
}
```

This produces:

````markdown
# Deployment Status: FAILED

Deployment of `payment-api@2.3.4` to **production** is _failed_.

## ⚠️ Blocking Issues

- **Security**: Vulnerable dependency detected
  → Required action: `updateDependencies`
- **Performance**: Response time exceeds SLA
  → Required action: `optimizeQueries`

## Health Metrics

> **Partially degraded**
> Based on current metrics:
>
> - Response Time: **250ms** (_increasing_)
>   → Threshold: `200ms`
> - Error Rate: **2.5%** (_stable_)
>   → Threshold: `1%`
> - CPU Usage: **85%** (_stable_)

## Dependencies

- `auth-service`: operational
- `database`: degraded
  > Connection pool exhausted
  >
  > ```json
  > {
  >   "active_connections": 95,
  >   "max_connections": 100,
  >   "wait_queue": 15,
  >   "timeout_count": 23
  > }
  > ```

## Raw Deployment State

```json
{
  "service": {
    "name": "payment-api",
    "version": "2.3.4"
  },
  "environment": "production",
  "status": "FAILED",
  "metrics": [
    {
      "name": "Response Time",
      "value": 250,
      "unit": "ms",
      "trend": "increasing",
      "threshold": 200
    },
    {
      "name": "Error Rate",
      "value": 2.5,
      "unit": "%",
      "trend": "stable",
      "threshold": 1
    },
    {
      "name": "CPU Usage",
      "value": 85,
      "unit": "%",
      "trend": "stable"
    }
  ],
  "dependencies": [
    {
      "name": "auth-service",
      "status": "operational"
    },
    {
      "name": "database",
      "status": "degraded",
      "error": "Connection pool exhausted",
      "details": {
        "active_connections": 95,
        "max_connections": 100,
        "wait_queue": 15,
        "timeout_count": 23
      }
    }
  ]
}
```
````
