// Protocol Projection
//
// A demonstration of how Tool Form enables a single execution pattern to
// handle diverse API endpoints through dimensional projection.
//
// -----------------------------------------------------------------------------
// IDEA
// -----------------------------------------------------------------------------
//
// Core Concept:
//
// When integrating multiple APIs, developers typically create separate code
// paths for each endpoint, duplicating similar HTTP handling logic across
// different operations. This leads to:
//
// - Substantial code duplication across endpoint implementations
// - Inconsistent error handling and response processing
// - Growing maintenance burden as endpoints multiply
// - Difficulty in applying cross-cutting improvements
//
// The Protocol Projection pattern recognizes that APIs cluster into protocol
// families where many semantic operations project onto similar protocol patterns.
// By separating the protocol pattern from the specific endpoint details, we can
// amortize implementation effort across many tools.
//
// Key Insight:
//
// APIs share common architectural patterns despite surface differences:
//
// - RESTful APIs use similar URL construction patterns
// - GraphQL APIs share query structure and error handling
// - RPC systems follow comparable invocation patterns
// - OAuth-protected APIs share authentication flows
//
// By identifying these protocol families and extracting their patterns into
// reusable templates, we can reduce API integration from a linear problem
// (one implementation per endpoint) to a combinatorial problem (protocol patterns × endpoint mappings).
//
// Teaching Insights:
//
// This pattern builds on the Semantic Bridge by extending the concept of
// separation of concerns. While Semantic Bridge separates semantic from protocol
// spaces, Protocol Projection further decomposes protocol space into:
//
// - Protocol patterns (how HTTP requests are structured)
// - Endpoint mappings (what specific endpoints exist)
// - Authentication patterns (how credentials are applied)
// - Response handling patterns (how results are processed)
//
// The key teaching points are:
//
// - How to identify protocol families across seemingly different APIs
// - Why factoring execution patterns from endpoint details creates leverage
// - How template composition enables scaling to many endpoints
// - Why protocol projection drastically reduces implementation effort
//
// Narrative Connection:
//
// This example advances from "Tools as Data" to show how template composition
// creates scaling efficiencies. It introduces the concept of dimensional
// projection, where tools are expressed as combinations of orthogonal concerns
// rather than monolithic implementations. This sets up the later examples on
// discovery and generation by showing how tools can be broken into composable parts.
//
// Real-World Applications:
//
// - Enterprise API integration across hundreds of endpoints
// - Multi-service architectures with consistent patterns
// - API gateway implementations
// - Cross-cutting concerns like monitoring, logging, retries
// - Universal API clients that adapt to different services
//
// -----------------------------------------------------------------------------
// PLAN
// -----------------------------------------------------------------------------
//
// Problem Setup:
//
// We'll demonstrate using multiple endpoints from a common API (like GitHub,
// HubSpot, or similar) that share structural patterns but differ in specific
// details. We'll show how Tool Form enables implementing many endpoints with
// minimal code duplication.
//
// Component Architecture:
//
// 1. Protocol Family Template
//    - Defines the shared structure for a family of API endpoints
//    - Implements common URL construction patterns
//    - Creates consistent header and authentication handling
//    - Establishes uniform error processing
//
// 2. Endpoint Mapping Templates
//    - Define specific endpoints within the protocol family
//    - Map semantic parameters to endpoint-specific values
//    - Specify endpoint-specific validation rules
//    - Configure response extraction for each endpoint
//
// 3. Authentication Template
//    - Implements shared authentication logic
//    - Manages credentials and token refresh
//    - Handles authorization errors consistently
//    - Provides security boundary between credential storage and usage
//
// 4. Projection Engine
//    - Combines protocol family, endpoint mapping, and authentication
//    - Resolves template composition at runtime
//    - Executes the projected operation
//    - Ensures consistent behavior across endpoints
//
// Control Flow:
//
// 1. AI provides semantic parameters for a specific operation
// 2. System identifies the appropriate endpoint mapping template
// 3. Projection engine combines endpoint mapping with protocol family template
// 4. Authentication is applied according to the authentication template
// 5. Combined template executes the operation through shared execution logic
// 6. Response is transformed according to endpoint-specific extraction rules
// 7. AI receives consistent semantic results regardless of endpoint
//
// Key Decision Points:
//
// - How to structure protocol family templates for maximum reuse
// - What level of specialization belongs in endpoint mappings
// - How to handle endpoint-specific quirks within a consistent pattern
// - When to create a new protocol family vs. specializing an existing one
// - How to structure authentication to work across protocol families
//
// Expected Outcomes:
//
// - Dramatic reduction in code duplication across endpoints
// - Consistent error handling and response processing
// - Ability to add new endpoints with minimal code
// - Cross-cutting improvements automatically apply to all endpoints
// - Clear separation between protocol patterns and endpoint specifics
//
// Tool Form Enablers:
//
// Tool Form makes this pattern possible by:
//
// 1. Providing template composition mechanisms
// 2. Enabling clean separation of protocol patterns from endpoint details
// 3. Facilitating runtime resolution of composed templates
// 4. Supporting transformation between template layers
// 5. Creating consistent validation across template boundaries
//
// The key to this pattern is using Tool Form to decompose protocol handling
// into orthogonal concerns (protocol patterns, endpoint mappings, authentication)
// that can be composed at runtime, dramatically reducing implementation effort
// as the number of endpoints grows.
