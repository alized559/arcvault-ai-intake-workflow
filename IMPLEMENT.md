# Implementation Notes

## Working Rules
- Keep the architecture intentionally simple and easy to review.
- Use one LLM step for classification, enrichment, and summary generation.
- Keep routing and escalation deterministic and outside the LLM.
- Prefer repository artifacts over external services so the submission remains self-contained.
- Document every non-obvious assumption.

## Execution Approach
1. Normalize all inbound requests into one schema.
2. Define a strict output contract for the LLM result.
3. Model the orchestration in n8n with:
   - webhook/manual trigger
   - normalization
   - prompt construction
   - mock-or-production LLM step
   - deterministic routing/escalation
   - final output record assembly
4. Persist review artifacts in `data/` and document how they map to the workflow.

## Validation Checklist
- Sample inputs and output records share the same request ids.
- Category-to-queue mapping is deterministic and consistent in workflow/docs/data.
- Escalation rules are identical in workflow/docs/data.
- Confidence threshold is consistently expressed as `< 0.70`.
- Summaries are concise, readable, and consistent with the structured fields.
- Output records look realistic and conservative.
