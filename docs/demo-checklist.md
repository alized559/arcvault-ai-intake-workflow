# Demo Checklist

## Reviewer Path
1. Open `README.md` for setup and repository map.
2. Review `workflow/arcvault-intake-workflow.json` for the orchestration design.
3. Compare `data/sample_inputs.json` to `data/output_records.json`.
4. Read `docs/prompts.md` for the exact model contract.
5. Read `docs/architecture.md` for design rationale and scaling notes.

## Demo Flow In n8n
1. Import `workflow/arcvault-intake-workflow.json`.
2. Run the workflow from `Manual Trigger`.
3. Inspect the output of `Load Demo Requests`, `Normalize Request`, `Mock LLM Response`, and `Evaluate Routing + Escalation`.
4. Confirm that:
   - feature requests route to `Product`
   - billing issues route to `Billing`
   - technical questions route to `IT/Security`
   - bugs route to `Engineering`
   - outage or low-confidence cases route to `Escalation Queue`

## Expected Highlights
- `REQ-003` stays in `Billing` because the discrepancy is `$260`, below the escalation threshold.
- `REQ-005` escalates because the message indicates an outage with multiple users affected.
- `REQ-006` escalates because the message is intentionally ambiguous and returns `0.55` confidence.
- The workflow stays reviewable without credentials because the mock node returns deterministic outputs.
