# Implementation

Execute the next implementation batch from the plan and provide technical evidence.

Rules:

1. Implement only 2-3 tasks from the `Now` block.
2. Keep consistency with NestJS + Fastify + the resilience framework.
3. Use `opossum` as the circuit breaker implementation for outbound dependency calls.
4. Update documentation if behavior or contracts change.
5. Validate with build and reliability test.

Minimum verification:
- `pnpm build`
- `pnpm test:reliability` (with both services running)
- Evidence of `opossum` breaker state transitions (`open`, `halfOpen`, `close`) under failure scenarios

Expected output:
- Files changed
- Design decisions
- Validation results
- Open risks
