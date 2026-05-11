import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  createIdempotencyKey,
  idempotencyHeaderName,
} from "@assessment/integration-framework";
import type { ChannelDomainEventsSink } from "../domain/domain-events.sink.port.js";
import type { OrderPayload } from "../domain/order.types.js";
import type { IdempotencyStorePort } from "../domain/idempotency-store.port.js";
import { OrderIdempotentReplayEvent } from "../domain/events/order-idempotent-replay.event.js";
import { OrderPlacedEvent } from "../domain/events/order-placed.event.js";
import { isApplicationVerboseLogging } from "../../shared/application-verbose-log.js";
import { maskIdempotencyKey } from "../../shared/mask-idempotency-key.js";
import { CHANNEL_DOMAIN_EVENTS_SINK, IDEMPOTENCY_STORE } from "../infrastructure/tokens.js";

export interface PlaceOrderResult {
  statusCode: number;
  body: Record<string, unknown>;
  deduped: boolean;
}

@Injectable()
export class PlaceOrderUseCase {
  private readonly log = new Logger(PlaceOrderUseCase.name);

  constructor(
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotency: IdempotencyStorePort,
    @Inject(CHANNEL_DOMAIN_EVENTS_SINK)
    private readonly domainEvents: ChannelDomainEventsSink,
  ) {}

  async execute(idempotencyKey: string | undefined, body: OrderPayload): Promise<PlaceOrderResult> {
    const key = idempotencyKey ?? createIdempotencyKey();
    if (isApplicationVerboseLogging()) {
      this.log.log(
        `execute productId=${body.productId} qty=${body.qty} idempotencyKey=${maskIdempotencyKey(key)}`,
      );
    }
    const prev = await this.idempotency.get(key);
    if (prev) {
      if (isApplicationVerboseLogging()) {
        this.log.log(`replay deduped order idempotencyKey=${maskIdempotencyKey(key)}`);
      }
      const existingId = String((prev.body as { id?: string }).id ?? "unknown");
      this.domainEvents.publish(new OrderIdempotentReplayEvent(key, existingId));
      return { statusCode: 200, body: { ...prev.body, deduped: true }, deduped: true };
    }
    const created = {
      id: crypto.randomUUID(),
      ...body,
      idempotencyKey: key,
    };
    const payload: PlaceOrderResult = {
      statusCode: 201,
      body: created as Record<string, unknown>,
      deduped: false,
    };
    await this.idempotency.put(key, { statusCode: payload.statusCode, body: payload.body });
    if (isApplicationVerboseLogging()) {
      this.log.log(`placed orderId=${created.id} idempotencyKey=${maskIdempotencyKey(key)}`);
    }
    this.domainEvents.publish(
      new OrderPlacedEvent(created.id, key, body.productId, body.qty),
    );
    return payload;
  }

  idempotencyHeaderName(): string {
    return idempotencyHeaderName();
  }
}
