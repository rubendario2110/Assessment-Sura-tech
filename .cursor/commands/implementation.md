# Implementation

Execute implementation for all tasks committed to the active sprint and provide technical evidence.

Mandatory routing:
- Delegate this command to `implementation-agent`.
- If `implementation-agent` cannot be invoked, stop and report `routing-blocked` instead of continuing with the default agent.
- At the beginning of execution, explicitly state: `runner=implementation-agent`.

Rules:

1. Implement all tasks committed to the active sprint (`Sprint N`) in `docs/plan-scrum.md` / `docs/backlog.md`.
2. Keep consistency with NestJS + Fastify + the resilience framework.
3. Use TDD (Red -> Green -> Refactor) as mandatory implementation workflow.
4. Use `opossum` as the circuit breaker implementation for outbound dependency calls.
5. Generate/refresh Swagger/OpenAPI docs.
6. Generate/refresh Postman Collection from OpenAPI.
7. Use latest stable Node.js Current release.
8. Implement the integration framework as a dedicated DDD package (`packages/integration-framework`).
9. Keep all tests under top-level `test/` folders (`test/unit`, `test/integration`, `test/e2e`).
10. Enforce quality gates:
- 100% coverage
- 0% duplication
- 0 code smells
- 0 ESLint errors/warnings
11. Create/maintain demo infrastructure with Docker Compose:
- `docker-compose.demo.yml` with `redis` + `otel-collector` + trace backend
- `observability/otel-collector-config.yaml`
12. Update documentation if behavior or contracts change.
13. Validate with build, tests, reliability checks, and demo infra checks.
14. If any sprint task is blocked, explicitly report blocker, impact, and mitigation.

Mandatory artifacts:
- `docs/api/openapi.json`
- `docs/postman/assessment.postman_collection.json`
- `packages/integration-framework/**`
- `test/**`
- `docker-compose.demo.yml`
- `observability/otel-collector-config.yaml`
- `docs/evidence/implementation-agent-evidence.md`

Minimum verification:
- `node -v`
- `pnpm build`
- Test suite execution showing TDD completion for implemented scope
- Coverage report proving 100% for lines/functions/branches/statements
- Lint report proving 0 ESLint errors/warnings
- Sonar/SonarCloud quality gate proving 0% duplication and 0 code smells
- `pnpm test:reliability` (with both services running)
- Evidence of `opossum` breaker state transitions (`open`, `halfOpen`, `close`) under failure scenarios
- Evidence that OpenAPI and Postman artifacts were generated/updated
- `docker compose -f docker-compose.demo.yml config` succeeds
- Demo stack starts and telemetry path is observable (app -> collector -> trace backend)

Expected output:
- Files changed
- Sprint scope implemented (done vs blocked)
- Design decisions
- Validation results
- Node.js version used
- OpenAPI/Postman artifact status
- DDD package status
- Test folder status
- Docker Compose demo status
- Telemetry demo status
- Quality gates status
- Open risks
- Evidence file updated
