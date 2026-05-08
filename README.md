# Technical Lead Practical Assessment - SDD Kickoff

This workspace is cleaned to start a **Spec-Driven Development (SDD)** process from scratch.

## Keep and Use

- `specs/`:
  - `A-architecture.spec.md`
  - `B-integration-framework.spec.md`
  - `C-demo-service.spec.md`
  - `D-tdr.spec.md`
- `.cursor/commands/`:
  - `/specs`
  - `/plan`
  - `/architecture`
  - `/implementation`
  - `/review`
- `.cursor/agents/`:
  - `spec-agent`
  - `planning-agent`
  - `architecture-agent`
  - `implementation-agent`
  - `review-agent`
- `docs/evidence/`:
  - `spec-agent-evidence.md`
  - `planning-agent-evidence.md`
  - `architecture-agent-evidence.md`
  - `implementation-agent-evidence.md`
  - `review-agent-evidence.md`

## Recommended Execution Order in Cursor

1. Paste the full assessment into `docs/assessment-input.md`
2. `/specs` (this must create/update files in `specs/`)
3. `/plan`
4. `/architecture`
5. `/implementation`
6. `/review`

## Note on `/specs`

`/specs` is configured to write files, not only chat output.  
Expected generated/updated files:
- `specs/A-architecture.spec.md`
- `specs/B-integration-framework.spec.md`
- `specs/C-demo-service.spec.md`
- `specs/D-tdr.spec.md`

## Note on `/plan`

`/plan` is configured to create/update a 12-week Scrum plan with epics, user stories, tasks, and estimates.
Expected generated/updated files:
- `docs/plan-scrum.md`
- `docs/backlog.md`

## Evidence Standard (Mandatory for all agents)

All agents must leave persistent evidence on every execution by appending a new entry in their corresponding file under `docs/evidence/`.

Minimum evidence fields:
- UTC timestamp
- Inputs used
- Files changed/created
- Decisions and rationale
- Risks and next actions

## Architecture Modeling Standard

Use DDD framing + C4 model diagrams in Mermaid, with Azure-first technical decisions.

Expected C4 outputs:
- `docs/c4-system-context.mmd`
- `docs/c4-container.mmd`
- `docs/c4-component-integration-layer.mmd`

Optional overview:
- `docs/architecture.mmd`

## Implementation Standard

- Stack: `pnpm` + `NestJS` + `Fastify`
- Circuit breaker library: `opossum` (mandatory for outbound dependency calls)

## Output Templates

- `docs/assessment.md`
- `docs/architecture.mmd`

Both files are intentionally reset as templates so you can generate final content through your SDD workflow.
