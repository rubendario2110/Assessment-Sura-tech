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
  - `/sprint-status`
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

## Implementation runtime note

NestJS dependency injection relies on `reflect-metadata` / `emitDecoratorMetadata`. Running sources directly through **`tsx`** drops constructor metadata, causing controllers and CQRS handlers to receive `undefined` dependencies (symptom: `UndefinedDependencyException`).

Always **`pnpm build`** then run from `dist/`:

- `node dist/contexts/channel/main.js`
- `node dist/contexts/upstream/main.js`
- `node dist/scripts/generate-openapi.js`

The `pnpm start:*`, `pnpm openapi:generate`, and `pnpm test:reliability` scripts handle this automatically.

## Implementation Quick Commands

```bash
pnpm install
pnpm build
pnpm test              # Jest (ESM) unit + CQRS handler specs
pnpm test:reliability  # builds then spins compiled services + drives flaky scenarios
pnpm docs:api          # refreshes docs/api/openapi.json + Postman collection
```

Artifacts:

- `docs/api/openapi.json`
- `docs/postman/assessment.postman_collection.json`

## Source Layout (DDD + CQRS by bounded context)

```
src/
  framework/                       # Reusable integration framework (US-009/010/018)
  contexts/
    channel/
      domain/{value-objects,events}
      application/{commands,queries,dto}      # @nestjs/cqrs handlers
      infrastructure/                         # providers + tokens (DI ports)
      interfaces/http/                        # NestJS controllers
      channel.module.ts
      main.ts
    upstream/
      domain/{value-objects,events,*.port.ts}
      application/{commands,queries}
      infrastructure/                         # in-memory store + repository
      interfaces/http/
      upstream.module.ts
      main.ts
  scripts/                                    # tooling (OpenAPI generator)
  test/                                       # reliability harness
```

CQRS bus wiring uses `@nestjs/cqrs` (`CommandBus` / `QueryBus` / `EventBus`). Test runner is **Jest** (NestJS official preset, ESM mode via `ts-jest/presets/default-esm` and `--experimental-vm-modules`).

## Recommended Execution Order in Cursor

1. Paste the full assessment into `docs/assessment-input.md`
2. `/specs` (this must create/update files in `specs/`)
3. `/plan`
4. `/sprint-status`
5. `/architecture`
6. `/implementation`
7. `/review`

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
- `docs/c4-diagram-explanations.md` (mandatory explanations for each generated diagram)

Optional overview:
- `docs/architecture.mmd`

## Implementation Standard

- Stack: `pnpm` + `NestJS` + `Fastify`
- Scope policy: execute all tasks committed to the active sprint
- Testing discipline: mandatory TDD (`Red -> Green -> Refactor`)
- Circuit breaker library: `opossum` (mandatory for outbound dependency calls)
- API documentation: Swagger/OpenAPI (`docs/api/openapi.json`)
- API client artifact: Postman Collection (`docs/postman/assessment.postman_collection.json`)
- Node.js runtime: latest stable Current release (as of 2026-05-08: `v26.1.0`)

## Output Templates

- `docs/assessment.md`
- `docs/architecture.mmd`

Both files are intentionally reset as templates so you can generate final content through your SDD workflow.
