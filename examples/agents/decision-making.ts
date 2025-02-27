// Structural Decision Making
//
// Many LLM agent failures stem from a fundamental problem: unstructured
// decision-making. When agents reason in free-form text, they often produce
// inconsistent judgments, make implicit assumptions, and fail to trace their
// reasoning to conclusions.
//
// This example demonstrates structuring the decision space using Tool Form.
// In this example, you'll learn how to:
//
// 1. Transform fuzzy reasoning into explicit, structured decision spaces
// 2. Break complex decisions into discrete, assessable components
// 3. Create clear traceability between reasoning and conclusions
//
// We'll demonstrate using a content moderation scenario, where reliability
// and consistency are paramount. The architecture follows a clear pattern:
//
// - Decision Context: Structure the scenario and evaluation criteria
// - Guideline Evaluation: Perform structured assessment against each criterion
// - Decision Synthesis: Derive final decisions from the structured evaluations
//
// This pattern is foundational for reliable agency and forms the basis for
// more sophisticated agent architectures in subsequent examples.

import { parseTemplate } from "tool-form";
import { markdownEncoding } from "@tool-form/markdown";
import { Anthropic } from "@anthropic-ai/sdk";

/**
 * Community guideline that content must adhere to.
 *
 * Each guideline forms a discrete evaluation criterion, enabling structured
 * assessment of content against specific rules rather than holistic judgment.
 */
interface Guideline {
  // Unique identifier for cross-referencing in evaluations
  id: string;
  // Concise statement of the rule in user-friendly language
  description: string;
  // Detailed clarification that helps disambiguate edge cases
  explanation: string;
}

/**
 * Expected evaluation result for validation purposes.
 *
 * Used to measure the accuracy and consistency of the agent's structured
 * decision-making process against known ground truth.
 */
interface ExpectedEvaluation {
  // Links this validation data to a specific guideline
  guidelineId: string;
  // Expected compliance judgment (`true` means follows guideline)
  compliant: boolean;
  // Expected certainty level, reflecting difficulty of the judgment
  confidence: ConfidenceLevel;
}

/**
 * Content to be evaluated against community guidelines.
 *
 * Encapsulates the material being assessed along with optional metadata
 * and validation data for testing decision consistency.
 */
interface Content {
  // Unique identifier for tracking this content through the evaluation process
  id: string;
  // The actual content being evaluated for compliance
  text: string;
  // Optional descriptive title for organization and reference
  title?: string;
  // Optional attribution information
  source?: string;
  // Optional ground truth for automated validation of evaluation quality
  validation?: ExpectedEvaluation[];
}

/**
 * The confidence level in an evaluation.
 *
 * A three-point scale that explicitly models uncertainty in judgments,
 * preventing false certainty in ambiguous cases.
 */
type ConfidenceLevel = "high" | "medium" | "low";

/**
 * A single reasoning factor with associated evidence.
 *
 * Links abstract reasoning to concrete evidence, making the decision
 * process traceable and the conclusions justifiable.
 */
interface EvaluationFactor {
  // The logical inference or judgment being made
  rationale: string;
  // The specific portion of content that supports this rationale
  evidence: string;
}

/**
 * The result of evaluating content against a specific guideline.
 *
 * Rather than a simple binary judgment, this structure captures the
 * nuanced reasoning process, including competing factors and uncertainty.
 */
interface Evaluation {
  // Links this evaluation to a specific guideline
  guidelineId: string;
  // Compliance judgment (`true` means follows guideline)
  compliant: boolean;
  // Certainty level, capturing the evaluator's confidence
  confidence: ConfidenceLevel;
  // Factors suggesting a violation (non-compliance)
  inculpatory: EvaluationFactor[];
  // Factors suggesting compliance
  exculpatory: EvaluationFactor[];
}

/**
 * The final moderation decision.
 *
 * Aggregates individual evaluations into a coherent judgment while
 * preserving the full reasoning trace for transparency and auditing.
 */
interface ModerationDecision {
  // Links this decision to the evaluated content
  contentId: string;
  // Overall compliance judgment (`true` means follows all guidelines)
  isCompliant: boolean;
  // Overall certainty, reflecting the most uncertain relevant evaluation
  confidence: ConfidenceLevel;
  // Complete record of the reasoning process for each guideline
  evaluations: Evaluation[];
  // Human-readable explanation of the decision rationale
  summary: string;
}

/**
 * The AI model to use for the agent.
 */
const MODEL: Anthropic.Model = "claude-3-5-haiku-latest";

/**
 * System prompt that establishes the agent's role.
 */
const SYSTEM_PROMPT =
  "You are a content moderation assistant that evaluates content against community guidelines. " +
  "Your job is to carefully analyze content and determine if it violates any guidelines. " +
  "You will evaluate each guideline separately, providing detailed reasoning and evidence. " +
  "You must be fair, consistent, and thorough in your evaluations.";

/**
 * Tool definition for evaluating a single guideline.
 *
 * This tool captures the integrative reasoning process that combines
 * individual guideline evaluations into a coherent overall judgment.
 * The schema enforces a principled approach to confidence assessment
 * that seeks to minimize overconfidence in the aggregate decision.
 */
const evaluateGuidelineTool = {
  name: "evaluate_guideline",
  description:
    "Evaluate whether content complies with a specific community guideline, providing structured reasoning with evidence for both compliance and violation factors.",
  input_schema: {
    type: "object",
    properties: {
      guidelineId: {
        description:
          "Identifier of the specific guideline being evaluated (e.g., G1, G2)",
        type: "string",
      },
      // Binary compliance judgment forces the model to make a clear decision rather than hedging
      compliant: {
        description:
          "Overall compliance determination based on the preponderance of evidence (true if content complies with guideline, false if it violates)",
        type: "boolean",
      },
      // Three-level confidence scale guards against false certainty while maintaining decision clarity
      confidence: {
        description:
          "Assessment of certainty in the compliance determination, based on the balance and strength of evidence",
        type: "string",
        enum: ["high", "medium", "low"],
      },
      // Requiring both inculpatory and exculpatory factors encourages consideration of opposing views
      inculpatory: {
        description:
          "Factors suggesting guideline violation, each with supporting evidence from the content",
        type: "array",
        items: {
          type: "object",
          properties: {
            rationale: {
              description:
                "Specific reasoning for why the content may violate this guideline aspect",
              type: "string",
            },
            // Evidence requirement discourages unsupported assertions
            evidence: {
              description:
                "Direct quote or specific element from the content that supports this violation rationale",
              type: "string",
            },
          },
          required: ["rationale", "evidence"],
        },
      },
      exculpatory: {
        description:
          "Factors suggesting guideline compliance, each with supporting evidence from the content",
        type: "array",
        items: {
          type: "object",
          properties: {
            rationale: {
              description:
                "Specific reasoning for why the content may comply with this guideline aspect",
              type: "string",
            },
            evidence: {
              description:
                "Direct quote or specific element from the content that supports this compliance rationale",
              type: "string",
            },
          },
          required: ["rationale", "evidence"],
        },
      },
    },
    required: [
      "guidelineId",
      "compliant",
      "confidence",
      "inculpatory",
      "exculpatory",
    ],
  },
} as const satisfies Anthropic.Tool;

/**
 * Template for evaluating content against a specific compliance guideline.
 *
 * Deliberately structures the evaluation process into distinct cognitive steps
 * that mirror legal reasoning: identifying factors on both sides, weighing evidence,
 * determining a judgment, and assessing confidence. This cognitive scaffolding
 * creates consistency across evaluations.
 */
const evaluateGuidelineTemplate = await parseTemplate(
  {
    $encode: "markdown",
    $block: [
      "# Guideline Compliance Evaluation",

      // Guideline prominently displayed to focus evaluation on this single criterion
      "**Evaluating**: {{guideline.description}}",

      "## Evaluation Framework",
      "Your task is to determine whether the content complies with or violates this specific guideline. Follow this structured evaluation process:",
      {
        $ol: [
          "**Identify relevant factors** on both sides of the question (compliance and violation)",
          "**Extract specific evidence** from the content for each factor identified",
          "**Weigh these factors** using the preponderance of evidence standard",
          "**Assess your confidence** based on the clarity and balance of evidence",
        ],
      },

      "## Evaluation Standards",

      "### Preponderance of Evidence",
      "A violation exists when factors suggesting non-compliance outweigh factors suggesting compliance. The content must be judged against this guideline alone, not other potential issues.",

      "### Confidence Assessment",
      {
        $blockquote:
          "**Important**: High confidence should be rare and exceptional, not the default. Most real-world evaluations involve some degree of uncertainty and should be medium or low confidence.",
      },
      {
        $ul: [
          {
            $inline: [
              "**High confidence**: Reserve for cases meeting ALL these criteria:",
              {
                $ol: [
                  "Overwhelmingly clear-cut evidence",
                  "No reasonable alternative interpretation exists",
                  "Almost any reasonable evaluator would reach the identical conclusion",
                ],
              },
              "Most evaluations will NOT meet this standard.",
            ],
          },
          {
            $inline: [
              "**Medium confidence**: Use for cases where:",
              {
                $ol: [
                  "Evidence clearly leans one way",
                  "Some plausible counterarguments exist but are weaker",
                  "Most but not all reasonable evaluators would likely agree",
                ],
              },
              "This is the appropriate level for most straightforward cases.",
            ],
          },
          {
            $inline: [
              "**Low confidence**: Use when:",
              {
                $ol: [
                  "Evidence is mixed or ambiguous",
                  "Multiple reasonable interpretations exist",
                  "The guideline's application to this content is unclear",
                ],
              },
              "Default to low confidence when uncertain.",
            ],
          },
        ],
      },
      {
        $blockquote:
          "Remember that claiming high confidence creates an extremely strong assertion about certainty. Medium confidence is the appropriate level for most clear-cut cases, with high confidence reserved only for the most obvious and indisputable situations.",
      },

      "## Guideline Details",
      {
        $ul: [
          "**ID**: {{guideline.id}}",
          "**Guideline**: {{guideline.description}}",
          "**Explanation**: {{guideline.explanation}}",
        ],
      },

      "## Content For Evaluation",
      { $blockquote: "{{content.text}}" },

      "## Required Analysis Structure",
      "Your evaluation must honestly consider both potential compliance and violation. Document the following:",
      {
        $ul: [
          "**Inculpatory Factors**: Elements suggesting the content **violates** this guideline, with specific content evidence. If no violation factors exist, provide an empty array rather than inventing artificial factors.",
          "**Exculpatory Factors**: Elements suggesting the content **complies** with this guideline, with specific content evidence. If no compliance factors exist, provide an empty array rather than inventing artificial factors.",
          "**Compliance Determination**: Whether the content complies with the guideline, based on the preponderance of genuine evidence",
          "**Confidence Assessment**: Your level of certainty (high/medium/low) in this determination",
        ],
      },
      {
        $blockquote:
          "The goal is accurate evaluation, not forced balance. For clear-cut cases, it's appropriate to have factors on only one side (with an empty array for the other). High confidence judgments are warranted when the evidence clearly points in one direction.",
      },
    ],
  },
  { encodings: [markdownEncoding] },
);

/**
 * Evaluates content against a specific guideline
 *
 * This function creates a key transformation: turning unstructured content and
 * a simple guideline into a structured decision with explicit reasoning traces.
 * The Tool Form template creates semantic richness that guides the LLM, while
 * the structured tool output enforces decision completeness.
 */
async function evaluateGuideline(
  content: Content,
  guideline: Guideline,
  client: Anthropic,
): Promise<Evaluation> {
  console.log(`Evaluating guideline ${guideline.id}: ${guideline.description}`);

  // Transform semantic objects into a cognitively structured prompt
  // This is where Tool Form creates the decision structure that guides the LLM
  const prompt = (await evaluateGuidelineTemplate.transform({
    content,
    guideline,
  })) as string;

  // Print the transformed prompt for the first evaluation
  // to demonstrate the transformation
  if (content.id === "C1" && guideline.id === "G1") {
    console.log("\n" + "-".repeat(40));
    console.log("TOOL FORM TRANSFORMATION EXAMPLE");
    console.log("-".repeat(40));
    console.log(prompt);
    console.log("-".repeat(40) + "\n");
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
    tools: [evaluateGuidelineTool],
    tool_choice: { type: "tool", name: "evaluate_guideline" },
  });
  const result = response.content.find((item) => item.type === "tool_use")!;

  return result.input as Evaluation;
}

/**
 * Tool definition for synthesizing the final decision
 *
 * This tool captures the integrative reasoning process that combines individual
 * guideline evaluations into a coherent overall judgment. The schema enforces a
 * principled approach to confidence assessment that prevents overconfidence in
 * the aggregate decision.
 */
const synthesizeDecisionTool = {
  name: "synthesize_decision",
  description:
    "Synthesize a final moderation decision by integrating multiple guideline evaluations, applying the principle that content violating any single guideline is non-compliant overall.",
  input_schema: {
    type: "object",
    properties: {
      isCompliant: {
        description:
          "Overall compliance determination (false if any individual guideline is violated, true only if all guidelines are satisfied)",
        type: "boolean",
      },
      confidence: {
        description:
          "Assessment of certainty in the overall decision, generally limited by the lowest confidence in any violated guideline or, if compliant, the lowest confidence across all evaluations",
        type: "string",
        enum: ["high", "medium", "low"],
      },
      summary: {
        description:
          "Concise explanation of the decision rationale that identifies which specific guidelines were violated (if any) and explains how they led to the overall determination",
        type: "string",
      },
    },
    required: ["isCompliant", "confidence", "summary"],
  },
} as const satisfies Anthropic.Tool;

/**
 * Template for synthesizing the final decision
 *
 * Unlike the individual evaluation template which focuses on balancing
 * opposing factors, this template implements the "weakest link" principle -
 * overall compliance is only as strong as the weakest individual guideline
 * evaluation. This creates a conservative moderation approach that's
 * appropriate for content safety.
 */
const synthesizeDecisionTemplate = await parseTemplate(
  {
    $encode: "markdown",
    $block: [
      "# Decision Synthesis Framework",

      "## Content",
      { $blockquote: "{{content.text}}" },

      "## Synthesis Objective",
      // Synthesis focus prevents re-evaluation and keeps focus on integration
      "Your task is to integrate multiple guideline evaluations into a single, coherent moderation decision. This is not about re-evaluating the content, but about correctly synthesizing the individual assessments you've already made.",

      "## Decision Rules",
      {
        $ul: [
          "**Violation Standard**: Content is non-compliant if it violates **ANY** guideline. A single violation is sufficient for an overall violation determination.",
          "**Compliance Standard**: Content is only compliant if it satisfies **ALL** guidelines. All evaluations must show compliance for an overall compliance determination.",
        ],
      },

      "## Confidence Assessment Framework",
      {
        $ul: [
          // Confidence cannot exceed the weakest relevant evaluation
          "**Critical Rule**: The overall confidence can never be higher than the confidence of the most critical evaluation. When synthesizing a decision, you must apply confidence limiting.",
          {
            $inline: [
              "**For Non-Compliant Content** (any guideline violated):",
              {
                $ol: [
                  "Identify the violated guideline(s)",
                  // Confidence in violations determines overall confidence
                  "The overall confidence should not exceed the confidence of the most certain violation",
                  "Reduce confidence further if there are mixed or ambiguous factors within the violated guidelines",
                ],
              },
            ],
          },
          {
            $inline: [
              "**For Compliant Content** (all guidelines satisfied):",
              {
                $ol: [
                  // Weakest link principle applies to compliant content too
                  "The overall confidence cannot exceed the lowest confidence of any individual guideline assessment",
                  "Medium confidence is appropriate when some guidelines had competing factors, even if ultimately compliant",
                  "Low confidence is appropriate when multiple evaluations showed significant ambiguity",
                ],
              },
            ],
          },
        ],
      },

      "## Guideline Evaluations To Synthesize",
      {
        // Dynamic generation of evaluation summaries with full context
        $each: "$.evaluations.*",
        $as: "eval",
        $block: [
          "### {{guidelines[?@.id == $.eval.guidelineId].description | first}} ({{eval.guidelineId}})",
          {
            $ul: {
              $inline: [
                "**Determination**: ",
                {
                  $if: "$.eval.compliant",
                  $then: { $strong: "Compliant" },
                  $else: { $strong: "Violation" },
                },
                " (**{{eval.confidence}} confidence**)",
              ],
            },
          },

          "**Inculpatory Factors:** ({{eval.inculpatory.length}} violation factors)",
          {
            // Conditional display prevents empty list headings
            $if: "$.eval.inculpatory.length > 0",
            $then: {
              $ul: {
                $each: "$.eval.inculpatory.*",
                $as: "factor",
                $value:
                  "{{factor.rationale}}\n**Evidence**: {{factor.evidence}}",
              },
            },
            $else: "_None identified_",
          },

          "**Exculpatory Factors:** ({{eval.exculpatory.length}} compliance factors)",
          {
            $if: "$.eval.exculpatory.length > 0",
            $then: {
              $ul: {
                $each: "$.eval.exculpatory.*",
                $as: "factor",
                $inline:
                  "{{factor.rationale}}\n**Evidence**: {{factor.evidence}}",
              },
            },
            $else: "_None identified_",
          },
        ],
      },

      "## Required Output Structure",
      "Your final decision synthesis must include:",
      {
        $ul: [
          "**Compliance Determination**: Whether the content complies with ALL guidelines, or violates ANY guideline",
          "**Confidence Assessment**: The certainty level in your determination, following the confidence limiting rules described above",
          "**Summary Rationale**: A concise explanation identifying which guidelines were violated (if any) and the key factors that led to your determination",
        ],
      },

      {
        // Final reminder prevents re-evaluation and keeps focus on synthesis
        $blockquote:
          "Remember that your role is to synthesize the evaluations you've already completed, not to re-evaluate the content or introduce new reasoning factors. Focus on correctly integrating the individual assessments according to the decision rules.",
      },
    ],
  },
  { encodings: [markdownEncoding] },
);

/**
 * Synthesizes individual evaluations into a final decision
 *
 * This function implements the critical "weakest link" principle of content
 * moderation: content is only as compliant as its worst violation.
 * The transformation process structures this logical dependency explicitly,
 * teaching the LLM to appropriately propagate confidence limitations from
 * individual evaluations to the overall judgment.
 */
async function synthesizeDecision(
  content: Content,
  evaluations: Evaluation[],
  client: Anthropic,
): Promise<ModerationDecision> {
  console.log(
    `Synthesizing final decision from ${evaluations.length} guideline evaluations`,
  );

  // Calculate preliminary statistics for demonstration purposes
  const violationCount = evaluations.filter(
    (evaluation) => !evaluation.compliant,
  ).length;
  const lowestConfidence = evaluations.reduce((lowest, evaluation) => {
    // For non-compliant content, we care most about confidence in violations
    if (
      !evaluation.compliant &&
      confidenceOrder(evaluation.confidence) < confidenceOrder(lowest)
    ) {
      return evaluation.confidence;
    }
    // For compliant content, we're limited by our least confident assessment
    if (confidenceOrder(evaluation.confidence) < confidenceOrder(lowest)) {
      return evaluation.confidence;
    }
    return lowest;
  }, "high" as ConfidenceLevel);
  console.log(`Found ${violationCount} guideline violations`);
  console.log(`Lowest relevant confidence: ${lowestConfidence}`);

  // Transform semantic evaluation objects into a structured synthesis prompt
  // Note how Tool Form handles the complex template logic for displaying factors
  const prompt = (await synthesizeDecisionTemplate.transform({
    content,
    evaluations,
    guidelines: communityGuidelines,
  })) as string;

  // Print the transformed prompt to demonstrate the synthesis process
  if (content.id === "C1") {
    console.log("\n" + "-".repeat(40));
    console.log("TOOL FORM TRANSFORMATION: SYNTHESIS");
    console.log("-".repeat(40));
    console.log(prompt);
    console.log("-".repeat(40) + "\n");
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
    tools: [synthesizeDecisionTool],
    tool_choice: {
      type: "tool",
      name: "synthesize_decision",
    },
  });
  const result = response.content.find((item) => item.type === "tool_use")!;
  const decision = result.input as ModerationDecision;

  // Construct the final decision by combining the synthesis result with evaluations
  return {
    contentId: content.id,
    isCompliant: decision.isCompliant,
    confidence: decision.confidence,
    summary: decision.summary,
    evaluations,
  };
}

/**
 * Helper function to order confidence levels for comparison
 * High = 3, Medium = 2, Low = 1
 */
function confidenceOrder(confidence: ConfidenceLevel): number {
  switch (confidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

/**
 * Evaluates content against community guidelines using a structured
 * decision process.
 *
 * This orchestration function demonstrates the key compositional pattern:
 * 1. Break complex decisions into independent, parallel evaluations
 * 2. Synthesize these structured results into a coherent whole
 *
 * This decomposition-synthesis pattern is what enables reliability even on
 * difficult borderline cases, as each evaluation maintains its independent
 * reasoning trace all the way through to the final decision.
 */
async function evaluateContent(
  content: Content,
  guidelines: readonly Guideline[],
  client: Anthropic,
): Promise<ModerationDecision> {
  console.log(`Evaluating content ID ${content.id}`);
  console.log(`Content: ${JSON.stringify(content.text)}`);
  console.log(`Evaluating against ${guidelines.length} guidelines`);

  // Evaluate content against each guideline in parallel.
  // This pattern ensures each evaluation gets full independent consideration
  // without being biased by judgments on other guidelines.
  const evaluationPromises = guidelines.map((guideline) =>
    evaluateGuideline(content, guideline, client),
  );

  // Wait for all evaluations to complete
  const evaluations = await Promise.all(evaluationPromises);

  // Synthesize evaluations into a coherent decision.
  // This maintains the full reasoning trace from individual factors
  // all the way through to the final judgment.
  return await synthesizeDecision(content, evaluations, client);
}

/**
 * Formats and displays the moderation decision
 */
function displayDecision(decision: ModerationDecision, content: Content): void {
  // Show basic decision information
  console.log("\n" + "-".repeat(40));
  console.log(`DECISION: ${decision.isCompliant ? "COMPLIANT" : "VIOLATION"}`);
  console.log(`Confidence: ${decision.confidence}`);
  console.log(`Summary: ${decision.summary}`);
  console.log("-".repeat(40));

  // Display guideline evaluations
  console.log("Guideline Evaluations:");
  for (const evaluation of decision.evaluations) {
    const guideline = communityGuidelines.find(
      (guideline) => guideline.id === evaluation.guidelineId,
    );
    const status = evaluation.compliant ? "COMPLIANT" : "VIOLATION";

    console.log(
      `- ${evaluation.guidelineId}: ${status} (${evaluation.confidence})`,
    );
    console.log(`  ${guideline?.description}`);

    // Show one key piece of evidence for violations
    if (!evaluation.compliant && evaluation.inculpatory.length > 0) {
      console.log(`  Evidence: "${evaluation.inculpatory[0]!.evidence}"`);
    }
  }

  // Count violations and compliant guidelines
  const violations = decision.evaluations.filter((e) => !e.compliant).length;
  const compliant = decision.evaluations.filter((e) => e.compliant).length;
  console.log(
    `\nGuidelines violated: ${violations}/${decision.evaluations.length}`,
  );
  console.log(
    `Guidelines complied with: ${compliant}/${decision.evaluations.length}`,
  );

  // If validation data exists, calculate and display accuracy statistics
  if (content.validation && content.validation.length > 0) {
    console.log("\nValidation Results:");

    let correctCompliance = 0;
    let totalValidations = 0;
    let matchingConfidence = 0;

    // Compare each evaluation with its expected result
    for (const expected of content.validation) {
      const actual = decision.evaluations.find(
        (e) => e.guidelineId === expected.guidelineId,
      );

      if (actual) {
        totalValidations += 1;
        const compliantMatch = actual.compliant === expected.compliant;
        const confidenceMatch = actual.confidence === expected.confidence;

        // Count matches
        if (compliantMatch) correctCompliance += 1;
        if (confidenceMatch) matchingConfidence += 1;
      }
    }

    // Calculate accuracy percentages
    const accuracy =
      totalValidations > 0 ? (correctCompliance / totalValidations) * 100 : 0;
    const confidenceMatchRate =
      totalValidations > 0 ? (matchingConfidence / totalValidations) * 100 : 0;

    console.log(
      `Compliance Accuracy: ${accuracy.toFixed(1)}% (${correctCompliance}/${totalValidations} correct)`,
    );
    console.log(
      `Confidence Match Rate: ${confidenceMatchRate.toFixed(1)}% (${matchingConfidence}/${totalValidations})`,
    );
  }
}

/**
 * Main function to demonstrate structural decision-making
 *
 * This example showcases how Tool Form facilitates reliable decision-making
 * through structured reasoning spaces with clear traceability.
 */
async function main() {
  console.log("Structural Decision-Making Demonstration");
  console.log("=======================================");
  console.log(
    "\nThis example demonstrates how Tool Form facilitates reliable decision-making",
  );
  console.log("by structuring the decision space itself, not just execution.");

  // Initialize the Anthropic client
  const client = new Anthropic();

  // Demonstrate with different content examples
  for (const content of contentExamples) {
    console.log("\n" + "-".repeat(40));
    console.log(`Evaluating: ${content.title} (${content.id})`);
    console.log("-".repeat(40));

    // Evaluate the content using our structured decision process
    const startTime = Date.now();
    const decision = await evaluateContent(
      content,
      communityGuidelines,
      client,
    );
    const duration = Date.now() - startTime;

    // Display the decision
    displayDecision(decision, content);

    console.log(
      `Evaluation completed in ${(duration / 1000).toFixed(2)} seconds`,
    );

    // Demonstrate structural benefits for borderline case
    if (content.id === "C3") {
      console.log("\nDemonstrating consistency with borderline case...");

      // Evaluate the same content again
      const secondDecision = await evaluateContent(
        content,
        communityGuidelines,
        client,
      );

      // Compare decisions for consistency
      const consistent =
        decision.isCompliant === secondDecision.isCompliant &&
        decision.confidence === secondDecision.confidence;

      console.log(`Consistency check: ${consistent ? "PASSED" : "FAILED"}`);
      console.log(
        `First: ${decision.isCompliant ? "COMPLIANT" : "VIOLATION"} (${decision.confidence})`,
      );
      console.log(
        `Second: ${secondDecision.isCompliant ? "COMPLIANT" : "VIOLATION"} (${secondDecision.confidence})`,
      );
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Key Takeaways:");
  console.log(
    "1. Structured decisions create consistent, traceable evaluations",
  );
  console.log(
    "2. Breaking decisions into components enables principled reasoning",
  );
  console.log(
    "3. Tool Form facilitates this through transformation and structure",
  );
  console.log("=".repeat(60));
}

// Sample community guidelines for content moderation
const communityGuidelines: readonly Guideline[] = [
  {
    id: "G1",
    description: "No harassment or personal attacks",
    explanation:
      "Content that directly targets specific, identifiable individuals with abusive language, " +
      "explicit threats, or derogatory personal insults violates this guideline. " +
      "This includes content that uses slurs, encourages harassment, " +
      "or contains explicit threats of harm against an individual.\n\n" +
      "What is NOT a violation: General criticism of public figures or organizations " +
      "that focuses on their actions, policies, or decisions; " +
      "Political commentary, even when strongly worded, is permitted as long as " +
      "it doesn't include personal slurs or explicit threats against specific individuals.",
  },
  {
    id: "G2",
    description: "No explicit adult content",
    explanation:
      "Content that contains graphic sexual descriptions, pornography, " +
      "or explicit adult material violates this guideline. " +
      "This includes detailed descriptions of sexual acts, " +
      "explicit sexual language intended to arouse, " +
      "or links/references to pornographic material.\n\n" +
      "What is NOT a violation: Educational content about human sexuality, " +
      "reproductive health, or medically accurate terminology; " +
      "mature themes or romantic content without explicit sexual descriptions; " +
      "references to sex that are not graphic or detailed in nature.",
  },
  {
    id: "G3",
    description: "No unauthorized sharing of personal information",
    explanation:
      "Content that discloses non-public personal information of others " +
      "without their consent violates this guideline. " +
      "This includes private addresses, phone numbers, email addresses, " +
      "financial information, or other identifying details that could enable " +
      "harassment, stalking, or identity theft.\n\n" +
      "What is NOT a violation: Sharing publicly available information " +
      "(such as the public office address of an elected official), " +
      "information about oneself, or information shared with explicit consent. " +
      "References to public figures that don't reveal private contact details " +
      "or sensitive personal information.",
  },
  {
    id: "G4",
    description: "No promotion of dangerous activities",
    explanation:
      "Content that explicitly encourages or provides specific instructions " +
      "for activities likely to cause physical harm, property damage, " +
      "or illegal activities violates this guideline. " +
      "This includes detailed instructions for making weapons, " +
      "synthesizing illegal substances, or specific calls to engage in harmful activities.\n\n" +
      "What is NOT a violation: Discussion of dangerous activities in educational, " +
      "journalistic, or historical contexts; criticism of dangerous behaviors; " +
      "content that mentions but doesn't promote dangerous activities; " +
      "general calls for policy changes or political action through legal means.",
  },
];

// Sample content to evaluate (with varying degrees of compliance)
const contentExamples: Content[] = [
  {
    id: "C1",
    title: "Clear Violation",
    text:
      "John Smith is an absolute idiot who lives at 123 Main St. " +
      "Everyone should call him at 555-1234 and tell him how stupid his opinions are.",
    validation: [
      { guidelineId: "G1", compliant: false, confidence: "high" },
      { guidelineId: "G2", compliant: true, confidence: "high" },
      { guidelineId: "G3", compliant: false, confidence: "high" },
      { guidelineId: "G4", compliant: false, confidence: "medium" },
    ],
  },
  {
    id: "C2",
    title: "Clearly Compliant",
    text:
      "I respectfully disagree with the previous speaker's position on climate policy. " +
      "Their approach seems short-sighted, but I welcome further discussion on this important topic.",
    validation: [
      { guidelineId: "G1", compliant: true, confidence: "high" },
      { guidelineId: "G2", compliant: true, confidence: "high" },
      { guidelineId: "G3", compliant: true, confidence: "high" },
      { guidelineId: "G4", compliant: true, confidence: "high" },
    ],
  },
  {
    id: "C3",
    title: "Borderline Case",
    text:
      "This administration's policies are dangerous and reckless. " +
      "The people responsible should be held accountable for their " +
      "terrible decisions that put everyone at risk.",
    validation: [
      { guidelineId: "G1", compliant: true, confidence: "medium" },
      { guidelineId: "G2", compliant: true, confidence: "high" },
      { guidelineId: "G3", compliant: true, confidence: "high" },
      { guidelineId: "G4", compliant: true, confidence: "medium" },
    ],
  },
];

// Execute the example when this file is run directly
try {
  await main();
} catch (error) {
  console.error("Error in example:", error);
  process.exit(1);
}
