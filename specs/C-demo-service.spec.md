# Spec C: Demo Service and Reliability Test

## Goal
Build a small **demo service** (assessment Section C) that uses the integration framework (Spec B) to call a **simulated flaky upstream**. Demonstrate expected behavior under failure conditions, describe how resilience patterns mitigate issues, and supply **run instructions** plus a **reliability test** / scenario driver aligned with repo scripts.

## Scope
- `channel` bounded context (NestJS + Fastify under `src/contexts/channel/`): exposes a public endpoint that invokes the upstream through `@assessment/integration-framework`.
- `upstream` bounded context (NestJS + Fastify under `src/contexts/upstream/`): simulates flakiness (random latency, intermittent 5xx, sustained outages, slow responses) controlled via env vars or query parameters.
- Reliability exercise: `src/test/reliability-test.ts` driven by **`pnpm test:reliability`** (builds, runs compiled services, drives flaky scenarios, surfaces breaker timeline / summary).
- Demo runtime infrastructure with Docker Compose:
  - `redis` service for idempotency/cache demo needs.
  - `otel-collector` service for telemetry ingestion.
  - Trace backend (Jaeger) to visualize trace flow.
- OpenTelemetry Collector config file for OTLP pipeline routing.
- Run instructions for both services and the test script.
- Documented behavior explanation for interview/demo usage.

## Required Demonstrations
- Intermittent upstream failures trigger framework retries with exponential backoff and jitter.
- Sustained upstream failures open the circuit breaker and fast-fail downstream calls (bulkhead protected).
- Recovery path transitions OPEN → HALF_OPEN → CLOSED when upstream stabilizes.
- Duplicate requests with the same idempotency key do not produce duplicate side effects.
- Logs include `traceparent`-derived trace ids and structured fields suitable for triage.

## Non-Functional Requirements
- **Build-then-run**: NestJS DI requires compiled output — use **`pnpm build`** then run from `dist/` (or use repo scripts that encapsulate this); avoid running raw Nest controllers through `tsx` for integration demos (metadata loss).
- Local-first: runnable with `pnpm` and Node.js without external infrastructure for core flows.
- Containerized observability/runtime support: runnable with `docker compose` for Redis + OTel + trace backend.
- Deterministic-enough demo: reliability script outcomes are reproducible within reasonable variance.
- Fast feedback: full reliability scenario completes in under ~2 minutes locally.
- Observability: every request emits structured JSON logs with trace ids.

## Acceptance Criteria
- `channel` and `upstream` services start with documented commands (e.g. `pnpm build` plus `node dist/contexts/channel/main.js` / `node dist/contexts/upstream/main.js`, or equivalent `pnpm start:*` scripts).
- **`pnpm demo:config`** validates `docker-compose.demo.yml` syntax without a daemon.
- **`pnpm demo:up`** / **`pnpm demo:down`** manage Redis + OTel Collector + Jaeger (requires Docker when exercising observability stack).
- Under upstream failures, `channel` returns degraded-but-controlled responses (e.g., 502/503 with structured error body) instead of cascading failures.
- Reliability script prints a summary including status code mix (e.g., 200/502/503/409), retry count, breaker state transitions, and idempotency-deduped requests.
- Idempotency is verifiable: repeating the same key returns the same logical outcome without re-executing side effects.
- Telemetry path is visible during demo: application -> OTel Collector -> Jaeger.
- Section C of `docs/assessment.md` documents how to run everything and explains observed behavior.

## Output Files / Evidence Expected
- `src/contexts/channel/**` (NestJS modules, CQRS handlers, HTTP controllers, `main.ts`)
- `src/contexts/upstream/**` (flaky upstream simulator, `main.ts`)
- `src/test/reliability-test.ts` (traffic generator + outcome summary; wired via **`pnpm test:reliability`**)
- `docs/assessment.md` (Section C: run instructions + behavior narrative)
- `docs/evidence/implementation-agent-evidence.md` (entry for demo run + observed metrics)
- `docker-compose.demo.yml` (Redis + OTel Collector + Jaeger)
- `observability/otel-collector-config.yaml` (OTLP receivers/processors/exporters)

## Open Questions and Assumptions
- Assumption: Demo is single-host and uses Docker Compose as local orchestration.
- Assumption: The flaky upstream simulator is hand-rolled (no third-party chaos tool).
- Assumption: Idempotency dedupe store is in-memory for the demo (Map keyed by idempotency key).
- Open: Required ports for `channel` and `upstream` services (defaults will be provided, e.g., 3000 and 3001).
- Open: Whether to add service containers for `channel` and `upstream` in compose, or keep only support services for local `pnpm` execution.
- Open: Acceptance thresholds for the reliability summary (qualitative narrative will be provided).
