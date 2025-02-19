# Tool Form

[![Package](https://img.shields.io/badge/npm-0.1.0-ae8c7e?labelColor=3b3a37)](https://www.npmjs.com/package/tool-form)
[![License](https://img.shields.io/badge/license-MIT-ae8c7e?labelColor=3b3a37)](https://opensource.org/licenses/MIT)

A transformation engine that enables AI to use any API through semantic templates. Tool Form bridges the gap between how AI thinks about operations and how APIs actually work.

## What is Tool Form?

Tool Form is a new approach to connecting AI with APIs. Instead of requiring custom code for every API endpoint, Tool Form uses semantic templates that:

- Transform AI-friendly parameters into precise API calls
- Convert API responses into meaningful results
- Maintain clear security boundaries
- Handle protocol-specific formatting

## Why Tool Form?

The conventional approach of writing custom code for every API endpoint doesn't scale. As AI systems grow more capable, they need access to more APIs. But each API has its own:

- Protocol requirements (REST, GraphQL, SQL)
- Authentication methods
- Data formats
- Response structures

Tool Form solves this through a powerful insight: while APIs live in a high-dimensional space of semantic operations ("get user profile", "update email", "search documents"), they all project onto low-dimensional protocol spaces (HTTP's method/URL/headers/body, SQL's SELECT/FROM/WHERE, etc.).

Making this projection work in practice requires solving three core challenges:

1. **Structure Before Strings** - Every protocol has structure (JSON objects, HTTP headers, SQL clauses). Tool Form's structural templates guarantee well-formed output by working with this structure directly, not by manipulating strings.

2. **Clean Parameter Boundaries** - Parameters flow through multiple protocol layers (URL paths, query strings, JSON fields). Tool Form's hygienic substitution keeps these boundaries explicit and injection-free at every layer.

3. **Unified Transformation** - Real payloads are deeply layered (base64-encoded JSON inside multipart form data, JWT claims inside OAuth headers, escaped XML inside CDATA sections). Tool Form models the entire pipeline of transformations and encodings as a single unit, ensuring that structure and safety flow end-to-end.

## Documentation

- [Tool Form RFC](docs/tool-form-rfc.md) - Tool Form specification

## Packages

- [tool-form] - Core transformation engine
- [@tool-form/markdown] - Markdown document encoding
- [@tool-form/multipart] - Multipart encoding
- [@tool-form/args] - Command-line argument encoding

## Development

Tool Form uses pnpm workspaces for package management:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Watch for changes
pnpm dev
```

## Related Projects

Tool Form is part of a larger ecosystem for connecting AI to tools:

- [Tool Handle] - Connect AI to tools through protocol projection
- [HTTP Handle] - HTTP protocol handler for Tool Handle
- [Command Handle] - Command line handler for Tool Handle

## Community

- [Discord] - Join our developer community
- [GitHub Discussions] - Ask questions and share ideas
- [Contributing Guide] - Help improve Tool Form

## License

MIT © Tool Cognition Inc.

[tool-form]: packages/tool-form/README.md
[@tool-form/args]: packages/args/README.md
[@tool-form/markdown]: packages/markdown/README.md
[@tool-form/multipart]: packages/multipart/README.md
[Tool Handle]: https://github.com/toolcog/tool-handle
[HTTP Handle]: https://github.com/toolcog/http-handle
[Command Handle]: https://github.com/toolcog/command-handle
[Contributing Guide]: CONTRIBUTING.md
[Discord]: https://discord.gg/toolcog
[GitHub Discussions]: https://github.com/toolcog/tool-form/discussions
