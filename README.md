# Technical Lead Practical Assessment

**NestJS + Fastify** demo with **`@assessment/integration-framework`** (timeouts, retries+jitter, **`opossum`** circuit breaker, bulkhead, tracing helpers), bounded contexts **`channel`** and **`upstream`**, Jest suites, OpenAPI/Postman artifacts, a **reliability harness**, and optional **Docker** observability.

---

## Assessment document

- **[`docs/assessment.md`](./docs/assessment.md)** — Sections A–D (architecture, integration layer, demo, TDR).  
- **[`docs/assessment-input.md`](./docs/assessment-input.md)** — captured source brief.

---

## SDD (why it matters here)

**Specification-Driven Development** keeps intent in versioned Markdown (**[`specs/`](./specs/)**), aligns planning (**[`docs/plan-scrum.md`](./docs/plan-scrum.md)**, **[`docs/backlog.md`](./docs/backlog.md)**) with that intent, and ties implementation + tests back to the same specs. It is a **discipline**, not a runtime framework.

---

## Prerequisites

- **Node.js** ≥ 22 · **pnpm** (see root `package.json`)
- **Docker** (optional) — **[`docker-compose.demo.yml`](./docker-compose.demo.yml)**

### Environment variables

Copy **[`.env.example`](./.env.example)** → **`.env`** or **`.env.local`**. Nest loads **`.env.local`** first, then **`.env`**.

| Area | Variables |
| --- | --- |
| Ports / URLs | `CHANNEL_PORT`, `UPSTREAM_PORT`, `UPSTREAM_URL`, `SERVICE_NAME` |
| Idempotency | `REDIS_URL` — if set and Redis is reachable, **`POST /demo/order`** dedupes via Redis; otherwise **in-memory** (per process). Optional `IDEMPOTENCY_REDIS_TTL_SECONDS` (positive integer, Redis `EX`). |
| Resilience | `IF_*` — see **`.env.example`** and `packages/integration-framework` `loadIntegrationConfig` |
| OpenTelemetry (channel only) | Set **`OTEL_EXPORTER_OTLP_ENDPOINT`** or **`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`** to enable export. Disable with **`OTEL_ENABLED=false`** / **`OTEL_SDK_DISABLED=true`**. |
| Verbose app logs | **`APPLICATION_VERBOSE_LOGS`** — when not `false`, use cases log each **`execute`** and idempotency stores log **Redis/memory GET/SET**. Jest sets this off by default (`test/setup-env.ts`); run **`APPLICATION_VERBOSE_LOGS=true pnpm test`** to see them in tests. |

At **channel** startup, **`OpenTelemetry`** logs on stdout whether OTLP export is **skipped** or **started** (see `src/contexts/channel/otel-bootstrap.ts`). The SDK is loaded via **`import "./otel-register.js"`** as the **first** import in `main.ts` so instrumentations run **before** Nest/Fastify; set **`OTEL_SERVICE_NAME`** (or **`SERVICE_NAME`**) so Jaeger shows a proper service name. **`IdempotencyStore`** logs **`store=in-memory`** vs **`store=Redis …`** when the module boots.

---

## Scripts you will use

| Command | What it does |
| --- | --- |
| `pnpm integration-framework:build` | Compiles **`packages/integration-framework`** → its **`dist/`** (required before running apps or generators; also runs automatically as **`prebuild`**). |
| `pnpm build` | Full **`tsc`** for **`src/`** → root **`dist/`** (use for **`pnpm start:*`** or release-style runs). |
| `pnpm start:dev:upstream` / `pnpm start:dev:channel` | Runs **`src/contexts/*/main.ts`** with **`ts-node`** (no app **`dist/`**). |
| `pnpm start:upstream` / `pnpm start:channel` | Runs **`dist/contexts/*/main.js`** (**needs `pnpm build`** first). |
| `pnpm test` / `pnpm test:coverage` | Jest. |
| `pnpm test:reliability` | Builds integration-framework only; runs **`src/test/reliability-test.ts`** via **`ts-node`**; starts apps from **`src/`** (unless **`RELIABILITY_USE_DIST=1`**). |
| `pnpm openapi:generate` | Builds integration-framework; boots channel **`AppModule`** and writes **`docs/api/openapi.json`** from **`@nestjs/swagger`** (decorators on controllers/DTOs). |
| `pnpm postman:generate` | Converts **`docs/api/openapi.json`** → **`docs/postman/assessment.postman_collection.json`**. |
| `pnpm docs:api` | **`openapi:generate`** then **`postman:generate`** (no root **`pnpm build`**). |

**Nest + TypeScript:** DI needs **`emitDecoratorMetadata`**. This repo uses **`node --loader ts-node/esm`** for dev/scripts (not **`tsx`**). See **`docs/assessment.md`** Section B — runtime caveat.

---

## Run the demo (no root build)

```bash
pnpm install
# Terminal 1
UPSTREAM_PORT=3001 pnpm start:dev:upstream

# Terminal 2
CHANNEL_PORT=3000 UPSTREAM_URL=http://127.0.0.1:3001 SERVICE_NAME=channel pnpm start:dev:channel
```

---

## Test the demo

### 1. Smoke (browser or HTTP client)

| Check | Action |
| --- | --- |
| Upstream | `curl -s http://127.0.0.1:3001/health` |
| Channel | `curl -s http://127.0.0.1:3000/health` |
| Happy path | `curl -s "http://127.0.0.1:3000/demo/upstream?mode=ok"` |
| Swagger UI | Open [http://127.0.0.1:3000/api/docs](http://127.0.0.1:3000/api/docs) |
| Idempotency | Same **`Idempotency-Key`** twice: |

```bash
curl -s -X POST http://127.0.0.1:3000/demo/order \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-key-1" \
  -d '{"productId":"P1","qty":1}'
# Run again → HTTP 200 and "deduped": true in JSON body
```

### 2. Automated harness

```bash
pnpm test:reliability
```

Expect exit code **0** and JSON **`summary`** including **`breakerTimelineLines`** (breaker open / half-open / closed) and **`idempotency.secondDeduped: true`**.

Optional: **`RELIABILITY_USE_DIST=1 pnpm test:reliability`** — uses **`dist/contexts/*/main.js`** (run **`pnpm build`** first).

### 3. Unit / integration tests

```bash
pnpm test              # verbose listing per file (Jest `verbose: true`)
pnpm test:coverage
APPLICATION_VERBOSE_LOGS=true pnpm test   # optional: use-case + Redis/memory idempotency logs inside tests
```

---

## OpenAPI & Postman (from controllers)

**`pnpm openapi:generate`** loads the real Nest **`AppModule`**, so **`DocumentBuilder`** + **`SwaggerModule.createDocument`** reflect **`@ApiTags`**, **`@ApiOperation`**, and routes on **`DemoController`** — no hand-maintained YAML.

Regenerate both artifacts:

```bash
pnpm docs:api
```

Outputs: **[`docs/api/openapi.json`](./docs/api/openapi.json)**, **[`docs/postman/assessment.postman_collection.json`](./docs/postman/assessment.postman_collection.json)**.

---

## Optional — observability (Docker)

```bash
pnpm demo:config    # validate Compose (no daemon)
pnpm demo:up        # Redis + OTel Collector + Jaeger
```

- **Redis** on **`127.0.0.1:6379`** — set **`REDIS_URL=redis://127.0.0.1:6379`** in **`.env`** so the channel uses Redis for idempotency (optional).  
- Jaeger UI: [http://localhost:16686](http://localhost:16686)  
- Collector: **[`observability/otel-collector-config.yaml`](./observability/otel-collector-config.yaml)**  
- **Traces:** set **`OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces`** (and **`OTEL_SERVICE_NAME`**) on the **channel** process; see **`.env.example`**.

```bash
pnpm demo:down
```

---

## Documentation map (assessment deliverables)

| Area | Links |
| --- | --- |
| Specs | [`specs/A-architecture.spec.md`](./specs/A-architecture.spec.md), [`B-integration-framework.spec.md`](./specs/B-integration-framework.spec.md), [`C-demo-service.spec.md`](./specs/C-demo-service.spec.md), [`D-tdr.spec.md`](./specs/D-tdr.spec.md) |
| Diagrams | [`docs/architecture.mmd`](./docs/architecture.mmd), [`docs/c4-system-context.mmd`](./docs/c4-system-context.mmd), [`docs/c4-container.mmd`](./docs/c4-container.mmd), [`docs/c4-component-integration-layer.mmd`](./docs/c4-component-integration-layer.mmd), [`docs/c4-diagram-explanations.md`](./docs/c4-diagram-explanations.md) |
| Planning | [`docs/plan-scrum.md`](./docs/plan-scrum.md), [`docs/backlog.md`](./docs/backlog.md), [`docs/sprint-status.md`](./docs/sprint-status.md) |
| Evidence | [`docs/evidence/spec-agent-evidence.md`](./docs/evidence/spec-agent-evidence.md), [`planning-agent-evidence.md`](./docs/evidence/planning-agent-evidence.md), [`architecture-agent-evidence.md`](./docs/evidence/architecture-agent-evidence.md), [`implementation-agent-evidence.md`](./docs/evidence/implementation-agent-evidence.md), [`review-agent-evidence.md`](./docs/evidence/review-agent-evidence.md) |

---

## Repository layout

| Path | Role |
| --- | --- |
| [`packages/integration-framework/`](./packages/integration-framework/) | Resilient HTTP client + shared policies |
| [`src/contexts/channel/`](./src/contexts/channel/) | Consumer (DDD-style) |
| [`src/contexts/upstream/`](./src/contexts/upstream/) | Flaky upstream simulator |
| [`src/scripts/generate-openapi.ts`](./src/scripts/generate-openapi.ts) | OpenAPI JSON export |
| [`src/test/reliability-test.ts`](./src/test/reliability-test.ts) | Reliability harness |
| [`test/`](./test/) | Jest unit / integration / e2e |

---

## Cursor workflow (optional)

[`docs/assessment-input.md`](./docs/assessment-input.md) → `/specs` → `/plan` → `/architecture` → `/implementation` → `/review`. Placeholders: **`pnpm sdd:start`**, **`pnpm sdd:review`**.
