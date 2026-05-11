# Technical Lead Practical Assessment

Implementation of the assessment brief using **NestJS + Fastify**, a reusable **`@assessment/integration-framework`** package, demo bounded contexts **`channel`** and **`upstream`**, automated tests, OpenAPI/Postman artifacts, a **reliability harness**, and optional **Docker** observability stack.

---

## Assessment deliverable (Sections A–D)

The consolidated narrative, architecture, integration design, demo runbook, and checklist live here:

- **[`docs/assessment.md`](./docs/assessment.md)** — primary assessment document (architecture, Integration Layer, demo DDD layout, failure behaviour, decisions).

Source text captured before elaboration:

- **[`docs/assessment-input.md`](./docs/assessment-input.md)**

---

## Specification-Driven Development (SDD) — concept and why it was used

**SDD** means driving delivery from explicit specifications and keeping a traceable path from intent → design → code → verification. Specifications are written first (or revised as facts change), then planning and architecture align with them, and implementation plus tests demonstrate conformance.

This project used SDD so that:

- Requirements stay **reviewable** as Markdown specs under [`specs/`](./specs/) instead of only living in chat or tribal knowledge.
- **`docs/assessment.md`** remains the **single readable story** for reviewers (Sections A–D), while specs pin acceptance-level detail.
- Agent-assisted workflows (`/specs`, `/plan`, `/architecture`, `/implementation`, `/review`) have **stable inputs and outputs** (specs, backlog, diagrams, evidence).

SDD here is a **process lens**, not a separate framework: the repo still ships normal TypeScript, tests, and Compose files.

---

## Prerequisites

- **Node.js** ≥ 22 (see `package.json` `engines`)
- **pnpm** (version pinned via `packageManager` in `package.json`)
- **Docker** (optional) — for [`docker-compose.demo.yml`](./docker-compose.demo.yml) (Redis, OTel Collector, Jaeger)

---

## Quick start — install and build

```bash
pnpm install
pnpm build          # builds workspace package + apps → dist/
pnpm lint
pnpm test
pnpm test:coverage
```

Always run Nest apps from **`dist/`** after `pnpm build`. Avoid `tsx` for production-style bootstrap: **`emitDecoratorMetadata`** is required for Nest DI (see [`docs/assessment.md`](./docs/assessment.md) Section B runtime caveat).

---

## Run the demo locally (two processes)

**Terminal 1 — upstream simulator**

```bash
pnpm build
UPSTREAM_PORT=3001 pnpm start:upstream
```

**Terminal 2 — channel (calls upstream)**

```bash
CHANNEL_PORT=3000 UPSTREAM_URL=http://127.0.0.1:3001 SERVICE_NAME=channel pnpm start:channel
```

**Try it**

| What | URL / command |
| --- | --- |
| Channel Swagger UI | [http://127.0.0.1:3000/api/docs](http://127.0.0.1:3000/api/docs) |
| Channel OpenAPI (runtime) | [http://127.0.0.1:3000/api/openapi.json](http://127.0.0.1:3000/api/openapi.json) |
| Upstream health | `GET http://127.0.0.1:3001/health` |
| Upstream flaky resource | `GET http://127.0.0.1:3001/resource?mode=ok` (also `fail`, `slow`, `random`, …) |
| Channel proxy | `GET http://127.0.0.1:3000/demo/upstream` |
| Idempotent order | `POST http://127.0.0.1:3000/demo/order` with header `Idempotency-Key` |

---

## Verify resilience (automated harness)

Builds, spawns compiled apps, drives failures, and prints a JSON summary (retries, breaker timeline, idempotency):

```bash
pnpm test:reliability
```

---

## Regenerate API artifacts (OpenAPI + Postman)

Committed copies used as assessment evidence:

- [`docs/api/openapi.json`](./docs/api/openapi.json)
- [`docs/postman/assessment.postman_collection.json`](./docs/postman/assessment.postman_collection.json)

Regenerate from code:

```bash
pnpm docs:api           # openapi:generate + postman:generate
```

---

## Optional — observability stack (Docker)

Validate Compose file without starting containers:

```bash
pnpm demo:config
```

Start Redis + OTel Collector + Jaeger:

```bash
pnpm demo:up
```

- **Jaeger UI**: [http://localhost:16686](http://localhost:16686)
- Collector config: [`observability/otel-collector-config.yaml`](./observability/otel-collector-config.yaml)

To export traces from the **channel**, set standard OpenTelemetry env vars before start (for example `OTEL_SERVICE_NAME=channel` and an OTLP endpoint pointing at the collector — see OpenTelemetry documentation for `OTEL_EXPORTER_OTLP_*`). If unset, the app skips telemetry bootstrap.

Tear down:

```bash
pnpm demo:down
```

---

## Executable specifications (`specs/`)

| Spec | Purpose |
| --- | --- |
| [`specs/A-architecture.spec.md`](./specs/A-architecture.spec.md) | Target architecture / platform alignment |
| [`specs/B-integration-framework.spec.md`](./specs/B-integration-framework.spec.md) | Integration framework acceptance |
| [`specs/C-demo-service.spec.md`](./specs/C-demo-service.spec.md) | Demo services + reliability + Compose |
| [`specs/D-tdr.spec.md`](./specs/D-tdr.spec.md) | Technical decision record themes |

---

## Architecture diagrams and explanations

| Artifact | Role |
| --- | --- |
| [`docs/architecture.mmd`](./docs/architecture.mmd) | Executive architecture overview (Mermaid) |
| [`docs/c4-system-context.mmd`](./docs/c4-system-context.mmd) | C4 System Context |
| [`docs/c4-container.mmd`](./docs/c4-container.mmd) | C4 Container |
| [`docs/c4-component-integration-layer.mmd`](./docs/c4-component-integration-layer.mmd) | C4 Component (Integration Layer) |
| [`docs/c4-diagram-explanations.md`](./docs/c4-diagram-explanations.md) | Narrative for diagrams (purpose, scope, flows, trade-offs) |

Render with your preferred Mermaid toolchain (e.g. Mermaid CLI, IDE plugins, or paste into [mermaid.live](https://mermaid.live)).

---

## Planning and backlog (Scrum artefacts)

| Document | Role |
| --- | --- |
| [`docs/plan-scrum.md`](./docs/plan-scrum.md) | Sprint planning / execution narrative |
| [`docs/backlog.md`](./docs/backlog.md) | Product backlog and story breakdown |
| [`docs/sprint-status.md`](./docs/sprint-status.md) | Current sprint / gate tracking |

---

## Agent evidence trail (SDD / review runs)

Append-only logs from specification, planning, architecture, implementation, and review passes:

| File |
| --- |
| [`docs/evidence/spec-agent-evidence.md`](./docs/evidence/spec-agent-evidence.md) |
| [`docs/evidence/planning-agent-evidence.md`](./docs/evidence/planning-agent-evidence.md) |
| [`docs/evidence/architecture-agent-evidence.md`](./docs/evidence/architecture-agent-evidence.md) |
| [`docs/evidence/implementation-agent-evidence.md`](./docs/evidence/implementation-agent-evidence.md) |
| [`docs/evidence/review-agent-evidence.md`](./docs/evidence/review-agent-evidence.md) |

---

## Repository layout (high level)

| Path | Contents |
| --- | --- |
| [`packages/integration-framework/`](./packages/integration-framework/) | Resilient HTTP client (`opossum`, retries, bulkhead, logging, trace propagation, idempotency helpers) |
| [`src/contexts/channel/`](./src/contexts/channel/) | Demo consumer (DDD-style folders) |
| [`src/contexts/upstream/`](./src/contexts/upstream/) | Flaky upstream simulator |
| [`src/test/reliability-test.ts`](./src/test/reliability-test.ts) | Reliability harness entrypoint |
| [`test/unit/`](./test/unit/), [`test/integration/`](./test/integration/), [`test/e2e/`](./test/e2e/) | Jest suites |

---

## Cursor workflow (optional)

1. [`docs/assessment-input.md`](./docs/assessment-input.md) — captured assessment source  
2. `/specs` → `/plan` → `/architecture` → `/implementation` → `/review`  
3. For `/implementation`, prefer `runner=implementation-agent` when available.

Companion scripts (placeholders): `pnpm sdd:start`, `pnpm sdd:review`.
