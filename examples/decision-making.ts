// Structural Decision-Making
//
// A demonstration of how to create reliable agent behavior by structuring
// the decision space itself using Tool Form.
//
// -----------------------------------------------------------------------------
// IDEA
// -----------------------------------------------------------------------------
//
// Core Concept:
//
// LLM agents often make inconsistent decisions because their reasoning occurs in
// unstructured text. "Structural Decision-Making" creates reliability by:
//
// 1. Transforming fuzzy reasoning into explicit, structured decision spaces
// 2. Breaking complex decisions into discrete, compositional steps
// 3. Maintaining traceability between reasoning and conclusions
//
// The key insight is that we need to structure not just the execution of decisions,
// but the decision-making process itself. This provides:
//
// - Reproducibility across different runs
// - Graceful degradation under uncertainty
// - Explicit reasoning pathways for inspection
//
// Teaching Insights:
//
// This concept is challenging because it requires shifting how we think about
// agent prompting. Instead of asking "What should we do?" in unstructured text,
// we need to:
//
// 1. Define the specific decision to be made
// 2. Structure the options and evaluation criteria
// 3. Make the agent's reasoning explicit and compositional
//
// The key teaching points are:
//
// - Contrast between unstructured reasoning (brittle) and structured decisions (robust)
// - How reasoning can be decomposed into evaluable components
// - The power of making assumptions and criteria explicit
//
// Narrative Connection:
//
// This is the foundation of reliable agency. Every subsequent example builds on
// the idea that decision spaces should be structured. This pattern is essential
// before tackling more complex challenges because it creates a stable base for
// more sophisticated behaviors.
//
// Real-World Applications:
//
// - Critical decision-making systems where reliability matters
// - Knowledge work that requires traceable, justifiable conclusions
// - Complex decisions with multiple stakeholders needing transparency
// - Foundation for regulatory compliance in AI systems
//
// -----------------------------------------------------------------------------
// PLAN
// -----------------------------------------------------------------------------
//
// Problem Setup:
//
// We'll demonstrate using a content moderation scenario - an agent must decide
// whether a piece of content complies with community guidelines, explaining its
// reasoning clearly and consistently.
//
// Without structure, such decisions are notoriously inconsistent. We'll show how
// Tool Form creates decision structure that leads to reliable, traceable judgments.
//
// Component Architecture:
//
// 1. Decision Context Template
//    - Structures the scenario, content, and guidelines
//    - Provides context needed for decision-making
//
// 2. Decision Space Template
//    - Defines possible decisions (compliant/violation)
//    - Structures evaluation criteria explicitly
//    - Creates slots for reasoning about each criterion
//
// 3. Reasoning Framework Template
//    - Guides the agent through structured evaluation
//    - Captures assumption explicitly
//    - Creates trace of reasoning-to-conclusion
//
// 4. Agent Interface
//    - Connects the LLM to the structured templates
//    - Ensures reasoning stays within decision framework
//
// Control Flow:
//
// 1. Content and guidelines are structured through Decision Context Template
// 2. Agent evaluates content against each criterion using Reasoning Framework
// 3. Structured reasoning is collected in Decision Space Template
// 4. Final judgment is derived from structured evaluations
// 5. Complete decision with reasoning trace is returned
//
// Key Decision Points:
//
// - How to structure the decision criteria (Tool Form models the evaluation space)
// - How to ensure complete reasoning (Tool Form enforces structural completeness)
// - How to handle uncertainty (Tool Form represents confidence explicitly)
// - How to derive final decisions (Tool Form aggregates structured assessments)
//
// Expected Outcomes:
//
// - Consistent decisions for similar content
// - Explicit, inspectable reasoning
// - Graceful handling of edge cases through structured uncertainty
// - Clear traceability from guidelines to final decision
//
// Tool Form Enablers:
//
// Tool Form makes this pattern possible by:
//
// 1. Providing a schema for the decision space through structured templates
// 2. Enforcing completeness in the reasoning process
// 3. Enabling explicit representation of confidence and uncertainty
// 4. Creating clean separation between reasoning and decision execution
// 5. Allowing complex decision structures to be composed from simpler parts
//
// The key to this pattern is using Tool Form not just as a way to execute
// actions, but as a way to structure the cognitive process itself.
