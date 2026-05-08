import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import {
  BulkheadFullError,
  CircuitOpenError,
  IntegrationHttpClient,
  TimeoutError,
  UpstreamError,
} from "../../../../framework/index.js";
import {
  CHANNEL_UPSTREAM_BASE_URL,
  type ChannelUpstreamBaseUrl,
} from "../../infrastructure/tokens.js";
import { UpstreamCallRejectedEvent } from "../../domain/events/upstream-call-rejected.event.js";
import { UpstreamCallSucceededEvent } from "../../domain/events/upstream-call-succeeded.event.js";
import { InvokeUpstreamCommand } from "./invoke-upstream.command.js";
import type { InvokeUpstreamResult } from "../dto/invoke-upstream-result.dto.js";

export class ChannelHttpException extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(typeof body.error === "string" ? body.error : "channel_error");
  }
}

@CommandHandler(InvokeUpstreamCommand)
export class InvokeUpstreamHandler implements ICommandHandler<InvokeUpstreamCommand, InvokeUpstreamResult> {
  constructor(
    private readonly client: IntegrationHttpClient,
    private readonly eventBus: EventBus,
    @Inject(CHANNEL_UPSTREAM_BASE_URL) private readonly baseUrl: ChannelUpstreamBaseUrl,
  ) {}

  async execute(command: InvokeUpstreamCommand): Promise<InvokeUpstreamResult> {
    const idempotencyKey = command.idempotencyKey.toString();
    const traceId = command.trace.traceId;
    const startedAt = Date.now();

    try {
      const result = await this.client.execute({
        dependencyId: "upstream",
        method: "POST",
        url: `${this.baseUrl.replace(/\/$/, "")}/upstream/echo`,
        body: command.payload,
        idempotencyKey,
        traceContext: command.trace.toFrameworkContext(),
      });

      let upstreamPayload: Record<string, unknown>;
      try {
        upstreamPayload = JSON.parse(result.bodyText) as Record<string, unknown>;
      } catch {
        this.eventBus.publish(
          new UpstreamCallRejectedEvent(idempotencyKey, traceId, "upstream", result.status),
        );
        throw new ChannelHttpException(502, {
          ok: false,
          error: "invalid_upstream_json",
          snippet: result.bodyText.slice(0, 200),
        });
      }

      this.eventBus.publish(
        new UpstreamCallSucceededEvent(idempotencyKey, traceId, result.status, Date.now() - startedAt),
      );

      return {
        ok: true,
        upstreamStatus: result.status,
        breakerState: this.client.getBreakerState("upstream"),
        idempotencyKey,
        traceId,
        upstream: upstreamPayload,
      };
    } catch (err: unknown) {
      if (err instanceof ChannelHttpException) throw err;

      if (err instanceof CircuitOpenError) {
        this.eventBus.publish(new UpstreamCallRejectedEvent(idempotencyKey, traceId, "circuit_open"));
        throw new ChannelHttpException(503, { ok: false, error: "circuit_open", breakerState: "open" });
      }
      if (err instanceof TimeoutError) {
        this.eventBus.publish(new UpstreamCallRejectedEvent(idempotencyKey, traceId, "timeout"));
        throw new ChannelHttpException(504, { ok: false, error: "timeout" });
      }
      if (err instanceof UpstreamError) {
        this.eventBus.publish(
          new UpstreamCallRejectedEvent(idempotencyKey, traceId, "upstream", err.httpStatus),
        );
        throw new ChannelHttpException(502, {
          ok: false,
          error: "upstream",
          httpStatus: err.httpStatus,
        });
      }
      if (err instanceof BulkheadFullError) {
        this.eventBus.publish(new UpstreamCallRejectedEvent(idempotencyKey, traceId, "bulkhead_full"));
        throw new ChannelHttpException(429, { ok: false, error: "bulkhead_full" });
      }

      const message = err instanceof Error ? err.message : String(err);
      this.eventBus.publish(new UpstreamCallRejectedEvent(idempotencyKey, traceId, "unexpected"));
      throw new ChannelHttpException(502, { ok: false, error: "unexpected", message });
    }
  }
}
