# Spec C: Demo Service and Reliability Test

## Goal
Build a small demo channel service that consumes the reusable integration framework (Spec B) to call a simulated flaky upstream service. Demonstrate how resilience patterns mitigate failures and provide a reliability test that exercises the system under fault conditions.

## Scope
- `channel` service (NestJS + Fastify): exposes a public endpoint that invokes the upstream through the integration framework.
- `upstream` service (NestJS + Fastify): simulates flakiness (random latency, intermittent 5xx, sustained outages, slow responses) controlled via env vars or query parameters.
- `reliability-test` script: generates traffic patterns (steady, burst, sustained outage, recovery) and prints an outcome summary (status code distribution, retry counts, circuit transitions, duplicates blocked by idempotency).
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
- Local-first: runnable with `pnpm` and Node.js without external infrastructure.
- Containerized observability/runtime support: runnable with `docker compose` for Redis + OTel + trace backend.
- Deterministic-enough demo: reliability script outcomes are reproducible within reasonable variance.
- Fast feedback: full reliability scenario completes in under ~2 minutes locally.
- Observability: every request emits structured JSON logs with trace ids.

## Acceptance Criteria
- `channel` and `upstream` services start with documented `pnpm` commands.
- `docker compose -f docker-compose.demo.yml config` succeeds.
- `docker compose -f docker-compose.demo.yml up -d` starts Redis + OTel Collector + Jaeger.
- Under upstream failures, `channel` returns degraded-but-controlled responses (e.g., 502/503 with structured error body) instead of cascading failures.
- Reliability script prints a summary including status code mix (e.g., 200/502/503/409), retry count, breaker state transitions, and idempotency-deduped requests.
- Idempotency is verifiable: repeating the same key returns the same logical outcome without re-executing side effects.
- Telemetry path is visible during demo: application -> OTel Collector -> Jaeger.
- Section C of `docs/assessment.md` documents how to run everything and explains observed behavior.

## Output Files / Evidence Expected
- `src/channel/main.ts` (and supporting NestJS modules/controllers)
- `src/upstream/main.ts` (flaky upstream simulator)
- `src/test/reliability-test.ts` (traffic generator + outcome summary)
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
