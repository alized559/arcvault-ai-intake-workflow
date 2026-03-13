# ArcVault Intake Workflow Architecture

## Overview
This submission uses n8n as the orchestrator for a compact intake pipeline:

1. Ingest a new customer request from a webhook or demo trigger.
2. Normalize the request into a common schema.
3. Send the request through one LLM step for classification, extraction, and summary generation.
4. Apply deterministic routing and escalation logic in code.
5. Assemble a final structured output record for downstream handling or persistence.

The design is intentionally simple. The assessment is about judgment, predictability, and operational clarity, not about maximizing integrations.

## System Design
The workflow follows a simple staged pipeline:

+---------------------+
| Webhook / Demo Input|
+----------+----------+
           |
           v
+---------------------+
| Request Normalization|
+----------+----------+
           |
           v
+---------------------+
| LLM Classification  |
| + Enrichment        |
+----------+----------+
           |
           v
+---------------------+
| Routing + Escalation|
| Deterministic Logic |
+----------+----------+
           |
           v
+---------------------+
| Structured Output   |
+---------------------+

The workflow is organized into five layers:

- Ingestion
  - `Webhook` supports a production-like POST entry point.
  - `Manual Trigger` plus `Load Demo Requests` supports offline review using six sample requests, including one ambiguous edge case.
- Normalization
  - Converts all sources into one schema: `request_id`, `source`, `received_at`, and `customer_message`.
  - Preserves the raw message to keep the system auditable.
- AI Enrichment
  - One LLM step returns strict JSON with category, priority, confidence, extracted identifiers, a one-sentence issue statement, and a short summary.
  - In this repo, the workflow defaults to a mock LLM node so the submission is reviewable without external keys.
- Deterministic Decisioning
  - Routing and escalation logic live in an n8n code node instead of the model.
  - Separating AI interpretation from deterministic decision logic prevents prompt drift from affecting operational routing.
  - This keeps business rules explicit and easy to test.
- Final Record Assembly
  - Produces a stable output schema for humans or downstream systems.

## Routing Logic
Category maps directly to queue ownership:

- `Bug Report` -> `Engineering`
- `Incident/Outage` -> `Engineering`
- `Feature Request` -> `Product`
- `Billing Issue` -> `Billing`
- `Technical Question` -> `IT/Security`

If escalation criteria are triggered, the queue is overridden to `Escalation Queue`. If the model returns low confidence, the request also bypasses the standard queue and lands in escalation for human review.

## Escalation Logic
Escalation is deterministic and conservative. A request is escalated when any of the following are true:

- `confidence < 0.70`
- The message indicates an outage or the service is down
- Multiple users are affected
- A billing discrepancy exceeds `$500`

These rules prioritize operational risk over model certainty. Potential outages or high-impact billing discrepancies bypass standard automated triage so a human operator can verify the situation quickly.

## Reliability, Cost, And Latency Considerations
- Reliability
  - The workflow preserves the original message and the final structured record, making outcomes reviewable even if extraction quality varies.
  - Deterministic routing prevents queue drift caused by prompt changes.
- Cost
  - A single LLM call per request keeps token usage low.
  - Mock mode allows the submission to be reviewed without any paid service dependency.
- Latency
  - One model call plus lightweight code-node logic keeps end-to-end latency low.
  - For a production support pipeline, this design is fast enough for synchronous triage.

## Production-Scale Considerations
At larger scale, I would keep the same control-plane shape but harden the edges:

- Add schema validation directly after the LLM step.
- Write final records to a durable store such as Postgres or S3 instead of repo files.
- Add retry logic and dead-letter handling for model failures.
- Capture queue-level metrics, escalation rate, confidence distribution, and category drift.
- Separate incident/outage traffic into a faster operational path if needed.

### Observability

A production system would include:

- structured logging for each request and routing decision
- metrics for classification confidence distribution
- alerting when escalation rates exceed normal thresholds
- dashboards tracking queue volume by category

## Phase 2 Improvements
- Support multi-label tagging in addition to the primary category.
- Add entity extraction for tenant ids, environment names, and contract references.
- Introduce calibration data for confidence thresholds.
- Add a human feedback loop that feeds reviewed labels back into prompt tuning or fine-tuning.
- Replace the mock node with a real OpenAI Responses API call and structured response validation.
