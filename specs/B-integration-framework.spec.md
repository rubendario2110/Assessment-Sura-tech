# Spec B: Reusable Integration Framework

## Goal
Implement a reusable integration module for outbound service calls with resilience, observability, and consistency controls.

## Required Capabilities
- Per-call timeout with safe cancellation
- Retry policy with exponential backoff and jitter
- Circuit breaker with OPEN/CLOSED/HALF_OPEN transitions
- Centralized configuration from environment
- Unified structured logging (JSON)
- Trace propagation via `traceparent` headers (OpenTelemetry-compatible approach)
- Idempotency-key support for mutation operations

## Design Constraints
- Keep framework decoupled from business domain logic
- Reuse one client abstraction across services
- Must expose clear error types for callers

## Acceptance Criteria
- Framework code is reusable and isolated under `src/framework`
- Retry/circuit/idempotency behavior is evident in logs and runtime behavior
- Configuration parameters can be tuned by env vars without code changes

## Output Files
- `src/framework/*.ts`
- `docs/assessment.md` (Section B)
