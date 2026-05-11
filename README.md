# Technical Lead Practical Assessment — SDD + implementation reset

**Application code was reset to start implementation from scratch.** The repo currently contains:

- `src/placeholder.ts` — builds only; replace with real bounded contexts and wiring.
- **Target docs** remain under `docs/` (`assessment.md`, `plan-scrum.md`, `backlog.md`, C4 diagrams, evidence).
- **Specs** under `specs/`.
- **Stubs:** `docs/api/openapi.json`, `docs/postman/assessment.postman_collection.json` (regenerate after APIs exist).

Follow `docs/sprint-status.md` (program **not finalized**; **S1** active) and implement per `docs/backlog.md` / `docs/plan-scrum.md`.

## Commands (current state)

```bash
pnpm install
pnpm build              # compiles src/ → dist/ (placeholder only)
pnpm lint
pnpm test               # Jest — passWithNoTests until you add test/unit/**/*.spec.ts
pnpm test:coverage      # no thresholds until implementation returns
```

Scripts that **exit with instructions** until restored: `start:*`, `test:reliability`, `openapi:generate`, `docs:api`, `demo:*`.

## What to restore (reference layout)

- `pnpm-workspace.yaml` + `packages/integration-framework/` (`@assessment/integration-framework`)
- `src/contexts/channel/`, `src/contexts/upstream/`, `src/scripts/generate-openapi.ts`, `src/test/reliability-test.ts`
- `test/unit/**` mirroring sources
- `docker-compose.demo.yml` + `observability/otel-collector-config.yaml`
- Optional: `sonar-project.properties` for CI

## NestJS + Fastify note

When you add Nest apps: use **`pnpm build`** then **`node dist/contexts/.../main.js`** — avoid `tsx` for DI-heavy entrypoints (`emitDecoratorMetadata`).

## Cursor workflow

1. `docs/assessment-input.md` — assessment source text  
2. `/specs` → `/plan` → `/architecture` → `/implementation` → `/review`  
3. For `/implementation`, prefer `runner=implementation-agent` when available.

## Evidence

Append entries under `docs/evidence/*.md` on each agent run.
