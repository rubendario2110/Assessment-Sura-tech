import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { UpstreamController } from "./interfaces/http/upstream.controller.js";
import { EchoHandler } from "./application/commands/echo.handler.js";
import { UpdateFailureRateHandler } from "./application/commands/update-failure-rate.handler.js";
import { GetUpstreamStatusHandler } from "./application/queries/get-upstream-status.handler.js";
import { InMemoryIdempotencyStore } from "./infrastructure/in-memory-idempotency.store.js";
import { InMemoryFailureRateRepository } from "./infrastructure/in-memory-failure-rate.repository.js";
import { FAILURE_RATE_REPOSITORY, IDEMPOTENCY_STORE } from "./infrastructure/tokens.js";

@Module({
  imports: [CqrsModule],
  controllers: [UpstreamController],
  providers: [
    EchoHandler,
    UpdateFailureRateHandler,
    GetUpstreamStatusHandler,
    { provide: IDEMPOTENCY_STORE, useClass: InMemoryIdempotencyStore },
    { provide: FAILURE_RATE_REPOSITORY, useClass: InMemoryFailureRateRepository },
  ],
})
export class UpstreamModule {}
