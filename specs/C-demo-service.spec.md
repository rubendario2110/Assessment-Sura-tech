# Spec C: Demo Service and Reliability Test

## Goal
Build a small demo channel service (NestJS + Fastify) that uses the reusable integration framework against a simulated flaky upstream service (NestJS + Fastify).

## Required Demonstrations
- Upstream intermittent failures trigger retries
- Sustained upstream failure opens circuit breaker and isolates upstream
- Recovery path transitions from OPEN to HALF_OPEN to CLOSED
- Duplicate requests with same idempotency key do not produce duplicate work
- Logs include trace ids and structured fields for triage

## Runbook Expectations
- Simple run commands for both services
- Reliability script that generates failure traffic and prints outcome summary

## Acceptance Criteria
- Demo service returns degraded-but-controlled responses under upstream failures
- Reliability script shows expected status mix (200/502/503/409 under tests)
- Behavior explanation is documented for interview/demo usage

## Output Files
- `src/channel/main.ts`
- `src/upstream/main.ts`
- `src/test/reliability-test.ts`
- `docs/assessment.md` (Section C)
