# ArcVault Intake Workflow Plan

## Objective
Build a submission-ready, end-to-end AI intake and triage workflow for ArcVault using n8n, with deterministic routing and escalation outside the LLM.

## Milestones
1. Define scope, assumptions, schemas, and acceptance criteria.
2. Build the workflow export and sample data artifacts.
3. Produce final structured output records for all five requests.
4. Write concise submission documentation.
5. Validate consistency across workflow, outputs, and docs.

## Acceptance Criteria
- `workflow/arcvault-intake-workflow.json` exists and shows:
  - an ingestion trigger
  - normalization
  - one LLM classification/enrichment step
  - deterministic routing
  - deterministic escalation
  - structured output assembly
- `data/sample_inputs.json` contains the five required requests in a common schema.
- `data/output_records.json` contains five realistic output records with:
  - category
  - priority
  - confidence
  - one-sentence core issue
  - extracted identifiers
  - urgency signal
  - queue
  - escalation status/reasons
  - human-readable summary
- `docs/prompts.md` includes the exact prompt, JSON shape, rationale, and limitations.
- `docs/architecture.md` explains system design, routing, escalation, reliability, cost/latency, and phase 2 improvements.
- `README.md` provides setup, execution, demo flow, and deliverables summary.
- Validation confirms workflow logic, sample outputs, and documentation stay aligned.

## Assumptions
- The assessment is optimized for evaluator review, not production deployment.
- A paid LLM key may not be available, so the workflow defaults to a mock LLM node while documenting the production OpenAI call.
- The five required requests are the canonical demo dataset for this submission.
- Queue ownership is simplified to:
  - Engineering
  - Product
  - Billing
  - IT/Security
  - Escalation Queue
