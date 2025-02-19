---
title: Tool Form Multipart Encoding
author: Chris Sachs
date: 2024-12
slug: draft-csachs-tool-form-multipart-encoding-00
---

# Tool Form Multipart Encoding

## Abstract

This document specifies a Multipart Encoding for Tool Form that enables hygienic generation of MIME multipart messages from JSON values. The encoding maps JSON structure directly to MIME message structure, handling boundaries, headers, and content types automatically while maintaining proper isolation between parts. This enables Tool Form templates to generate complex multipart payloads - from simple form submissions to nested file uploads - without managing low-level MIME details or risking structural corruption.

## Table of Contents

1. [Introduction](#1-introduction)  
   1.1. [Terminology](#11-terminology)

2. [MIME Parts](#2-mime-parts)  
   2.1. [Part Processing](#21-part-processing)  
   2.2. [Part Encoding](#22-part-encoding)

3. [Multipart Containers](#3-multipart-containers)  
   3.1. [Container Processing](#31-container-processing)  
   3.2. [Message Assembly](#32-message-assembly)  
   3.3. [Container Headers](#33-container-headers)

4. [Security Considerations](#4-security-considerations)  
   4.1. [Boundary Prediction and Collision](#41-boundary-prediction-and-collision)  
   4.2. [Header Field Injection](#42-header-field-injection)

5. [IANA Considerations](#5-iana-considerations)  
   5.1. [Tool Form Encoding Registration](#51-tool-form-encoding-registration)

6. [References](#6-references)  
   6.1. [Normative References](#61-normative-references)  
   6.2. [Informative References](#62-informative-references)

- [Appendix A. Examples](#appendix-a-examples)  
  A.1. [Form Submission](#a1-form-submission)  
  A.2. [File Uploads](#a2-file-uploads)  
  A.3. [Mixed Content](#a3-mixed-content)  
  A.4. [Nested Containers](#a4-nested-containers)

## 1. Introduction

MIME multipart messages [RFC2046] enable APIs to handle complex data exchanges through structured message formats. A single request might need to combine JSON metadata, file content, and form fields - each with its own headers, content type, and encoding requirements. Consider a simple file upload with metadata:

```mime
Content-Type: multipart/form-data; boundary="boundary-1"

--boundary-1
Content-Disposition: form-data; name="metadata"
Content-Type: application/json

{"filename":"report.pdf","timestamp":"2024-03-15T10:30:00Z"}
--boundary-1
Content-Disposition: form-data; name="file"; filename="report.pdf"
Content-Type: application/pdf

[Binary PDF content]
--boundary-1--
```

Generating such messages safely requires careful attention to low-level MIME details. Implementations must handle boundary generation, header formatting, content type selection, and proper message assembly - all while preventing structural corruption and maintaining isolation between parts.

The Tool Form [TOOLFORM] multipart encoding addresses this by mapping JSON structure directly to MIME structure. The complex message above can be expressed ergonomically in JSON as:

```jsonc
{
  "$encode": "multipart",
  "metadata": {
    "$encode": "json",
    "filename": "report.pdf",
    "timestamp": "{{$.now}}"
  },
  "file": {
    "$contentType": "application/pdf",
    "$filename": "report.pdf",
    "$content": { "$": "document" }
  }
}
```

Properties in JSON objects become message parts, with automatic handling of boundaries, headers, and content types. This structural mapping enables templates to express sophisticated multipart messages through natural JSON objects, while ensuring proper isolation between parts and maintaining MIME message integrity.

This encoding operates solely on resolved JSON values - after all Tool Form template processing has completed. It does not participate in template evaluation or affect how directives are processed. Its role is purely to serialize final JSON values into properly structured MIME messages.

### 1.1. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

The terminology of [TOOLFORM] applies, particularly its definitions of Node, Binary Value, and Domain Property. This document uses the following additional terms:

Part Value
: The representation of a MIME part as a JSON property value, either a Primitive Part or a Part Object.

Primitive Part
: A property whose value is a string, number, boolean, or Binary Value. The value becomes the Part Content directly, with Content-Type inferred from the value type.

Part Object
: A property whose value is an object that may contain Domain Properties. The Part Content is either specified by the `$content` Domain Property, or is derived from the object's non-domain properties.

Part Content
: The value to be encoded in a MIME part. For Primitive Parts this is the property value itself. For Part Objects this is either the `$content` value, or the JSON encoding of the object's non-domain properties.

Part Metadata
: The part name, content type, disposition type, filename, and additional headers associated with a MIME part.

Part Headers
: A collection of header field names and values that will be encoded in a MIME part. Certain headers (Content-Type, Content-Disposition) are managed by the encoding and cannot be specified directly.

MIME Part
: A discrete section of a multipart message consisting of headers and content. Each part has its own content type and optional content disposition.

Multipart Container
: An object that generates a complete multipart message with its own boundary. Containers can contain multiple parts and can be nested within other containers.

Binary Value
: A sequence of bytes that should be included in a part without transformation. Binary values are preserved exactly as provided, with appropriate content type and transfer encoding headers.

## 2. MIME Parts

A MIME part is a discrete section of a multipart message with an exact physical structure defined in [RFC2046]. Each property in a JSON object becomes exactly one MIME part, with the following structure:

```
--{boundary}\r\n
{headers}\r\n
\r\n
{content}\r\n
```

Every part follows this precise structure: a boundary line, followed by headers, followed by an empty line, followed by content. The boundary line delimits the start of the part. The headers specify the content type, disposition, and other attributes. The empty line separates the headers from the content. And the content block contains the part's payload.

### 2.1. Part Processing

Part Processing maps JSON properties to MIME parts through a direct structural correspondence: a property's value determines the part content, while its name and any Domain Properties determine the part metadata. Consider a simple profile submission:

```jsonc
{
  // Each property becomes a part
  "name": "Alice Chen",
  "photo": {
    // Domain Properties configure a part
    "$contentType": "image/jpeg", // Used as Content-Type
    "$filename": "photo.jpg", // Included in Content-Disposition
    "$content": "[Binary data]" // Becomes the Part Content
  }
}
```

This natural mapping produces two MIME parts:

```mime
--boundary
Content-Type: text/plain; charset=utf-8
Content-Disposition: form-data; name="name"

Alice Chen
--boundary
Content-Type: image/jpeg
Content-Disposition: form-data; name="photo"; filename="photo.jpg"

[Binary data]
--boundary--
```

Implementations MUST process each property as follows:

1. Determine the Part Content:

   - If the property value is null or an Undefined Value:
     - Do not generate a MIME Part for the property
   - If the property value is an object:
     - The `$content` Domain Property specifies the Part Content directly
     - Otherwise, collect the non-domain properties as the Part Content
   - Otherwise, use the property value directly as the Part Content

2. Collect the Part Metadata:

   - Use the property name as the part name
   - If `$contentType` is present, record it as the content type
   - If `$disposition` is present, record it as the disposition type
   - If `$filename` is present, record it as the filename
   - If `$headers` is present, collect them as additional headers
     - Filter out the managed Content-Type and Content-Disposition headers, if present

The collected Part Content and Part Metadata fully specify the MIME part to be generated. While some metadata fields may be absent, Part Encoding will ensure each part has appropriate headers and content type based on the available information.

### 2.2. Part Encoding

Part Encoding transforms Part Content and Part Metadata into a complete MIME part. This transformation occurs in three stages: encoding the headers, encoding the content, and assembling the final part. Each stage follows precise rules to ensure valid MIME structure.

#### 2.2.1. Header Encoding

Header encoding produces a block of RFC 822 header fields from Part Metadata. Implementations MUST:

1. Format basic headers:

   - Each header field MUST use the form "name: value\r\n"
   - Header values MUST NOT contain control characters (0x00-0x1F, 0x7F) except HTAB (0x09)
   - Additional headers from Part Metadata appear first

2. Generate the Content-Type header:

   - If specified in Part Metadata, use that content type
   - Otherwise for strings, numbers, and booleans: use "text/plain; charset=utf-8"
   - Otherwise for objects: use "application/json"
   - Otherwise for Binary Values: use "application/octet-stream"

3. Generate the Content-Disposition header:

   - Begin with the disposition type from Part Metadata, defaulting to "form-data"
   - Add the required name parameter: '; name="value"'
   - If a filename exists in Part Metadata, add: '; filename="value"'
   - Escape quotation marks and backslashes in parameter values with a backslash

#### 2.2.2. Content Encoding

Content encoding transforms Part Content into a sequence of bytes. Implementations MUST:

1. For null or an Undefined Values:

   - Produce an empty byte sequence

2. For Binary Values:

   - Use the bytes directly, without modification

3. For strings, numbers, and booleans:

   - Encode the value as UTF-8 text

4. For all other values (objects and arrays):

   - Encode as UTF-8 JSON text
   - Exclude any Domain Properties from the encoded result

#### 2.2.3. Part Assembly

Part assembly combines the encoded headers and content into a complete MIME part. Implementations MUST:

1. Start with the boundary line:

   - The exact sequence "--{boundary}\r\n"

2. Append the headers block:

   - All header fields in sequence
   - Additional headers first
   - Content-Type and Content-Disposition headers last
   - A blank line ("\r\n") after the last header

3. Append the content:

   - The encoded content bytes
   - A final line ending ("\r\n"), UNLESS the Content-Type begins with "multipart/"

The resulting MIME part follows the exact structure specified in section 2, with proper line endings and boundary markers ensuring valid MIME format.

## 3. Multipart Containers

A multipart container is an object that generates a complete MIME message from its properties. Each non-domain property becomes a MIME part, encoded according to section 2. The container coordinates these parts, providing the boundary that ensures their isolation, establishing the multipart subtype, and maintaining headers that describe the message itself.

Consider a simple form submission:

```jsonc
{
  "$encode": "multipart", // Marks this object as a container
  "$subtype": "form-data", // Configures the multipart subtype
  "$headers": {
    // Provides payload metadata
    "X-Submission-Type": "profile"
  },
  "user": {
    // Ordinary object properties generate a JSON part
    "name": "Alice Chen",
    "email": "alice@example.com"
  },
  "photo": {
    // Domain properties customize the part
    "$contentType": "image/jpeg",
    "$filename": "photo.jpg",
    "$content": "[Binary data]"
  }
}
```

This container coordinates the generation of a complete MIME message:

```mime
Content-Type: multipart/form-data; boundary=boundary-1
X-Submission-Type: profile

--boundary-1
Content-Type: application/json
Content-Disposition: form-data; name="user"

{"name":"Alice Chen","email":"alice@example.com"}
--boundary-1
Content-Type: image/jpeg
Content-Disposition: form-data; name="photo"; filename="photo.jpg"

[Binary data]
--boundary-1--
```

Containers serve as orchestrators, creating the environment in which parts exist while maintaining clear separation between container and part concerns. A container's Domain Properties configure the message structure, while its non-domain properties supply the message content. This separation enables containers to focus purely on coordination, delegating all part-specific processing to the mechanisms defined in section 2.

The following sections specify how containers process their properties into parts, assemble those parts into a complete message, and provide metadata about the resulting message. Properties that become parts follow exactly the same processing and encoding rules defined in section 2, while operating within the boundary context established by their containing message.

### 3.1. Container Processing

Container Processing determines which properties of a multipart container become MIME parts. Implementations MUST process container properties as follows:

1. Identify Domain Properties:

   - The `$subtype` Domain Property specifies the multipart subtype
   - The `$headers` Domain Property provides additional message headers
   - Domain Properties do not generate MIME parts

2. Establish boundary context:

   - Generate a boundary string that does not appear in any part content
   - Use this boundary in the container's Content-Type header
   - Provide this boundary for Part Assembly of each part

3. Process remaining properties in property order:

   - For each non-domain property:
     - Process the property according to section 2.1
     - If Part Processing generates a part, preserve it for assembly
     - Otherwise, skip the property entirely

The generated parts maintain their property order and share the container's boundary context. These parts and their boundary form the input to Message Assembly.

### 3.2. Message Assembly

Message Assembly combines the generated parts into a complete MIME message. Implementations MUST assemble the message as follows:

1. Assemble the message body:

   - Include each generated part in property order
   - Each part MUST follow the assembly rules specified in section 2.2.3
   - Parts MUST be separated only by their boundary lines
   - No content may appear between parts

2. Append the final boundary:

   - Use the exact sequence "--{boundary}--\r\n"
   - This sequence MUST appear exactly once
   - No content may follow the final boundary

The resulting message body contains all parts in sequence, properly delimited by boundaries, and terminated by the final boundary marker. This body, combined with the container headers specified in section 3.3, forms the complete MIME message.

### 3.3. Container Headers

Container Headers provide metadata about the complete MIME message through Node Headers on the encoded value. Implementations MUST generate these headers as follows:

1. Generate the Content-Type header:

   - Use the format "multipart/{subtype}; boundary={boundary}"
   - The subtype comes from the `$subtype` Domain Property
   - If no subtype is specified, use "form-data"
   - The boundary MUST match the one used for Message Assembly

2. Process additional headers:

   - Collect headers from the `$headers` Domain Property
   - Header values MUST NOT contain control characters (0x00-0x1F, 0x7F) except HTAB (0x09)
   - The Content-Type header cannot be overridden by additional headers

The resulting headers become Node Headers on the encoded value, providing format-specific information about the multipart message. These headers enable containing protocols to properly handle the encoded message.

## 4. Security Considerations

The multipart encoding operates solely on resolved JSON values after all Tool Form template processing has completed. While general MIME security considerations are addressed in [RFC2046], this encoding presents two specific security considerations:

### 4.1. Boundary Prediction and Collision

Multipart message security depends on proper boundary isolation. While this encoding maintains isolation through structural separation rather than content scanning, implementations must still ensure that:

1. Generated boundaries are sufficiently random to prevent prediction
2. Nested containers receive distinct boundaries
3. Boundary length is sufficient to prevent probabilistic collisions

### 4.2. Header Field Injection

Header formatting in multipart messages requires particular attention to parameter encoding:

1. Content-Disposition parameters must properly escape quotes and backslashes
2. Implementations must maintain proper header field ordering
3. Header field values must be validated before emission
4. Line endings must be strictly controlled

Note that general concerns about template processing, JSONPath evaluation, and resource access are addressed by [TOOLFORM] and do not apply directly to this encoding.

## 5. IANA Considerations

### 5.1. Tool Form Encoding Registration

IANA is requested to register the following encoding in the "Tool Form Encoding" registry:

Name: multipart  
Description: Transforms JSON values into MIME multipart messages, enabling hygienic generation of complex multipart payloads while maintaining proper boundary isolation and MIME structure  
Media Type: multipart/\*  
Reference: This document

## 6. References

### 6.1. Normative References

[RFC822] Crocker, D., "Standard for the Format of ARPA Internet Text Messages",  
RFC 822, DOI 10.17487/RFC0822, August 1982,  
<https://www.rfc-editor.org/info/rfc822>.

[RFC2046] Freed, N. and N. Borenstein, "Multipurpose Internet Mail Extensions (MIME) Part Two: Media Types",  
RFC 2046, DOI 10.17487/RFC2046, November 1996,  
<https://www.rfc-editor.org/info/rfc2046>.

[TOOLFORM] Sachs, C., "Tool Form",  
draft-csachs-tool-form-00, December 2024,  
<https://toolcog.com/specs/drafts/tool-form/draft-00>.

### 6.2. Informative References

[RFC7578] Masinter, L., "Returning Values from Forms: multipart/form-data",  
RFC 7578, DOI 10.17487/RFC7578, July 2015,  
<https://www.rfc-editor.org/info/rfc7578>.

## Appendix A. Examples

### A.1. Form Submission

This example demonstrates how Tool Form's property structure naturally maps to multipart form submissions. The template handles a typical profile update with both form fields and file upload:

```jsonc
{
  "$encode": "multipart",
  "$headers": {
    "X-CSRF-Token": "{{$.csrf_token}}"
  },
  // Basic form fields map directly to parts
  "name": { "$": "profile.name" },
  "email": { "$": "profile.email" },
  // Structured data automatically serializes as JSON
  "settings": {
    "theme": { "$": "profile.theme" },
    "notifications": { "$": "profile.notifications" },
    "timezone": { "$": "profile.timezone" }
  },
  // File upload with metadata
  "avatar": {
    "$contentType": "image/jpeg",
    "$filename": "avatar.jpg",
    "$content": { "$": "profile.avatar" }
  }
}
```

This template produces a standards-compliant multipart form submission:

```mime
Content-Type: multipart/form-data; boundary=xj8w5pu9f4kr2bny7mvh3tdc
X-CSRF-Token: abc123

--xj8w5pu9f4kr2bny7mvh3tdc
Content-Type: text/plain; charset=utf-8
Content-Disposition: form-data; name="name"

Alice Chen
--xj8w5pu9f4kr2bny7mvh3tdc
Content-Type: text/plain; charset=utf-8
Content-Disposition: form-data; name="email"

alice@example.com
--xj8w5pu9f4kr2bny7mvh3tdc
Content-Type: application/json
Content-Disposition: form-data; name="settings"

{"theme":"dark","notifications":true,"timezone":"America/Los_Angeles"}
--xj8w5pu9f4kr2bny7mvh3tdc
Content-Type: image/jpeg
Content-Disposition: form-data; name="avatar"; filename="avatar.jpg"

[Binary JPEG data]
--xj8w5pu9f4kr2bny7mvh3tdc--
```

The encoding ensures that:

- Form fields become properly formatted parts
- Structured data serializes as JSON automatically
- File uploads include correct headers and content type
- The resulting message is valid multipart/form-data

This direct structural mapping enables templates to express form submissions naturally while ensuring proper MIME formatting and part isolation.

### A.2. File Uploads

This example demonstrates how Tool Form handles complex document uploads. The template manages a CMS submission with both primary and supporting documents, each requiring specific content types and metadata:

```jsonc
{
  "$encode": "multipart",
  // Document metadata as structured JSON
  "metadata": {
    "$encode": "json",
    "type": "contract_package",
    "documents": [
      {
        "id": "main",
        "type": "contract",
        "version": "1.0",
        "status": "draft"
      },
      {
        "id": "appendix",
        "type": "supporting",
        "references": ["main"]
      }
    ]
  },
  // Primary document with full metadata
  "contract": {
    "$contentType": "application/pdf",
    "$disposition": "attachment",
    "$filename": "contract.pdf",
    "$headers": {
      "Content-MD5": { "$": "files.contract.checksum" },
      "X-Document-Version": "1.0"
    },
    "$content": { "$": "files.contract.content" }
  },
  // Supporting documents through iteration
  "attachments": {
    "$each": "files.supporting.*",
    "$as": "doc",
    "$value": {
      "$contentType": { "$": "doc.mime_type" },
      "$disposition": "attachment",
      "$filename": { "$": "doc.filename" },
      "$headers": {
        "Content-MD5": { "$": "doc.checksum" }
      },
      "$content": { "$": "doc.content" }
    }
  }
}
```

This template produces a complete multipart upload with proper headers and content types:

```mime
Content-Type: multipart/form-data; boundary=nx7dk3q5tp8mv2yfh9wc4jl6

--nx7dk3q5tp8mv2yfh9wc4jl6
Content-Type: application/json
Content-Disposition: form-data; name="metadata"

{"type":"contract_package","documents":[{"id":"main","type":"contract","version":"1.0","status":"draft"},{"id":"appendix","type":"supporting","references":["main"]}]}
--nx7dk3q5tp8mv2yfh9wc4jl6
Content-Type: application/pdf
Content-Disposition: attachment; name="contract"; filename="contract.pdf"
Content-MD5: d41d8cd98f00b204e9800998ecf8427e
X-Document-Version: 1.0

[Binary PDF content]
--nx7dk3q5tp8mv2yfh9wc4jl6
Content-Type: application/msword
Content-Disposition: attachment; name="attachments"; filename="appendix.doc"
Content-MD5: b4d168b48157c99f1fa32bc4eac7d498

[Binary DOC content]
--nx7dk3q5tp8mv2yfh9wc4jl6--
```

The encoding ensures that:

- Each file has appropriate content type and disposition
- Filenames are properly encoded in headers
- Document metadata maintains structural relationships
- Custom headers provide document-specific information

This pattern enables templates to handle complex document uploads while maintaining proper MIME structure and file metadata.

### A.3. Mixed Content

This example demonstrates how Tool Form handles messages containing multiple independent but related content types. The template generates a rich email message with plain text, HTML, and attachments:

```jsonc
{
  "$encode": "multipart",
  "$subtype": "mixed",
  // Email body with both text and HTML versions
  "body": {
    "$encode": "multipart",
    "$subtype": "alternative",
    "text": {
      // Specifies the content type of the resulting part
      "$contentType": "text/plain; charset=utf-8",
      "$content": {
        // The value of $use becomes the output value
        "$use": [
          "Monthly Report Summary\n",
          "Revenue: ${{$.data.revenue}}",
          "Growth: {{$.data.growth}}%\n",
          "See attached report for details."
        ],
        // Joins the array into a newline-separated string
        "$join": "\n"
      }
    },
    "html": {
      "$contentType": "text/html; charset=utf-8",
      "$content": {
        "$encode": "html",
        "body": [
          { "$h1": "Monthly Report Summary" },
          { "$p": ["Revenue: ", { "$strong": "${{$.data.revenue}}" }] },
          { "$p": ["Growth: ", { "$strong": "{{$.data.growth}}%" }] },
          { "$p": { "$em": "See attached report for details." } }
        ]
      }
    }
  },
  // Generated report in multiple formats
  "report": {
    "$contentType": "application/pdf",
    "$disposition": "attachment",
    "$filename": "report.pdf",
    "$content": { "$": "report.pdf" }
  },
  "data": {
    "$contentType": "application/json",
    "$disposition": "attachment",
    "$filename": "report-data.json",
    "$content": {
      "$encode": "json",
      "$indent": true,
      "metrics": { "$": "data" }
    }
  },
  // Supporting chart image
  "chart": {
    "$contentType": "image/png",
    "$disposition": "inline",
    "$filename": "growth-chart.png",
    "$content": { "$": "chart.png" }
  }
}
```

This template produces a complete MIME message with properly structured parts:

```mime
Content-Type: multipart/mixed; boundary=kw9x2vn5hj8m4tpf6qbc3rdy

--kw9x2vn5hj8m4tpf6qbc3rdy
Content-Type: multipart/alternative; boundary=g7l3wm2xk9n5vpf8htbc4qdy

--g7l3wm2xk9n5vpf8htbc4qdy
Content-Type: text/plain; charset=utf-8
Content-Disposition: inline

Monthly Report Summary

Revenue: $1,234,567
Growth: 23%

See attached report for details.
--g7l3wm2xk9n5vpf8htbc4qdy
Content-Type: text/html; charset=utf-8
Content-Disposition: inline

<h1>Monthly Report Summary</h1>
<p>Revenue: <strong>$1,234,567</strong></p>
<p>Growth: <strong>23%</strong></p>
<p><em>See attached report for details.</em></p>
--g7l3wm2xk9n5vpf8htbc4qdy--

--kw9x2vn5hj8m4tpf6qbc3rdy
Content-Type: application/pdf
Content-Disposition: attachment; filename="report.pdf"

[Binary PDF content]
--kw9x2vn5hj8m4tpf6qbc3rdy
Content-Type: application/json
Content-Disposition: attachment; filename="report-data.json"

{
  "metrics": {
    "revenue": 1234567,
    "growth": 23,
    "trends": {
      "q1": 18,
      "q2": 23
    }
  }
}
--kw9x2vn5hj8m4tpf6qbc3rdy
Content-Type: image/png
Content-Disposition: inline; filename="growth-chart.png"

[Binary PNG content]
--kw9x2vn5hj8m4tpf6qbc3rdy--
```

The encoding ensures that:

- Each format is properly encoded with correct headers
- Alternative versions are grouped appropriately
- Attachments include proper content types and dispositions
- Nested multipart sections maintain distinct boundaries

This pattern enables templates to generate sophisticated multi-format messages while maintaining proper MIME structure and content relationships.

### A.4. Nested Containers

This example demonstrates how Tool Form's composition model enables sophisticated message structures. The template handles a complex API response containing both form data and mixed content:

```jsonc
{
  "$encode": "multipart",
  "$subtype": "form-data",
  // API response metadata
  "status": "success",
  "timestamp": "{{$.now}}",
  // Analysis results in multiple formats
  "analysis": {
    "$encode": "multipart",
    "$subtype": "mixed",
    // Summary text with multiple versions
    "summary": {
      "$encode": "multipart",
      "$subtype": "alternative",
      "text": {
        "$content": {
          "$use": [
            "Analysis Results",
            "-------------",
            "Model: {{$.model.name}} v{{$.model.version}}",
            "Confidence: {{$.results.confidence}}%",
            "",
            "Key Findings:",
            "{{$.results.findings.*}}"
          ],
          "$join": "\n"
        }
      },
      "html": {
        "$encode": "html",
        "body": [
          { "$h1": "Analysis Results" },
          { "$p": [
            "Model: ",
            { "$code": "{{$.model.name}}" },
            " v{{$.model.version}}"
          ]},
          { "$p": [
            "Confidence: ",
            { "$strong": "{{$.results.confidence}}%" }
          ]},
          { "$h2": "Key Findings" },
          { "$ul": { "$": "results.findings.*" }}
        ]
      }
    },
    // Generated visualizations
    "chart": {
      "$contentType": "image/svg+xml",
      "$disposition": "inline",
      "$filename": "analysis.svg",
      "$content": { "$": "results.chart" }
    },
    // Raw data for further processing
    "data": {
      "$contentType": "application/json",
      "$disposition": "attachment",
      "$filename": "analysis.json",
      "$content": {
        "$encode": "json",
        "$indent": true,
        "model": { "$": "model" },
        "results": { "$": "results" }
      }
    }
  },
  // Supporting documents from analysis
  "documents": {
    "$encode": "multipart",
    "$subtype": "mixed",
    "$each": "results.documents.*",
    "$as": "doc",
    "$value": {
      "$contentType": { "$": "doc.mime_type" },
      "$disposition": "attachment",
      "$filename": { "$": "doc.filename" },
      "$headers": {
        "Content-MD5": { "$": "doc.checksum" },
        "X-Document-Source": { "$": "doc.source" }
      },
      "$content": { "$": "doc.content" }
    }
  }
}
```

This template produces a complete multipart response with nested structure:

```mime
Content-Type: multipart/form-data; boundary=p2m7v4wy8kx5nqt9hbcj3rfl

--p2m7v4wy8kx5nqt9hbcj3rfl
Content-Type: text/plain; charset=utf-8
Content-Disposition: form-data; name="status"

success
--p2m7v4wy8kx5nqt9hbcj3rfl
Content-Type: text/plain; charset=utf-8
Content-Disposition: form-data; name="timestamp"

2024-03-15T14:30:00Z
--p2m7v4wy8kx5nqt9hbcj3rfl
Content-Type: multipart/mixed; boundary=t8f2k6nx9wm3vqy7hbcl4rpd
Content-Disposition: form-data; name="analysis"

--t8f2k6nx9wm3vqy7hbcl4rpd
Content-Type: multipart/alternative; boundary=h5j9m2wx4vq8nkt6bcfl3rpy

--h5j9m2wx4vq8nkt6bcfl3rpy
Content-Type: text/plain; charset=utf-8
Content-Disposition: inline

Analysis Results
-------------
Model: gpt-4 v2.1
Confidence: 97%

Key Findings:
- Pattern indicates strong seasonal trend
- Anomaly detected in Q3 data
- Forecast suggests 15% growth
--h5j9m2wx4vq8nkt6bcfl3rpy
Content-Type: text/html; charset=utf-8
Content-Disposition: inline

<h1>Analysis Results</h1>
<p>Model: <code>gpt-4</code> v2.1</p>
<p>Confidence: <strong>97%</strong></p>
<h2>Key Findings</h2>
<ul>
<li>Pattern indicates strong seasonal trend</li>
<li>Anomaly detected in Q3 data</li>
<li>Forecast suggests 15% growth</li>
</ul>
--h5j9m2wx4vq8nkt6bcfl3rpy--

--t8f2k6nx9wm3vqy7hbcl4rpd
Content-Type: image/svg+xml
Content-Disposition: inline; filename="analysis.svg"

[SVG visualization content]
--t8f2k6nx9wm3vqy7hbcl4rpd
Content-Type: application/json
Content-Disposition: attachment; filename="analysis.json"

{
  "model": {
    "name": "gpt-4",
    "version": "2.1"
  },
  "results": {
    "confidence": 97,
    "findings": [
      "Pattern indicates strong seasonal trend",
      "Anomaly detected in Q3 data",
      "Forecast suggests 15% growth"
    ]
  }
}
--t8f2k6nx9wm3vqy7hbcl4rpd--

--p2m7v4wy8kx5nqt9hbcj3rfl
Content-Type: multipart/mixed; boundary=m3k7w9vx5qt2nfy8hbcl4rpj
Content-Disposition: form-data; name="documents"

--m3k7w9vx5qt2nfy8hbcl4rpj
Content-Type: application/pdf
Content-Disposition: attachment; filename="report.pdf"
Content-MD5: e8b98c3d2a072f89b6294359628e9c4f
X-Document-Source: analysis-engine

[Binary PDF content]
--m3k7w9vx5qt2nfy8hbcl4rpj
Content-Type: application/vnd.ms-excel
Content-Disposition: attachment; filename="data.xlsx"
Content-MD5: f7c91b4e3d5a163h8a7385260739d5e2
X-Document-Source: data-warehouse

[Binary Excel content]
--m3k7w9vx5qt2nfy8hbcl4rpj--
--p2m7v4wy8kx5nqt9hbcj3rfl--
```

The encoding ensures that:
- Each container maintains its own boundary context
- Parts are properly nested with clear structure
- Content types and dispositions are appropriate for each part
- Headers and metadata are preserved at each level

This pattern demonstrates how Tool Form's composition model enables complex message structures while maintaining clean separation between different content types and purposes.
