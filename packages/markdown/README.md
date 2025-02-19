# Tool Form Markdown Encoder

[![Package](https://img.shields.io/badge/npm-0.1.0-ae8c7e?labelColor=3b3a37)](https://www.npmjs.com/package/@tool-form/markdown)
[![License](https://img.shields.io/badge/license-MIT-ae8c7e?labelColor=3b3a37)](https://opensource.org/licenses/MIT)

Transform structured API responses into semantically rich markdown that LLMs can reliably understand and act upon. Built for [Tool Form] and [Tool Handle].

## Why a Markdown Encoding?

Raw API responses often lack the semantic context needed for reliable tool use. While structured data formats like JSON excel at representing relationships between values, they provide no natural way to explain what those relationships mean, or why they matter.

The Tool Form markdown encoding enables you to transform raw API responses into semantically enriched documents that:

- Highlight key information through clear document structure
- Explain relationships between data elements
- Preserve raw data in code blocks when needed
- Guide the LLM toward appropriate next steps

By combining natural language exposition with structured data, your tools can provide the context LLMs need to:

- Understand relationships between different pieces of data
- Identify the most relevant information
- Determine appropriate next actions
- Maintain context across multiple calls

## Installation

```bash
npm install @tool-form/markdown
```

## Quick Start

The Tool Form markdown encoding enables templates to generate semantically rich markdown text from JSON structures. It provides a set of directive properties that control the generation of well-formed markdown, while integrating naturally with Tool Form's template features.

```typescript
import { parseTemplate } from "tool-form";
import { markdownEncoding } from "@tool-form/markdown";

// Transform GitHub API responses into semantically enriched markdown
const template = await parseTemplate(
  {
    $encode: "markdown", // Encode the object using the markdown encoding
    $block: [
      // Simple string interpolation for basic markdown
      "# Issue #{{number}}: {{title}}",

      // Natural inline formatting with markdown syntax
      "This **{{state}}** issue was created by `{{user.login}}`.",

      // Tool Form directives get transformed prior to markdown encoding
      {
        $when: "$.labels.length", // Only show labels section if present
        $block: [
          "## Labels",
          // Generate list items from array data
          { $ul: { $: "labels.*.name" } }
        ]
      },

      "## Details",

      // Markdown directives generate well-formed output
      // The $ directive spliced in a template parameter
      { $blockquote: { $: "body" } },

      "## Raw Data",

      // Encodings can be nested
      {
        $lang: "json",
        $code: {
          $encode: "json", // Encode JSON text
          $indent: 2, // Pretty print with 2 spaces
          $: "issue_data" // Substitute the raw response data to encode
        }
      }
    ]
  },
  { encodings: [markdownEncoding] }
);
```

<details>

<summary><strong>Example Output</strong></summary>

````markdown
# Issue #42: Add support for nested markdown encodings

This **open** issue was created by `alice-chen`.

## Labels

- enhancement
- documentation
- good first issue

## Details

> We should support nested markdown encodings to enable more complex document structures. This would allow templates to:
>
> 1. Generate code blocks with syntax highlighting
> 2. Include formatted JSON for raw data
> 3. Support markdown within blockquotes
>
> This enhancement would make our templates more powerful while keeping them readable.

## Raw Data

```jsonc
{
  "id": "I_kwDOG88730942",
  "node_id": "I_kwDOG88730942",
  "number": 42,
  "title": "Add support for nested markdown encodings",
  "user": {
    "login": "alice-chen",
    "id": 123456,
    "type": "User"
  },
  "labels": [
    {
      "id": 123,
      "node_id": "LA_kwDOG8873094",
      "name": "enhancement",
      "color": "84b6eb"
    },
    {
      "id": 124,
      "node_id": "LA_kwDOG8873095",
      "name": "documentation",
      "color": "0075ca"
    },
    {
      "id": 125,
      "node_id": "LA_kwDOG8873096",
      "name": "good first issue",
      "color": "7057ff"
    }
  ],
  "state": "open",
  "created_at": "2024-03-15T10:30:00Z",
  "updated_at": "2024-03-15T10:30:00Z",
  "body": "We should support nested markdown encodings to enable more complex document structures. This would allow templates to:\n\n1. Generate code blocks with syntax highlighting\n2. Include formatted JSON for raw data\n3. Support markdown within blockquotes\n\nThis enhancement would make our templates more powerful while keeping them readable."
}
```
````

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "number": 42,
  "title": "Add support for nested markdown encodings",
  "state": "open",
  "user": {
    "login": "alice-chen"
  },
  "labels": [
    { "name": "enhancement" },
    { "name": "documentation" },
    { "name": "good first issue" }
  ],
  "body": "We should support nested markdown encodings to enable more complex document structures. This would allow templates to:\n\n1. Generate code blocks with syntax highlighting\n2. Include formatted JSON for raw data\n3. Support markdown within blockquotes\n\nThis enhancement would make our templates more powerful while keeping them readable.",
  "issue_data": {
    "id": "I_kwDOG88730942",
    "node_id": "I_kwDOG88730942",
    "number": 42,
    "title": "Add support for nested markdown encodings",
    "user": {
      "login": "alice-chen",
      "id": 123456,
      "type": "User"
    },
    "labels": [
      {
        "id": 123,
        "node_id": "LA_kwDOG8873094",
        "name": "enhancement",
        "color": "84b6eb"
      },
      {
        "id": 124,
        "node_id": "LA_kwDOG8873095",
        "name": "documentation",
        "color": "0075ca"
      },
      {
        "id": 125,
        "node_id": "LA_kwDOG8873096",
        "name": "good first issue",
        "color": "7057ff"
      }
    ],
    "state": "open",
    "created_at": "2024-03-15T10:30:00Z",
    "updated_at": "2024-03-15T10:30:00Z",
    "body": "We should support nested markdown encodings to enable more complex document structures. This would allow templates to:\n\n1. Generate code blocks with syntax highlighting\n2. Include formatted JSON for raw data\n3. Support markdown within blockquotes\n\nThis enhancement would make our templates more powerful while keeping them readable."
  }
}
```

</details>

</details>

The encoding works seamlessly with Tool Form's transformation directives:

- String interpolation via `{{expression}}` syntax
- Data access through the `$` directive
- Control flow with `$when`, `$if`, and `$each`
- Nested encodings like `$encode: "json"` within markdown

Markdown directives are only necessary for:

- Complex block structures (lists, blockquotes)
- Hygienically incorporating structured data
- Nested encodings and formatting
- Proper handling of multiline content

For simple markdown elements like headings or inline formatting, standard markdown syntax with string interpolation is preferred over markdown directives.

### Next Steps

- See [Usage Patterns](#usage-patterns) for common usage patterns
- Learn about [Block vs Inline Context](#block-vs-inline-context) for proper structure
- Check the [Available Directives](#available-directives) reference
- Read the [Response Engineering Guide] for best practices

[Response Engineering Guide]: https://github.com/toolcog/tool-form/docs/response-engineering.md

## Usage Patterns

The patterns below demonstrate how to transform structured data into semantically rich documents. Each pattern addresses a fundamental challenge in conveying meaning through data: highlighting what's important, explaining relationships, suggesting actions, and preserving context. Tool Form's transformation capabilities enable these patterns to emerge naturally from the structure of your templates.

### 1. Highlight key information

Creating clear information hierarchies helps agents (human and AI alike) quickly grasp what matters. The structure of an AI tool response should convey meaning—leading with critical information, progressively revealing details, and clearly distinguishing between different levels of importance.

The following example shows how to transform raw system metrics into a clear status report. It demonstrates progressive disclosure of information, from critical alerts through detailed metrics, while maintaining consistent formatting and clear visual hierarchy:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    // Lead with the highest-level status
    "# System Status: **{{status}}**",

    // Critical information first
    {
      "$when": "$.errors",
      "$block": [
        "## ⚠️ Active Alerts",
        // List structure makes errors scannable
        { "$ul": { "$": "errors.*.message" } }
      ]
    },

    // Supporting metrics in context
    "## Health Metrics",
    "Overall health is {{health_summary}} based on current metrics:",
    {
      "$ul": [
        // Format metrics consistently
        "CPU: **{{metrics.cpu}}%** ({{metrics.cpu_trend}})",
        "Memory: **{{metrics.memory}}%** ({{metrics.memory_trend}})",
        "Disk: **{{metrics.disk}}%** ({{metrics.disk_trend}})"
      ]
    },

    // Details for deeper investigation
    "## Subsystem Details",
    {
      "$each": "$.subsystems",
      "$as": "system",
      "$block": [
        "### {{system.name}}",
        // Blockquote adds visual distinction
        { "$blockquote": { "$": "system.description" } },
        { "$ul": { "$": "system.metrics.*.summary" } }
      ]
    }
  ]
}
```

<details>

<summary><strong>Example Output</strong></summary>

```markdown
# System Status: **Degraded**

## ⚠️ Active Alerts

- High latency in US-WEST region
- Database replication lag exceeding threshold

## Health Metrics

Overall health is partially degraded based on current metrics:

- CPU: **82%** (↑ from 75%)
- Memory: **65%** (stable)
- Disk: **89%** (↑ from 85%)

## Subsystem Details

### API Gateway

> Primary ingress for all API traffic. Currently experiencing elevated error rates in US-WEST region.

- Request Rate: 2.3k/sec (normal range)
- Error Rate: 2.8% (above threshold)
- P95 Latency: 350ms (above threshold)

### Database Cluster

> Primary data store with cross-region replication. Investigating replication delays.

- Write Load: 850 TPS (high)
- Read Load: 3.2k QPS (normal)
- Replication Lag: 12s (critical)
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "status": "Degraded",
  "errors": [
    { "message": "High latency in US-WEST region" },
    { "message": "Database replication lag exceeding threshold" }
  ],
  "health_summary": "partially degraded",
  "metrics": {
    "cpu": 82,
    "cpu_trend": "↑ from 75%",
    "memory": 65,
    "memory_trend": "stable",
    "disk": 89,
    "disk_trend": "↑ from 85%"
  },
  "subsystems": [
    {
      "name": "API Gateway",
      "description": "Primary ingress for all API traffic. Currently experiencing elevated error rates in US-WEST region.",
      "metrics": [
        { "summary": "Request Rate: 2.3k/sec (normal range)" },
        { "summary": "Error Rate: 2.8% (above threshold)" },
        { "summary": "P95 Latency: 350ms (above threshold)" }
      ]
    },
    {
      "name": "Database Cluster",
      "description": "Primary data store with cross-region replication. Investigating replication delays.",
      "metrics": [
        { "summary": "Write Load: 850 TPS (high)" },
        { "summary": "Read Load: 3.2k QPS (normal)" },
        { "summary": "Replication Lag: 12s (critical)" }
      ]
    }
  ]
}
```

</details>

</details>

This template demonstrates several key principles:

- **Progressive Disclosure** - Critical status first, then alerts, then supporting metrics
- **Clear Visual Hierarchy** - Headings establish structure, emphasis highlights key values
- **Contextual Presentation** - Metrics shown with trends, descriptions provide meaning
- **Consistent Formatting** - Similar data presented in similar ways

Notice how the template uses markdown syntax for simple formatting (`**bold**`) but switches to directives when needed for structure (`$ul`) or dynamic content (`$blockquote`). This maintains readability while ensuring proper generation of complex elements.

Pitfalls to avoid:

- Using directives for simple text formatting (`{ $strong: "text" }`)
- Flat lists of metrics without context or hierarchy
- Missing explanations for what values mean
- Inconsistent formatting across similar data

The goal is to create a response structure that guides agents through the information, making relationships and importance clear through both content and presentation.

### 2. Explain relationships

Data relationships are often implicit in object graphs, arrays of references, and parent/child hierarchies. Making these relationships explicit, and explaining their significance, helps agents understand not just how data connects, but why those connections matter.

The following example transforms a complex repository access model into a clear narrative. It shows how to present interconnected team structures, access patterns, and security policies while maintaining clarity through consistent structure and progressive detail:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "# Repository: {{repo.name}}",

    // Overview of key relationships
    "This repository has **{{collaborators.length}}** collaborators across **{{teams.length}}** teams, with access to **{{environments.length}}** deployment environments.",

    // Team-based access patterns
    "## Team Access",
    {
      "$each": "$.teams",
      "$as": "team",
      "$block": [
        "### {{team.name}}",
        // Explain the team's role and scope
        "{{team.description}}",

        // Show member access levels
        "**Members:**",
        {
          "$ul": {
            "$each": "$.team.members",
            "$as": "member",
            "$value": "{{member.name}} (`{{member.role}}`)"
          }
        },

        // Environment permissions
        {
          "$when": "$.team.environments",
          "$block": [
            "**Environment Access:**",
            {
              "$ul": {
                "$each": "$.team.environments",
                "$as": "env",
                "$value": "{{env.name}} ({{env.access_level}})"
              }
            }
          ]
        }
      ]
    },

    // Direct collaborator access
    "## Individual Access",
    "The following collaborators have direct repository access:",
    {
      "$ul": {
        "$each": "$.collaborators",
        "$as": "collab",
        "$value": [
          "{{collab.name}} - ",
          { "$code": "{{collab.permission}}" },
          {
            "$when": "$.collab.teams",
            "$inline": " (also member of: {{collab.teams.*.name}})"
          }
        ]
      }
    },

    // Environment overview
    "## Environment Security",
    "Each environment has specific access requirements:",
    {
      "$each": "$.environments",
      "$as": "env",
      "$block": [
        "### {{env.name}}",
        { "$blockquote": "{{env.security_policy}}" },
        "**Required Approvals:** {{env.required_approvals}}",
        {
          "$when": "$.env.restricted_teams",
          "$block": [
            "**Restricted to Teams:**",
            { "$ul": { "$": "env.restricted_teams.*.name" } }
          ]
        }
      ]
    }
  ]
}
```

<details>

<summary><strong>Example Output</strong></summary>

```markdown
# Repository: payment-service

This repository has **3** collaborators across **3** teams, with access to **3** deployment environments.

## Team Access

### Platform

Core platform team responsible for infrastructure and deployment pipelines.

**Members:**

- Alice Chen (`lead`)
- Dave Wilson (`senior`)

**Environment Access:**

- production (full)
- staging (full)
- development (full)

### Backend

Payment processing and API development team.

**Members:**

- Bob Smith (`senior`)
- Eve Brown (`member`)

**Environment Access:**

- staging (deploy)
- development (full)

### Security

Security and compliance team with audit responsibilities.

**Members:**

- Alice Chen (`member`)
- Frank Lee (`lead`)

**Environment Access:**

- production (audit)
- staging (audit)

## Individual Access

The following collaborators have direct repository access:

- Alice Chen - `admin` (also member of: Platform, Security)
- Bob Smith - `write` (also member of: Backend)
- Carol Jones - `maintain`

## Environment Security

Each environment has specific access requirements:

### production

> Production environment handling live payment data. Requires strict access controls and audit logging. All deployments need security review.

**Required Approvals:** 2

**Restricted to Teams:**

- Platform

### staging

> Pre-production environment with sanitized data. Used for final testing and security validation.

**Required Approvals:** 1

### development

> Development environment with mock data. Used for feature development and initial testing.

**Required Approvals:** 0
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "repo": {
    "name": "payment-service"
  },
  "collaborators": [
    {
      "name": "Alice Chen",
      "permission": "admin",
      "teams": [{ "name": "Platform" }, { "name": "Security" }]
    },
    {
      "name": "Bob Smith",
      "permission": "write",
      "teams": [{ "name": "Backend" }]
    },
    {
      "name": "Carol Jones",
      "permission": "maintain",
      "teams": null
    }
  ],
  "teams": [
    {
      "name": "Platform",
      "description": "Core platform team responsible for infrastructure and deployment pipelines.",
      "members": [
        { "name": "Alice Chen", "role": "lead" },
        { "name": "Dave Wilson", "role": "senior" }
      ],
      "environments": [
        { "name": "production", "access_level": "full" },
        { "name": "staging", "access_level": "full" },
        { "name": "development", "access_level": "full" }
      ]
    },
    {
      "name": "Backend",
      "description": "Payment processing and API development team.",
      "members": [
        { "name": "Bob Smith", "role": "senior" },
        { "name": "Eve Brown", "role": "member" }
      ],
      "environments": [
        { "name": "staging", "access_level": "deploy" },
        { "name": "development", "access_level": "full" }
      ]
    },
    {
      "name": "Security",
      "description": "Security and compliance team with audit responsibilities.",
      "members": [
        { "name": "Alice Chen", "role": "member" },
        { "name": "Frank Lee", "role": "lead" }
      ],
      "environments": [
        { "name": "production", "access_level": "audit" },
        { "name": "staging", "access_level": "audit" }
      ]
    }
  ],
  "environments": [
    {
      "name": "production",
      "security_policy": "Production environment handling live payment data. Requires strict access controls and audit logging. All deployments need security review.",
      "required_approvals": 2,
      "restricted_teams": [{ "name": "Platform" }]
    },
    {
      "name": "staging",
      "security_policy": "Pre-production environment with sanitized data. Used for final testing and security validation.",
      "required_approvals": 1
    },
    {
      "name": "development",
      "security_policy": "Development environment with mock data. Used for feature development and initial testing.",
      "required_approvals": 0
    }
  ]
}
```

</details>

</details>

This template demonstrates several key principles:

- **Narrative Flow** - Starts with overview, then details team structure, individual access, and environment security
- **Progressive Detail** - Each section adds depth while maintaining context
- **Contextual Grouping** - Related information (teams, members, permissions) presented together
- **Clear Transitions** - Each relationship type clearly introduced and explained

Notice how the template:

- Uses natural language to explain relationships, not just show them
- Maintains consistent structure across similar relationship types
- Provides context for why relationships exist
- Shows both direct and indirect relationships (team membership, environment access)

Pitfalls to avoid:

- Listing nested data without explaining connections
- Inconsistent presentation of similar relationships
- Missing context about relationship significance
- Over-complicated nesting that obscures meaning

The goal is to create a clear narrative about how different pieces of data relate to each other, making both the relationships and their importance explicit.

### 3. Guide next actions

Transform raw state into actionable intelligence by helping agents understand not just what _is_, but what can be _done_. By explicitly mapping state to potential actions, you can guide agents toward appropriate next steps while reducing uncertainty about available options.

The following example shows how to transform CI/CD pipeline status into clear, prioritized actions. It demonstrates state-aware suggestions, prerequisite checking, and progressive disclosure of options:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    // Lead with critical status
    "# Pipeline Status: **{{status}}**",
    {
      "$when": "$.blocking_issues",
      "$block": [
        "## 🚫 Blocking Issues",
        "The following issues must be resolved:",
        { "$ul": { "$": "blocking_issues.*.message" } }
      ]
    },

    // Required actions based on state
    "## Required Actions",
    {
      "$ul": [
        // Failed tests require investigation
        {
          "$when": "$.test_failures",
          "$inline": [
            "Review test failures in `{{failed_suite}}`: ",
            "_{{test_failures.length}} tests failed_\n",
            "→ Use `viewTestResults` to see detailed failure logs"
          ]
        },
        // Security scan findings need review
        {
          "$when": "$.security_findings",
          "$inline": [
            "Review security findings: ",
            "_{{security_findings.length}} new vulnerabilities_\n",
            "→ Use `reviewSecurityFindings` to triage issues"
          ]
        },
        // Performance regression detected
        {
          "$when": "$.perf_regression",
          "$inline": [
            "Investigate performance regression in `{{regression_component}}`\n",
            "→ Use `viewPerfMetrics` to analyze changes"
          ]
        }
      ]
    },

    // Recommended actions for warnings
    {
      "$when": "$.warnings.length",
      "$block": [
        "## Recommended Actions",
        {
          "$ul": {
            "$each": "$.warnings",
            "$as": "warning",
            "$inline": [
              "{{warning.message}}\n",
              "→ Use `{{warning.action}}` to address this"
            ]
          }
        }
      ]
    },

    // Optional improvements
    {
      "$when": "$.suggestions.length",
      "$block": [
        "## Optimization Opportunities",
        {
          "$ul": {
            "$each": "$.suggestions",
            "$as": "suggestion",
            "$inline": [
              "{{suggestion.description}}\n",
              "→ Use `{{suggestion.action}}` to implement"
            ]
          }
        }
      ]
    },

    // Deployment options based on state
    "## Deployment Status",
    {
      "$blockquote": [
        "Current stage: ",
        { "$strong": "{{current_stage}}" },
        "\nNext stage: ",
        { "$strong": "{{next_stage}}" }
      ]
    },
    "Available deployment actions:",
    {
      "$ul": [
        // Allow deployment if tests pass
        {
          "$when": "$.can_deploy",
          "$inline": [
            "Deploy to `{{next_stage}}` using `deployTo`",
            {
              "$when": "$.required_approvals",
              "$inline": " (requires {{required_approvals}} approvals)"
            }
          ]
        },
        // Show approval action if pending
        {
          "$when": "$.pending_approval",
          "$inline": [
            "Review deployment with `approveDeployment` ",
            "(_{{approvals_received}}/{{required_approvals}} approvals_)"
          ]
        },
        // Rollback option if recently deployed
        {
          "$when": "$.can_rollback",
          "$inline": ["Rollback to previous version with `rollbackDeployment`"]
        }
      ]
    }
  ]
}
```

<details>

<summary><strong>Example Output</strong></summary>

```markdown
# Pipeline Status: **Failed**

## 🚫 Blocking Issues

The following issues must be resolved:

- Security scan detected critical vulnerabilities
- Performance regression exceeds threshold

## Required Actions

- Review test failures in `auth-service`: _2 tests failed_
  → Use `viewTestResults` to see detailed failure logs
- Review security findings: _3 new vulnerabilities_
  → Use `reviewSecurityFindings` to triage issues
- Investigate performance regression in `payment-api`
  → Use `viewPerfMetrics` to analyze changes

## Recommended Actions

- Test coverage decreased by 5%
  → Use `reviewCoverageReport` to address this
- 3 dependencies have known vulnerabilities
  → Use `reviewDependencyReport` to address this

## Optimization Opportunities

- Database queries could be optimized in UserService
  → Use `reviewQueryOptimizations` to implement
- Consider upgrading to Node.js 20 for performance improvements
  → Use `planNodeUpgrade` to implement

## Deployment Status

> Current stage: **staging**
> Next stage: **production**

Available deployment actions:

- Review deployment with `approveDeployment` (_1/2 approvals_)
- Rollback to previous version with `rollbackDeployment`
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "status": "Failed",
  "blocking_issues": [
    { "message": "Security scan detected critical vulnerabilities" },
    { "message": "Performance regression exceeds threshold" }
  ],
  "test_failures": [
    { "name": "UserAuthTest", "message": "Token validation failed" },
    { "name": "PaymentProcessTest", "message": "Timeout exceeded" }
  ],
  "failed_suite": "auth-service",
  "security_findings": [
    {
      "severity": "CRITICAL",
      "component": "auth-service",
      "cve": "CVE-2024-1234"
    },
    { "severity": "HIGH", "component": "payment-api", "cve": "CVE-2024-5678" },
    {
      "severity": "CRITICAL",
      "component": "auth-service",
      "cve": "CVE-2024-9012"
    }
  ],
  "perf_regression": true,
  "regression_component": "payment-api",
  "warnings": [
    {
      "message": "Test coverage decreased by 5%",
      "action": "reviewCoverageReport"
    },
    {
      "message": "3 dependencies have known vulnerabilities",
      "action": "reviewDependencyReport"
    }
  ],
  "suggestions": [
    {
      "description": "Database queries could be optimized in UserService",
      "action": "reviewQueryOptimizations"
    },
    {
      "description": "Consider upgrading to Node.js 20 for performance improvements",
      "action": "planNodeUpgrade"
    }
  ],
  "current_stage": "staging",
  "next_stage": "production",
  "can_deploy": false,
  "pending_approval": true,
  "approvals_received": 1,
  "required_approvals": 2,
  "can_rollback": true
}
```

</details>

</details>

This template demonstrates several key principles:

- **State-Aware Actions** - Suggestions adapt to current pipeline status
- **Clear Prerequisites** - Required approvals and blocking issues shown upfront
- **Progressive Disclosure** - Actions grouped by urgency (required → recommended → optional)
- **Contextual Grouping** - Related actions (e.g., deployment options) presented together

Notice how the template:

- Leads with blocking issues that require immediate attention
- Groups actions by priority and relationship
- Provides context about why actions are needed
- Makes prerequisites and consequences clear

Pitfalls to avoid:

- Suggesting actions that aren't currently valid
- Missing prerequisites or dependencies
- Overwhelming with too many options
- Unclear relationships between state and actions

The goal is to create a clear decision tree that helps agents understand what they can do, what they should do first, and why specific actions matter in the current context.

### 4. Preserve context

Transform raw data while maintaining access to original context. This pattern enables agents to verify interpretations, debug issues, and dive deeper when needed. By selectively preserving context, you can create documents that serve both high-level understanding and detailed analysis.

The following example shows how to transform cloud resource monitoring data into an actionable summary while preserving critical context. It demonstrates selective context preservation, structured formatting, and progressive disclosure of details:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    // High-level summary first
    "# Resource Monitor: {{resource.name}}",
    {
      "$blockquote": {
        "$inline": [
          "Region: **{{resource.region}}**\n",
          "Type: **{{resource.type}}**\n",
          "Status: **{{status}}**"
        ]
      }
    },

    // Key metrics and trends
    "## Current State",
    {
      "$ul": [
        // Format each metric with context
        {
          "$each": "$.metrics",
          "$as": "metric",
          "$inline": [
            "**{{metric.name}}**: {{metric.value}}{{metric.unit}} ",
            "(_{{metric.description}}_)\n",
            {
              "$when": "$.metric.threshold",
              "$inline": "→ Threshold: {{metric.threshold}}{{metric.unit}}\n"
            },
            {
              "$when": "$.metric.trend",
              "$inline": "→ Trend: {{metric.trend}}"
            }
          ]
        }
      ]
    },

    // Recent changes affecting state
    {
      "$when": "$.changes",
      "$block": [
        "## Recent Changes",
        {
          "$ul": {
            "$each": "$.changes",
            "$as": "change",
            "$block": [
              "{{change.timestamp}} - {{change.description}}",
              {
                "$when": "$.change.metadata",
                "$lang": "json",
                "$code": {
                  "$encode": "json",
                  "$indent": 2,
                  "$": "change.metadata"
                }
              }
            ]
          }
        }
      ]
    },

    // Relevant alerts with context
    {
      "$when": "$.alerts",
      "$block": [
        "## Active Alerts",
        {
          "$ul": {
            "$each": "$.alerts",
            "$as": "alert",
            "$block": [
              "### {{alert.severity}}: {{alert.title}}",
              { "$blockquote": { "$": "alert.description" } },
              {
                "$when": "$.alert.context",
                "$block": [
                  "**Additional Context:**",
                  {
                    "$lang": "json",
                    "$code": {
                      "$encode": "json",
                      "$indent": 2,
                      "$": "alert.context"
                    }
                  }
                ]
              }
            ]
          }
        }
      ]
    },

    // Raw monitoring data for verification
    "## Raw Monitoring Data",
    "Full resource state and monitoring data:",
    {
      "$lang": "json",
      "$code": {
        "$encode": "json",
        "$indent": 2,
        // Preserve specific fields needed for context
        "resource": { "$": "resource" },
        "metrics": { "$": "metrics" },
        "alerts": { "$": "alerts" },
        "changes": { "$": "changes" },
        "metadata": { "$": "metadata" }
      }
    }
  ]
}
```

<details>

<summary><strong>Example Output</strong></summary>

````markdown
# Resource Monitor: api-cluster-east

> Region: **us-east-1**
> Type: **ECS Cluster**
> Status: **Degraded**

## Current State

- **CPU Utilization**: 78% (_Average across cluster_)
  → Threshold: 85%
  → Trend: ↑ Increasing
- **Memory Usage**: 92% (_Peak memory pressure_)
  → Threshold: 90%
  → Trend: ↑ Critical
- **Network I/O**: 850Mbps (_Inbound traffic_)
  → Threshold: 1Gbps
  → Trend: Stable
- **Request Latency**: 280ms (_P95 response time_)
  → Threshold: 250ms
  → Trend: ↑ Degrading

## Recent Changes

- 2024-03-15T14:22:00Z - Auto-scaling event triggered

```jsonc
{
  "trigger": "memory_pressure",
  "action": "scale_out",
  "target_capacity": 8,
  "previous_capacity": 6
}
```

- 2024-03-15T14:20:00Z - Memory threshold exceeded

```jsonc
{
  "threshold": "90%",
  "current": "92%",
  "affected_services": ["payment-processor", "order-service"]
}
```

## Active Alerts

### CRITICAL: Memory Pressure Alert

> Memory usage exceeds threshold in multiple services. Auto-scaling initiated but additional investigation required.

**Additional Context:**

```jsonc
{
  "affected_nodes": 4,
  "duration": "15m",
  "top_consumers": [
    {
      "service": "payment-processor",
      "memory_mb": 4200,
      "trend": "increasing"
    },
    {
      "service": "order-service",
      "memory_mb": 3800,
      "trend": "stable"
    }
  ]
}
```

### WARNING: Latency Degradation

> P95 latency trending upward over last 30 minutes. Correlated with increased memory pressure.

**Additional Context:**

```jsonc
{
  "baseline": "180ms",
  "current": "280ms",
  "trend_start": "2024-03-15T14:00:00Z",
  "affected_endpoints": ["/api/v1/orders/process", "/api/v1/payments/authorize"]
}
```

## Raw Monitoring Data

Full resource state and monitoring data:

```jsonc
{
  "resource": {
    "name": "api-cluster-east",
    "region": "us-east-1",
    "type": "ECS Cluster",
    "id": "arn:aws:ecs:us-east-1:123456789012:cluster/api-cluster-east",
    "tags": {
      "Environment": "production",
      "Team": "platform"
    }
  },
  "status": "Degraded",
  "metrics": [
    {
      "name": "CPU Utilization",
      "value": 78,
      "unit": "%",
      "description": "Average across cluster",
      "threshold": 85,
      "trend": "↑ Increasing"
    },
    {
      "name": "Memory Usage",
      "value": 92,
      "unit": "%",
      "description": "Peak memory pressure",
      "threshold": 90,
      "trend": "↑ Critical"
    },
    {
      "name": "Network I/O",
      "value": 850,
      "unit": "Mbps",
      "description": "Inbound traffic",
      "threshold": 1000,
      "trend": "Stable"
    },
    {
      "name": "Request Latency",
      "value": 280,
      "unit": "ms",
      "description": "P95 response time",
      "threshold": 250,
      "trend": "↑ Degrading"
    }
  ],
  "changes": [
    {
      "timestamp": "2024-03-15T14:22:00Z",
      "description": "Auto-scaling event triggered",
      "metadata": {
        "trigger": "memory_pressure",
        "action": "scale_out",
        "target_capacity": 8,
        "previous_capacity": 6
      }
    },
    {
      "timestamp": "2024-03-15T14:20:00Z",
      "description": "Memory threshold exceeded",
      "metadata": {
        "threshold": "90%",
        "current": "92%",
        "affected_services": ["payment-processor", "order-service"]
      }
    }
  ],
  "alerts": [
    {
      "severity": "CRITICAL",
      "title": "Memory Pressure Alert",
      "description": "Memory usage exceeds threshold in multiple services. Auto-scaling initiated but additional investigation required.",
      "context": {
        "affected_nodes": 4,
        "duration": "15m",
        "top_consumers": [
          {
            "service": "payment-processor",
            "memory_mb": 4200,
            "trend": "increasing"
          },
          {
            "service": "order-service",
            "memory_mb": 3800,
            "trend": "stable"
          }
        ]
      }
    },
    {
      "severity": "WARNING",
      "title": "Latency Degradation",
      "description": "P95 latency trending upward over last 30 minutes. Correlated with increased memory pressure.",
      "context": {
        "baseline": "180ms",
        "current": "280ms",
        "trend_start": "2024-03-15T14:00:00Z",
        "affected_endpoints": [
          "/api/v1/orders/process",
          "/api/v1/payments/authorize"
        ]
      }
    }
  ],
  "metadata": {
    "last_deployment": "2024-03-15T12:00:00Z",
    "version": "v2.3.4",
    "monitoring_config": {
      "metrics_interval": "1m",
      "alert_evaluation": "5m"
    }
  }
}
```
````

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "resource": {
    "name": "api-cluster-east",
    "region": "us-east-1",
    "type": "ECS Cluster",
    "id": "arn:aws:ecs:us-east-1:123456789012:cluster/api-cluster-east",
    "tags": {
      "Environment": "production",
      "Team": "platform"
    }
  },
  "status": "Degraded",
  "metrics": [
    {
      "name": "CPU Utilization",
      "value": 78,
      "unit": "%",
      "description": "Average across cluster",
      "threshold": 85,
      "trend": "↑ Increasing"
    },
    {
      "name": "Memory Usage",
      "value": 92,
      "unit": "%",
      "description": "Peak memory pressure",
      "threshold": 90,
      "trend": "↑ Critical"
    },
    {
      "name": "Network I/O",
      "value": 850,
      "unit": "Mbps",
      "description": "Inbound traffic",
      "threshold": 1000,
      "trend": "Stable"
    },
    {
      "name": "Request Latency",
      "value": 280,
      "unit": "ms",
      "description": "P95 response time",
      "threshold": 250,
      "trend": "↑ Degrading"
    }
  ],
  "changes": [
    {
      "timestamp": "2024-03-15T14:22:00Z",
      "description": "Auto-scaling event triggered",
      "metadata": {
        "trigger": "memory_pressure",
        "action": "scale_out",
        "target_capacity": 8,
        "previous_capacity": 6
      }
    },
    {
      "timestamp": "2024-03-15T14:20:00Z",
      "description": "Memory threshold exceeded",
      "metadata": {
        "threshold": "90%",
        "current": "92%",
        "affected_services": ["payment-processor", "order-service"]
      }
    }
  ],
  "alerts": [
    {
      "severity": "CRITICAL",
      "title": "Memory Pressure Alert",
      "description": "Memory usage exceeds threshold in multiple services. Auto-scaling initiated but additional investigation required.",
      "context": {
        "affected_nodes": 4,
        "duration": "15m",
        "top_consumers": [
          {
            "service": "payment-processor",
            "memory_mb": 4200,
            "trend": "increasing"
          },
          {
            "service": "order-service",
            "memory_mb": 3800,
            "trend": "stable"
          }
        ]
      }
    },
    {
      "severity": "WARNING",
      "title": "Latency Degradation",
      "description": "P95 latency trending upward over last 30 minutes. Correlated with increased memory pressure.",
      "context": {
        "baseline": "180ms",
        "current": "280ms",
        "trend_start": "2024-03-15T14:00:00Z",
        "affected_endpoints": [
          "/api/v1/orders/process",
          "/api/v1/payments/authorize"
        ]
      }
    }
  ],
  "metadata": {
    "last_deployment": "2024-03-15T12:00:00Z",
    "version": "v2.3.4",
    "monitoring_config": {
      "metrics_interval": "1m",
      "alert_evaluation": "5m"
    }
  }
}
```

</details>

</details>

This template demonstrates several key principles:

- **Selective Preservation** - Maintains relevant raw data while omitting noise
- **Progressive Detail** - Layers information from summary through raw data
- **Structured Context** - Formats preserved data for readability
- **Clear Separation** - Distinguishes between interpretation and raw data

Notice how the template:

- Leads with an interpreted summary of state
- Preserves context inline where immediately relevant
- Groups related raw data for easy reference
- Uses code blocks for structured data

Pitfalls to avoid:

- Preserving unnecessary context that adds noise
- Mixing raw and interpreted data confusingly
- Missing critical context needed for verification
- Over-formatting raw data that should stay raw

The goal is to create documents that provide both immediate understanding and the ability to verify or dig deeper when needed. This builds trust with agents while ensuring they have the context needed to make informed decisions.

## Crash Course

You've seen the patterns, now let's learn the techniques. This crash course moves fast and assumes basic markdown knowledge. Each section builds on the previous ones, so code along in sequence!

### Basic Templating

Start with what you know. Markdown is just text, and templates are just strings with holes in them:

```jsonc
{
  "$encode": "markdown",
  // Interpolate arguments into strings
  "$inline": "Hello **{{name}}**! Your score is _{{score}}_/100"
}
```

But markdown has structure. When that structure matters, directives help express it clearly:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "# Setup Guide",
    // Inject arguments with the $ directive
    { "$": "intro_blurb" },
    // Use JSON structure to codify markdown structure
    {
      "$ul": ["Install dependencies", "Configure settings", "Run tests"]
    },
    // Directives generate well-formed output
    { "$blockquote": "Remember to check the logs\nif anything fails" }
  ]
}
```

Pro tip: Use string interpolation for simple cases, directives for structure and complex formatting.

### Working with Lists

Lists are everywhere in markdown. Here's how to generate them from data. Start simple:

```jsonc
{
  "$encode": "markdown",
  // Map array elements directly to list items
  "$ul": { "$": "users.*.name" }
}
```

As your needs grow, the template grows with you:

```jsonc
{
  "$encode": "markdown",
  "$ul": {
    "$each": "$.users",
    "$as": "user",
    // Format each item with consistent structure
    "$inline": [
      "**{{user.name}}** (",
      { "$code": "{{user.role}}" },
      "): _{{user.status}}_"
    ]
  }
}
```

Real lists need flexibility. Control what appears and how it looks:

```jsonc
{
  "$encode": "markdown",
  "$ul": [
    "First item",
    // Show items only when needed
    {
      "$when": "$.show_second",
      "$value": "Second item"
    },
    // Format conditional items consistently
    {
      "$when": "$.error",
      "$inline": ["**Error**: ", { "$code": "{{error}}" }]
    }
  ]
}
```

### Block Structure

Markdown is a hierarchy of blocks and inline elements. Understanding this unlocks powerful compositions:

```jsonc
{
  "$encode": "markdown",
  // $block joins elements with blank lines
  "$block": ["# Title", "Some text", { "$blockquote": "A quote" }, "More text"]
}
```

Inline elements flow together naturally within their blocks:

```jsonc
{
  "$encode": "markdown",
  // $inline joins elements without extra spacing
  "$p": {
    "$inline": [
      "Start of sentence, ",
      { "$em": "emphasized part" },
      ", rest of sentence."
    ]
  }
}
```

The real power comes from combining them. Build complex documents that stay readable:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "## Status",
    {
      "$blockquote": {
        // Mix block and inline for natural text flow
        "$inline": [
          "Region: **{{region}}**\n",
          "Status: ",
          {
            "$when": "$.error",
            "$inline": ["**Error**: ", { "$code": "{{error}}" }]
          },
          {
            "$unless": "$.error",
            "$inline": ["**OK**: ", "_{{status}}_"]
          }
        ]
      }
    }
  ]
}
```

### Data Transformation

Sometimes you need to show the raw data. But even raw data deserves good presentation:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "## API Response",
    {
      "$lang": "json",
      // Switch to JSON encoding for raw data
      "$code": {
        "$encode": "json",
        "$indent": 2,
        "$": "response"
      }
    }
  ]
}
```

Shape the data to tell your story. Show what matters, hide what doesn't:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    "## User Profile",
    { "$code": "{{user.id}}" },
    {
      "$lang": "json",
      // Shape the preserved data
      "$code": {
        "$encode": "json",
        "$indent": 2,
        "name": { "$": "user.name" },
        "email": { "$": "user.email" },
        "roles": { "$": "user.roles" }
      }
    }
  ]
}
```

### Pro Tips

You've seen the pieces. Now let's put them together. Every directive works with every other directive:

```jsonc
{
  "$encode": "markdown",
  "$block": [
    // Conditional formatting maintains consistency
    {
      "$when": "$.error",
      "$blockquote": {
        "$inline": ["**Error**: ", { "$code": "{{error}}" }]
      }
    },
    {
      "$when": "$.warnings",
      "$ul": { "$": "warnings.*.message" }
    }
  ]
}
```

Complex documents need consistent structure. Templates help enforce it:

```jsonc
{
  "$encode": "markdown",
  // Generate sections with consistent structure
  "$block": {
    "$each": "$.sections",
    "$as": "section",
    "$block": [
      "## {{section.title}}",
      { "$blockquote": "{{section.description}}" },
      {
        "$when": "$.section.items",
        "$ul": { "$": "section.items.*.name" }
      }
    ]
  }
}
```

For the finale, let's build something sophisticated that stays readable:

```jsonc
{
  "$encode": "markdown",
  "$ul": {
    "$each": "$.items",
    "$as": "item",
    // Layer conditions for precise control
    "$inline": [
      "{{item.name}}: ",
      {
        "$when": "$.item.error",
        "$inline": ["**Error**: ", { "$code": "{{item.error}}" }]
      },
      {
        "$when": "$.item.warning",
        "$inline": ["_Warning: {{item.warning}}_"]
      },
      {
        "$unless": ["item.error", "item.warning"],
        "$inline": ["OK"]
      }
    ]
  }
}
```

Remember:

- String interpolation for simple cases
- Directives for structure and complex formatting
- `$block` for visual separation
- `$inline` for text flow
- Nest encodings for structured data
- Combine directives for powerful effects

Now go build something cool! 🚀

## Block vs Inline Context

The markdown encoding maintains two distinct processing contexts:

### Block Context

- Default context for document structure
- Elements separated by blank lines
- Used for headings, lists, code blocks
- Access with `$block` directive

### Inline Context

- Used for text flow within blocks
- Elements joined without extra spacing
- Used for emphasis, links, code spans
- Access with `$inline` directive

## Available Directives

### Block Directives

- `$h1` through `$h6` - Section headings
- `$p` - Paragraphs
- `$ul` - Unordered lists
- `$ol` - Ordered lists
- `$blockquote` - Block quotes
- `$code` - Code blocks (with optional `lang`)
- `$hr` - Horizontal rules

### Inline Directives

- `$em` - Emphasis (italics)
- `$strong` - Strong emphasis (bold)
- `$code` - Inline code
- `$a` - Links (with optional `text`)
- `$img` - Images (with optional `alt`)

## Learn More

- [Tool Form Documentation](https://github.com/toolcog/tool-form)
- [Response Engineering Guide](https://github.com/toolcog/tool-form/docs/response-engineering.md)
- [Tool Form RFC](https://github.com/toolcog/tool-form/docs/tool-form-rfc.md)

## License

MIT © Tool Cognition Inc.

[Tool Form]: https://github.com/toolcog/tool-form
[Tool Handle]: https://github.com/toolcog/tool-handle
