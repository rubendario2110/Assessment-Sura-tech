# Implementation

Execute implementation for all tasks committed to the active sprint and provide technical evidence.

Rules:

1. Implement all tasks committed to the active sprint (`Sprint N`) in `docs/plan-scrum.md` / `docs/backlog.md`.
2. Keep consistency with NestJS + Fastify + the resilience framework.
3. Use TDD (Red -> Green -> Refactor) as mandatory implementation workflow.
4. Use `opossum` as the circuit breaker implementation for outbound dependency calls.
5. Generate/refresh Swagger/OpenAPI docs.
6. Generate/refresh Postman Collection from OpenAPI.
7. Use latest stable Node.js Current release.
8. Update documentation if behavior or contracts change.
9. Validate with build, tests, and reliability checks.
10. If any sprint task is blocked, explicitly report blocker, impact, and mitigation.

Mandatory artifacts:
- `docs/api/openapi.json`
- `docs/postman/assessment.postman_collection.json`

Minimum verification:
- `node -v`
- `pnpm build`
- Test suite execution showing TDD completion for implemented scope
- `pnpm test:reliability` (with both services running)
- Evidence of `opossum` breaker state transitions (`open`, `halfOpen`, `close`) under failure scenarios
- Evidence that OpenAPI and Postman artifacts were generated/updated

Expected output:
- Files changed
- Sprint scope implemented (done vs blocked)
- Design decisions
- Validation results
- Node.js version used
- OpenAPI/Postman artifact status
- Open risks
