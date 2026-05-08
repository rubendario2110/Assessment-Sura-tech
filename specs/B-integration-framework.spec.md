# Spec B: Reusable Integration Framework

## Goal
Implement a reusable integration component (TypeScript, NestJS + Fastify stack) that standardizes outbound service calls with resilience, observability, and consistency controls. The framework must be reusable across services and decoupled from business logic.

## Scope
- HTTP client abstraction with pluggable transport.
- Per-call timeout with safe cancellation (AbortController).
- Retry policy with bounded exponential backoff and jitter, with retry-budget protection.
- Circuit breaker (mandatory: `opossum`) with OPEN/CLOSED/HALF_OPEN transitions per dependency.
- Bulkhead/concurrency limit per dependency (configurable).
- Centralized configuration loaded from environment variables.
- Unified structured logging in JSON (consistent fields: timestamp, level, service, traceId, spanId, dependency, attempt, outcome, latencyMs).
- Trace propagation via W3C `traceparent` headers (OpenTelemetry-compatible approach).
- Idempotency-key support for mutation operations (header pass-through and helper to generate keys).
- Clear typed error model (TimeoutError, CircuitOpenError, UpstreamError, ValidationError, etc.).
- OpenTelemetry export compatibility for demo mode (OTLP endpoint configuration via env vars).

## Non-Functional Requirements
- Reusable: distributed as a dedicated DDD package under `packages/integration-framework`, importable by any service.
- Decoupled: zero business-domain knowledge; business semantics belong to callers.
- Configurable: all knobs (timeout, retries, backoff, circuit thresholds, concurrency) tunable via env vars without code changes.
- Observable: every outbound call emits structured logs and is traceable end-to-end.
- Test-friendly: deterministic behavior under fault-injection scenarios used in Spec C.
- Performance: framework overhead must be negligible (< 5 ms p95 added per call in local benchmark).

## Acceptance Criteria
- Framework code is isolated under `packages/integration-framework/*` with DDD structure and exposes a single client abstraction.
- Outbound calls demonstrably apply: timeout, retry+jitter, circuit breaker, bulkhead, idempotency header propagation, and trace propagation.
- Logs include trace ids, dependency name, attempt number, outcome, and latency.
- Configuration parameters can be overridden via env vars (documented in README/section B of `docs/assessment.md`).
- Public API exposes typed errors callers can branch on.
- DDD package structure exists and is used:
  - `packages/integration-framework/src/domain/**`
  - `packages/integration-framework/src/application/**`
  - `packages/integration-framework/src/infrastructure/**`
  - `packages/integration-framework/src/interfaces/**`
  - `packages/integration-framework/src/index.ts`
- Section B in `docs/assessment.md` explains design decisions, tradeoffs, and how each requirement is met.

## Output Files / Evidence Expected
- `packages/integration-framework/src/**/*.ts` (client, retry, circuit breaker wrapper, logger, tracing, idempotency, config, errors)
- `docs/assessment.md` (Section B: design decisions and code walkthrough)
- `docs/evidence/implementation-agent-evidence.md` (implementation decisions log)

## Open Questions and Assumptions
- Assumption: Stack is `pnpm` + NestJS + Fastify; circuit breaker uses `opossum` (per repo standard).
- Assumption: OpenTelemetry SDK + collector-based demo is required; `traceparent` propagation and OTLP export must be enabled for the demo.
- Assumption: Idempotency persistence is out of framework scope (business services own the dedupe store); the framework only generates/propagates the key.
- Open: Should the framework support gRPC/messaging in addition to HTTP, or HTTP-only for the assessment?
- Open: Required default timeouts/thresholds per environment (sane defaults will be provided).
- Open: Logging sink strategy for production (stdout JSON + OTel is mandatory for demo).
