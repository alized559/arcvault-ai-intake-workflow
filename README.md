# ArcVault AI Intake Workflow

Submission-ready take-home for an AI Engineer assessment. This repo implements a compact, end-to-end intake and triage workflow for a fictional B2B SaaS company, ArcVault.

## Deliverables
- [workflow/arcvault-intake-workflow.json](workflow/arcvault-intake-workflow.json)
- [data/sample_inputs.json](data/sample_inputs.json)
- [data/output_records.json](data/output_records.json)
- [docs/prompts.md](docs/prompts.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/demo-checklist.md](docs/demo-checklist.md)
- [docs/output_schema.json](docs/output_schema.json)
- [PLANS.md](PLANS.md)
- [IMPLEMENT.md](IMPLEMENT.md)

## What This Builds
The workflow processes inbound customer requests and produces structured triage records suitable for downstream support or engineering teams, including:

- category
- priority
- confidence
- one-sentence issue summary
- extracted identifiers
- urgency signal
- deterministic queue routing
- deterministic escalation
- a short human-readable summary

The workflow uses a single LLM step for classification and enrichment, while keeping routing and escalation outside the model to maintain deterministic operational behavior.

An ambiguous request example is included to demonstrate the low-confidence escalation path. This shows robustness thinking rather than optimizing only for clean, easy classifications.

## Repository Structure
```text
.
├── workflow/
│   └── arcvault-intake-workflow.json
├── data/
│   ├── sample_inputs.json
│   └── output_records.json
├── docs/
│   ├── architecture.md
│   ├── demo-checklist.md
│   ├── output_schema.json
│   └── prompts.md
├── scripts/
│   └── validate_artifacts.js
├── IMPLEMENT.md
├── PLANS.md
└── README.md
```

## Design Summary
- `n8n` is the orchestrator.
- A single LLM step performs classification, entity extraction, and summary generation.
- All operational decisions (routing and escalation) are implemented deterministically in n8n code outside the model to ensure predictability and auditability.
- The repo defaults to a mock LLM path so it remains reviewable without paid services or credentials.
- Final JSON artifacts are included directly in `data/`.

The final output record structure is formally defined in `docs/output_schema.json`.

This keeps the submission fully reproducible without external dependencies while still demonstrating how the production integration would work.

## Workflow Overview

The intake pipeline follows a simple five-stage flow:

Webhook / Manual Trigger
-> Request Normalization
-> LLM Classification + Enrichment
-> Deterministic Routing + Escalation
-> Structured Output Record

This separation keeps interpretation inside the model while keeping operational decisions deterministic and auditable.

## Routing Rules
- `Bug Report` -> `Engineering`
- `Incident/Outage` -> `Engineering`
- `Feature Request` -> `Product`
- `Billing Issue` -> `Billing`
- `Technical Question` -> `IT/Security`

Escalation overrides the normal queue and routes to `Escalation Queue` when:

- `confidence < 0.70`
- the message indicates outage/down service impact
- multiple users are affected
- billing discrepancy is greater than `$500`

## How To Review
1. Inspect the workflow export in [workflow/arcvault-intake-workflow.json](workflow/arcvault-intake-workflow.json).
2. Compare the six demo inputs in [data/sample_inputs.json](data/sample_inputs.json) with the six final records in [data/output_records.json](data/output_records.json).
3. Read [docs/prompts.md](docs/prompts.md) for the exact prompt and strict JSON contract.
4. Read [docs/architecture.md](docs/architecture.md) for rationale, reliability, and scale considerations.
5. See the screenshots/ directory for execution outputs of each workflow stage.

## Running The Workflow In n8n
1. Import [workflow/arcvault-intake-workflow.json](workflow/arcvault-intake-workflow.json) into n8n.
2. Run the `Manual Trigger` path to execute the six demo requests without external dependencies.
3. For a production-like entry point, use the `Webhook Trigger` node and POST a payload with:

```json
{
  "request_id": "REQ-999",
  "source": "Email",
  "received_at": "2026-03-13T12:00:00Z",
  "customer_message": "Example inbound request text"
}
```

## Switching From Mock To Real LLM
The workflow includes a prompt-building step and a mock LLM node by default. To wire in a real model:

1. Replace the mock node with an OpenAI Responses API or OpenAI Chat node.
2. Reuse the prompt from [docs/prompts.md](docs/prompts.md).
3. Keep the returned JSON shape unchanged.
4. Leave routing and escalation in the existing code node.

### Example OpenAI Integration

A real LLM integration can be implemented using the OpenAI Responses API.

Example request:

POST https://api.openai.com/v1/responses

```json
{
  "model": "gpt-4.1-mini",
  "input": [
    {
      "role": "system",
      "content": "<system prompt from docs/prompts.md>"
    },
    {
      "role": "user",
      "content": "<user prompt with request metadata>"
    }
  ],
  "response_format": { "type": "json_object" }
}
```

## Validation
Run:

```bash
node scripts/validate_artifacts.js
```

This checks the sample inputs, output records, queue mapping, and escalation logic for consistency.

## Assumptions
- The six included messages are the canonical demo dataset, with one intentionally ambiguous edge case.
- Queue ownership is simplified for the assessment.
- Output artifacts are persisted in-repo for review instead of external storage.
- The mock LLM path exists to keep the submission self-contained; the production handoff is documented, not hidden.
