# Integration Framework Library Stack (NestJS)

## Core
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify`
- `@nestjs/config` + `joi` (centralized config + validation)

## Resilience
- Circuit breaker: `opossum` (mandatory)
- Retry/backoff: implementation in framework (or a dedicated retry utility if needed)
- Timeout/cancellation: native `AbortController`
- Bulkhead: framework-level semaphore/pool

## Observability
- Logging: `nestjs-pino` + `pino` + `pino-http`
- Tracing: `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`
- Health checks: `@nestjs/terminus`

## API Artifacts
- Swagger/OpenAPI: `@nestjs/swagger`
- Postman collection generation: from `docs/api/openapi.json`

## Data/Idempotency/Cache
- Redis client: `ioredis`

## Demo Infrastructure
- `docker-compose.demo.yml` (Redis + OTel Collector + Jaeger)
- `observability/otel-collector-config.yaml`

## Validation
- DTO/runtime validation: `class-validator` + `class-transformer`

## Quality Gates Tooling
- Tests + coverage: `jest` + `ts-jest` + coverage thresholds
- Lint: `eslint`
- Static quality gate: SonarQube/SonarCloud scanner for duplication/code smells
