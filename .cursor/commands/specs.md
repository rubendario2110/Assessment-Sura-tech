# Specs

Generate and maintain the assessment spec files inside `specs/`.

Source of truth priority:
1. Assessment text provided in the current chat.
2. `docs/assessment-input.md` if it exists.
3. Existing content in `specs/` as fallback.

Mandatory behavior:
1. Ensure directory `specs/` exists.
2. Create or update these files on every run:
- `specs/A-architecture.spec.md`
- `specs/B-integration-framework.spec.md`
- `specs/C-demo-service.spec.md`
- `specs/D-tdr.spec.md`
3. Do not only respond in chat. Persist the output to files.
4. Keep all text in English.

Per-file content requirements:
- Goal
- Scope
- Non-functional requirements (when applicable)
- Acceptance criteria
- Output files / evidence expected
- Open questions and assumptions

After writing files, provide this summary:
- `Files written`
- `Coverage status` (complete/partial)
- `Ambiguities`
- `Actionable tasks`
- `Risks`
