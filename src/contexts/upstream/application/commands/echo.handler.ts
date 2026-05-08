import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { EchoCommand } from "./echo.command.js";
import { EchoServedEvent } from "../../domain/events/echo-served.event.js";
import { EchoRejectedEvent } from "../../domain/events/echo-rejected.event.js";
import { FAILURE_RATE_REPOSITORY, IDEMPOTENCY_STORE } from "../../infrastructure/tokens.js";
import type { IdempotencyStore } from "../../domain/idempotency-store.port.js";
import type { FailureRateRepository } from "../../domain/failure-rate-repository.port.js";

export class FlakyUpstreamError extends Error {
  readonly code = "UPSTREAM_FLAKY" as const;
}

@CommandHandler(EchoCommand)
export class EchoHandler implements ICommandHandler<EchoCommand, Record<string, unknown>> {
  constructor(
    @Inject(IDEMPOTENCY_STORE) private readonly store: IdempotencyStore,
    @Inject(FAILURE_RATE_REPOSITORY) private readonly failureRates: FailureRateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EchoCommand): Promise<Record<string, unknown>> {
    const keyStr = command.idempotencyKey?.toString();

    if (keyStr) {
      const cached = this.store.find(keyStr);
      if (cached) {
        this.eventBus.publish(new EchoServedEvent(keyStr, true));
        return { ...cached, deduped: true };
      }
    }

    const failureRate = this.failureRates.current().toNumber();
    if (Math.random() < failureRate) {
      this.eventBus.publish(new EchoRejectedEvent(keyStr ?? null));
      throw new FlakyUpstreamError("upstream_flaky");
    }

    const payload: Record<string, unknown> = {
      ok: true,
      echo: command.message,
      idempotencyKey: keyStr ?? null,
      serverTime: new Date().toISOString(),
    };

    if (keyStr) this.store.put(keyStr, payload);
    this.eventBus.publish(new EchoServedEvent(keyStr ?? null, false));
    return payload;
  }
}
