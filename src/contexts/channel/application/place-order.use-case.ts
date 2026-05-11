import { Inject, Injectable } from "@nestjs/common";
import {
  createIdempotencyKey,
  idempotencyHeaderName,
} from "@assessment/integration-framework";
import type { ChannelDomainEventsSink } from "../domain/domain-events.sink.port.js";
import type { OrderPayload } from "../domain/order.types.js";
import type { IdempotencyStorePort } from "../domain/idempotency-store.port.js";
import { OrderIdempotentReplayEvent } from "../domain/events/order-idempotent-replay.event.js";
import { OrderPlacedEvent } from "../domain/events/order-placed.event.js";
import { CHANNEL_DOMAIN_EVENTS_SINK, IDEMPOTENCY_STORE } from "../infrastructure/tokens.js";

export interface PlaceOrderResult {
  statusCode: number;
  body: Record<string, unknown>;
  deduped: boolean;
}

@Injectable()
export class PlaceOrderUseCase {
  constructor(
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotency: IdempotencyStorePort,
    @Inject(CHANNEL_DOMAIN_EVENTS_SINK)
    private readonly domainEvents: ChannelDomainEventsSink,
  ) {}

  execute(idempotencyKey: string | undefined, body: OrderPayload): PlaceOrderResult {
    const key = idempotencyKey ?? createIdempotencyKey();
    const prev = this.idempotency.get(key);
    if (prev) {
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
    this.idempotency.put(key, { statusCode: payload.statusCode, body: payload.body });
    this.domainEvents.publish(
      new OrderPlacedEvent(created.id, key, body.productId, body.qty),
    );
    return payload;
  }

  idempotencyHeaderName(): string {
    return idempotencyHeaderName();
  }
}
