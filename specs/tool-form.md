---
title: Tool Form
author: Chris Sachs
date: 2024-12
slug: draft-csachs-tool-form-00
---

# Tool Form

## Abstract

This document specifies Tool Form, a hygienic transformation model that enables AI tools to generate fully encoded protocol payloads without understanding low-level technical details. While AI systems excel at determining what operations to perform, translating semantic intent into precise technical formats remains a persistent challenge. Tool Form addresses this by providing a secure transformation model that operates directly on JSON values, maintaining strict boundaries between semantic parameters and their technical representations. Through extensible directives and pluggable encodings, it enables AI tools to reliably generate many target formats while preserving structural guarantees throughout the transformation process.

## Table of Contents

1. [Introduction](#1-introduction)  
   1.1. [Purpose](#11-purpose)  
   1.2. [Scope](#12-scope)  
   1.3. [Terminology](#13-terminology)

2. [Processing Model](#2-processing-model)  
   2.1. [Nodes](#21-nodes)  
   2.2. [Directives](#22-directives)  
   2.3. [Node Transformation](#23-node-transformation)  
   2.4. [Value Transforms](#24-value-transforms)  
   2.5. [Query Expressions](#25-query-expressions)  
   2.6. [Singular Expressions](#26-singular-expressions)  
   2.7. [Logical Expressions](#27-logical-expressions)  
   2.8. [String Templates](#28-string-templates)

3. [Modifier Directives](#3-modifier-directives)  
   3.1. [`$meta` Directive](#32-meta-directive)  
   3.2. [`$comment` Directive](#31-comment-directive)

4. [Domain Directives](#4-domain-directives)  
   4.1. [`$` Directive](#41-dollar-directive)  
   4.2. [`$use` Directive](#42-use-directive)  
   4.3. [`$uri` Directive](#43-uri-directive)  
   4.4. [`$include` Directive](#44-include-directive)  
   4.5. [`$spread` Directive](#45-spread-directive)  
   4.6. [`$if` Directive](#46-if-directive)  
   4.7. [`$when` Directive](#47-when-directive)  
   4.8. [`$each` Directive](#48-each-directive)

5. [Operator Directives](#5-operator-directives)  
   5.1. [`$join` Directive](#51-join-directive)  
   5.2. [`$match` Directive](#52-match-directive)  
   5.3. [`$matches` Directive](#53-matches-directive)  
   5.4. [`$transform` Directive](#54-transform-directive)  
   5.5. [`$encode` Directive](#55-encode-directive)

6. [Value Transforms](#6-value-transforms)  
   6.1. [`$length` Transform](#61-length-transform)  
   6.2. [`sort` Transform](#62-sort-transform)  
   6.3. [`first` Transform](#63-first-transform)  
   6.4. [`last` Transform](#64-last-transform)

7. [Encodings](#7-encodings)  
   7.1. [JSON Encoding](#71-json-encoding)  
   7.2. [Base64 Encoding](#72-base64-encoding)  
   7.3. [urlencoded Encoding](#73-urlencoded-encoding)

8. [Security Considerations](#8-security-considerations)  
   8.1. [Attacks Through Malicious Templates](#81-attacks-through-malicious-templates)  
   8.2. [Resource Access Through URI-References](#82-resource-access-through-uri-references)  
   8.3. [Information Disclosure Through JSONPath](#83-information-disclosure-through-jsonpath)  
   8.4. [External System Attacks Through Encodings](#84-external-system-attacks-through-encodings)

9. [IANA Considerations](#9-iana-considerations)  
   9.1. [Directive Subregistry](#91-directive-subregistry)  
   9.2. [Transform Subregistry](#92-transform-subregistry)  
   9.3. [Encoding Subregistry](#93-encoding-subregistry)

10. [References](#10-references)  
    10.1. [Normative References](#101-normative-references)  
    10.2. [Informative References](#102-informative-references)

- [Appendix A. Examples](#appendix-a-examples)
  - [A.1. API Request Generation](#a1-api-request-generation)
  - [A.2. Dynamic Document Generation](#a2-dynamic-document-generation)
  - [A.3. Format Translation](#a3-format-translation)
- [Appendix B. Change Log](#appendix-b-change-log)

## 1. Introduction

Tool Form specifies a hygienic transformation model for generating encoded formats from JSON-based templates. The format enables AI systems to produce complex protocol payloads through declarative templates that maintain clear security boundaries between semantic parameters and their technical representations. While string-based template engines are common, Tool Form's transformation model is specifically designed for dynamic AI tool use, with format-aware processing that enables layered output encoding through self-contained templates, with extensible directives and pluggable encodings.

### 1.1. Purpose

AI systems are remarkably capable at understanding user intent and determining what operations to perform. But translating that semantic understanding into the precise low-level formats required by APIs remains a persistent challenge. As AI systems evolve toward more dynamic interactions, this translation increasingly needs to happen on the fly, with different combinations of formats and protocols potentially required for each new prompt.

Tool Form addresses this challenge by providing a secure, declarative way for AI tools to "fill out forms" that generate arbitrary low-level formats. By operating directly on JSON values rather than strings, the format maintains structural guarantees throughout the transformation process. This enables AI systems to focus on semantic operations while Tool Form handles the precise details of format generation.

For example, when an AI tool needs to generate a multipart HTTP request with JSON metadata and a binary payload, it shouldn't need to understand MIME boundaries or Base64 encoding. Instead, it can work with a natural JSON structure that Tool Form safely transforms into the required format:

```jsonc
{
  "body": {
    "$encode": "multipart",
    "metadata": {
      "$encode": "json",
      "filename": "report.pdf",
      "timestamp": "{{$.now}}",
      "tags": { "$": "user.tags" }
    },
    "file": {
      "$filename": "report.pdf",
      "$contentType": "application/pdf",
      "$content": { "$": "document" }
    }
  }
}
```

This template produces a complex multipart HTTP payload with proper MIME boundaries, base64-encoded content, and JSON-encoded metadata. It fully encapsulates the low-level encoding details, requiring the AI user to simply "fill out the form" by generating the necessary semantic parameters.

This structural approach enables:

- Safe composition of multiple encodings while maintaining format invariants
- Clear security boundaries between template evaluation and value transformation
- Protocol-independent transformation rules that work across formats
- Static validation of templates before execution

By treating format generation as structured data transformation rather than string manipulation, Tool Form enables AI tools to reliably generate complex formats without sacrificing security or maintainability.

### 1.2. Scope

This specification focuses on the core requirements for enabling AI tools to reliably generate encoded formats: a processing model for transforming JSON values, a standard set of directives that control these transformations, and an extensible encoding system for output generation. The processing model defines how directives compose and how implementations transform them into various formats, while maintaining JSON's simplicity and preserving security boundaries throughout the transformation pipeline.

To support the evolving needs of AI tools while ensuring consistent behavior across implementations, the specification establishes a foundation of standard directives for common operations, together with extension points for specialized directives and encodings. This enables implementations to add capabilities for specific protocols and formats without compromising the core transformation semantics or security guarantees.

The following aspects are explicitly out of scope, as they relate to implementation choices rather than transformation semantics:

- Implementation strategies or optimizations
- Programming language bindings
- Protocol-specific behaviors
- Storage or transmission mechanisms
- Security policies beyond basic processing rules

### 1.3. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

The terminology of [RFC8259] applies except where clarified below. The terminology of [RFC9535] also applies, particularly its definitions of "Node" and "Nodelist".

This document uses the following additional terms:

Node
: A JSON value within a template, as defined in [RFC9535]. Tool Form extends nodes with metadata headers that provide format-specific information without affecting the node's value.

Input Node
: A node in the template before transformation.

Output Node
: A node produced through transformation.

Node List
: A sequence of zero or more nodes, compatible with Nodelist from [RFC9535]. Node Lists are distinct from JSON arrays, and a Node List containing exactly one node remains distinct from that node.

Template Arguments
: A JSON value that provides the data context for transformation processing. The Template Arguments serve as the Query Argument for JSONPath expressions as defined in [RFC9535].

Directive Property
: A property within a Directive Object that begins with a single `$` character and controls transformation behavior. Each Directive Property belongs to exactly one of three categories: Modifier Directives, Domain Directives, or Operator Directives.

Directive Object
: An object containing one or more Directive Properties. A Directive Object MUST contain at most one Domain Directive, but MAY contain multiple Modifier Directives and multiple Operator Directives. When multiple Operator Directives are present, they form a pipeline in property order.

Modifier Directive
: A Directive Property that augments the semantic interpretation of templates without affecting their transformation behavior.

Domain Directive
: A Directive Property that determines how values are produced during template evaluation. At most one Domain Directive may appear in a Directive Object.

Domain Property
: A property that appears in the same object as its associated Domain Directive, providing additional configuration for that directive. Domain Properties are not directives themselves and are only recognized when appearing alongside their associated Domain Directive.

Operator Directive
: A Directive Property that processes transformation results through format-specific operations. Operator Directives form pipelines that convert values into their final representations.

Transform
: A unitary function that converts a JSON value into another JSON value. Transforms are registered by name and can be invoked through pipe (`|`) expressions or the `$transform` directive.

Encoding
: A named serialization format that defines how to convert JSON values into specific output formats. Each encoding has complete freedom to interpret its input according to its own rules.

Binary Value
: An immutable sequence of bytes that can appear anywhere a JSON value can appear, enabling native handling of binary data without intermediate text representations.

Undefined Value
: A special result indicating that no value is produced, as defined in [RFC9535]. This is distinct from any JSON value, including null.

Fragment
: A special result indicating values to be merged into a containing structure. Fragments are distinct from regular JSON values and enable precise control over structural composition.

Node Transformation
: The process of converting an Input Node into an Output Node through the application of directives and standard transformation rules.

## 2. Processing Model

Tool Form's processing model transforms JSON-based templates through a recursive evaluation process that maintains strict boundaries between template structure, transformation logic, and output generation. The model defines how Input Nodes become Output Nodes through the application of directives, each serving a distinct role:

- Modifier Directives provide metadata and documentation that annotate templates
- Domain Directives transform input values into new values through specific operations
- Operator Directives convert values into different representations through format-specific rules

Through uniform processing rules and precise directive semantics, the model enables safe composition of sophisticated transformations while preserving security properties and maintaining clear separation of concerns.

### 2.1. Nodes

Tool Form operates directly on JSON values as defined in [RFC8259]. Each value is processed as a node, the fundamental unit of transformation. A node consists of two parts: its value, which follows JSON semantics, and its metadata, which provides format-specific information through headers.

Tool Form extends JSON with one additional value type: Binary Values. A Binary Value is an immutable sequence of bytes that can appear anywhere a JSON value can appear. This extension enables encodings to handle binary data natively, without requiring intermediate text representations.

Nodes can carry metadata in the form of headers. Headers are key-value pairs that provide information about the node without affecting its value. Header keys are case-insensitive strings, and their values are strings. Headers enable transformation processes to pass format-specific metadata to the environment.

#### 2.1.1 Total Order

Tool Form defines a total order over JSON values that enables consistent comparison of any two values while maintaining intuitive ordering within each type.

When comparing two JSON values, implementations MUST:

1. For two Undefined Values:

   - Return 0 (all Undefined Values are equal)

2. For two null values:

   - Return 0 (all null values are equal)

3. For two boolean values:

   - Return -1 if first value is false and second is true
   - Return 1 if first value is true and second is false
   - Return 0 if values are equal

4. For two number values:

   - Follow IEEE-754 totalOrder predicate [IEEE 754-2019 §5.10]
   - -Infinity < finite numbers < +Infinity
   - -0 = +0
   - NaN = NaN, and NaN > all other numbers

5. For two string values:

   - Compare code points in lexicographic order
   - Return -1 if first string precedes second
   - Return 1 if first string follows second
   - Return 0 if strings are equal

6. For two array values:

   - Compare elements pairwise using this total order
   - Return first non-zero comparison result
   - If all shared elements are equal, shorter array precedes longer array
   - Return 0 if arrays are equal length and all elements equal

7. For two object values:

   - Sort property names of both objects in lexicographic order
   - Compare properties in sorted order using this total order
   - Return first non-zero comparison result
   - If all shared properties are equal, object with fewer properties precedes
   - Return 0 if objects have same properties with equal values

8. For values of different types:

   - Order by type: Undefined Value < null < boolean < number < string < array < object
   - Return -1 if first value's type precedes second value's type
   - Return 1 if first value's type follows second value's type

This total order enables stable sorting and consistent comparison across all JSON values while preserving natural comparison semantics within each type.

### 2.2. Directives

Tool Form uses properties whose names begin with `$` to invoke dynamic behavior. These directive properties work within JSON's structural model, operating at the object level. An object containing one or more directive properties is called a Directive Object.

Tool Form defines a set of standard directives (sections 3-5) that provide core transformation capabilities. Implementations MAY support additional directives beyond those defined in this specification, provided they follow the composition rules defined in this section.

Directive properties serve three distinct roles, each with specific composition rules:

1. Modifier Directives augment the transformation environment. They supply metadata and configuration that influence directive behavior, but do not themselves transform values.

2. Domain Directives define the primary transformation for their containing object. They take over the object's namespace, enabling domain-specific properties that modify their behavior.

3. Operator Directives modify or post-process transformation results. They compose naturally through property ordering, enabling transformation pipelines without additional nesting.

A Directive Object MUST contain at most one Domain Directive, but MAY contain any number of Modifier Directives and Operator Directives. When multiple directives appear in the same object, they are processed in a well-defined order:

1. Modifier Directives are applied first, in any order
2. The Domain Directive, if present, produces an intermediate result
3. Operator Directives are pipelined in property order to the intermediate result

This composition model enables natural expression of transformation logic while maintaining clear boundaries between different kinds of operations.

#### 2.2.1. Domain Properties

Domain Directives become more expressive through properties that modify their behavior. These Domain Properties share the same object as their directive and serve to modify rather than direct the transformation. They enable sophisticated behaviors while maintaining JSON's natural structure.

A Domain Property MUST:

- Appear in the same object as its associated Domain Directive
- Have meaning only in relation to that directive
- Follow that directive's processing rules

Domain Properties SHOULD use the `$` prefix for consistency with directive naming.

For example:

```jsonc
{
  "access": {
    "$if": "$.user.isAdmin",
    "$then": { "level": "admin" },
    "$else": { "level": "user" }
  }
}
```

Here, `$then` and `$else` are Domain Properties that modify how the `$if` directive transforms its object. They are not directives themselves, but rather properties that make `$if` more expressive by specifying what to produce in each case. This pattern enables sophisticated behaviors while maintaining JSON's natural structure.

#### 2.2.2. Directive Composition

Directives compose through JSON object properties, enabling precise control over transformation behavior while maintaining clear property-level semantics. Each category of directive serves a distinct role in this composition model.

When processing a Directive Object, implementations MUST enforce the following composition rules:

1. At most one Domain Directive may appear in the object. This enables Domain Directives to define focused expression patterns through domain properties.

2. Any number of Modifier Directives may appear in the object. Modifier Directives augment the transformation environment without interfering with transformation semantics.

3. Any number of Operator Directives may appear in the object. Operator Directives form a transformation pipeline, where:
   - The first operator takes its input from the Domain Directive's result, or from the transformed object if no Domain Directive is present
   - Each subsequent operator takes its input from the previous operator's output
   - Operators are applied strictly in property order
   - The final operator's output becomes the result of the transformation

For example:

```jsonc
{
  "users": {
    "$each": "$.team.members",
    "$as": "user",
    "name": { "$": "user.name" },
    "role": { "$": "user.role" },
    "$encode": "json"
  }
}
```

Here, `$each` is a Domain Directive that controls iteration, with `$as` as its domain property. The `$encode` directive is an Operator that processes the iteration result. This property-level composition enables natural expression of transformation pipelines while maintaining clear directive semantics.

The composition model extends to all directive categories. Domain Directives may define domain-specific properties, while Operator Directives enable format-specific post-processing. This consistent approach enables templates to express sophisticated transformations through simple property composition.

#### 2.2.3. Escaping Directive Names

Many JSON formats use properties that begin with `$` for special semantics. For example, JSON Schema uses `$schema` to declare a schema dialect, while MongoDB uses `$set` for update operations. To include such properties in a template without the possibility of being interpreted as directives, Tool Form provides a simple escaping mechanism through property name prefixing.

When a property name begins with `$$`, implementations MUST:

1. Remove the first `$` during transformation
2. Preserve all remaining characters exactly
3. Process the value as regular JSON data without directive interpretation
4. Apply this escaping only to property names, not to values

Properties need to be escaped only if they would otherwise be interpreted as directives. However, implementations SHOULD recommend escaping any property that begins with `$` to:

- Prevent conflicts with future directive names
- Clearly indicate the property's role as data
- Maintain consistent escaping conventions

For example:

```jsonc
{
  "$when": "$.features.validation",
  "$$comment": "Schema for user objects",
  "$$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "role": { "type": "string" }
  }
}
```

Given `{"features": {"validation": true}}`, this transforms to:

```jsonc
{
  "$comment": "Schema for user objects",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "role": { "type": "string" }
  }
}
```

This example demonstrates how escaping enables templates to work naturally with JSON formats that use `$` properties, while maintaining clear boundaries between directives and data properties.

### 2.3. Node Transformation

Tool Form's transformation model enables templates to evolve naturally from static JSON to dynamic documents. The model operates through Node Transformation - a recursive operation that converts Input Nodes into Output Nodes while preserving JSON's structural guarantees.

Directives control dynamic behavior through three distinct categories:

- Modifier Directives augment the transformation environment
- Domain Directives define the primary transformation for their containing object
- Operator Directives modify or post-process transformation results

Implementations MUST transform nodes according to the following rules:

1. Transform string values as String Templates according to section 2.8.

2. For arrays:

   - Transform each element recursively
   - Skip elements that transform to an Undefined Value
   - If an element is a Fragment, for each node in its Node List:
     - If the node is an array, append its elements
     - If the node is an object, append its property values
     - Otherwise skip the node

3. For objects without directives:

   - Transform each property value recursively
   - Remove properties that transform to an Undefined Value
   - Merge Fragment property values according to the Fragment Merging rules
   - If a Property Value is a Fragment, for each node in its Node List:
     - If the node is an array, assign each element using its stringified index as the property name
     - If the node is an object, for each (key, value) pair in the object:
       - If the value is not an Undefined Value, set the property named by the key to the value
       - Otherwise, remove the property named by the key
     - Otherwise skip the node

4. For objects with directives:

   - Apply Modifier Directives first, in any order
   - Apply the Domain Directive if present
   - Apply Operator Directives in property order
   - Return the final result

5. Otherwise, return the value directly.

For example:

```jsonc
{
  "static": 42,
  "items": [
    "first",
    { "$spread": ["a", "b"] },
    { "$spread": { "x": 1, "y": 2 } }
  ],
  "config": {
    "debug": true,
    "$spread": {
      "level": "info",
      "debug": { "$": "missing" }
    }
  }
}
```

Transforms to:

```jsonc
{
  "static": 42,
  "items": ["first", "a", "b", 1, 2],
  "config": {
    "level": "info"
  }
}
```

This transformation demonstrates:

- Scalar values are returned directly
- Arrays incorporate both array elements and object property values
- Objects incorporate property values, removing those that transform to an Undefined Value
- Directives maintain clear processing boundaries

The transformation model ensures that templates remain predictable and maintainable as they grow in complexity. Each directive category serves a distinct purpose, while property ordering provides a natural way to sequence operations. This enables templates to express sophisticated transformations through composition of simple, well-defined operations.

### 2.4. Value Transforms

Value Transforms specify how JSON values are converted through unitary functions. A Transform takes a single Input Value and produces a single Output Value, maintaining JSON's type system throughout the transformation process.

When evaluating a Transform, implementations MUST:

1. Take exactly one JSON value as input

2. Produce exactly one of:

   - A JSON value
   - An Undefined Value
   - A Fragment containing a Node List

3. Maintain value semantics:

   - Preserve JSON types
   - Handle all possible input types
   - Produce well-formed output

Transforms operate independently of template structure and directive processing, enabling their use in both pipe expressions and directive contexts.

### 2.5. Query Expressions

Query Expressions are JSONPath queries that return Node Lists from the Template Arguments. They are used by string shorthands in directives like `$spread` and `$each` to specify sequences of nodes.

When evaluating a Query Expression, implementations MUST evaluate it as a JSONPath query according to [RFC9535] §2, using the Template Arguments as the Query Argument.

For example, given the Template Arguments:

```jsonc
{
  "user": {
    "name": "Alice",
    "roles": ["admin", "editor"],
    "settings": {
      "theme": "dark"
    }
  }
}
```

The following table shows example Query Expressions and their results:

| Expression       | Result                | Note                           |
| ---------------- | --------------------- | ------------------------------ |
| `$.user.roles.*` | `["admin", "editor"]` | All array elements             |
| `$.user..theme`  | `["dark"]`            | Recursive descent              |
| `$..name`        | `["Alice"]`           | All matching properties        |
| `$.missing.*`    | `[]`                  | Empty Node List for no matches |

These expressions enable directives to work with sequences of nodes while maintaining JSONPath's standard query semantics.

### 2.6. Singular Expressions

Singular Expressions define how JSONPath query results are converted into JSON values. This conversion enables templates to incorporate dynamic values while maintaining strict type safety. A Singular Expression evaluates a JSONPath query against the Template Arguments, converting the result into a JSON value according to well-defined rules.

Tool Form extends JSONPath's query syntax with an abbreviated form that eliminates unnecessary syntactic overhead in common cases. This extension adds three productions to the JSONPath grammar while preserving all other productions exactly as defined in [RFC9535]:

```abnf
query-expression = (jsonpath-query / implicit-query) *(S pipe-expression)

implicit-query = [(implicit-child-segment / segment) *(S segment)]

implicit-child-segment = wildcard-selector / member-name-shorthand

pipe-expression = "|" transform-name

transform-name = member-name-shorthand
```

    Note: Implementations MAY support abbreviated queries through string preprocessing. Given an input string S:

    - If `S` contains one or more `"|"` characters:
      - Split `S` on `"|"` characters
      - Trim whitespace from each part
      - Process the first part as a query according to the rules below
      - Process the remaining parts as transform names
    - If the first part begins with "$", use the first part directly
    - If the first part begins with ".", prepend "$"
    - If the first part begins with "*", ALPHA, "_", %x80-D7FF, or %xE000-10FFFF, prepend "$."
    - Otherwise return an error

    This preprocessing produces exactly equivalent results to the grammar-based transformation while enabling simpler implementation strategies.

When evaluating a Singular Expression, implementations MUST:

1. Evaluate the query part as a JSONPath query, according to [RFC9535] §2, using the Template Arguments as the Query Argument

2. If the query is a Singular Query, as defined in [RFC9535] §2.3.5.1:

   - Return the value of the single node in the resulting Node List, if non-empty
   - Return an Undefined Value if the Node List is empty

3. Otherwise convert the resulting Node List to an array value

4. For each transform in sequence:

   - Apply the transform to the current value according to §2.4
   - Use the result as input to the next transform
   - If any transform produces an Undefined Value, return an Undefined Value

5. Return the final transformed value

For example, given the Template Arguments:

```jsonc
{
  "user": {
    "name": "Alice",
    "roles": ["admin", "editor"],
    "settings": {
      "theme": "dark"
    }
  },
  "items": [
    { "id": 1, "tag": "first" },
    { "id": 2, "tag": "second" }
  ]
}
```

The following table demonstrates equivalent query forms and their results:

| Expression             | JSONPath Form       | Result                     | Note                                       |
| ---------------------- | ------------------- | -------------------------- | ------------------------------------------ |
| `user.name`            | `$.user.name`       | `"Alice"`                  | Singular Query → single value              |
| `user.roles[0]`        | `$.user.roles[0]`   | `"admin"`                  | Singular Query → single value              |
| `missing.name`         | `$.missing.name`    | Undefined Value            | Singular Query with no match → undefined   |
| `user.roles[*]`        | `$.user.roles[*]`   | `["admin", "editor"]`      | Non-singular → array                       |
| `items[?@.id==1]`      | `$.items[?@.id==1]` | `[{"id":1,"tag":"first"}]` | Filter Query → array                       |
| `*.theme`              | `$.*.theme`         | `["dark"]`                 | Wildcard → array                           |
| `missing[*]`           | `$.missing[*]`      | `[]`                       | Non-singular with no matches → empty array |
| `user.name \| length`  | n/a                 | `5`                        | Transform applied to string value          |
| `items[*].tag \| sort` | n/a                 | `["first", "second"]`      | Transform applied to array                 |
| `user.roles \| length` | n/a                 | `2`                        | Transform on array result                  |

This strict adherence to [RFC9535]'s definition of Singular Query ensures consistent behavior across implementations while maintaining clear semantics for value extraction. When a single value is needed from a non-singular query result, implementations can use array indexing or other appropriate transformations.

### 2.7. Logical Expressions

Logical Expressions enable boolean evaluation in control flow directives. They build upon JSONPath's logical expressions, as defined in [RFC 9535] §2.3.5, providing a natural way to make structural decisions during transformation.

Queries within logical expressions that appear outside of comparison operators perform existence checks. For example, the expression `user.active` tests whether the query `$.user.active` matches any nodes, while `user.active == true` tests the actual boolean value. This distinction is crucial for writing correct predicates.

When evaluating a Logical Expression, implementations MUST:

1. Treat the expression as a JSONPath logical expression, as if it appeared within an implicit filter selector (`$[?<expr>]`)
2. Use the Template Arguments as both the Query Argument and the Current Node
3. Follow the evaluation rules for logical expressions defined in [RFC 9535] §2.3.5
4. Return true if and only if the logical expression evaluates to LogicalTrue

For example, given the Template Arguments:

```jsonc
{
  "user": {
    "role": "admin",
    "active": true
  },
  "features": {
    "debug": false
  }
}
```

The following table demonstrates Logical Expression evaluation:

| Expression                         | Result  | Note                        |
| ---------------------------------- | ------- | --------------------------- |
| `user.role == 'admin'`             | `true`  | Direct value comparison     |
| `features.debug`                   | `false` | Boolean property test       |
| `user.active && !@.features.debug` | `true`  | Compound logical expression |
| `missing.field`                    | `false` | Non-existent path           |

This approach enables natural expression of boolean conditions while maintaining strict alignment with JSONPath semantics. The full grammar and evaluation rules for logical expressions are defined in [RFC 9535] §2.3.5.1.

### 2.8. String Templates

String templates provide a mechanism for interpolating dynamic values into text. A template consists of literal text interspersed with variable expressions. Each variable expression begins with an unescaped `{{` sequence and ends with a matching unescaped `}}` sequence. The text between these delimiters is evaluated as a Singular Expression (Section 2.6).

When processing a string template, implementations MUST:

1. Process escape sequences:

   - `\\` becomes a single backslash
   - `\{` becomes a literal left brace
   - `\}` becomes a literal right brace
   - Any other character following a backslash MUST result in an error

2. Identify variable expressions:

   - Find each unescaped `{{` and its matching `}}`
   - Return an error if any `{{` lacks a matching `}}`
   - Return an error if any unescaped `}}` appears outside an expression
   - A character is considered escaped if it is preceded by a backslash
   - A `{{` sequence is considered unescaped only if neither of its characters is escaped

3. For each variable expression:

   - Evaluate the expression text according to the Singular Expression rules (section 2.6)
   - Apply the Node Transformation to the evaluated result
   - Convert the transformed result to a string:
     - Use string values directly without modification
     - Convert Undefined Values to empty strings
     - For all other values, apply JSON stringification rules

4. Combine the results in order:

   - Preserve all literal text exactly as it appears
   - Replace each expression with its string result
   - Preserve all whitespace

Single curly braces can be used directly in templates. They may optionally be escaped, but this is not required unless they would otherwise form an interpolation sequence.

The following examples demonstrate string template behavior with various forms of interpolation, escaping, and value conversion. Given the Template Arguments:

```jsonc
{
  "user": {
    "name": "Alice",
    "roles": ["admin", "editor"],
    "settings": {
      "theme": "dark",
      "debug": true
    }
  }
}
```

| Template                                     | Result                                    | Note                                    |
| -------------------------------------------- | ----------------------------------------- | --------------------------------------- |
| `Hello, {{$.user.name}}!`                    | `Hello, Alice!`                           | Simple string value interpolation       |
| `Roles: {{$.user.roles}}`                    | `Roles: ["admin","editor"]`               | Array serialized as JSON                |
| `Settings: {{$.user.settings}}`              | `Settings: {"theme":"dark","debug":true}` | Object serialized as JSON               |
| `Welcome{{$.user.prefix}} {{$.user.name}}!`  | `Welcome Alice!`                          | Undefined value becomes empty string    |
| `Path: C:\\Users\\{{$.user.name}}`           | `Path: C:\Users\Alice`                    | Backslash escaping preserved            |
| `\{\{not interpolated\}\}`                   | `{{not interpolated}}`                    | Escaped braces rendered literally       |
| `{{$.user.name}}'s \{\{escaped\}\} template` | `Alice's {{escaped}} template`            | Mixed interpolation and escaped content |

String templates provide a uniform mechanism for text interpolation that maintains consistent string coercion rules while enabling both simple substitution and complex value formatting.

## 3. Modifier Directives

Modifier Directives augment the semantic interpretation of templates without directly transforming them. Unlike Domain Directives which transform nodes, or Operator Directives which process transformation results, Modifier Directives provide metadata, documentation, and semantic annotations that influence how templates are understood and processed.

When processing a Directive Object, implementations MUST:

1. Apply Modifier Directives before any Domain or Operator Directives
2. Allow multiple Modifier Directives within the same object
3. Permit Modifier Directives to combine with any Domain or Operator Directive
4. Exclude Modifier Directives and their values from the Output Node

This section defines the standard Modifier Directives that enable template documentation and metadata management. While these directives do not directly participate in node transformation, they play a crucial role in template interpretation and processing.

### 3.1. `$meta` Directive

The `$meta` directive provides structured metadata about a template. This metadata MAY influence template processing but MUST NOT appear in transformation output. The directive's value MUST be an object.

For example:

```jsonc
{
  "$meta": {
    "version": "1.0",
    "author": "Tool Form Working Group",
    "headers": {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    "description": "Template for user authentication requests"
  },
  "request": {
    "$comment": "Headers included from metadata",
    "method": "POST",
    "headers": { "$include": "/$meta/headers" },
    "body": {
      "$encode": "json",
      "data": { "$": "payload" }
    }
  }
}
```

This example demonstrates:

- Structured metadata storage for template versioning and attribution
- Reusable configuration through metadata access
- Natural composition with transformation directives
- Semantic documentation of template purpose

### 3.2. `$comment` Directive

The `$comment` directive enables informative annotation of templates through inline comments. Comments MAY provide context about template behavior, document assumptions, or explain complex transformations, but MUST NOT affect transformation output. The directive accepts any JSON value, enabling both simple string comments and structured documentation.

For example:

```jsonc
{
  "$comment": "API request template with conditional authentication",
  "request": {
    "endpoint": {
      "$comment": "Production endpoints require OAuth",
      "$if": "$.environment == 'production'",
      "$then": {
        "url": "https://api.example.com",
        "auth": {
          "$comment": "Token fetched from secure storage",
          "type": "oauth",
          "token": { "$": "secrets.token" }
        }
      },
      "$else": {
        "url": "http://localhost:8080",
        "auth": null
      }
    }
  }
}
```

This example demonstrates:

- Multi-level informative documentation
- Explanation of conditional logic and security requirements
- Clear separation between documentation and transformation
- Natural composition with control flow directives

## 4. Domain Directives

Domain Directives define the primary transformation behavior for JSON values. Unlike Modifier Directives which annotate templates, or Operator Directives which process transformation results, Domain Directives determine how values are produced during template evaluation. A Directive Object MUST contain at most one Domain Directive, enabling that directive to establish a focused transformation domain with its own properties and processing rules.

This section defines the standard Domain Directives, organized by their transformation roles:

- Data directives (`$`, `$uri`, `$include`) that incorporate data from the Template Arguments and external resources
- Structural directives (`$spread`) that merge values through property-level composition
- Control-flow directives (`$if`, `$when`, `$each`) that manage conditional processing and iteration

Each Domain Directive maintains strict boundaries between its transformation domain and the broader processing model. This isolation enables precise reasoning about transformation behavior while ensuring consistent processing semantics across implementations. Domain Properties provide additional configuration within each directive's domain, extending directive capabilities without compromising their focused transformation roles.

### 4.1. `$` Directive

The `$` directive evaluates JSONPath queries against the Template Arguments, providing Tool Form's primary mechanism for incorporating dynamic values. It enables templates to reference data through JSONPath's powerful query syntax while preserving JSON's structural guarantees.

When processing a `$` directive, implementations MUST:

1. Return an error if the directive's value is not a string

2. Evaluate the string as a Singular Expression (section 2.6)

3. Return the result of the evaluation

The directive supports both standard JSONPath syntax and an abbreviated form that eliminates unnecessary syntactic overhead. In the abbreviated form, the `$` in the directive name conceptually serves as the root identifier, enabling cleaner expression of common queries.

For example:

```jsonc
{
  "user": {
    "name": { "$": "user.name" }, // Abbreviated form
    "id": { "$": ".user.id" }, // Directive as root form
    "role": { "$": "$.user.role" } // RFC 9535 form
  }
}
```

The evaluation result type is determined by whether the expression contains a singular or non-singular query, as defined in [RFC9535] §2.3.5.1:

- **Singular queries** return exactly one value or an Undefined Value if no match exists
- **Non-singular queries** always return an array, which may be empty if no matches exist

This distinction is fundamental to the directive's behavior. JSONPath queries that select a specific element (e.g., `user.name` or `items[0]`) are singular and return that element directly. Queries that may select multiple elements (e.g., `users[*].name` or `items[?(@.active)]`) are non-singular and always return an array, even if only one or zero elements match.

```jsonc
{
  "user": {
    "name": { "$": "user.name" }, // Singular query → single value
    "role": { "$": "user.roles[0]" }, // Singular query → single value
    "roles": { "$": "user.roles.*" }, // Non-singular query → array
    "groups": { "$": "groups[?@.active]" } // Non-singular query → array
  }
}
```

Given the Template Arguments:

```jsonc
{
  "user": {
    "name": "Alice",
    "roles": ["admin", "editor"]
  },
  "groups": [
    { "name": "dev", "active": true },
    { "name": "test", "active": false }
  ]
}
```

The evaluation produces:

```jsonc
{
  "user": {
    "name": "Alice",
    "role": "admin",
    "roles": ["admin", "editor"],
    "groups": [{ "name": "dev", "active": true }]
  }
}
```

This strict distinction between singular and non-singular queries ensures consistent behavior across templates, enabling developers to precisely control how values are incorporated into the output structure.

The directive's simplicity, combined with JSONPath's expressiveness, provides a powerful bridge between static templates and dynamic data while maintaining JSON's structural integrity.

### 4.2. `$use` Directive

The `$use` directive enables Operator Directives to be applied to any JSON value. While the `$` directive evaluates JSONPath expressions to obtain values from Template Arguments, `$use` provides a mechanism for working directly with literal values, including strings containing template syntax.

When processing a `$use` directive, implementations MUST:

1. Apply the Node Transformation to the directive's value

2. Use the transformed result as the Output Value of the Directive Object

The directive enables natural composition with Operator Directives while maintaining clear boundaries between literal values and template evaluation.

For example:

```jsonc
{
  "message": {
    "$use": [
      "Monthly Report Summary\n",
      "Revenue: ${{$.data.revenue}}",
      "Growth: {{$.data.growth}}%\n"
    ],
    "$join": "\n"
  },
  "tags": {
    "$use": ["critical", "finance"],
    "$transform": "sort"
  },
  "config": {
    "$use": {
      "debug": true,
      "env": "{{$.environment}}"
    },
    "$encode": "json"
  }
}
```

Given the Template Arguments:

```jsonc
{
  "data": {
    "revenue": 50000,
    "growth": 12.5
  },
  "environment": "production"
}
```

Produces:

```jsonc
{
  "message": "Monthly Report Summary\n\nRevenue: $50000\nGrowth: 12.5%\n",
  "tags": ["critical", "finance"],
  "config": "{\"debug\":true,\"env\":\"production\"}"
}
```

This example demonstrates:

- Array values with string templates and operator composition
- Direct use of arrays with transforms
- Object values with mixed static and template data
- Natural composition with various operators

The directive maintains clear transformation boundaries while enabling Operator Directives to be applied to any JSON value. This provides a consistent mechanism for working with literal values that need operator processing.

### 4.3. `$uri` Directive

The `$uri` directive expands URI Templates according to [RFC6570]. It enables dynamic generation of URIs by interpolating values through the standard URI Template syntax, while leveraging Tool Form's Singular Expression evaluation.

When processing a `$uri` directive, implementations MUST:

1. Return an error if the directive's value is not a string

2. Parse the string as a URI Template according to [RFC6570]

3. For each template variable:

   - If the Directive Object has a domain property with the same name as the variable, use that string value or return an error if the value is not a string
   - Otherwise, construct a JSONPath expression of the form `$.variable_name`
   - Use the result for RFC 6570 expansion

Template expansion follows [RFC6570] exactly, including its rules for handling arrays and objects.

For example:

```jsonc
{
  "list": {
    "$uri": "https://api.example.com/repos/{org}/issues{?state,labels*}"
  },
  "issue": {
    "$uri": "https://api.example.com/repos/{org}/issues/{number}",
    "number": "$.selected.id"
  }
}
```

Given the Template Arguments:

```jsonc
{
  "org": "example-org",
  "state": "open",
  "labels": ["bug", "urgent"],
  "selected": {
    "id": "1234"
  }
}
```

Produces:

```jsonc
{
  "list": "https://api.example.com/repos/example-org/issues?state=open&labels=bug&labels=urgent",
  "issue": "https://api.example.com/repos/example-org/issues/1234"
}
```

The directive enables hygienic composition of path and query parameters through URI Template syntax, while maintaining clear boundaries between template expansion and expression evaluation.

### 4.4. `$include` Directive

The `$include` directive incorporates values from URI references into templates. It enables composition through external resources while maintaining strict boundaries between inclusion and transformation.

When processing an `$include` directive, implementations MUST:

1. Apply the Node Transformation to the directive's value

2. Return an Undefined Value if the transformed value is not a string

3. Process the resulting string as a URI Reference according to [RFC3986]:

   - Resolve relative references against the base URI of the Directive Object
   - Interpret fragment components as JSON Pointers [RFC6901]
   - Return an error if the resource cannot be resolved

4. Load the referenced resource:

   - Parse as JSON according to [RFC8259]
   - Implementations MAY support additional formats (e.g., YAML, TOML)
   - Return an error if parsing fails

5. Return the parsed resource value directly, without applying further Node Transformation to it

The directive enables dynamic resource references through transformation of the URI string while maintaining strict inclusion semantics for the referenced resources themselves - the content of referenced resources is incorporated exactly as it appears in the source. This ensures clear boundaries between resource inclusion and template transformation, preventing recursive inclusion chains.

For example:

```jsonc
{
  "config": { "$include": "config.json" },
  "common": { "$include": "#/components/schemas/User" },
  "userConfig": { "$include": "users/{{userId}}/config.json" },
  "data": {
    "$spread": { "$include": "data/*.json" }
  }
}
```

The directive enables hygienic composition of resources while maintaining strict security boundaries. Each included value is incorporated directly into the template structure, enabling precise control over resource composition.

### 4.5. `$spread` Directive

The `$spread` directive enables structural composition through property merging. While the `$` directive incorporates single values directly, `$spread` provides a mechanism for combining multiple values into a containing structure.

When processing a `$spread` directive, implementations MUST:

1. If the directive's value is a string:

   - Evaluate it as a Query Expression
   - Create a Fragment containing the resulting Node List

2. Otherwise:

   - Apply the Node Transformation to the value
   - If the result is an Undefined Value, return an Undefined Value
   - Create a Fragment containing the transformed result

When a Fragment is merged:

- For arrays, each object in the Fragment contributes its property values as elements
- For objects, each object in the Fragment contributes its properties
- Non-object nodes in a Fragment are ignored
- Undefined Values remove corresponding properties from the containing object

For example:

```jsonc
{
  "tags": [
    "basic",
    { "$spread": "$.user.groups.*.tags" },
    { "$spread": ["premium", "beta"] },
    {
      "$spread": {
        "$if": "$.isAdmin",
        "$then": { "admin": ["root", "sudo"] },
        "$else": { "user": ["read", "write"] }
      }
    }
  ],
  "config": {
    "logging": true,
    "$spread": "$.user.settings.*",
    "$spread": {
      "theme": "dark",
      "debug": true
    }
  }
}
```

Given the Template Arguments:

```jsonc
{
  "user": {
    "groups": [
      {
        "name": "dev",
        "tags": ["staff", "early"]
      },
      {
        "name": "test",
        "tags": ["qa", "beta"]
      }
    ],
    "settings": [
      {
        "notifications": true,
        "timezone": "UTC"
      },
      {
        "metrics": true,
        "alerts": false
      }
    ]
  },
  "isAdmin": true
}
```

Produces:

```jsonc
{
  "tags": [
    "basic",
    "staff",
    "early",
    "qa",
    "beta",
    "premium",
    "beta",
    "root",
    "sudo"
  ],
  "config": {
    "logging": true,
    "notifications": true,
    "timezone": "UTC",
    "metrics": true,
    "alerts": false,
    "theme": "dark",
    "debug": true
  }
}
```

The directive enables hygienic composition of values while maintaining clear boundaries between template structure and merged content.

### 4.6. `$if` Directive

The `$if` directive enables structural decisions during transformation by selecting between alternative templates. It determines which template to transform based on a condition value, enabling natural composition of conditional and dynamic behavior while maintaining Tool Form's transformation semantics.

When processing an `$if` directive, implementations MUST evaluate its value according to the following rules:

1. If the value is a string:

   - Evaluate it as a Logical Expression
   - Use the result as the condition

2. If the value is any other type:

   - Apply the Node Transformation
   - Convert the transformed result to a boolean:
     - false, 0, "", null, and Undefined Values are false
     - All other values are true
   - Use this boolean as the condition

3. Based on the condition:

   - If true, apply the Node Transformation to the `$then` value
   - If false, apply the Node Transformation to the `$else` value
   - Return an Undefined Value if the selected branch is absent

The `$then` and `$else` Domain Properties specify the templates to transform based on the condition. These templates can contain any valid Tool Form content, enabling natural composition with other directives.

For example:

```jsonc
{
  "api": {
    "endpoint": {
      "$if": "$[?@.environment == 'production']",
      "$then": "https://api.example.com",
      "$else": "https://api.staging.example.com"
    },
    "auth": {
      "$if": { "$": "features.oauth" },
      "$then": {
        "type": "oauth",
        "client_id": { "$": "auth.client_id" }
      },
      "$else": {
        "type": "basic",
        "key": { "$": "auth.api_key" }
      }
    },
    "logging": {
      "$if": {
        "$": "logs.*.enabled",
        "$join": "||"
      },
      "$then": {
        "level": { "$": "logs.level" },
        "format": "json"
      }
    }
  }
}
```

Given the Template Arguments:

```jsonc
{
  "environment": "production",
  "features": {
    "oauth": true
  },
  "auth": {
    "client_id": "abc123",
    "api_key": "xyz789"
  },
  "logs": [
    { "type": "error", "enabled": true },
    { "type": "access", "enabled": false }
  ],
  "logs.level": "info"
}
```

Produces:

```jsonc
{
  "api": {
    "endpoint": "https://api.example.com",
    "auth": {
      "type": "oauth",
      "client_id": "abc123"
    },
    "logging": {
      "level": "info",
      "format": "json"
    }
  }
}
```

This example demonstrates:

- Logical Expression condition (`$[?@.environment == 'production']`)
- Transformed value condition (`$.features.oauth`)
- Complex condition through directive composition (`$join`)
- Branch templates with nested directives
- Natural composition within other directives

The directive maintains clear transformation boundaries while enabling sophisticated conditional behavior. Each branch template is transformed independently, ensuring consistent transformation semantics regardless of the condition's complexity.

### 4.7. `$when` Directive

The `$when` directive enables conditional inclusion of objects based on predicate evaluation. Unlike the `$if` directive which selects between alternative templates, `$when` provides a natural filtering mechanism that either includes or excludes its containing object based on a condition.

When processing a `$when` directive, implementations MUST evaluate its value according to the following rules:

1. If the value is a string:

   - Evaluate it as a Logical Expression
   - Use the result as the condition

2. If the value is any other type:

   - Apply the Node Transformation to the value
   - Convert the transformed result to a boolean:
     - false, 0, "", null, and Undefined Values are false
     - All other values are true
   - Use this boolean as the condition

3. Based on the condition:

   - If true, apply the Node Transformation to the containing object, excluding the `$when` directive
   - If false, return an Undefined Value

The directive enables natural filtering through JSON's object structure. For example:

```jsonc
{
  "api": {
    "endpoints": {
      "admin": {
        "$when": "$.user.isAdmin",
        "path": "/admin",
        "methods": ["GET", "POST"]
      },
      "metrics": {
        "$when": { "$": "features.metrics" },
        "path": "/metrics",
        "methods": ["GET"]
      }
    }
  }
}
```

Given the Template Arguments:

```jsonc
{
  "user": {
    "isAdmin": true
  },
  "features": {
    "metrics": false
  }
}
```

Produces:

```jsonc
{
  "api": {
    "endpoints": {
      "admin": {
        "path": "/admin",
        "methods": ["GET", "POST"]
      }
    }
  }
}
```

This example demonstrates:

- String form using Logical Expression (`$.user.isAdmin`)
- Value form using transformation (`$.features.metrics`)
- Object-level filtering based on conditions
- Clean composition with object structure

The directive maintains clear transformation boundaries. When a condition is true, the containing object transforms normally, enabling composition with other directives. When false, the entire object is excluded, providing clean structural filtering without affecting the rest of the document.

### 4.8. `$each` Directive

The `$each` directive enables iteration over Query Expression results. It evaluates a template for each node in the Node List, binding each node to a variable name that can be referenced within the template.

When processing an `$each` directive, implementations MUST:

1. Evaluate its value:

   - If a string, evaluate it as a Query Expression
   - Otherwise, apply the Node Transformation to the value

2. Convert the result to a sequence:

   - For Query Expression results, use the Node List directly
   - For arrays, use the elements directly
   - For objects, use the property values in order
   - For other values (including Undefined Values), use an empty sequence

3. For each value in the sequence:

   - Bind the value to the name specified by the `$as` Domain Property
   - If `$value` is present, transform that as the template
   - Otherwise, transform the directive object excluding `$each`, `$as`, and `$key`

4. Collect the results:

   - If `$key` is present:
     - Transform `$key` for each value to determine its property name
     - Return an object mapping keys to transformed values
   - Otherwise:
     - Return an array containing all non-undefined results in sequence order

For example:

```jsonc
{
  "nav": {
    "$each": ["Home", "Products", "About"],
    "$as": "item",
    "text": { "$": "item" },
    "link": "/{{$.item}}"
  }
}
```

Produces:

```jsonc
{
  "nav": [
    { "text": "Home", "link": "/Home" },
    { "text": "Products", "link": "/Products" },
    { "text": "About", "link": "/About" }
  ]
}
```

The directive enables both array transformation and object mapping through the same iteration model. For example:

```jsonc
{
  "userMap": {
    "$each": "$.users[?@.active].roles[*]",
    "$as": "role",
    "$key": { "$": "role.id" },
    "name": { "$": "role.name" },
    "level": { "$": "role.access_level" }
  }
}
```

This example demonstrates:

- Direct iteration over Query Expression results
- Variable binding with `$as`
- Object mapping with `$key`
- Natural composition with other directives

The directive maintains clear iteration boundaries by operating directly on Query Expression results. Each value is bound independently to the specified variable name, enabling precise control over template evaluation while preventing interference between iterations.

## 5. Operator Directives

Operator Directives process transformation results through format-specific operations. Unlike Domain Directives which produce values, or Modifier Directives which annotate templates, Operator Directives form transformation pipelines that convert values into their final representations. A Directive Object MAY contain multiple Operator Directives, which are applied in property order to create sophisticated processing chains.

This section defines the standard Operator Directives that enable output generation:

- String operations (`$join`) that combine values through concatenation
- Format operations (`$encode`) that serialize values through pluggable encodings

Each Operator Directive maintains strict boundaries between its processing domain and the broader transformation model. This isolation enables precise control over output generation while ensuring consistent processing semantics across implementations. The pipeline model enables natural composition of operations without requiring nested structure, maintaining template clarity even as processing complexity grows.

### 5.1. `$join` Directive

The `$join` directive joins sequence elements into a string using a separator.

When processing a `$join` directive, implementations MUST:

1. Transform the directive's value to determine the separator:

   - Apply the Node Transformation
   - If the result is a string, use it directly
   - If the result is true, use an empty string
   - For any other result, use an empty string; implementations MAY emit a warning

2. Process the Input Value:

   - If the value is an array, use its elements
   - If the value is an object, use its property values in order
   - If the value is undefined, return an empty string
   - For any other value type, use it as a single element

3. For each element in the sequence:

   - Apply the Node Transformation
   - Convert the transformed result to a string:
     - Use string values directly without modification
     - Convert undefined values to empty strings
     - For all other values, apply JSON stringification rules
   - Join the resulting strings using the separator

For example:

```jsonc
{
  "items": {
    "$": "shopping.list",
    "$join": ", "
  },
  "path": {
    "$": "user.folders",
    "$join": "/"
  }
}
```

Given the Template Arguments:

```jsonc
{
  "shopping": {
    "list": ["milk", "eggs", "bread"]
  },
  "user": {
    "folders": ["home", "alice", "docs"]
  }
}
```

Produces:

```jsonc
{
  "items": "milk, eggs, bread",
  "path": "home/alice/docs"
}
```

This example demonstrates:

- Array joining with string separator
- Different separators for different use cases
- Natural composition with transformation directives

The directive provides a simple way to join sequences into strings while maintaining consistent coercion rules and clear semantics.

### 5.2. `$match` Directive

The `$match` directive selects from multiple branches based on JSON Schema validation. It enables templates to handle polymorphic data structures by matching the Input Node against a sequence of JSON Schema patterns.

When processing a `$match` directive, implementations MUST:

1. If the directive value is not an array, return an Undefined Value

2. For each branch in the array, in order:

   - If the branch contains a `$case` property:
     - Apply the Node Transformation to the `$case` property value to obtain a JSON Schema
     - Perform JSON Schema validation following JSON Schema Draft 2020-12 [JSONSCHEMA] using the Input Node as the Instance to validate
     - The schema MUST be processed according to the dialect specified in the schema's `$schema` property, or JSON Schema Draft 2020-12 if no dialect is specified
     - Format validation MUST be performed according to the Format-Annotation Vocabulary defined in §7.2.1 of JSON Schema Validation [JSONSCHEMAVALIDATION]
     - If validation fails, continue to the next branch
     - If validation succeeds:
       - If the branch contains a `$then` property, transform and return its value
       - Otherwise, remove the `$case` property and transform the resulting branch object
       - If the transformation result is not an Undefined Value, return it
   - If the branch does not contain a `$case` property:
     - Transform the branch
     - If the result is not an Undefined Value, return it

3. If no branch produces a non-Undefined Value, return an Undefined Value

This pattern enables clean handling of data with variable structure:

```json
{
  "$": "$",
  "$match": [
    {
      "$case": { "required": ["error"] },
      "$then": { "status": "error", "message": { "$": "error.message" } }
    },
    {
      "$case": { "required": ["data"] },
      "status": "success",
      "result": { "$": "data.value" }
    },
    { "status": "unknown" }
  ]
}
```

Example transformations:

| Input                                 | Output                                        |
| ------------------------------------- |---------------------------------------------- |
| `{"error": {"message": "Not found"}}` | `{"status": "error", "message": "Not found"}` |
| `{"data": {"value": 42}}`             | `{"status": "success", "result": 42}`         |
| `{}`                                  | `{"status": "unknown"}`                       |

The `$match` directive provides multi-branch pattern matching through sequential JSON Schema validation. By examining the Input Node against each branch's schema in order, it selects, transforms, and returns the appropriate result based on data structure. This approach combines schema validation with transformation logic, enabling templates to adapt their processing based on the actual shape of the data encountered.

### 5.3. `$matches` Directive

The `$matches` directive validates its Input Node against a JSON Schema. It enables type-safe conditional processing by validating structural conformance of values against schemas and producing boolean results.

When processing a `$matches` directive, implementations MUST:

1. Transform the directive's value to obtain a JSON Schema:

   - Apply the Node Transformation
   - If the result is not a valid JSON Schema, return an error

2. Validate the Input Node against the schema:

   - Perform JSON Schema validation following JSON Schema Draft 2020-12 [JSONSCHEMA] using the Input Node as the Instance to validate
   - The schema MUST be processed according to the dialect specified in the schema's `$schema` property, or JSON Schema Draft 2020-12 if no dialect is specified
   - Format validation MUST be performed according to the Format-Annotation Vocabulary, as permitted by section 7.2.1 of JSON Schema Validation [JSONSCHEMAVALIDATION]

3. Return the validation result:

   - If validation succeeds, return the boolean value `true` as the Output Node
   - If validation fails, return the boolean value `false` as the Output Node

The primary application of this directive is providing structural validation in control-flow predicates:

```json
{
  "$if": {
    "$": "user.profile",
    "$matches": { "type": "object", "required": ["id"] }
  },
  "$then": "Valid profile",
  "$else": "Missing ID"
}
```

The `$matches` directive integrates JSON Schema's structural validation capabilities with Tool Form's transformation model. This integration enables templates to make decisions based on the structural properties of values while leveraging an established schema language rather than introducing template-specific validation semantics.

### 5.4. `$transform` Directive

The `$transform` directive processes values through named transforms. It enables templates to apply Transforms in directive contexts, while maintaining clear boundaries between transformation and value processing.

When processing a `$transform` directive, implementations MUST:

1. Transform the directive's value:

   - Apply the Node Transformation
   - If the result is a string, use it as a single Transform name
   - If the result is an array, verify each element is a string
   - For any other result, return an Undefined Value

2. For each Transform name in sequence:

   - Look up the named Transform
   - Return an error if the Transform is not recognized
   - Apply the Transform to the current value according to §2.4
   - Use the result as input to the next Transform
   - If any Transform produces an Undefined Value, return an Undefined Value

3. Return the final transformed value

For example, simple length transform:

```jsonc
{
  "counts": {
    "name": { "$": "user.name", "$transform": "length" },
    "roles": { "$": "user.roles", "$transform": "length" }
  }
}
```

Given:

```jsonc
{
  "user": {
    "name": "Alice",
    "roles": ["admin", "editor"]
  }
}
```

Produces:

```jsonc
{
  "counts": {
    "name": 5,
    "roles": 2
  }
}
```

Transform chains enable natural composition:

```jsonc
{
  "first_tag": {
    "$": "items[*].tag",
    "$transform": ["sort", "first"]
  }
}
```

The directive maintains strict boundaries between transformation and value processing while enabling sophisticated value manipulation through transform composition. Each transform operates independently according to §2.4, enabling predictable value processing while keeping the directive's behavior focused and consistent.

### 5.5. `$encode` Directive

The `$encode` directive serializes values through format-specific encodings. It enables templates to produce various output formats while maintaining clear boundaries between transformation and serialization concerns.

When processing an `$encode` directive, implementations MUST:

1. Transform the directive's value:

   - Apply the Node Transformation
   - If the result is a string, use it as a single Encoding name
   - If the result is an array, verify each element is a string
   - For any other result, return an Undefined Value

2. For each Encoding name in sequence:

   - Look up the named Encoding
   - Return an error if the Encoding is not supported
   - Apply the Encoding to the current input value
   - Use the encoded result as the input to the next Encoding

3. Return the final encoded result

For example, simple JSON encoding:

```jsonc
{
  "data": {
    "user": "alice",
    "role": "admin",
    "$encode": "json"
  }
}
```

Produces:

```jsonc
"{\"user\":\"alice\",\"role\":\"admin\"}"
```

Encoding chains enable natural composition of formats:

```jsonc
{
  "payload": {
    "user": { "$": "username" },
    "action": "login",
    "$encode": ["json", "base64"]
  }
}
```

Given:

```jsonc
{
  "username": "alice"
}
```

Produces:

```
eyJ1c2VyIjoiYWxpY2UiLCJhY3Rpb24iOiJsb2dpbiJ9
```

Dynamic encoding selection maintains template flexibility:

```jsonc
{
  "content": {
    "items": { "$": "data.items" },
    "$encode": {
      "$if": "$.format == 'binary'",
      "$then": "base64",
      "$else": "json"
    }
  }
}
```

The directive maintains strict boundaries between transformation and serialization while enabling sophisticated output generation through encoding composition. Each encoding defines its own serialization rules, enabling format-specific features while keeping the directive's behavior focused and predictable.

## 6. Value Transforms

Transforms define how JSON values are converted through unitary functions. Each Transform takes a single Input Value and produces a single Output Value, maintaining strict type safety throughout the conversion process.

This section defines the standard Transforms that enable common value manipulations. Each Transform maintains clear input and output type constraints while providing predictable conversion semantics. Implementations MAY support additional Transforms beyond those defined in this specification. Each Transform, whether standard or extended, operates independently of template structure and directive processing, enabling use in both pipe expressions and directive contexts.

### 6.1. `length` Transform

The `length` transform returns the size of a value. For strings, it counts Unicode code points. For arrays, it counts elements. For objects, it counts enumerable properties.

When processing a value with the `length` transform, implementations MUST:

1. For strings:

   - Count the number of Unicode code points
   - Return that count as a number

2. For arrays:

   - Count the number of elements
   - Return that count as a number

3. For objects:

   - Count the number of enumerable properties
   - Return that count as a number

4. For all other input types:

   - Return an Undefined Value

For example, given the Template Arguments:

```jsonc
{
  "text": "Hello, 世界",
  "list": ["a", "b", "c"],
  "obj": {
    "x": 1,
    "y": 2
  }
}
```

The following expressions demonstrate `length` behavior:

| Expression          | Result | Note                            |
| ------------------- | ------ | ------------------------------- |
| `text \| length`    | `8`    | Unicode code points in string   |
| `list \| length`    | `3`    | Elements in array               |
| `obj \| length`     | `2`    | Properties in object            |
| `missing \| length` | n/a    | Undefined Value for other types |

The transform enables consistent size measurement across different value types while maintaining clear type boundaries and predictable behavior.

### 6.2. `sort` Transform

The `sort` transform orders arrays and objects according to the total order defined in section 2.1.1.

When processing a value with the `sort` transform, implementations MUST:

1. For arrays:

   - Sort elements using the total order defined in section 2.1.1
   - Return the sorted array

2. For objects:

   - Sort property names in lexicographic order
   - Return a new object with properties in sorted order
   - Property values remain unchanged

3. For all other input types:

   - Return an Undefined Value

For example, given the Template Arguments:

```jsonc
{
  "arrays": [[1, 2], [1], [1, 1], [2]],
  "object": { "z": 1, "a": 2, "y": 1 },
  "mixed": [true, 1, "z", null, "a", 42]
}
```

The following expressions demonstrate the total order:

| Expression       | Result                     | Note                            |
| ---------------- | -------------------------- | ------------------------------- |
| `arrays \| sort` | `[[1],[1,1],[1,2],[2]]`    | Elements in lexicographic order |
| `object \| sort` | `{"a":2,"y":1,"z":1}`      | Keys in lexicographic order     |
| `mixed \| sort`  | `[null,true,1,42,"a","z"]` | Cross-type ordering             |

The transform enables stable sorting across all JSON values through the total order defined in section 2.1.1.

### 6.3. `first` Transform

The `first` transform returns the first element of an array.

When processing a value with the `first` transform, implementations MUST:

1. If the value is an array:

   - Return the first element of the array
   - If the array is empty, return an Undefined Value

2. For all other input types:

   - Return an Undefined Value

For example, given the Template Arguments:

```jsonc
{
  "array": [1, 2, 3],
  "string": "Hello",
  "object": { "key": "value" },
  "undefined": null
}
```

The following expressions demonstrate `first` behavior:

| Expression           | Result    | Note                           |
| -------------------- | --------- | ------------------------------ |
| `array \| first`     | `1`       | First element of array         |
| `string \| first`    | `"H"`     | First character of string      |
| `object \| first`    | `"value"` | First property of object       |
| `undefined \| first` | n/a       | Undefined Value for non-arrays |

The transform enables consistent extraction of the first element from different value types while maintaining clear semantics.

### 6.4. `last` Transform

The `last` transform returns the last element of an array.

When processing a value with the `last` transform, implementations MUST:

1. If the value is an array:

   - Return the last element of the array
   - If the array is empty, return an Undefined Value

2. For all other input types:

   - Return an Undefined Value

For example, given the Template Arguments:

```jsonc
{
  "array": [1, 2, 3],
  "string": "Hello",
  "object": { "key": "value" },
  "undefined": null
}
```

The following expressions demonstrate `last` behavior:

| Expression          | Result    | Note                           |
| ------------------- | --------- | ------------------------------ |
| `array \| last`     | `3`       | Last element of array          |
| `string \| last`    | `"o"`     | Last character of string       |
| `object \| last`    | `"value"` | Last property of object        |
| `undefined \| last` | n/a       | Undefined Value for non-arrays |

The transform enables consistent extraction of the last element from different value types while maintaining clear semantics.

## 7. Encodings

Encodings define how JSON values are serialized into specific output formats. Each encoding defines a JSON representation of its target format. This approach enables templates to work directly with format-specific concepts while maintaining JSON's structural clarity.

This section defines the standard encodings that enable common format generation tasks. Implementations MAY support additional encodings beyond those defined in this specification. Each encoding, whether standard or extended, defines its own serialization rules and domain properties.

### 7.1. JSON Encoding

The "json" Encoding produces standard JSON output as defined in [RFC8259].

When processing a Node using the "json" Encoding, the output MUST be valid JSON as defined in [RFC8259]. The Output Node MUST have a Content-Type header with value "application/json".

The encoding recognizes the following Domain Property:

- `$indent`: Controls output formatting. The value MUST be one of:

  - `true`: Output is formatted with 2-space indentation
  - A positive integer: Output is formatted with that number of spaces for indentation
  - `false` or absent: Output is compact without any whitespace between tokens
  - Any other value: Implementations MUST treat as if the property were absent

Example with compact output:

```jsonc
{
  "$encode": "json",
  "user": {
    "name": "Example User",
    "id": 12345,
    "roles": ["admin", "user"]
  }
}
```

Output:

```jsonc
"{\"user\":{\"name\":\"Example User\",\"id\":12345,\"roles\":[\"admin\",\"user\"]}}"
```

Example with pretty-printing:

```jsonc
{
  "$encode": "json",
  "$indent": true,
  "user": {
    "name": "Example User",
    "id": 12345,
    "roles": ["admin", "user"]
  }
}
```

Output:

```jsonc
"{
  \"user\": {
    \"name\": \"Example User\",
    \"id\": 12345,
    \"roles\": [
      \"admin\",
      \"user\"
    ]
  }
}"
```

### 7.2. Base64 Encoding

The "base64" Encoding produces Base64-encoded output as defined in [RFC4648].

When processing a Node using the "base64" Encoding, it encodes the Node's value as Base64. If a `$content` Domain Property is present, its transformed value is encoded instead. If the `$content` value contains an `$encode` directive, that Encoding is applied first.

The Output Node MUST have a Content-Type header with value "application/base64". The output MUST NOT include line breaks. Padding characters (=) MUST be added as required by section 3.1 of [RFC4648].

Example without `$content`:

```jsonc
{
  "$encode": "base64",
  "message": "Hello, World!"
}
```

Output:

```
eyJtZXNzYWdlIjoiSGVsbG8sIFdvcmxkISJ9
```

Example with `$content` and nested encoding:

```jsonc
{
  "$encode": "base64",
  "$content": {
    "$encode": "urlencoded",
    "user": "john",
    "action": "login"
  }
}
```

Output:

```
dXNlcj1qb2huJmFjdGlvbj1sb2dpbg==
```

### 7.3. urlencoded Encoding

The "urlencoded" Encoding produces output conforming to the `application/x-www-form-urlencoded` media type [RFC1866].

When converting scalar values to strings, implementations MUST:

- Convert boolean values to lowercase "true" or "false"
- Convert numbers using their canonical JSON string representation
- Convert strings directly without modification
- Return an error for Binary Values
- Omit null and undefined values entirely

Implementations MUST process the Node as follows:

1. If the Node's value is null, undefined, or not an object, return an empty string.

2. For each child Node with a non-null, non-undefined value:

   - Generate the key by joining the path components with periods (.)
   - Convert the value to a string as specified above
   - Replace spaces with plus signs (+) in both key and value
   - Percent-encode all other reserved characters in both key and value per [RFC1866] §8.2.1
   - Join the key and value with an equals sign (=)

3. Join all key-value pairs with ampersands (&).

The Output Node MUST have a Content-Type header with value "application/x-www-form-urlencoded".

For example:

```jsonc
{
  "user": {
    "name": "Alice Smith",
    "roles": ["admin", "editor"]
  },
  "active": true,
  "metadata": null
}
```

This transformation outputs:

```
user.name=Alice+Smith&user.roles.0=admin&user.roles.1=editor&active=true
```

## 8. Security Considerations

Tool Form enables dynamic transformation of JSON values through templates that can access external resources, query data through JSONPath expressions, and produce encoded output in various formats. This flexibility creates several security considerations that implementations must address.

The primary risks arise from processing untrusted templates. Templates can attempt to exhaust system resources through complex directive compositions, access sensitive data through JSONPath expressions, retrieve unauthorized external resources through URI-References, or exploit format-specific vulnerabilities in encodings. These risks are amplified when templates from untrusted sources are processed in security-sensitive contexts.

Implementations must carefully manage access to the Template Arguments, external resources, and output encodings. They must also implement appropriate resource controls to prevent denial of service through malicious templates. The following sections examine specific attack vectors and provide requirements for secure implementation.

### 8.1. Attacks Through Malicious Templates

Tool Form processes templates that control transformation behavior through directives. When these templates come from untrusted sources, they can be crafted to exhaust system resources or exploit implementation assumptions.

Templates can cause resource exhaustion through directive composition. The `$spread` directive can expand single values into large arrays or objects. Nested spreads can cause exponential growth. Recursive template references through `$` can create deep processing chains. Complex JSONPath queries in predicates can consume excessive CPU time.

Implementations MUST enforce limits on:

- Template processing depth
- Expansion size from spread operations
- Number of directive evaluations
- JSONPath query complexity
- Output document size

Templates can also exploit structural assumptions through malformed directive combinations or invalid values. Multiple Domain Directives in a single object, invalid directive values, or unexpected combinations can trigger implementation-specific behaviors.

Implementations MUST:

- Validate all directive values before processing
- Enforce directive composition rules
- Maintain clear processing boundaries
- Handle all error conditions explicitly

### 8.2. Resource Access Through URI-References

Variable expressions in Tool Form can reference external resources through URI-References, enabling template composition and resource inclusion. This capability creates a security boundary between the transformation engine and external resources that must be carefully managed. The security implications and appropriate controls depend significantly on the deployment context, with different considerations for server-side and client-side implementations.

When processing URI-References, implementations MUST:

- Have an explicit URI resolution policy that specifies:

  - Which URI schemes are supported (e.g., file, http, https)
  - How references are resolved for each supported scheme
  - What security controls are applied to resolution
  - How resolution failures are handled

- Document their URI resolution behavior including:

  - Supported URI schemes and their security implications
  - Resource access restrictions and controls
  - Error handling and timeout policies
  - Resource size and processing limits

Server-side implementations face particular risks:

- File system access could expose sensitive data or configuration
- Network requests could enable Server-Side Request Forgery (SSRF)
- Internal network topology might be revealed through error messages
- Resource resolution might expose internal credentials

Client-side implementations have different concerns:

- Local file access requires appropriate user permissions
- Network requests need proper authentication and authorization
- Credentials require secure handling
- Platform security policies must be respected

All implementations MUST implement appropriate controls:

- Resource Resolution:

  - Validate all URI-References before resolution
  - Apply appropriate access controls to resolution
  - Handle resolution failures without information disclosure
  - Implement timeouts for external resource access

- Resource Processing:

  - Enforce size limits on retrieved resources
  - Prevent circular reference chains
  - Handle malformed resources safely
  - Apply consistent security policies

Implementations SHOULD:

- Provide mechanisms to restrict which resources can be accessed
- Implement safe resolution mechanisms like resource dictionaries
- Allow configuration of security policies per deployment context
- Log access attempts for security monitoring

For example, a secure server-side implementation might:

- Disable file system access entirely
- Restrict HTTP(S) access to specific domains
- Implement a resource dictionary for controlled access
- Apply consistent timeout and size limits

While a client-side implementation might:

- Implement platform-appropriate file access controls
- Handle network requests according to platform security policies
- Respect system security boundaries
- Provide appropriate user feedback for access decisions

### 8.3. Information Disclosure Through JSONPath

JSONPath expressions in templates can access data in the Template Arguments through various directives. Without proper controls, templates from untrusted sources could extract sensitive information through both direct access and side channels.

Direct access occurs through `$` and `$include` directives, and via string interpolation. Each expression potentially reveals data from the Template Arguments. Implementations MUST provide mechanisms to restrict which parts of the Template Arguments can be accessed through JSONPath.

Information can also leak through indirect channels. Error messages from invalid queries may expose structure or values. Timing differences in query evaluation can reveal information about matched data. Output size variations from `$spread` operations can indicate content characteristics. Predicate evaluation results may expose boolean properties of protected data.

Implementations MUST:

- Validate and authorize all JSONPath expressions
- Sanitize error messages to prevent disclosure
- Consider timing attacks when processing security-critical data
- Apply uniform size limits across operations

### 8.4. External System Attacks Through Encodings

Encodings transform JSON values into formats consumed by external systems. Each encoding presents unique security challenges, from format-specific vulnerabilities to composition risks. These risks are amplified by the ability to extend the encoding system with new formats.

Format-specific vulnerabilities arise when encoded output is interpreted by external systems. For example, insufficient escaping in urlencoded output can enable injection attacks, while malformed multipart boundaries can exploit MIME parser assumptions. Each encoding must implement appropriate security controls for its target format.

Encoding composition creates additional risks. A single template might encode values through multiple formats, with each encoding's output becoming another encoding's input. Security properties must be preserved across these encoding chains. For example, a JSON value encoded as base64 then embedded in a multipart message must maintain proper escaping at each step.

Implementations MUST:

- Validate encoded output for each format
- Preserve security properties across encoding chains
- Verify security controls in extended encodings
- Maintain isolation between encoding contexts

## 9. IANA Considerations

IANA is requested to create a new "Tool Form" registry. The Directive, Transform, and Encoding registries enable implementations to extend Tool Form's capabilities in an interoperable way. While implementations are not required to support extension directives, transforms, or encodings, these registries provide a standard mechanism for documenting and sharing such extensions.

### 9.1. Directive Subregistry

IANA is requested to create a new "Directive" subregistry in the "Tool Form" registry. The "Directive" subregistry has the policy "Specification Required" [RFC8126].

Each registration MUST include:

Name:
: The directive name (starting with "$" followed by ASCII letters, digits, and underscores)

Category:
: One of: "Modifier", "Domain", or "Operator"

Description:
: A brief description of the directive's purpose

Value Type:
: The allowed JSON type(s) for the directive's value

Domain Properties:
: Names and descriptions of any domain properties

Reference:
: Reference to the specification defining the directive

Initial registrations for this registry are:

#### Modifier Directives

Name: $meta  
Category: Modifier  
Description: Provides metadata about a template  
Value Type: object  
Domain Properties: none  
Reference: Section 3.1 of this document

Name: $comment  
Category: Modifier  
Description: Provides a comment about a template  
Value Type: any  
Domain Properties: none  
Reference: Section 3.2 of this document

#### Domain Directives

Name: $  
Category: Domain  
Description: Evaluates JSONPath expressions  
Value Type: string  
Domain Properties: none  
Reference: Section 4.1 of this document

Name: $uri  
Category: Domain  
Description: Expands URI Templates [RFC6570]  
Value Type: string  
Domain Properties: Template variable overrides  
Reference: Section 4.3 of this document

Name: $include  
Category: Domain  
Description: Includes a URI reference  
Value Type: string  
Domain Properties: none  
Reference: Section 4.4 of this document

Name: $spread  
Category: Domain  
Description: Merges object properties or array elements  
Value Type: string, array, or object  
Domain Properties: none  
Reference: Section 4.5 of this document

Name: $if  
Category: Domain  
Description: Controls conditional processing  
Value Type: string  
Domain Properties: $then (any), $else (any)  
Reference: Section 4.6 of this document

Name: $when  
Category: Domain  
Description: Provides conditional inclusion  
Value Type: string  
Domain Properties: none  
Reference: Section 4.7 of this document

Name: $each  
Category: Domain  
Description: Iterates over nodes from a JSONPath expression  
Value Type: string  
Domain Properties: $as (string, required), $value (any), $key (any)  
Reference: Section 4.7 of this document

#### Operator Directives

Name: $join  
Category: Operator  
Description: Joins strings with a separator  
Value Type: string  
Domain Properties: n/a  
Reference: Section 5.1 of this document

Name: $match  
Category: Operator  
Description: Matches a value against a JSON Schema  
Value Type: string  
Domain Properties: n/a  
Reference: Section 5.2 of this document

Name: $matches  
Category: Operator  
Description: Validates a value against a JSON Schema  
Value Type: string  
Domain Properties: n/a  
Reference: Section 5.3 of this document

Name: $transform  
Category: Operator  
Description: Applies a Transform  
Value Type: string  
Domain Properties: n/a  
Reference: Section 5.4 of this document

Name: $encode  
Category: Operator  
Description: Applies an Encoding  
Value Type: string  
Domain Properties: n/a  
Reference: Section 5.5 of this document

### 9.2. Transform Subregistry

IANA is requested to create a new "Transform" subregistry in the "Tool Form" registry. The "Transform" subregistry has the policy "Specification Required" [RFC8126].

Each registration MUST include:

Name:
: The transform name (ASCII letters, digits, and underscores)

Description:
: A brief description of the transform's purpose

Input Types:
: The JSON types the transform accepts as input

Output Type:
: The JSON type(s) the transform produces, or "any" if variable

Reference:
: Reference to the specification defining the transform

Initial registrations for this registry are:

Name: length  
Description: Returns the length of a value (string length, array length, or number of object properties)  
Input Types: string, array, object  
Output Type: number  
Reference: Section 6.1 of this document

Name: sort  
Description: Orders array elements according to natural ordering rules  
Input Types: array  
Output Type: array  
Reference: Section 6.2 of this document

Name: first  
Description: Returns the first element of an array  
Input Types: array  
Output Type: any  
Reference: Section 6.3 of this document

Name: last  
Description: Returns the last element of an array  
Input Types: array  
Output Type: any  
Reference: Section 6.4 of this document

### 9.3. Encoding Subregistry

IANA is requested to create a new "Encoding" subregistry in the "Tool Form" registry. The "Encoding" subregistry has the policy "Specification Required" [RFC8126].

Each registration MUST include:

Name:
: The encoding name (ASCII letters and digits)

Description:
: A brief description of the encoding

Media Type:
: The primary media type produced by the encoding

Reference:
: Reference to the specification defining the encoding

Initial registrations for this registry are:

Name: json
Description: JSON text encoding
Media Type: application/json
Reference: Section 7.1 of this document

Name: base64
Description: Base64 encoding [RFC4648]
Media Type: application/base64
Reference: Section 7.2 of this document

Name: urlencoded
Description: URL-encoded form data
Media Type: application/x-www-form-urlencoded
Reference: Section 7.3 of this document

## 10. References

### 10.1. Normative References

[RFC1866] Berners-Lee, T. and D. Connolly, "Hypertext Markup Language -  
2.0", RFC 1866, DOI 10.17487/RFC1866, November 1995,  
<https://www.rfc-editor.org/info/rfc1866>.

[RFC2119] Bradner, S., "Key words for use in RFCs to Indicate  
Requirement Levels", BCP 14, RFC 2119,  
DOI 10.17487/RFC2119, March 1997,  
<https://www.rfc-editor.org/info/rfc2119>.

[RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC  
2119 Key Words", BCP 14, RFC 8174, DOI 10.17487/RFC8174,  
May 2017, <https://www.rfc-editor.org/info/rfc8174>.

[RFC8259] Bray, T., Ed., "The JavaScript Object Notation (JSON) Data  
Interchange Format", STD 90, RFC 8259, DOI 10.17487/RFC8259,  
December 2017, <https://www.rfc-editor.org/info/rfc8259>.

[RFC6901] Bryan, P., Ed., Zyp, K., and M. Nottingham, Ed.,  
"JavaScript Object Notation (JSON) Pointer", RFC 6901,  
DOI 10.17487/RFC6901, April 2013,  
<https://www.rfc-editor.org/info/rfc6901>.

[RFC9535] Gössner, S., Normington, G., and C. Bormann, "JSONPath:  
Query Expressions for JSON", RFC 9535,  
DOI 10.17487/RFC9535, December 2023,  
<https://www.rfc-editor.org/info/rfc9535>.

[RFC6570] Gregorio, J., Fielding, R., Hadley, M., Nottingham, M.,  
and D. Orchard, "URI Template", RFC 6570,  
DOI 10.17487/RFC6570, March 2012,  
<https://www.rfc-editor.org/info/rfc6570>.

[RFC2046] Freed, N. and N. Borenstein, "Multipurpose Internet Mail  
Extensions (MIME) Part Two: Media Types", RFC 2046,  
DOI 10.17487/RFC2046, November 1996,  
<https://www.rfc-editor.org/info/rfc2046>.

[JSONSCHEMA] Bhutton, B., Gonzalez, H., Wright, A., and H. Andrews,  
"JSON Schema: A Media Type for Describing JSON Documents",  
Internet-Draft draft-bhutton-json-schema-01, December 2020,  
<https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01>.

[JSONSCHEMAVALIDATION] Bhutton, B., Henry, P., Wright, A., and H. Andrews,  
"JSON Schema Validation: A Vocabulary for Structural Validation of JSON",  
Internet-Draft draft-bhutton-json-schema-validation-01, December 2020,  
<https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01>.

### 10.2. Informative References

[RFC7159] Bray, T., Ed., "The JavaScript Object Notation (JSON) Data  
Interchange Format", RFC 7159, DOI 10.17487/RFC7159,  
March 2014, <https://www.rfc-editor.org/info/rfc7159>.

[RFC8288] Nottingham, M., "Web Linking", RFC 8288,  
DOI 10.17487/RFC8288, October 2017,  
<https://www.rfc-editor.org/info/rfc8288>.

[RFC7396] Hoffman, P. and J. Snell, "JSON Merge Patch", RFC 7396,  
DOI 10.17487/RFC7396, October 2014,  
<https://www.rfc-editor.org/info/rfc7396>.

[RFC4648] Josefsson, S., "The Base16, Base32, and Base64 Data  
Encodings", RFC 4648, DOI 10.17487/RFC4648,  
October 2006, <https://www.rfc-editor.org/info/rfc4648>.

## Appendix A. Examples

This appendix provides examples that demonstrate how Tool Form's features combine to solve real-world problems. These examples illustrate key capabilities not immediately apparent from the examples in the main specification.

### A.1. API Request Generation

Modern APIs often require complex request bodies that combine multiple formats. This example demonstrates how Tool Form handles mixed-format data through encoding composition while maintaining clear template structure.

```jsonc
{
  "request": {
    "$comment": "User registration with profile image",
    "method": "POST",
    "url": {
      "$uri": "https://api.example.com/users{?tenant}",
      "tenant": "$.context.tenant_id"
    },
    "headers": {
      "Authorization": "Bearer {{$.auth.token}}"
    },
    "body": {
      "$encode": "multipart",
      "user": {
        "$encode": "json",
        "name": { "$": "user.name" },
        "email": { "$": "user.email" },
        "preferences": { "$spread": "$.user.settings" }
      },
      "metadata": {
        "$encode": "urlencoded",
        "source": "api",
        "version": "2.0",
        "timestamp": "{{$.now}}"
      },
      "avatar": {
        "$contentType": "image/png",
        "$filename": "avatar.png",
        "$encode": "base64",
        "$content": { "$": "user.avatar" }
      }
    }
  }
}
```

This template generates a multipart request containing JSON user data, URL-encoded metadata, and a base64-encoded image. The encodings work together naturally while maintaining clear separation between formats. The template handles authentication, query parameters, and complex body encoding through composition of standard directives.

### A.2. Dynamic Document Generation

Tool Form enables documents to evolve naturally from static JSON to dynamic templates. This example shows how directives can be added incrementally while preserving document structure and maintainability.

```jsonc
{
  "service": {
    "name": "payment-processor",
    "environment": { "$": "deploy.environment" },
    "replicas": {
      "$if": "$.deploy[@.environment == 'production']",
      "$then": {
        "$if": "$.deploy.high_availability",
        "$then": 3,
        "$else": 2
      },
      "$else": 1
    },
    "resources": {
      "$when": "$.deploy[@.environment == 'production']",
      "cpu": "2",
      "memory": "4Gi"
    },
    "config": {
      "database": {
        "host": "db-{{$.deploy.environment}}.internal",
        "credentials": {
          "$": "secrets.db"
        }
      },
      "features": {
        "audit": true,
        "metrics": true,
        "tracing": {
          "$when": "$.deploy[@.environment != 'development']"
        }
      }
    }
  }
}
```

The template starts as a basic service configuration, with directives added only where dynamic values or conditional logic are needed. This maintains readability while enabling sophisticated environment-specific customization. Note how static and dynamic content combine naturally through JSON's structure.

### A.3. Format Translation

This example demonstrates Tool Form's capability to translate between formats while preserving structure and handling format-specific requirements. It shows how encoding composition enables complex transformations that would be difficult to achieve through other means.

```jsonc
{
  "message": {
    "$comment": "Transforms structured data into email message",
    "$encode": "multipart",
    "$subtype": "alternative",
    "text": {
      "$encode": "text",
      "$contentType": "text/plain",
      "$content": "Order {{$.order.id}}\n\nItems:\n{{$.order.items[*]..name}}\n\nTotal: ${{$.order.total}}"
    },
    "html": {
      "$encode": "text",
      "$contentType": "text/html",
      "$content": {
        "$encode": "html",
        "sections": [
          { "$h1": "Order {{$.order.id}}" },
          {
            "$ul": {
              "$each": "$.order.items",
              "$as": "item",
              "$value": "{{$.item.name}}: ${{$.item.price}}"
            }
          },
          { "$p": "Total: ${{$.order.total}}" }
        ]
      }
    },
    "data": {
      "$encode": "json",
      "$contentType": "application/json",
      "order": {
        "id": { "$": "order.id" },
        "items": { "$": "order.items" },
        "total": { "$": "order.total" },
        "customer": { "$": "order.customer" }
      }
    }
  }
}
```

This template transforms order data into a multipart email message with plain text, HTML, and JSON versions. Each format has specific requirements - text needs proper line breaks, HTML needs escaped markup, and JSON needs proper structure. The encoding system handles these requirements while maintaining a clear relationship to the source data.

## Appendix B. Change Log
