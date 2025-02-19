# Tool Form Multipart Encoder

[![Package](https://img.shields.io/badge/npm-0.1.0-ae8c7e?labelColor=3b3a37)](https://www.npmjs.com/package/@tool-form/multipart)
[![License](https://img.shields.io/badge/license-MIT-ae8c7e?labelColor=3b3a37)](https://opensource.org/licenses/MIT)

Transform JSON templates into multipart MIME messages that APIs can understand and process. Built for [Tool Form] and [Tool Handle].

## Why a Multipart Encoding?

APIs often expect complex multipart messages for everything from basic form submissions to file uploads. While these messages enable rich content types and mixed data formats, their low-level MIME structure makes them challenging to generate reliably, especially for AI tools.

The Tool Form multipart encoding enables you to transform raw API responses into properly structured MIME messages that:

- Handle file uploads with proper content types and dispositions
- Support nested multipart containers for complex data
- Manage MIME boundaries automatically
- Preserve binary data without corruption

By mapping MIME concepts to natural JSON structures, your tools can generate complex multipart messages without worrying about boundary generation, header formatting, or content encoding rules.

## Installation

```bash
npm install @tool-form/multipart
```

## Quick Start

The Tool Form multipart encoding enables templates to generate properly structured MIME messages from JSON objects. It provides a set of domain properties that control MIME headers and content while integrating naturally with Tool Form's template features.

```typescript
import { parseTemplate } from "tool-form";
import { multipartEncoding } from "@tool-form/multipart";

// Transform API payloads into multipart form data
const template = await parseTemplate(
  {
    $encode: "multipart",
    // Each property becomes a separate MIME part
    username: { $: "user.name" },
    email: { $: "user.email" },
    // Binary content with format-specific headers
    avatar: {
      $contentType: "image/png",
      $filename: "avatar.png",
      $content: { $: "user.avatar" }
    },
    // Nested JSON data automatically serialized
    preferences: {
      $encode: "json",
      theme: "dark",
      notifications: true
    }
  },
  { encodings: [multipartEncoding] }
);
```

<details>
<summary><strong>Example Output</strong></summary>

```mime
Content-Type: multipart/form-data; boundary=example-boundary

--example-boundary
Content-Disposition: form-data; name="username"
Content-Type: text/plain; charset=utf-8

alice-chen
--example-boundary
Content-Disposition: form-data; name="email"
Content-Type: text/plain; charset=utf-8

alice@example.com
--example-boundary
Content-Disposition: form-data; name="avatar"; filename="avatar.png"
Content-Type: image/png

[Binary content]
--example-boundary
Content-Disposition: form-data; name="preferences"
Content-Type: application/json

{"theme":"dark","notifications":true}
--example-boundary--
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "user": {
    "name": "alice-chen",
    "email": "alice@example.com",
    "avatar": "[Binary content]"
  }
}
```

</details>

</details>

The encoding works seamlessly with Tool Form's transformation directives:

- String interpolation via `{{expression}}` syntax
- Data access through the `$` directive
- Control flow with `$when`, `$if`, and `$each`
- Nested encodings like `$encode: "json"` within parts

Domain properties control MIME-specific aspects:

- `$contentType` - Sets the MIME type for a part
- `$filename` - Adds a filename parameter to Content-Disposition
- `$disposition` - Controls the Content-Disposition type
- `$headers` - Adds custom MIME headers
- `$content` - Specifies the part content directly

For simple parts, standard JSON values with string interpolation is preferred over domain properties.

### Next Steps

- See [Usage Patterns](#usage-patterns) for common usage patterns
- Learn about [MIME Concepts](#mime-concepts) for proper structure
- Check the [Special Properties](#special-properties) reference

## Usage Patterns

The patterns below demonstrate how to transform structured data into properly formatted MIME messages. Each pattern addresses a fundamental challenge in multipart generation: handling file uploads, managing content types, structuring nested data, and preserving binary content.

### 1. Form data submission

APIs that expect `multipart/form-data` require specific MIME formatting for each field. The template structure maps directly to the resulting MIME message parts.

```jsonc
{
  "$encode": "multipart",
  // Simple fields become text/plain parts
  "username": { "$": "user.name" },
  "email": { "$": "user.email" },
  // Arrays become JSON-encoded parts
  "roles": { "$": "user.roles" },
  // Objects automatically serialize to JSON
  "preferences": {
    "theme": "dark",
    "notifications": true
  },
  // Parts only appear when their condition is met
  "company": {
    "$when": "$.user.type == 'business'",
    "$": "user.company"
  }
}
```

<details>

<summary><strong>Example Output</strong></summary>

```mime
Content-Type: multipart/form-data; boundary=example-boundary

--example-boundary
Content-Disposition: form-data; name="username"
Content-Type: text/plain; charset=utf-8

john.doe
--example-boundary
Content-Disposition: form-data; name="email"
Content-Type: text/plain; charset=utf-8

john@example.com
--example-boundary
Content-Disposition: form-data; name="roles"
Content-Type: application/json

["admin","developer"]
--example-boundary
Content-Disposition: form-data; name="preferences"
Content-Type: application/json

{"theme":"dark","notifications":true}
--example-boundary
Content-Disposition: form-data; name="company"
Content-Type: text/plain; charset=utf-8

Acme Corp
--example-boundary--
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "user": {
    "name": "john.doe",
    "email": "john@example.com",
    "roles": ["admin", "developer"],
    "type": "business",
    "company": "Acme Corp"
  }
}
```

</details>

</details>

This template demonstrates several key principles:

- Scalar values become `text/plain` parts
- Objects and arrays serialize to `application/json`
- Content types are inferred from values
- Conditional parts integrate naturally

The encoding handles proper MIME formatting while maintaining clear relationships between form fields and their values.

### 2. File upload handling

File uploads require specific headers and content handling. Your template should clearly specify content types, filenames, and dispositions while ensuring binary data is preserved correctly.

```jsonc
{
  "$encode": "multipart",
  // Metadata fields provide context
  "type": "document",
  "category": { "$": "document.type" },
  // Single file upload with headers
  "file": {
    "$contentType": "application/pdf",
    "$filename": { "$": "document.name" },
    "$disposition": "attachment",
    "$content": { "$": "document.content" }
  },
  // Multiple file upload through iteration
  "attachments": {
    "$each": "$.documents.*",
    "$as": "doc",
    "$value": {
      "$contentType": { "$": "doc.mime_type" },
      "$filename": { "$": "doc.name" },
      "$content": { "$": "doc.content" }
    }
  }
}
```

<details>

<summary><strong>Example Output</strong></summary>

```mime
Content-Type: multipart/form-data; boundary=example-boundary

--example-boundary
Content-Disposition: form-data; name="type"
Content-Type: text/plain; charset=utf-8

document
--example-boundary
Content-Disposition: form-data; name="category"
Content-Type: text/plain; charset=utf-8

contract
--example-boundary
Content-Disposition: attachment; name="file"; filename="main.pdf"
Content-Type: application/pdf

[Binary PDF content]
--example-boundary
Content-Disposition: attachment; name="attachments"; filename="appendix-a.png"
Content-Type: image/png

[Binary PNG content]
--example-boundary
Content-Disposition: attachment; name="attachments"; filename="appendix-b.png"
Content-Type: image/png

[Binary PNG content]
--example-boundary--
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "document": {
    "type": "contract",
    "name": "main.pdf",
    "content": "[Binary PDF content]"
  },
  "documents": [
    {
      "name": "appendix-a.png",
      "mime_type": "image/png",
      "content": "[Binary PNG content]"
    },
    {
      "name": "appendix-b.png",
      "mime_type": "image/png",
      "content": "[Binary PNG content]"
    }
  ]
}
```

</details>

</details>

This pattern shows how to:

- Set proper content types for files
- Handle filenames and dispositions
- Preserve binary content
- Upload multiple files

The encoding ensures each file part has appropriate headers while maintaining content integrity.

### 3. Nested multipart messages

Complex APIs often need both structured data and file content in the same request. Nested multipart containers enable clean separation of concerns while maintaining proper MIME structure.

```jsonc
{
  "$encode": "multipart",
  "$subtype": "form-data",
  // Metadata as JSON for structure
  "metadata": {
    "$encode": "json",
    "id": { "$": "request.id" },
    "timestamp": { "$": "request.time" }
  },
  // Nested container for mixed content
  "content": {
    // Nested multipart containers maintain their own boundaries
    "$encode": "multipart",
    "$subtype": "mixed",
    // Original document with headers
    "document": {
      "$contentType": { "$": "document.mime_type" },
      "$filename": { "$": "document.name" },
      "$content": { "$": "document.content" }
    },
    // Additional metadata as JSON
    "info": {
      "$contentType": "application/json",
      "$content": {
        "title": { "$": "document.title" },
        "author": { "$": "document.author" }
      }
    }
  }
}
```

<details>

<summary><strong>Example Output</strong></summary>

```mime
Content-Type: multipart/form-data; boundary=outer-boundary

--outer-boundary
Content-Disposition: form-data; name="metadata"
Content-Type: application/json

{"id":"doc-123","timestamp":"2024-03-15T10:30:00Z"}
--outer-boundary
Content-Disposition: form-data; name="content"
Content-Type: multipart/mixed; boundary=inner-boundary

--inner-boundary
Content-Disposition: form-data; name="document"; filename="report.docx"
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document

[Binary DOCX content]
--inner-boundary
Content-Disposition: form-data; name="info"
Content-Type: application/json

{"title":"Q1 Report","author":"John Smith"}
--inner-boundary--
--outer-boundary--
```

<details>

<summary><strong>Template Arguments</strong></summary>

```jsonc
{
  "request": {
    "id": "doc-123",
    "time": "2024-03-15T10:30:00Z"
  },
  "document": {
    "name": "report.docx",
    "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "content": "[Binary DOCX content]",
    "title": "Q1 Report",
    "author": "John Smith"
  }
}
```

</details>

</details>

This pattern demonstrates:

- Nested multipart containers
- Mixed content types
- Clean separation of concerns
- Proper boundary handling

Each container maintains its own boundaries while preserving the overall message structure.

## MIME Concepts

Understanding MIME message structure helps create more maintainable templates. Here are the key concepts:

### Message structure

A multipart message consists of:

- A Content-Type header with boundary
- One or more body parts separated by the boundary
- Each part having its own headers and content

The encoding handles boundaries automatically:

```jsonc
{
  "$encode": "multipart",
  "$subtype": "form-data", // Controls Content-Type
  "field1": "value1", // Simple part
  "field2": {
    // Part with headers
    "$contentType": "text/plain",
    "$content": "value2"
  }
}
```

### Content types

Parts use content types appropriate to their data:

- Strings → `text/plain`
- Objects → `application/json`
- Binary → Based on `$contentType`

```jsonc
{
  "$encode": "multipart",
  "text": "plain text", // text/plain
  "data": { "key": "value" }, // application/json
  "file": {
    "$contentType": "image/png",
    "$content": "[Binary]"
  }
}
```

### Dispositions

Control how parts are presented:

- `form-data` - Default for form submissions
- `attachment` - For downloadable content
- `inline` - For displayed content

```jsonc
{
  "$encode": "multipart",
  "field": {
    "$disposition": "form-data",
    "$content": "value"
  },
  "file": {
    "$disposition": "attachment",
    "$filename": "doc.pdf",
    "$content": "[Binary]"
  }
}
```

## Special Properties

Domain properties control MIME part generation:

### Part properties

- `$contentType` - MIME type for the part
- `$filename` - Filename for attachments
- `$disposition` - Content-Disposition value
- `$headers` - Additional MIME headers
- `$content` - Part content (overrides value)

### Container properties

- `$subtype` - Multipart subtype (default: form-data)
- `$boundary` - Custom boundary (optional)

## License

MIT © Tool Cognition Inc.

[Tool Form]: https://github.com/toolcog/tool-form
[Tool Handle]: https://github.com/toolcog/tool-handle
