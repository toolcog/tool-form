// Decomposition and Synthesis
//
// A demonstration of how to handle complex tasks by strategically decomposing
// problems while maintaining coherent context through Tool Form.
//
// -----------------------------------------------------------------------------
// IDEA
// -----------------------------------------------------------------------------
//
// Core Concept:
//
// LLM agents struggle with complex tasks that exceed their reasoning capacity
// in a single prompt. "Decomposition and Synthesis" creates scalable agency by:
//
// 1. Breaking complex problems into well-defined subproblems
// 2. Creating explicit interfaces between decomposed components
// 3. Preserving critical context across decomposition boundaries
// 4. Reassembling results into coherent solutions
//
// The key insight is that effective decomposition requires not just breaking
// problems down, but designing the right boundaries between components and
// creating clean interfaces for context and results to flow across those
// boundaries. This provides:
//
// - Scalability beyond single-prompt reasoning capacity
// - Reusability of components across different problems
// - Maintainability through isolated, testable components
// - Coherence through principled composition
//
// Teaching Insights:
//
// This concept is challenging because naive decomposition often fails due to:
//
// 1. Lost context at decomposition boundaries
// 2. Incompatible outputs between components
// 3. Confusion about component responsibilities
// 4. Inability to synthesize partial results effectively
//
// The key teaching points are:
//
// - The difference between arbitrary and strategic decomposition
// - How to design effective interfaces between components
// - Techniques for preserving context across boundaries
// - Principled approaches to synthesizing partial results
//
// Narrative Connection:
//
// This builds on previous patterns by addressing scale. Once we have structured
// decisions (pattern 1) with appropriate uncertainty handling (pattern 2), we
// can tackle problems too complex for single-prompt reasoning by decomposing
// them while preserving these properties across components.
//
// Real-World Applications:
//
// - Research assistants that integrate multiple knowledge areas
// - Complex planning that requires specialized domain knowledge
// - Multi-step reasoning for scientific problem-solving
// - Content creation requiring diverse capabilities (research, writing, editing)
// - Complex analysis across multiple documents or data sources
//
// -----------------------------------------------------------------------------
// PLAN
// -----------------------------------------------------------------------------
//
// Problem Setup:
//
// We'll demonstrate using a complex product recommendation scenario - an agent
// must analyze user requirements, research available options, evaluate
// alternatives, and synthesize a personalized recommendation with rationale.
//
// This requires multiple specialized capabilities that can't fit in a single
// prompt. We'll show how Tool Form enables effective decomposition while
// maintaining coherent context and results.
//
// Component Architecture:
//
// 1. Decomposition Strategy Template
//    - Analyzes the overall problem and determines optimal subtasks
//    - Identifies dependencies between components
//    - Creates a directed graph of execution flow
//
// 2. Component Interface Templates
//    - Define precise inputs and outputs for each subtask
//    - Specify context preservation requirements
//    - Establish uncertainty handling across boundaries
//
// 3. Context Preservation Template
//    - Maintains critical context across component boundaries
//    - Prevents context collapse in complex workflows
//    - Ensures consistent assumptions throughout execution
//
// 4. Synthesis Framework Template
//    - Integrates results from different components
//    - Resolves conflicts between component outputs
//    - Creates coherent final output from partial results
//
// Control Flow:
//
// 1. Initial problem analysis using Decomposition Strategy Template
// 2. For each identified component:
//    a. Prepare context using Context Preservation Template
//    b. Execute component with appropriate interfaces
//    c. Validate outputs against interface specifications
// 3. As components complete, store results in structured format
// 4. Synthesize final solution using Synthesis Framework Template
// 5. Validate coherence of the complete solution
//
// Key Decision Points:
//
// - How to determine optimal decomposition boundaries
// - What context must be preserved across components
// - How to handle uncertainty that spans multiple components
// - When to execute components sequentially vs. in parallel
// - How to resolve conflicts during synthesis
//
// Expected Outcomes:
//
// - Successful completion of tasks too complex for single-prompt reasoning
// - Clean separation of concerns between components
// - Consistent handling of context across component boundaries
// - Coherent final results that integrate all component outputs
//
// Tool Form Enablers:
//
// Tool Form makes this pattern possible by:
//
// 1. Creating structured interfaces between components
// 2. Ensuring context is preserved in the right format across boundaries
// 3. Maintaining uncertainty representation consistently across components
// 4. Enabling principled composition of partial results
// 5. Providing schema validation at component boundaries
//
// The key to this pattern is using Tool Form to create well-defined interfaces
// between components, ensuring that decomposition enhances capability without
// sacrificing coherence.
