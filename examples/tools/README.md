# Tool Form AI Tool Examples

This directory contains a progressive series of examples demonstrating how to connect AI to APIs through semantic templates. These examples focus on solving real-world integration challenges — the kind that determine whether AI systems can reliably interact with the digital ecosystem at scale.

## Overview

Modern AI excels at understanding intent but struggles with protocol mechanics. Tool Form bridges this gap through structured transformations that project between semantic understanding and protocol requirements. These examples demonstrate architectural patterns that address three fundamental challenges:

1. **Tools as Data** - Representing tools as structured data instead of bespoke code
2. **Tools as Knowledge** - Making tools discoverable and accessible through semantic understanding
3. **Tools as Assets** - Enabling tools to evolve and improve over time

Each example is a self-contained TypeScript file that can be run directly with Node.js, Deno, or Bun without compilation steps.

## Running the Examples

```bash
# Install dependencies
pnpm install

# Run a specific example (replace with any example filename)
node --experimental-strip-types semantic-bridge.ts

# To use your own API keys
GITHUB_TOKEN=your_token WEATHER_API_KEY=your_key node --experimental-strip-types example-name.ts

# Run in demo mode (with canned responses)
DEMO_MODE=true node --experimental-strip-types example-name.ts
```

## Phase 1: Tools as Data

### 1. Semantic Bridge ([`semantic-bridge.ts`](semantic-bridge.ts))

**The Challenge:** AI systems need to interact with APIs but get bogged down in protocol details, syntax requirements, and implementation mechanics.

This example demonstrates how Tool Form creates a complete round-trip bridge between semantic intent and HTTP protocol requirements:

- Transforming semantic parameters into precise API requests
- Reconstructing API responses into meaningful results
- Maintaining AI focus on task semantics rather than protocol details

**Key Insight:** The right abstraction boundary lets AI systems remain in semantic space throughout the entire operation, crossing protocol boundaries without getting entangled in implementation details.

### 2. Protocol Projection ([`protocol-projection.ts`](protocol-projection.ts))

**The Challenge:** Integrating with multiple APIs requires repeating similar HTTP handling code across different endpoints.

This example shows how Tool Form enables a single execution pattern to handle diverse API endpoints:

- Factoring out templates from execution logic for cleaner abstractions
- Handling different API patterns through consistent template transformations
- Reducing API integration to a projection problem

**Key Insight:** APIs cluster into protocol families where many semantic operations project onto similar protocol patterns, allowing amortization of implementation effort across tools.

### 3. Self-Containment ([`self-containment.ts`](self-containment.ts))

**The Challenge:** Tool implementations tightly couple semantic understanding, protocol mechanics, and execution logic.

This example demonstrates how to create self-contained tool units that combine all necessary components:

- Combining templates, schemas, and metadata into portable tool handles
- Making tools fully self-describing
- Enabling serialization and transmission across system boundaries

**Key Insight:** When tools become self-contained data structures, they can move freely between applications, environments, and contexts while maintaining their complete functionality.

## Phase 2: Tools as Knowledge

### 4. Functional Embeddings ([`functional-embeddings.ts`](functional-embeddings.ts))

**The Challenge:** Scaling tool-augmented AI faces a fundamental barrier - either limit to hardcoded tools or overwhelm the model with irrelevant options.

This example shows how Tool Form enables dynamic tool selection through semantic embeddings:

- Embedding tools based on their functionality in the same vector space as user prompts
- Dynamically selecting relevant tools for each prompt before LLM generation
- Scaling to thousands of tools without overwhelming model context

**Key Insight:** By performing similarity search between user prompts and tool embeddings, we can dynamically provide only relevant tools to the LLM for each specific request - the foundation of Tool Augmented Generation (TAG).

### 5. Tool Augmented Generation ([`tool-augmented-generation.ts`](tool-augmented-generation.ts))

**The Challenge:** AI systems need access to potentially thousands of tools but can only effectively use a handful in any given context.

This example demonstrates the complete Tool Augmented Generation (TAG) pipeline - the culmination and primary purpose we've been building towards:

- Processing user prompts through parallel semantic pipelines for both knowledge and tool retrieval
- Dynamically selecting and presenting only relevant tools to the LLM at generation time
- Eliminating the scaling barrier between tool availability and LLM context efficiency

**Key Insight:** By representing tools as data rather than code, we can perform semantic retrieval before generation begins, giving LLMs access to potentially unlimited tool libraries while only presenting precisely the tools needed for each specific prompt - fundamentally transforming how AI systems interact with the digital world.

### 6. Low-Entropy Gate ([`low-entropy-gate.ts`](low-entropy-gate.ts))

**The Challenge:** AI systems operate in high-dimensional semantic space, but must interact with the world through constrained, deterministic interfaces.

This example demonstrates how Tool Form implements the fundamental governance boundary between AI intentions and real-world actions:

- Creating controlled, validated transitions between semantic and protocol spaces
- Enabling precise human oversight of AI capabilities without limiting semantic flexibility
- Maintaining security, auditability, and accountability as structural properties
- Ensuring credentials and permissions remain invisible to and unmodifiable by AI

**Key Insight:** The low-entropy gate isn't a limitation but a governance requirement - by forcing AI actions through well-defined, constrained interfaces, we enable AI systems to maintain their creative, high-dimensional thinking while ensuring human control over their actual impact on the world.

## Phase 3: Tools as Assets

### 7. Universal Integration ([`universal-integration.ts`](universal-integration.ts))

**The Challenge:** Different protocols (HTTP, CLI, functions) require entirely different integration approaches.

This example demonstrates how Tool Form can unify protocol handling across boundaries:

- Projecting semantic operations onto multiple protocol types
- Providing consistent error handling across protocols
- Creating protocol abstractions that future-proof integrations

**Key Insight:** The projection between semantic understanding and protocol mechanics works across all protocol boundaries, enabling a unified approach to tool integration.

### 8. Automated Generation ([`automated-generation.ts`](automated-generation.ts))

**The Challenge:** Creating tools manually doesn't scale to the tens of thousands of APIs AI systems could potentially use.

This example shows how AI can generate tools from its understanding of common APIs:

- Generating tool handles from high-level descriptions
- Verifying and validating generated tools
- Enabling tool discovery and creation on demand

**Key Insight:** AI systems can create their own tools within the bounded projection space, dramatically reducing the effort required to connect AI to the digital ecosystem.

### 9. AI Optimization ([`ai-optimization.ts`](ai-optimization.ts))

**The Challenge:** Initial tool implementations may contain inefficiencies or fail to handle edge cases effectively.

This example demonstrates how AI can refine and improve tools over time:

- Analyzing tool execution patterns for optimization opportunities
- Improving error handling and response parsing
- Creating feedback loops that enhance reliability through usage

**Key Insight:** Tools as assets can evolve through systematic optimization, creating a virtuous cycle where usage data drives improvements that enhance further usage.

## Beyond These Examples

These examples demonstrate useful patterns for connecting AI to APIs through semantic templates. They can be combined and extended to create tool integration architectures tailored to specific domains and requirements.

For more on using Tool Form in production systems, see:

- [Tool Form](https://github.com/toolcog/tool-form) - Complete reference for Tool Form capabilities
- [Tool Handle](https://github.com/toolcog/tool-handle) - Connect AI to tools through protocol projection
