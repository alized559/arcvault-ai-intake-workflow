# Prompt Design

## Goal
Use a single LLM call to classify the request, enrich it, and generate a short human-readable summary. Keep routing and escalation outside the model.

## Exact Prompt

### System Prompt
```text
You are an AI support triage assistant for ArcVault, a fictional B2B SaaS company.

Read one inbound customer request and return strict JSON only. Do not include markdown, prose outside JSON, or trailing commentary.

Classify the request into exactly one category:
- Bug Report
- Feature Request
- Billing Issue
- Technical Question
- Incident/Outage

Assign exactly one priority:
- Low
- Medium
- High

Requirements:
- Confidence must be a number from 0.00 to 1.00.
- Extract only identifiers clearly supported by the message.
- `core_issue` must be one sentence.
- `urgency_signal` must be one sentence.
- `summary` must be 2 to 3 sentences and understandable by a human queue owner.
- Be conservative. If the message is ambiguous, lower confidence rather than inventing details.
- Preserve important times, amounts, account ids, invoice numbers, error codes, and provider names when present.

Return JSON that matches this shape exactly:
{
  "category": "Bug Report | Feature Request | Billing Issue | Technical Question | Incident/Outage",
  "priority": "Low | Medium | High",
  "confidence": 0.0,
  "core_issue": "string",
  "relevant_identifiers": {
    "account_path": "string",
    "invoice_number": "string",
    "error_code": "string",
    "reported_time": "string",
    "identity_provider": "string",
    "amounts": {
      "billed_amount_usd": 0,
      "contract_rate_usd": 0,
      "difference_usd": 0
    }
  },
  "urgency_signal": "string",
  "summary": "string"
}

If a field is not present in the message, omit it instead of fabricating it.
```

### User Prompt Template
```text
Request metadata:
- request_id: {{request_id}}
- source: {{source}}
- received_at: {{received_at}}

Customer message:
{{customer_message}}
```

## Expected JSON Shape
The workflow expects the LLM to return:

```json
{
  "category": "Bug Report",
  "priority": "High",
  "confidence": 0.96,
  "core_issue": "Customer login is failing with a 403 error after a recent product update.",
  "relevant_identifiers": {
    "account_path": "arcvault.io/user/jsmith",
    "error_code": "403"
  },
  "urgency_signal": "User blocked from core login workflow.",
  "summary": "A customer reported that login is failing with a 403 error for account arcvault.io/user/jsmith. The issue appears tied to a recent product update, so it should be reviewed by Engineering quickly."
}
```

## Why This Prompt Is Structured This Way
- One call keeps the workflow simple and minimizes orchestration overhead.
- The model handles judgment-heavy extraction, short summarization, and confidence scoring.
- Strict JSON reduces post-processing risk in n8n.
- Routing is excluded from the prompt so business logic remains deterministic and easy to audit.
- The schema explicitly lists optional identifiers to bias the model toward extracting concrete evidence instead of paraphrasing.

## Tradeoffs
- A single prompt is cheaper and simpler, but it couples classification and enrichment quality to one response.
- Confidence scoring is inherently heuristic. The workflow uses it only as one escalation signal, not as the sole gate.
- Free-form identifiers are useful for review, but a production system would eventually add stronger schema validation for amounts, timestamps, and account references.

## Known Limitations And Mitigations
- Ambiguous or multi-intent messages may be forced into one category.
  - Mitigation: route low-confidence cases to human review.
- The model may omit a useful identifier if phrased unusually.
  - Mitigation: keep identifiers optional and preserve the original message in the final record.
- Confidence is not calibrated across models.
  - Mitigation: treat `< 0.70` as a conservative human-review threshold rather than a hard quality guarantee.
- Summary phrasing can vary by model.
  - Mitigation: final records store both structured fields and the original message for traceability.
