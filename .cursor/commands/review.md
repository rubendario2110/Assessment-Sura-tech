# Review

Run a strict assessment review using `review-agent`.

Objective:
1. Validate outputs against all specs (`A/B/C/D`) and acceptance criteria.
2. Prioritize findings over summaries.
3. Classify findings by severity (`High`, `Medium`, `Low`).
4. Produce a clear `Go/No-Go` recommendation.

Review scope:
- `specs/*.spec.md`
- `docs/assessment.md`
- `docs/architecture.mmd`
- `docs/c4-system-context.mmd` (if present)
- `docs/c4-container.mmd` (if present)
- `docs/c4-component-integration-layer.mmd` (if present)
- Implementation artifacts (if present)

Mandatory checks:
- Requirement coverage completeness
- Reliability and resilience risks
- Observability/operations gaps
- Consistency between code, docs, and diagrams

Mandatory evidence:
- Append one new entry to `docs/evidence/review-agent-evidence.md` with:
- UTC timestamp
- Scope reviewed
- Findings by severity
- Blockers
- Go/No-Go decision
- Required follow-up actions

Expected output:
- Findings by severity
- Blockers
- Fix recommendations
- Go/No-Go for submission
- Evidence file updated
